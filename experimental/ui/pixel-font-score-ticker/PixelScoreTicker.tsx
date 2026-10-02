import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@stellarcade/ui/theme-context';

type Theme = 'amber' | 'crt-green' | 'cyber-blue';

interface PixelScoreTickerProps {
  value: number;
  digits?: number;
  durationMs?: number;
  theme?: Theme;
  onTickSound?: () => void;
}

const DIGIT_FONT = 'Orbitron, sans-serif';
const DIGIT_SIZE = 48;
const DIGIT_SPACING = 8;

const themes: Record<Theme, { color: string; glowColor: string }> = {
  amber: { color: '#FFD700', glowColor: '#FF8C00' },
  'crt-green': { color: '#00FF00', glowColor: '#00AA00' },
  'cyber-blue': { color: '#00FFFF', glowColor: '#00AAFF' },
};

const PixelScoreTicker: React.FC<PixelScoreTickerProps> = ({
  value,
  digits = 6,
  durationMs = 1000,
  theme = 'amber',
  onTickSound,
}) => {
  const { prefersReducedMotion } = useTheme();
  const [currentValue, setCurrentValue] = useState(value);
  const [isJackpot, setIsJackpot] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const digitRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { color, glowColor } = themes[theme];

  const formatValue = useCallback((num: number) => {
    return num.toString().padStart(digits, '0');
  }, [digits]);

  const handleTick = useCallback(() => {
    if (onTickSound) onTickSound();
  }, [onTickSound]);

  const animateValue = useCallback(() => {
    if (prefersReducedMotion) {
      setCurrentValue(value);
      return;
    }

    const startValue = currentValue;
    const endValue = value;
    const startStr = formatValue(startValue);
    const endStr = formatValue(endValue);

    if (startStr === endStr) return;

    const duration = durationMs / Math.max(1, digits);
    const step = (endValue - startValue) / (digits * 10);

    animationRef.current = setInterval(() => {
      setCurrentValue(prev => {
        const newValue = Math.min(prev + step, endValue);
        if (newValue >= endValue) {
          clearInterval(animationRef.current as NodeJS.Timeout);
          animationRef.current = null;
          return endValue;
        }
        return newValue;
      });
    }, duration / digits);
  }, [currentValue, value, digits, durationMs, prefersReducedMotion, formatValue]);

  useEffect(() => {
    animateValue();
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [value, animateValue]);

  useEffect(() => {
    if (value > 999999) setIsJackpot(true);
    const timer = setTimeout(() => setIsJackpot(false), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  const renderDigits = () => {
    const currentStr = formatValue(currentValue);
    const endStr = formatValue(value);

    return Array.from({ length: digits }).map((_, i) => {
      const currentDigit = currentStr[i];
      const endDigit = endStr[i];
      const isAnimating = currentDigit !== endDigit;

      return (
        <motion.div
          key={`${i}-${endDigit}`}
          ref={el => digitRefs.current[i] = el}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          style={{
            fontSize: DIGIT_SIZE,
            fontFamily: DIGIT_FONT,
            color: isJackpot ? glowColor : color,
            marginRight: DIGIT_SPACING,
            display: 'inline-block',
            willChange: 'transform, opacity',
          }}
        >
          <AnimatePresence mode="wait">
            {isAnimating ? (
              <motion.span
                initial={{ y: 0 }}
                animate={{ y: DIGIT_SIZE }}
                transition={{
                  duration: durationMs / (digits * 10),
                  ease: 'easeInOut',
                  onUpdate: handleTick,
                }}
              >
                {currentDigit}
              </motion.span>
            ) : (
              <span>{currentDigit}</span>
            )}
          </AnimatePresence>
        </motion.div>
      );
    });
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        boxShadow: `0 0 16px ${isJackpot ? glowColor : 'transparent'}`,
      }}
    >
      {renderDigits()}
    </div>
  );
};

export default PixelScoreTicker;