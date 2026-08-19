import { supabase } from '@/lib/supabaseClient';

export async function syncWebsiteDataClient(websiteId) {
    if (!websiteId) return;

    try {
        // 1. Fetch all products, categories, and order items for this website
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, name, price, category_id, description, image_url, stock, additional_images, variants')
            .eq('website_id', websiteId)
            .order('id', { ascending: false }); // Latest first

        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id, name')
            .eq('website_id', websiteId);

        // Fetch Order Items (via Orders) to calculate sales
        // Note: Joining to ensure we count correct website sales
        const { data: orderItems, error: salesError } = await supabase
            .from('order_items')
            .select('product_id, quantity, orders!inner(website_id)')
            .eq('orders.website_id', websiteId);

        if (prodError || catError) {
            console.error("Sync fetch error:", prodError || catError);
            return;
        }

        // 2. Fetch current website data to preserve other fields
        const { data: website, error: siteError } = await supabase
            .from('websites')
            .select('website_data')
            .eq('id', websiteId)
            .limit(1)
            .maybeSingle();

        if (siteError || !website) {
             console.error("Sync website fetch error:", siteError);
             return;
        }

        const currentData = website.website_data || {};

        // 3. Process Sales Data
        const productSales = {}; // { prodId: totalQty }
        (orderItems || []).forEach(item => {
            productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
        });

        // 4. Map Products with Sales
        const mappedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category_id ? String(p.category_id) : 'uncategorized',
            description: p.description,
            image: p.image_url,
            stock: p.stock, // -1 is Unlimited
            sales: productSales[p.id] || 0,
            additional_images: p.additional_images || [],
            variants: p.variants || []
        }));

        // 5. Map Categories with Stats (Top Image + Sales)
        const mappedCategories = categories ? categories.map(c => {
            const catProducts = mappedProducts.filter(p => String(p.category) === String(c.id));
            
            // Calculate total category sales
            const totalSales = catProducts.reduce((sum, p) => sum + p.sales, 0);
            
            // Find Top Selling Product Image
            // Sort by sales (desc), then check for image
            const topProduct = [...catProducts]
                .sort((a, b) => b.sales - a.sales)
                .find(p => p.image); // First one with an image
            
            return {
                id: String(c.id),
                name: c.name,
                sales: totalSales,
                image: topProduct ? topProduct.image : null
            };
        }) : [];

        // 6. Update website_data JSON
        const newData = {
            ...currentData,
            allProducts: mappedProducts,
            // Update categories with what is in the DB (even if empty) to ensure sample categories are removed
            categories: mappedCategories
        };

        const { error: updateError } = await supabase
            .from('websites')
            .update({ website_data: newData })
            .eq('id', websiteId);

        if (updateError) {
            console.error("Sync update error:", updateError);
        } else {
            console.log("Website JSON synced successfully (Client-Side) with Analytics.");
        }

    } catch (err) {
        console.error("Sync unexpected error:", err);
    }
}
