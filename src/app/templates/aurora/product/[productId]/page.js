'use client';
// export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTemplateContext } from '../../templateContext.js';
import { useCart } from '../../cartContext.js';
import { ProductCard } from '../../components.js';
import { fetchSuggestedProducts } from '@/app/actions/recommendations';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroAnimation, ScrollSection, StaggerGrid, StaggerItem } from '@/components/ui/TemplateAnimation';
import TrustBadges from '@/components/ui/TrustBadges';

export default function ProductPage() {
    const { productId } = useParams();
    const { businessData, websiteId } = useTemplateContext();
    const { addToCart } = useCart();
    const [qty, setQty] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState([]);
    
    const product = businessData.allProducts.find(p => p.id.toString() === productId);
    const category = product ? businessData.categories.find(c => c.id === product.category) : null;
    const [selectedVariants, setSelectedVariants] = useState({});
    
    // Carousel State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const allImages = product ? [
        product.image || product.image_url,
        ...(product.gallery || product.additional_images || [])
    ].filter(Boolean) : [];

    const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;
        if (isLeftSwipe) {
            setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
        }
        if (isRightSwipe) {
            setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
        }
        setTouchStart(0);
        setTouchEnd(0);
    };

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

    useEffect(() => {
        if (product) {
            if (product.variants && Array.isArray(product.variants)) {
                const defaults = {};
                product.variants.forEach(v => {
                    const vals = v.values.split(',').map(s => s.trim());
                    if (vals.length > 0) {
                        if (v.type === 'color') {
                            const colorParts = vals[0].split(':');
                            defaults[v.name] = colorParts[0];
                        } else {
                            defaults[v.name] = vals[0];
                        }
                    }
                });
                setSelectedVariants(defaults);
            }
        }
    }, [product]);

    useEffect(() => {
        const loadSuggestions = async () => {
             if (product) {
                 if (websiteId) {
                     const suggestions = await fetchSuggestedProducts(websiteId, product, 2, 8);
                     if (suggestions && suggestions.length > 0) {
                         setRelatedProducts(suggestions);
                         return;
                     }
                 }
                 
                 const local = businessData.allProducts
                    .filter(p => String(p.category) === String(product.category) && String(p.id) !== String(product.id))
                    .slice(0, 4);
                 setRelatedProducts(local);
             }
        };
        loadSuggestions();
    }, [product, websiteId, businessData.allProducts]);

    if (!product) return <div className="py-20 text-center">Product not found</div>;

    const handleAddToCart = () => {
        addToCart({ ...product, selectedVariants }, qty);
    };

    const handleVariantChange = (name, value) => {
        setSelectedVariants(prev => ({ ...prev, [name]: value }));
    };

    // Stock
    const rawStock = product?.stock;
    const isUnlimited = rawStock === -1;
    const stock = isUnlimited ? Infinity : (rawStock || 0);
    const isOutOfStock = !isUnlimited && stock === 0;

    const variants = Array.isArray(product.variants) ? product.variants : [];

    return (
        <div className="bg-[var(--color-bg)] w-full max-w-full overflow-hidden overflow-x-hidden min-h-screen">
            <div className="container mx-auto px-6 py-12 md:py-24">
                <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mt-8 md:mt-0 items-start">
                    
                    {/* Gallery (Carousel) */}
                    <StaggerItem className="flex flex-col gap-4">
                        <div 
                            className="bg-gray-50 aspect-[3/4] relative overflow-hidden max-h-[60vh] md:max-h-[600px] w-full max-w-md mx-auto md:max-w-none md:mx-0 group"
                            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                        >
                            <img 
                                src={allImages[currentImageIndex]} 
                                alt={product.name} 
                                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" 
                            />
                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="bg-white text-black px-4 py-2 uppercase tracking-widest text-xs font-bold">Sold Out</span>
                                </div>
                            )}

                             {/* Arrows */}
                            {allImages.length > 1 && (
                                <>
                                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button>
                                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button>
                                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {allImages.map((_, idx) => (
                                            <button 
                                                key={idx} 
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-black w-4' : 'bg-black/40'}`} 
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                         {/* Thumbnails */}
                        {allImages.length > 1 && (
                            <div className="flex gap-2 justify-center md:justify-start overflow-x-auto pb-2">
                                {allImages.map((img, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`w-16 h-20 bg-gray-50 flex-shrink-0 border-2 transition-all overflow-hidden ${currentImageIndex === idx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </StaggerItem>

                    {/* Product Info */}
                    <StaggerItem className="flex flex-col h-full">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{category ? category.name : 'Product'}</span>
                        <h1 className="text-[7vw] md:text-4xl font-serif text-[var(--color-text)] mb-4">{product.name}</h1>
                        <p className="text-xl md:text-2xl font-bold text-[var(--color-text)] mb-6">₹{product.price.toFixed(2)}</p>
                        
                        {/* Dynamic Variants */}
                        {variants.length > 0 && (
                            <div className="mb-6 space-y-4 border-t border-b border-gray-100 py-4">
                                {variants.map((v, i) => {
                                    const values = v.values.split(',').map(s => s.trim()).filter(Boolean);
                                    if (values.length === 0) return null;

                                    return (
                                        <div key={i}>
                                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">{v.name}: <span className="text-black">{selectedVariants[v.name]}</span></span>
                                            <div className="flex flex-wrap gap-2">
                                                {values.map((val, idx) => {
                                                    let label = val;
                                                    let colorCode = null;
                                                    if (v.type === 'color') {
                                                        const parts = val.split(':');
                                                        label = parts[0];
                                                        colorCode = parts[1] || parts[0];
                                                    }
                                                    const isSelected = selectedVariants[v.name] === label;

                                                    if (v.type === 'color' && colorCode) {
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => handleVariantChange(v.name, label)}
                                                                className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected ? 'border-black scale-110 shadow' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                                                style={{ backgroundColor: colorCode }}
                                                                title={label}
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handleVariantChange(v.name, label)}
                                                            className={`px-4 py-2 border text-xs font-bold uppercase tracking-widest transition-all ${isSelected ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Quantity & Add to Cart */}
                        <div className="flex flex-col md:flex-row gap-4 mb-8 mt-4">
                            <div className={`flex border border-gray-300 w-full md:w-32 h-12 items-center ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                                <button onClick={() => setQty(Math.max(1, qty-1))} className="w-10 h-full hover:bg-gray-100 flex items-center justify-center">-</button>
                                <span className="flex-grow flex items-center justify-center font-bold">{qty}</span>
                                <button onClick={() => setQty(isUnlimited ? qty+1 : Math.min(stock, qty+1))} className="w-10 h-full hover:bg-gray-100 flex items-center justify-center">+</button>
                            </div>
                            <button 
                                onClick={handleAddToCart} 
                                disabled={isOutOfStock}
                                className="flex-grow h-12 bg-[#0F1C23] text-white text-sm uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                            </button>
                        </div>

                        <TrustBadges />

                        {/* Description - Bottom */}
                        {product.description && (
                            <div className="mb-6 border-t border-gray-200 pt-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Description</h3>
                                <p className="text-gray-600 text-sm md:text-base leading-relaxed">{product.description}</p>
                            </div>
                        )}
                    </StaggerItem>
                </StaggerGrid>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <ScrollSection direction="up" className="mt-12 md:mt-24 pt-8 md:pt-16 border-t border-gray-200">
                        <h2 className="text-[6vw] md:text-3xl font-serif text-center mb-8 md:mb-16">You May Also Like</h2>
                        <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10">
                            {relatedProducts.map(p => (
                                <StaggerItem key={p.id}>
                                    <ProductCard item={p} />
                                </StaggerItem>
                            ))}
                        </StaggerGrid>
                    </ScrollSection>
                )}
            </div>
        </div>
    );
}
