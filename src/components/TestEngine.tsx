import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { Clock, CheckSquare, AlertCircle, Bookmark, ArrowLeft, ArrowRight, XCircle, ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TestEngineProps {
  testName: string;
  questions: Question[];
  durationMinutes: number;
  positiveMarking: number;
  negativeMarking: number;
  onCancel: () => void;
  onSubmit: (answers: { [key: number]: 'A' | 'B' | 'C' | 'D' | 'E' | null }, spentSeconds: number) => void;
}

export default function TestEngine({
  testName,
  questions,
  durationMinutes,
  positiveMarking,
  negativeMarking,
  onCancel,
  onSubmit,
}: TestEngineProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [key: number]: 'A' | 'B' | 'C' | 'D' | 'E' | null }>({});
  const [flagged, setFlagged] = useState<{ [key: number]: boolean }>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(durationMinutes * 60);
  const [isConfirmingSubmit, setIsConfirmingSubmit] = useState<boolean>(false);
  const [isFocusLossConfirm, setIsFocusLossConfirm] = useState<boolean>(false);
  const [isMonitorExpanded, setIsMonitorExpanded] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Copy, Cut, ContextMenu, Key shortcuts (Screenshot protection) & Window Focus loss detection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopyCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
      }
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === "c" || e.key === "C" || e.key === "x" || e.key === "X" || e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S")
      ) {
        e.preventDefault();
      }
      if (e.key === "F12") {
        e.preventDefault();
      }
    };

    const handleFocusLoss = () => {
      if (timeLeftSeconds > 0 && !isFocusLossConfirm && !isConfirmingSubmit) {
        setIsFocusLossConfirm(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleFocusLoss();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopyCut as any);
    window.addEventListener("cut", handleCopyCut as any);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleFocusLoss);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopyCut as any);
      window.removeEventListener("cut", handleCopyCut as any);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleFocusLoss);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timeLeftSeconds, isFocusLossConfirm, isConfirmingSubmit]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx];

  // Initialize empty answers
  useEffect(() => {
    const initialAnswers: { [key: number]: 'A' | 'B' | 'C' | 'D' | 'E' | null } = {};
    questions.forEach(q => {
      initialAnswers[q.questionNo] = null;
    });
    setAnswers(initialAnswers);
  }, [questions]);

  // Timer Countdown Logic
  useEffect(() => {
    const startTimeStamp = Date.now();
    const targetSeconds = durationMinutes * 60;
    
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeStamp) / 1000);
      const remaining = targetSeconds - elapsed;
      
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setTimeLeftSeconds(0);
        // Force Auto Submission!
        console.log("Timer expired! Auto-submitting assessment...");
        onSubmit(answers, targetSeconds);
      } else {
        setTimeLeftSeconds(remaining);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [durationMinutes]);

  const spentTimeSeconds = (durationMinutes * 60) - timeLeftSeconds;

  // Format countdown text (MM:SS)
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D' | 'E') => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.questionNo]: option
    }));
  };

  const handleClearOption = () => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.questionNo]: null
    }));
  };

  const handleToggleFlag = () => {
    setFlagged(prev => ({
      ...prev,
      [currentQuestion.questionNo]: !prev[currentQuestion.questionNo]
    }));
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleForceSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onSubmit(answers, spentTimeSeconds);
  };

  // Stats calculation for summary warning modal
  const attemptedCount = Object.values(answers).filter(val => val !== null).length;
  const unattemptedCount = totalQuestions - attemptedCount;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative" id="test-taking-engine">
      
      {/* Top sticky stats banner */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3.5 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-600 font-bold text-white text-[9px] uppercase font-mono tracking-wider rounded">
                Live Exam
              </span>
              <h2 className="text-sm font-bold tracking-tight text-white font-display max-w-xs truncate">{testName}</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-bold ml-1 font-mono uppercase tracking-wider">
              Score System: <span className="text-emerald-400">+{positiveMarking} correct</span> • <span className="text-rose-500">-{negativeMarking} wrong</span>
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            {/* Pulsing countdown timer */}
            <div className={`p-2 px-4 rounded-xl flex items-center gap-2 font-mono text-base font-extrabold shadow border transition-all ${
              timeLeftSeconds < 60 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500 animate-pulse' 
                : 'bg-slate-850 text-emerald-400 border-slate-700'
            }`}>
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            <button
              onClick={() => setIsConfirmingSubmit(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/15 transition flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              Finish Exam
            </button>
          </div>
        </div>
      </header>      {/* Primary grid view containing status sheet on left and action panel on right */}
      <main className="flex-1 max-w-full xl:max-w-[1400px] w-full mx-auto p-2 sm:p-4 md:px-5 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start mt-2">
                {/* Navigation Grid on left side */}
        <section className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm lg:col-span-3 transition-all duration-300" id="question-navigator">
          <div 
            onClick={() => setIsMonitorExpanded(!isMonitorExpanded)}
            className="flex justify-between items-center pb-2 border-b border-slate-800 cursor-pointer md:cursor-default select-none group"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors uppercase tracking-wider font-mono">Exam Sheet Monitor</span>
              {/* Optional Indicator badge on mobile */}
              <span className="md:hidden text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700 animate-pulse">
                {isMonitorExpanded ? 'COLOURS' : 'TAP VIEW'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400">{attemptedCount} / {totalQuestions} done</span>
              <div className="md:hidden p-1 bg-slate-900 rounded-lg group-hover:bg-slate-800 transition">
                {isMonitorExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          <div className={`${isMonitorExpanded ? 'block' : 'hidden md:block'} space-y-4 pt-1`}>
            <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const hasAnswered = answers[q.questionNo] !== null;
                const isFlagged = flagged[q.questionNo];

                let blockStyle = "border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-400";
                if (isFlagged) {
                  blockStyle = "bg-amber-500/90 hover:bg-amber-600 text-white border-amber-600";
                } else if (hasAnswered) {
                  blockStyle = "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700";
                }

                return (
                  <button
                    key={q.questionNo}
                    onClick={() => {
                      setCurrentIdx(idx);
                      // Auto-hide the sheet monitor on mobile after a question selection click
                      setIsMonitorExpanded(false);
                    }}
                    className={`w-10 h-10 rounded-xl border text-xs font-bold font-mono focus:outline-none transition-all flex items-center justify-center cursor-pointer ${blockStyle} ${
                      isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-md transform scale-105' : ''
                    }`}
                    title={`Question ${q.questionNo}`}
                  >
                    {q.questionNo}
                  </button>
                );
              })}
            </div>

            {/* Color Indicators Legends */}
            <div className="space-y-2 pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-700"></span>
                <span>Attempted / Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-600"></span>
                <span>Marked for Review / Flagged</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-700"></span>
                <span>Unattempted / Standard</span>
              </div>
            </div>
          </div>
        </section>

        {/* Active Question pane - holds larger screen ratio */}
        <section className="space-y-6 lg:col-span-9">
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl " id="current-question-node">
            
            {/* Header of card */}
            <div className="p-4 bg-slate-920 border-b border-slate-800 rounded-t-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                Item {currentIdx + 1} of {totalQuestions}
              </span>
              <button
                onClick={handleToggleFlag}
                className={`p-1 px-2.5 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                  flagged[currentQuestion.questionNo]
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/5'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                {flagged[currentQuestion.questionNo] ? 'Flagged for Review' : 'Mark for Review'}
              </button>
            </div>

            {/* Question Text block */}
            <div className="p-5 sm:p-6 md:p-8">
              <h3 className="text-base sm:text-lg md:text-xl font-bold font-display text-white leading-relaxed mb-6 whitespace-pre-line">
                {currentQuestion.question}
              </h3>

              {/* Question Image if present */}
              {currentQuestion.questionImage && (
                <div className="mb-6 max-w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 p-2 flex justify-center">
                  <img 
                    src={currentQuestion.questionImage} 
                    alt={`Question ${currentQuestion.questionNo}`} 
                    className="max-h-[350px] object-contain rounded-lg" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Options lists selection */}
              <div className="space-y-3">
                {[
                  { key: 'A', text: currentQuestion.optionA },
                  { key: 'B', text: currentQuestion.optionB },
                  { key: 'C', text: currentQuestion.optionC },
                  { key: 'D', text: currentQuestion.optionD },
                  ...(currentQuestion.optionE ? [{ key: 'E', text: currentQuestion.optionE }] : []),
                ].map((opt) => {
                  const isSelected = answers[currentQuestion.questionNo] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key as any)}
                      className={`w-full p-3.5 sm:p-4 rounded-xl text-left border flex items-center justify-between text-xs sm:text-sm transition-all focus:outline-none cursor-pointer group ${
                        isSelected
                          ? 'bg-emerald-600/15 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-xs font-bold font-mono flex items-center justify-center flex-shrink-0 transition ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-600 text-slate-955 font-black'
                            : 'bg-slate-950 border-slate-850 group-hover:border-slate-600 text-slate-400'
                        }`}>
                          {opt.key}
                        </span>
                        <span className="leading-relaxed font-semibold">{opt.text}</span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hint overlay panel */}
            <div className="p-3 bg-slate-920/60 border-t border-slate-800/80 flex justify-center items-center rounded-b-2xl">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase text-center select-none">
                Exam platform screenshot & focus deviation security protocol is active
              </span>
            </div>
          </div>

          {/* Bottom sequential routing keys (Clear Selection positioned exactly between Previous and Next) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-5 py-2.5 border border-slate-800 hover:border-slate-600 hover:bg-slate-850 disabled:bg-slate-900/40 bg-slate-955 text-xs font-semibold rounded-xl text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <button
              type="button"
              onClick={handleClearOption}
              disabled={answers[currentQuestion.questionNo] === null}
              className="px-5 py-2.5 border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-25 disabled:border-slate-900 disabled:text-slate-600 disabled:bg-slate-950/20 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              Clear Selection
            </button>

            {currentIdx === totalQuestions - 1 ? (
              <button
                onClick={() => setIsConfirmingSubmit(true)}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                Submit Exam <CheckSquare className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-950 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Save & Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Confirmation Submit Overlay and Blur Warning modals */}
      <AnimatePresence>
        {isConfirmingSubmit && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsConfirmingSubmit(false)}></div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 z-10 shadow-2xl relative"
            >
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckSquare className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-display">Are you ready to submit your exam?</h3>
                  <p className="text-xs text-slate-400">Please verify you have answered all questions carefully.</p>
                </div>

                {/* Score breakdown indicator */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900 rounded-xl my-4 text-xs font-mono text-center">
                  <div className="p-2 border-r border-slate-800">
                    <span className="block text-slate-400">Attempted</span>
                    <span className="text-base font-bold text-emerald-400">{attemptedCount}</span>
                  </div>
                  <div className="p-2">
                    <span className="block text-slate-400">Skipped/Left</span>
                    <span className={`text-base font-bold ${unattemptedCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>{unattemptedCount}</span>
                  </div>
                </div>

                {unattemptedCount > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase font-mono rounded-lg flex items-center justify-center gap-1.5 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> Warning: You have unanswered questions!
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingSubmit(false)}
                    className="flex-1 py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-350 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Resume Test
                  </button>
                  <button
                    type="button"
                    onClick={handleForceSubmit}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-955 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Yes, Submit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isFocusLossConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsFocusLossConfirm(false)}></div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border-2 border-rose-500 rounded-3xl w-full max-w-md p-6 z-10 shadow-2xl relative shadow-rose-500/10"
            >
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-rose-550/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto animate-bounce">
                  <AlertCircle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white font-display">Screen Focus Lost!</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    You shifted to another tab/window or minimized the screen during live exam time. This activity violates integrity rules.
                  </p>
                  <p className="text-sm font-bold text-rose-400 mt-2">
                    Do you want to submit your exam?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFocusLossConfirm(false)}
                    className="flex-1 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    No (Resume Exam)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFocusLossConfirm(false);
                      handleForceSubmit();
                    }}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Yes (Submit Exam)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
