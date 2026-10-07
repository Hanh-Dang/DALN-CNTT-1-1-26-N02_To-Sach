'use client';

import React, { useEffect, useState, useRef } from 'react';
import { formatVND } from '@/lib/utils';

interface CountUpNumberProps {
  value: number;
  duration?: number; // millisecond (mặc định 1400ms)
  formatType?: 'currency' | 'number' | 'percent' | 'raw';
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUpNumber({
  value,
  duration = 1400,
  formatType = 'number',
  prefix = '',
  suffix = '',
  className = '',
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const startValRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = startValRef.current;
    const endVal = value;
    const diff = endVal - startVal;

    // Kích hoạt hiệu ứng nhấp nháy nhẹ nếu số thay đổi trong lúc đang xem (Realtime update)
    if (startVal !== 0 && diff !== 0) {
      setIsUpdated(true);
      const timer = setTimeout(() => setIsUpdated(false), 2000);
      return () => clearTimeout(timer);
    }

    startTimeRef.current = null;

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutExpo(progress);

      const current = Math.round(startVal + diff * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        startValRef.current = endVal;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  // Định dạng số hiển thị theo cấu hình
  const renderFormatted = () => {
    if (formatType === 'currency') {
      return formatVND(displayValue);
    }
    if (formatType === 'percent') {
      return `${(displayValue / 10).toFixed(1)}%`;
    }
    if (formatType === 'number') {
      return displayValue.toLocaleString('vi-VN');
    }
    return displayValue;
  };

  return (
    <span
      className={`inline-block transition-all duration-500 ${
        isUpdated ? 'text-emerald-600 scale-105 filter drop-shadow-sm' : ''
      } ${className}`}
    >
      {prefix}
      {renderFormatted()}
      {suffix}
    </span>
  );
}
