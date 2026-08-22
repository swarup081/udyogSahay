/**
 * Computes the basePath for template navigation links.
 *
 * Handles three modes:
 * 1. Live site via /site/[slug]  → basePath = "/site/slug"
 * 2. Subdomain via abc.bizvistar.in → basePath = "" (root)
 * 3. Editor/Preview → basePath = "/templates/templateName"
 */
export function getBasePath(templateName, serverData, pathname) {
    // Default: editor/preview mode
    let basePath = `/templates/${templateName}`;

    if (serverData && typeof window !== 'undefined') {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const subdomainCookie = cookies.find(c => c.startsWith('x-subdomain='));
        
        if (subdomainCookie) {
            // Subdomain mode: abc.bizvistar.in → use root path
            return '';
        }
    }

    if (serverData && pathname && pathname.startsWith('/site/')) {
        // Direct access: bizvistar.in/site/slug
        const parts = pathname.split('/');
        if (parts.length >= 3) {
            basePath = `/${parts[1]}/${parts[2]}`;
        }
    }

    return basePath;
}
