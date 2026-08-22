'use client';
import { useState } from 'react';
import { useCart } from './cartContext.js';
import { useTemplateContext } from './templateContext.js';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag, Instagram, Facebook, Twitter, ChevronDown, ChevronRight, ChevronLeft, Store } from 'lucide-react';

// --- CUSTOM SVG SEPARATOR (The "Icing" Drip) ---
export const WavySeparatorTop = ({ fill = "#592E4F" }) => (
    <div className="w-full overflow-hidden leading-none rotate-180">
        <svg 
            className="relative block w-[calc(100%+1.3px)] h-[70px] md:h-[100px]" 
            data-name="Layer 1" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
        >
            <path 
                d="M0,0 V40 
                   C150,100 280,20 400,60 
                   C520,100 600,10 720,50 
                   C840,90 950,20 1050,60 
                   C1120,90 1160,70 1200,50 
                   V0 Z" 
                fill={fill} 
            />
        </svg>
    </div>
);
export const WavySeparatorBottom = ({ fill = "#592E4F" }) => (
    <div className="w-full overflow-hidden leading-none">
        <svg 
            className="relative block w-[calc(100%+1.3px)] h-[70px] md:h-[100px]" 
            data-name="Layer 1" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
        >
            <path 
                d="M0,0 
                   V30 
                   C80,60 160,90 260,50 
                   C380,10 480,90 600,60 
                   C720,30 820,100 940,50 
                   C1040,10 1120,60 1200,40 
                   V0 Z" 
                fill={fill} 
            />
        </svg>
    </div>
);

// --- HEADER ---
export const Header = () => {
    const { businessData, basePath } = useTemplateContext();
    const { cartCount, openCart } = useCart();

    const resolveLink = (url) => {
        if (url === undefined || url === null) return "#";
        if (url.startsWith('#') || url.startsWith('http')) return url;
        const path = url.replace('/templates/frostify', '');
        const cleanBasePath = basePath && basePath !== '.' ? basePath : '';
        return `${cleanBasePath}${path}` || '/';
    };

    return (
        <header className="fixed top-0 w-full z-50 bg-white overflow-hidden shadow-sm">
            {/* Top Banner */}
            <div className="bg-[var(--color-primary)] text-white text-[2vw] md:text-[10px] font-bold uppercase tracking-[0.2em] text-center py-2">
                • {businessData.hero?.badge || "Made with Love"} • {businessData.hero?.badge || "Made with Love"} • {businessData.hero?.badge || "Made with Love"} •
            </div>
            
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                {/* Left: SHOP Button (Prominent UI) */}
                <div className="flex gap-2">
                    <a // Changed from Link to a to support resolved dynamic link
                        href={resolveLink("/shop")} 
                        className="flex items-center gap-2 bg-[var(--color-secondary)] text-white px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[2.5vw] md:text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-primary)] transition-all shadow-md transform hover:scale-105"
                    >
                        <Store size={14} className="w-3 h-3 md:w-[14px] md:h-[14px]" />
                        Shop 
                    </a>
                </div>

                {/* Center: Logo */}
                <a href={resolveLink("")} className="text-[6vw] md:text-4xl font-serif text-[var(--color-primary)] absolute left-1/2 -translate-x-1/2">
                    {businessData.name}
                </a>

                {/* Right: Cart Button (Preserved Menu Style) */}
                <button 
                    onClick={openCart} 
                    className="bg-[var(--color-primary)] text-white px-3 py-1.5 md:px-6 md:py-2 rounded-full text-[2.5vw] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[var(--color-secondary)] transition"
                >
                    Cart
                    {cartCount > 0 && <span>({cartCount})</span>}
                </button>
            </div>
        </header>
    );
};

// --- SPECIALTY CARD (Unique Shape from Image) ---
export const SpecialtyCard = ({ title, shapeClass = "rounded-t-[30px]" }) => {
    const parts = (title || '').split(' '); 
    
    return (
        <div className={`aspect-square bg-[#F9F4F6] ${shapeClass} flex flex-col items-center justify-center text-center p-3 md:p-6 hover:bg-[var(--color-accent)]/20 transition-colors cursor-pointer group shadow-sm overflow-hidden`}>
            <h3 className="font-serif text-[3.5vw] md:text-2xl text-[var(--color-primary)] leading-tight group-hover:scale-105 transition-transform">
                {parts[0]} <br/> {parts.slice(1).join(' ')}
            </h3>
        </div>
    );
};

// --- PRODUCT CARD (Reusable) ---
export const ProductCard = ({ item }) => {
    const { addItem } = useCart();
    const { basePath } = useTemplateContext();
    
    // Check stock: If stock is NOT -1 (unlimited) AND <= 0, it's out of stock.
    const isOutOfStock = item.stock !== -1 && item.stock <= 0;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOutOfStock) {
            addItem(item);
        }
    };

    const productUrl = `${basePath && basePath !== '.' ? basePath : ''}/product/${item.id}`;

    return (
        <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            className={`group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-pink-50 h-full flex flex-col ${isOutOfStock ? 'opacity-75' : ''}`}
        >
            <a href={productUrl} className="block flex-grow-0">
                <div className="aspect-[4/5] overflow-hidden relative bg-[#F9F4F6]">
                    <img 
                        src={item.image || item.image_url} 
                        alt={item.name} 
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale' : ''}`} 
                    />
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-red-400 text-[var(--color-primary)] px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                                Out of Stock
                            </span>
                        </div>
                    )}
                </div>
            </a>
            <div className="p-3 md:p-5 text-center flex flex-col items-center gap-1 md:gap-2 flex-grow">
                <a href={productUrl} className="flex-grow">
                    <h3 className="font-serif text-[3vw] md:text-lg text-[var(--color-primary)] hover:text-[var(--color-secondary)] tracking-wide">{item.name}</h3>
                </a>
                <p className="text-[var(--color-secondary)] font-bold text-[3vw] md:text-lg">₹{Number(item.price || 0).toFixed(2)}</p>
                
                {/* Updated Buttons: View + Add (Side-by-side or Stacked, always visible) */}
                <div className="mt-auto w-full flex gap-2">
                     <a
                        href={productUrl}
                        className="flex-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] py-2 md:py-3 rounded-full text-[2vw] md:text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-white transition-colors flex items-center justify-center"
                    >
                        View
                    </a>
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`flex-1 py-2 md:py-3 rounded-full text-[2vw] md:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 md:gap-2 transition-colors ${
                            isOutOfStock 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)]'
                        }`}
                    >
                         {isOutOfStock ? 'Sold Out' : <><ShoppingBag size={14} className="hidden md:inline" /> Add</>}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// --- FAQ ACCORDION ---
export const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-[#Fdf4f8] rounded-[2rem] mb-3 overflow-hidden border border-transparent">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 md:px-8 py-3 md:py-4 flex justify-between items-center text-left bg-[#fceef5] hover:bg-[#fae1ed] transition-colors"
            >
                <span className="text-[2.5vw] md:text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest">{question}</span>
                <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-[var(--color-primary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ${isOpen ? 'max-h-32 opacity-100 py-3 md:py-4' : 'max-h-0 opacity-0 py-0'}`}>
                <p className="px-4 md:px-8 text-[2.5vw] md:text-sm text-[var(--color-primary)]/80 font-medium">{answer}</p>
            </div>
        </div>
    );
};

// --- FOOTER ---
export const Footer = () => {
    const { businessData } = useTemplateContext();
    // Frostify footer currently has no internal links, only text and social icons.
    // If links are added later, use basePath like in Header.
    
    return (
        <footer className="relative bg-[var(--color-primary)] text-white overflow-hidden">
            <div className="absolute top-0 left-0 w-full -translate-y-[99%] pointer-events-none">
                <WavySeparatorBottom fill="#592E4F" />
            </div>

            <div className="container mx-auto px-6 pt-10 pb-10 text-center relative z-10">
                <h2 className="text-[6vw] md:text-4xl font-serif mb-2">{businessData.footer?.contactTitle || "Contact us"}</h2>
                
                <div className="mt-16 text-left max-w-lg mx-auto grid grid-cols-2 md:grid-cols-2 gap-8 text-[2.5vw] md:text-sm font-medium opacity-80">
                    <div>
                        <p className="font-bold uppercase tracking-widest mb-2 opacity-100">Opening Hours:</p>
                        <p>{businessData.footer?.openingHours?.monFri || "Monday – Friday: 8:00 AM – 6:00 PM"}</p>
                        <p>{businessData.footer?.openingHours?.sat || "Saturday: 9:00 AM – 4:00 PM"}</p>
                        <p>{businessData.footer?.openingHours?.sun || "Sunday: Closed"}</p>
                    </div>
                    <div>
                        <p className="font-bold uppercase tracking-widest mb-2 opacity-100">Contact:</p>
                        <p>Phone: {businessData.footer?.contact?.phone || "+1 (123) 456-7890"}</p>
                        <p>Email: {businessData.footer?.contact?.email || "bakery@example.com"}</p>
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-4 text-[10px] opacity-60">
                    {/* Render Socials from Data Array */}
                    {(businessData.footer?.socials || []).map((social, idx) => {
                        let Icon = Instagram;
                        if (social.platform === 'FB') Icon = Facebook;
                        if (social.platform === 'TK') Icon = Twitter; // Mapping TK (TikTok usually) to Twitter icon for now as per previous code, or just generic. Keeping consistent.
                        
                        return (
                            <a 
                                key={idx}
                                href={social.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-6 h-6 rounded-full border border-white flex items-center justify-center hover:bg-white hover:text-[var(--color-primary)] transition-colors"
                            >
                                <Icon className="w-3 h-3" />
                            </a>
                        );
                    })}
                </div>
                
                <p className="text-[10px] mt-4 opacity-50">{businessData.footer.copyright}</p>
            </div>
        </footer>
    );
};
