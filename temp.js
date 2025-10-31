'use client';

import { useState } from 'react';
import Link from 'next/link';

const ChoiceChip = ({ id, label, isSelected, onChange }) => (
    <label
        htmlFor={id}
        className={`flex items-center justify-center px-6 py-3 border-2 rounded-full cursor-pointer transition-all duration-200 ${
            isSelected
                ? 'border-blue-500 bg-blue-100 text-blue-800 font-semibold'
                : 'border-gray-300 bg-white hover:border-blue-400 hover:text-blue-600'
        }`}
    >
        <span>{label}</span>
        <input id={id} type="checkbox" className="hidden" checked={isSelected} onChange={onChange} />
    </label>
);

export default function StepThree() {
    const [selectedWords, setSelectedWords] = useState({});

    const businessVibes = [
        { id: 'luxury', label: 'Luxury' },
        { id: 'affordable', label: 'Affordable' },
        { id: 'modern', label: 'Modern' },
        { id: 'traditional', label: 'Traditional' },
        { id: 'playful', label: 'Playful' },
        { id: 'professional', label: 'Professional' },
        { id: 'eco-friendly', label: 'Eco-Friendly' },
        { id: 'quick-easy', label: 'Quick & Easy' },
        { id: 'premium', label: 'Premium' },
    ];

    const handleChipChange = (id) => {
        setSelectedWords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const hasSelection = Object.values(selectedWords).some(Boolean);

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-white font-sans">
            <div className="w-full lg:w-[32%] flex flex-col justify-start items-start p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-16">
                    UdyogSahay
                </h1>
            </div>
            <div className="w-full lg:w-[60%] flex flex-col justify-between p-8 lg:p-20 overflow-y-auto">
                <div className="w-full max-w-lg mx-auto flex flex-col justify-center flex-grow">
                    <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                            Step 2 of 3
                        </p>
                        <h2 className="text-4xl font-bold text-gray-800 mb-3">
                            Which words best describe your business?
                        </h2>
                        <p className="text-lg text-gray-500 mb-10">
                            Select a few to help us understand your brand's personality.
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                            {businessVibes.map(vibe => (
                                <ChoiceChip
                                    key={vibe.id}
                                    id={vibe.id}
                                    label={vibe.label}
                                    isSelected={!!selectedWords[vibe.id]}
                                    onChange={() => handleChipChange(vibe.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center w-full max-w-lg mx-auto pt-8 mt-8 border-t border-gray-200">
                    <Link href="/get-started/1">
                        <button className="text-lg text-gray-600 hover:text-gray-900 font-medium">← Back</button>
                    </Link>
                    <Link href="/get-started/3">
                        <button
                            className="px-8 py-3 bg-blue-500 text-white font-semibold text-lg rounded-full hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                            disabled={!hasSelection}
                        >
                            Continue
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}