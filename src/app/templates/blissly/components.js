'use client';
import { useCart } from './cartContext.js';
import { useTemplateContext } from './templateContext.js';
import { motion } from 'framer-motion';

// --- Reusable SVG Icons ---
export const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#F5A623]">
        <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.83 4.426 4.894.71c.848.124 1.186 1.158.57 1.753l-3.54 3.45.836 4.874c.144.843-.735 1.49-1.493 1.099L10 16.54l-4.389 2.296c-.758.39-1.637-.256-1.493-1.099l.836-4.874-3.54-3.45c-.616-.595-.278-1.629.57-1.753l4.894-.71L9.132 2.884Z" clipRule="evenodd" />
    </svg>
);

export const ArrowRightIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ml-2 ${className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
    </svg>
);

export const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.211-1.01-.56-1.368l-1.928-1.928a2.25 2.25 0 0 0-3.182 0l-1.17 1.17-1.414-1.414 1.17-1.17a2.25 2.25 0 0 0 0-3.182L9.118 5.66c-.358-.358-.852-.56-1.368-.56H6.375a2.25 2.25 0 0 0-2.25 2.25Z" />
    </svg>
);

export const EmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
);

export const MapPinIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
);

export const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-brand-text/40 hover:text-brand-text transition-colors">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);
export const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-brand-text/40 hover:text-brand-text transition-colors">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

export const CartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
    </svg>
);


// --- Header Component ---
export const Header = ({ business, cartCount, onCartClick }) => {
    const { basePath } = useTemplateContext();

    const resolveLink = (url) => {
        if (url === undefined || url === null) return "#";
        if (url.startsWith('#') || url.startsWith('http')) return url;
        const path = url.replace('/templates/blissly', '');
        const cleanBasePath = basePath && basePath !== '.' ? basePath : '';
        return `${cleanBasePath}${path}` || '/';
    };

    return (
    <header className="bg-brand-bg sticky top-0 z-40 w-full font-sans border-b border-brand-primary/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center relative">
            {/* Left Nav */}
            <nav className="hidden md:flex items-center gap-6">
                {(Array.isArray(business?.navigation) ? business.navigation : []).map(navItem => (
                    <a key={navItem.label} href={resolveLink(navItem.href)} className="text-sm font-medium tracking-wide text-brand-text hover:opacity-70 transition-opacity">
                        {navItem.label}
                    </a>
                ))}
            </nav>
            
            {/* Center Logo - Scaled Text on Mobile */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <a href={resolveLink("")} className="text-[5vw] md:text-3xl font-bold text-brand-text tracking-wider font-serif whitespace-nowrap">
                    {business.logoText}
                </a>
            </div>
            
             {/* Right Nav & Icons */}
            <div className="flex-1 flex justify-end items-center gap-6">
                 <a href={resolveLink(business?.headerButton?.href)} className="hidden lg:inline-block bg-brand-secondary text-brand-bg px-6 py-3 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                    {business?.headerButton?.text}
                </a>
                <button onClick={onCartClick} className="relative text-brand-text hover:text-brand-secondary transition-colors">
                    <CartIcon />
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-brand-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    </header>
);
};
// --- Product Card Component ---
export const ProductCard = ({ item, templateName }) => {
    const { addItem } = useCart();
    const { businessData, basePath } = useTemplateContext();
    
    // Check stock: If stock is NOT -1 (unlimited) AND <= 0, it's out of stock.
    const isOutOfStock = item.stock !== -1 && item.stock <= 0;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOutOfStock) {
            addItem(item);
        }
    };
    
    const category = (Array.isArray(businessData?.categories) ? businessData.categories : []).find(c => c.id === item.category);
    const productUrl = `${basePath && basePath !== '.' ? basePath : ''}/product/${item.id}`;

    return (
        <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            className={`group h-full flex flex-col border border-brand-primary/50 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md ${isOutOfStock ? 'opacity-75' : ''}`}
        >
            
            {/* Image */}
            <a href={productUrl} className="block aspect-[4/5] bg-brand-primary overflow-hidden relative">
                <img 
                    src={item.image || item.image_url} 
                    alt={item.name} 
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'grayscale' : ''}`}
                    onError={(e) => e.target.src = 'https://placehold.co/600x750/CCCCCC/909090?text=Image+Missing'}
                />
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-400 text-brand-text px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-lg">
                            Out of Stock
                        </span>
                    </div>
                )}
            </a>
            
            {/* Content Area */}
            <div className="p-3 md:p-4 flex flex-col flex-grow">
                <div className="flex-grow">
                    {category && (
                        <p className="text-brand-text/60 text-[2vw] md:text-sm truncate">{category.name}</p>
                    )}
                    <h4 className="text-[3vw] md:text-xl font-bold text-brand-text font-serif mt-1">
                        <a href={productUrl} className="hover:text-brand-secondary line-clamp-1">{item.name}</a>
                    </h4>
                    <p className="text-brand-secondary text-[2.5vw] md:text-lg font-medium mt-1">₹{Number(item.price || 0).toFixed(2)}</p>
                </div>

                {/* Actions (Always visible) */}
                <div className="mt-2 md:mt-4 flex gap-2">
                     <a 
                        href={productUrl}
                        className="flex-1 bg-brand-primary text-brand-text px-2 py-2 md:px-4 md:py-2.5 font-semibold text-[2vw] md:text-sm rounded-md hover:bg-brand-secondary/20 transition-colors text-center flex items-center justify-center"
                    >
                        View
                    </a>
                    <button 
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`flex-1 px-2 py-2 md:px-4 md:py-2.5 font-semibold text-[2vw] md:text-sm rounded-md transition-opacity whitespace-nowrap ${
                            isOutOfStock 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-brand-secondary text-brand-bg hover:opacity-90'
                        }`}
                    >
                        {isOutOfStock ? 'Sold Out' : 'Add'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};


// --- Footer Component ---
export const Footer = () => {
    const { businessData, basePath } = useTemplateContext();

    const resolveLink = (url) => {
        if (url === undefined || url === null) return "#";
        if (url.startsWith('#') || url.startsWith('http')) return url;
        const path = url.replace('/templates/blissly', '');
        const cleanBasePath = basePath && basePath !== '.' ? basePath : '';
        return `${cleanBasePath}${path}` || '/';
    };

    if (!businessData?.footer) {
        return <footer id="contact" className="py-20 pb-12 bg-brand-bg text-brand-text border-t border-brand-primary/50"></footer>;
    }

    return (
        <footer id="contact" className="py-12 md:py-20 pb-8 md:pb-12 bg-brand-bg text-brand-text border-t border-brand-primary/50">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    
                    {/* Column 1: Subscribe & Contact */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="text-[4vw] md:text-lg font-bold font-serif mb-4">{businessData.footer.promoTitle}</h4>
                        <form className="flex mb-6">
                            <input 
                                type="email" 
                                placeholder="Email" 
                                className="w-full bg-brand-primary border border-brand-secondary/30 py-2 md:py-3 px-3 md:px-4 text-[2.5vw] md:text-base text-brand-text placeholder:text-brand-text/50 focus:ring-0 focus:border-brand-secondary outline-none rounded-l-md"
                            />
                            <button 
                                type="submit" 
                                className="px-3 md:px-4 py-2 md:py-3 bg-brand-secondary text-brand-bg font-semibold text-sm rounded-r-md hover:opacity-90"
                            >
                                <ArrowRightIcon className="ml-0 w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </form>
                        <ul className="space-y-2 text-brand-text/80 text-[2.5vw] md:text-sm">
                            <li className="flex items-center"><PhoneIcon /> {businessData.footer.contact?.phone}</li>
                            <li className="flex items-center"><EmailIcon /> {businessData.footer.contact?.email}</li>
                        </ul>
                    </div>

                    {/* Column 2: Page Links */}
                    <div>
                        <h4 className="text-[2.5vw] md:text-sm font-semibold mb-3 md:mb-5 uppercase tracking-wider">Page Links</h4>
                        <ul className="space-y-2 md:space-y-3 text-[2.5vw] md:text-sm">
                            {(Array.isArray(businessData?.footer?.links?.pages) ? businessData.footer.links.pages : []).map(link => (
                                <li key={link.name}>
                                    <a href={resolveLink(link.url)} className="text-brand-text/70 hover:text-brand-text transition-colors">{link.name}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Column 3: Utility Links */}
                    <div>
                        <h4 className="text-[2.5vw] md:text-sm font-semibold mb-3 md:mb-5 uppercase tracking-wider">Utility Links</h4>
                        <ul className="space-y-2 md:space-y-3 text-[2.5vw] md:text-sm">
                            {(Array.isArray(businessData?.footer?.links?.utility) ? businessData.footer.links.utility : []).map(link => (
                                <li key={link.name}>
                                    <a href={resolveLink(link.url)} className="text-brand-text/70 hover:text-brand-text transition-colors">{link.name}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Location */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="text-[2.5vw] md:text-sm font-semibold mb-3 md:mb-5 uppercase tracking-wider">{businessData.footer.location?.title}</h4>
                        <p className="text-brand-text/70 text-[2.5vw] md:text-sm mb-4 flex">
                            <MapPinIcon className="flex-shrink-0 mt-1"/>
                            <span>{businessData.footer.location?.address}</span>
                        </p>
                        <h5 className="text-[2.5vw] md:text-sm font-semibold mt-4 md:mt-6 mb-2 uppercase tracking-wider">Opening hours</h5>
                        <p className="text-brand-text/70 text-[2.5vw] md:text-sm whitespace-pre-line">{businessData.footer.location?.hours}</p>
                    </div>
                </div>

                {/* Bottom Footer Bar */}
                <div className="text-center border-t border-brand-primary/50 mt-8 md:mt-16 pt-4 md:pt-8 text-[2vw] md:text-sm">
                    <p className="text-brand-text/70">{businessData.footer.copyright}</p>
                </div>
            </div>
        </footer>
    );
};
