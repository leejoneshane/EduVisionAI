import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface ImageGalleryProps {
  images: GeneratedImage[];
  onUpdatePrompt: (id: string, newPrompt: string) => void;
  onGenerateSingle: (id: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onUpdatePrompt, onGenerateSingle }) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  if (images.length === 0) return null;

  const handleDownload = (img: GeneratedImage) => {
    if (!img.url) return;
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `eduvision-resource-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 no-print">
      {images.map((img, index) => (
        <div key={img.id} className="flex flex-col lg:flex-row gap-8 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5">
          
          {/* LEFT: Image Preview Block */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">資源 #{index + 1}</span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Aspect {img.aspectRatio}</span>
              </span>
              {img.status === 'completed' && (
                <div className="flex gap-2">
                  <button onClick={() => setSelectedImage(img)} title="放大檢視" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                  </button>
                  <button onClick={() => handleDownload(img)} title="下載圖檔" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                </div>
              )}
            </div>

            <div className="relative aspect-video bg-white rounded-2xl border-2 border-slate-100 overflow-hidden flex items-center justify-center shadow-inner group-hover:border-indigo-100 transition-colors">
              {img.status === 'generating' ? (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent shadow-lg shadow-indigo-200"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-indigo-600 animate-pulse font-black">AI</span>
                    </div>
                  </div>
                  <p className="mt-6 text-sm font-bold text-indigo-600/80 animate-pulse tracking-widest uppercase">繪製忙碌中...</p>
                </div>
              ) : img.status === 'completed' && img.url ? (
                <img 
                  src={img.url} 
                  alt={`Visualization ${index + 1}`} 
                  className="w-full h-full object-contain cursor-zoom-in transition-transform duration-500 hover:scale-[1.02]" 
                  onClick={() => setSelectedImage(img)}
                />
              ) : img.status === 'error' ? (
                <div className="text-center p-8">
                  <span className="text-4xl">😵‍💫</span>
                  <p className="text-red-500 font-bold mt-2">生成發生錯誤</p>
                  <p className="text-xs text-slate-400 mt-1">{img.error}</p>
                  <button onClick={() => onGenerateSingle(img.id)} className="mt-4 text-xs bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition">重新嘗試</button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center px-12 opacity-40">
                  <svg className="w-20 h-20 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">等待生成指令</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Prompt Editor Block */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                生圖提示詞對話框
              </label>
              <span className="text-[9px] text-slate-300 italic">支援 Markdown 與自然語言描述</span>
            </div>
            
            <div className="flex-1 relative">
              <textarea
                className="w-full h-full min-h-[180px] p-5 text-sm font-mono bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none resize-none transition-all shadow-inner placeholder:text-slate-300"
                placeholder="在此輸入或編輯提示詞內容..."
                value={img.editedPrompt || img.prompt}
                onChange={(e) => onUpdatePrompt(img.id, e.target.value)}
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                  onClick={() => onGenerateSingle(img.id)}
                  disabled={img.status === 'generating'}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${img.status === 'completed' ? 'bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-600/20'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {img.status === 'completed' ? '重新生圖' : '單獨生成'}
                </button>
              </div>
            </div>
            <div className="mt-3 px-2">
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                * 注意：編輯後的提示詞將被用於下一次圖像生成。匯出 PDF 時將同時包含最終提示詞與圖像。
              </p>
            </div>
          </div>

        </div>
      ))}

      {/* Fullscreen Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors" onClick={() => setSelectedImage(null)}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="relative max-w-7xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={selectedImage.url!} 
                alt="Zoomed Visualization" 
                className="w-full h-auto max-h-[80vh] object-contain" 
              />
              <div className="bg-slate-50 p-6 flex items-center justify-between border-t border-slate-100">
                <div className="flex-1">
                  <h5 className="text-slate-800 font-bold mb-1">視覺教材預覽</h5>
                  <p className="text-xs text-slate-500 font-mono truncate max-w-2xl">{selectedImage.editedPrompt || selectedImage.prompt}</p>
                </div>
                <button 
                  onClick={() => handleDownload(selectedImage)} 
                  className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  立即下載圖檔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};