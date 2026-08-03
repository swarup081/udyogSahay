'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowRight } from 'lucide-react';
import NewHeader from '@/components/landing/NewHeader';
import Footer from '@/components/Footer';
import BlogSecondaryNav from '@/components/blogs/BlogSecondaryNav';
import BlogBentoGrid from '@/components/blogs/BlogBentoGrid';
import { ALL_BLOG_POSTS } from '@/data/blogData';

export default function BlogPage() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [activeCategory, setActiveCategory] = React.useState('All');

  // Filter by category
  const filteredPosts = activeCategory === 'All' 
    ? ALL_BLOG_POSTS 
    : ALL_BLOG_POSTS.filter(p => p.category === activeCategory);

  const chunkedPosts = [];
  for (let i = 0; i < filteredPosts.length; i += 6) {
    chunkedPosts.push(filteredPosts.slice(i, i + 6));
  }
  const totalPages = chunkedPosts.length;
  const currentPosts = chunkedPosts[currentPage - 1] || [];

  // Reset page when category changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  return (
    <div className="bg-white font-sans text-gray-900 min-h-screen flex flex-col relative overflow-clip">
      <NewHeader />

      <main className="flex-grow pb-16">
        
        <div className="bg-gray-50/50 pb-8 pt-4 md:pt-12">
          <div className="mb-4">
            <BlogSecondaryNav posts={ALL_BLOG_POSTS} onCategoryChange={setActiveCategory} />
          </div>

          <div id="all-blogs" className="w-full max-w-[1300px] mx-auto px-4 md:px-6 scroll-mt-28">
            {/* HEADER SECTION */}
            <div className="flex items-center justify-between mb-8 mt-10">
              <h2 className="text-[40px] md:text-[60px] font-inter font-black uppercase tracking-[-0.04em] text-gray-900 leading-none">
                BLOG
              </h2>
              <button onClick={() => document.getElementById('all-blogs')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 md:px-8 md:py-4 bg-[#f1f1f4] hover:bg-gray-200 text-gray-900 rounded-[30px] flex items-center gap-4 text-[14px] font-medium transition-colors cursor-pointer">
                Read Our Blog <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Bento Grids */}
            <div>
              <BlogBentoGrid posts={currentPosts} />
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 md:mt-12 text-gray-500">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1} 
              className="p-2 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              <ChevronsLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="p-2 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex gap-4 px-2 text-sm md:text-base font-medium">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page} 
                  onClick={() => setCurrentPage(page)} 
                  className={currentPage === page ? "text-blue-600 font-bold" : "hover:text-black transition-colors"}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className="p-2 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages} 
              className="p-2 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              <ChevronsRight size={20} />
            </button>
          </div>
        )}

        {/* Call to Action Banner */}
        <div className="max-w-[1350px] mx-auto px-4 md:px-6 mt-16 md:mt-24 mb-10">
          <div className="w-full rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#a6c1ee] via-[#d6c4f4] to-[#fbc2eb] py-16 md:py-32 px-6 md:px-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-normal tracking-tight text-gray-900 mb-6 md:mb-8 max-w-2xl leading-tight z-10">
              Create a website<br />that can do it all
            </h2>
            <Link href="/templates" className="z-10">
              <button className="px-8 py-4 bg-black text-white text-lg font-medium rounded-full hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                Start Now
              </button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
