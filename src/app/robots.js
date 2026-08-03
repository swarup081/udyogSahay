export default function robots() {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/editor/', '/checkout/', '/preview/', '/test-skeleton/', '/templates/'],
      },
      sitemap: 'https://bizvistar.in/sitemap.xml',
    }
  }
  