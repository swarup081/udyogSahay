'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import dynamic from 'next/dynamic';
import EditorTopNav from './EditorTopNav';
import EditorSidebar from './EditorSidebar';
import { supabase } from '@/lib/supabaseClient'; // Import your client
import { getOnboardingStatus } from '@/app/actions/onboardingActions';
import { saveDraft, revertToPublished, publishWebsite, unpublishWebsite, getWebsiteDraft, getSubscriptionStatus, checkTemplateChangeAllowance } from '@/app/actions/editorActions';

// Lazy-load WizardModal — only shown for first-time users
const WizardModal = dynamic(() => import('./WizardModal'), {
  ssr: false,
  loading: () => null,
});

// Import all template data
import { businessData as flaraData } from '@/app/templates/flara/data.js';
import { businessData as avenixData } from '@/app/templates/avenix/data.js';
import { businessData as blisslyData } from '@/app/templates/blissly/data.js';
import { businessData as flavornestData } from '@/app/templates/flavornest/data.js';
import { businessData as auroraData } from '@/app/templates/aurora/data.js';
import { businessData as frostifyData } from '@/app/templates/frostify/data.js';

const templateDataMap = {
  flara: flaraData,
  avenix: avenixData,
  blissly: blisslyData,
  flavornest: flavornestData,
  aurora: auroraData,
  frostify: frostifyData,
  // Add other templates here as they are created
};

// --- Helper: Deep Merge ---
function deepMerge(target, source) {
  const isObject = (obj) => obj && typeof obj === 'object';

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach(key => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      target[key] = targetValue.concat(sourceValue);
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = deepMerge(Object.assign({}, targetValue), sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
}

// Better deep merge for defaults: prioritize EXISTING user data, fill MISSING from default
function mergeWithDefaults(userData, defaultData) {
    if (!userData) return defaultData;
    if (!defaultData) return userData;

    // Start with default data (ensures all keys exist)
    const merged = JSON.parse(JSON.stringify(defaultData));

    // Recursively apply user data OVER defaults
    // Note: This needs to be careful with arrays. Usually we want user arrays to replace default arrays entirely.
    
    function recursiveMerge(base, override) {
        Object.keys(override).forEach(key => {
            if (override[key] === undefined) return; // Skip undefined

            if (
                typeof override[key] === 'object' && 
                override[key] !== null && 
                !Array.isArray(override[key]) &&
                base[key] && 
                typeof base[key] === 'object' && 
                !Array.isArray(base[key])
            ) {
                // Both are objects, merge recursively
                recursiveMerge(base[key], override[key]);
            } else {
                // Otherwise override directly (primitives, arrays, or null)
                // This ensures if user deleted items in an array, they stay deleted (we don't merge arrays)
                base[key] = override[key];
            }
        });
    }

    recursiveMerge(merged, userData);
    return merged;
}

// --- Helper: Scrubber for legacy sample data ---
function sanitizeData(data, templateName) {
    if (!data) return data;
    const templateOriginals = templateDataMap[templateName] || {};
    
    // Clean up legacy sample products that leaked into drafts
    if (data.allProducts && templateOriginals.allProducts) {
        const isSample = (p) => templateOriginals.allProducts.some(orig => String(orig.id) === String(p.id) && orig.name === p.name);
        data.allProducts = data.allProducts.filter(p => !isSample(p));
    }
    
    // Clean up legacy sample categories
    if (data.categories && templateOriginals.categories) {
        const isSampleCat = (c) => templateOriginals.categories.some(orig => String(orig.id) === String(c.id) && orig.name === c.name);
        data.categories = data.categories.filter(c => !isSampleCat(c));
    }
    return data;
}

// Main component updated to read site_id
export default function EditorLayout({ templateName, mode, websiteId: propWebsiteId, initialData, siteSlug, syncVersion = 0, isPublished: initialIsPublished = false }) {
  // Initialize view state lazily to match window width on client
  // Default to 'desktop' for SSR safety, then update in effect
  const [view, setView] = useState('desktop'); 
  const [activeTab, setActiveTab] = useState('website');
  const iframeRef = useRef(null);
  const [activeAccordion, setActiveAccordion] = useState('global');

  // Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState(null);

  // Detect default view on mount
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setView('mobile');
    }
  }, []);
  
  // Get websiteId from URL query or prop
  const searchParams = useSearchParams();
  const websiteId = propWebsiteId || searchParams.get('site_id');

  const [saveStatus, setSaveStatus] = useState('Saved');
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [planTier, setPlanTier] = useState('starter');
  const [editorSiteSlug, setEditorSiteSlug] = useState(siteSlug || null);
  const debounceTimer = useRef(null);
  const dbDataLoaded = useRef(false);

  const editorDataKey = propWebsiteId ? `editorData_${propWebsiteId}` : `editorData_${templateName}`;
  const cartDataKey = `${templateName}Cart`; 

  function sendDataToIframe(data) {
    if (iframeRef.current && data) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_DATA',
        payload: data,
      }, '*');
    }
  }




  // State for dynamic scaling
  const [desktopScale, setDesktopScale] = useState(1);
  const [mobileScale, setMobileScale] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(false); // Safe SSR State
  const mainContainerRef = useRef(null);

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
        // Scale 1024px to fit within the container width (minus padding)
        const scale = Math.min(1, (containerWidth - 40) / 1024);
        setDesktopScale(scale);
      } else {
        setDesktopScale(1);
      }

      // 2. Mobile View Scaling (on Desktop/Laptop)
      if (view === 'mobile') {
        // Scale 812px height to fit within container height (minus vertical padding)
        // We want some breathing room (e.g. 40px top + 40px bottom = 80px)
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

  const defaultData = useMemo(() => {
    const data = JSON.parse(JSON.stringify(templateDataMap[templateName] || {}));
    
    // STRIP OUT sample products and categories in the editor.
    // They are only meant for the pure template preview (/preview).
    // In the editor (and live site), users should only see their own products.
    data.allProducts = [];
    data.categories = [];
    
    return data;
  }, [templateName]);

  const [businessData, setBusinessData] = useState(() => {
     // Priority: initialData (from DB) > defaultData
     let dataToMerge = sanitizeData(initialData ? JSON.parse(JSON.stringify(initialData)) : null, templateName);
     
     let data = dataToMerge ? mergeWithDefaults(dataToMerge, defaultData) : defaultData;
     
     // Inject storeName from Get Started if available and we are starting fresh (using defaultData)
     if (!initialData && typeof window !== 'undefined') {
         const storedName = localStorage.getItem('storeName');
         if (storedName && storedName !== 'My New Site') {
             data = {
                 ...data,
                 name: storedName,
                 logoText: storedName,
                 // Update footer copyright if it exists
                 footer: data.footer ? {
                     ...data.footer,
                     copyright: data.footer.copyright 
                        ? data.footer.copyright.replace(/202[0-9] [A-Za-z]+,/, `202${new Date().getFullYear().toString().slice(-1)} ${storedName},`) 
                        : `© ${new Date().getFullYear()} ${storedName},`
                 } : undefined
             };
         }
     }
     return data;
  });
  
  const [history, setHistory] = useState([businessData]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // --- PARALLEL INIT: Run onboarding + draft load + subscription check simultaneously ---
  useEffect(() => {
    if (!websiteId) return;
    
    const parallelInit = async () => {
      const promises = [];

      // 1. Onboarding status check
      if (mode !== 'dashboard') {
        promises.push(
          getOnboardingStatus().then(({ success, isCompleted, data, websiteData }) => {
            if (success && !isCompleted) {
              setWizardInitialData({ data, websiteData });
              setShowWizard(true);
            }
          }).catch(err => console.error('[EditorLayout] Onboarding check failed:', err))
        );
      }

      // 2. Load draft from DB (standalone editor mode)
      if (mode !== 'dashboard' && !dbDataLoaded.current) {
        promises.push(
          getWebsiteDraft(websiteId).then(result => {
            if (result.success && result.data && Object.keys(result.data).length > 0) {
              dbDataLoaded.current = true;
              const merged = mergeWithDefaults(result.data, defaultData);
              setBusinessData(merged);
              setHistory([merged]);
              setHistoryIndex(0);
              sendDataToIframe(merged);
              setIsPublished(result.isPublished || false);
              if (result.siteSlug) setEditorSiteSlug(result.siteSlug);
              localStorage.setItem(editorDataKey, JSON.stringify(merged));
            }
          }).catch(err => console.error('[EditorLayout] Failed to load draft from DB:', err))
        );
      }

      // 3. Subscription status
      promises.push(
        getSubscriptionStatus().then(status => {
          setHasActiveSubscription(status.hasActiveSubscription);
          setPlanTier(status.planTier);
        }).catch(err => console.error('[EditorLayout] Subscription check failed:', err))
      );

      await Promise.all(promises);
    };

    parallelInit();
  }, [websiteId, mode, defaultData, editorDataKey]);

  // Load data
  useEffect(() => {
    try {
      // We prioritize localStorage to keep unsaved changes
      const savedData = localStorage.getItem(editorDataKey);
      if (savedData) {
        const parsedData = sanitizeData(JSON.parse(savedData), templateName);
        // FIX: Merge saved data with defaults too
        const merged = mergeWithDefaults(parsedData, defaultData);
        setBusinessData(merged); 
        setHistory([merged]);
        setHistoryIndex(0);
      } else if (initialData) {
         // If we have initialData passed prop (e.g. from Dashboard), use it.
         // Already merged in useState, but good to be explicit if props change
         const sanitized = sanitizeData(JSON.parse(JSON.stringify(initialData)), templateName);
         const merged = mergeWithDefaults(sanitized, defaultData);
         setBusinessData(merged);
         setHistory([merged]);
         setHistoryIndex(0);
      } else {
        // If no local data and no initialData, use default
        setBusinessData(defaultData);
        setHistory([defaultData]);
        setHistoryIndex(0);
      }
    } catch (error) {
      console.error("Failed to load saved data:", error);
      setBusinessData(defaultData);
      setHistory([defaultData]);
      setHistoryIndex(0);
    }
  }, [templateName, websiteId, defaultData, editorDataKey]); 

  // --- Sync from other devices: when syncVersion bumps, reset editor to latest data ---
  const initialSyncVersion = useRef(syncVersion);
  useEffect(() => {
    // Skip the initial mount — only react to actual sync events
    if (syncVersion === initialSyncVersion.current) return;
    initialSyncVersion.current = syncVersion;

    if (!initialData) return;

    // Clear stale localStorage so it doesn't override the sync
    localStorage.removeItem(editorDataKey);
    localStorage.removeItem(cartDataKey);

    const merged = mergeWithDefaults(initialData, defaultData);
    setBusinessData(merged);
    setHistory([merged]);
    setHistoryIndex(0);
    sendDataToIframe(merged);
    setSaveStatus('Synced');

    console.log('[EditorLayout] Synced from another device (syncVersion:', syncVersion, ')');
  }, [syncVersion]); // eslint-disable-line react-hooks/exhaustive-deps

// Auto-save logic
useEffect(() => {
  // 1. Save to localStorage immediately
  try {
    const dataToSave = JSON.stringify(businessData);
    localStorage.setItem(editorDataKey, dataToSave);
    setSaveStatus('Saving...');
  } catch (error) {
    console.error("Failed to save data to localStorage:", error);
  }

  // 2. Debounce saving to Supabase
  if (debounceTimer.current) {
    clearTimeout(debounceTimer.current);
  }

  debounceTimer.current = setTimeout(async () => {
    if (websiteId) {
        
      // Use Server Action to save draft
      const { success, error } = await saveDraft(websiteId, businessData);

      if (!success) {
        setSaveStatus('Error');
        console.error('Error saving draft:', error);
      } else {
        setSaveStatus('Saved');
      }
    } else {
      setSaveStatus('Saved (Local)');
    }
  }, 1500); // Save 1.5 seconds after last change

  return () => clearTimeout(debounceTimer.current);

}, [businessData, editorDataKey, websiteId]);
  
  const handleDataUpdate = (updaterFn) => {
    setBusinessData(prevData => {
      const newData = typeof updaterFn === 'function' ? updaterFn(prevData) : updaterFn;
      if (JSON.stringify(newData) === JSON.stringify(prevData)) {
        return prevData;
      }
      const newHistory = [...history.slice(0, historyIndex + 1), newData];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newData;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBusinessData(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBusinessData(history[newIndex]);
    }
  };

  const handleRestart = async () => {
    // If connected to a website, fetch the last published version (or initial state)
    if (websiteId) {
        const { success, data } = await revertToPublished(websiteId);
        if (success && data) {
             localStorage.removeItem(editorDataKey);
             localStorage.removeItem(cartDataKey);
             
             // Ensure we merge published data with defaults too (in case template updated)
             const merged = mergeWithDefaults(data, defaultData);
             
             setBusinessData(merged);
             setHistory([merged]);
             setHistoryIndex(0);
             sendDataToIframe(merged);
             
             const homePage = merged.pages?.[0]?.path ?? '';
             handlePageChange(homePage);
             return;
        }
    }
    
    // Fallback to template default
    localStorage.removeItem(editorDataKey);
    localStorage.removeItem(cartDataKey);
    setBusinessData(defaultData);
    setHistory([defaultData]);
    setHistoryIndex(0);
    sendDataToIframe(defaultData);
    const homePage = defaultData.pages?.[0]?.path ?? '';
    handlePageChange(homePage);
  };

  // Handler for Publishing (passed to TopNav)
  const handlePublish = async () => {
      if (!websiteId) return { success: false, error: 'No website ID' };
      
      // 1. Flush pending draft save to ensure DB has the latest data
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Save draft immediately before publishing
      const draftResult = await saveDraft(websiteId, businessData);
      if (!draftResult.success) {
        console.error('Failed to save draft before publish:', draftResult.error);
      }
      
      // 2. Publish from DB (no longer sends full data — avoids 1MB body limit)
      const result = await publishWebsite(websiteId);
      if (result.success) setIsPublished(true);
      return result;
  };

  // Handler for Unpublishing (passed to TopNav dropdown)
  const handleUnpublish = async () => {
      if (!websiteId) return { success: false, error: 'No website ID' };
      const result = await unpublishWebsite(websiteId);
      if (result.success) setIsPublished(false);
      return result;
  };

  function sendDataToIframe(data) {
    if (iframeRef.current && data) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_DATA',
        payload: data,
      }, '*');
    }
  }

  // Send data to iframe immediately on initial load and when businessData changes (debounced)
  useEffect(() => {
    // Immediate send if it's the first load or if needed
    if (iframeRef.current && iframeRef.current.contentWindow) {
        sendDataToIframe(businessData);
    }
    
    const handler = setTimeout(() => {
      sendDataToIframe(businessData);
    }, 250); 

    return () => clearTimeout(handler);
  }, [businessData]); 

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'IFRAME_READY') {
        sendDataToIframe(businessData);
      }
      
      if (event.data.type === 'FOCUS_SECTION') {
        setActiveTab('website');
        setActiveAccordion(event.data.payload.accordionId);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [businessData]); 

  // Helper: build full iframe URL from a relative page path
  // Template data stores relative paths like '', '/shop', '/checkout'
  // The iframe needs full paths like '/templates/flara', '/templates/flara/shop'
  const templateBasePath = `/templates/${templateName}`;
  
  const buildPageUrl = (relativePath) => {
    if (!relativePath && relativePath !== '') return templateBasePath;
    // If path is already absolute (starts with /templates/), use as-is
    if (relativePath.startsWith('/templates/')) return relativePath;
    // If path is empty string (home page), return base path
    if (relativePath === '') return templateBasePath;
    // Otherwise, append to base path (e.g. '/shop' -> '/templates/flara/shop')
    return `${templateBasePath}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  };

  const [activePage, setActivePage] = useState(() => {
    const firstPath = defaultData?.pages?.[0]?.path;
    return firstPath !== undefined ? firstPath : '';
  });
  const [previewUrl, setPreviewUrl] = useState(() => {
    const firstPath = defaultData?.pages?.[0]?.path;
    return buildPageUrl(firstPath !== undefined ? firstPath : '');
  });
  
  const handlePageChange = (path) => {
    if (path === undefined || path === null) return; 
    
    const [basePath, anchorId] = path.split('#');
    setActivePage(path);
    
    // Build the full URL for the iframe
    const fullUrl = buildPageUrl(basePath);

    if (iframeRef.current) {
      // Extract just the pathname from the current iframe src for accurate comparison
      let currentPathname;
      try {
        currentPathname = new URL(iframeRef.current.src).pathname;
      } catch {
        currentPathname = iframeRef.current.src.split('#')[0].split('?')[0];
      }
      const targetPathname = fullUrl.split('?')[0].split('#')[0];

      const isSamePage = currentPathname === targetPathname;

      if (isSamePage && anchorId) {
        // Same page, scroll to section
        iframeRef.current.contentWindow.postMessage({
          type: 'SCROLL_TO_SECTION',
          payload: { sectionId: anchorId }
        }, '*');
      } else if (!isSamePage) {
        // Different page — navigate the iframe
        setPreviewUrl(anchorId ? `${fullUrl}#${anchorId}` : fullUrl);
      }
      // If same page and no anchor, do nothing (already there)
    }
  };
  
  useEffect(() => {
      const firstPath = defaultData.pages?.[0]?.path;
      const homePath = firstPath !== undefined ? firstPath : '';
      setActivePage(homePath);
      setPreviewUrl(buildPageUrl(homePath));
  }, [templateName, defaultData]);

  const handleAccordionToggle = (id) => {
    const newActiveId = activeAccordion === id ? null : id;
    setActiveAccordion(newActiveId);

    if (newActiveId) {
      if (newActiveId === 'products') {
        const shopPage = businessData.pages.find(
          (p) => p.name.toLowerCase() === 'shop'
        );
        if (shopPage) {
          handlePageChange(shopPage.path);
        }
      } else {
        const sectionIdMap = {
          hero: 'home',
          global: 'home',
          about: businessData.aboutSectionId || 'about',
          events: businessData.eventsSectionId || 'events',
          menu: businessData.menuSectionId || 'menu',
          testimonials: businessData.testimonialsSectionId || 'testimonials',
          collection: businessData.collectionSectionId || 'collection',
          feature2: businessData.feature2SectionId || 'feature2',
          footer: businessData.footerSectionId || 'contact',
          cta: businessData.ctaSectionId || 'cta',
          stats: businessData.statsSectionId || 'stats',
          blog: businessData.blogSectionId || 'blog',
          reviews: businessData.reviewsSectionId || 'reviews',
          specialty: businessData.specialtySectionId || 'specialty',
        };
        const sectionId = sectionIdMap[id] || (id !== 'products' ? id : null);
        
        if (sectionId) {
          const homePage = businessData.pages.find(p => p.name.toLowerCase() === 'home');
          const homePath = homePage?.path || businessData.pages[0]?.path;
          
          handlePageChange(sectionId === 'home' ? homePath : `${homePath}#${sectionId}`);
        }
      }
    }
  };

  return (
    <div className={`flex flex-col lg:grid lg:grid-cols-[1fr_auto] bg-gray-50 ${mode === 'dashboard' ? 'h-full' : 'h-screen'}`}>
      
      {/* Column 1: Main Content (Nav + Preview) */}
      <div className={`flex flex-col overflow-hidden relative ${mode === 'dashboard' ? 'h-full' : 'h-screen'}`}>
        
        <div className="flex-shrink-0 z-20 relative">
          <EditorTopNav
            mode={mode}
            siteSlug={siteSlug || editorSiteSlug}
            templateName={templateName}
            websiteId={websiteId} // Pass websiteId to the nav
            saveStatus={saveStatus} // Pass saveStatus to the nav
            view={view}
            onViewChange={setView}
            activePage={activePage}
            pages={businessData?.pages || []}
            onPageChange={handlePageChange}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onRestart={handleRestart}
            setBusinessData={handleDataUpdate} // <-- ADDED for AI functionality
            onPublish={handlePublish} // <-- ADDED
            onUnpublish={handleUnpublish}
            isPublished={isPublished}
            hasActiveSubscription={hasActiveSubscription}
            planTier={planTier}
          />
        </div>

        <main ref={mainContainerRef} className={`flex-grow flex items-center justify-center overflow-hidden relative bg-[#F3F4F6] ${view === 'mobile' && isMobileViewport ? 'p-0' : 'p-4 lg:p-0'}`}>
          <div
            className={`transition-all duration-300 ease-in-out bg-white shadow-lg overflow-hidden flex-shrink-0 origin-center
              ${view === 'mobile' && !isMobileViewport ? 'rounded-3xl border border-gray-300' : ''} 
              ${view === 'desktop' ? 'rounded-none lg:rounded-md' : ''}
            `}
            style={{
              // Logic for Width
              width: view === 'desktop' 
                ? (isMobileViewport ? '1024px' : '100%') // Fixed on mobile, Fluid on Desktop
                : (isMobileViewport ? '100%' : '375px'), // 100% on actual mobile, Fixed on Desktop
              
              // Logic for Height
              height: view === 'desktop'
                ? '100%' // Desktop takes full height
                : (isMobileViewport ? '100%' : '812px'), // 100% on actual mobile, Fixed on Desktop
              
              // Scaling Logic
              transform: view === 'desktop'
                 ? (isMobileViewport ? `scale(${desktopScale})` : 'none') 
                 : (isMobileViewport ? 'none' : `scale(${mobileScale})`), // No scale on actual mobile

              // Margins
              marginTop: '0', 
              marginBottom: view === 'desktop' && isMobileViewport ? '100px' : '0',
            }}
          >
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="Website Preview"
              className="w-full h-full border-0"
              key={templateName} 
            />
          </div>
        </main>
      </div>

      {/* Column 2: Sidebar (Full Height / Mobile Bottom) */}
      <div className={`bg-white border-l border-gray-200 lg:overflow-y-auto lg:static lg:h-full lg:w-80 fixed bottom-0 left-0 w-full z-40 lg:z-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-none`}>
        <EditorSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          businessData={businessData}
          setBusinessData={handleDataUpdate} 
          onPageChange={handlePageChange}
          
          activeAccordion={activeAccordion}
          onAccordionToggle={handleAccordionToggle} 
          templateName={templateName}
          websiteId={websiteId} // Pass websiteId for uploads in settings
        />
      </div>

      {/* Onboarding Wizard */}
      {showWizard && (
          <WizardModal 
              isOpen={showWizard} 
              onClose={() => setShowWizard(false)}
              websiteId={websiteId}
              initialData={wizardInitialData}
              setBusinessData={handleDataUpdate}
          />
      )}
    </div>
  );
}
