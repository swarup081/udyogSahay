'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StepTwo() {
  const [storeName, setStoreName] = useState('');

  // A component for the step indicator
  const Step = ({ number, isCurrent }) => (
    <div className="flex items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isCurrent
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        {number}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-white font-sans">
      
      {/* Left Side - Progress Indicator */}
      <div className="w-full lg:w-[32%] flex flex-col justify-start items-start p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-16">
          UdyogSahay
        </h1>
        <div className="flex lg:flex-col items-center lg:items-start gap-0">
   
        </div>
      </div>

      {/* Right Side - Main Content */}
      <div className="w-full lg:w-[60%] flex flex-col justify-between p-8 lg:p-20">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center flex-grow">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Step 2 of 3
            </p>
            <h2 className="text-4xl font-bold text-gray-800 mb-3">
              What's your store name?
            </h2>
            <p className="text-lg text-gray-500 mb-10">
              We'll tailor content and advice to your site needs.
            </p>

            <label htmlFor="storeName" className="font-semibold text-gray-700 mb-2 block">
              Store Name
            </label>
            <input
              id="storeName"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g., Kensho Store"
              className="w-full py-3 px-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div className="flex justify-between items-center w-full max-w-lg mx-auto pt-8">
          <Link href="/get-started/1">
            <button className="text-lg text-gray-600 hover:text-gray-900 font-medium">← Back</button>
          </Link>
          <Link href="/get-started/3">
            <button
              className="px-8 py-3 bg-blue-600 text-white font-semibold text-lg rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              disabled={!storeName}
            >
              Continue
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}