import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden min-h-[85vh] flex flex-col border border-white/20">
        {/* Modern Dynamic Header */}
        <div className="bg-indigo-600 px-10 py-8 flex items-center justify-between relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <span className="text-3xl">🎓</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">EduVision AI</h1>
              <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest opacity-80">Educational Visualization Studio</p>
            </div>
          </div>
          
          {title && (
            <div className="relative z-10 hidden sm:block">
              <span className="text-white/90 font-bold text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm">
                {title}
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 sm:p-10 overflow-y-auto relative bg-white">
          {children}
        </div>
        
        {/* Minimal Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-10 py-6 flex justify-between items-center text-slate-400 text-xs no-print">
          <p>© 2024 EduVision AI Studio • Next-Gen Education Tool</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> System Online</span>
            <span>Powered by Gemini 3 Flash</span>
          </div>
        </div>
      </div>
    </div>
  );
};