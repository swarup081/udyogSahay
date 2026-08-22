'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Razorpay from 'razorpay';
import { getKeyId, getRazorpayMode } from '../config/razorpay-config';

// Admin client for DB updates (bypassing RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// Helper to get authenticated user
async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function verifyAndPublishUserSite(websiteId, fallbackSubscriptionId = null) {
  try {
    const user = await getUser();
    if (!user) {
        console.error("verifyAndPublishUserSite: No user found.");
        return { success: false, error: "Unauthorized" };
    }

    console.log(`[PublishAction] Verifying subscription for user ${user.id}...`);

    let isSubscriptionValid = false;

    // 1. Check DB for Valid Subscription
    const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscription) {
        const now = new Date();
        const end = new Date(subscription.current_period_end);
        if (now <= end) {
            isSubscriptionValid = true;
        } else {
            console.warn("[PublishAction] DB Subscription expired.");
        }
    }

    // 2. Fallback: Check Razorpay directly if DB check failed and we have an ID
    if (!isSubscriptionValid && fallbackSubscriptionId) {
        console.log(`[PublishAction] DB check failed. Checking Razorpay API for sub ${fallbackSubscriptionId}...`);
        try {
            const keyId = getKeyId();
            const mode = getRazorpayMode();
            const keySecret = mode === 'live' ? process.env.RAZORPAY_LIVE_KEY_SECRET : process.env.RAZORPAY_TEST_KEY_SECRET;
            
            if (keyId && keySecret) {
                const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
                const rzpSub = await rzp.subscriptions.fetch(fallbackSubscriptionId);
                
                if (rzpSub.status === 'active') {
                    console.log("[PublishAction] Razorpay confirms ACTIVE status. Forcing publish.");
                    isSubscriptionValid = true;
                    
                    // OPTIONAL: Update DB here to fix the gap immediately
                    // We map Razorpay Unix timestamps to ISO strings
                    const currentPeriodStart = new Date(rzpSub.current_start * 1000).toISOString();
                    const currentPeriodEnd = new Date(rzpSub.current_end * 1000).toISOString();
                    
                    await supabaseAdmin.from('subscriptions').upsert({
                        razorpay_subscription_id: rzpSub.id,
                        user_id: user.id,
                        status: 'active',
                        plan_id: null, // We might not know internal plan ID here easily, fine to leave null or fix later
                        current_period_start: currentPeriodStart,
                        current_period_end: currentPeriodEnd,
                        metadata: { source: 'fallback_verification' }
                    }, { onConflict: 'razorpay_subscription_id' });
                } else {
                    console.warn(`[PublishAction] Razorpay status is ${rzpSub.status}`);
                }
            }
        } catch (rzpError) {
            console.error("[PublishAction] Razorpay API check failed:", rzpError);
        }
    }

    if (!isSubscriptionValid) {
        return { success: false, error: "No active subscription verified." };
    }

    // 3. Publish Website
    let query = supabaseAdmin
        .from('websites')
        .select('id, draft_data, is_published')
        .eq('user_id', user.id);
        
    if (websiteId) {
        query = query.eq('id', websiteId);
    } else {
        query = query.order('updated_at', { ascending: false });
    }

    const { data: websites, error: webError } = await query;

    if (webError || !websites || websites.length === 0) {
        console.error("[PublishAction] Website not found:", webError);
        return { success: false, error: "Website not found." };
    }

    // Pick the most recent (or specifically requested) website to publish
    const website = websites[0];

    if (website.is_published) {
        return { success: true, message: "Already published." };
    }

    // ENFORCE SINGLE-PUBLISH: Unpublish all other websites
    const otherIds = websites.filter(w => w.id !== website.id).map(w => w.id);
    if (otherIds.length > 0) {
        await supabaseAdmin
            .from('websites')
            .update({ is_published: false })
            .in('id', otherIds);
    }

    const updatePayload = { is_published: true };
    if (website.draft_data && Object.keys(website.draft_data).length > 0) {
        updatePayload.website_data = website.draft_data;
    }

    const { error: updateError } = await supabaseAdmin
        .from('websites')
        .update(updatePayload)
        .eq('id', website.id);

    if (updateError) {
        console.error("[PublishAction] Update failed:", updateError);
        return { success: false, error: "Failed to publish website." };
    }

    console.log("[PublishAction] Website published successfully via fallback action.");
    return { success: true };

  } catch (err) {
    console.error("[PublishAction] Unexpected error:", err);
    return { success: false, error: err.message };
  }
}
