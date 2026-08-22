'use client';
import { useTemplateContext } from './templateContext.js';
import { ArrowRightIcon, ShippingIcon, ProductCard } from './components.js';
import Link from 'next/link';
import { Editable } from '@/components/editor/Editable'; 
import { getLandingItems, getBestSellerItems } from '@/lib/templates/templateLogic';
import { HeroAnimation, ScrollSection, StaggerGrid, StaggerItem } from '@/components/ui/TemplateAnimation';

const getProductsByIds = (allProducts, ids) => {
    if (!allProducts || !ids) return []; 
    return ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
};

export default function CandleaPage() {
    
    const { businessData, basePath } = useTemplateContext();

    const allProducts = businessData?.allProducts || [];
    
    // --- NEW: Use Shared Logic ---
    const collectionItems = getLandingItems(businessData, 3);
    const bestSellerItems = getBestSellerItems(businessData, 4);

    if (!businessData) {
        return <div>Loading...</div>; 
    }

    return (
        <>
            {/* --- Hero Section --- */}
            <section id="home" className="container mx-auto px-6 py-10 md:py-32">
                <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                    <Editable focusId="hero">
                        <HeroAnimation direction="up" delay={0.1} className="flex flex-col gap-3 md:gap-6 md:pr-10 text-left items-start w-full">
                            <h1 className="text-3xl md:text-7xl font-bold text-brand-text leading-tight font-serif">{businessData.hero.title}</h1>
                            <p className="text-sm md:text-lg text-brand-text opacity-70 max-w-md">{businessData.hero.subtitle}</p>
                       <Link 
                            href={`${basePath}/shop`}
                            className="mt-2 md:mt-4 inline-flex items-center gap-2 md:gap-3 btn btn-secondary px-5 py-2.5 md:px-8 md:py-3 text-sm md:text-base font-medium tracking-wider uppercase border border-brand-secondary bg-brand-secondary text-brand-bg hover:opacity-90 transition-all duration-300"
                        >
                            <span>{businessData.hero.cta}</span>
                            <ArrowRightIcon />
                        </Link>
                        </HeroAnimation>
                    </Editable>
                    <Editable focusId="hero">
                        <HeroAnimation direction="left" delay={0.2} className="flex justify-center w-full">
                            <div className="w-full max-w-md lg:max-w-lg aspect-[4/5] rounded-bl-[50px] rounded-tr-[50px] md:rounded-bl-[150px] md:rounded-tr-[150px] overflow-hidden">
                                <img 
                                    src={businessData.hero?.image} 
                                    alt="Hero Candle" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </HeroAnimation>
                    </Editable>
                </div>
            </section>
            
            {/* --- Info Bar --- */}
            <Editable focusId="global">
                <section className="py-3 bg-brand-bg border-y border-brand-primary/20 overflow-hidden">
                    <div className="flex whitespace-nowrap">
                        <div className="flex marquee items-center">
                            {(businessData.infoBar || []).map((text, i) => (
                                <div key={i} className="flex items-center justify-center gap-4 mx-8">
                                    <ShippingIcon />
                                    <p className="font-medium text-brand-text opacity-80 text-lg">{text}</p>
                                </div>
                            ))}
                            {(businessData.infoBar || []).map((text, i) => (
                                <div key={`dup-${i}`} className="flex items-center justify-center gap-4 mx-8" aria-hidden="true">
                                    <ShippingIcon />
                                    <p className="font-medium text-brand-text opacity-80 text-lg">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </Editable>

            {/* --- Feature Section 1 --- */}
            <Editable focusId="about">
                <ScrollSection id="about" direction="up" className="py-10 md:py-24 bg-brand-primary">
                    <div className="container mx-auto px-6 flex flex-row md:grid md:grid-cols-2 gap-4 md:gap-12 items-center">
                        <div className="flex justify-center w-1/2 md:w-full">
                            <img 
                                src={businessData.feature1?.image} 
                                alt="Crafting warmth" 
                                className="w-full max-w-md lg:max-w-lg aspect-square object-cover"
                            />
                        </div>
                        <div className="md:pl-10 text-left items-start flex flex-col w-1/2 md:w-full">
                            <h2 className="text-xl md:text-5xl font-bold text-brand-text leading-tight font-serif">{businessData.feature1.title}</h2>
                            <p className="text-xs md:text-lg text-brand-text opacity-70 mt-2 md:mt-6 max-w-lg">{businessData.feature1.text}</p>
                            <p className="text-[10px] md:text-base text-brand-text opacity-70 mt-2 md:mt-4 max-w-lg">{businessData.feature1.subtext}</p>
                            <Link
                                href="#about"
                                className="mt-4 md:mt-8 inline-flex items-center gap-2 font-semibold text-brand-text hover:text-brand-bg border border-brand-text hover:bg-brand-secondary transition-all duration-300 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-base"
                            >
                                <span>{businessData.feature1.cta}</span>
                                <ArrowRightIcon />
                            </Link>
                        </div>
                    </div>
                </ScrollSection>
            </Editable>
            
            {/* --- Collection Section --- */}
            <ScrollSection id="collection" direction="up" className="py-10 md:py-24 bg-brand-bg">
                <Editable focusId="collection">
                    <div className="container mx-auto px-6">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-4xl font-bold text-brand-text font-serif">{businessData.collection.title}</h2>
                            <Link href={`${basePath}/shop`} className="inline-flex items-center gap-2 font-semibold text-brand-bg bg-brand-secondary border border-brand-text hover:opacity-90 transition-all duration-300 px-4 py-2 ">
                                <span>See All</span>
                                <ArrowRightIcon />
                            </Link>
                        </div>
                        <StaggerGrid className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-8">
                            {collectionItems.map((item, index) => {
                                const isCategory = item.type === 'category';
                                const href = isCategory ? `${basePath}/shop?category=${item.id}` : `${basePath}/product/${item.id}`;
                                const btnText = isCategory ? 'View Collection' : 'View Product';

                                return (
                                    <StaggerItem key={item.id} className={`${index >= 2 ? 'hidden md:block' : ''}`}>
                                        <Link 
                                        href={href}
                                        className="group relative block overflow-hidden shadow-lg aspect-[4/5] rounded-t-full md:rounded-none md:hover:rounded-t-full transition-all duration-500"
                                        >
                                            <img 
                                                src={item.image || item.image_url} 
                                                alt={item.name} 
                                                className={`w-full h-full object-cover transition-transform duration-300 ${item.isOOS ? 'grayscale opacity-70' : ''}`}
                                            />
                                            {item.isOOS && (
                                                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-bold uppercase z-10">
                                                    Out of Stock
                                                </div>
                                            )}
                                            
                                            <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                            <h3 className="hidden md:block absolute bottom-2 left-2 md:bottom-6 md:left-6 text-xs md:text-3xl font-bold text-white font-serif">{item.name}</h3>
                                            <div className="hidden md:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <span className="bg-brand-bg text-brand-text px-6 py-3 font-semibold uppercase tracking-wider shadow-lg">
                                                    {btnText}
                                                </span>
                                            </div>
                                        </Link>
                                        <div className="block md:hidden text-center mt-3">
                                            <h3 className="text-sm font-bold text-brand-text font-serif">{item.name}</h3>
                                        </div>
                                    </StaggerItem>
                                );
                            })}
                        </StaggerGrid>
                    </div>
                </Editable>
            </ScrollSection>
            
            {/* --- Best Sellers --- */}
            <ScrollSection id="shop" direction="up" className="py-24 bg-brand-bg">
                <Editable focusId="collection">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-4xl font-bold text-brand-text mb-16 font-serif">{businessData.bestSellers.title}</h2>
                        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 items-stretch">
                            {bestSellerItems.map(item => (
                                <StaggerItem key={item.id}>
                                    <ProductCard 
                                        item={item}
                                        templateName="flara"
                                    />
                                </StaggerItem>
                            ))}
                        </StaggerGrid>
                        <Link 
                            href={`${basePath}/shop`}
                            className="mt-16 inline-flex items-center gap-2 font-semibold text-brand-text hover:text-brand-bg border border-brand-text hover:bg-brand-secondary transition-all duration-300 px-6 py-3 "
                        >
                            <span>Shop Now</span>
                            <ArrowRightIcon />
                        </Link>
                    </div>
                </Editable>
            </ScrollSection>

            {/* --- Feature Section 2 --- */}
            <Editable focusId="feature2">
                <ScrollSection id="feature2" direction="up" className="py-10 md:py-24 overflow-hidden bg-brand-bg">
                    <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-16 items-start">
                        <div className="relative w-full mt-8 md:mt-0">
                            <div className="w-full aspect-[4/5] rounded-t-full overflow-hidden">
                                <img 
                                    src={businessData.feature2?.image1} 
                                    alt="Peaceful scents"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-[10px] md:text-base text-brand-text opacity-70 mt-4 md:mt-8 max-w-md">{businessData.feature2.subtext}</p>
                        </div>
                        <div className="flex flex-col gap-4 md:gap-8 w-full pt-[20%] md:pt-[30%]">
                            <div className="md:pl-10 text-left items-start flex flex-col w-full">
                                <h2 className="text-xl md:text-5xl font-bold text-brand-text leading-tight font-serif">{businessData.feature2.title}</h2>
                                <p className="text-xs md:text-lg text-brand-text opacity-70 mt-2 md:mt-6 w-full max-w-none md:max-w-lg">{businessData.feature2.text}</p>

                                <img 
                                    src={businessData.feature2?.image2}
                                    alt="Calming candle"
                                    className="w-full max-w-xs h-auto object-cover mt-4 md:mt-8"
                                />
                            </div>
                        </div>
                    </div>
                </ScrollSection>
            </Editable>

            {/* --- Blog --- */}
            <Editable focusId="blog">
                <ScrollSection id="blog" direction="up" className="py-24 bg-brand-primary">
                    <div className="container mx-auto px-6">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-4xl font-bold text-brand-text font-serif">{businessData.blog.title}</h2>
                        </div>
                        <StaggerGrid className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                            {(businessData.blog.items || []).map(post => (
                                <StaggerItem key={post.title} className="group">
                                    <a href="#" className="block overflow-hidden aspect-video bg-brand-bg">
                                        <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </a>
                                    <div className="mt-4">
                                        <p className="text-sm text-brand-text opacity-60 uppercase tracking-wider">{post.date}</p>
                                        <h3 className="text-xl font-serif font-medium text-brand-text mt-2"><a href="#" className="hover:text-brand-secondary">{post.title}</a></h3>
                                        <p className="text-brand-text opacity-70 mt-2">{post.text}</p>
                                        <a href="#" className="inline-block mt-4 font-semibold text-brand-text text-sm  underline-offset-4">Read more →</a>
                                    </div>
                                </StaggerItem>
                            ))}
                        </StaggerGrid>
                    </div>
                </ScrollSection>
            </Editable>
        </>
    );
}
