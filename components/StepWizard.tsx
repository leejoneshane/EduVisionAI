import React, { useEffect, useRef } from 'react';
import { EduState, AppStep, UserMode } from '../types';
import { MODULES, LEARNING_GOALS, TIMING_OPTIONS } from '../constants';
import { suggestModules } from '../services/geminiService';

interface StepWizardProps {
  state: EduState;
  setState: React.Dispatch<React.SetStateAction<EduState>>;
  onGenerate: () => void;
  onReset: () => void;
}

// Icons (Simple SVGs)
const TeacherIcon = () => <svg className="w-12 h-12 mb-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const StudentIcon = () => <svg className="w-12 h-12 mb-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>;

export const StepWizard: React.FC<StepWizardProps> = ({ state, setState, onGenerate, onReset }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.step]);

  const nextStep = () => setState(s => ({ ...s, step: s.step + 1 }));
  const prevStep = () => setState(s => ({ ...s, step: s.step - 1 }));

  const handleModeSelect = (mode: UserMode) => {
    setState(s => ({ ...s, mode, step: s.step + 1 }));
  };

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

  // --- Render Steps ---

  if (state.step === AppStep.MODE_SELECTION) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-800">請問您的身份是？</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => handleModeSelect('TEACHER')}
            className="group flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all duration-300"
          >
            <TeacherIcon />
            <h3 className="text-xl font-bold text-slate-700 group-hover:text-indigo-600">教師模式</h3>
            <p className="text-slate-500 text-center mt-2 text-sm">適用於備課、製作教材、課堂講解。</p>
          </button>
          <button
            onClick={() => handleModeSelect('STUDENT')}
            className="group flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all duration-300"
          >
            <StudentIcon />
            <h3 className="text-xl font-bold text-slate-700 group-hover:text-emerald-600">學生模式</h3>
            <p className="text-slate-500 text-center mt-2 text-sm">適用於學習指南、複習、筆記整理、概念理解。</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" ref={scrollRef}>
      {/* Progress */}
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${(state.step / 5) * 100}%` }}
        ></div>
      </div>

      {/* Step 1: Basic Info */}
      {state.step === AppStep.BASIC_INFO && (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-800">步驟 1：基本資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">適用年齡 / 年級</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="例如：小學五年級、10歲、高中"
                value={state.basicInfo.age}
                onChange={(e) => setState(s => ({ ...s, basicInfo: { ...s.basicInfo, age: e.target.value } }))}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">科目 / 領域</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="例如：生物、歷史、數學"
                value={state.basicInfo.subject}
                onChange={(e) => setState(s => ({ ...s, basicInfo: { ...s.basicInfo, subject: e.target.value } }))}
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-slate-700">學習主題</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="例如：光合作用、法國大革命、分數運算"
                value={state.basicInfo.topic}
                onChange={(e) => setState(s => ({ ...s, basicInfo: { ...s.basicInfo, topic: e.target.value } }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Goals */}
      {state.step === AppStep.GOALS && (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-800">步驟 2：目標與情境</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">學習目標</label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={state.goals.learningGoal}
                onChange={(e) => setState(s => ({ ...s, goals: { ...s.goals, learningGoal: e.target.value } }))}
              >
                <option value="">請選擇目標...</option>
                {LEARNING_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">使用時機</label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={state.goals.timing}
                onChange={(e) => setState(s => ({ ...s, goals: { ...s.goals, timing: e.target.value } }))}
              >
                <option value="">請選擇使用情境...</option>
                {TIMING_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Modules */}
      {state.step === AppStep.MODULE_SELECTION && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-slate-800">步驟 3：選擇視覺模組</h2>
             <button 
               onClick={handleAISuggest}
               disabled={state.isSuggesting}
               className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2"
             >
               {state.isSuggesting ? (
                 <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  思考中...
                 </>
               ) : (
                 <>✨ AI 智慧推薦</>
               )}
             </button>
          </div>

          {state.aiSuggestion && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm animate-fade-in">
              <strong>🤖 AI 助手建議：</strong> {state.aiSuggestion}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {MODULES.map(module => (
              <label 
                key={module.id} 
                className={`
                  relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all
                  ${state.selectedModules.includes(module.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}
                `}
              >
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={state.selectedModules.includes(module.id)}
                  onChange={() => handleModuleToggle(module.id)}
                />
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

      {/* Step 4: Traits & Customization */}
      {state.step === AppStep.STUDENT_TRAITS && (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-800">步驟 4：客製化設定</h2>
          
          <div className="space-y-4">
            {/* Language Selection */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                🔤 生成圖片的語言設定 (Visual Language)
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="visualLanguage" 
                    value="Chinese"
                    checked={state.visualLanguage === 'Chinese'}
                    onChange={() => setState(s => ({ ...s, visualLanguage: 'Chinese' }))}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-slate-700">繁體中文 (Traditional Chinese)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="visualLanguage" 
                    value="English"
                    checked={state.visualLanguage === 'English'}
                    onChange={() => setState(s => ({ ...s, visualLanguage: 'English' }))}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-slate-700">英語 (English)</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                * 若選擇英語，生成的圖卡或圖表中的文字將會是英文。
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">學生興趣（選填）</label>
              <textarea 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                rows={3}
                placeholder="例如：喜歡恐龍、Minecraft、太空、或足球"
                value={state.studentTraits.interests}
                onChange={(e) => setState(s => ({ ...s, studentTraits: { ...s.studentTraits, interests: e.target.value } }))}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="diff"
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                checked={state.studentTraits.differentiation}
                onChange={(e) => setState(s => ({ ...s, studentTraits: { ...s.studentTraits, differentiation: e.target.checked } }))}
              />
              <label htmlFor="diff" className="text-slate-700 font-medium cursor-pointer">包含差異化教學策略</label>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button 
          onClick={prevStep}
          className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition"
        >
          上一步
        </button>
        {state.step < AppStep.STUDENT_TRAITS ? (
          <button 
            onClick={nextStep}
            disabled={
              (state.step === AppStep.BASIC_INFO && (!state.basicInfo.subject || !state.basicInfo.topic)) ||
              (state.step === AppStep.GOALS && !state.goals.learningGoal) ||
              (state.step === AppStep.MODULE_SELECTION && state.selectedModules.length === 0)
            }
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            下一步
          </button>
        ) : (
          <button 
            onClick={onGenerate}
            disabled={state.isGenerating}
            className="px-8 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-70 transition flex items-center space-x-2"
          >
            {state.isGenerating ? (
              <>
                 <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 <span>正在生成...</span>
              </>
            ) : (
              <span>建立視覺化計畫</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
