'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BenefitsSection() {
  return (
    <section className="relative bg-[#F4F5F8] pt-24 pb-20 overflow-hidden font-sans">
      <div className="container mx-auto px-6 max-w-[1280px] relative z-10">
        
        {/* --- Header --- */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-bold mb-6 leading-[1.15] tracking-tight">
            Make your website and start<br />selling with benefits
          </h2>
            Create a stunning online presence and reach customers everywhere. Enjoy seamless tools designed to help your business grow and thrive on a global scale.
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start relative">
          
          {/* Left Column: Accordion / Features */}
          <div className="lg:col-span-5 flex flex-col gap-2 pt-1">
            
            {/* Active Card */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-4 mb-4">
                <GlobeIcon />
                <span className="text-[22px] font-bold text-gray-900">Global customer interaction</span>
              </div>
              <p className="text-gray-600 text-[15px] leading-relaxed mb-6">
                Connect with customers around the world effortlessly. Our platform ensures a seamless shopping experience, breaking down geographical barriers for your business.
              </p>
              <a href="#" className="inline-flex items-center text-[#4038DA] font-semibold text-[16px] hover:text-blue-800 transition-colors">
                Learn more 
                <span className="ml-2 font-light">→</span>
              </a>
            </div>

            {/* Inactive Items (Desktop Only - Hidden on Mobile) */}
            <div className="hidden lg:flex items-center gap-4 px-8 py-5 rounded-2xl transition-colors cursor-pointer mt-2">
              <UserIcon />
              <span className="text-[20px] font-semibold text-gray-800">Localized benefits</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-8 py-0 rounded-2xl transition-colors cursor-pointer">
              <MonitorIcon />
              <span className="text-[20px] font-semibold text-gray-800">Money is not beyond borders.</span>
            </div>

            {/* 3rd Item (Desktop Only - Hidden on Mobile) */}
            <div className="hidden lg:flex items-center gap-2 px-8 py-5 mt-2 lg:mt-0 rounded-2xl transition-colors cursor-pointer">
              <MapIcon />
              <span className="text-[20px] font-semibold text-gray-800">Multi country payroll</span>
            </div>

          </div>

          {/* Right Column: Screenshot Container */}
          {/* Added padding left on mobile to give space for the text, keeping image steady */}
          <div className="lg:col-span-7 relative pl-12 lg:pl-0 mt-6 lg:mt-0">
            
            {/* Rotated text placed to the left of the image (Mobile Only - Hidden on Desktop) */}
            {/* Shifted higher (top-32) to align with start, and further right (-left-2) */}
            <div className="flex flex-col md:hidden absolute top-32 -left-17 origin-center -rotate-90 gap-2 whitespace-nowrap z-20 items-start">
              <div className="flex items-center gap-1">
                <UserIcon />
                <span className="text-[13px] font-semibold text-gray-800 tracking-wide">Localized benefits</span>
              </div>
              <div className="flex items-center gap-1">
                <MonitorIcon />
                <span className="text-[13px] font-semibold text-gray-800 tracking-wide">Money is not beyond borders.</span>
              </div>
            </div>

            <div className="w-full relative overflow-hidden left-12 md:left-30 shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/50 border border-white/60">
              
              {/* === PLACE YOUR SCREENSHOT HERE === */}
              <img 
                src="/dashboard.png" 
                alt="Website Builder Editor Interface" 
                className="w-full h-auto object-cover block"
              />
              
            </div>
          </div>
        </div>

        {/* --- Bottom CTA Button --- */}
        <div className="flex justify-center">
          <Link href="/templates">
            <button className="px-10 py-4 bg-[#000] text-white mt-20 md:mt-10 text-lg font-bold rounded-2xl transition-all hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3 active:scale-95">
            Build your website
              <motion.span
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 0.9, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3 }}
                className="inline-block text-xl"
              >
                →
              </motion.span>
            </button>
          </Link>
         
        </div>

      </div>

      {/* --- Decorative Dashed Pattern (Bottom Right) --- */}
      <div className="absolute bottom-10 right-10 md:right-0 opacity-90 pointer-events-none z-0">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="dashes-pattern" x="0" y="0" width="30" height="25" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="16" height="6" rx="3" fill="white" />
          </pattern>
          <rect x="0" y="0" width="200" height="200" fill="url(#dashes-pattern)" />
        </svg>
      </div>
    </section>
  );
}

// --- Raw SVG Icons matching the design perfectly ---
function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
      <rect width="20" height="14" x="2" y="3" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

function MapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
      <path d="M9 3 5 5v16l4-2 6 2 4-2V3l-4 2z"/>
      <line x1="9" y1="3" x2="9" y2="19"/>
      <line x1="15" y1="5" x2="15" y2="21"/>
    </svg>
  );
}