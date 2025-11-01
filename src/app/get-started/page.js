'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { GridBackgroundDemo } from "@/components/GridBackgroundDemo";

export default function StepOne() {
    const [searchValue, setSearchValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const autocompleteRef = useRef(null); // Ref for clickaway listener

    // Using the comprehensive list provided by the user
    const allBusinessTypes = [
        // --- Retail & E-commerce ---
        'Retail Shop',
        'Kirana Store / General Store',
        'Online Store',
        'Clothing Boutique',
        'Saree Shop',
        'Footwear Store',
        'Stationery Shop',
        'Bookstore',
        'Gift Shop',
        'Mobile Store',
        'Electronics Store',
        'Supermarket / Mini-Mart',
        'Toy Store',
        'Hardware Store',
        'Pet Store',
        
        // --- Arts, Crafts & Handmade Goods ---
        'Handmade Crafts Store',
        'Candle Shop',
        'Artificial Jewellery Shop',
        'Jewellery Store',
        'Handicraft Emporium',
        'Pottery Shop',
        'Custom Gift Maker',
        'Home Decor Boutique',
      
        // --- Food & Beverage ---
        'Restaurant',
        'Indian Restaurant',
        'Ethnic/Theme Restaurant',
        'Cafe',
        'Bakery & Cake Shop',
        'Sweet Shop',
        'Tea Stall',
        'Juice Center',
        'Food Truck',
        'Cloud Kitchen',
        'Catering Service',
        'Home Baker',
      
        // --- Health, Wellness & Beauty ---
        'Salon',
        'Beauty Salon',
        'Hair Salon',
        'Nail Salon',
        'Barbershop',
        'Spa',
        'Gym / Fitness Center',
        'Yoga Studio',
        'Healthcare Clinic',
        'Doctor',
        'Dentist',
        'Pharmacy',
        'Veterinary Clinic',
      
        // --- Creative & Portfolio ---
        'Portfolio',
        'Photographer',
        'Designer',
        'Developer',
        'Artist',
        'Blogger',
        'Writer',
        'Influencer',
      
        // --- Professional Services & Consultancy ---
        'Consultant',
        'Marketing Consultant',
        'Financial Consultant',
        'Business Consultant',
        'Real Estate Agency',
        'Construction Company',
        'Law Firm',
        
        // --- Technology & Agencies ---
        'Technology Company',
        'SaaS',
        'Web Development Agency',
        'Digital Marketing Agency',
      
        // --- Events ---
        'Event',
        'Wedding Planner',
        'Event Management',
        
        // --- Education ---
        'Educational Institution',
        'Tutor / Coaching Center',
        'Dance School',
        'Music School',
      
        // --- Local & Auto Services ---
        'Automobile Repair',
        'Car Wash',
        'Mobile Repair Shop',
        'Computer Repair',
        'Dry Cleaner / Laundry Service',
        'Electrician',
        'Plumber'
      ];
    
    // We only want to show a few examples, not the whole list.
    const exampleBusinessTypes = [
        'Restaurant',
        'Online Store',
        'Portfolio',
        'Salon',
        'Cafe',
        'Clothing Boutique',
        'Cloud Kitchen'
    ];


    const getFilteredSuggestions = (value) => {
        if (value.length > 1) {
            const lowerSearchValue = value.toLowerCase();
            const filtered = allBusinessTypes
                .filter(type =>
                    type.toLowerCase().includes(lowerSearchValue)
                )
                .sort((a, b) => { // Ranking logic
                    const aLower = a.toLowerCase();
                    const bLower = b.toLowerCase();
                    
                    // 1. Prioritize "starts with"
                    const aStartsWith = aLower.startsWith(lowerSearchValue);
                    const bStartsWith = bLower.startsWith(lowerSearchValue);

                    if (aStartsWith && !bStartsWith) return -1;
                    if (!aStartsWith && bStartsWith) return 1;

                    // 2. Prioritize shorter matches (often more general)
                    if (a.length !== b.length) {
                        return a.length - b.length;
                    }

                    // 3. Fallback to alphabetical
                    return aLower.localeCompare(bLower);
                });
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    useEffect(() => {
        getFilteredSuggestions(searchValue);
    }, [searchValue]);

    // Clickaway listener to close suggestions
    useEffect(() => {
        function handleClickOutside(event) {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
                setSuggestions([]); // Close suggestions
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [autocompleteRef]);

    const handleSuggestionClick = (suggestion) => {
        setSearchValue(suggestion);
        setSuggestions([]); // Hide suggestions on click
    };

    return (
        <div className="flex h-screen font-sans">
            {/* Left Side */}
            <div className="w-1/2 flex flex-col justify-between p-16 bg-white">
                <div>
                    <div className="text-2xl font-bold text-gray-800 mb-12">UdyogSahay</div>
                    <h2 className="text-4xl font-semibold text-gray-800 mb-10">
                        What type of business do you have?
                    </h2>
                    
                    {/* Updated Search Bar UI */}
                    <div className="relative mb-10" ref={autocompleteRef}>
                        <div className="flex items-end space-x-6">
                            
                            {/* Input and Icon Wrapper */}
                            <div className="relative flex-grow">
                                <svg 
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={2.5} 
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onFocus={() => getFilteredSuggestions(searchValue)}
                                    placeholder="Search for your business or site type"
                                    className="w-full bg-transparent border-0 border-b-2 border-gray-300 py-3 pl-12 text-xl text-gray-800 placeholder:text-gray-500 focus:ring-0 focus:border-blue-500 transition-colors duration-300 outline-none"
                                />
                                {/* Autocomplete Suggestions - Positioned relative to this wrapper */}
                                {suggestions.length > 0 && (
                                    <ul className="autocomplete-scrollbar absolute z-10 w-full mt-2 top-full bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                                        {suggestions.map((suggestion, index) => (
                                            <li
                                                key={index}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="px-6 py-2.5 text-base cursor-pointer hover:bg-gray-100 first:rounded-t-2xl last:rounded-b-2xl"
                                            >
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Continue Button */}
                            <Link href="/get-started/1" passHref>
                                <button 
                                    disabled={!searchValue}
                                    className="px-8 py-3 bg-blue-500 text-white font-semibold text-lg rounded-full hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                                    >
                                    Continue
                                </button>
                            </Link>
                        </div>
                    </div>
                    
                    <p className="text-xs font-semibold text-gray-400 mb-3 tracking-widest uppercase pl-6">
                        Examples
                    </p>
                    <ul className="space-y-2 pl-6">
                        {exampleBusinessTypes.map((type) => ( // Using the shorter example list here
                            <li key={type}>
                                <button
                                    onClick={() => handleSuggestionClick(type)} // Using the correct handler here
                                    className="text-gray-500 hover:text-blue-500 text-base cursor-pointer font-normal transition-colors"
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
                   {/* <Link href="/get-started/1">
                        <button className="text-gray-600 hover:text-gray-900 font-medium text-lg">Skip →</button>
                    </Link>*/}
                </div>
            </div>
        </div>
    );
}

