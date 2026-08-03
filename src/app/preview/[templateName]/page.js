'use client';
// export const runtime = 'edge';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Monitor, Smartphone } from 'lucide-react';

// --- Reusable SVG Icons ---
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

// --- Main Preview Page Component ---
export default function TemplatePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const { templateName } = params; // This will be 'flavornest', 'lanily', etc.

  const [view, setView] = useState('desktop'); // 'desktop' or 'mobile'
  
  // State for dynamic scaling (Reusing EditorLayout logic)
  const [desktopScale, setDesktopScale] = useState(1);
  const [mobileScale, setMobileScale] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const mainContainerRef = useRef(null);

  // Initialize defaults
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setView('mobile');
    }
  }, []);

  // Resize handler for scaling
  useEffect(() => {
    const handleResize = () => {
      // Safe check for mobile viewport
      const isMobile = window.innerWidth < 1024;
      setIsMobileViewport(isMobile);

      const container = mainContainerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // 1. Desktop View Scaling (on Mobile)
      if (view === 'desktop' && isMobile) {
        const scale = Math.min(1, (containerWidth - 40) / 1024);
        setDesktopScale(scale);
      } else {
        setDesktopScale(1);
      }

      // 2. Mobile View Scaling (on Desktop/Laptop)
      if (view === 'mobile') {
        const availableHeight = containerHeight - 80;
        const scale = Math.min(1, availableHeight / 812);
        setMobileScale(scale);
      } else {
        setMobileScale(1);
      }
    };

    // Run on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  // Construct the URL for the iframe source.
  const templateUrl = `/templates/${templateName}`;

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      
      {/* --- Top Navigation Bar --- */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 z-10">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Left Group: Back Button + Device Toggles */}
            <div className="flex items-center gap-6">
              {/* Back Button (goes back to /templates) */}
              <Link href="/templates">
                <button 
                  className="flex items-center gap-2 text-lg text-gray-600 hover:text-gray-900 font-medium"
                >
                  <BackIcon />
                  Back to Templates
                </button>
              </Link>

              {/* Device Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('desktop')}
                  className={`p-2 rounded-md transition-colors ${view === 'desktop' ? 'bg-[#8A63D2]/20 text-[#8A63D2]' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label="Desktop view"
                >
                  <Monitor size={20} />
                </button>
                
                <button
                  onClick={() => setView('mobile')}
                  className={`p-2 rounded-md transition-colors ${view === 'mobile' ? 'bg-[#8A63D2]/20 text-[#8A63D2]' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label="Mobile view"
                >
                  <Smartphone size={20} />
                </button>
              </div>
            </div>
            
            {/* Action Button (Pushed to the right) */}
            <div className="flex items-center gap-4">
                 <p className="text-sm text-gray-500 hidden sm:block">No credit card required*</p>
                 <Link href={`/templates`}>
                    <button className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                        Start Editing
                    </button>
                 </Link>
            </div>

          </div>
        </div>
      </header>
      
      {/* --- Iframe Content Area --- */}
      <main ref={mainContainerRef} className={`flex-grow flex items-center justify-center overflow-hidden relative bg-[#F3F4F6] ${view === 'mobile' && isMobileViewport ? 'p-0' : 'p-4 lg:p-0'}`}>
          <div
            className={`transition-all duration-300 ease-in-out bg-white shadow-lg overflow-hidden flex-shrink-0 origin-center
              ${view === 'mobile' && !isMobileViewport ? 'rounded-3xl border border-gray-300' : ''} 
              ${view === 'desktop' ? 'rounded-none lg:rounded-md' : ''}
            `}
            style={{
              // Logic for Width
              width: view === 'desktop' 
                ? (isMobileViewport ? '1024px' : '100%') 
                : (isMobileViewport ? '100%' : '375px'),
              
              // Logic for Height
              height: view === 'desktop'
                ? '100%'
                : (isMobileViewport ? '100%' : '812px'),
              
              // Scaling Logic
              transform: view === 'desktop'
                 ? (isMobileViewport ? `scale(${desktopScale})` : 'none') 
                 : (isMobileViewport ? 'none' : `scale(${mobileScale})`),

              // Margins
              marginTop: '0', 
              marginBottom: view === 'desktop' && isMobileViewport ? '100px' : '0',
            }}
          >
              <iframe
                  src={templateUrl}
                  title={`${templateName} Preview`}
                  className="w-full h-full border-0"
              />
          </div>
      </main>
    </div>
  );
}