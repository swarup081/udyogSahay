export const revalidate = 3600; // ISR: cache sitemap for 1 hour

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export default async function sitemap() {
  const baseUrl = 'https://bizvistar.in';

  // Static pages
  const staticRoutes = [
    '',
    '/pricing',
    '/templates',
    '/templates',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  // Fetch published websites only
  const { data: websites, error } = await supabaseAdmin
    .from('websites')
    .select('site_slug, updated_at')
    .eq('is_published', true);

  if (error) {
    console.error('Error fetching websites for sitemap:', error);
  }

  // Generate dynamic routes for websites
  const dynamicRoutes = (websites || []).flatMap((site) => {
    const siteUrl = `${baseUrl}/site/${site.site_slug}`;
    const lastModified = site.updated_at || new Date().toISOString();

    return [
      {
        url: siteUrl,
        lastModified: lastModified,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${siteUrl}/shop`,
        lastModified: lastModified,
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ];
  });

  return [...staticRoutes, ...dynamicRoutes];
}
