'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import Navbar from './Navbar';

export default function AppWrapper({ children }) {
  const { bgCanvas, textPrimary } = useTheme();
  
  return (
    <div className={`min-h-screen w-full flex flex-col justify-start pb-20 ${bgCanvas} ${textPrimary}`}>
      {children}
      <Navbar />
    </div>
  );
}