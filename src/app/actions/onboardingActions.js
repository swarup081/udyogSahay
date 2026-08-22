'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { jsonCompletion, deepMerge, stripImageFields, restoreImageFields, AI_MODELS } from '@/lib/ai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function verifyWebsiteOwnership(websiteId) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch(e) {} } } }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false };

    const { data, error } = await supabaseAdmin
        .from('websites')
        .select('id')
        .eq('id', websiteId)
        .eq('user_id', user.id)
        .limit(1)
        .single();
        
    if (error || !data) return { success: false };
    return { success: true };
}

// --- HELPER: Get Current Website ID ---
async function getWebsiteId() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: Please sign in.');
  }

  // Fetch website ID for this user — prefer published, fall back to most recent
  const { data: publishedSite } = await supabaseAdmin
    .from('websites')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle();

  if (publishedSite) return publishedSite.id;

  // No published site — get the most recent one
  const { data: latestSite } = await supabaseAdmin
    .from('websites')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSite) return latestSite.id;
  throw new Error('No website found for this user.');
}

// --- HELPER: Sync Website Data ---
async function syncWebsiteData(websiteId) {
    try {
        const { data: products } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('website_id', websiteId)
          .order('id'); 
    
        const { data: website } = await supabaseAdmin
          .from('websites')
          .select('website_data')
          .eq('id', websiteId)
          .single();
    
        if (!website) return;
    
        const currentData = website.website_data || {};
        
        const mappedProducts = products ? products.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category_id ? String(p.category_id) : 'uncategorized',
            description: p.description,
            image: p.image_url,
            stock: p.stock
        })) : [];
    
        const newData = {
            ...currentData,
            allProducts: mappedProducts,
        };
    
        await supabaseAdmin
          .from('websites')
          .update({ website_data: newData })
          .eq('id', websiteId);
          
    } catch (err) {
        console.error("Sync Error:", err);
    }
}


// --- ACTION: Get Onboarding Status ---
export async function getOnboardingStatus() {
  try {
    const websiteId = await getWebsiteId();
    if (!websiteId) return { error: 'No website found' };

    // 1. Fetch Website Data (for pre-fill)
    const { data: website } = await supabaseAdmin
      .from('websites')
      .select('website_data, site_slug')
      .eq('id', websiteId)
      .single();

    // 2. Fetch Onboarding Data
    let { data: onboarding, error } = await supabaseAdmin
      .from('onboarding_data')
      .select('*')
      .eq('website_id', websiteId)
      .single();

    if (error && error.code === 'PGRST116') {
       // Create if missing
       const { data: newOnboarding, error: createError } = await supabaseAdmin
         .from('onboarding_data')
         .insert({ website_id: websiteId })
         .select()
         .single();
         
       if (createError) {
           console.error("Failed to create onboarding record:", createError);
           // Fallback to memory object if DB fails (e.g. table missing)
           onboarding = { website_id: websiteId, is_completed: false };
       } else {
           onboarding = newOnboarding;
       }
    }

    return {
      success: true,
      isCompleted: onboarding?.is_completed || false,
      data: onboarding,
      websiteData: website?.website_data || {},
      websiteId
    };

  } catch (err) {
    console.error('getOnboardingStatus Error:', err);
    return { success: false, error: err.message };
  }
}

// --- ACTION: Upload Logo ---
export async function uploadLogo(formData) {
  try {
    const file = formData.get('file');
    const websiteId = await getWebsiteId();
    
    if (!file || !websiteId) throw new Error("Invalid upload");

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`Image too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`);
    }

    // Upload to Cloudinary
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `bizvistar/logos`,
          resource_type: 'image',
          quality: 'auto',
          format: 'auto',
          transformation: [
            { width: 800, height: 800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return { success: true, url: uploadResult.secure_url };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// --- ACTION: Save Business Info ---
export async function saveBusinessInfo(data) {
  try {
    const websiteId = await getWebsiteId();
    const { name, ownerName, instagram, facebook, logoUrl, whatsappNumber } = data;

    // 1. Update Onboarding Data
    const { error: onboardingError } = await supabaseAdmin
      .from('onboarding_data')
      .update({
        owner_name: ownerName,
        social_instagram: instagram,
        social_facebook: facebook,
        logo_url: logoUrl,
        whatsapp_number: whatsappNumber
      })
      .eq('website_id', websiteId);

    if (onboardingError) throw onboardingError;

    // 2. Update Website Data (Live Preview)
    const { data: website } = await supabaseAdmin
      .from('websites')
      .select('website_data')
      .eq('id', websiteId)
      .single();

    const currentData = website?.website_data || {};
    const oldName = currentData.logoText || currentData.name || '';

    // Deep find-and-replace: swap old business name for new one across all
    // text content so sections like "ABOUT AVENIX" become "ABOUT MyShop".
    const SKIP_KEYS = new Set([
      'image', 'image1', 'image2', 'imageUrl', 'logo', 'logoUrl', 'url',
      'href', 'src', 'icon', 'link', 'madeByLink', 'id', 'category',
      'colorPalette', 'platform', 'type', 'path', 'accentColor',
      'buttonColor', 'mode', 'upiId',
    ]);

    const deepReplace = (obj, from, to) => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(v => deepReplace(v, from, to));
      const result = {};
      for (const [key, val] of Object.entries(obj)) {
        if (typeof val === 'string' && !SKIP_KEYS.has(key) && from) {
          const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          result[key] = val.replace(regex, (match) => {
            if (match === match.toUpperCase()) return to.toUpperCase();
            return to;
          });
        } else if (typeof val === 'object' && val !== null) {
          result[key] = deepReplace(val, from, to);
        } else {
          result[key] = val;
        }
      }
      return result;
    };

    // Apply deep replacement if old name is meaningful
    const baseData = oldName && oldName.length > 1 && name ? deepReplace(currentData, oldName, name) : currentData;
    
    // Merge updates
    const newData = {
        ...baseData,
        name: name || baseData.name,
        logoText: name || baseData.logoText,
        whatsappNumber: whatsappNumber || baseData.whatsappNumber,
        footer: {
            ...baseData.footer,
            logo: name ? name.toUpperCase() : baseData.footer?.logo,
            socials: [
                { platform: 'Instagram', url: instagram || '' },
                { platform: 'Facebook', url: facebook || '' },
                ...(baseData.footer?.socials || []).filter(s => s.platform !== 'Instagram' && s.platform !== 'Facebook')
            ]
        },
        hero: {
            ...baseData.hero,
            logo: logoUrl || baseData.hero?.logo
        }
    };
    
    // Also update logo in global settings if exists
    if (logoUrl) {
        newData.logo = logoUrl;
    }

    await supabaseAdmin
      .from('websites')
      .update({ website_data: newData })
      .eq('id', websiteId);

    return { success: true };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// --- ACTION: Save Product (Wizard) ---
export async function saveWizardProduct(productData) {
    try {
        const websiteId = await getWebsiteId();
        
        // 1. Check Limit (10)
        const { count, error: countError } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('website_id', websiteId);

        if (countError) throw countError;
        if (count >= 10) {
            return { success: false, error: 'Product limit reached (Max 10).' };
        }

        // 2. Insert
        const { data, error: insertError } = await supabaseAdmin
            .from('products')
            .insert({
                website_id: websiteId,
                name: productData.name,
                price: parseFloat(productData.price),
                description: productData.description,
                image_url: productData.imageUrl,
                stock: -1 // Default unlimited for wizard
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 3. Sync
        await syncWebsiteData(websiteId);

        return { success: true, product: data };

    } catch (err) {
        return { success: false, error: err.message };
    }
}

// --- ACTION: Delete Product (Wizard) ---
export async function deleteWizardProduct(productId) {
    try {
        const websiteId = await getWebsiteId();
        
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('website_id', websiteId);

        if (error) throw error;

        await syncWebsiteData(websiteId);

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// --- ACTION: Save Payment Info ---
export async function savePaymentInfo(data) {
    try {
        const websiteId = await getWebsiteId();
        const { upiId, isCodOnly } = data;

        // 1. Update Onboarding Data
        await supabaseAdmin
            .from('onboarding_data')
            .update({ upi_id: isCodOnly ? null : upiId })
            .eq('website_id', websiteId);

        // 2. Update Website Data (Disclaimer)
        const { data: website } = await supabaseAdmin
            .from('websites')
            .select('website_data')
            .eq('id', websiteId)
            .single();

        const currentData = website?.website_data || {};
        
        let disclaimer = "";
        if (isCodOnly) {
            disclaimer = "Note: Since we cannot redirect users to a payment gateway, you are responsible for collecting payment upon delivery. Please ensure you have a process in place to settle these transactions.";
        } else {
            disclaimer = "Please note: Payments are processed directly between you and your customer. We do not facilitate transactions or charge commissions. You are responsible for verifying all payments received.";
        }

        // Inject into footer description or create a new field
        const newData = {
            ...currentData,
            footer: {
                ...currentData.footer,
                paymentDisclaimer: disclaimer, // New field we can render in template
                description: currentData.footer?.description ? `${currentData.footer.description}\n\n${disclaimer}` : disclaimer
            },
            payment: {
                upiId: isCodOnly ? '' : upiId,
                mode: isCodOnly ? 'COD' : 'UPI'
            }
        };

        await supabaseAdmin
            .from('websites')
            .update({ website_data: newData })
            .eq('id', websiteId);

        return { success: true };

    } catch (err) {
        return { success: false, error: err.message };
    }
}

// --- ACTION: Generate AI Content ---
export async function generateAIContent(description, templateName = null) {
    try {
        const websiteId = await getWebsiteId();
        
        const { data: website } = await supabaseAdmin
            .from('websites')
            .select('website_data, draft_data')
            .eq('id', websiteId)
            .single();

        // Always prioritize draft_data since AI generation happens in the editor before publishing
        const currentData = website?.draft_data || website?.website_data || {};

        // Step 1: Strip all image/URL fields so AI never sees them
        const { stripped, imageMap } = stripImageFields(currentData);

        // Step 2: Build prompt with cleaned data (no image URLs to corrupt)
        const prompt = `
You are a professional website copywriter.
I have a website data JSON structure for a business described as: "${description}".

Your task is to update ONLY the text content across all sections to match this brand voice and industry.

${templateName ? `IMPORTANT: The current template is "${templateName}". Only update fields relevant to this template structure. Do NOT invent new fields.` : ''}

Sections to Update (text fields only):
- Hero (title, subtitle, cta)
- About (title, text, story)
- Features (titles, descriptions)
- FAQ (questions, answers) - Make them relevant to the business type.
- Testimonials (quotes, author names) - Reflect happy customers.
- Menu/Collections/Specialties (section titles, descriptions)
- CTA Sections (titles, text)
- Footer (description)

Strict Rules:
1. Return ONLY valid JSON matching the EXACT structure of the input.
2. Fields marked "[IMAGE - DO NOT MODIFY]", "[URL - DO NOT MODIFY]", or "[PRESERVED - DO NOT MODIFY]" must be returned EXACTLY as-is, unchanged.
3. Only update string values that contain human-readable text content.
4. Do NOT add or remove any keys. Keep the exact same structure.
5. For FAQ/Testimonials: use broad, positive language. Do NOT invent specific numbers or policies.
6. Match the tone to the business type (playful for bakery, elegant for jewelry, etc).

Current JSON:
${JSON.stringify(stripped)}
        `.trim();

        // Step 3: Call AI using centralized framework (gpt-4o-mini)
        const { success, data: newContent, error } = await jsonCompletion({
            prompt,
            temperature: 0.7,
            maxTokens: 4000,
            retries: 1,
        });

        if (!success || !newContent) {
            throw new Error(error || 'AI content generation failed');
        }

        // Step 4: Deep merge (preserves nested objects like hero, about, footer)
        const mergedData = deepMerge(currentData, newContent);

        // Step 5: Force-restore all original images/URLs (final safety net)
        const finalData = restoreImageFields(mergedData, imageMap);

        // Update draft_data so it reflects in the editor until the user explicitly publishes
        await supabaseAdmin
            .from('websites')
            .update({ draft_data: finalData })
            .eq('id', websiteId);

        return { success: true, data: finalData };

    } catch (err) {
        console.error("AI Generation Error:", err);
        return { success: false, error: err.message };
    }
}

// --- ACTION: Complete Onboarding ---
export async function completeOnboarding() {
    try {
        const websiteId = await getWebsiteId();
        await supabaseAdmin
            .from('onboarding_data')
            .update({ is_completed: true })
            .eq('website_id', websiteId);
            
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
