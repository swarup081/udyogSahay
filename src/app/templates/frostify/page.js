'use client';
import { useTemplateContext } from './templateContext.js';
import { SpecialtyCard, FAQItem, WavySeparatorBottom, ProductCard } from './components.js';
import Link from 'next/link';
import { Editable } from '@/components/editor/Editable';
import { ArrowRight, Star } from 'lucide-react';
import { useState, useEffect } from 'react'; // Added import for slider logic
import { HeroAnimation, ScrollSection, StaggerGrid, StaggerItem } from '@/components/ui/TemplateAnimation';

const getProductsByIds = (allProducts, ids) => {
    if (!allProducts || !ids) return [];
    return ids.map(id => {
        if (typeof id === 'object') return id; // Already an object
        return allProducts.find(p => p.id === id);
    }).filter(Boolean);
};

export default function FrostifyPage() {
    const { basePath } = useTemplateContext();

    const { businessData } = useTemplateContext();
    const [currentReview, setCurrentReview] = useState(0);

    // --- Slider Logic ---
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentReview((prev) => (prev + 1) % businessData.testimonials.items.length);
        }, 3000); // Change every 3 seconds
        return () => clearInterval(interval);
    }, [businessData.testimonials.items.length]);

    if (!businessData) return <div>Loading...</div>;

    return (
        <div className="bg-white w-full max-w-full overflow-hidden overflow-x-hidden">
            
           {/* --- HERO SECTION --- */}
           <Editable focusId="hero">
                <section className="relative w-full pb-8 md:pb-20">
                    <div className="h-2 md:h-4 bg-[var(--color-primary)] w-full opacity-10"></div>
                    <HeroAnimation direction="up" className="container mx-auto px-6 pt-6 md:pt-12 relative">
                        {/* 
                            Hero Layout: "Shrink" Strategy
                            We keep the 12-column grid but use vw units for heights and spacing on mobile to fit it in one view.
                            Grid structure: Image 1 (5 cols) | Text (Overlapping) | Image 2 (6 cols)
                        */}
                        <div className="grid grid-cols-12 gap-2 md:gap-4 h-[60vw] md:h-[600px] items-center md:items-start relative">
                            
                            {/* Image 1: Left */}
                            <div className="col-span-5 h-[80%] self-end relative z-0">
                                <img src={businessData.hero?.image1} className="w-full h-full object-cover" alt="Macarons" />
                            </div>

                            {/* Center Text Box - Scaled Down */}
                            <div className="absolute top-[30%] md:top-[20%] left-1/2 -translate-x-1/2 z-20 bg-white p-3 md:p-12 text-center shadow-xl max-w-[80vw] md:max-w-md w-full">
                                <h1 className="text-[4vw] md:text-5xl font-serif text-[var(--color-primary)] leading-tight mb-2 md:mb-6">
                                    {businessData.hero?.title}
                                </h1>
                                <p className="text-[2vw] md:text-sm font-medium text-gray-600 mb-3 md:mb-8 leading-relaxed">
                                    {businessData.hero?.subtitle}
                                </p>
                                <Link href={`${basePath}/shop`} className="inline-block bg-[var(--color-secondary)] text-white px-3 py-1 md:px-8 md:py-3 rounded-full text-[2vw] md:text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-primary)] transition-colors whitespace-nowrap">
                                    {businessData.hero?.cta}
                                </Link>
                            </div>

                            {/* Image 2: Right */}
                            <div className="col-span-6 col-start-7 h-[70%] relative z-0">
                                <img src={businessData.hero?.image2} className="w-full h-full object-cover" alt="" />
                            </div>
                        </div>
                    </HeroAnimation>
                </section>
            </Editable>

            {/* --- ABOUT SECTION --- */}
            <Editable focusId="about">
                <ScrollSection direction="up" className="bg-[var(--color-primary)] py-10 md:py-20 relative overflow-hidden">
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="bg-white rounded-tl-[40px] md:rounded-tl-[80px] p-0 overflow-hidden flex flex-row md:flex-row max-w-4xl mx-auto shadow-2xl">
                            <div className="w-1/2 md:w-1/3 h-auto">
                                <img src={businessData.about?.image} className="w-full h-full object-cover rounded-br-[40px] md:rounded-br-[80px]" alt="Baker" />
                            </div>
                            <div className="w-1/2 md:w-1/2 p-4 md:p-12 flex flex-col justify-center">
                                <h2 className="text-[5vw] md:text-4xl font-serif text-[var(--color-primary)] mb-2 md:mb-6 leading-tight">{businessData.about?.title}</h2>
                                <p className="text-[2.5vw] md:text-sm text-gray-600 leading-tight md:leading-7 mb-2 md:mb-6">{businessData.about?.text}</p>
                                <p className="text-[2.5vw] md:text-sm font-bold italic text-[var(--color-primary)]">{businessData.about?.subtext}</p>
                            </div>
                        </div>
                    </div>
                </ScrollSection>
            </Editable>

            {/* --- SPECIALTIES --- */}
            <Editable focusId="specialties">
                <ScrollSection direction="up" className="py-12 md:py-24 bg-[var(--color-primary)] text-white relative">
                    <div className="container mx-auto px-6">
                        <h2 className="text-[6vw] md:text-4xl font-serif text-center mb-8 md:mb-16 text-white">{businessData.specialties?.title}</h2>
                        <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-6xl mx-auto">
                          {(businessData.specialties?.items || []).map((item, index) => {
                              const shapes = [
                                  "rounded-r-full rounded-tl-full",
                                  "rounded-t-full",
                                  "rounded-br-[100px]",
                                  "rounded-l-full"
                              ];
                              const shapeClass = shapes[index % shapes.length];
                              return (
                                  <StaggerItem key={index}>
                                      <SpecialtyCard title={item.title} icon={item.icon} shapeClass={shapeClass} />
                                  </StaggerItem>
                              );
                          })}
                        </StaggerGrid>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full translate-y-[99%] text-[var(--color-primary)]">
                        <WavySeparatorBottom fill="currentColor" />
                    </div>
                </ScrollSection>
            </Editable>

            {/* --- GALLERY STRIP with Product Cards --- */}
            <Editable focusId="gallery">
                <ScrollSection direction="up" className="py-12 pt-20 md:py-24 md:pt-32 bg-[#fff]">
                    <div className="container mx-auto px-6">
                        <h2 className="text-[6vw] md:text-4xl font-serif text-[var(--color-primary)] text-center mb-6 md:mb-12">{businessData.gallery?.title}</h2>
                        
                        {/* Grid of Cards */}
                        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                            {getProductsByIds(businessData.allProducts, businessData.gallery?.items || []).map((item) => (
                                <StaggerItem key={item.id}>
                                    <ProductCard item={item} />
                                </StaggerItem>
                            ))}
                        </StaggerGrid>

                        {/* Explore Full Collection Button */}
                        <div className="mt-8 md:mt-16 text-center">
                            <Link 
                                href={`${basePath}/shop`}
                                className="inline-block bg-[var(--color-secondary)] text-white px-6 py-3 md:px-10 md:py-4 rounded-full text-[2.5vw] md:text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-primary)] transition-all shadow-lg transform hover:scale-105"
                            >
                                 Explore Full Collection  
                            </Link>
                        </div>
                    </div>
                </ScrollSection>
            </Editable>

            {/* --- TESTIMONIALS (UPDATED UI with Mobile Slider) --- */}
            <Editable focusId="testimonials">
                <ScrollSection direction="up" className="py-12 md:py-24 bg-[#F9F4F6] border-t border-white">
                    <div className="container mx-auto px-6 max-w-6xl">
                        <div className="text-center mb-8 md:mb-16">
                            <span className="text-[var(--color-secondary)] text-[2.5vw] md:text-xs font-bold uppercase tracking-[0.2em]">What People Are Saying</span>
                            <h2 className="text-[6vw] md:text-4xl font-serif text-[var(--color-primary)] mt-2 md:mt-3">{businessData.testimonials?.title}</h2>
                        </div>

                        {/* Mobile: Infinite Slider (1 item) */}
                        <div className="block md:hidden relative h-[300px]"> {/* Fixed height container for slider */}
                            {(businessData.testimonials?.items || []).map((testimonial, index) => (
                                <div 
                                    key={index} 
                                    className={`absolute top-0 left-0 w-full transition-opacity duration-1000 ease-in-out ${index === currentReview ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                >
                                    <div className="bg-white p-6 rounded-tl-[20px] rounded-br-[20px] shadow-sm relative mx-auto max-w-sm">
                                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-[var(--color-secondary)] rounded-full flex items-center justify-center">
                                            <span className="text-white text-lg font-serif">”</span>
                                        </div>
                                        
                                        <div className="flex gap-1 mb-3">
                                            {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />)}
                                        </div>

                                        <p className="text-[var(--color-primary)] text-[3.5vw] leading-relaxed italic mb-4 line-clamp-4 min-h-[80px]">
                                            "{testimonial.text}"
                                        </p>

                                        <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                                            <img 
                                                src={testimonial.image} 
                                                alt={testimonial.author} 
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="overflow-hidden">
                                                <h4 className="font-bold text-[3vw] text-[var(--color-primary)] uppercase tracking-wider truncate">{testimonial.author}</h4>
                                                <span className="text-[2.5vw] text-gray-400">Happy Customer</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Grid (3 items) */}
                        <div className="hidden md:grid grid-cols-3 gap-8">
                            {(businessData.testimonials?.items || []).map((testimonial, index) => (
                                <div key={index} className="bg-white p-8 rounded-tl-[40px] rounded-br-[40px] shadow-sm hover:shadow-md transition-shadow relative">
                                    <div className="absolute -top-4 -right-4 w-10 h-10 bg-[var(--color-secondary)] rounded-full flex items-center justify-center">
                                        <span className="text-white text-2xl font-serif">”</span>
                                    </div>
                                    
                                    <div className="flex gap-1 mb-4">
                                        {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />)}
                                    </div>

                                    <p className="text-[var(--color-primary)] leading-relaxed italic mb-6">
                                        "{testimonial.text}"
                                    </p>

                                    <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                                        <img 
                                            src={testimonial.image} 
                                            alt={testimonial.author} 
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <h4 className="font-bold text-sm text-[var(--color-primary)] uppercase tracking-wider">{testimonial.author}</h4>
                                            <span className="text-xs text-gray-400">Happy Customer</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollSection>
            </Editable>

            {/* --- FAQ SECTION --- */}
            <Editable focusId="faq">
                <ScrollSection direction="up" className="py-10 md:py-20 bg-white border-t border-brand-100">
                    <div className="container mx-auto px-6 max-w-3xl">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-[6vw] md:text-3xl font-serif text-[var(--color-primary)]">{businessData.faq?.title}</h2>
                        </div>
                        {(businessData.faq?.questions || []).map((q, i) => (
                            <FAQItem key={i} question={q.q} answer={q.a} />
                        ))}
                    </div>
                </ScrollSection>
            </Editable>

        </div>
    );
}