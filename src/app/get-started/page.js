'use client';
import Link from 'next/link';
import { useState } from 'react';
import { GridBackgroundDemo } from "@/components/GridBackgroundDemo";
export default function StepOne() {

    const [searchValue, setSearchValue] = useState('');
    const websiteTypes = [
    'Restaurant',
    'Online Store',
    'Portfolio',
    'Blog',
    'Consultant',
    'Technology Company',
    'Event',
  ];

  const handleExampleClick = (type) => {
    setSearchValue(type);
  };

  return (
    <div className="flex h-screen font-Helvetica">
      {/* Left Side */}
      <div className="w-1/2 flex flex-col justify-between p-12 bg-white">
        <div>
          <div className="text-4xl font-bold text-white mb-4">Brand name</div>
          <h2 className="text-3xl font-bold text-black-700 mb-6">
          What type of business do you have?
          </h2>
          <div className="relative mb-6">
          <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search for your business or site type"
              className="w-full py-4 pl-5 pr-36 text-lg border border-gray-200 rounded-2xl shadow-sm bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all duration-300 outline-none"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-300 text-gray-600 px-6 py-2 rounded-xl hover:bg-gray-400">
              Continue
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">EXAMPLES</p>
          <ul className="space-y-3">
            {websiteTypes.map((type) => (
              <li key={type}>
                <button
                  onClick={() => handleExampleClick(type)}
                  className="text-gray-600 hover:text-blue-600 text-xl cursor-pointer"
                >
                  {type}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Link href="/">
            <button className="text-gray-600 hover:text-gray-900">← Back</button>
          </Link>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-1/2 bg-gray-50 flex flex-col items-center justify-center p-12">
        {/* You can add your image grid here later */}
        <GridBackgroundDemo />
        <div className="text-center">
         
        </div>
        <div className="absolute bottom-12 right-12">
            <Link href="/get-started/1">
                <button className="text-gray-600 hover:text-gray-900">Skip →</button>
            </Link>
        </div>
      </div>
    </div>
  );
}