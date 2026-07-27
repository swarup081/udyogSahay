'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
// --- IMPORT EDITABLE ---
import { Editable } from '@/components/editor/Editable';
import { useTemplateContext } from './templateContext.js'; // Import context
import { 
    ProductCard, 
    ArrowRightIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon 
} from './components.js'; // Import new ProductCard and icons
import { HeroAnimation, ScrollSection, StaggerGrid, StaggerItem } from '@/components/ui/TemplateAnimation';

// Helper: Get product details from the master list by their IDs
const getProductsByIds = (allProducts, ids) => {
    if (!allProducts || !ids) return [];
    return ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
};

// --- Main Page Component ---
export default function BrewhavenPage() {
    const { basePath } = useTemplateContext();

    
    // --- GET DATA FROM CONTEXT ---
    const { businessData } = useTemplateContext();
    if (!businessData) return <div>Loading...</div>; // Guard
    
    // Get product objects for the specialty section
    const specialtyProducts = getProductsByIds(businessData.allProducts, businessData.specialty.itemIDs);
    
    // --- Testimonial Slider Logic ---
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const testimonials = businessData.testimonials.items;

    const prevTestimonial = () => {
        setCurrentTestimonial(current => (current === 0 ? testimonials.length - 1 : current - 1));
    };

    const nextTestimonial = () => {
        setCurrentTestimonial(current => (current === testimonials.length - 1 ? 0 : current + 1));
    };

    const goToTestimonial = (index) => {
        setCurrentTestimonial(index);
    };
    // --- End Testimonial Logic ---
    
    return (
        <main className="w-full max-w-full overflow-hidden overflow-x-hidden">
            {/* --- Hero Section --- */}
            <Editable focusId="hero">
                <section id="home" className="relative overflow-hidden bg-brand-primary">
                <div className="container mx-auto px-4 md:px-6 py-10 md:py-28 max-w-5xl grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-10 items-center">
                    <HeroAnimation direction="up" delay={0.1} className="flex flex-col gap-2 md:gap-6 text-left items-start">
                    <h1 className="text-[6vw] md:text-6xl font-bold text-brand-text leading-tight">{businessData.hero.title}</h1>
                    <p className="text-[2.5vw] md:text-lg text-brand-text opacity-70 max-w-md leading-tight">{businessData.hero.subtitle}</p>
                    <a 
                        href="#menu"
                        className="mt-2 md:mt-4 inline-flex items-center gap-2 md:gap-3 bg-brand-secondary text-brand-bg px-4 py-2 md:px-8 md:py-4 text-[2.5vw] md:text-base font-medium tracking-wide rounded-lg hover:opacity-90 transition-all"
                    >
                        <span>{businessData.hero.cta}</span>
                    </a>
                    </HeroAnimation>
                    {/* Image always visible now for shrink layout */}
                    <HeroAnimation direction="left" delay={0.2} className="flex justify-center">
                    <div className="w-full max-w-sm lg:max-w-md aspect-square overflow-hidden">
                        <img 
                        src={businessData.hero.image} 
                        alt="Hero Image" 
                        className="w-full h-full object-contain object-center"
                        />
                    </div>
                    </HeroAnimation>
                </div>
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
                    <svg className="relative block w-[calc(100%+1.3px)] h-8 md:h-32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,40 C150,90 350,0 600,60 C850,120 1050,20 1200,70 L1200,0 L0,0 Z" fill="currentColor" className="text-brand-bg"/>
                    </svg>
                </div>
                </section>
            </Editable>

            {/* --- Events Section --- */}
            <Editable focusId="events">
                <ScrollSection direction="up" id="events" className="py-10 md:py-24">
                    <div className="container mx-auto px-4 md:px-6">
                        <h2 className="text-[6vw] md:text-5xl font-bold text-brand-text text-center mb-8 md:mb-16">{businessData.events.title}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                            {businessData.events.items.map((item, index) => (
                                <div key={index} className={`bg-brand-primary rounded-lg overflow-hidden shadow-sm flex flex-col ${index >= 2 ? 'hidden md:flex' : ''}`}>
                                    <img src={item.image} alt={item.title} className="w-full h-[20vw] md:h-48 object-cover"/>
                                    <div className="p-3 md:p-8 flex flex-col flex-grow">
                                        <h3 className="text-[3vw] md:text-2xl font-bold text-brand-text mb-1 md:mb-3">{item.title}</h3>
                                        <p className="text-brand-text opacity-70 mb-2 md:mb-5 text-[2vw] md:text-base line-clamp-2 md:line-clamp-none flex-grow">{item.text}</p>
                                        <a href="#" className="font-semibold text-brand-secondary hover:text-brand-text transition-colors flex items-center text-[2.5vw] md:text-base mt-auto">
                                            Read more <ArrowRightIcon className="w-3 h-3 md:w-5 md:h-5 ml-1 md:ml-2" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollSection>
            </Editable>

            {/* --- About Section --- */}
            <Editable focusId="about">
                <ScrollSection direction="up" id="about" className="py-10 md:py-24 bg-brand-primary relative">
                <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0]">
                    <svg className="relative block w-[calc(100%+1.3px)] h-8 md:h-32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,50 C100,90 200,10 300,50 C400,90 500,10 600,50 C700,90 800,10 900,50 C1000,90 1100,10 1200,50 L1200,0 L0,0 Z" fill="currentColor" className="text-brand-bg"/>
                    </svg>
                </div>
                <div className="container mx-auto py-6 md:py-14 max-w-6xl grid grid-cols-2 md:grid-cols-2 gap-6 md:gap-16 items-center px-4 md:px-6">
                    <div className="flex justify-center">
                        <img 
                            src={businessData.about.image} 
                            alt="Artisanal Roasting" 
                            className="w-full max-w-md lg:max-w-lg aspect-[4/5] object-cover rounded-t-full shadow-md"
                        />
                    </div>
                    <div className="text-left items-start flex flex-col">
                        <h2 className="text-[5vw] md:text-5xl font-bold text-brand-text leading-tight"> {businessData.about.title}</h2>
                        <p className="text-[2.5vw] md:text-lg text-brand-text opacity-70 mt-2 md:mt-6 max-w-lg leading-tight">{businessData.about.text}</p>
                        <div className="mt-4 md:mt-8 space-y-3 md:space-y-6">
                            {businessData.about.features.map((feature, index) => (
                                <div key={index}>
                                    <h4 className="text-[3vw] md:text-xl font-bold text-brand-text">{feature.title}</h4>
                                    <p className="text-brand-text opacity-70 mt-0.5 md:mt-1 text-[2vw] md:text-base leading-tight">{feature.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
                    <svg className="relative block w-[calc(100%+1.3px)] h-8 md:h-32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,50 C100,90 200,10 300,50 C400,90 500,10 600,50 C700,90 800,10 900,50 C1000,90 1100,10 1200,50 L1200,0 L0,0 Z" fill="currentColor" className="text-brand-bg"/>
                    </svg>
                </div>
                </ScrollSection>
            </Editable>

            {/* --- Menu Section --- */}
            <Editable focusId="menu">
                <ScrollSection direction="up" id="menu" className="py-10 md:py-24">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
                            <span className="inline-block bg-brand-primary text-brand-secondary text-[2vw] md:text-sm font-semibold px-3 py-0.5 md:px-4 md:py-1 rounded-full mb-2 md:mb-4">
                                {businessData.menu.badge}
                            </span>
                            <h2 className="text-[6vw] md:text-5xl font-bold text-brand-text mb-2 md:mb-4">{businessData.menu.title}</h2>
                            <p className="text-[2.5vw] md:text-lg text-brand-text opacity-70">{businessData.menu.description}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 md:gap-x-12 gap-y-4 md:gap-y-8 max-w-4xl mx-auto">
                            {businessData.menu.items.map((item, index) => (
                                <div key={index} className="py-2 md:py-4">
                                    <div className="flex justify-between items-baseline mb-1 md:mb-2">
                                        <h4 className="text-[3vw] md:text-2xl font-bold text-brand-text truncate pr-1">{item.name}</h4>
                                        <span className="text-[3vw] md:text-2xl font-bold text-brand-secondary">₹{item.price}</span>
                                    </div>
                                    <p className="text-brand-text opacity-70 text-[2vw] md:text-base leading-tight line-clamp-2">{item.description}</p>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-6 md:mt-12">
                            <a href={`${basePath}/shop`} className="font-semibold text-brand-secondary text-[3vw] md:text-lg hover:text-brand-text transition-colors flex items-center justify-center">
                                {businessData.menu.cta} <ArrowRightIcon className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                            </a>
                        </div>
                    </div>
                </ScrollSection>
            </Editable>

            {/* --- Testimonials Section --- */}
            <Editable focusId="testimonials">
                <ScrollSection direction="up" id="testimonials" className="py-10 md:py-24 bg-brand-bg">
                    <div className="container mx-auto px-6 relative max-w-3xl">
                        <div className="relative flex flex-col items-center">
                            <span className="font-serif text-[15vw] md:text-9xl text-brand-text/80 leading-none -mb-2 md:-mb-4">”</span>
                            <motion.p 
                                key={currentTestimonial}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="text-[3vw] md:text-4xl text-brand-text text-center mt-2 md:mt-6 min-h-[80px] md:min-h-[120px] px-2"
                                style={{ fontFamily: 'var(--font-handwriting)' }}
                            >
                                {testimonials[currentTestimonial].quote}
                            </motion.p>
                            <div className="w-10 md:w-16 h-1 bg-brand-accent my-4 md:my-8"></div>
                            <div className="text-center font-sans">
                                <h5 className="text-[3vw] md:text-lg font-bold text-brand-text">{testimonials[currentTestimonial].name}</h5>
                                <p className="text-[2vw] md:text-sm text-brand-text/70 font-medium">{testimonials[currentTestimonial].title}</p>
                            </div>
                            <button onClick={prevTestimonial} className="absolute -left-2 md:-left-24 top-1/2 -translate-y-1/2 p-2" aria-label="Previous testimonial">
                                <ChevronLeftIcon className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                            <button onClick={nextTestimonial} className="absolute -right-2 md:-right-24 top-1/2 -translate-y-1/2 p-2" aria-label="Next testimonial">
                                <ChevronRightIcon className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                        </div>
                        <div className="flex justify-center gap-2 mt-6 md:mt-12">
                            {testimonials.map((_, index) => (
                                <button 
                                    key={index} 
                                    onClick={() => goToTestimonial(index)}
                                    className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${
                                        currentTestimonial === index ? 'bg-brand-accent' : 'bg-brand-text/20 hover:bg-brand-text/40'
                                    }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </ScrollSection>
            </Editable>
            
            {/* --- Specialty Section --- */}
            <Editable focusId="specialty">
                <ScrollSection direction="up" id="specialty" className="py-10 md:py-24">
                    <div className="container mx-auto px-4 md:px-6 text-center">
                        <h2 className="text-[6vw] md:text-5xl font-bold text-brand-text mb-8 md:mb-16">{businessData.specialty.title}</h2>
                        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                            {specialtyProducts.map((item) => (
                                <StaggerItem key={item.id}>
                                    <ProductCard 
                                        item={item}
                                        templateName="blissly"
                                    />
                                </StaggerItem>
                            ))}
                        </StaggerGrid>
                    </div>
                </ScrollSection>
            </Editable>

            {/* --- Final CTA --- */}
            <Editable focusId="cta">
                <ScrollSection direction="up" id="cta-final" className="py-10 md:py-24 bg-brand-primary">
                    <div className="container mx-auto px-4 md:px-6 flex flex-row md:flex-row justify-between items-center text-left md:text-left gap-4">
                        <div>
                            <h2 className="text-[5vw] md:text-4xl font-bold text-brand-text max-w-xl">{businessData.cta.title}</h2>
                            <p className="text-[2.5vw] md:text-lg text-brand-text opacity-70 max-w-xl mt-2 md:mt-4 leading-tight">{businessData.cta.text}</p>
                        </div>
                        <a 
                            href="#contact"
                            className="inline-flex flex-shrink-0 items-center gap-2 md:gap-3 bg-brand-secondary text-brand-bg px-4 py-2 md:px-8 md:py-4 text-[2.5vw] md:text-base font-medium tracking-wide rounded-lg hover:opacity-90 transition-all"
                        >
                            <span className="whitespace-nowrap">{businessData.cta.cta}</span>
                        </a>
                    </div>
                </ScrollSection>
            </Editable>
        </main>
    );
}