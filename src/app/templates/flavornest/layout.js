'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { businessData as initialBusinessData } from './data.js';
import { Header, Footer } from './components.js';
import { CartProvider, useCart } from './cartContext.js';
import { TemplateContext } from './templateContext.js';
import { Editable } from '@/components/editor/Editable';
import AnalyticsTracker from '@/components/dashboard/analytics/AnalyticsTracker';
import WhatsAppButton from '@/components/WhatsAppButton';
import OfferPopup from '@/components/editor/OfferPopup';
import { getBasePath } from '@/app/templates/getBasePath';
import { replaceTemplateName } from '@/lib/templates/replaceTemplateName';

function FlavorNestLayout({ children, serverData, websiteId }) { // 1. Accept serverData
    // Apply business name replacement on init
    const initialData = (() => {
        const data = serverData || initialBusinessData;
        const businessName = data.name || data.logoText;
        if (businessName && serverData) {
            return replaceTemplateName(data, 'flavornest', businessName);
        }
        return data;
    })();
    const [businessData, setBusinessData] = useState(initialData); // 2. Use serverData
    const router = useRouter();
    const pathname = usePathname();

    const basePath = getBasePath('flavornest', serverData, pathname);
    
    const { 
        cartCount, 
        isCartOpen, 
        closeCart, 
        openCart, 
        showToast,
        cartDetails,
        subtotal,
        shipping,
        total,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart
    } = useCart();

    useEffect(() => {
        if (serverData) return; // 3. Add this line

        document.body.style.fontFamily = `'${businessData.theme.font.body}', sans-serif`;
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.style.fontFamily = `'${businessData.theme.font.heading}', sans-serif`;
        });

        document.body.classList.forEach(className => {
            if (className.startsWith('theme-')) {
                document.body.classList.remove(className);
            }
        });
        document.body.classList.add(`theme-${businessData.theme.colorPalette}`);

        // --- NEW CONTEXT-AWARE LOGIC ---
        let parentPath = '';
        try {
            parentPath = window.parent.location.pathname;
        } catch (e) {
            // Not in an iframe
        }

        const isEditor = parentPath.startsWith('/editor/') || parentPath.startsWith('/dashboard/website');
        const isPreview = parentPath.startsWith('/preview/');
        const isLiveSite = !isEditor && !isPreview;

        if (isEditor) {
            // --- 1. We are in the EDITOR's iframe ---
            const handleMessage = (event) => {
                if (event.data.type === 'UPDATE_DATA') {
                    setBusinessData(event.data.payload);
                }
                if (event.data.type === 'SCROLL_TO_SECTION') {
                    const element = document.getElementById(event.data.payload.sectionId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                if (event.data.type === 'CHANGE_PAGE') {
                    router.push(event.data.payload.path);
                }
            };
            window.addEventListener('message', handleMessage);
            window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
            return () => window.removeEventListener('message', handleMessage);
        
        } else if (isPreview) {
            // --- 2. We are in the PREVIEW's iframe ---
            const editorDataKey = `editorData_flavornest`; // Template-specific key
            const savedData = localStorage.getItem(editorDataKey);
            
            if (savedData) {
                try {
                    setBusinessData(JSON.parse(savedData));
                } catch (e) {
                    console.error("Error parsing preview data", e);
                }
            }
        
        } else if (isLiveSite) {
            // --- 3. We are on the LIVE site ---
            // Business name replacement is handled at init via replaceTemplateName
        }
        // --- END OF NEW LOGIC ---

        return () => {
            headings.forEach(heading => heading.style.fontFamily = '');
            document.body.style.fontFamily = '';
            document.body.classList.remove(`theme-${businessData.theme.colorPalette}`);
        };
    }, [businessData.theme.font.body, businessData.theme.font.heading, businessData.theme.colorPalette, router, serverData]); // 4. Add serverData

    const createFontVariable = (fontName) => `var(--font-${fontName.toLowerCase().replace(' ', '-')})`;
    
    const fontVariables = {
        '--font-heading': createFontVariable(businessData.theme.font.heading),
        '--font-body': createFontVariable(businessData.theme.font.body),
    };

    const themeClassName = `theme-${businessData.theme.colorPalette}`;
    
    return (
        <TemplateContext.Provider value={{ businessData, setBusinessData, websiteId, basePath }}>
            <div 
              className={`antialiased font-sans bg-brand-bg text-brand-text ${themeClassName}`}
              style={fontVariables}
            >
                <AnalyticsTracker websiteId={websiteId} />
            <OfferPopup websiteId={websiteId} websiteData={businessData} />
                <Header 
                    business={{ 
                        logoText: businessData.logoText, 
                        logo: businessData.logo, 
                        navigation: businessData.navigation 
                    }} 
                    cartCount={cartCount}
                    onCartClick={openCart}
                />

                <main>
                    {children}
                </main>
                
                <Editable focusId="footer">
                    <Footer />
                </Editable>

                {isCartOpen && (
                    <div className="modal fixed inset-0 bg-gray-900/50 flex justify-end z-50" onClick={closeCart}>
                        <div className="bg-white w-full max-w-md h-full p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b border-brand-primary/20 pb-4">
                                <h2 className="text-2xl font-serif font-bold text-brand-text">Your Cart ({cartCount})</h2>
                                <button onClick={closeCart} className="text-3xl text-brand-text/50 hover:text-brand-text">&times;</button>
                            </div>
                            
                            {cartDetails.length === 0 ? (
                                <div className="flex-grow flex flex-col items-center justify-center">
                                    <p className="text-brand-text/70 mt-4 text-center py-8">Your cart is currently empty.</p>
                                    <a 
                                        href={`${basePath}/shop`}
                                        onClick={closeCart}
                                        className="w-full text-center inline-block btn btn-primary px-6 py-3"
                                    >
                                        Continue Shopping
                                    </a>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-grow py-4 space-y-4 overflow-y-auto">
                                        {cartDetails.map(item => (
                                            <div key={item.id} className="flex items-center gap-4">
                                                <img src={item.image} alt={item.name} className="w-16 h-20 object-cover bg-brand-primary rounded" />
                                                <div className="flex-grow">
                                                    <h3 className="font-semibold text-brand-text">{item.name}</h3>
                                                    <p className="text-sm text-brand-text/70">₹{item.price.toFixed(2)}</p>
                                                    <div className="flex items-center border border-brand-text/30 w-fit mt-2 rounded">
                                                        <button onClick={() => decreaseQuantity(item.id)} className="w-8 h-8 text-lg text-brand-text/70 hover:bg-brand-primary">-</button>
                                                        <span className="w-8 h-8 flex items-center justify-center text-sm font-bold">{item.quantity}</span>
                                                        <button onClick={() => increaseQuantity(item.id)} className="w-8 h-8 text-lg text-brand-text/70 hover:bg-brand-primary">+</button>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-brand-text">₹{(item.price * item.quantity).toFixed(2)}</p>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:text-red-700 mt-1">Remove</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-brand-primary/20 pt-4 space-y-2">
                                        <div className="flex justify-between text-brand-text/80 font-medium">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-brand-text/80 font-medium">
                                            <span>Shipping</span>
                                            <span>₹{shipping.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-brand-text font-bold text-lg pt-2 border-t border-brand-primary/20 mt-2">
                                            <span>Total</span>
                                            <span>₹{total.toFixed(2)}</span>
                                        </div>
                                        <p className="text-xs text-brand-text/60">Shipping & taxes calculated at checkout.</p>
                                        
                                        <a 
                                            href={`${basePath}/checkout`}
                                            onClick={closeCart}
                                            className="mt-4 w-full text-center inline-block btn btn-primary px-6 py-3"
                                        >
                                            Go to Checkout
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                <div className={`fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    Item added to cart!
                </div>
                <WhatsAppButton businessData={businessData} />
            </div>
        </TemplateContext.Provider>
    );
}

// 5. Accept serverData
export default function RootLayout({ children, serverData, websiteId }) {
    return (
        <CartProvider>
            {/* 6. Pass serverData down */}
            <FlavorNestLayout serverData={serverData} websiteId={websiteId}>{children}</FlavorNestLayout>
        </CartProvider>
    );
}