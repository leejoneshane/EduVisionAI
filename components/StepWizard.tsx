import React, { useEffect, useRef } from 'react';
import { EduState, AppStep, InformationDensity } from '../types';
import { MODULES, DENSITY_OPTIONS } from '../constants';
import { suggestModules } from '../services/geminiService';

interface StepWizardProps {
  state: EduState;
  setState: React.Dispatch<React.SetStateAction<EduState>>;
  onGenerate: () => void;
  onReset: () => void;
}

export const StepWizard: React.FC<StepWizardProps> = ({ state, setState, onGenerate, onReset }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.step]);

  const nextStep = () => setState(s => ({ ...s, step: s.step + 1 }));
  const prevStep = () => setState(s => ({ ...s, step: s.step - 1 }));

  const handleModuleToggle = (id: string) => {
    setState(s => {
      const selected = s.selectedModules.includes(id)
        ? s.selectedModules.filter(m => m !== id)
        : [...s.selectedModules, id];
      return { ...s, selectedModules: selected };
    });
  };

  const handleAISuggest = async () => {
    setState(s => ({ ...s, isSuggesting: true }));
    const suggestion = await suggestModules(state);
    setState(s => ({ ...s, isSuggesting: false, aiSuggestion: suggestion }));
  };

  return (
    <div className="space-y-8" ref={scrollRef}>
      {/* Progress */}
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${((state.step + 1) / 4) * 100}%` }}
        ></div>
      </div>

      {/* Step 1: Basic Info & Density */}
      {state.step === AppStep.BASIC_INFO && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">步驟 1：基本資訊與設定</h2>
            <p className="text-slate-500">請告訴我們您想要設計的教學主題與偏好的資訊量。</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">適用年齡 / 年級</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="例如：小學五年級"
                value={state.basicInfo.age}
                onChange={(e) => setState(s => ({ ...s, basicInfo: { ...s.basicInfo, age: e.target.value } }))}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">科目 / 領域</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="例如：自然科學"
                value={state.basicInfo.subject}
                onChange={(e) => setState(s => ({ ...s, basicInfo: { ...s.basicInfo, subject: e.target.value } }))}
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="block text-sm font-bold text-slate-700">學習主題</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="例如：水循環的過程"
                value={state.basicInfo.topic}
                onChange={(e) => setState(s => ({ ...s, basicInfo: { ...s.basicInfo, topic: e.target.value } }))}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
             <label className="block text-sm font-bold text-slate-700">資訊密度 (Information Density)</label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {DENSITY_OPTIONS.map(opt => (
                 <button
                   key={opt.id}
                   onClick={() => setState(s => ({ ...s, basicInfo: { ...s.basicInfo, density: opt.id as InformationDensity } }))}
                   className={`p-4 rounded-xl border-2 text-left transition-all ${state.basicInfo.density === opt.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                 >
                   <div className="font-bold text-slate-800">{opt.title}</div>
                   <div className="text-xs text-slate-500 mt-1">{opt.description}</div>
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Step 2: Modules */}
      {state.step === AppStep.MODULE_SELECTION && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-slate-800">步驟 2：選擇視覺模組</h2>
             <button 
               onClick={handleAISuggest}
               disabled={state.isSuggesting}
               className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2"
             >
               {state.isSuggesting ? (
                 <span className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
               ) : (
                 <>✨ AI 智慧推薦</>
               )}
             </button>
          </div>

          {state.aiSuggestion && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm animate-fade-in">
              <strong>🤖 AI 助手建議：</strong> {state.aiSuggestion}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {MODULES.map(module => (
              <label 
                key={module.id} 
                className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${state.selectedModules.includes(module.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
              >
                <input type="checkbox" className="hidden" checked={state.selectedModules.includes(module.id)} onChange={() => handleModuleToggle(module.id)} />
                <div className="flex-shrink-0 text-2xl mr-4">{module.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-800">{module.title}</h3>
                  <p className="text-slate-500 text-sm mt-1">{module.description}</p>
                </div>
                <div className={`absolute top-4 right-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${state.selectedModules.includes(module.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {state.selectedModules.includes(module.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Customization */}
      {state.step === AppStep.STUDENT_TRAITS && (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-800">步驟 3：客製化設定</h2>
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-3">🔤 視覺語言 (Visual Language)</label>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={state.visualLanguage === 'Chinese'} onChange={() => setState(s => ({ ...s, visualLanguage: 'Chinese' }))} className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-700">繁體中文</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={state.visualLanguage === 'English'} onChange={() => setState(s => ({ ...s, visualLanguage: 'English' }))} className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-700">英語</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">學生興趣（選填）</label>
              <textarea className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" rows={3} placeholder="例如：喜歡恐龍、太空、足球" value={state.studentTraits.interests} onChange={(e) => setState(s => ({ ...s, studentTraits: { ...s.studentTraits, interests: e.target.value } }))} />
            </div>
            <div className="flex items-center space-x-3 bg-indigo-50/50 p-4 rounded-xl">
              <input type="checkbox" id="diff" className="w-5 h-5 text-indigo-600 rounded" checked={state.studentTraits.differentiation} onChange={(e) => setState(s => ({ ...s, studentTraits: { ...s.studentTraits, differentiation: e.target.checked } }))} />
              <label htmlFor="diff" className="text-slate-700 font-bold cursor-pointer">包含差異化教學策略</label>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button onClick={prevStep} disabled={state.step === 0} className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition disabled:opacity-30">上一步</button>
        {state.step < AppStep.STUDENT_TRAITS ? (
          <button onClick={nextStep} disabled={state.step === AppStep.BASIC_INFO && (!state.basicInfo.subject || !state.basicInfo.topic)} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition">下一步</button>
        ) : (
          <button onClick={onGenerate} disabled={state.isGenerating} className="px-8 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition flex items-center space-x-2">
            {state.isGenerating ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : <span>生成教學計畫</span>}
          </button>
        )}
      </div>
    </div>
  );
};
