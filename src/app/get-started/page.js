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
        <div className="flex h-screen font-sans">
            {/* Left Side */}
            <div className="w-1/2 flex flex-col justify-between p-16 bg-white">
                <div>
                    <div className="text-2xl font-bold text-gray-800 mb-12">UdyogSahay</div>
                    <h2 className="text-4xl font-semibold text-gray-800 mb-8">
                        What type of business do you have?
                    </h2>
                    <div className="relative mb-8">
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search for your business or site type"
                            className="w-full py-4 pl-6 pr-40 text-lg rounded-full shadow-sm bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-300 transition-all duration-300 outline-none"
                        />
                        <Link href="/get-started/1">

                        <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-8 py-3 rounded-full hover:bg-blue-600 transition-colors text-base font-semibold">
                            Continue
                        </button>
                        </Link>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-4 tracking-wider">EXAMPLES</p>
                    <ul className="space-y-3">
                        {websiteTypes.map((type) => (
                            <li key={type}>
                                <button
                                    onClick={() => handleExampleClick(type)}
                                    className="text-gray-600 hover:text-blue-600 text-lg cursor-pointer font-medium"
                                >
                                    {type}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <Link href="/">
                        <button className="text-gray-600 hover:text-gray-900 font-medium text-lg">← Back</button>
                    </Link>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-1/2 bg-gray-50 flex flex-col items-center justify-center p-12 relative">
                <GridBackgroundDemo />
                <div className="absolute bottom-12 right-12">
                    <Link href="/get-started/1">
                        <button className="text-gray-600 hover:text-gray-900 font-medium text-lg">Skip →</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}