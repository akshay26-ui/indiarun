'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '../../../src/lib/utils';

interface StickyCardStackProps {
  children: React.ReactNode[];
  className?: string;
  containerClassName?: string;
}

export const StickyCardStack: React.FC<StickyCardStackProps> = ({
  children,
  className,
  containerClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const cardElements = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const totalCards = cardElements.length;
    if (totalCards === 0) return;

    const ctx = gsap.context(() => {
      // First card starts in place
      gsap.set(cardElements[0], { y: '0%', scale: 1, rotation: 0, zIndex: 1, opacity: 1 });

      // Subsequent cards start offscreen below and invisible
      for (let i = 1; i < totalCards; i++) {
        gsap.set(cardElements[i], { y: '100%', scale: 1, rotation: 0, zIndex: i + 1, opacity: 0 });
      }

      // Create scroll-bound timeline
      const scrollTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '.sticky-cards-trigger',
          start: 'top top',
          end: `+=${window.innerHeight * (totalCards - 0.8)}`, // Tune scroll length for complete card slides
          pin: true,
          scrub: 0.5,
          pinSpacing: true,
        },
      });

      // Animate transition for each card
      for (let i = 0; i < totalCards - 1; i++) {
        const currentCard = cardElements[i];
        const nextCard = cardElements[i + 1];
        const position = i;

        if (!currentCard || !nextCard) continue;

        scrollTimeline.to(
          currentCard,
          {
            y: '-110%',    // Slide completely off-screen upward
            opacity: 0,    // Fade out completely
            duration: 1,
            ease: 'none',
          },
          position
        );

        scrollTimeline.to(
          nextCard,
          {
            y: '0%',
            opacity: 1,    // Fade in as it slides up
            duration: 1,
            ease: 'none',
          },
          position
        );
      }

      const resizeObserver = new ResizeObserver(() => {
        ScrollTrigger.refresh();
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full min-h-screen flex flex-col', className)}
    >
      <div className="sticky-cards-trigger relative flex h-screen w-full items-center justify-center overflow-hidden py-12 px-6">
        <div
          className={cn(
            'relative w-full max-w-[870px] h-[330px] overflow-visible rounded-3xl translate-y-[80px]',
            containerClassName
          )}
        >
          {React.Children.map(children, (child, i) => (
            <div
              key={i}
              className="absolute inset-0 h-full w-full rounded-3xl overflow-hidden will-change-transform transform-gpu"
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StickyCardStack;
