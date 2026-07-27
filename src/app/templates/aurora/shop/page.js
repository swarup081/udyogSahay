'use client';
import { useState } from 'react';
import { useTemplateContext } from '../templateContext.js';
import { ProductCard } from '../components.js';
import { sortProducts } from '@/lib/templates/templateLogic';
import { HeroAnimation, AnimatedProductGrid, AnimatedProductItem } from '@/components/ui/TemplateAnimation';

export default function ShopPage() {
    const { businessData } = useTemplateContext();
    const [filter, setFilter] = useState('all');

    const products = filter === 'all' 
        ? businessData.allProducts 
        : businessData.allProducts.filter(p => p.category === filter);

    const sortedProducts = sortProducts(products, businessData);

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
        <div className="bg-[var(--color-bg)] w-full max-w-full overflow-hidden overflow-x-hidden min-h-screen">
            <div className="container mx-auto px-6 py-12 md:py-24">
                <HeroAnimation direction="up" duration={0.7}>
                    <h1 className="text-[7vw] md:text-5xl font-serif text-center mb-8 md:mb-16 mt-8 md:mt-0">All Collections</h1>
                    <div className="flex justify-center flex-wrap gap-4 md:gap-6 mb-8 md:mb-16">
                        <button onClick={() => setFilter('all')} className={`uppercase tracking-widest text-[2.5vw] md:text-sm transition-colors ${filter === 'all' ? 'border-b border-black text-black font-semibold' : 'text-gray-500 hover:text-black'}`}>All</button>
                        {businessData.categories.map(c => (
                            <button key={c.id} onClick={() => setFilter(c.id)} className={`uppercase tracking-widest text-[2.5vw] md:text-sm transition-colors ${filter === c.id ? 'border-b border-black text-black font-semibold' : 'text-gray-500 hover:text-black'}`}>{c.name}</button>
                        ))}
                    </div>
                </HeroAnimation>
                <AnimatedProductGrid className={`grid grid-cols-2 md:grid-cols-3 ${gridColsClass} gap-4 md:gap-8`}>
                    {displayProducts.map(p => (
                        <AnimatedProductItem key={p.id} id={p.id}>
                            <ProductCard item={p} />
                        </AnimatedProductItem>
                    ))}
                </AnimatedProductGrid>
            </div>
        </div>
    );
}
