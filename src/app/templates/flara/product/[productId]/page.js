'use client';
// export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTemplateContext } from '../../templateContext.js';
import { useCart } from '../../cartContext.js';
import Link from 'next/link';
import { fetchSuggestedProducts } from '@/app/actions/recommendations';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroAnimation, ScrollSection, StaggerGrid, StaggerItem } from '@/components/ui/TemplateAnimation';
import TrustBadges from '@/components/ui/TrustBadges';

export default function ProductDetailPage() {
    const params = useParams();
    const { productId } = params;
    const { addToCart } = useCart();
    
    const { businessData, basePath, websiteId } = useTemplateContext(); 

    const product = businessData.allProducts.find(p => p.id.toString() === productId);
    
    const category = product 
        ? businessData.categories.find(c => c.id === product.category) 
        : null;
    
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState([]);
    
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
    const [selectedVariants, setSelectedVariants] = useState({});

    // Initialize defaults
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
                <h1 className="text-4xl font-serif text-brand-text mb-4">Product Not Found</h1>
                <Link href="../shop" className="text-brand-secondary underline">Back to Shop</Link>
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

    // Stock Logic
    const rawStock = product?.stock;
    const isUnlimited = rawStock === -1;
    const stock = isUnlimited ? Infinity : (rawStock || 0);
    const isOutOfStock = !isUnlimited && stock === 0;

    // Carousel Logic
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };
    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const variants = Array.isArray(product.variants) ? product.variants : [];

    return (
        <div className="container mx-auto px-6 py-12 md:py-20">
            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                
                {/* Image Gallery (Carousel) */}
                <StaggerItem className="relative group w-full max-w-lg mx-auto md:mx-0">
                    <div className="bg-brand-primary overflow-hidden rounded-xl relative aspect-[4/5] max-h-[60vh] md:max-h-[600px] w-full" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                         <img 
                            src={allImages[currentImageIndex]} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-opacity duration-300"
                        />
                    </div>

                     {/* Arrows */}
                    {allImages.length > 1 && (
                        <>
                            <button 
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button 
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {allImages.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)} 
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-black w-4' : 'bg-black/40'}`} 
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                        <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                            {allImages.map((img, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`w-20 h-24 bg-brand-primary rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${currentImageIndex === idx ? 'border-brand-secondary' : 'border-transparent opacity-70 hover:opacity-100'}`}
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
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-text/50 mb-2">
                            {category.name}
                        </span>
                    )}
                    <h1 className="text-[7vw] md:text-5xl font-serif font-medium text-brand-text mb-4">
                        {product.name}
                    </h1>
                    <p className="text-[5vw] md:text-3xl font-light text-brand-secondary mb-8">
                        ₹{product.price.toFixed(2)}
                    </p>

                    {/* Dynamic Variants */}
                    {variants.length > 0 && (
                        <div className="mb-8 space-y-4 border-t border-b border-brand-text/10 py-6">
                            {variants.map((v, i) => {
                                const values = v.values.split(',').map(s => s.trim()).filter(Boolean);
                                if (values.length === 0) return null;

                                return (
                                    <div key={i}>
                                        <span className="text-xs font-bold uppercase tracking-widest text-brand-text/50 block mb-3">
                                            {v.name}: <span className="text-brand-text font-normal">{selectedVariants[v.name]}</span>
                                        </span>
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
                                                            className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected ? 'border-brand-secondary scale-110 shadow' : 'border-transparent opacity-80 hover:opacity-100'}`}
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
                                                        className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${isSelected ? 'border-brand-secondary bg-brand-secondary text-brand-bg' : 'border-brand-text/20 text-brand-text hover:border-brand-text/40'}`}
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
                    
                    {/* Description */}
                    {product.description && (
                        <div className="mb-8">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-text/50 mb-2">Description</h3>
                            <p className="text-brand-text/80 text-base leading-relaxed">
                                {product.description}
                            </p>
                        </div>
                    )}
                    
                    {/* Quantity & Add to Cart */}
                    <div className="flex items-center gap-4 mt-4 border-t border-brand-text/10 pt-8">
                        <div className={`flex items-center border border-brand-text/30 rounded ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 md:w-12 md:h-12 text-xl md:text-2xl text-brand-text/70 hover:bg-brand-primary">-</button>
                            <span className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg font-bold border-x border-brand-text/30">{quantity}</span>
                            <button onClick={() => setQuantity(q => isUnlimited ? q + 1 : Math.min(stock, q + 1))} className="w-10 h-10 md:w-12 md:h-12 text-xl md:text-2xl text-brand-text/70 hover:bg-brand-primary">+</button>
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className={`flex-grow h-10 md:h-12 rounded bg-brand-secondary text-brand-bg font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                        >
                            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                    <TrustBadges />
                </StaggerItem>
            </StaggerGrid>
            
            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <ScrollSection direction="up" className="mt-24">
                    <h2 className="text-3xl font-bold text-brand-text font-serif mb-8">You Might Also Like</h2>
                    <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                         {relatedProducts.map(item => (
                            <StaggerItem key={item.id} className="group text-left">
                                <Link href={`${basePath}/product/${item.id}`} className="block bg-brand-primary overflow-hidden relative aspect-[4/5] rounded-lg">
                                    <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </Link>
                                <div className="mt-4">
                                    <h3 className="text-base md:text-xl font-serif font-medium text-brand-text line-clamp-1">
                                        <Link href={`${basePath}/product/${item.id}`} className="hover:text-brand-secondary">{item.name}</Link>
                                    </h3>
                                    <p className="text-brand-text font-medium text-sm md:text-base mt-1">₹{item.price.toFixed(2)}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerGrid>
                </ScrollSection>
            )}
        </div>
    );
}
