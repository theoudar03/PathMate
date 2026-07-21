import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import EmergencyButton from '../components/common/EmergencyButton';
import FloatingAIButton from '../components/common/FloatingAIButton';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-onSurface selection:bg-primaryContainer selection:text-onPrimaryContainer">
      {/* Global Header */}
      <Navbar />

      {/* Main Pages Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 font-sans">
        <Outlet />
      </main>

      {/* Upper Floating AI Assistant shortcut */}
      <FloatingAIButton />

      {/* Lower Floating Emergency shortcut */}
      <EmergencyButton />
    </div>
  );
};

export default MainLayout;
