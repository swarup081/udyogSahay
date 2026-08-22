'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { businessData as initialBusinessData } from './data.js';
import { Header, Footer, CartIcon } from './components.js';
import { CartProvider, useCart } from './cartContext.js';
import { TemplateContext } from './templateContext.js';
import { Editable } from '@/components/editor/Editable';
import AnalyticsTracker from '@/components/dashboard/analytics/AnalyticsTracker';
import WhatsAppButton from '@/components/WhatsAppButton';
import OfferPopup from '@/components/editor/OfferPopup';
import { getBasePath } from '@/app/templates/getBasePath';

function CartLayout({ children, serverData, websiteId }) { // 1. Accept serverData
    const [businessData, setBusinessData] = useState(serverData || initialBusinessData); // 2. Use serverData
    const router = useRouter();
    const pathname = usePathname();

    const basePath = getBasePath('blissly', serverData, pathname);
    
    const { 
        cartCount, 
        isCartOpen, 
        closeCart, 
        openCart, 
        cartDetails, 
        subtotal,
        shipping,
        total,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        showToast
    } = useCart();

    useEffect(() => {
        if (serverData) return; // 3. Add this line

        document.body.style.fontFamily = `'${businessData.theme.font.body}', sans-serif`;
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.style.fontFamily = `'${businessData.theme.font.heading}', serif`;
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
            const editorDataKey = `editorData_blissly`; // Template-specific key
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
            const storedStoreName = localStorage.getItem('storeName');
            if (storedStoreName) {
                setBusinessData(prevData => ({
                    ...prevData,
                    name: storedStoreName,
                    logoText: storedStoreName,
                    footer: {
                        ...prevData.footer,
                        copyright: `© ${new Date().getFullYear()} ${storedStoreName}. All RightsReserved.`
                    }
                }));
            }
        }
        // --- END OF NEW LOGIC ---

        return () => {
            headings.forEach(heading => heading.style.fontFamily = '');
            document.body.style.fontFamily = '';
            document.body.classList.remove(`theme-${businessData.theme.colorPalette}`);
        };
    }, [businessData.theme.font.body, businessData.theme.font.heading, businessData.theme.colorPalette, router, serverData]); // 4. Add serverData

    const createFontVariable = (fontName) => `var(--font-${fontName.toLowerCase().replace(/ /g, '-')})`;
    
    const fontVariables = {
        '--font-heading': createFontVariable(businessData.theme.font.heading),
        '--font-body': createFontVariable(businessData.theme.font.body),
    };

    const themeClassName = `theme-${businessData.theme.colorPalette}`;
    
    return (
        <TemplateContext.Provider value={{ businessData, setBusinessData, websiteId, basePath }}>
            <div 
              className={`antialiased bg-brand-bg text-brand-text ${themeClassName} font-sans`}
              style={fontVariables}
            >
                <AnalyticsTracker websiteId={websiteId} />
            <OfferPopup websiteId={websiteId} websiteData={businessData} />
                <Header 
                    business={{ 
                        logoText: businessData.logoText, 
                        navigation: businessData.navigation,
                        headerButton: businessData.headerButton 
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
                    <div className="modal fixed inset-0 bg-black/50 flex justify-end z-50" onClick={closeCart}>
                        <div className="bg-brand-bg w-full max-w-lg h-full p-8 flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b border-brand-primary pb-4">
                                <h2 className="text-2xl font-serif font-medium text-brand-text">Your Cart ({cartCount})</h2>
                                <button onClick={closeCart} className="text-3xl text-brand-text/50 hover:text-brand-text">&times;</button>
                            </div>
                            
                            {cartDetails.length === 0 ? (
                                <div className="flex-grow flex flex-col items-center justify-center">
                                    <p className="text-brand-text/70 text-center py-8">Your cart is empty.</p>
                                    <a 
                                        href={`${basePath}/shop`}
                                        onClick={closeCart}
                                        className="w-full text-center inline-block bg-brand-primary border border-brand-text/10 text-brand-text px-6 py-3 font-medium rounded-lg"
                                    >
                                        Continue Shopping
                                    </a>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-grow py-6 space-y-6 overflow-y-auto">
                                        {cartDetails.map(item => (
                                            <div key={item.id} className="flex items-center gap-4">
                                                <a href={`/templates/blissly/product/${item.id}`} className="block w-20 h-24 bg-brand-primary rounded-lg overflow-hidden">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                </a>
                                                <div className="flex-grow">
                                                    <a href={`/templates/blissly/product/${item.id}`} className="font-serif font-bold text-lg text-brand-text hover:text-brand-secondary">{item.name}</a>
                                                    <p className="text-sm text-brand-text/60 mt-1">₹{Number(item.price || 0).toFixed(2)}</p>
                                                    <div className="flex items-center border border-brand-text/20 w-fit mt-2 rounded-md">
                                                        <button onClick={() => decreaseQuantity(item.id)} className="w-8 h-8 text-lg text-brand-text/70 hover:bg-brand-primary rounded-l-md">-</button>
                                                        <span className="w-8 h-8 flex items-center justify-center text-sm font-bold">{item.quantity}</span>
                                                        <button onClick={() => increaseQuantity(item.id)} className="w-8 h-8 text-lg text-brand-text/70 hover:bg-brand-primary rounded-r-md">+</button>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-sans font-medium text-brand-text">₹{Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-brand-text/50 hover:text-brand-secondary mt-1">Remove</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-brand-primary pt-6 space-y-4">
                                        <div className="flex justify-between text-brand-text/80 font-medium">
                                            <span>Subtotal</span>
                                            <span>₹{Number(subtotal || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-brand-text/80 font-medium">
                                            <span>Shipping</span>
                                            <span>₹{Number(shipping || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-brand-text font-bold text-xl border-t border-brand-primary pt-4 mt-4">
                                            <span>Total</span>
                                            <span>₹{Number(total || 0).toFixed(2)}</span>
                                        </div>
                                        <a 
                                            href={`${basePath}/checkout`}
                                            onClick={closeCart}
                                            className="mt-4 w-full text-center inline-block bg-brand-secondary text-brand-bg px-6 py-4 font-medium tracking-wide rounded-lg"
                                        >
                                            Proceed to Checkout
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                <div className={`fixed bottom-8 right-8 z-50 bg-brand-text text-brand-bg px-5 py-3 shadow-lg transition-all duration-300 rounded-lg ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}>
                    Item added to cart!
                </div>
            </div>
        </TemplateContext.Provider>
    );
}

// 5. Accept serverData
export default function BlisslyLayout({ children, serverData, websiteId }) {
    // FIX: Render TemplateContext.Provider -> CartProvider -> Content
    // We cannot use CartProvider inside BlisslyLayout if it uses context provided by BlisslyLayout's logic.
    // However, CartLayout logic defines the state.
    // Solution: Lift state provider logic out, similar to Avenix.
    
    return (
        <BlisslyStateProvider serverData={serverData} websiteId={websiteId}>
            <CartProvider>
                <BlisslyContent>{children}</BlisslyContent>
            </CartProvider>
        </BlisslyStateProvider>
    );
}

// Wrapper to Provide State & Context
function BlisslyStateProvider({ children, serverData, websiteId }) {
    const [businessData, setBusinessData] = useState(serverData || initialBusinessData); 

    const pathname = usePathname();
    const basePath = getBasePath('blissly', serverData, pathname);
const router = useRouter();

    useEffect(() => {
        if (serverData) return;
        let parentPath = '';
        try { parentPath = window.parent.location.pathname; } catch (e) { }
        const isEditor = parentPath.startsWith('/editor/') || parentPath.startsWith('/dashboard/website');
        const isPreview = parentPath.startsWith('/preview/');

        if (isEditor) {
            const handleMessage = (event) => {
                if (event.data.type === 'UPDATE_DATA') setBusinessData(event.data.payload);
                if (event.data.type === 'SCROLL_TO_SECTION') {
                    const element = document.getElementById(event.data.payload.sectionId);
                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                if (event.data.type === 'CHANGE_PAGE') router.push(event.data.payload.path);
            };
            window.addEventListener('message', handleMessage);
            window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
            return () => window.removeEventListener('message', handleMessage);
        } else if (isPreview) {
            const savedData = localStorage.getItem(`editorData_blissly`);
            if (savedData) {
                try { setBusinessData(JSON.parse(savedData)); } catch (e) {}
            }
        }
    }, [router, serverData]);

    return (
        <TemplateContext.Provider value={{ businessData, setBusinessData, websiteId, basePath }}>
            {children}
        </TemplateContext.Provider>
    );
}

function BlisslyContent({ children }) {
    const { businessData, websiteId , basePath } = useContext(TemplateContext);
    const { 
        cartCount, 
        isCartOpen, 
        closeCart, 
        openCart, 
        cartDetails, 
        subtotal,
        shipping,
        total,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        showToast
    } = useCart();

    // Font variables and styling logic moved here
    useEffect(() => {
        document.body.style.fontFamily = `'${businessData.theme.font.body}', sans-serif`;
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.style.fontFamily = `'${businessData.theme.font.heading}', serif`;
        });

        document.body.classList.forEach(className => {
            if (className.startsWith('theme-')) {
                document.body.classList.remove(className);
            }
        });
        document.body.classList.add(`theme-${businessData.theme.colorPalette}`);

        return () => {
            headings.forEach(heading => heading.style.fontFamily = '');
            document.body.style.fontFamily = '';
            document.body.classList.remove(`theme-${businessData.theme.colorPalette}`);
        };
    }, [businessData]);

    const createFontVariable = (fontName) => `var(--font-${fontName.toLowerCase().replace(/ /g, '-')})`;
    
    const fontVariables = {
        '--font-heading': createFontVariable(businessData.theme.font.heading),
        '--font-body': createFontVariable(businessData.theme.font.body),
    };

    const themeClassName = `theme-${businessData.theme.colorPalette}`;

    return (
        <div 
            className={`antialiased bg-brand-bg text-brand-text ${themeClassName} font-sans`}
            style={fontVariables}
        >
            <AnalyticsTracker websiteId={websiteId} />
            <OfferPopup websiteId={websiteId} websiteData={businessData} />
            <Header 
                business={{ 
                    logoText: businessData.logoText, 
                    navigation: businessData.navigation,
                    headerButton: businessData.headerButton 
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
                <div className="modal fixed inset-0 bg-black/50 flex justify-end z-50" onClick={closeCart}>
                    <div className="bg-brand-bg w-full max-w-lg h-full p-8 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-brand-primary pb-4">
                            <h2 className="text-2xl font-serif font-medium text-brand-text">Your Cart ({cartCount})</h2>
                            <button onClick={closeCart} className="text-3xl text-brand-text/50 hover:text-brand-text">&times;</button>
                        </div>
                        
                        {cartDetails.length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center">
                                <p className="text-brand-text/70 text-center py-8">Your cart is empty.</p>
                                <a 
                                    href={`${basePath}/shop`}
                                    onClick={closeCart}
                                    className="w-full text-center inline-block bg-brand-primary border border-brand-text/10 text-brand-text px-6 py-3 font-medium rounded-lg"
                                >
                                    Continue Shopping
                                </a>
                            </div>
                        ) : (
                            <>
                                <div className="flex-grow py-6 space-y-6 overflow-y-auto">
                                    {cartDetails.map(item => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <a href={`/templates/blissly/product/${item.id}`} className="block w-20 h-24 bg-brand-primary rounded-lg overflow-hidden">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </a>
                                            <div className="flex-grow">
                                                <a href={`/templates/blissly/product/${item.id}`} className="font-serif font-bold text-lg text-brand-text hover:text-brand-secondary">{item.name}</a>
                                                <p className="text-sm text-brand-text/60 mt-1">₹{Number(item.price || 0).toFixed(2)}</p>
                                                <div className="flex items-center border border-brand-text/20 w-fit mt-2 rounded-md">
                                                    <button onClick={() => decreaseQuantity(item.id)} className="w-8 h-8 text-lg text-brand-text/70 hover:bg-brand-primary rounded-l-md">-</button>
                                                    <span className="w-8 h-8 flex items-center justify-center text-sm font-bold">{item.quantity}</span>
                                                    <button onClick={() => increaseQuantity(item.id)} className="w-8 h-8 text-lg text-brand-text/70 hover:bg-brand-primary rounded-r-md">+</button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-sans font-medium text-brand-text">₹{Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                                                <button onClick={() => removeFromCart(item.id)} className="text-xs text-brand-text/50 hover:text-brand-secondary mt-1">Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-brand-primary pt-6 space-y-4">
                                    <div className="flex justify-between text-brand-text/80 font-medium">
                                        <span>Subtotal</span>
                                        <span>₹{Number(subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-brand-text/80 font-medium">
                                        <span>Shipping</span>
                                        <span>₹{Number(shipping || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-brand-text font-bold text-xl border-t border-brand-primary pt-4 mt-4">
                                        <span>Total</span>
                                        <span>₹{Number(total || 0).toFixed(2)}</span>
                                    </div>
                                    <a 
                                        href={`${basePath}/checkout`}
                                        onClick={closeCart}
                                        className="mt-4 w-full text-center inline-block bg-brand-secondary text-brand-bg px-6 py-4 font-medium tracking-wide rounded-lg"
                                    >
                                        Proceed to Checkout
                                    </a>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            <div className={`fixed bottom-8 right-8 z-50 bg-brand-text text-brand-bg px-5 py-3 shadow-lg transition-all duration-300 rounded-lg ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}>
                Item added to cart!
            </div>
            <WhatsAppButton businessData={businessData} />
        </div>
    );
}
