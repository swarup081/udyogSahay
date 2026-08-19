'use client';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useTemplateContext } from './templateContext.js';

const CartContext = createContext();

export function CartProvider({ children }) {
  // Use an array for cart items: [{ id: 1, quantity: 2 }]
  const [cartItems, setCartItems] = useState([]); 
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const { businessData } = useTemplateContext();

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('flavornestCart'); // <-- UNIQUE KEY
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('flavornestCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Add to cart (for array)
  const addToCart = (product, quantity) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        // Update quantity
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        // Add new item
        return [...prevItems, { id: product.id, quantity: quantity }];
      }
    });
    triggerToast();
  };
  
  // Increase quantity (for array)
  const increaseQuantity = (productId) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === productId);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // If not in cart, add it with quantity 1
        return [...prevItems, { id: productId, quantity: 1 }];
      }
    });
    if (!isCartOpen) triggerToast();
  };

  // Decrease quantity (for array)
  const decreaseQuantity = (productId) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === productId);
      if (existingItem.quantity === 1) {
        // Remove item
        return prevItems.filter(item => item.id !== productId);
      } else {
        // Decrease quantity
        return prevItems.map(item =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
    });
  };

  // Remove from cart (for array)
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // --- Derived State (Calculations) ---

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const cartDetails = useMemo(() => {
    return cartItems.map(cartItem => {
      const product = businessData.allProducts.find(p => p.id === cartItem.id);
      return {
        ...product,
        quantity: cartItem.quantity,
      };
    }).filter(Boolean); // Filter out any undefined products
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartDetails]);
  
  const shipping = subtotal > 0 ? 50.00 : 0; // Standard 50 shipping
  
  const total = useMemo(() => {
    return subtotal + shipping;
  }, [subtotal, shipping]);


  const value = {
    cartItems, // Send the array
    cartDetails,
    cartCount,
    subtotal,
    shipping, 
    total,    
    isCartOpen,
    showToast,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to easily use the cart context
export const useCart = () => {
  return useContext(CartContext);
};