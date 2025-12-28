import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden min-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🎓</span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">EduVision AI</h1>
              <p className="text-indigo-200 text-sm">教育視覺化設計系統</p>
            </div>
          </div>
          {title && <h2 className="text-white/90 font-medium text-sm bg-indigo-700/50 px-3 py-1 rounded-full">{title}</h2>}
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          {children}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 text-center text-slate-400 text-xs">
          Powered by Gemini 3 Flash • 專為教育工作者與學習者設計
        </div>
      </div>
    </div>
  );
};