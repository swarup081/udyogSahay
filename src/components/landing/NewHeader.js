'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User } from 'lucide-react';
import Logo from '@/lib/logo/logoOfBizVistar';
import { supabase } from '@/lib/supabaseClient';

export default function NewHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isTimerLoaded, setIsTimerLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [storeInfo, setStoreInfo] = useState({ name: '', logo: '' });

  useEffect(() => {
    const getTargetDate = () => {
      const now = Date.now();
      function sfc32(a, b, c, d) {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b | 0) + d | 0;
        d = d + 1 | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
      }
      const epoch = new Date('2024-01-01T00:00:00Z').getTime();
      let currentStart = epoch;
      let targetDate = epoch;
      let seed = 1;
      while (targetDate <= now) {
        currentStart = targetDate;
        const rand = sfc32(seed++, 0x9E3779B9, 0x243F6A88, 0xB7E15162);
        const duration = 86400000 + Math.floor(rand * (432000000 - 86400000));
        targetDate = currentStart + duration;
      }
      return targetDate;
    };

    let interval;
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetDate = getTargetDate();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
        setIsTimerLoaded(true);
      }
    };

    calculateTimeLeft();
    interval = setInterval(calculateTimeLeft, 1000);

    // Initial Auth Check
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);

        // Dynamic Check for Live Website or Progress
        let fetchedName = session.user.user_metadata?.username || session.user.user_metadata?.user_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
        let fetchedLogo = '';

        const { data: website } = await supabase
          .from("websites")
          .select("id")
          .eq("user_id", session.user.id)
          .limit(1)
          .maybeSingle();

        if (website) {
          setHasWebsite(true);
          const { data: onboard } = await supabase
            .from("onboarding_data")
            .select("owner_name, logo_url")
            .eq("website_id", website.id)
            .maybeSingle();

          if (onboard) {
            if (onboard.owner_name) fetchedName = onboard.owner_name;
            if (onboard.logo_url) fetchedLogo = onboard.logo_url;
          }
        }

        setStoreInfo({ name: fetchedName, logo: fetchedLogo });
      }
    };
    checkUser();

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const formatTime = (value) => value.toString().padStart(2, '0');

  const navLinks = [
    { label: 'Sell', href: '/#how-it-works' },
    { label: 'Templates', href: '/templates' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Manage', href: '/dashboard' },
    { label: 'Pricing', href: '/pricing' },
  ];

  // 1. Extract the banner into a variable to avoid repeating code
  const topBanner = (
    <div
      onClick={() => {
        window.location.href = '/pricing#pricing';
      }}
      className="bg-gray-900 text-white text-xs md:text-[15px] py-2.5 text-center px-4 font-medium flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 font-sans tracking-wide cursor-pointer w-full"
    >
      <span className="flex items-center gap-1">
        <span className="md:hidden inline-block animate-bounce text-xs">↓</span>
        Don’t miss the limited-time deals!
        <span className="md:hidden inline-block animate-bounce text-xs">↓</span>
      </span>
      <span suppressHydrationWarning className="flex items-baseline gap-1 font-sans font-bold text-[18px] md:text-[20px] text-[#8a63d2] tracking-wider pointer-events-none">
        {formatTime(timeLeft.days)}<span className="text-[11px] md:text-[12px] font-sans font-medium text-gray-300 -ml-0.5">D</span>&nbsp;
        {formatTime(timeLeft.hours)}<span className="text-[11px] md:text-[12px] font-sans font-medium text-gray-300 -ml-0.5">H</span>&nbsp;
        {formatTime(timeLeft.minutes)}<span className="text-[11px] md:text-[12px] font-sans font-medium text-gray-300 -ml-0.5">M</span>&nbsp;
        {formatTime(timeLeft.seconds)}<span className="text-[11px] md:text-[12px] font-sans font-medium text-gray-300 -ml-0.5">S</span>
      </span>
      <Link
        href="/pricing#pricing"
        onClick={(e) => e.stopPropagation()}
        className="underline hidden md:block font-bold hover:text-gray-300 decoration-2 underline-offset-4 cursor-pointer"
      >
        Explore
      </Link>
    </div>
  );

  return (
    <>
      {/* 2. Mobile Banner: Rendered OUTSIDE the sticky container so it scrolls away naturally */}
      <div className="md:hidden block w-full">
        {topBanner}
      </div>

      {/* 3. Sticky Container: Keeps everything inside it sticky on all screens */}
      <div className="sticky top-0 left-0 right-0 z-[110] bg-white transition-all duration-300 shadow-sm">

        {/* Desktop Banner: Rendered INSIDE the sticky container */}
        <div className="hidden md:block w-full">
          {topBanner}
        </div>

        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300 w-full">
          <div className="max-w-7xl mx-auto px-6 h-13 md:h-20 flex items-center justify-between relative">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo className="text-2xl lg:text-3xl" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-6 relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 group bg-gray-50 border border-gray-200 pr-4 pl-1.5 py-1.5 rounded-full hover:bg-gray-100 transition-all shadow-sm focus:outline-none"
                  >
                    {storeInfo.logo ? (
                      <img src={storeInfo.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shadow-sm group-hover:bg-gray-300 transition-colors">
                        <User size={16} strokeWidth={2.5} />
                      </div>
                    )}
                    <span className="text-sm font-bold text-gray-800 tracking-tight">
                      {storeInfo.name || user?.user_metadata?.username || user?.user_metadata?.user_name || (user?.email ? user.email.split('@')[0] : 'Account')}
                    </span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>

                  {isDropdownOpen && (
                    <>
                      {/* Invisible overlay to close dropdown when clicking outside */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>

                      <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-gray-900 truncate mb-0.5">{storeInfo.name || user?.user_metadata?.username || user?.user_metadata?.user_name || (user?.email ? user.email.split('@')[0] : 'Creator')}</span>
                            <span className="text-xs text-gray-500 truncate">{user.email}</span>
                          </div>
                        </div>

                        <div className="py-2">
                          {hasWebsite ? (
                            <>
                              <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black font-medium transition-colors">Dashboard</Link>
                              <Link href="/dashboard/orders" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black font-medium transition-colors">All Orders</Link>
                              <Link href="/dashboard/products" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black font-medium transition-colors">Manage Products</Link>
                            </>
                          ) : (
                            <>
                              <Link href="/editor" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black font-medium transition-colors">Build Website</Link>
                              <Link href="/templates" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black font-medium transition-colors">Browse Templates</Link>
                              <Link href="/pricing" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black font-medium transition-colors">Pricing Options</Link>
                            </>
                          )}
                        </div>

                        <div className="border-t border-gray-100 pt-1 mt-1">
                          <button
                            onClick={async () => { await supabase.auth.signOut(); setIsDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/templates"
                    className="bg-[#000] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#000] transition-all hover:scale-105 shadow-md active:scale-95"
                  >
                    Start for free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>

          {/* Mobile Menu Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-white border-b border-gray-100 overflow-hidden shadow-lg absolute w-full left-0 top-full z-50"
              >
                <div className="flex flex-col p-6 space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-lg font-medium text-gray-900 py-3 border-b border-gray-50 flex items-center justify-between group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">→</span>
                    </Link>
                  ))}
                  <div className="pt-6 flex flex-col gap-4">
                    {user ? (
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col gap-2 shadow-sm">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-2">
                          {storeInfo.logo ? (
                            <img src={storeInfo.logo} alt="Logo" className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shadow-sm">
                              <User size={24} strokeWidth={2} />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-lg capitalize mb-0.5">{storeInfo.name || user?.user_metadata?.username || user?.user_metadata?.user_name || (user?.email ? user.email.split('@')[0] : 'Account')}</span>
                            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{hasWebsite ? 'Creator Dashboard' : 'Setup Required'}</span>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-1">
                          {hasWebsite ? (
                            <>
                              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 px-2 text-gray-700 font-medium text-base hover:bg-gray-100 rounded-lg">Dashboard Overview</Link>
                              <Link href="/dashboard/orders" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 px-2 text-gray-700 font-medium text-base hover:bg-gray-100 rounded-lg">Manage Orders</Link>
                            </>
                          ) : (
                            <>
                              <Link href="/editor" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 px-2 text-gray-700 font-medium text-base hover:bg-gray-100 rounded-lg">Build Your Website</Link>
                              <Link href="/templates" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 px-2 text-gray-700 font-medium text-base hover:bg-gray-100 rounded-lg">Browse Templates</Link>
                            </>
                          )}
                        </div>

                        <button
                          onClick={async () => { await supabase.auth.signOut(); setIsMobileMenuOpen(false); }}
                          className="text-left py-3 px-2 text-red-600 hover:bg-red-50 rounded-lg font-bold mt-2 border-t border-gray-200 pt-4"
                        >
                          Sign Out Account
                        </button>
                      </div>
                    ) : (
                      <>
                        <Link
                          href="/sign-in"
                          className="w-full text-center py-3 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Log in
                        </Link>
                        <Link
                          href="/templates"
                          className="w-full text-center py-3 bg-[#000] text-white rounded-lg font-bold hover:bg-[#000] transition-colors shadow-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Start for free
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>
    </>
  );
}