'use client';

import Link from 'next/link';

export default function HowItWorks() {
  const steps = [
    {
      id: "1.",
      title: "Choose your foundation.",
      description: "Start instantly by selecting from 100+ professionally designed templates tailored for your industry, or let our AI generate a custom layout in seconds.",
    },
    {
      id: "2.",
      title: "Customize with ease.",
      description: "Use our intuitive visual editor to personalize colors, fonts, images, and content—absolutely no coding or technical skills required.",
    },
    {
      id: "3.",
      title: "Add your products & services.",
      description: "Easily upload your catalog of items, configure pricing, and set up your business workflows directly inside your secure dashboard.",
    },
    {
      id: "4.",
      title: "Connect payments & domain.",
      description: "Enable instant UPI, card, and wallet payments securely, and link your custom professional domain so customers can find you seamlessly.",
    },
    {
      id: "5.",
      title: "Launch & grow your business.",
      description: "Publish your mobile-friendly website to the world and track your success using built-in marketing analytics and automated notifications.",
    }
  ];

  return (
    <section className="py-34  bg-[#F4F5F8] relative">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-32">

          {/* Left Side: Title and Buttons */}
          <div className="lg:w-5/12">
            {/* The sticky class keeps this section in view while the user scrolls down the list */}
            <div className="sticky top-52">
              <h2 className="text-4xl lg:text-6xl  font-medium text-gray-900 leading-[1.1] tracking-tight mb-8">
                How to create a<br />
                website for free
              </h2>

              <p className="text-[20px] lg:text-[22px] text-gray-800 leading-snug mb-10 font-normal max-w-sm">
                Follow these 5 simple steps to create a website today.
              </p>

              <div className="flex items-center gap-6">
                <Link href="/templates">
                  <button className="px-8 py-3.5 bg-black text-white text-[16px] font-medium rounded-full hover:bg-gray-800 transition-colors">
                    Get Started
                  </button>
                </Link>
                <Link href="/support" className="group flex items-center text-[16px] font-medium text-black">
                  <span className="border-b border-black pb-[1px] mr-1">Contact us</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side: The 5 Steps List */}
          <div className="lg:w-7/12">
            <div className="flex flex-col">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex gap-6 py-8 ${index === 0 ? 'pt-0' : ''} ${index !== steps.length - 1 ? 'border-b border-[#D8D8D8]' : ''
                    }`}
                >
                  <div className="text-gray-500 text-lg w-6 flex-shrink-0 font-light mt-0.5">
                    {step.id}
                  </div>
                  <div>
                    <p className="text-[17px] leading-relaxed text-[#161616]">
                      <span className="font-semibold">{step.title}</span> {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}