'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import NewHeader from '@/components/landing/NewHeader';
import TemplateCarousel from '@/components/landing/TemplateCarousel';
import StickySubNav from '@/components/landing/StickySubNav';
import PricingSection from '@/components/landing/PricingSection';
import TemplatesShowcaseUI from '@/components/templatemarquee';

// Code-split below-fold components (still SSR — no blank gaps)
const LandingEditor = dynamic(() => import('@/components/landing/LandingEditor'));
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks'));
const MarqueeDemo = dynamic(() => import('@/components/landing/MarqueeDemo'));
const BenefitsSection = dynamic(() => import('@/components/landing/BenefitsSection'));
const FaqSection = dynamic(() => import('@/components/checkout/FaqSection'));
const Footer = dynamic(() => import('@/components/Footer'));

export default function LandingPage() {
  return (
    <div className="bg-white font-sans text-gray-900 min-h-screen flex flex-col relative overflow-clip">
      <NewHeader />

      <main className="flex-grow pt-0">
        {/* --- Hero Section --- */}
        <section id="overview" className="relative pt-20 pb-20 sm:pb-32 overflow-hidden bg-[#Fdfdfd] scroll-mt-24">
          {/* Background Decorations */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-brand-100/40 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-100/40 rounded-full blur-[100px]"></div>
          </div>

          {/* Wavy Background Texture */}
          <div className="absolute top-90 md:top-104 md:scale-0.5 md:right-0 md:w-full md:h-[80%] pointer-events-none z-0">
            <img
              src="/landing/bgwaveytexture.png"
              alt="Background Texture"
              className="w-full h-[80%] object-cover opacity-30 md:opacity-15"
            />
          </div>

          <div className="container md:mt-10 mx-auto font-times px-6 md:max-w-7xl relative z-10 text-center">

            <h1 className="text-4xl font-times not-italic md:text-7xl font-bold tracking-tight text-gray-900 mb-6 sm:mb-1 leading-[1.15] md:max-w-4xl mx-auto">
              Don&apos;t sell your dreams, <br />
              <span className="text-transparent not-italic bg-clip-text bg-black">
                Sell your products
              </span>
            </h1>

            {/* ========================================= */}
            {/* DESKTOP VIEW - EXACTLY AS ORIGINAL */}
            {/* ========================================= */}
            <div className="hidden sm:flex flex-row items-center justify-center gap-6 mb-5 text-left">
              {/* Arrow pointing to editor */}
              <img
                src="/landing/arrowdirntoeditor.png"
                alt="Arrow pointing to editor"
                className="w-34 pt-20 mr-0"
              />

              <Link href="/templates">
                <button className="px-10 py-4 bg-[#8A63D2] text-white text-lg font-bold rounded-2xl hover:bg-[#7554b3] transition-all hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-2 active:scale-95">
                  Build website
                </button>
              </Link>

              <p className="text-xl text-gray-600 leading-relaxed font-light">
                Mobile-friendly website for your business<br />
                Grow fast with built-in marketing
              </p>
            </div>

            {/* ========================================= */}
            {/* MOBILE VIEW - CUSTOMIZED LAYOUT */}
            {/* ========================================= */}
            <div className="flex sm:hidden flex-col items-center gap-5 mb-8">
              {/* Adjusted Subheading */}
              <p className="text-base text-gray-600 leading-relaxed font-light px-2">
                Mobile-friendly website for your business<br />
                Grow fast with built-in marketing
              </p>

              {/* Arrow Left, Button Right */}
              <div className="flex flex-row items-center justify-center w-full max-w-sm gap-2 mt-2">
                <div className="flex justify-end items-center w-[40%]">
                  <img
                    src="/landing/arrowdirntoeditor.png"
                    alt="Arrow pointing to editor"
                    className="w-16 transform scale-150 mt-10 mr-5 rotate-[5deg] "
                  />
                </div>
                <div className="flex justify-start w-[60%]">
                  <Link href="/templates" className="w-full pr-4">
                    <button className="w-full px-2 py-3.5 bg-[#8A63D2] text-white text-base font-bold rounded-2xl shadow-xl active:scale-95 flex items-center justify-center">
                      Build website
                    </button>
                  </Link>
                </div>
              </div>
            </div>


            {/* --- Real Editor Demo (Interactive - DESKTOP ONLY) --- */}
            <div className="relative hidden lg:block mx-auto max-w-[1400px] perspective-1000">
              {/* Glow effect behind editor */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-brand-400/20 blur-3xl rounded-[3rem] -z-10"></div>
              <LandingEditor />
            </div>

            {/* --- Mobile & Tablet Editor Mockup --- */}
            <div className="relative lg:hidden mx-auto max-w-[1400px] mt-2 px-2">
              {/* Glow effect behind image */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-brand-400/20 blur-3xl rounded-[3rem] -z-10"></div>

              <img
                src="/editorssmock.png"
                alt="Editor mockup"
                className="w-full h-auto object-contain drop-shadow-md rounded-xl"
              />
            </div>
          </div>
        </section>

        {/* --- STICKY NAV COMES EXACTLY HERE AFTER CAROUSEL --- */}
        <StickySubNav />

        {/* --- PRICING SECTION --- */}
        <section id="pricing" >
          <PricingSection />
        </section>

        {/* --- Templates Section --- */}
        <section id="templates" className="mt-16 sm:mt-24">
          <div className="mb-10 w-full overflow-hidden">
            {/* Mobile / Smaller screens: Marquee */}
            <div className="flex sm:hidden justify-center transform origin-center">
              <TemplatesShowcaseUI />
            </div>
            {/* Desktop / Larger screens: Carousel */}
            <div className="hidden sm:block w-full">
              <TemplateCarousel />
            </div>
          </div>
        </section>

        <div className="flex justify-center mt-8">
          <Link href="/templates">
            <button className="px-8 py-4 sm:py-6 bg-[#000] mb-10 text-white text-base sm:text-lg font-bold rounded-2xl transition-all hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3 active:scale-95">
              Browse All Templates
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

        {/* --- HOW IT WORKS SECTION --- */}
        <section id="how-it-works" >
          <HowItWorks />
        </section>

        {/* --- THRIVING WITH WIX (HORIZONTAL SCROLL) --- */}
        <section id="testimonial" >
          <MarqueeDemo />
        </section>

        {/* --- NEW BENEFITS SECTION INSERTED HERE --- */}
        <section id="benefits" >
          <BenefitsSection />
        </section>

        {/* --- FAQ SECTION --- */}
        <section id="faq" >
          <div className="container my-25 mt-40 mx-auto px-6 max-w-7xl">
            <FaqSection pageType="landing" />
          </div>
        </section>

      </main>

      {/* --- Simple Footer --- */}
      <footer>
        <Footer />
      </footer>
    </div>
  );
}