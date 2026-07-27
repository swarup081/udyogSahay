'use client';

import { useState } from 'react';
import { useTemplateContext } from '../templateContext.js';
import { ProductCard } from '../components.js';
import { sortProducts } from '@/lib/templates/templateLogic';
import { HeroAnimation, AnimatedProductGrid, AnimatedProductItem } from '@/components/ui/TemplateAnimation';

export default function ShopPage() {
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const { businessData } = useTemplateContext();
    
    const allProducts = businessData.allProducts; 
    
    const categories = [
        { id: 'all', name: 'All' }, 
        ...businessData.categories
    ];
    
    const filteredProducts = selectedCategoryId === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.category === selectedCategoryId);

    const sortedProducts = sortProducts(filteredProducts, businessData);

    // Shop display settings
    const shopSettings = businessData.shopSettings || {};
    const gridCols = shopSettings.gridColumns || 4;
    const perPage = shopSettings.productsPerPage || 0;
    const displayProducts = perPage > 0 ? sortedProducts.slice(0, perPage) : sortedProducts;

    const gridColsClass = {
        2: 'xl:grid-cols-2',
        3: 'xl:grid-cols-3',
        4: 'xl:grid-cols-4',
    }[gridCols] || 'xl:grid-cols-4';

    return (
        <div className="w-full max-w-full overflow-hidden overflow-x-hidden">
            <div className="container mx-auto px-4 md:px-6 py-10 md:py-24">
                <HeroAnimation direction="up" duration={0.7}>
                    <h1 className="text-[7vw] md:text-6xl font-bold text-brand-text font-serif text-center mb-8 md:mb-16">Shop Our Collection</h1>
                    
                    {/* Category Filters */}
                    <div className="flex justify-center flex-wrap gap-2 md:gap-3 mb-8 md:mb-16">
                        {categories.map(category => (
                            <button 
                                key={category.id}
                                onClick={() => setSelectedCategoryId(category.id)}
                                className={`px-3 py-1 md:px-6 md:py-2 rounded-lg font-medium transition-all duration-300 text-[3vw] md:text-base ${
                                    selectedCategoryId === category.id 
                                        ? 'bg-brand-secondary text-brand-bg shadow-md scale-105' 
                                        : 'bg-brand-primary text-brand-text hover:bg-brand-secondary/20'
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </HeroAnimation>
                
                {/* Products Grid */}
                <AnimatedProductGrid className={`grid grid-cols-2 md:grid-cols-3 ${gridColsClass} gap-4 md:gap-8 items-stretch`}>
                    {displayProducts.map(item => (
                        <AnimatedProductItem key={item.id} id={item.id}>
                            <ProductCard 
                                item={item}
                                templateName="blissly"
                            />
                        </AnimatedProductItem>
                    ))}
                </AnimatedProductGrid>

                {/* "No products" message */}
                {displayProducts.length === 0 && (
                    <p className="text-center text-brand-text/70 text-lg mt-12 col-span-full">No products found in this category.</p>
                )}
            </div>
        </div>
    );
}
