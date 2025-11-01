'use client';
import React from 'react';
import { motion } from 'framer-motion';

// --- Data for the templates ---
const templates = [
  {
    title: 'Parlence',
    description: 'Focus on a single to promote upcoming releases with a coming soon approach that has a modern layout.',
    desktopImage: 'https://cdn.dribbble.com/userupload/6114575/file/original-74a84029d8ea2b66055c8b7076623017.jpg?resize=752x&vertical=center',
    mobileImage: 'https://cdn.dribbble.com/userupload/6114575/file/original-74a84029d8ea2b66055c8b7076623017.jpg?resize=752x&vertical=center',
  },
  {
    title: 'Lanily',
    description: 'Give site visitors eye-catching design, appointment booking, and shopping in one seamless experience.',
    desktopImage: 'https://images.unsplash.com/photo-1598420721894-34a2e52b5757?q=80&w=2670&auto=format&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1620912189837-796ae773a98f?q=80&w=2574&auto=format&fit=crop',
  },
  {
    title: 'Karl Bewick',
    description: 'A bold, minimalist portfolio template to showcase your creative work and professional journey.',
    desktopImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=2574&auto-format&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=2574&auto-format&fit=crop',
  },
  {
    title: 'Factory',
    description: 'A modern, dark-themed storefront perfect for apparel brands and high-end fashion retailers.',
    desktopImage: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=2670&auto=format&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=2574&auto=format&fit=crop',
  },
];

// --- Reusable Template Card Component with Animation ---
const TemplateCard = ({ title, description, desktopImage, mobileImage }) => {
  return (
    <motion.div
      className="group max-w-xl cursor-pointer"
      whileHover="hover"
      initial="initial"
      animate="initial"
    >
      {/* Container for the visual part (images). */}
      <div className="relative h-[320px]">
        
        {/* Mobile View - Positioned BEHIND the desktop view */}
        <motion.div
          className="absolute bottom-0 right-[-100px] z-0 w-[140px] h-[260px] transform overflow-hidden rounded-2xl bg-white shadow-lg p-1.5 pt-6"
          style={{ transformOrigin: "bottom right" }}
          variants={{
            initial: { 
              x: -65, 
              zIndex: 0,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
            },
            hover: {
              x: [-65, 5, -70], // Initial -> Go Right -> Swing to Front
              zIndex: [0, 0, 20],   // Stay behind, then jump to front at the end
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              transition: {
                duration: 0.7,
                ease: "easeInOut",
                times: [0, 0.5, 1] // Control the timing of the keyframes
              },
            },
          }}
        >
          <div className="w-full h-full overflow-hidden rounded-b-xl">
            <img 
              src={mobileImage}
              alt={`${title} Mobile Preview`}
             className="h-full w-full object-cover"
            />
          </div>
        </motion.div>

        {/* Desktop View - Positioned IN FRONT of the mobile view */}
        <motion.div
          className="absolute left-0 top-0 z-10 h-[320px] w-[500px] overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-xl p-1 pt-7"
          style={{ transformOrigin: "bottom left" }}
          variants={{
            initial: {
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.30)"
            },
            hover: {
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
            }
          }}
        >
          <div className="w-full h-full overflow-hidden rounded-b-xl">
            <img
              src={desktopImage}
              alt={`${title} Desktop Preview`}
              className="h-full w-full object-cover"
            />
          </div>
        </motion.div>
      </div>

      {/* --- Hover Info Block --- */}
      <div className="mt-8 min-h-[140px] transform px-2 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-base leading-relaxed text-gray-600">{description}</p>
        <div className="mt-6 flex items-center gap-3">
            <button className="rounded-lg bg-gray-900 px-6 py-2.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-gray-800">
                Start Editing
            </button>
            <button className="rounded-lg bg-white px-6 py-2.5 text-base font-semibold text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50">
                Preview Site
            </button>
        </div>
      </div>
    </motion.div>
  );
};


// --- Main Page ---
export default function TemplatesPage() {
  const businessName = "Your Business"; 

  return (
    <div className="bg-white font-sans">
      <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Choose a Template for {businessName}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-xl text-gray-600">
                Each template is professionally designed to be the perfect starting point for your new website.
            </p>
        </div>

        {/* Updated Grid Container */}
        <div className="mt-24 grid grid-cols-1 justify-items-start gap-x-16 gap-y-24 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-28 pl-6">
          {templates.map((template) => (
            <TemplateCard key={template.title} {...template} />
          ))}
        </div>
      </div>

       {/* Floating Contact Us Button */}
       <button className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-gray-800 shadow-lg ring-1 ring-inset ring-gray-200 transition-transform hover:scale-105">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            Contact Us
       </button>
    </div>
  );
}