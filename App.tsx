import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StepWizard } from './components/StepWizard';
import { ApiKeyPage } from './components/ApiKeyPage';
import { ImageGallery } from './components/ImageGallery';
import { generatePlan, extractPrompts, generateImage } from './services/geminiService';
import { EduState, AppStep, GeneratedImage } from './types';

declare global {
  interface Window {
    html2pdf: () => any;
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const INITIAL_STATE: EduState = {
  step: AppStep.BASIC_INFO,
  basicInfo: { age: '', subject: '', topic: '', density: 'Standard' },
  selectedModules: [],
  studentTraits: { interests: '', differentiation: false },
  visualLanguage: 'Chinese',
  aiSuggestion: null,
  finalResult: null,
  isGenerating: false,
  isSuggesting: false,
  generatedImages: []
};

const App: React.FC = () => {
  const [state, setState] = useState<EduState>(INITIAL_STATE);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isLoadingKey, setIsLoadingKey] = useState<boolean>(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    } catch (e) {
      console.error("Failed to check API key status", e);
    } finally {
      setIsLoadingKey(false);
    }
  };

  const handleKeySelected = () => setHasApiKey(true);

  const cleanMarkdownHtml = (raw: string) => {
    if (!raw) return '';
    return raw
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim();
  };

  const handleGenerate = async () => {
    setState(s => ({ ...s, isGenerating: true, finalResult: null, generatedImages: [] }));
    
    try {
      const rawResult = await generatePlan(state);
      const cleanedResult = cleanMarkdownHtml(rawResult);
      
      const extractedData = extractPrompts(cleanedResult);
      const initialImages: GeneratedImage[] = extractedData.map((item, index) => ({
        id: Date.now().toString() + index,
        prompt: item.prompt,
        aspectRatio: item.aspectRatio,
        url: null,
        status: 'pending'
      }));

      setState(s => ({ 
        ...s, 
        finalResult: cleanedResult, 
        generatedImages: initialImages,
        isGenerating: false, 
        step: AppStep.RESULT 
      }));
    } catch (error) {
      console.error("Generation failed:", error);
      setState(s => ({ ...s, isGenerating: false }));
      alert("設計方案生成失敗，請檢查 API 金鑰。");
    }
  };

  const handleReset = () => setState(INITIAL_STATE);

  const handleUpdatePrompt = (id: string, newPrompt: string) => {
    setState(s => ({
      ...s,
      generatedImages: s.generatedImages.map(img => 
        img.id === id ? { ...img, editedPrompt: newPrompt } : img
      )
    }));
  };

  const handleGenerateSingleImage = async (id: string) => {
    const target = state.generatedImages.find(img => img.id === id);
    if (!target) return;

    setState(s => ({
      ...s,
      generatedImages: s.generatedImages.map(img => 
        img.id === id ? { ...img, status: 'generating', error: undefined } : img
      )
    }));

    try {
      const finalPrompt = target.editedPrompt || target.prompt;
      const base64Url = await generateImage(finalPrompt, target.aspectRatio);
      setState(s => ({
        ...s,
        generatedImages: s.generatedImages.map(img => 
          img.id === id ? { ...img, status: 'completed', url: base64Url } : img
        )
      }));
    } catch (error) {
      setState(s => ({
        ...s,
        generatedImages: s.generatedImages.map(img => 
          img.id === id ? { ...img, status: 'error', error: (error as Error).message } : img
        )
      }));
    }
  };

  const handleGenerateAllImages = async () => {
    const pendingImages = state.generatedImages; // Generate all, including those already done if needed
    for (const img of pendingImages) {
      await handleGenerateSingleImage(img.id);
    }
  };

  const handlePdfDownload = async () => {
    if (!state.finalResult) return;
    setIsPdfGenerating(true);
    try {
      const element = document.createElement('div');
      element.className = 'plan-content p-12 bg-white';
      
      // Part 1: Main Plan
      let html = state.finalResult;
      // Part 2: Generated Images & Prompts
      if (state.generatedImages.length > 0) {
        html += '<div style="page-break-before: always; border-top: 2px solid #e2e8f0; padding-top: 2rem; margin-top: 3rem;">';
        html += '<h1 style="text-align: left; margin-bottom: 2rem;">視覺教材資源庫</h1>';
        state.generatedImages.forEach((img, idx) => {
          html += `<div style="margin-bottom: 3rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 2rem;">`;
          html += `<h3>教材資源 #${idx + 1}</h3>`;
          if (img.url) {
            html += `<div style="text-align: center; margin: 1rem 0;"><img src="${img.url}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" /></div>`;
          } else {
            html += `<p style="color: #94a3b8; font-style: italic;">(此圖像未生成或生成失敗)</p>`;
          }
          html += `<div style="background: #f8fafc; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.85rem; color: #475569;">`;
          html += `<strong>生成提示詞：</strong><br/>${img.editedPrompt || img.prompt}`;
          html += `</div></div>`;
        });
        html += '</div>';
      }

      element.innerHTML = html;
      
      const scriptTag = element.querySelector('#prompts');
      if (scriptTag) scriptTag.remove();
      
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `eduvision-plan-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      if (window.html2pdf) {
        await window.html2pdf().set(opt).from(element).save();
      }
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("PDF 下載失敗，請重試。");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  if (isLoadingKey) return <Layout><div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div></Layout>;
  if (!hasApiKey) return <Layout><ApiKeyPage onKeySelected={handleKeySelected} /></Layout>;

  return (
    <Layout title={state.step === AppStep.RESULT ? '視覺化設計工作室' : '新專案設定'}>
      {state.step !== AppStep.RESULT ? (
        <StepWizard state={state} setState={setState} onGenerate={handleGenerate} onReset={handleReset} />
      ) : (
        <div className="space-y-8 animate-fade-in -mt-4 pb-20">
          {/* Result Toolbar */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 py-4 px-2 -mx-2 flex items-center justify-between no-print">
             <div className="pl-4">
                <h2 className="text-xl font-bold text-slate-800">教學設計方案</h2>
                <p className="text-xs text-slate-500">資訊密度：{state.basicInfo.density}</p>
             </div>
             <div className="flex gap-2 pr-4">
                <button onClick={handlePdfDownload} disabled={isPdfGenerating} className="px-4 py-2 text-sm bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50">
                  {isPdfGenerating ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                  匯出計畫 (PDF)
                </button>
                <button onClick={handleReset} className="px-4 py-2 text-sm bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition">重新開始</button>
             </div>
          </div>
          
          {/* Paper Canvas */}
          <div className="flex justify-center bg-slate-100/30 -mx-8 p-12 border-y border-slate-100">
            <div className="bg-white w-full max-w-[850px] min-h-[600px] shadow-[0_5px_30px_rgba(0,0,0,0.05)] rounded-sm p-16 relative">
              <div className="absolute top-8 right-8 text-slate-100 pointer-events-none select-none text-6xl opacity-10 font-black italic">EduVision</div>
              <div className="plan-content" dangerouslySetInnerHTML={{ __html: state.finalResult || '' }} />
            </div>
          </div>
          
          {/* Image Workspace - Redesigned to support Left/Right layout in Children */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 no-print">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-100">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-slate-800 mb-1">視覺圖像資產區</h3>
                <p className="text-slate-500">左側為預覽，右側可編輯提示詞。按下「全部圖像生成」開始忙碌繪製。</p>
              </div>
              <button 
                onClick={handleGenerateAllImages}
                disabled={state.generatedImages.some(img => img.status === 'generating') || state.generatedImages.length === 0}
                className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                全部圖像生成
              </button>
            </div>
            
            <ImageGallery 
              images={state.generatedImages} 
              onUpdatePrompt={handleUpdatePrompt} 
              onGenerateSingle={handleGenerateSingleImage} 
            />
          </div>

          <div className="flex justify-center pt-8 no-print pb-20">
             <button onClick={handleGenerate} disabled={state.isGenerating} className="text-slate-400 hover:text-indigo-600 text-sm font-medium flex items-center gap-2 transition group">
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                對計畫內容不滿意？重新設計計畫內容
              </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;