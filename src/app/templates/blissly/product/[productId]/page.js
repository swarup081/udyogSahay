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

export default function ProductDetailPage() {
    const params = useParams();
    const { productId } = params;
    const { addToCart } = useCart();
    const { businessData, websiteId } = useTemplateContext();
    
    const product = businessData.allProducts.find(p => p.id.toString() === productId);
    const category = product ? businessData.categories.find(c => c.id === product.category) : null;
    
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
                     // Request 2-8
                     const suggestions = await fetchSuggestedProducts(websiteId, product, 2, 8);
                     if (suggestions && suggestions.length > 0) {
                         setRelatedProducts(suggestions);
                         return;
                     }
                 }
                 
                 // Fallback
                 const sameCategoryProducts = businessData.allProducts.filter(
                    p => String(p.category) === String(product.category) && String(p.id) !== String(product.id)
                 );
                 const otherProducts = businessData.allProducts.filter(
                    p => String(p.id) !== String(product.id) && String(p.category) !== String(product.category)
                 );
                 setRelatedProducts([...sameCategoryProducts, ...otherProducts].slice(0, 4));
             }
        };
        loadSuggestions();
    }, [product, websiteId, businessData.allProducts]);

    if (!product) {
        return (
            <div className="container mx-auto px-6 py-32 text-center">
                <h1 className="text-4xl font-serif text-brand-text mb-4">Product Not Found</h1>
                <a href="../shop" className="text-brand-secondary underline">Back to Shop</a>
            </div>
        );
    }
    
    const handleAddToCart = () => {
        addToCart({ ...product, selectedVariants }, quantity);
    };

    const handleVariantChange = (name, value) => {
        setSelectedVariants(prev => ({ ...prev, [name]: value }));
    };

    // Carousel Logic
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };
    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    // Stock
    const rawStock = product?.stock;
    const isUnlimited = rawStock === -1;
    const stock = isUnlimited ? Infinity : (rawStock || 0);
    const isOutOfStock = !isUnlimited && stock === 0;

    // Variants safe access
    const variants = Array.isArray(product.variants) ? product.variants : [];

    return (
        <div className="w-full max-w-full overflow-hidden overflow-x-hidden">
            <div className="container mx-auto px-4 md:px-6 py-10 md:py-20 font-sans">
                <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                    
                     {/* Image Gallery (Carousel) */}
                    <StaggerItem className="relative group w-full max-w-md mx-auto md:max-w-none md:mx-0">
                        <div className="bg-brand-primary overflow-hidden rounded-lg relative aspect-[4/5] max-h-[60vh] md:max-h-[600px] w-full" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                            <img 
                                src={allImages[currentImageIndex]} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-opacity duration-300"
                            />
                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="bg-white text-black px-4 py-2 uppercase tracking-widest text-xs font-bold rounded-lg">Sold Out</span>
                                </div>
                            )}
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
                                            className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
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
                        <h1 className="text-[7vw] md:text-5xl font-serif font-medium text-brand-text mb-4">{product.name}</h1>
                        <p className="text-[5vw] md:text-3xl font-light text-brand-secondary mb-8">₹{product.price.toFixed(2)}</p>

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
                                                        colorCode = (parts[1] || parts[0]).toLowerCase().replace(/\s+/g, '');
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
                                                            className={`px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${isSelected ? 'border-brand-secondary bg-brand-secondary text-brand-bg' : 'border-brand-text/20 text-brand-text hover:border-brand-text/40'}`}
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
                            <div className="mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-text/50 mb-2">Description</h3>
                                <p className="text-brand-text/80 text-sm md:text-base leading-relaxed">{product.description}</p>
                            </div>
                        )}
                        
                        {/* Quantity & Add to Cart */}
                        <div className="flex flex-col md:flex-row items-stretch gap-4 mt-8 border-t border-brand-text/10 pt-8">
                            <div className={`flex items-center border border-brand-text/20 rounded-lg h-12 w-full md:w-32 ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-full text-xl text-brand-text/70 hover:bg-brand-primary rounded-l-lg flex items-center justify-center">-</button>
                                <span className="flex-grow h-full flex items-center justify-center text-lg font-bold border-x border-brand-text/20">{quantity}</span>
                                <button onClick={() => setQuantity(q => isUnlimited ? q+1 : Math.min(stock, q + 1))} className="w-10 h-full text-xl text-brand-text/70 hover:bg-brand-primary rounded-r-lg flex items-center justify-center">+</button>
                            </div>
                            <button 
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className="h-12 w-full bg-brand-secondary text-brand-bg font-medium tracking-wide transition-opacity rounded-lg hover:opacity-90 text-base whitespace-nowrap px-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                            </button>
                        </div>
                    </StaggerItem>
                </StaggerGrid>
                
                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <ScrollSection direction="up" className="mt-12 md:mt-24 pt-8 md:pt-16 border-t border-brand-text/10">
                        <h2 className="text-[6vw] md:text-4xl font-serif font-medium text-brand-text mb-6 md:mb-12 text-center">You Might Also Like</h2>
                        <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 items-stretch">
                             {relatedProducts.map(item => (
                                <StaggerItem key={item.id}>
                                    <ProductCard 
                                        item={item}
                                        templateName="blissly"
                                    />
                                </StaggerItem>
                            ))}
                        </StaggerGrid>
                    </ScrollSection>
                )}
            </div>
        </div>
    );
}
