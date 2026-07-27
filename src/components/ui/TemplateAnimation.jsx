'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Super smooth easing curves (Apple/modern web design feel)
const smoothEase = [0.21, 0.47, 0.32, 0.98];

/**
 * HeroAnimation - Immediate smooth entrance animation for above-the-fold content
 */
export function HeroAnimation({ 
  children, 
  delay = 0, 
  duration = 0.8, 
  direction = 'up', 
  className = '', 
  ...props 
}) {
  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === 'up' ? 35 : direction === 'down' ? -35 : 0,
      x: direction === 'left' ? 35 : direction === 'right' ? -35 : 0,
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0, 
      transition: { duration, delay, ease: smoothEase } 
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollSection - Smooth scroll reveal animation for sections below the fold
 */
export function ScrollSection({ 
  children, 
  delay = 0, 
  duration = 0.75, 
  direction = 'up', 
  className = '', 
  viewportMargin = '-60px',
  once = true,
  ...props 
}) {
  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === 'up' ? 45 : direction === 'down' ? -45 : 0,
      x: direction === 'left' ? 45 : direction === 'right' ? -45 : 0,
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0, 
      transition: { duration, delay, ease: smoothEase } 
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin }}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerGrid - Container for cards or grid items with staggered entrance animation
 */
export function StaggerGrid({ 
  children, 
  className = '', 
  staggerDelay = 0.1, 
  delayStart = 0, 
  viewportMargin = '-50px',
  once = true,
  ...props 
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: delayStart,
        staggerChildren: staggerDelay,
        ease: smoothEase
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin }}
      variants={containerVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem - Child element inside a StaggerGrid
 */
export function StaggerItem({ 
  children, 
  className = '', 
  duration = 0.6,
  direction = 'up',
  ...props 
}) {
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: direction === 'up' ? 25 : 0,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration, ease: smoothEase } 
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedProductGrid - Grid container for Shop pages with smooth layout filter transitions
 */
export function AnimatedProductGrid({ children, className = '' }) {
  return (
    <motion.div 
      layout 
      className={className}
      transition={{ duration: 0.4, ease: smoothEase }}
    >
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * AnimatedProductItem - Product Card wrapper inside AnimatedProductGrid
 */
export function AnimatedProductItem({ children, className = '', id }) {
  return (
    <motion.div
      layout
      key={id}
      initial={{ opacity: 0, scale: 0.92, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 15 }}
      transition={{ duration: 0.35, ease: smoothEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * HoverScale - Micro-interaction scale/lift for interactive buttons and cards
 */
export function HoverScale({ children, className = '', scale = 1.03, y = -2, ...props }) {
  return (
    <motion.div
      whileHover={{ scale, y }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * FloatingElement - Gentle continuous floating animation for decorative graphics & badges
 */
export function FloatingElement({ children, className = '', duration = 4, yOffset = 10, ...props }) {
  return (
    <motion.div
      animate={{
        y: [0, -yOffset, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
