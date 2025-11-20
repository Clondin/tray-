import { useState, useEffect, useRef } from 'react';

// Easing function for smooth animation
const easeOutCubic = (t: number): number => (--t) * t * t + 1;

export function useCountUp(endValue: number, duration: number = 800) {
    const [count, setCount] = useState(0);
    const startValueRef = useRef(0);
    // Fix: Provide an initial value of `undefined` to `useRef` as it expects one argument.
    const animationFrameRef = useRef<number | undefined>(undefined);
    // Fix: Provide an initial value of `undefined` to `useRef` as it expects one argument.
    const startTimeRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const start = () => {
            startTimeRef.current = Date.now();
            startValueRef.current = count; // Start from the current displayed value
            
            const animate = () => {
                const now = Date.now();
                const startTime = startTimeRef.current || now;
                const elapsedTime = now - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const easedProgress = easeOutCubic(progress);
                
                const currentValue = startValueRef.current + (endValue - startValueRef.current) * easedProgress;

                setCount(currentValue);

                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    setCount(endValue); // Ensure it ends exactly on the target value
                }
            };
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Don't animate on initial mount from 0 if the value is large
        if (count === 0 && endValue !== 0) {
             setCount(endValue);
        } else {
             start();
        }


        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [endValue, duration]);
    
    return count;
}
