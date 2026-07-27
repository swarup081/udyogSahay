'use client';

import { useState } from 'react';
import { useTemplateContext } from '../templateContext.js';
import { ProductCard } from '../components.js';
import { sortProducts } from '@/lib/templates/templateLogic';
import { HeroAnimation, AnimatedProductGrid, AnimatedProductItem } from '@/components/ui/TemplateAnimation';

export default function FrostifyShopPage() {
    const { businessData } = useTemplateContext();
    const [filter, setFilter] = useState('all');

    const allProducts = businessData.allProducts;
    const categories = [{ id: 'all', name: 'All Treats' }, ...businessData.categories];

    const filteredProducts = filter === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.category === filter);

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
        <div className="bg-white min-h-screen pt-24 md:pt-32 pb-12 md:pb-24 w-full max-w-full overflow-hidden overflow-x-hidden">
            <div className="container mx-auto px-6">
                
                {/* Header */}
                <HeroAnimation direction="up" duration={0.7}>
                    <div className="text-center mb-8 md:mb-16">
                        <span className="text-[var(--color-secondary)] text-[2.5vw] md:text-xs font-bold uppercase tracking-[0.2em]">Freshly Baked</span>
                        <h1 className="text-[7vw] md:text-5xl font-serif text-[var(--color-primary)] mt-2 md:mt-4">Our Menu</h1>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 md:mb-16">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={`px-4 py-1.5 md:px-6 md:py-2 rounded-full text-[2.5vw] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                                    filter === cat.id 
                                        ? 'bg-[var(--color-primary)] text-white shadow-md scale-105' 
                                        : 'bg-[#F9F4F6] text-[var(--color-primary)] hover:bg-[var(--color-accent)]/20'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </HeroAnimation>

                {/* Product Grid */}
                <AnimatedProductGrid className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${gridColsClass} gap-4 md:gap-8`}>
                    {displayProducts.map(product => (
                        <AnimatedProductItem key={product.id} id={product.id}>
                            <ProductCard item={product} />
                        </AnimatedProductItem>
                    ))}
                </AnimatedProductGrid>

                {displayProducts.length === 0 && (
                    <p className="text-center text-gray-500 mt-12 text-[3vw] md:text-base">No delicious treats found in this category.</p>
                )}
            </div>
        </div>
    );
}
