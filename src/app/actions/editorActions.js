'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateUserSubscription } from './subscriptionUtils';
import { TEMPLATE_CHANGE_LIMITS, getPlanTierFromName } from '@/app/config/razorpay-config';
import { tryActivateFreeTierForUser } from './freeActivationAction';

// Helper: Re-sync products/categories from DB into website_data JSON after publish
async function resyncProductsIntoWebsiteData(supabaseAdmin, websiteId) {
  try {
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('id, name, price, category_id, description, image_url, stock, additional_images, variants')
        .eq('website_id', websiteId)
        .order('id', { ascending: false }),
      supabaseAdmin
        .from('categories')
        .select('id, name')
        .eq('website_id', websiteId)
    ]);

    const { data: website } = await supabaseAdmin
      .from('websites')
      .select('website_data')
      .eq('id', websiteId)
      .single();

    if (!website) return;

    const currentData = website.website_data || {};

    const mappedProducts = (products || []).map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category_id ? String(p.category_id) : 'uncategorized',
      description: p.description,
      image: p.image_url,
      stock: p.stock,
      additional_images: p.additional_images || [],
      variants: p.variants || []
    }));

    const mappedCategories = (categories || []).map(c => ({
      id: String(c.id),
      name: c.name
    }));

    const newData = {
      ...currentData,
      allProducts: mappedProducts,
      categories: mappedCategories
    };

    await supabaseAdmin
      .from('websites')
      .update({ website_data: newData })
      .eq('id', websiteId);
  } catch (err) {
    console.error('resyncProductsIntoWebsiteData error:', err);
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to get authenticated user ID
async function getUserId() {
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

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return user.id;
}

// Action: Save Draft
export async function saveDraft(websiteId, draftData) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const { error: verifyError } = await supabaseAdmin
      .from('websites')
      .select('id')
      .eq('id', websiteId)
      .eq('user_id', userId)
      .single();

    if (verifyError) throw new Error('Unauthorized access to website.');

    const { error } = await supabaseAdmin
      .from('websites')
      .update({ draft_data: draftData, updated_at: new Date() })
      .eq('id', websiteId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Save Draft Error:', error);
    return { success: false, error: error.message };
  }
}

// Helper: Get user's plan tier from their subscription
async function getUserPlanTier(userId) {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('plan:plans ( name )')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription?.plan?.name) return 'starter';
  return getPlanTierFromName(subscription.plan.name);
}

// Action: Check if user's subscription is active (lightweight check for editor UI)
export async function getSubscriptionStatus() {
  try {
    const userId = await getUserId();
    const planTier = await getUserPlanTier(userId);
    
    // Check if user has ANY active subscription
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    return { 
      hasActiveSubscription: !!sub, 
      planTier 
    };
  } catch {
    return { hasActiveSubscription: false, planTier: 'starter' };
  }
}

// Action: Check template change allowance for the user
export async function checkTemplateChangeAllowance() {
  try {
    const userId = await getUserId();
    const planTier = await getUserPlanTier(userId);
    const limit = TEMPLATE_CHANGE_LIMITS[planTier];

    // Unlimited
    if (limit === -1) {
      return { allowed: true, planTier, reason: null };
    }

    // Not allowed at all (Starter)
    if (limit === 0) {
      return { allowed: false, planTier, reason: 'Upgrade to Pro or Growth to change templates.' };
    }

    // Pro: check 30-day rolling window
    // Find the currently published website's last_template_change_at
    // Note: Column may not exist yet — treat missing column as "allowed"
    try {
      const { data: publishedSite, error: colError } = await supabaseAdmin
        .from('websites')
        .select('last_template_change_at')
        .eq('user_id', userId)
        .eq('is_published', true)
        .limit(1)
        .maybeSingle();

      // If column doesn't exist, skip the check (allow change)
      if (colError && colError.message?.includes('last_template_change_at')) {
        return { allowed: true, planTier, reason: null };
      }

      if (publishedSite?.last_template_change_at) {
        const lastChange = new Date(publishedSite.last_template_change_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        if (lastChange > thirtyDaysAgo) {
          const nextAllowed = new Date(lastChange.getTime() + 30 * 24 * 60 * 60 * 1000);
          const daysLeft = Math.ceil((nextAllowed - Date.now()) / (24 * 60 * 60 * 1000));
          return { 
            allowed: false, 
            planTier, 
            reason: `You can change templates again in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade to Growth for unlimited changes.` 
          };
        }
      }
    } catch {
      // Column doesn't exist or other error — allow the change
    }

    return { allowed: true, planTier, reason: null };
  } catch (error) {
    console.error('checkTemplateChangeAllowance error:', error);
    return { allowed: false, planTier: 'starter', reason: 'Unable to verify plan. Please try again.' };
  }
}

// Action: Load website draft data (for standalone editor that needs DB data)
export async function getWebsiteDraft(websiteId) {
  try {
    const userId = await getUserId();

    const { data: website, error } = await supabaseAdmin
      .from('websites')
      .select('id, draft_data, website_data, template_id, is_published, site_slug')
      .eq('id', websiteId)
      .eq('user_id', userId)
      .single();

    if (error || !website) return { success: false, error: 'Website not found.' };

    return { 
      success: true, 
      data: website.draft_data || website.website_data || null,
      templateId: website.template_id,
      isPublished: website.is_published,
      siteSlug: website.site_slug
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Action: Publish Website
// NOTE: No longer accepts currentData param — reads from DB draft_data to avoid
// exceeding Next.js 1MB Server Action body limit.
// ENFORCES: Only 1 website can be published at a time per user.
// ENFORCES: Template change limits per plan tier.
export async function publishWebsite(websiteId) {
  try {
    const userId = await getUserId();

    // 1. Verify ownership
    const { data: website, error: verifyError } = await supabaseAdmin
        .from('websites')
        .select('id, draft_data, website_data, is_published, template_id')
        .eq('id', websiteId)
        .eq('user_id', userId)
        .single();
    
    if (verifyError || !website) throw new Error('Unauthorized access or website not found.');

    // 2. Check Subscription
    const { data: anyPublished } = await supabaseAdmin
        .from('websites')
        .select('id, template_id')
        .eq('user_id', userId)
        .eq('is_published', true)
        .limit(1)
        .maybeSingle();

    if (!anyPublished) {
        try {
            await validateUserSubscription(userId);
        } catch (subError) {
            // No active subscription — try auto-activating free tier for first-time users
            const freeResult = await tryActivateFreeTierForUser(userId);
            if (!freeResult.success) {
                // Not a first-time user (had prior subs) — require payment
                return { success: false, error: 'PAYMENT_REQUIRED', message: subError.message };
            }
            // Free tier activated successfully, continue with publish
        }
    }

    // 3. TEMPLATE CHANGE CHECK: If publishing a different template than currently published
    const isTemplateChange = anyPublished && anyPublished.template_id !== website.template_id;
    
    if (isTemplateChange) {
      const allowance = await checkTemplateChangeAllowance();
      if (!allowance.allowed) {
        return { 
          success: false, 
          error: 'TEMPLATE_CHANGE_BLOCKED', 
          message: allowance.reason 
        };
      }
    }

    // 4. ENFORCE SINGLE-PUBLISH: Unpublish all OTHER websites owned by this user
    await supabaseAdmin
        .from('websites')
        .update({ is_published: false })
        .eq('user_id', userId)
        .neq('id', websiteId);

    // 5. Publish from draft_data or existing website_data
    const dataToPublish = website.draft_data || website.website_data;
    
    if (!dataToPublish) {
        return { success: false, error: 'No data to publish.' };
    }

    const updatePayload = { 
        website_data: dataToPublish, 
        is_published: true,
        draft_data: null,
        updated_at: new Date()
    };

    const { error: updateError } = await supabaseAdmin
        .from('websites')
        .update(updatePayload)
        .eq('id', websiteId);

    if (updateError) throw updateError;

    // Record template change timestamp separately (column may not exist yet)
    if (isTemplateChange) {
      try {
        await supabaseAdmin
          .from('websites')
          .update({ last_template_change_at: new Date() })
          .eq('id', websiteId);
      } catch {
        // Column doesn't exist yet — silently skip. Template change still succeeds.
        console.warn('last_template_change_at column not found — skipping timestamp update.');
      }
    }

    // 6. Re-sync products/categories from DB into the published website_data
    await resyncProductsIntoWebsiteData(supabaseAdmin, websiteId);

    // 7. Bust ISR cache so the live site reflects changes immediately
    try {
      const { data: siteForSlug } = await supabaseAdmin
        .from('websites')
        .select('site_slug')
        .eq('id', websiteId)
        .single();
      if (siteForSlug?.site_slug) {
        revalidatePath(`/site/${siteForSlug.site_slug}`, 'layout');
      }
    } catch (e) {
      console.warn('Revalidation skipped:', e.message);
    }

    return { success: true };

  } catch (error) {
    console.error('Publish Error:', error);
    return { success: false, error: error.message };
  }
}

// Action: Unpublish Website (take it offline but keep data)
export async function unpublishWebsite(websiteId) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const { error: verifyError } = await supabaseAdmin
        .from('websites')
        .select('id')
        .eq('id', websiteId)
        .eq('user_id', userId)
        .single();

    if (verifyError) throw new Error('Unauthorized access to website.');

    const { error } = await supabaseAdmin
        .from('websites')
        .update({ is_published: false, updated_at: new Date() })
        .eq('id', websiteId);

    if (error) throw error;

    // Bust ISR cache so the live site goes offline immediately
    try {
      const { data: siteForSlug } = await supabaseAdmin
        .from('websites')
        .select('site_slug')
        .eq('id', websiteId)
        .single();
      if (siteForSlug?.site_slug) {
        revalidatePath(`/site/${siteForSlug.site_slug}`, 'layout');
      }
    } catch (e) {
      console.warn('Revalidation skipped:', e.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Unpublish Error:', error);
    return { success: false, error: error.message };
  }
}


// Action: Revert to Published (Restart)
export async function revertToPublished(websiteId) {
    try {
        const userId = await getUserId();

        // 1. Verify ownership and get published data
        const { data: website, error: verifyError } = await supabaseAdmin
            .from('websites')
            .select('website_data')
            .eq('id', websiteId)
            .eq('user_id', userId)
            .single();

        if (verifyError || !website) throw new Error('Unauthorized or website not found.');

        // 2. Clear draft_data so next load uses website_data
        const { error: updateError } = await supabaseAdmin
            .from('websites')
            .update({ draft_data: null }) 
            .eq('id', websiteId);

        if (updateError) throw updateError;

        return { success: true, data: website.website_data };

    } catch (error) {
        console.error('Revert Error:', error);
        return { success: false, error: error.message };
    }
}
