import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StepWizard } from './components/StepWizard';
import { ApiKeyPage } from './components/ApiKeyPage';
import { ImageGallery } from './components/ImageGallery';
import { generatePlan, extractPrompts, generateImage } from './services/geminiService';
import { EduState, AppStep, GeneratedImage } from './types';

// Add definition for html2pdf
declare global {
  interface Window {
    html2pdf: () => any;
  }
}

const INITIAL_STATE: EduState = {
  step: AppStep.MODE_SELECTION,
  mode: null,
  basicInfo: { age: '', subject: '', topic: '' },
  goals: { learningGoal: '', timing: '' },
  selectedModules: [],
  studentTraits: { interests: '', differentiation: false },
  visualLanguage: 'Chinese', // Default
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

  // Auto-detect language preference based on subject input
  useEffect(() => {
    if (state.step === AppStep.BASIC_INFO) {
      const subject = state.basicInfo.subject.toLowerCase();
      if (subject.includes('english') || subject.includes('英文') || subject.includes('英語')) {
        setState(s => ({ ...s, visualLanguage: 'English' }));
      }
    }
  }, [state.basicInfo.subject, state.step]);

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

  const handleKeySelected = () => {
    setHasApiKey(true);
  };

  const handleGenerate = async () => {
    setState(s => ({ ...s, isGenerating: true, finalResult: null, generatedImages: [] }));
    const result = await generatePlan(state);
    setState(s => ({ 
      ...s, 
      finalResult: result, 
      isGenerating: false, 
      step: AppStep.RESULT 
    }));
  };

  const handleReset = () => {
    setState(INITIAL_STATE);
  };

  const handlePdfDownload = async () => {
    if (!state.finalResult) return;
    
    setIsPdfGenerating(true);
    
    try {
      // Create a temporary element to render the HTML for PDF generation
      // We wrap it to ensure styles are captured correctly
      const element = document.createElement('div');
      element.className = 'plan-content p-8 bg-white';
      element.innerHTML = state.finalResult;
      
      // Remove the script tag containing prompts from the PDF visual
      const scriptTag = element.querySelector('#prompts');
      if (scriptTag) scriptTag.remove();

      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right in mm
        filename: `eduvision-plan-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      if (window.html2pdf) {
        await window.html2pdf().set(opt).from(element).save();
      } else {
        alert("PDF 生成庫尚未加載完成，請重整頁面後再試。");
      }

    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("PDF 生成失敗，請稍後再試。");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!state.finalResult) return;
    
    // Extract prompts from HTML
    const extractedData = extractPrompts(state.finalResult);
    
    if (extractedData.length === 0) {
      alert("未偵測到可用的生圖提示詞 (JSON)。請嘗試「重新生成教學計劃」。");
      return;
    }

    // Initialize image placeholders
    const newImages: GeneratedImage[] = extractedData.map((item, index) => ({
      id: Date.now().toString() + index,
      prompt: item.prompt,
      aspectRatio: item.aspectRatio,
      url: null,
      status: 'pending'
    }));

    setState(s => ({ ...s, generatedImages: newImages }));

    // Process images sequentially
    for (let i = 0; i < newImages.length; i++) {
       const imgId = newImages[i].id;
       const currentItem = newImages[i];
       
       setState(s => ({
         ...s,
         generatedImages: s.generatedImages.map(img => 
           img.id === imgId ? { ...img, status: 'generating' } : img
         )
       }));

       try {
         const base64Url = await generateImage(currentItem.prompt, currentItem.aspectRatio);
         
         setState(s => ({
           ...s,
           generatedImages: s.generatedImages.map(img => 
             img.id === imgId ? { ...img, status: 'completed', url: base64Url } : img
           )
         }));
       } catch (error) {
         setState(s => ({
           ...s,
           generatedImages: s.generatedImages.map(img => 
             img.id === imgId ? { ...img, status: 'error', error: 'Generation failed' } : img
           )
         }));
       }
    }
  };

  const handleRedoImage = async (id: string) => {
    const targetImage = state.generatedImages.find(img => img.id === id);
    if (!targetImage) return;

    setState(s => ({
      ...s,
      generatedImages: s.generatedImages.map(img => 
        img.id === id ? { ...img, status: 'generating', error: undefined } : img
      )
    }));

    try {
      const base64Url = await generateImage(targetImage.prompt, targetImage.aspectRatio);
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
          img.id === id ? { ...img, status: 'error', error: 'Redo failed' } : img
        )
      }));
    }
  };

  if (isLoadingKey) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!hasApiKey) {
    return (
      <Layout>
        <ApiKeyPage onKeySelected={handleKeySelected} />
      </Layout>
    );
  }

  return (
    <Layout title={state.step === AppStep.MODE_SELECTION ? '' : (state.mode === 'TEACHER' ? '教師模式' : '學生模式')}>
      {state.step !== AppStep.RESULT ? (
        <StepWizard 
          state={state} 
          setState={setState} 
          onGenerate={handleGenerate}
          onReset={handleReset}
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Result Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-4 no-print">
             <h2 className="text-2xl font-bold text-slate-800">您的 EduVision 教學計畫</h2>
             <div className="flex gap-2">
                <button 
                  onClick={handlePdfDownload}
                  disabled={isPdfGenerating}
                  className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="下載 PDF 教學計畫"
                >
                  {isPdfGenerating ? (
                    <span className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  )}
                  {isPdfGenerating ? '製作中...' : '下載教學計畫 (PDF)'}
                </button>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 text-sm border border-slate-300 text-slate-500 rounded-lg hover:bg-slate-50 transition"
                >
                  重新開始
                </button>
             </div>
          </div>
          
          {/* Plan Content (Rendered HTML) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 min-h-[500px]">
            {/* The generated HTML from Gemini is rendered here */}
            {/* We apply the plan-content class to style the raw HTML */}
            <div 
              className="plan-content prose prose-indigo max-w-none"
              dangerouslySetInnerHTML={{ __html: state.finalResult || '' }} 
            />
          </div>
          
          {/* Image Gallery */}
          <ImageGallery images={state.generatedImages} onRedo={handleRedoImage} />

          {/* Result Footer Actions */}
          <div className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-center gap-4 no-print">
             <button 
                  onClick={handleGenerate}
                  disabled={state.isGenerating}
                  className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:border-slate-300 hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                  {state.isGenerating ? (
                    <span className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full"></span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  )}
                  重新生成教學計劃
            </button>
            
            <button 
                  onClick={handleGenerateImages}
                  disabled={state.generatedImages.some(img => img.status === 'generating' || img.status === 'pending') && state.generatedImages.length > 0}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {state.generatedImages.some(img => img.status === 'generating') ? (
                    <>
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                      正在繪製中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      進行圖像生成
                    </>
                  )}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
