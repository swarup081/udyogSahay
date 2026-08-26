// src/lib/templates/replaceTemplateName.js
// 
// Replaces all occurrences of a template's default brand name
// with the user's actual business name throughout the businessData object.
// This runs on initialization so every text field reflects the real brand.

// Map of template names to their default brand names (all forms used in data.js)
const TEMPLATE_DEFAULT_NAMES = {
    avenix:    { names: ['AVENIX', 'Avenix', 'avenix'] },
    aurora:    { names: ['AURORA', 'Aurora', 'aurora'] },
    blissly:   { names: ['Brewhaven', 'BREWHAVEN', 'brewhaven'] },
    flara:     { names: ['Candlea', 'CANDLEA', 'candlea'] },
    flavornest:{ names: ['FlavorNest', 'FLAVORNEST', 'flavornest', 'Flavornest'] },
    frostify:  { names: ['Sweet Delight', 'SWEET DELIGHT', 'sweet delight'] },
};

/**
 * Deep-replaces all occurrences of template default names with the business name.
 * Only replaces string values — never touches keys, numbers, booleans, arrays of non-strings, etc.
 * 
 * @param {object} data - The businessData object
 * @param {string} templateName - The template key (e.g., 'avenix')
 * @param {string} newBusinessName - The user's business name
 * @returns {object} A new object with all replacements applied
 */
export function replaceTemplateName(data, templateName, newBusinessName) {
    if (!data || !newBusinessName || !templateName) return data;
    
    const templateConfig = TEMPLATE_DEFAULT_NAMES[templateName];
    if (!templateConfig) return data;

    const defaultNames = templateConfig.names;
    
    // Build case-aware replacement pairs
    // e.g., 'AVENIX' -> 'MY BRAND' (uppercase), 'Avenix' -> 'My Brand' (titlecase)
    const replacements = defaultNames.map(defaultName => ({
        from: defaultName,
        to: matchCase(defaultName, newBusinessName)
    }));

    return deepReplace(data, replacements);
}

/**
 * Match the case pattern of the source to the target.
 * ALL CAPS source -> ALL CAPS target
 * Title Case source -> target as-is (user-provided casing)
 * lowercase source -> lowercase target
 */
function matchCase(source, target) {
    if (source === source.toUpperCase()) return target.toUpperCase();
    if (source === source.toLowerCase()) return target.toLowerCase();
    // For mixed/title case, use the business name as-is (user chose their casing)
    return target;
}

/**
 * Recursively replace strings in an object/array.
 */
function deepReplace(obj, replacements) {
    if (typeof obj === 'string') {
        // Skip URLs or image paths to avoid breaking image links
        if (
            obj.startsWith('http://') || 
            obj.startsWith('https://') || 
            obj.startsWith('/') || 
            obj.match(/\.(jpeg|jpg|gif|png|webp|svg|ico)$/i) ||
            obj.includes('cloudinary.com')
        ) {
            return obj;
        }

        let result = obj;
        for (const { from, to } of replacements) {
            // Use split+join for exact replacement (no regex escaping needed)
            result = result.split(from).join(to);
        }
        return result;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepReplace(item, replacements));
    }
    
    if (obj && typeof obj === 'object') {
        const result = {};
        for (const key of Object.keys(obj)) {
            result[key] = deepReplace(obj[key], replacements);
        }
        return result;
    }
    
    return obj; // numbers, booleans, null, undefined — pass through
}
