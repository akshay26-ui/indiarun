'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import SplitText from './SplitText';

// Using the established Gold theme tokens
const T = {
  bg: '#0C0A09',
  primary: '#EAB308',
  text: 'rgba(255,255,255,0.95)',
  fontDisplay: "'Cormorant', 'Playfair Display', serif",
} as const;

export default function StaircaseLoader() {
  const [show, setShow] = useState(true);
  const [beat, setBeat] = useState(0); 
  const prefersReducedMotion = useReducedMotion();
  const mounted = useRef(false);

  useEffect(() => {
    // If reduced motion is preferred, instantly hide
    if (prefersReducedMotion) {
      setShow(false);
    }
    mounted.current = true;
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      // Sequence timeline
      const t1 = setTimeout(() => setBeat(1), 100); // Start beat 1 shortly after mount
      const t2 = setTimeout(() => setBeat(2), 1500); // Start beat 2 (stairs) at ~1.5s
      const t3 = setTimeout(() => {
        setBeat(3);
        // Release scroll exactly when beat 3 starts
        document.body.style.overflow = '';
      }, 3100); // Start beat 3 (flare & wipe) at ~3.1s
      
      const t4 = setTimeout(() => setShow(false), 3800); // Unmount after wipe finishes

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        document.body.style.overflow = '';
      };
    }
  }, [show]);

  const skipAnimation = () => {
    if (beat < 3) {
      setBeat(3);
      document.body.style.overflow = '';
      setTimeout(() => setShow(false), 600);
    }
  };

  if (!show) return null;

  // Staircase steps configuration
  const numSteps = 6;
  const stepDelays = Array.from({ length: numSteps }, (_, i) => i * 0.12);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden touch-none"
      style={{ backgroundColor: beat < 3 ? T.bg : 'transparent' }}
      onClick={skipAnimation}
      onKeyDown={(e) => e.key === 'Enter' || e.key === 'Escape' ? skipAnimation() : null}
      tabIndex={0}
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Aura Agent"
    >
      <AnimatePresence>
        {/* BEAT 1: Text Reveal */}
        {beat === 1 && (
          <motion.div
            key="text"
            exit={{ opacity: 0, filter: 'blur(4px)', y: -12, transition: { duration: 0.3, ease: "easeIn" } }}
            className="absolute z-10 text-center"
            style={{ 
              fontFamily: T.fontDisplay, 
              color: T.primary,
              letterSpacing: '0.04em'
            }}
          >
            <SplitText
              text="Welcome to the Aura world."
              className="text-3xl md:text-5xl font-medium tracking-wide drop-shadow-lg"
              delay={60}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40, filter: 'blur(8px)' } as any}
              to={{ opacity: 1, y: 0, filter: 'blur(0px)' } as any}
            />
          </motion.div>
        )}

        {/* BEAT 2: Staircase */}
        {beat === 2 && (
          <motion.div
            key="stairs"
            className="absolute z-10 flex flex-col items-center justify-end h-[60vh] pb-20 w-full"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative w-64 md:w-96 flex flex-col gap-2 mx-auto">
              {stepDelays.map((delay, i) => {
                // Reverse index so the bottom step renders last in DOM (to stack correctly)
                const revIndex = numSteps - 1 - i; 
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: delay,
                      ease: "easeOut"
                    }}
                    className="h-8 md:h-12 rounded-md border-t border-white/20 shadow-2xl backdrop-blur-md"
                    style={{
                      background: 'linear-gradient(180deg, rgba(234, 179, 8, 0.1) 0%, rgba(12, 10, 9, 0) 100%)',
                      width: `${100 - (revIndex * 12)}%`, // Steps get narrower at the top
                      margin: '0 auto',
                    }}
                  >
                    {/* The light trail that runs up the stairs */}
                    <motion.div 
                      className="h-[1px] w-full absolute top-0 left-0"
                      style={{ background: T.primary, boxShadow: `0 0 10px ${T.primary}` }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: delay + 0.2, // Light activates just after step appears
                        ease: "easeOut" 
                      }}
                    />
                  </motion.div>
                );
              })}

              {/* Ascending Point of Light & Flare */}
              <motion.div
                className="absolute left-1/2 -ml-[2px] w-[4px] h-[4px] rounded-full z-20"
                style={{ background: '#FFF', boxShadow: `0 0 20px 4px ${T.primary}` }}
                initial={{ bottom: 0, opacity: 0 }}
                animate={{ bottom: '100%', opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: stepDelays[stepDelays.length - 1] + 0.4,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        BEAT 3: Iris Wipe Reveal 
        Implementation using a massive box-shadow.
        When beat >= 3, the wrapper background becomes transparent. 
        This div sits on top and its hole grows, revealing the page.
      */}
      {beat >= 3 && (
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{ width: '300vw', height: '300vw', opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 0 200vw ${T.bg}`, // Covers the screen in Gold Dark Theme background
          }}
        />
      )}
    </div>
  );
}
