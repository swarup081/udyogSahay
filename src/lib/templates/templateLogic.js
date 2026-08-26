// src/lib/templates/templateLogic.js

/**
 * Shared logic for selecting "Landing Page" items (Collection/Featured).
 */
export const getLandingItems = (businessData, requiredCount = 3) => {
    if (!businessData) return [];

    const settings = businessData.landing_settings || { mode: 'auto', manualItems: [], prioritizedProducts: [] };
    const allProducts = businessData.allProducts || [];
    const allCategories = businessData.categories || [];

    // MANUAL MODE
    if (settings.mode === 'manual') {
        return (settings.manualItems || []).slice(0, requiredCount).map(item => {
            if (item.type === 'product') {
                 const p = allProducts.find(x => String(x.id) === String(item.id));
                 return p ? { ...p, type: 'product', image: p.image || p.image_url } : null;
            } else {
                 const c = allCategories.find(x => String(x.id) === String(item.id));
                 return c ? { ...c, type: 'category', image: c.image || null } : null;
            }
        }).filter(Boolean);
    }

    // AUTO MODE — Solid architecture:
    // Priority: Pinned products → In-stock products (diverse categories) → Categories → fill
    // Rule: ALWAYS show products if any exist. Never let categories consume all slots.
    // Rule: Exclude OOS products when in-stock alternatives are available.
    
    let finalItems = [];
    const usedImages = new Set(); 
    const usedProductIds = new Set();
    const usedCategoryIds = new Set();
    const prioritizedIds = (settings.prioritizedProducts || []).map(String);

    const isImageUsed = (url) => url ? usedImages.has(url) : false;

    const addProductItem = (p) => {
        if (finalItems.length >= requiredCount) return false;
        if (usedProductIds.has(String(p.id))) return false;
        const img = p.image || p.image_url;
        if (img && isImageUsed(img)) return false;
        
        if (img) usedImages.add(img);
        usedProductIds.add(String(p.id));
        finalItems.push({ ...p, type: 'product', image: img });
        return true;
    };

    const addCategoryItem = (cat) => {
        if (finalItems.length >= requiredCount) return false;
        if (usedCategoryIds.has(String(cat.id))) return false;
        
        // Find a representative image from products in this category
        const catProducts = allProducts.filter(p => String(p.category) === String(cat.id));
        let displayImage = cat.image;
        
        if (!displayImage || isImageUsed(displayImage)) {
            // Find a product image that isn't used and isn't a high-value product
            const altProduct = catProducts
                .filter(p => {
                    const img = p.image || p.image_url;
                    return img && !isImageUsed(img) && !usedProductIds.has(String(p.id));
                })
                .sort((a, b) => (b.sales || 0) - (a.sales || 0))[0];
            
            if (altProduct) {
                displayImage = altProduct.image || altProduct.image_url;
            }
        }
        
        if (displayImage) usedImages.add(displayImage);
        usedCategoryIds.add(String(cat.id));
        finalItems.push({ ...cat, type: 'category', image: displayImage });
        return true;
    };

    // Separate in-stock and OOS products
    const inStockProducts = allProducts.filter(p => p.stock === -1 || p.stock > 0);
    const hasInStockProducts = inStockProducts.length > 0;

    // === STEP 1: Pinned products (in-stock only) ===
    const pinnedItems = prioritizedIds
        .map(id => allProducts.find(p => String(p.id) === id))
        .filter(Boolean)
        .filter(p => p.stock === -1 || p.stock > 0)
        .sort((a, b) => {
            const imgA = a.image || a.image_url;
            const imgB = b.image || b.image_url;
            if (!!imgA !== !!imgB) return !!imgB - !!imgA;
            return (b.sales || 0) - (a.sales || 0);
        });
    
    for (const p of pinnedItems) {
        addProductItem(p);
        if (finalItems.length >= requiredCount) return finalItems;
    }

    // === STEP 2: Smart product selection — diverse across categories ===
    // Pick one top product from each category (round-robin) to ensure variety
    if (hasInStockProducts) {
        const categorizedProducts = {};
        for (const p of inStockProducts) {
            if (usedProductIds.has(String(p.id))) continue;
            const catId = String(p.category || 'uncategorized');
            if (!categorizedProducts[catId]) categorizedProducts[catId] = [];
            categorizedProducts[catId].push(p);
        }
        
        // Sort each category's products by sales (best first)
        for (const catId of Object.keys(categorizedProducts)) {
            categorizedProducts[catId].sort((a, b) => {
                const imgA = a.image || a.image_url;
                const imgB = b.image || b.image_url;
                if (!!imgA !== !!imgB) return !!imgB - !!imgA;
                return (b.sales || 0) - (a.sales || 0);
            });
        }

        // Round-robin pick from each category
        const catIds = Object.keys(categorizedProducts).sort((a, b) => {
            // Sort categories by their top product's sales
            const topA = categorizedProducts[a][0];
            const topB = categorizedProducts[b][0];
            return (topB?.sales || 0) - (topA?.sales || 0);
        });

        let round = 0;
        let added = true;
        while (finalItems.length < requiredCount && added) {
            added = false;
            for (const catId of catIds) {
                if (finalItems.length >= requiredCount) break;
                const products = categorizedProducts[catId];
                if (round < products.length) {
                    if (addProductItem(products[round])) {
                        added = true;
                    }
                }
            }
            round++;
        }
    }

    if (finalItems.length >= requiredCount) return finalItems;

    // === STEP 3: Fill remaining with categories (if products don't fill all slots) ===
    const sortedCats = [...allCategories].sort((a, b) => {
        if (!!a.image !== !!b.image) return !!b.image - !!a.image;
        return (b.sales || 0) - (a.sales || 0);
    });

    for (const cat of sortedCats) {
        if (finalItems.length >= requiredCount) break;
        addCategoryItem(cat);
    }

    // === STEP 4: If still short, add remaining in-stock products ===
    if (finalItems.length < requiredCount) {
        const remaining = inStockProducts
            .filter(p => !usedProductIds.has(String(p.id)))
            .sort((a, b) => (b.sales || 0) - (a.sales || 0));
        
        for (const p of remaining) {
            if (finalItems.length >= requiredCount) break;
            addProductItem(p);
        }
    }

    return finalItems.slice(0, requiredCount);
};

export const getBestSellerItems = (businessData, requiredCount = 4) => {
    if (!businessData) return [];
    
    const settings = businessData.landing_settings || { prioritizedProducts: [] };
    const allProducts = businessData.allProducts || [];
    const prioritizedIds = (settings.prioritizedProducts || []).map(String);
    let finalItems = [];
    const usedIds = new Set();
    const usedImages = new Set();

    const addItem = (p, isOOS = false) => {
        if (finalItems.length >= requiredCount) return;
        if (usedIds.has(String(p.id))) return;
        
        const img = p.image || p.image_url;
        if (img && usedImages.has(img)) return;

        if (img) usedImages.add(img);
        usedIds.add(String(p.id));
        finalItems.push({ ...p, isOOS, image: img });
    };

    // 1. Pinned
    const pinnedItems = prioritizedIds
        .map(id => allProducts.find(p => String(p.id) === id))
        .filter(Boolean);
    
    // Filter out OOS from pinned
    pinnedItems.forEach(p => {
        if (p.stock === -1 || p.stock > 0) {
            addItem(p);
        }
    });

    if (finalItems.length >= requiredCount) return finalItems;

    // 2. Best Sellers
    const available = allProducts
        .filter(p => !usedIds.has(String(p.id)))
        .filter(p => (p.stock === -1 || p.stock > 0))
        .sort((a, b) => {
             const imgA = a.image || a.image_url;
             const imgB = b.image || b.image_url;
             if (!!imgA !== !!imgB) return !!imgB - !!imgA;
             return (b.sales || 0) - (a.sales || 0);
        });

    available.forEach(p => addItem(p));

    // 3. OOS - REMOVED per user request
    /*
    if (finalItems.length < requiredCount) {
        const oos = allProducts
            .filter(p => !usedIds.has(String(p.id)))
            .filter(p => p.stock !== -1 && p.stock <= 0)
            .sort((a, b) => (b.sales || 0) - (a.sales || 0));
        
        oos.forEach(p => addItem(p, true));
    }
    */

    return finalItems.slice(0, requiredCount);
};

export const getSimilarProducts = (currentProduct, allProducts, requiredCount = 4) => {
    if (!currentProduct || !allProducts) return [];

    const currentId = String(currentProduct.id);
    const categoryId = String(currentProduct.category || currentProduct.category_id);

    let candidates = allProducts.filter(p => String(p.id) !== currentId);

    const scored = candidates.map(p => {
        let score = 0;
        if (String(p.category || p.category_id) === categoryId) score += 100;
        if (p.image || p.image_url) score += 50;
        if (p.stock === -1 || p.stock > 0) score += 20;
        score += (p.sales || 0);
        return { ...p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, requiredCount).map(p => ({
        ...p,
        image: p.image || p.image_url
    }));
};

/**
 * Sort products for the Shop page.
 * Reads shopSettings.sortOrder from businessData:
 *   'default'      — Pinned → In-stock → Sales → Newest (original behavior)
 *   'price_low'    — Price ascending
 *   'price_high'   — Price descending
 *   'newest'       — Newest ID first
 *   'name_az'      — Alphabetical A→Z
 *   'name_za'      — Alphabetical Z→A
 *   'random'       — Pseudo-random, stable per day
 *   'best_selling' — Purely by sales count
 */
export const sortProducts = (products, businessData) => {
    if (!products || products.length === 0) return [];
    
    const sortOrder = businessData?.shopSettings?.sortOrder || 'default';
    const settings = businessData?.landing_settings || { prioritizedProducts: [] };
    const prioritizedIds = (settings.prioritizedProducts || []).map(String);
    const sorted = [...products];

    switch (sortOrder) {
        case 'price_low':
            sorted.sort((a, b) => Number(a.price) - Number(b.price));
            break;

        case 'price_high':
            sorted.sort((a, b) => Number(b.price) - Number(a.price));
            break;

        case 'newest':
            sorted.sort((a, b) => Number(b.id) - Number(a.id));
            break;

        case 'name_az':
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;

        case 'name_za':
            sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;

        case 'random': {
            // Seeded by today's date so the shuffle is stable for the day
            const today = new Date();
            let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
            const seededRandom = () => {
                seed = (seed * 9301 + 49297) % 233280;
                return seed / 233280;
            };
            // Fisher-Yates shuffle with seeded random
            for (let i = sorted.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom() * (i + 1));
                [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
            }
            break;
        }

        case 'best_selling':
            sorted.sort((a, b) => (b.sales || 0) - (a.sales || 0));
            break;

        case 'default':
        default:
            sorted.sort((a, b) => {
                // 1. Pinned
                const isPinnedA = prioritizedIds.includes(String(a.id));
                const isPinnedB = prioritizedIds.includes(String(b.id));
                if (isPinnedA !== isPinnedB) return isPinnedB - isPinnedA;

                // 2. Stock (In stock > Out of stock)
                const isOosA = (a.stock !== -1 && a.stock <= 0);
                const isOosB = (b.stock !== -1 && b.stock <= 0);
                if (isOosA !== isOosB) return isOosA - isOosB;

                // 3. Sales
                const salesA = a.sales || 0;
                const salesB = b.sales || 0;
                if (salesA !== salesB) return salesB - salesA;

                // 4. ID (Newest)
                return Number(b.id) - Number(a.id);
            });
            break;
    }

    return sorted;
};
