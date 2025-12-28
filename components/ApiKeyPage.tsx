import React, { useState } from 'react';

interface ApiKeyPageProps {
  onKeySelected: () => void;
}

export const ApiKeyPage: React.FC<ApiKeyPageProps> = ({ onKeySelected }) => {
  const [error, setError] = useState<string | null>(null);

  const handleSelectKey = async () => {
    try {
      setError(null);
      await window.aistudio.openSelectKey();
      // Assume success if no error thrown, proceed to check logic in parent or just callback
      onKeySelected();
    } catch (e: any) {
      console.error("Key selection failed", e);
      if (e.message?.includes("Requested entity was not found")) {
         setError("找不到請求的項目，請重新選擇有效的專案金鑰。");
      } else {
         setError("選擇金鑰時發生錯誤，請稍後再試。");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-8 animate-fade-in">
      <div className="bg-indigo-50 p-6 rounded-full">
        <span className="text-6xl">🔑</span>
      </div>
      
      <div className="space-y-4 max-w-lg">
        <h1 className="text-3xl font-bold text-slate-800">需要設定 API 金鑰</h1>
        <p className="text-slate-600 leading-relaxed">
          為了提供高品質的教學視覺化生成服務（支援 <strong>Nano Banana Pro</strong> 等高階模型），
          本應用程式需要您連結 Google Cloud 專案的付費 API 金鑰。
        </p>
      </div>

      <div className="space-y-4 w-full max-w-xs">
        <button 
          onClick={handleSelectKey}
          className="w-full px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-2"
        >
          <span>連結 API 金鑰</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
        </button>

        {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
            </div>
        )}

        <div className="text-xs text-slate-400 mt-6">
          <p>
            尚未設定計費專案？請參考 
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline ml-1">
              Google Gemini API 計費說明
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
