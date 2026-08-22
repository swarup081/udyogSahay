// export const runtime = 'edge';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendPaymentReceipt, sendSubscriptionCancel } from '@/lib/email';

export async function POST(req) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
    );

    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    
    const secretLive = process.env.RAZORPAY_WEBHOOK_SECRET_LIVE;
    const secretTest = process.env.RAZORPAY_WEBHOOK_SECRET_TEST;
    const secretGeneric = process.env.RAZORPAY_WEBHOOK_SECRET;

    const secretsToTry = [secretLive, secretTest, secretGeneric].filter(Boolean);

    if (secretsToTry.length === 0) {
      console.error('No Razorpay Webhook Secret configured (RAZORPAY_WEBHOOK_SECRET_LIVE or _TEST)');
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    // Verify Signature against any available secret
    let isValid = false;
    const encoder = new TextEncoder();
    
    for (const s of secretsToTry) {
        try {
            const key = await crypto.subtle.importKey(
              'raw', 
              encoder.encode(s),
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['sign']
            );
            const signatureBuffer = await crypto.subtle.sign(
              'HMAC',
              key,
              encoder.encode(rawBody)
            );
            const digest = Array.from(new Uint8Array(signatureBuffer))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
              
            if (digest === signature) {
                isValid = true;
                break;
            }
        } catch (e) {
            console.error('Crypto error verifying signature:', e);
        }
    }

    if (!isValid) {
      console.error('Invalid Razorpay Signature (checked against available secrets)');
      return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const { payload } = event;
    const eventName = event.event;

    console.log(`[Webhook] Razorpay Event: ${eventName}`);

    // ============================================================
    // SUBSCRIPTION EVENTS
    // ============================================================
    const SUBSCRIPTION_EVENTS = [
        'subscription.authenticated',
        'subscription.activated', 
        'subscription.charged', 
        'subscription.cancelled', 
        'subscription.completed', 
        'subscription.halted',
        'subscription.paused',
        'subscription.resumed',
        'subscription.pending'
    ];

    if (SUBSCRIPTION_EVENTS.includes(eventName)) {
      const subscription = payload.subscription.entity;
      const razorpaySubscriptionId = subscription.id;
      const razorpayPlanId = subscription.plan_id;
      const notes = subscription.notes || {};
      const userId = notes.user_id;
      const couponUsed = notes.coupon_used;

      if (!userId) {
        console.warn(`[Webhook] No user_id in subscription notes for ${eventName}, sub: ${razorpaySubscriptionId}`);
        return NextResponse.json({ received: true }); 
      }

      // --- STATUS MAPPING ---
      // DB constraint: 'active', 'canceled', 'past_due', 'paused'
      let newStatus;
      let shouldPublish = false;
      let shouldUnpublish = false;
      let cancelAtPeriodEnd = false;

      switch (eventName) {
        case 'subscription.authenticated':
        case 'subscription.activated':
        case 'subscription.charged':
          newStatus = 'active';
          shouldPublish = true;
          break;

        case 'subscription.resumed':
          newStatus = 'active';
          shouldPublish = true; // Re-publish on resume — restore everything
          break;

        case 'subscription.completed':
          // Completed = all cycles done. Keep active until current_period_end.
          // The period end date check in subscriptionUtils handles expiry.
          newStatus = 'active';
          break;

        case 'subscription.cancelled':
          // Razorpay fires this when cancel takes effect (end of period or immediate).
          // We check: if current_period_end is in the future, mark cancel_at_period_end.
          // Otherwise, immediate cancel.
          {
            const periodEnd = subscription.current_end ? new Date(subscription.current_end * 1000) : new Date();
            const now = new Date();
            if (periodEnd > now) {
              // End-of-period cancel: keep active but flag
              newStatus = 'active';
              cancelAtPeriodEnd = true;
              // Don't unpublish yet — user still has access until period ends
            } else {
              // Immediate cancel or period already ended
              newStatus = 'canceled';
              shouldUnpublish = true;
            }
          }
          break;

        case 'subscription.paused':
          newStatus = 'paused';
          shouldUnpublish = true;
          break;

        case 'subscription.halted':
          // Halted = payment failure after retries exhausted
          newStatus = 'past_due';
          shouldUnpublish = true;
          break;

        case 'subscription.pending':
          // Pending = awaiting first payment, no action needed on website
          newStatus = 'active'; // Treat as active since they're in the process
          break;

        default:
          newStatus = 'active';
      }

      // --- TIMESTAMPS ---
      const currentPeriodStart = subscription.current_start 
        ? new Date(subscription.current_start * 1000) 
        : new Date();
      const currentPeriodEnd = subscription.current_end 
        ? new Date(subscription.current_end * 1000) 
        : new Date();

      // --- FIND INTERNAL PLAN ID ---
      const { data: planData } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('razorpay_plan_id', razorpayPlanId)
        .single();
        
      const internalPlanId = planData?.id;

      // --- BUILD UPSERT PAYLOAD ---
      const upsertPayload = {
        user_id: userId,
        razorpay_subscription_id: razorpaySubscriptionId,
        status: newStatus,
        plan_id: internalPlanId || null, 
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
        metadata: {
          coupon_used: couponUsed,
          last_event: eventName,
          last_event_at: new Date().toISOString(),
          notes: notes
        }
      };

      // Clear paused_at on resume, set it on pause
      if (eventName === 'subscription.paused') {
        upsertPayload.paused_at = new Date().toISOString();
      }
      if (eventName === 'subscription.resumed') {
        upsertPayload.paused_at = null;
        upsertPayload.cancel_at_period_end = false;
      }

      // --- UPSERT SUBSCRIPTION ---
      const { error: upsertError } = await supabaseAdmin
        .from('subscriptions')
        .upsert(upsertPayload, { onConflict: 'razorpay_subscription_id' });

      if (upsertError) {
        console.error('[Webhook] DB upsert error:', upsertError);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
      }

      // --- DEACTIVATE OLD SUBSCRIPTIONS (safety net for upgrades) ---
      // On ANY activation event, ensure no other active subs exist for this user
      if (newStatus === 'active') {
        try {
          // Cancel specific old sub if noted
          if (notes?.old_subscription_id) {
            await supabaseAdmin
              .from('subscriptions')
              .update({ status: 'canceled', metadata: { superseded_by: razorpaySubscriptionId, superseded_at: new Date().toISOString() } })
              .eq('razorpay_subscription_id', notes.old_subscription_id);
            console.log(`[Webhook] Old subscription ${notes.old_subscription_id} marked canceled`);
          }
          // Also clean up any other stale active subs for same user
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'canceled', metadata: { superseded_by: razorpaySubscriptionId, superseded_at: new Date().toISOString() } })
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .neq('razorpay_subscription_id', razorpaySubscriptionId);
        } catch (e) {
          console.error('[Webhook] Failed to clean up old subscriptions:', e);
        }
      }

      // --- SEND TRANSACTIONAL EMAILS ---
      try {
        if (eventName === 'subscription.charged' || eventName === 'subscription.cancelled' || eventName === 'subscription.halted') {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (user && user.email) {
            const userEmail = user.email;
            const customerName = user.user_metadata?.full_name || user.user_metadata?.name || 'Customer';
            const planName = planData?.name || 'BizVistar Pro'; // fallback if name not selected
            
            if (eventName === 'subscription.charged') {
              const paymentEntity = payload.payment?.entity;
              const amount = paymentEntity ? (paymentEntity.amount / 100).toFixed(2) : '0.00';
              const currency = paymentEntity?.currency || 'INR';
              const invoiceId = paymentEntity?.invoice_id || paymentEntity?.id || 'N/A';
              
              await sendPaymentReceipt({
                to: userEmail,
                customerName,
                amount,
                currency,
                invoiceId,
                date: new Date().toLocaleDateString(),
                planName
              });
            } else if (eventName === 'subscription.cancelled' || eventName === 'subscription.halted') {
              await sendSubscriptionCancel({
                to: userEmail,
                customerName,
                planName,
                endDate: currentPeriodEnd.toLocaleDateString()
              });
            }
          }
        }
      } catch (emailError) {
        console.error('[Webhook] Failed to send email:', emailError);
      }

      // --- PUBLISH / UNPUBLISH WEBSITE ---
      if (shouldPublish) {
        try {
          const { data: website } = await supabaseAdmin
            .from('websites')
            .select('id, website_data, draft_data')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (website) {
            const updates = { is_published: true };
            
            // If published data is missing, copy from draft
            if (!website.website_data || (typeof website.website_data === 'object' && Object.keys(website.website_data).length === 0)) {
              updates.website_data = website.draft_data;
            }
            
            const { error: pubError } = await supabaseAdmin
              .from('websites')
              .update(updates)
              .eq('id', website.id);

            if (pubError) {
              console.error(`[Webhook] Failed to publish website for user ${userId}:`, pubError);
            } else {
              console.log(`[Webhook] Website published for user ${userId}`);
            }
          }
        } catch (webErr) {
          console.error('[Webhook] Error publishing website:', webErr);
        }
      }

      if (shouldUnpublish) {
        try {
          // IMPORTANT: Only set is_published = false
          // DO NOT delete website_data or draft_data — preserve everything for resume
          const { error: unpubError } = await supabaseAdmin
            .from('websites')
            .update({ is_published: false })
            .eq('user_id', userId);

          if (unpubError) {
            console.error(`[Webhook] Failed to unpublish website for user ${userId}:`, unpubError);
          } else {
            console.log(`[Webhook] Website unpublished for user ${userId} (data preserved)`);
          }
        } catch (webErr) {
          console.error('[Webhook] Error unpublishing website:', webErr);
        }
      }

      // --- BACKUP: Profile Sync from Notes ---
      if (userId && notes && (eventName === 'subscription.activated' || eventName === 'subscription.charged')) {
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('billing_address')
            .eq('id', userId)
            .single();
            
          if (profile && !profile.billing_address) {
            const newBilling = {
              fullName: notes.customer_name || '',
              email: notes.customer_email || '',
              phoneNumber: notes.customer_phone || '',
              address: notes.customer_address || '',
              gstNumber: notes.customer_gst || ''
            };
            await supabaseAdmin
              .from('profiles')
              .update({ 
                billing_address: newBilling,
                full_name: newBilling.fullName || undefined
              })
              .eq('id', userId);
          }
        } catch(e) { 
          console.error('[Webhook] Profile sync error:', e); 
        }
      }
    }
    
    // ============================================================
    // PAYMENT FAILED
    // ============================================================
    if (eventName === 'payment.failed') {
      const payment = payload.payment.entity;
      console.log(`[Webhook] Payment Failed: ${payment.id}, reason: ${payment.error_description}`);
      // We don't change subscription status here — Razorpay will fire 
      // subscription.halted after all retries are exhausted

      // Notify the user about the payment failure
      try {
        const notes = payment.notes || {};
        const userId = notes.user_id;
        if (userId) {
          // Find user's website to attach notification
          const { data: website } = await supabaseAdmin
            .from('websites')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

          if (website) {
            await supabaseAdmin.from('notifications').insert({
              website_id: website.id,
              type: 'payment_failed',
              title: 'Payment Failed',
              message: `Your payment could not be processed: ${payment.error_description || 'Unknown error'}. Please update your payment method to keep your website online.`,
              data: { payment_id: payment.id, error: payment.error_description },
              is_read: false
            });
            console.log(`[Webhook] Payment failure notification created for user ${userId}`);
          }
        }
      } catch (notifErr) {
        console.error('[Webhook] Failed to create payment failure notification:', notifErr);
      }
    }

    // ============================================================
    // PAYMENT DISPUTE LOST
    // ============================================================
    if (eventName === 'payment.dispute.lost') {
      const dispute = payload?.payment?.entity;
      console.log(`[Webhook] Payment Dispute Lost: ${dispute?.id}`);
      // Log for manual review — no automatic action
    }

    // ============================================================
    // REFUND PROCESSED
    // ============================================================
    if (eventName === 'refund.processed') {
      const refund = payload?.refund?.entity;
      console.log(`[Webhook] Refund Processed: ${refund?.id}, amount: ${refund?.amount}`);
      // Log for manual review — no automatic action
    }

    return NextResponse.json({ status: 'ok' });

  } catch (err) {
    console.error('[Webhook] Unhandled Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
