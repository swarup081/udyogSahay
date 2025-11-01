'use client';

import { useState } from 'react';
import Link from 'next/link';

// --- Reusable UI Components ---

// Updated FeatureCard to match the horizontal layout in the screenshot
const FeatureCard = ({ id, label, description, isSelected, onChange }) => (
  <label
    htmlFor={id}
    className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
      isSelected
        ? 'border-blue-300' // Selected: Blue border, white background
        : 'border-gray-300 bg-white hover:border-blue-200' // Default: Gray border, hover to blue
    }`}
  >
    {/* Custom Checkbox visual */}
    <div className="flex-shrink-0 mr-4">
      <div
        className={`flex items-center justify-center w-5 h-5 border-2 rounded-sm transition-all duration-200 ${
          isSelected ? 'bg-blue-400 border-blue-400' : 'bg-white border-gray-400'
        }`}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>

    {/* Text Content */}
    <div>
      <h3 className="font-semibold text-gray-800">{label}</h3>
      {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
    </div>

    {/* Hidden actual checkbox input */}
    <input id={id} type="checkbox" className="hidden" checked={isSelected} onChange={onChange} />
  </label>
);

// --- Main Page Component ---

export default function StepThree() {
  // New data structure to match the screenshot content
  const productOptions = [
    {
      id: 'physical',
      label: 'Physical products',
      description: 'Products like t-shirts, shoes, or skateboards',
    },
    {
      id: 'digital',
      label: 'Digital products',
      description: 'eBooks, printable or digital albums',
    },
    {
      id: 'dropshipping',
      label: 'Dropshipping products',
      description: 'Products I source and sell, shipped by a third party',
    },
    {
      id: 'print-on-demand',
      label: 'Print-on-demand products',
      description: 'My designs, printed and shipped by a third party',
    },
   
  ];

  const [selectedFeatures, setSelectedFeatures] = useState({});

  const handleCheckboxChange = (id) => {
    setSelectedFeatures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-white font-sans">
      {/* Left Side - Progress Indicator (No changes needed here) */}
      <div className="w-full lg:w-[32%] flex flex-col justify-start items-start p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-16">UdyogSahay</h1>
        <div className="flex lg:flex-col items-center lg:items-start gap-4">
          {/* Your step indicators can go here */}
        </div>
      </div>

      {/* Right Side - Main Content */}
      <div className="w-full lg:w-[60%] flex flex-col justify-between p-8 lg:p-20 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col justify-center flex-grow">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Step 3 of 3
            </p>
            <h2 className="text-4xl font-bold text-gray-800 mb-3">
              What are you planning to sell?
            </h2>
            <p className="text-lg text-gray-500 mb-10">
              Select all that apply. This will help us customize your store.
            </p>
            
            {/* Dynamic Content Area - Now uses the new layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productOptions.map(option => (
                <FeatureCard
                  key={option.id}
                  id={option.id}
                  label={option.label}
                  description={option.description}
                  isSelected={!!selectedFeatures[option.id]}
                  onChange={() => handleCheckboxChange(option.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center w-full max-w-2xl mx-auto pt-8 mt-8 border-t border-gray-200">
          <Link href="/get-started/2">
            <button className="text-lg text-gray-600 hover:text-gray-900 font-medium">← Back</button>
          </Link>
          <Link href="/templates">
            <button
                            className="px-8 py-3 bg-blue-500 text-white font-semibold text-lg rounded-full hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                            >
              Finish
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}