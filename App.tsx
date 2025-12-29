
import React, { useState, useEffect } from 'react';
import { AppState, Quiz, AssessmentResult, MoodHistoryEntry } from './types';
import { Layout } from './components/Layout';
import { generateQuizFromRant, analyzeQuizResult } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LANDING);
  const [rant, setRant] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [history, setHistory] = useState<MoodHistoryEntry[]>([]);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<MoodHistoryEntry | null>(null);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('heartMirrorHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history helper
  const saveToHistory = (newResult: AssessmentResult, userRant: string) => {
    const entry: MoodHistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rantSnippet: userRant.length > 50 ? userRant.substring(0, 50) + '...' : userRant,
      fullResult: newResult,
    };
    const updatedHistory = [entry, ...history].slice(0, 30); // Keep last 30
    setHistory(updatedHistory);
    localStorage.setItem('heartMirrorHistory', JSON.stringify(updatedHistory));
  };

  const handleStartRant = () => setState(AppState.RANTING);
  const handleShowHistory = () => setState(AppState.HISTORY);

  const handleRantSubmit = async () => {
    if (!rant.trim()) return;
    setState(AppState.QUIZ_GENERATING);
    setLoadingMsg('AI 正在倾听并为你生成深度测评...');
    try {
      const generatedQuiz = await generateQuizFromRant(rant);
      setQuiz(generatedQuiz);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setState(AppState.QUIZ_TAKING);
    } catch (error) {
      console.error(error);
      alert('心语镜暂时遇到了一点波折，请稍后再试。');
      setState(AppState.RANTING);
    }
  };

  const handleQuizComplete = async () => {
    if (!quiz) return;
    setState(AppState.ANALYZING);
    setLoadingMsg('AI 正在深度分析你的情绪指纹...');
    try {
      const finalResult = await analyzeQuizResult(rant, quiz, answers);
      setResult(finalResult);
      saveToHistory(finalResult, rant);
      setState(AppState.REPORT);
    } catch (error) {
      console.error(error);
      alert('分析过程中断，请重试。');
      setState(AppState.QUIZ_TAKING);
    }
  };

  const handleAnswer = (questionId: number, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const nextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const resetApp = () => {
    setRant('');
    setQuiz(null);
    setAnswers({});
    setResult(null);
    setCurrentQuestionIndex(0);
    setSelectedHistoryEntry(null);
    setState(AppState.LANDING);
  };

  const renderAssessmentContent = (res: AssessmentResult) => (
    <div className="space-y-6">
      {res.crisisWarning && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <h4 className="text-red-800 font-bold mb-1">特别提醒</h4>
          <p className="text-red-700 text-xs leading-relaxed">
            如果你感觉到极度痛苦或有伤害自己的念头，请立即寻求专业帮助。心理援助热线：400-161-9995。
          </p>
        </div>
      )}

      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-700 mb-3 border-b border-slate-50 pb-2 flex items-center gap-2">
          <span className="text-lg">🌊</span> 情绪状态
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">{res.emotionalState}</p>
      </section>

      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-700 mb-3 border-b border-slate-50 pb-2 flex items-center gap-2">
          <span className="text-lg">🧩</span> 应对模式
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">{res.copingStyle}</p>
      </section>

      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-700 mb-3 border-b border-slate-50 pb-2 flex items-center gap-2">
          <span className="text-lg">💡</span> 深度洞察
        </h3>
        <p className="text-slate-600 text-sm italic leading-relaxed">"{res.psychologicalInsight}"</p>
      </section>

      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-700 mb-3 border-b border-slate-50 pb-2 flex items-center gap-2">
          <span className="text-lg">🌱</span> 愈合建议
        </h3>
        <ul className="space-y-3">
          {res.suggestions.map((s, i) => (
            <li key={i} className="flex gap-3 text-slate-600 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-[10px] font-bold">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  return (
    <Layout>
      {state === AppState.LANDING && (
        <div className="flex flex-col items-center justify-center h-full text-center fade-in py-10">
          <div className="w-32 h-32 rounded-full healing-gradient mb-8 shadow-inner flex items-center justify-center relative">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">今天感觉如何？</h2>
          <p className="text-slate-500 mb-10 px-4 leading-relaxed">
            生活总有不如意，这里是你的私人树洞。吐槽烦恼，AI 助你照见内心。
          </p>
          <div className="flex flex-col gap-4 w-full px-6">
            <button
              onClick={handleStartRant}
              className="w-full py-4 healing-gradient text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              开启情绪之旅
            </button>
            <button
              onClick={handleShowHistory}
              className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-full font-bold hover:bg-slate-50 transition-all"
            >
              心情脚印 (历史回溯)
            </button>
          </div>
        </div>
      )}

      {state === AppState.HISTORY && (
        <div className="fade-in pb-10">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={resetApp} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-slate-800">心情脚印</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400">还没有记录哦，快去开启第一次倾诉吧</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(entry => (
                <button 
                  key={entry.id} 
                  onClick={() => setSelectedHistoryEntry(entry)}
                  className="w-full text-left bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{entry.date}</span>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-bold text-sm mb-2 line-clamp-1">“{entry.rantSnippet}”</p>
                  <p className="text-slate-500 text-xs line-clamp-1 leading-relaxed">
                    点击查看完整治愈报告
                  </p>
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={resetApp}
            className="w-full mt-10 py-4 bg-slate-800 text-white rounded-xl font-bold shadow transition-all"
          >
            返回主页
          </button>

          {/* History Detail Overlay */}
          {selectedHistoryEntry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fade-in">
              <div className="bg-slate-50 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl relative p-6">
                <button 
                  onClick={() => setSelectedHistoryEntry(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/80 text-slate-500 hover:text-slate-800 shadow-sm z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{selectedHistoryEntry.date}</span>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">历史回响</h3>
                  <div className="mt-3 p-3 bg-white rounded-xl border border-slate-100 text-slate-500 text-xs italic">
                    “{selectedHistoryEntry.rantSnippet}”
                  </div>
                </div>
                {renderAssessmentContent(selectedHistoryEntry.fullResult)}
                <button 
                  onClick={() => setSelectedHistoryEntry(null)}
                  className="w-full mt-8 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {state === AppState.RANTING && (
        <div className="fade-in">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-blue-400 text-2xl">✍️</span> 尽情倾诉吧...
          </h2>
          <textarea
            value={rant}
            onChange={(e) => setRant(e.target.value)}
            placeholder="写下你现在的困扰：失恋、压力、甚至是对运气的不满... 这里没有人会评判你。"
            className="w-full h-64 p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none resize-none text-slate-700 bg-slate-50"
          />
          <div className="mt-6 flex flex-col gap-4">
            <button
              onClick={handleRantSubmit}
              disabled={!rant.trim()}
              className={`w-full py-4 rounded-xl font-bold shadow transition-all ${rant.trim() ? 'healing-gradient text-white hover:opacity-90' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              完成吐槽，生成测评
            </button>
            <button
              onClick={resetApp}
              className="text-slate-400 text-sm hover:text-slate-600"
            >
              返回主页
            </button>
          </div>
        </div>
      )}

      {(state === AppState.QUIZ_GENERATING || state === AppState.ANALYZING) && (
        <div className="flex flex-col items-center justify-center h-full text-center fade-in">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-blue-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium animate-pulse px-8">
            {loadingMsg}
          </p>
          <p className="text-xs text-slate-400 mt-4">治愈需要一点点时间</p>
        </div>
      )}

      {state === AppState.QUIZ_TAKING && quiz && (
        <div className="fade-in pb-10">
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-2xl font-bold text-slate-800">{quiz.title}</h2>
              <span className="text-slate-400 text-xs font-bold">{currentQuestionIndex + 1} / {quiz.questions.length}</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full healing-gradient transition-all duration-500" 
                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="min-h-[300px]">
            {quiz.questions.map((q, idx) => (
              idx === currentQuestionIndex && (
                <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm fade-in">
                  <p className="text-lg font-bold text-slate-700 mb-6 leading-relaxed">
                    {q.question}
                  </p>
                  <div className="space-y-3">
                    {q.options.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswer(q.id, opt.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          answers[q.id] === opt.id
                            ? 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-100 shadow-sm font-medium'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className={`flex-1 py-4 rounded-xl font-bold transition-all border ${
                currentQuestionIndex === 0 ? 'border-slate-100 text-slate-200 cursor-not-allowed' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              上一题
            </button>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={nextQuestion}
                disabled={!answers[quiz.questions[currentQuestionIndex].id]}
                className={`flex-[2] py-4 rounded-xl font-bold shadow transition-all ${
                  answers[quiz.questions[currentQuestionIndex].id] ? 'healing-gradient text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                下一题
              </button>
            ) : (
              <button
                onClick={handleQuizComplete}
                disabled={Object.keys(answers).length < quiz.questions.length}
                className={`flex-[2] py-4 rounded-xl font-bold shadow transition-all ${
                  Object.keys(answers).length === quiz.questions.length
                    ? 'healing-gradient text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                查看分析
              </button>
            )}
          </div>
        </div>
      )}

      {state === AppState.REPORT && result && (
        <div className="fade-in pb-10">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-4 uppercase tracking-widest">
              Psychological Report
            </div>
            <h2 className="text-3xl font-bold text-slate-800">情绪分析报告</h2>
          </div>

          {renderAssessmentContent(result)}

          <div className="mt-12 space-y-4">
            <button
              onClick={resetApp}
              className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold shadow hover:bg-slate-700 transition-all"
            >
              完成并退出
            </button>
            <p className="text-center text-xs text-slate-400">
              抱抱你，明天会是新的一天。
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
