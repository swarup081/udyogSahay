'use client';
import { useState, useEffect, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { businessData as initialBusinessData } from './data.js';
import { Header, Footer } from './components.js';
import { CartProvider, useCart } from './cartContext.js';
import { TemplateContext } from './templateContext.js';
import { Editable } from '@/components/editor/Editable';
import AnalyticsTracker from '@/components/dashboard/analytics/AnalyticsTracker';
import { X, Minus, Plus } from 'lucide-react'; // Added icons
import { colorPalettes } from '@/components/editor/EditorSidebar';
import WhatsAppButton from '@/components/WhatsAppButton';
import OfferPopup from '@/components/editor/OfferPopup';
import { getBasePath } from '@/app/templates/getBasePath';

function CartLayout({ children, serverData, websiteId }) {
    const [businessData, setBusinessData] = useState(serverData || initialBusinessData);
    const { basePath } = useContext(TemplateContext);
    
    // Get data from the NEW context
    const { 
        isCartOpen, 
        closeCart, 
        cartDetails, 
        total, 
        increaseQuantity, 
        decreaseQuantity, 
        removeFromCart 
    } = useCart();

    useEffect(() => {
        if (serverData) return;
        let parentPath = '';
        try { parentPath = window.parent.location.pathname; } catch (e) {}
        const isEditor = parentPath.startsWith('/editor/') || parentPath === '/';
        
        if (isEditor) {
             const handleMessage = (event) => {
                if (event.data.type === 'UPDATE_DATA') setBusinessData(event.data.payload);
            };
            window.addEventListener('message', handleMessage);
            window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
            return () => window.removeEventListener('message', handleMessage);
        }
    }, [serverData]);

    return (
        <TemplateContext.Provider value={{ businessData, setBusinessData, websiteId, basePath }}>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Quicksand:wght@300;400;500;600;700&display=swap');
                :root {
                    --color-bg: #FFFFFF;         
                    --color-primary: #592E4F;    
                    --color-secondary: #9E5A85;  
                    --color-accent: #DFA8B7;     
                    --color-surface: #F9F4F6;    
                    --font-serif: 'DM Serif Display', serif;
                    --font-sans: 'Quicksand', sans-serif;
                }
                body {
                    font-family: var(--font-sans);
                    color: var(--color-primary);
                    background-color: var(--color-bg);
                    overflow-x: hidden;
                }
                h1, h2, h3, h4, h5, h6 { font-family: var(--font-serif); }
            `}</style>

            <div className="antialiased min-h-screen flex flex-col relative">
                <Header />
                <main className="flex-grow pt-24">{children}</main>
                <Editable focusId="footer"><Footer /></Editable>

                {/* --- CART DRAWER --- */}
                <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isCartOpen ? 'visible' : 'invisible'}`}>
                    {/* Backdrop */}
                    <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeCart} />
                    
                    {/* Drawer Panel */}
                    <div className={`absolute right-0 top-0 h-full w-full max-w-[400px] bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                        
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <h2 className="text-2xl font-serif text-[var(--color-primary)]">Your Basket</h2>
                            <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"><X size={20}/></button>
                        </div>

                        {/* Drawer Items */}
                        <div className="flex-grow overflow-y-auto p-6 space-y-6">
                            {cartDetails.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">🧺</div>
                                    <p>Your basket is empty</p>
                                    <button onClick={closeCart} className="text-[var(--color-secondary)] underline text-sm">Continue Shopping</button>
                                </div>
                            ) : (
                                cartDetails.map(item => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="w-20 h-20 rounded-xl bg-[#F9F4F6] overflow-hidden flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between py-1">
                                            <div>
                                                <h4 className="font-serif text-[var(--color-primary)] text-lg leading-tight">{item.name}</h4>
                                                <p className="text-sm font-bold text-[var(--color-secondary)]">₹{Number(item.price || 0).toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border border-gray-200 rounded-full px-2 py-0.5">
                                                    <button onClick={() => decreaseQuantity(item.id)} className="p-1 hover:text-[var(--color-secondary)]"><Minus size={12}/></button>
                                                    <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => increaseQuantity(item.id)} className="p-1 hover:text-[var(--color-secondary)]"><Plus size={12}/></button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-xs text-gray-400 hover:text-red-500 underline">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Drawer Footer */}
                        {cartDetails.length > 0 && (
                            <div className="p-6 border-t border-gray-100 bg-[#F9F4F6]">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-gray-500 uppercase tracking-widest font-bold">Total</span>
                                    <span className="text-3xl font-serif text-[var(--color-primary)]">₹{Number(total || 0).toFixed(2)}</span>
                                </div>
                                <a href={`${basePath}/checkout`} className="block w-full bg-[var(--color-primary)] text-white text-center py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-[var(--color-secondary)] transition-colors shadow-lg">
                                    Proceed to Checkout
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TemplateContext.Provider>
    );
}

export default function FrostifyLayout({ children, serverData, websiteId }) {
    return (
        <FrostifyStateProvider serverData={serverData} websiteId={websiteId}>
            <CartProvider>
                <FrostifyContent>{children}</FrostifyContent>
            </CartProvider>
        </FrostifyStateProvider>
    );
}

// Wrapper to Provide State & Context
function FrostifyStateProvider({ children, serverData, websiteId }) {
    const [businessData, setBusinessData] = useState(serverData || initialBusinessData); 

    const pathname = usePathname();
    const basePath = getBasePath('frostify', serverData, pathname);
const router = useRouter();

    useEffect(() => {
        if (serverData) return;
        let parentPath = '';
        try { parentPath = window.parent.location.pathname; } catch (e) { }
        const isEditor = parentPath.startsWith('/editor/') || parentPath.startsWith('/dashboard/website') || parentPath === '/';
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
            const savedData = localStorage.getItem(`editorData_frostify`);
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

function FrostifyContent({ children }) {
    const { businessData, websiteId , basePath } = useContext(TemplateContext);
    const { 
        isCartOpen, 
        closeCart, 
        cartDetails, 
        total, 
        increaseQuantity, 
        decreaseQuantity, 
        removeFromCart 
    } = useCart();

    // Theme Logic
    const activePalette = useMemo(() => {
        return colorPalettes.find(p => p.class === businessData?.theme?.colorPalette) || null;
    }, [businessData?.theme?.colorPalette]);

    const themeStyles = activePalette ? `
        :root {
            --color-bg: ${activePalette.colors[0]};
            --color-surface: ${activePalette.colors[1]};
            --color-accent: ${activePalette.colors[2]};
            --color-secondary: ${activePalette.colors[3]};
            --color-primary: ${activePalette.colors[4]};
        }
    ` : `
        :root {
            /* --- DEFAULT PALETTE --- */
            --color-bg: #FFFFFF;         
            --color-primary: #592E4F;    
            --color-secondary: #9E5A85;  
            --color-accent: #DFA8B7;     
            --color-surface: #F9F4F6;    
        }
    `;

    return (
        <div className="antialiased min-h-screen flex flex-col relative">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Quicksand:wght@300;400;500;600;700&display=swap');
                
                ${themeStyles}
                
                :root {
                    --font-serif: 'DM Serif Display', serif;
                    --font-sans: 'Quicksand', sans-serif;
                }
                body {
                    font-family: var(--font-sans);
                    color: var(--color-primary);
                    background-color: var(--color-bg);
                    overflow-x: hidden;
                }
                h1, h2, h3, h4, h5, h6 { font-family: var(--font-serif); }
            `}</style>

            <AnalyticsTracker websiteId={websiteId} />
            <OfferPopup websiteId={websiteId} websiteData={businessData} />
            <Header />
            <main className="flex-grow pt-24">{children}</main>
            <Editable focusId="footer"><Footer /></Editable>

            {/* --- CART DRAWER --- */}
            <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isCartOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeCart} />
                
                {/* Drawer Panel */}
                <div className={`absolute right-0 top-0 h-full w-full max-w-[400px] bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                    
                    {/* Drawer Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                        <h2 className="text-2xl font-serif text-[var(--color-primary)]">Your Basket</h2>
                        <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"><X size={20}/></button>
                    </div>

                    {/* Drawer Items */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        {cartDetails.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">🧺</div>
                                <p>Your basket is empty</p>
                                <button onClick={closeCart} className="text-[var(--color-secondary)] underline text-sm">Continue Shopping</button>
                            </div>
                        ) : (
                            cartDetails.map(item => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className="w-20 h-20 rounded-xl bg-[#F9F4F6] overflow-hidden flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow flex flex-col justify-between py-1">
                                        <div>
                                            <h4 className="font-serif text-[var(--color-primary)] text-lg leading-tight">{item.name}</h4>
                                            <p className="text-sm font-bold text-[var(--color-secondary)]">₹{Number(item.price || 0).toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center border border-gray-200 rounded-full px-2 py-0.5">
                                                <button onClick={() => decreaseQuantity(item.id)} className="p-1 hover:text-[var(--color-secondary)]"><Minus size={12}/></button>
                                                <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => increaseQuantity(item.id)} className="p-1 hover:text-[var(--color-secondary)]"><Plus size={12}/></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-xs text-gray-400 hover:text-red-500 underline">Remove</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Drawer Footer */}
                    {cartDetails.length > 0 && (
                        <div className="p-6 border-t border-gray-100 bg-[#F9F4F6]">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-500 uppercase tracking-widest font-bold">Total</span>
                                <span className="text-3xl font-serif text-[var(--color-primary)]">₹{Number(total || 0).toFixed(2)}</span>
                            </div>
                            <a href={`${basePath}/checkout`} className="block w-full bg-[var(--color-primary)] text-white text-center py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-[var(--color-secondary)] transition-colors shadow-lg">
                                Proceed to Checkout
                            </a>
                        </div>
                    )}
                </div>
            </div>
            <WhatsAppButton businessData={businessData} />
        </div>
    );
}
