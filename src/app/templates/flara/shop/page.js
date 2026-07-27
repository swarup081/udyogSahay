'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTemplateContext } from '../templateContext.js';
import { ProductCard } from '../components.js';
import { useSearchParams } from 'next/navigation';
import { sortProducts } from '@/lib/templates/templateLogic';
import { HeroAnimation, AnimatedProductGrid, AnimatedProductItem } from '@/components/ui/TemplateAnimation';

function ShopContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';

    const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategory);
    const { businessData } = useTemplateContext(); 
    
    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) setSelectedCategoryId(cat);
    }, [searchParams]);

    const allProducts = businessData.allProducts; 
    
    const categories = [
        { id: 'all', name: 'All' }, 
        ...businessData.categories
    ];
    
    const filteredProducts = selectedCategoryId === 'all' 
        ? allProducts 
        : allProducts.filter(p => String(p.category) === String(selectedCategoryId));

    const sortedProducts = sortProducts(filteredProducts, businessData);

    // Shop display settings
    const shopSettings = businessData.shopSettings || {};
    const gridCols = shopSettings.gridColumns || 4;
    const perPage = shopSettings.productsPerPage || 0;
    const displayProducts = perPage > 0 ? sortedProducts.slice(0, perPage) : sortedProducts;

    const gridColsClass = {
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
    }[gridCols] || 'lg:grid-cols-4';

    return (
        <div className="container mx-auto px-6 py-16">
            <HeroAnimation direction="up" duration={0.7}>
                <h1 className="text-5xl font-bold text-brand-text font-serif text-center mb-12">Shop Our Collection</h1>
                
                <div className="flex justify-center flex-wrap gap-3 mb-12">
                    {categories.map(category => (
                        <button 
                            key={category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                                String(selectedCategoryId) === String(category.id) 
                                    ? 'bg-brand-secondary text-brand-bg shadow-md scale-105' 
                                    : 'bg-brand-primary text-brand-text hover:bg-brand-secondary/20'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </HeroAnimation>
            
            <AnimatedProductGrid className={`grid grid-cols-2 sm:grid-cols-2 ${gridColsClass} gap-x-8 gap-y-16 items-stretch`}>
                {displayProducts.map(item => (
                    <AnimatedProductItem key={item.id} id={item.id}>
                        <ProductCard 
                            item={item}
                            templateName="flara"
                        />
                    </AnimatedProductItem>
                ))}
            </AnimatedProductGrid>
            {displayProducts.length === 0 && (
                <p className="text-center text-brand-text/70 text-lg">No products found in this category.</p>
            )}
        </div>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="py-20 text-center">Loading shop...</div>}>
            <ShopContent />
        </Suspense>
    );
}
