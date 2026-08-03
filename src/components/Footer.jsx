'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@/lib/logo/logoOfBizVistar';

const footerData = [
  {
    title: "Platform",
    links: [
      { name: "Website Templates", href: "/templates" },
      { name: "Pricing", href: "/pricing" },
      { name: "Login", href: "/sign-in" },
      { name: "Start for free", href: "/templates" },
    ]
  },
  {
    title: "Features",
    links: [
      { name: "Online Store", href: "/#e-commerce" },
      { name: "AI Builder", href: "/#ai" },
      { name: "UPI Payments", href: "/#upi" },
      { name: "Analytics Dashboard", href: "/#analytics" },
    ]
  },
  {
    title: "Legal",
    links: [
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Refund Policy", href: "/terms" },
    ]
  },
  {
    title: "Company",
    links: [
      { name: "Contact Support", href: "mailto:support@bizvistar.in" },
      { name: "Report Abuse", href: "mailto:support@bizvistar.in" },
      { name: "About Us", href: "/#about" },
      { name: "Blog", href: "/blogs" },
    ]
  },
  {
    title: "Other",
    links: [
      { name: "Creator Dashboard", href: "/dashboard" },
      { name: "Manage Website", href: "/editor" },
      { name: "FAQ & Help", href: "/#faq" },
    ]
  }
];

const AccordionItem = ({ section }) => {
  // Mobile accordion state. Defaults to false on mobile by default to keep it compact.
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 md:border-b-0">
      <div
        className="flex justify-between items-center py-5 md:py-0 cursor-pointer md:cursor-auto group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-[15px] font-medium text-black">
          {section.title}
        </h3>
        {/* Chevron for mobile accordion */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 md:hidden ${isOpen ? '-rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* The `hidden md:flex` ensures these ALWAYS display as flex block on desktop regardless of `isOpen` */}
      <ul className={`pb-5 md:pb-0 md:pt-6 flex-col gap-3.5 text-[14px] text-gray-600 ${isOpen ? 'flex' : 'hidden md:flex'}`}>
        {section.links.map((link, linkIdx) => {
          const isHighlight = link.highlight || false;
          return (
            <li key={linkIdx}>
              <Link
                href={link.href || "#"}
                className={`hover:text-black transition-colors ${isHighlight ? 'text-blue-600 hover:text-blue-700 font-medium' : ''}`}
              >
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default function Footer() {
  return (
    <footer className="w-full bg-white text-gray-800 font-sans border-t border-gray-200 relative pb-10 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-16">

        {/* Main Row Layer */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-8 border-t border-gray-200 pt-6 lg:border-t-0 lg:pt-0">

          {/* Brand Intro & Contact - APPEARS FIRST (Left on desktop, Top on mobile) */}
          <div className="flex flex-col text-sm text-gray-800 w-full lg:w-[28%] max-w-xs">
            <Link href="/" className="mb-5 hover:opacity-80 transition-opacity w-max lg:-mt-1.5">
              <Logo className="text-2xl" />
            </Link>
            <p className="leading-relaxed mb-6 font-medium text-gray-600">
              Bizvistar is a powerful platform that empowers businesses and individuals to build professional websites effortlessly.
            </p>
            <div className="flex flex-col gap-4">
              <Link href="mailto:support@bizvistar.in" className="font-bold text-black border-b border-black pb-0.5 w-max hover:text-gray-600 hover:border-gray-600 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Links Grid - APPEARS SECOND (Right on desktop, Bottom on mobile) */}
          <div className="w-full lg:w-[72%] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0 md:gap-6 lg:gap-8 border-t border-gray-200 lg:border-t-0 pt-6 lg:pt-0">
            {footerData.map((section, idx) => (
              <AccordionItem key={idx} section={section} />
            ))}
          </div>

        </div>

        {/* Legal Links & Copyright */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
          </div>
          <span>© {new Date().getFullYear()} Bizvistar. All rights reserved.</span>
        </div>

      </div>
    </footer>
  );
}