'use client';
import { useTemplateContext } from './templateContext.js';
import { ProductCard, FAQAccordion, InstagramFeed, TestimonialSlider, FeatureIcon, NewsletterCTA } from './components.js';
import { HeroAnimation, ScrollSection, StaggerGrid, StaggerItem, FloatingElement } from '@/components/ui/TemplateAnimation';
import Link from 'next/link';
import { Editable } from '@/components/editor/Editable';
import { Play, ArrowRight, ArrowDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const getProductsByIds = (allProducts, ids) => {
    if (!allProducts || !ids) return [];
    return ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
};

// "Explore All" Rotating Button
const ExploreCircle = ({ isLanding }) => {
    const { basePath } = useTemplateContext();
    const content = (
      <div  className="relative w-[25vw] h-[25vw] md:w-32 md:h-32 flex items-center justify-center cursor-pointer group">
        <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                <text className="font-sans text-[10px] uppercase tracking-[0.2em] fill-[var(--color-dark)] font-bold">
                    <textPath href="#circlePath" startOffset="0%">
                        •  Explore NOW • • Explore NOW • 
                    </textPath>
                </text>
            </svg>
        </div>
        <div className="w-[12vw] h-[12vw] md:w-14 md:h-14 bg-[var(--color-dark)] rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <ArrowDown size={20} className="w-[5vw] h-[5vw] md:w-5 md:h-5" />
        </div>
    </div>
    );

    if (isLanding) {
        return (
            <div className="relative group/tooltip" onClick={(e) => e.preventDefault()}>
                {content}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Unlock full potential in editor (Demo)
                </div>
            </div>
        );
    }

    return <Link href={`${basePath}/shop`}>{content}</Link>;
};

function AuroraContent() {
    const { businessData, basePath } = useTemplateContext();
    const searchParams = useSearchParams();
    const isLanding = searchParams.get('isLanding') === 'true';

    if (!businessData) return <div>Loading...</div>;

    // --- FIX: Safely access collections.itemIDs using optional chaining ---
    // If businessData.collections is undefined, we fallback to an empty array for IDs.
    const featuredProducts = getProductsByIds(
        businessData.allProducts, 
        businessData.collections?.itemIDs || []
    );

    return (
        <div className="bg-[var(--color-bg)] w-full max-w-full overflow-hidden overflow-x-hidden">
            
           {/* --- HERO SECTION --- */}
           <Editable focusId="hero">
                <section className={`relative w-full flex flex-col pb-0 ${isLanding ? 'pt-32 md:pt-40' : 'pt-4 md:pt-20'}`} style={isLanding ? { minHeight: '100vh', overflow: 'hidden' } : {}}>
                    
                    {/* Background Split: The right beige block */}
                    <div className="absolute top-0 right-0 w-[40%] h-[90%] bg-[var(--color-bg-alt)] -z-10 rounded-bl-[100px] hidden lg:block"></div>

                    <div className="container mx-auto px-6 lg:px-16 relative flex-grow flex flex-col justify-center">
                        {/* Mobile: Grid Cols 2 (Shrink) | Desktop: Grid Cols 12 */}
                        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-12 items-center">
                            
                            {/* LEFT COLUMN: Text */}
                            <HeroAnimation direction="up" delay={0.1} className="lg:col-span-6 flex flex-col justify-center lg:pr-12 z-10 pt-4 md:pt-0 lg:py-[220px]">
                                <div className="relative">
                                    <h1 className="text-[10vw] md:text-[90px] font-serif leading-[1.1] text-[var(--color-dark)] tracking-tight break-words">
                                        <span className="relative inline-block">
                                            {businessData.hero?.title || "Desire Meets New Style"}
                                            {/* Floating Bracelet Image Graphic */}
                                            <FloatingElement yOffset={10} duration={4} className="absolute -left-[10vw] lg:-left-28 top-1/2 -translate-y-1/2 w-[8vw] h-[6vw] lg:w-24 lg:h-16 hidden lg:block rotate-12 opacity-80">
                                                <img src="https://res.cloudinary.com/drg4lzk9s/image/upload/v1775893558/bizvistar/aurora/diamondsimageforaurora.png" alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                            </FloatingElement>
                                        </span>
                                    </h1>
                                </div>
                                
                                <p className="text-[var(--color-text-light)] text-[3vw] md:text-lg mt-4 md:mt-8 mb-4 md:mb-10 max-w-lg font-light leading-relaxed break-words">
                                    {businessData.hero?.subtitle || "Anyone can get dressed up and glamorous, but it is how people dress in their days off that."}
                                </p>
                            </HeroAnimation>

                            {/* RIGHT COLUMN: Images */}
                            <HeroAnimation direction="left" delay={0.25} className="lg:col-span-6 relative h-[60vw] lg:h-[750px] mt-4 lg:mt-0">
                                {/* Main Image (Hands) */}
                                <div className="absolute left-0 lg:left-0 top-0 w-[60%] h-[85%] z-20">
                                    <img 
                                        src={businessData.hero?.imageArch1} 
                                        alt="Jewelry Model" 
                                        className="w-full h-full object-cover shadow-2xl" 
                                    />
                                </div>

                                {/* Secondary Image (Arch on Right) */}
                                <div className="absolute right-0 top-[10%] lg:top-30 w-[35%] h-[40%] z-10 rounded-t-full lg:rounded-t-[200px] overflow-hidden">
                                    <img 
                                        src={businessData.hero?.imageSmallArch} 
                                        alt="Detail" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                
                                {/* SVG Decoration */}
                                <svg
                                    className="absolute inset-0 w-full h-full pointer-events-none -z-10"
                                    viewBox="0 0 800 320"
                                    preserveAspectRatio="xMidYMid slice" 
                                    aria-hidden="true"
                                >
                                    <defs>
                                        <linearGradient id="arcGrad" x1="0" x2="1" y1="0" y2="0">
                                            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0" />
                                            <stop offset="20%" stopColor="var(--color-gold)" stopOpacity="0.6" />
                                            <stop offset="50%" stopColor="var(--color-gold)" stopOpacity="1" />
                                            <stop offset="80%" stopColor="var(--color-gold)" stopOpacity="0.6" />
                                            <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
                                        </linearGradient>

                                        <linearGradient id="edgeFade" x1="0" x2="1" y1="0" y2="0">
                                            <stop offset="0%" stopColor="black" stopOpacity="0" />
                                            <stop offset="15%" stopColor="black" stopOpacity="1" />
                                            <stop offset="85%" stopColor="black" stopOpacity="1" />
                                            <stop offset="100%" stopColor="black" stopOpacity="0" />
                                        </linearGradient>

                                        <mask id="fadeMask">
                                            <rect x="0" y="0" width="100%" height="100%" fill="url(#edgeFade)" />
                                        </mask>
                                    </defs>

                                    <g
                                        mask="url(#fadeMask)"
                                        fill="none"
                                        stroke="url(#arcGrad)"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path
                                            d="M-50,300 C200,50 600,50 850,300"
                                            strokeWidth="3"
                                            className="opacity-90"
                                        />
                                        <path
                                            d="M-20,320 C220,100 580,100 820,320"
                                            strokeWidth="2"
                                            className="opacity-70"
                                        />
                                        <path
                                            d="M20,340 C240,150 560,150 780,340"
                                            strokeWidth="1.5"
                                            strokeDasharray="6 8"
                                            className="opacity-40"
                                        />
                                    </g>
                                </svg>
                            </HeroAnimation>
                        </div>
                    </div>

                    {/* --- STATS BAR OVERLAY (Scaled Down) --- */}
                    <HeroAnimation direction="up" delay={0.35} className="relative left-0 w-full z-30 mt-8 lg:-mt-[220px]">
                        <div className="container mx-auto px-0 lg:px-16">
                            <div className="flex flex-row items-end"> {/* Forced Row on Mobile */}
                                
                                {/* 1. Dark Image Box (Left) */}
                                <div className="w-[30%] lg:w-[280px] h-[20vw] lg:h-[220px] bg-[var(--color-dark)] relative flex items-center justify-center overflow-hidden">
                                     <img 
                                        src={businessData.hero?.imageArch1_b} 
                                        alt="Necklace Feature" 
                                        className="w-[80%] h-[80%] object-contain drop-shadow-xl"
                                     />
                                </div>

                                {/* 2. Beige Stats Box (Middle) - Scaled Text */}
                                <div className="bg-[var(--color-bg-alt)] flex-1 h-[15vw] lg:h-[160px] flex items-center justify-around px-2 lg:px-20">
                                    <div className="text-center">
                                        <span className="block font-serif text-[4vw] lg:text-4xl text-[var(--color-dark)] mb-0.5 lg:mb-1">{businessData.hero?.stats?.[0]?.value || "12"}</span>
                                        <span className="text-[1.5vw] lg:text-xs uppercase tracking-widest text-[var(--color-text-light)]">{businessData.hero?.stats?.[0]?.label || "All over World"}</span>
                                    </div>
                                    <div className="w-px h-[8vw] lg:h-12 bg-[var(--color-gold)] opacity-30"></div>
                                    <div className="text-center">
                                        <span className="block font-serif text-[4vw] lg:text-4xl text-[var(--color-dark)] mb-0.5 lg:mb-1">{businessData.hero?.stats?.[1]?.value || "150+"}</span>
                                        <span className="text-[1.5vw] lg:text-xs uppercase tracking-widest text-[var(--color-text-light)]">{businessData.hero?.stats?.[1]?.label || "Product Available"}</span>
                                    </div>
                                    <div className="w-px h-[8vw] lg:h-12 bg-[var(--color-gold)] opacity-30"></div>
                                    <div className="text-center">
                                        <span className="block font-serif text-[4vw] lg:text-4xl text-[var(--color-dark)] mb-0.5 lg:mb-1">{businessData.hero?.stats?.[2]?.value || "1K+"}</span>
                                        <span className="text-[1.5vw] lg:text-xs uppercase tracking-widest text-[var(--color-text-light)]">{businessData.hero?.stats?.[2]?.label || "Product Reviews"}</span>
                                    </div>
                                </div>

                                {/* 3. Circle Button (Right) - Overlapping */}
                                <div className="block ml-2 md:ml-10 mb-4 md:mb-10">
                                    <ExploreCircle isLanding={isLanding} />
                                </div>

                            </div>
                        </div>
                    </HeroAnimation>
                </section>
            </Editable>

            {!isLanding && (
            <>
                {/* --- FEATURES MARQUEE SECTION (UPDATED) --- */}
                <Editable focusId="features">
                    <section className="py-8 md:py-16 bg-white border-b border-gray-100 mt-6 lg:mt-24 overflow-hidden">
                    <div className="relative">
                        <div className="flex whitespace-nowrap">
                        <div className="flex marquee items-center">
                            {(businessData.features || []).map((feature, i) => (
                            <div key={i} className="flex items-center justify-center gap-2 md:gap-4 mx-3 md:mx-6">
                                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[var(--color-bg-alt)] flex items-center justify-center text-[var(--color-dark)]">
                                <FeatureIcon name={feature.icon} size={16} /> {/* Scaled Icon */}
                                </div>
                                <div className="text-left">
                                <h3 className="text-[2.5vw] md:text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-dark)]">{feature.title}</h3>
                                <p className="text-[var(--color-text-light)] text-[2vw] md:text-[10px] uppercase tracking-wider mt-0.5 md:mt-1">{feature.text}</p>
                                </div>
                            </div>
                            ))}
                            {/* Duplicate for Marquee */}
                            {(businessData.features || []).map((feature, i) => (
                            <div key={`dup-${i}`} className="flex items-center justify-center gap-2 md:gap-4 mx-3 md:mx-6" aria-hidden="true">
                                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[var(--color-bg-alt)] flex items-center justify-center text-[var(--color-dark)]">
                                <FeatureIcon name={feature.icon} size={16} />
                                </div>
                                <div className="text-left">
                                <h3 className="text-[2.5vw] md:text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-dark)]">{feature.title}</h3>
                                <p className="text-[var(--color-text-light)] text-[2vw] md:text-[10px] uppercase tracking-wider mt-0.5 md:mt-1">{feature.text}</p>
                                </div>
                            </div>
                            ))}
                        </div>
                        </div>
                    </div>
                    </section>
                </Editable>

                {/* --- STORY SECTION --- */}
                <Editable focusId="about">
                    <ScrollSection direction="up" className="py-12 md:py-32 bg-[var(--color-bg-alt)]">
                        <div className="container mx-auto px-6 lg:px-16 grid grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-20 items-center">
                            <div className="order-2 lg:order-1">
                                <span className="text-[2.5vw] md:text-xs font-bold tracking-[0.3em] text-[var(--color-gold)] uppercase mb-2 md:mb-4 block">Our Heritage</span>
                                <h2 className="text-[7vw] md:text-5xl font-serif mb-4 md:mb-8 text-[var(--color-dark)] leading-tight">{businessData.about?.title}</h2>
                                <p className="text-[var(--color-text-light)] text-[3vw] md:text-lg leading-relaxed md:leading-loose mb-4 md:mb-10 font-light line-clamp-4 md:line-clamp-none">
                                    {businessData.about?.text}
                                </p>
                                <div className="flex items-center gap-8">
                                        <Link 
                                            href={`${basePath}/shop`}
                                            className="bg-[var(--color-dark)] text-white px-4 py-2 md:px-8 md:py-4 rounded-[4px] font-medium text-[2.5vw] md:text-sm hover:bg-opacity-90 transition-all flex items-center gap-2"
                                        >
                                        Shop Now <ArrowRight size={14} className="md:w-4 md:h-4" />
                                        </Link>
                                    
                                    </div>
                            </div>
                            <div className="h-[50vw] md:h-[650px] w-full relative order-1 lg:order-2">
                                <div className="absolute inset-0 rounded-t-full lg:rounded-t-[300px] overflow-hidden shadow-2xl">
                                    <img 
                                        src={businessData.about?.image} 
                                        alt="Our Story" 
                                        className="w-full h-full object-cover transition-transform duration-[3s] hover:scale-105" 
                                    />
                                </div>
                            </div>
                        </div>
                    </ScrollSection>
                </Editable>

                {/* --- COLLECTIONS --- */}
                <Editable focusId="collection">
                    <ScrollSection direction="up" className="py-12 md:py-32 bg-white">
                        <div className="container mx-auto px-6 lg:px-16">
                            <div className="flex flex-col lg:flex-row justify-between items-end mb-8 md:mb-16 gap-4 md:gap-6">
                                <div>
                                    <h2 className="text-[7vw] md:text-5xl font-serif mb-2 md:mb-4 text-[var(--color-dark)]">{businessData.collections?.title}</h2>
                                    <p className="text-[var(--color-text-light)] text-[3vw] md:text-base max-w-lg leading-relaxed">{businessData.collections?.subtitle}</p>
                                </div>
                                <Link href={`${basePath}/shop`} className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-2 hover:border-[var(--color-dark)] hover:text-[var(--color-dark)] text-[var(--color-text-light)] transition-all">
                                    View Collection
                                </Link>
                            </div>
                            
                            <StaggerGrid className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-10">
                                {featuredProducts.map(product => (
                                    <StaggerItem key={product.id}>
                                        <ProductCard item={product} />
                                    </StaggerItem>
                                ))}
                            </StaggerGrid>
                            {/* Mobile Only View Collection Button */}
                            <div className="mt-8 text-center block lg:hidden">
                                <Link href={`${basePath}/shop`} className="inline-block bg-[var(--color-dark)] text-white px-8 py-3 text-[3vw] font-bold uppercase tracking-widest hover:bg-[var(--color-gold)] transition-colors">
                                    View Collection
                                </Link>
                            </div>
                        </div>
                    </ScrollSection>
                </Editable>

                {/* --- REVIEWS (IMPROVED) --- */}
                <Editable focusId="testimonials">
                    <ScrollSection direction="up" className="py-12 md:py-24 bg-[var(--color-bg)] border-t border-[var(--color-bg-alt)]">
                        <TestimonialSlider data={businessData.testimonials} />
                    </ScrollSection>
                </Editable>

                {/* --- FAQ SECTION --- */}
                <Editable focusId="faq">
                    <ScrollSection direction="up" className="py-12 md:py-32 bg-white">
                        <div className="container mx-auto px-6 lg:px-16 max-w-6xl">
                            <div className="text-center mb-8 md:mb-16">
                                <h2 className="text-[7vw] md:text-4xl font-serif mb-2 md:mb-4 text-[var(--color-dark)]">{businessData.faq?.title}</h2>
                                <p className="text-[var(--color-text-light)] text-[3vw] md:text-base">{businessData.faq?.subtitle}</p>
                            </div>
                            <div className="divide-y divide-gray-100 border-t border-gray-100">
                                {(businessData.faq?.questions || []).map((q, i) => (
                                    <FAQAccordion key={i} question={q.q} answer={q.a} />
                                ))}
                            </div>
                        </div>
                    </ScrollSection>
                </Editable>
                
                {/* --- AN INVITATION (NEW & IMPROVED) --- */}
                <Editable focusId="cta">
                    <ScrollSection direction="up">
                        <NewsletterCTA data={businessData.newsletterCta} />
                    </ScrollSection>
                </Editable>

                <Editable focusId="instagram">
                    <ScrollSection direction="up" className="py-12 md:py-24 bg-white">
                        <div className="container mx-auto px-6 lg:px-16">
                            <InstagramFeed data={businessData.instagram} />
                        </div>
                    </ScrollSection>
                </Editable>
            </>
            )}
        </div>
    );
}

export default function AuroraPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuroraContent />
        </Suspense>
    );
}
