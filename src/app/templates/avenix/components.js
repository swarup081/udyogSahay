'use client';
import { motion } from 'framer-motion';
import { useCart } from './cartContext.js';
import { useTemplateContext } from './templateContext.js'; // Import the context hook

// --- Reusable SVG Icons ---
export const CartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

export const SocialIcon = ({ platform }) => {
    switch (platform.toLowerCase()) {
        case 'instagram': return <IconInstagram />;
        case 'facebook': return <IconFacebook />;
        case 'youtube': return <IconYouTube />;
        case 'twitter': return <IconTwitter />;
        default: return null;
    }
};

const IconInstagram = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

const IconFacebook = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
);

const IconTwitter = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
    </svg>
);

const IconYouTube = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 11.75a29 29 0 0 0-.46-5.33z"></path>
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
    </svg>
);

// --- Reusable Components ---

export const Header = ({ cartCount, onCartClick }) => {
    // Get business data from context
    const { businessData, basePath } = useTemplateContext();

    const resolveLink = (url) => {
        if (url === undefined || url === null) return "#";
        if (url.startsWith('#') || url.startsWith('http')) return url;
        const path = url.replace('/templates/avenix', '');
        const cleanBasePath = basePath && basePath !== '.' ? basePath : '';
        return `${cleanBasePath}${path}` || '/';
    };

    return (
        <header className="bg-brand-bg/90 backdrop-blur-sm sticky top-0 z-40 w-full font-sans">
            <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 flex justify-between items-center relative">
                {/* Left Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {(Array.isArray(businessData?.navigation?.main) ? businessData.navigation.main : []).map(navItem => (
                        <a key={navItem.label} href={resolveLink(navItem.href)} className="text-sm font-medium tracking-widest uppercase text-brand-text hover:opacity-70 transition-opacity">
                            {navItem.label}
                        </a>
                    ))}
                </nav>
                
                {/* Center Logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <a href={resolveLink("")} className="text-[5vw] md:text-3xl font-bold text-brand-text tracking-wider font-serif">
                        {businessData.logoText}
                    </a>
                </div>
                
                 {/* Right Nav & Icons */}
                <div className="flex-1 flex justify-end items-center gap-4 md:gap-8">
                    <nav className="hidden md:flex items-center gap-8">
                        {(Array.isArray(businessData?.navigation?.secondary) ? businessData.navigation.secondary : []).map(navItem => (
                            <a key={navItem.label} href={resolveLink(navItem.href)} className="text-sm font-medium tracking-widest uppercase text-brand-text hover:opacity-70 transition-opacity">
                                {navItem.label}
                            </a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4 md:gap-6">
                        <button onClick={onCartClick} className="relative text-brand-text hover:opacity-70 transition-opacity">
                            <CartIcon />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-brand-secondary text-brand-bg text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export const BlogCard = ({ post, size = 'small' }) => (
    <div className="group text-left">
        <a 
            href="#" 
            className={`block bg-white overflow-hidden relative rounded-xl md:rounded-2xl 
            ${size === 'small' ? 'aspect-[4/3]' : 'aspect-video'}`} // Dynamic aspect ratio
        >
            <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
        </a>
        <div className="mt-2 md:mt-6">
            <h3 
                className={`font-serif font-medium text-brand-text mt-1 md:mt-2 
                ${size === 'small' ? 'text-[3vw] md:text-3xl' : 'text-[4vw] md:text-4xl'}`} // Dynamic font size
            >
                <a href="#" className="hover:opacity-70">{post.title}</a>
            </h3>
            <p className="text-brand-text opacity-70 text-[2vw] md:text-sm mt-1 md:mt-3 uppercase font-sans tracking-widest">
                {post.date} <span className="mx-1 md:mx-2">•</span> {post.category}
            </p>
        </div>
    </div>
);

// --- DYNAMIC PRODUCT CARD (Avenix Style) ---
export const ProductCard = ({ item, templateName }) => {
    const { addItem } = useCart(); // Get the addItem function from context
    const { businessData, basePath } = useTemplateContext(); // Get businessData from context

    // Check stock: If stock is NOT -1 (unlimited) AND <= 0, it's out of stock.
    const isOutOfStock = item.stock !== -1 && item.stock <= 0;

    const handleAddToCart = (e) => {
        e.preventDefault(); // Stop the link from navigating
        e.stopPropagation(); // Stop any parent link events
        if (!isOutOfStock) {
            addItem(item); // Add this specific item
        }
    };
    
    // Find the category name from the master list
    const category = businessData?.categories?.find(c => c.id === item.category);
    const productUrl = `${basePath && basePath !== '.' ? basePath : ''}/product/${item.id}`;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`group text-center h-full flex flex-col justify-between transition-shadow duration-300 rounded-xl md:rounded-2xl ${isOutOfStock ? 'opacity-75' : ''}`}
        >
            {/* Top section: Image, Title, Price */}
            <div>
                <a href={productUrl} className="block bg-white overflow-hidden relative aspect-[4/5] rounded-xl md:rounded-2xl">
                    <img 
                        src={item.image || item.image_url} 
                        alt={item.name} 
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'grayscale' : ''}`}
                        onError={(e) => e.target.src = 'https://placehold.co/600x750/CCCCCC/909090?text=Image+Missing'}
                    />
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-red-600 text-brand-text px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-lg">
                                Out of Stock
                            </span>
                        </div>
                    )}
                </a>
                <div className="mt-2 md:mt-6 text-center">
                    <a href={productUrl} className="hover:opacity-70">
                        <h3 className="text-[3vw] md:text-lg font-medium text-brand-text font-sans tracking-wider uppercase">{item.name}</h3>
                    </a>
                    {category && (
                        <p className="text-brand-text opacity-50 text-[2vw] md:text-sm mt-0.5 md:mt-1 font-sans">{category.name}</p>
                    )}
                    <p className="text-brand-text text-[2.5vw] md:text-base mt-1 md:mt-2 font-sans">₹{Number(item.price || 0).toFixed(2)}</p>
                </div>
            </div>
            
            {/* --- FIX: Bottom section: Horizontal Buttons (Always visible on mobile & desktop) --- */}
            <div className="mt-2 md:mt-4 px-0 md:px-1 flex gap-1 md:gap-2 opacity-100 pb-2">
                 <a 
                    href={productUrl}
                    className="flex-1 text-center block bg-brand-primary text-brand-text px-2 py-2 md:px-4 md:py-3 font-sans font-medium text-[2vw] md:text-sm uppercase tracking-wider rounded-xl md:rounded-3xl text-center hover:bg-gray-200"
                >
                    View
                </a>
                <button 
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 text-center block px-2 py-2 md:px-4 md:py-3 font-sans font-medium text-[2vw] md:text-sm uppercase tracking-wider rounded-xl md:rounded-3xl text-center ${
                        isOutOfStock 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-brand-secondary text-brand-bg hover:opacity-80'
                    }`}
                >
                    {isOutOfStock ? 'Sold Out' : 'Add'}
                </button>
            </div>
        </motion.div>
    );
};


export const Footer = () => {
    // Get business data from context
    const { businessData, basePath } = useTemplateContext();

    const resolveLink = (url) => {
        if (url === undefined || url === null) return "#";
        if (url.startsWith('#') || url.startsWith('http')) return url;
        const path = url.replace('/templates/avenix', '');
        const cleanBasePath = basePath && basePath !== '.' ? basePath : '';
        return `${cleanBasePath}${path}` || '/';
    };

    return (
        <footer id="contact" className="py-12 md:py-20 pb-8 md:pb-12 bg-brand-secondary text-brand-bg font-sans">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    
                    {/* Column 1: Brand & Socials */}
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="text-[6vw] md:text-3xl font-bold tracking-wider mb-2 md:mb-4 font-serif">{businessData?.footer?.logo}</h3>
                        <p className="text-brand-bg/70 text-[2.5vw] md:text-sm mb-4 md:mb-6">{businessData?.footer?.description}</p>
                        
                        {/* NEW: Social Icons */}
                        <div className="flex items-center gap-4 md:gap-5">
                            {(Array.isArray(businessData?.footer?.socials) ? businessData.footer.socials : []).map((social) => (
                                social.url && social.url !== "#" && (
                                    <a 
                                        key={social.platform} 
                                        href={social.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-brand-bg/70 hover:text-brand-bg transition-colors"
                                    >
                                        <span className="sr-only">{social.platform}</span>
                                        <SocialIcon platform={social.platform} />
                                    </a>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Main Links */}
                    <div>
                        <h4 className="text-[2.5vw] md:text-sm font-semibold mb-2 md:mb-5 uppercase tracking-wider">LINKS</h4>
                        <ul className="space-y-1 md:space-y-3 text-[2.5vw] md:text-sm">
                            {(Array.isArray(businessData?.footer?.links?.main) ? businessData.footer.links.main : []).map(link => (
                                <li key={link.name}>
                                    <a href={resolveLink(link.url)} className="text-brand-bg/70 hover:text-brand-bg transition-colors">{link.name}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Column 3: Utility Links */}
                    <div>
                        <h4 className="text-[2.5vw] md:text-sm font-semibold mb-2 md:mb-5 uppercase tracking-wider">UTILITY PAGES</h4>
                        <ul className="space-y-1 md:space-y-3 text-[2.5vw] md:text-sm">
                            {(Array.isArray(businessData?.footer?.links?.utility) ? businessData.footer.links.utility : []).map(link => (
                                <li key={link.name}>
                                    <a href={resolveLink(link.url)} className="text-brand-bg/70 hover:text-brand-bg transition-colors">{link.name}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Subscribe & Contact */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="text-[2.5vw] md:text-sm font-semibold mb-2 md:mb-5 uppercase tracking-wider">{businessData?.footer?.subscribe?.title}</h4>
                        <form className="flex mb-4 md:mb-6">
                            <input 
                                type="email" 
                                placeholder="Type your email" 
                                className="w-full bg-brand-bg/10 border border-brand-bg/30 py-2 md:py-3 px-3 md:px-4 text-brand-bg placeholder:text-brand-bg/50 focus:ring-0 focus:border-brand-bg outline-none"
                            />
                            <button 
                                type="submit" 
                                className="px-4 md:px-6 py-2 md:py-3 bg-brand-bg text-brand-secondary font-semibold text-[2.5vw] md:text-sm hover:opacity-80"
                            >
                                {businessData?.footer?.subscribe?.cta}
                            </button>
                        </form>
                        
                        <h4 className="text-[2.5vw] md:text-sm font-semibold mt-4 md:mt-8 mb-2 md:mb-4 uppercase tracking-wider">CONTACT</h4>
                        <ul className="space-y-1 md:space-y-2 text-brand-bg/70 text-[2.5vw] md:text-sm">
                            <li>{businessData?.footer?.contact?.phone}</li>
                            <li>{businessData?.footer?.contact?.email}</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Footer Bar */}
                <div className="text-center border-t border-brand-bg/20 mt-8 md:mt-16 pt-4 md:pt-8 text-[2vw] md:text-sm">
                    <p className="text-brand-bg/70">{"© " + new Date().getFullYear() + " " + (businessData?.logoText || businessData?.name || "Store") + ". All Rights Reserved."}</p>
                </div>
            </div>
        </footer>
    );
};