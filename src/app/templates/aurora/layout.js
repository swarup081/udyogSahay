'use client';
import { useState, useEffect, useContext, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { businessData as initialBusinessData } from './data.js';
import { Header, Footer } from './components.js';
import { CartProvider, useCart } from './cartContext.js';
import { TemplateContext } from './templateContext.js';
import { Editable } from '@/components/editor/Editable';
import AnalyticsTracker from '@/components/dashboard/analytics/AnalyticsTracker';
import { X } from 'lucide-react';
import { colorPalettes } from '@/components/editor/EditorSidebar';
import WhatsAppButton from '@/components/WhatsAppButton';
import OfferPopup from '@/components/editor/OfferPopup';
import { getBasePath } from '@/app/templates/getBasePath';

const fontMap = {
    'Poppins': { url: 'family=Poppins:wght@300;400;500;600;700', family: "'Poppins', sans-serif" },
    'Montserrat': { url: 'family=Montserrat:wght@300;400;500;600;700', family: "'Montserrat', sans-serif" },
    'Lora': { url: 'family=Lora:ital,wght@0,400;0,500;0,600;1,400', family: "'Lora', serif" },
    'Lato': { url: 'family=Lato:wght@300;400;700', family: "'Lato', sans-serif" },
    'Playfair_Display': { url: 'family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500', family: "'Playfair Display', serif" },
    'Cormorant_Garamond': { url: 'family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400', family: "'Cormorant Garamond', serif" },
    'DM_Sans': { url: 'family=DM+Sans:opsz,wght@9..40,300;400;500;700', family: "'DM Sans', sans-serif" },
    'Kalam': { url: 'family=Kalam:wght@300;400;700', family: "'Kalam', cursive" },
    'Roboto': { url: 'family=Roboto:wght@300;400;500;700', family: "'Roboto', sans-serif" },
    'Inter': { url: 'family=Inter:wght@300;400;500;600;700', family: "'Inter', sans-serif" },
};

function CartLayout({ children, serverData, websiteId }) {
    // Legacy support if needed
    return <AuroraContent>{children}</AuroraContent>;
}

export default function AuroraLayout({ children, serverData, websiteId }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuroraStateProvider serverData={serverData} websiteId={websiteId}>
                <CartProvider>
                    <AuroraContent>{children}</AuroraContent>
                </CartProvider>
            </AuroraStateProvider>
        </Suspense>
    );
}

// Wrapper to Provide State & Context
function AuroraStateProvider({ children, serverData, websiteId }) {
    const [businessData, setBusinessData] = useState(serverData || initialBusinessData); 

    const pathname = usePathname();
    const basePath = getBasePath('aurora', serverData, pathname);
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
            const savedData = localStorage.getItem(`editorData_aurora`);
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

function AuroraContent({ children }) {
    const { businessData, websiteId , basePath } = useContext(TemplateContext);
    const { 
        isCartOpen, 
        closeCart, 
        cartDetails, 
        total, 
        removeFromCart 
    } = useCart();
    
    const searchParams = useSearchParams();
    const isLanding = searchParams.get('isLanding') === 'true';

    // Theme Logic
    const activePalette = useMemo(() => {
        return colorPalettes.find(p => p.class === businessData?.theme?.colorPalette) || null;
    }, [businessData?.theme?.colorPalette]);

    const themeStyles = activePalette ? `
        :root {
            --color-bg: ${activePalette.colors[0]};
            --color-bg-alt: ${activePalette.colors[1]};
            --color-gold: ${activePalette.colors[2]};
            --color-text-light: ${activePalette.colors[3]};
            --color-dark: ${activePalette.colors[4]};
            --color-text: ${activePalette.colors[4]};
        }
    ` : `
        :root {
            /* --- DEFAULT PALETTE (Champagne/Gold) --- */
            --color-bg: #F7F4F0;         
            --color-bg-alt: #EBE5DF;     
            --color-dark: #0B1215;       
            --color-gold: #C6A87C;       
            --color-text: #0B1215;
            --color-text-light: #6B7280;
        }
    `;

    // Font Logic
    const headingFontName = businessData?.theme?.font?.heading || 'Playfair_Display';
    const bodyFontName = businessData?.theme?.font?.body || 'DM_Sans';
    const headingFont = fontMap[headingFontName] || fontMap['Playfair_Display'];
    const bodyFont = fontMap[bodyFontName] || fontMap['DM_Sans'];

    return (
        <div className="antialiased min-h-screen flex flex-col relative">
            <style jsx global>{`
                /* IMPORT FONTS */
                @import url('https://fonts.googleapis.com/css2?${headingFont.url}&${bodyFont.url}&display=swap');
                
                ${themeStyles}
                
                :root {
                    /* --- FONTS --- */
                    --font-serif: ${headingFont.family};
                    --font-sans: ${bodyFont.family};
                }

                body {
                    font-family: var(--font-sans);
                    color: var(--color-text);
                    background-color: var(--color-bg);
                    overflow-x: hidden;
                    ${isLanding ? 'overflow-y: hidden !important;' : ''}
                }

                h1, h2, h3, h4, h5, h6 {
                    font-family: var(--font-serif);
                }

                /* Smooth Selection */
                ::selection {
                    background: var(--color-gold);
                    color: white;
                }
            `}</style>

            <AnalyticsTracker websiteId={websiteId} />
            <OfferPopup websiteId={websiteId} websiteData={businessData} />
            
            {/* Nav is ALWAYS visible, even in Landing Mode */}
            <Header />
            
            {/* Added padding-top to prevent nav overlap, specifically for Landing Mode */}
            <main className={`flex-grow ${isLanding ? 'pt-0' : ''}`}>{children}</main>
            
            {!isLanding && (
                <Editable focusId="footer"><Footer /></Editable>
            )}

            {/* SLIDE-OUT CART */}
            <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isCartOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div 
                    className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} 
                    onClick={closeCart}
                />
                
                {/* Drawer */}
                <div className={`absolute right-0 top-0 h-full w-full max-w-[400px] bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="h-full flex flex-col p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-serif text-[var(--color-dark)]">Your Selection</h2>
                            <button onClick={closeCart} className="hover:rotate-90 transition-transform duration-300">
                                <X size={24} strokeWidth={1.5} />
                            </button>
                        </div>

                        {cartDetails.length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-[var(--color-text-light)] gap-4">
                                <span className="text-sm uppercase tracking-widest">Your bag is empty</span>
                                <button onClick={closeCart} className="text-[var(--color-dark)] border-b border-current pb-0.5 text-sm">Start Shopping</button>
                            </div>
                        ) : (
                            <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                                {cartDetails.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-20 h-24 bg-gray-50 flex-shrink-0 relative">
                                            <img src={item.image} className="absolute inset-0 w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-grow py-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-serif text-lg leading-none mb-2">{item.name}</h4>
                                                <p className="text-sm font-medium text-[var(--color-text-light)]">₹{item.price}</p>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-[var(--color-text-light)]">Qty: {item.quantity}</span>
                                                <button onClick={() => removeFromCart(item.id)} className="text-xs uppercase tracking-wider font-bold hover:text-red-500">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {cartDetails.length > 0 && (
                            <div className="border-t border-gray-100 pt-6 mt-4">
                                <div className="flex justify-between font-serif text-2xl mb-6">
                                    <span>Total</span>
                                    <span>₹{Number(total || 0).toFixed(2)}</span>
                                </div>
                                <a href={`${basePath}/checkout`} className="block w-full bg-[var(--color-dark)] text-white text-center py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[var(--color-gold)] transition-colors">
                                    Checkout
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <WhatsAppButton businessData={businessData} />
        </div>
    );
}
