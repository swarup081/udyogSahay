'use client';
import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useCart } from './cartContext.js';
import { useTemplateContext } from './templateContext.js';
import Link from 'next/link';
import { Editable } from '@/components/editor/Editable';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, ShoppingBag, Heart, Star } from 'lucide-react';

// --- ICONS ---
export const FeatureIcon = ({ name, size = 32 }) => {
    const icons = {
        fast_shipping: <path d="M5 12h14M12 5l7 7-7 7" />,
        card: <rect x="2" y="5" width="20" height="14" rx="2" />,
        certified: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
        ecology: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {icons[name] || icons.fast_shipping}
        </svg>
    );
};

// --- HEADER CONTENT (Logic with SearchParams) ---
const HeaderContent = () => {
    const { businessData, basePath } = useTemplateContext();
    const { cartCount, openCart } = useCart();
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isLanding = searchParams.get('isLanding') === 'true';

    const resolveLink = (url) => {
        if (url === undefined || url === null) return "#";
        if (url.startsWith('#') || url.startsWith('http')) return url;
        const path = url.replace('/templates/aurora', '');
        const cleanBasePath = basePath && basePath !== '.' ? basePath : '';
        return `${cleanBasePath}${path}` || '/';
    };

    if (typeof window !== "undefined") {
        window.addEventListener("scroll", () => {
            setScrolled(window.scrollY > 20);
        });
    }

    const DemoTooltip = () => (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-3 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-medium tracking-wide shadow-lg">
            Unlock full potential in the editor
        </div>
    );

    return (
        <header className={`${scrolled ? "fixed bg-[var(--color-bg)]/90 backdrop-blur-md shadow-sm py-4" : "absolute py-4 md:py-8"} top-0 left-0 w-full z-50 px-6 lg:px-16 transition-all duration-300`}>
            <div className="max-w-[1920px] mx-auto flex justify-between items-center">
                
                {/* LEFT: Navigation Links */}
                <nav className="hidden lg:flex items-center gap-10">
                    {['Home', 'Shop'].map((item) => (
                        <div key={item} className="relative group">
                            <a 
                                href={resolveLink(item === 'Home' ? "" : `/shop`)}
                                onClick={(e) => {
                                    if (isLanding) e.preventDefault();
                                }}
                                className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors text-[var(--color-text-light)] hover:text-[var(--color-dark)] relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-4px] after:left-0 after:bg-[var(--color-gold)] after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${isLanding ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                                {item}
                            </a>
                            {isLanding && <DemoTooltip />}
                        </div>
                    ))}
                </nav>

                {/* CENTER: Logo */}
                <a href={resolveLink("")} onClick={isLanding ? (e) => e.preventDefault() : undefined} className={`flex items-center gap-3 absolute left-1/2 -translate-x-1/2 ${isLanding ? 'cursor-default' : ''}`}>
                    <Editable focusId="hero">
                        <span className="font-serif text-[6vw] md:text-3xl text-[var(--color-dark)] tracking-tight font-medium">
                            {businessData?.name}
                        </span>
                    </Editable>
                </a>

                {/* RIGHT: Icons */}
                <div className="flex items-center gap-4 md:gap-8 text-[var(--color-dark)]">
       
                    <div className="relative group">
                        <button 
                            onClick={isLanding ? (e) => e.preventDefault() : openCart} 
                            className={`hover:scale-110 transition-transform relative ${isLanding ? 'cursor-not-allowed opacity-70' : ''}`}
                        >
                            <ShoppingBag size={22} strokeWidth={1.5} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--color-gold)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        {isLanding && <DemoTooltip />}
                    </div>
                </div>
            </div>
        </header>
    );
};

// --- HEADER WRAPPER ---
export const Header = () => {
    return (
        <Suspense fallback={<div className="absolute py-4 md:py-8 top-0 left-0 w-full px-6 lg:px-16" />}>
            <HeaderContent />
        </Suspense>
    );
};

// --- PRODUCT CARD ---
export const ProductCard = ({ item }) => {
    const { addItem } = useCart();
    const { basePath } = useTemplateContext();
    
    // Check stock: If stock is NOT -1 (unlimited) AND <= 0, it's out of stock.
    const isOutOfStock = item.stock !== -1 && item.stock <= 0;

    const productUrl = `${basePath && basePath !== '.' ? basePath : ''}/product/${item.id}`;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`group cursor-pointer flex flex-col gap-3 md:gap-5 h-full ${isOutOfStock ? 'opacity-75' : ''}`}
        >
            <div className="relative overflow-hidden aspect-[3/4] bg-[var(--color-bg-alt)]">
                <img 
                    src={item.image || item.image_url} 
                    alt={item.name} 
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110 ${isOutOfStock ? 'grayscale' : ''}`} 
                />
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-600 text-[var(--color-dark)] px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-lg">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>
            <div className="text-center flex flex-col gap-1 md:gap-2 flex-grow">
                <a href={productUrl} className="flex-grow">
                    <h3 className="font-serif text-[3.5vw] md:text-lg text-[var(--color-dark)] leading-tight mb-1 md:mb-2 group-hover:text-[var(--color-gold)] transition-colors">{item.name}</h3>
                </a>
                <span className="text-[2.5vw] md:text-sm font-medium text-[var(--color-text-light)] tracking-wide">₹{Number(item.price || 0).toFixed(2)}</span>
                
                {/* Always Visible Buttons */}
                <div className="mt-auto flex gap-2">
                     <a
                        href={productUrl}
                        className="flex-1 border border-[var(--color-dark)]/20 py-2 md:py-3 text-[2vw] md:text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-dark)] hover:border-[var(--color-dark)] transition-colors flex items-center justify-center"
                    >
                        View
                    </a>
                    <button 
                        onClick={(e) => { e.preventDefault(); if(!isOutOfStock) addItem(item); }}
                        disabled={isOutOfStock}
                        className={`flex-1 py-2 md:py-3 text-[2vw] md:text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${
                            isOutOfStock 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-[var(--color-dark)] text-white hover:bg-[var(--color-gold)]'
                        }`}
                    >
                        {isOutOfStock ? 'Sold Out' : 'Add'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// --- NEWSLETTER CTA (Exact "An Invitation" Design) ---
export const NewsletterCTA = ({ data = {} }) => {
    const title = data?.title || "Unlock Exclusive Access";
    const text = data?.text || "Sign up to receive invitations to private viewings, early access to new collections, and expert advice on building your jewelry heirloom.";
    const placeholder = data?.placeholder || "Enter your email address";
    const buttonText = data?.buttonText || "Join the List";

    return (
        <section className="py-20 md:py-32 bg-[var(--color-dark)] relative overflow-hidden text-white flex items-center justify-center">
            
            {/* Double Border Frame for Luxury Feel */}
            <div className="absolute inset-6 border border-[var(--color-gold)] opacity-20 pointer-events-none"></div>
            <div className="absolute inset-8 border border-[var(--color-gold)] opacity-10 pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10 max-w-4xl text-center">
                <div className="flex flex-col items-center">
                     {/* Top Tag */}
                     <span className="text-[var(--color-gold)] text-[2.5vw] md:text-[10px] font-bold uppercase tracking-[0.4em] mb-4 md:mb-8">
                        An Invitation
                     </span>
                     
                     {/* Main Heading */}
                     <h2 className="text-[8vw] md:text-7xl font-serif text-white mb-4 md:mb-8 tracking-tight">
                        {title}
                     </h2>
                     
                     {/* Description Text */}
                     <p className="text-[var(--color-text-light)] text-[3vw] md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-8 md:mb-16">
                        {text}
                     </p>
                </div>

                {/* Minimalist Input Form */}
                <div className="max-w-md mx-auto relative flex flex-col items-center gap-4 md:gap-8 w-full">
                    <input 
                        type="email" 
                        placeholder={placeholder}
                        className="w-full bg-transparent border-b border-[var(--color-gold)]/30 py-3 md:py-4 px-2 text-center text-white placeholder-[var(--color-text-light)] focus:border-[var(--color-gold)] focus:outline-none transition-colors text-[3vw] md:text-sm font-light tracking-wide"
                    />
                    <button className="text-[2.5vw] md:text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--color-gold)] hover:text-white transition-colors border border-[var(--color-gold)] px-8 md:px-12 py-3 md:py-4 hover:bg-[var(--color-gold)]/10 mt-2 md:mt-4">
                        {buttonText}
                    </button>
                </div>
            </div>
        </section>
    );
};

// --- TESTIMONIAL SLIDER ---
export const TestimonialSlider = ({ data = {} }) => {
    const [index, setIndex] = useState(0);

    // Fallback data for empty state so user can edit
    const items = data?.items?.length ? data.items : [
        { quote: "Click to edit this testimonial.", author: "Your Customer", location: "Location" }
    ];

    const item = items[index];

    return (
        <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-[2.5vw] md:text-[11px] font-bold tracking-[0.3em] uppercase text-[var(--color-text-light)] mb-8 md:mb-12">
                {data?.title || "Client Reviews"}
            </h2>
            
            <div className="relative bg-white p-8 md:p-20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] rounded-2xl">
                <div className="absolute top-4 md:top-10 left-4 md:left-10 text-[10vw] md:text-6xl font-serif text-[var(--color-gold)] opacity-20">“</div>
                
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="flex gap-1 text-[var(--color-gold)] mb-4 md:mb-8">
                        {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" strokeWidth={0} />)}
                    </div>
                    
                    <blockquote className="text-[4vw] md:text-4xl font-serif text-[var(--color-dark)] leading-snug mb-6 md:mb-10 max-w-3xl">
                        "{item.quote}"
                    </blockquote>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--color-bg-alt)] flex items-center justify-center font-serif text-lg md:text-xl italic text-[var(--color-gold)]">
                            {item.author.charAt(0)}
                        </div>
                        <div className="text-left">
                            <cite className="not-italic block text-[2.5vw] md:text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-dark)]">
                                {item.author}
                            </cite>
                            <span className="text-[2vw] md:text-[10px] text-[var(--color-text-light)] uppercase tracking-wider">
                                {item.location}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                    {items.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === index ? 'bg-[var(--color-dark)] w-6' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- INSTAGRAM FEED ---
export const InstagramFeed = ({ data = {} }) => {
    const title = data?.title || "Follow Us";
    const handle = data?.handle || "@yourbrand";
    // Fallback images if none provided
    const images = data?.images?.length ? data.images : [
        "https://placehold.co/400x400/e0e0e0/a0a0a0?text=Post+1",
        "https://placehold.co/400x400/e0e0e0/a0a0a0?text=Post+2",
        "https://placehold.co/400x400/e0e0e0/a0a0a0?text=Post+3",
        "https://placehold.co/400x400/e0e0e0/a0a0a0?text=Post+4",
        "https://placehold.co/400x400/e0e0e0/a0a0a0?text=Post+5",
        "https://placehold.co/400x400/e0e0e0/a0a0a0?text=Post+6"
    ];

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-8 md:mb-12 px-4">
                <div>
                    <span className="text-[var(--color-gold)] text-[2.5vw] md:text-xs font-bold uppercase tracking-widest mb-2 block">Social Media</span>
                    <h2 className="text-[6vw] md:text-4xl font-serif text-[var(--color-dark)]">{title}</h2>
                </div>
                <a href="#" className="text-[2.5vw] md:text-xs font-bold uppercase tracking-widest border-b border-[var(--color-dark)] pb-1 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors text-[var(--color-dark)]">
                    {handle}
                </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-0">
                {images.map((img, i) => (
                    <div key={i} className="aspect-square relative group overflow-hidden cursor-pointer">
                        <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Heart className="text-white fill-white" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- FAQ ACCORDION ---
export const FAQAccordion = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 md:py-8 flex justify-between items-center text-left hover:text-[var(--color-gold)] transition-colors group"
            >
                <span className="text-[4vw] md:text-xl font-serif text-[var(--color-dark)] pr-4 md:pr-8 group-hover:text-[var(--color-gold)] transition-colors">{question}</span>
                <span className={`text-2xl font-light text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>+</span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${isOpen ? 'max-h-48 pb-6 md:pb-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-[var(--color-text-light)] font-light leading-relaxed max-w-2xl text-[3vw] md:text-lg">{answer}</p>
            </div>
        </div>
    );
};

// --- FOOTER ---
export const Footer = () => {
    const { businessData, basePath } = useTemplateContext();

    const resolveLink = (url) => {
        if (url === undefined || url === null) return "#";
        if (url.startsWith('#') || url.startsWith('http')) return url;
        const path = url.replace('/templates/aurora', '');
        const cleanBasePath = basePath && basePath !== '.' ? basePath : '';
        return `${cleanBasePath}${path}` || '/';
    };

    return (
        <footer className="bg-[var(--color-bg-alt)] pt-12 md:pt-24 pb-6 md:pb-12">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-20">
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="text-2xl font-serif font-bold mb-4 md:mb-6 text-[var(--color-dark)]">{businessData?.name}</h3>
                        <p className="text-[3vw] md:text-sm text-[var(--color-text-light)] leading-relaxed mb-4 md:mb-6 max-w-xs">{businessData.footer?.description}</p>
                    </div>
                    
                    <div className="col-span-1">
                        <h4 className="text-[2.5vw] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6 text-[var(--color-dark)]">Explore</h4>
                        <ul className="space-y-3 md:space-y-4 text-[2.5vw] md:text-xs font-medium tracking-wide text-[var(--color-text-light)] uppercase">
                            {businessData.footer?.links?.main?.map(link => (
                                <li key={link.name}><a href={resolveLink(link.url)} className="hover:text-[var(--color-dark)] transition-colors">{link.name}</a></li>
                            ))}
                        </ul>
                    </div>
                    
                     <div className="col-span-1">
                        <h4 className="text-[2.5vw] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6 text-[var(--color-dark)]">Legal</h4>
                        <ul className="space-y-3 md:space-y-4 text-[2.5vw] md:text-xs font-medium tracking-wide text-[var(--color-text-light)] uppercase">
                             {businessData.footer?.links?.utility?.map(link => (
                                <li key={link.name}><a href={resolveLink(link.url)} className="hover:text-[var(--color-dark)] transition-colors">{link.name}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                         <h4 className="text-[2.5vw] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6 text-[var(--color-dark)]">Stay Updated</h4>
                         <p className="text-[3vw] md:text-xs text-[var(--color-text-light)] mb-4">{businessData.footer?.subscribe?.title}</p>
                         <div className="flex border-b border-gray-400 pb-2">
                             <input type="email" placeholder="Email Address" className="bg-transparent flex-grow text-[3vw] md:text-xs outline-none placeholder-[var(--color-text-light)] text-[var(--color-dark)]" />
                             <button className="text-[2.5vw] md:text-[10px] font-bold uppercase tracking-widest hover:text-[var(--color-gold)] transition-colors text-[var(--color-dark)]">{businessData.footer?.subscribe?.cta}</button>
                         </div>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-300 text-[2.5vw] md:text-[10px] text-[var(--color-text-light)] uppercase tracking-[0.2em] font-bold">
                    <p>{businessData.footer?.copyright}</p>
                    <p>Designed by Bizvistar</p>
                </div>
            </div>
        </footer>
    );
};
