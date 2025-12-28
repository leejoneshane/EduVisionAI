import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface ImageGalleryProps {
  images: GeneratedImage[];
  onRedo: (id: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onRedo }) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  if (images.length === 0) return null;

  const handleDownload = (img: GeneratedImage) => {
    if (!img.url) return;
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `eduvision-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 space-y-4 no-print">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <span>🖼️</span> 視覺化教材生成結果
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img, index) => (
          <div key={img.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
            {/* Image Container */}
            <div className="aspect-[4/3] bg-slate-100 relative group flex items-center justify-center">
              {img.status === 'completed' && img.url ? (
                <>
                  <img 
                    src={img.url} 
                    alt={`Generated ${index + 1}`} 
                    className="w-full h-full object-contain"
                  />
                  {/* Overlay for quick actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => setSelectedImage(img)}
                      className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-800 shadow-lg"
                      title="放大檢視"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDownload(img)}
                      className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-800 shadow-lg"
                      title="下載圖片"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                </>
              ) : img.status === 'error' ? (
                <div className="text-center p-4">
                  <span className="text-2xl block mb-2">⚠️</span>
                  <p className="text-red-500 text-sm font-medium">生成失敗</p>
                  <button onClick={() => onRedo(img.id)} className="mt-2 text-xs text-indigo-600 underline">重試</button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                   <p className="text-xs text-slate-500">{img.status === 'pending' ? '等待中...' : '生成中...'}</p>
                </div>
              )}
            </div>

            {/* Prompt Preview & Actions */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div className="mb-3">
                <p className="text-xs text-slate-500 font-mono line-clamp-3 bg-slate-50 p-2 rounded border border-slate-100">
                  {img.prompt.substring(0, 150)}...
                </p>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-medium">圖卡 {index + 1}</span>
                <div className="flex gap-2">
                   <button 
                    onClick={() => onRedo(img.id)}
                    disabled={img.status === 'generating'}
                    className="text-xs flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition disabled:opacity-50"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    重做
                  </button>
                  <button 
                    onClick={() => handleDownload(img)}
                    disabled={!img.url}
                    className="text-xs flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition disabled:opacity-50"
                  >
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    下載
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedImage.url!} 
              alt="Zoomed" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" 
            />
            <div className="mt-4 flex gap-4">
              <button 
                onClick={() => handleDownload(selectedImage)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                下載原始檔
              </button>
              <button 
                onClick={() => setSelectedImage(null)}
                className="px-6 py-2 bg-white text-slate-800 rounded-lg hover:bg-slate-100 transition shadow-lg"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
