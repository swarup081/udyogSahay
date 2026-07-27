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

export default function FrostifyProductPage() {
    const { productId } = useParams();
    const { businessData, websiteId } = useTemplateContext();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedVariants, setSelectedVariants] = useState({});

    const product = businessData.allProducts.find(p => p.id.toString() === productId);
    const category = product ? businessData.categories.find(c => c.id === product.category) : null;

    // Gallery State
    const allImages = [product?.image, ...(product?.additional_images || [])].filter(Boolean);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) {
            nextImage();
        } else if (isRightSwipe) {
            prevImage();
        }
    };

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

    useEffect(() => {
        if (product) {
            if (product.variants && Array.isArray(product.variants)) {
                const defaults = {};
                product.variants.forEach(v => {
                    const vals = v.values.split(',').map(s => s.trim());
                    if (vals.length > 0) defaults[v.name] = vals[0];
                    if (v.type === 'color') {
                         const colorParts = vals[0].split(':'); 
                         defaults[v.name] = colorParts[0];
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

    if (!product) {
        return (
            <div className="container mx-auto px-6 py-32 text-center">
                <h1 className="text-4xl font-serif text-[var(--color-primary)] mb-4">Product Not Found</h1>
                <a href="../shop" className="text-[var(--color-secondary)] underline">Back to Shop</a>
            </div>
        );
    }

    const handleAddToCart = () => {
        addToCart({
            ...product,
            selectedVariants
        }, quantity);
    };

    const handleVariantChange = (name, value) => {
        setSelectedVariants(prev => ({ ...prev, [name]: value }));
    };

    // Stock safe check
    const rawStock = product?.stock;
    const isUnlimited = rawStock === -1;
    const stock = isUnlimited ? Infinity : (rawStock || 0);
    const isOutOfStock = !isUnlimited && stock === 0;

    const variants = Array.isArray(product.variants) ? product.variants : [];

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-6 py-12 md:py-24">
                <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
                    
                    {/* Gallery (Carousel) */}
                    <StaggerItem className="flex flex-col gap-4">
                        <div 
                            className="bg-[#F9F4F6] rounded-2xl overflow-hidden shadow-lg aspect-square relative max-h-[60vh] md:max-h-[600px] w-full max-w-md mx-auto md:max-w-none md:mx-0 group"
                            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                        >
                            <img 
                                src={allImages[currentImageIndex]} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-opacity duration-300"
                            />
                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="bg-white text-[var(--color-primary)] px-6 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg">Sold Out</span>
                                </div>
                            )}

                            {/* Arrows */}
                            {allImages.length > 1 && (
                                <>
                                    <button 
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[var(--color-primary)] p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button 
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[var(--color-primary)] p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {allImages.map((_, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)} 
                                                className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-[var(--color-primary)] w-4' : 'bg-[var(--color-primary)]/40'}`} 
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {allImages.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {allImages.map((img, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${currentImageIndex === idx ? 'border-[var(--color-primary)] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </StaggerItem>

                    {/* Product Info */}
                    <StaggerItem className="flex flex-col">
                        {category && (
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]/50 mb-2 block">
                                {category.name}
                            </span>
                        )}
                        <h1 className="text-[7vw] md:text-4xl font-serif text-[var(--color-primary)] mb-4">{product.name}</h1>
                        <p className="text-xl md:text-2xl font-bold text-[var(--color-primary)] mb-6">₹{product.price.toFixed(2)}</p>

                        {/* Dynamic Variants */}
                        {variants.length > 0 && (
                            <div className="mb-6 space-y-4 border-t border-b border-gray-100 py-4">
                                {variants.map((v, i) => {
                                    const values = v.values.split(',').map(s => s.trim()).filter(Boolean);
                                    if (values.length === 0) return null;

                                    return (
                                        <div key={i}>
                                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]/70 block mb-2">{v.name}: <span className="text-[var(--color-primary)] font-normal">{selectedVariants[v.name]}</span></span>
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
                                                                className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected ? 'border-[var(--color-primary)] scale-110 shadow' : 'border-transparent opacity-80 hover:opacity-100'}`}
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
                                                            className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
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
                        
                        <div className="flex flex-col md:flex-row gap-4 mt-6">
                            <div className={`flex items-center border border-[var(--color-primary)] rounded-full px-2 h-12 w-full md:w-32 justify-center ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 text-lg text-[var(--color-primary)] font-bold hover:bg-gray-50 rounded-full">-</button>
                                <span className="px-3 text-lg text-[var(--color-primary)] font-bold w-10 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(isUnlimited ? quantity+1 : Math.min(stock, quantity + 1))} className="px-3 text-lg text-[var(--color-primary)] font-bold hover:bg-gray-50 rounded-full">+</button>
                            </div>
                            <button 
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className="flex-grow bg-[var(--color-primary)] text-white px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-secondary)] transition-colors h-12 flex items-center justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                            </button>
                        </div>

                        {/* Description - Bottom */}
                        {product.description && (
                             <div className="mt-8 pt-8 border-t border-gray-100">
                                <span className="text-xs font-bold text-[var(--color-primary)]/50 uppercase tracking-widest block mb-2">Description</span>
                                <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
                            </div>
                        )}
                    </StaggerItem>
                </StaggerGrid>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <ScrollSection direction="up" className="border-t border-gray-100 pt-8 md:pt-16 mt-12 md:mt-24">
                        <h2 className="text-[6vw] md:text-3xl font-serif text-[var(--color-primary)] text-center mb-6 md:mb-12">You Might Also Like</h2>
                        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
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
