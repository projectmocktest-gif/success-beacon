import React, { useState } from 'react';
import { TestResult, Question } from '../types';
import { 
  Award, Clock, CheckCircle2, XCircle, HelpCircle, ArrowLeft, RotateCcw, 
  BookOpen, Compass, Check, Sparkles, Filter, ChevronRight, MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';

interface ResultDetailsProps {
  result: TestResult;
  questions: Question[];
  positiveMarking: number;
  negativeMarking: number;
  onBackToDashboard: () => void;
  onRetake: () => void;
}

export default function ResultDetails({
  result,
  questions,
  positiveMarking,
  negativeMarking,
  onBackToDashboard,
  onRetake,
}: ResultDetailsProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

  // Filtered list
  const filteredQuestions = questions.filter((q) => {
    const studentAns = result.answers[q.questionNo];
    const isAnswered = studentAns !== null;
    const isCorrect = studentAns === q.correctAnswer;

    if (filterMode === 'correct') return isAnswered && isCorrect;
    if (filterMode === 'incorrect') return isAnswered && !isCorrect;
    if (filterMode === 'skipped') return !isAnswered;
    return true; // all
  });

  // Accurate time spent format
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}m ${remaining}s`;
  };

  // Score circular gauge percent
  const scorePercent = Math.max(0, Math.min(100, (result.score / result.maxScore) * 100));

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16" id="result-page-viewport">
      
      {/* Upper navigation header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
          
          <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
            Exam graded scorecard
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Graded scoreboard panel */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-3xl -z-0"></div>
          
          <div className="space-y-4 max-w-md text-center md:text-left z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full text-xs font-bold text-emerald-400 tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5" /> TEST SUMMARY BOARD
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight text-white font-display">
              {result.testName}
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              Assessment finished. Check detailed analysis below of wrong responses to verify correct answers, scoring penalties, and teacher sheet explanations.
            </p>
            
            {/* KPI statistics list horizontal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/20 rounded-2xl p-3 border border-slate-800/60 mt-3 text-center sm:text-left">
              <div className="p-1 space-y-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase font-mono tracking-wider block">Time Spent</span>
                <span className="text-xs font-bold text-white font-mono flex items-center justify-center sm:justify-start gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" /> {formatTime(result.spentTime)}
                </span>
              </div>
              <div className="p-1 space-y-0.5 border-l border-slate-800">
                <span className="text-[9px] text-slate-400 font-bold uppercase font-mono tracking-wider block">Completed</span>
                <span className="text-xs font-bold text-white font-mono flex items-center justify-center sm:justify-start gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {result.attempted} / {result.totalQuestions}
                </span>
              </div>
              <div className="p-1 space-y-0.5 border-l border-slate-800">
                <span className="text-[9px] text-slate-400 font-bold uppercase font-mono tracking-wider block">Accuracy</span>
                <span className="text-xs font-bold text-white font-mono flex items-center justify-center sm:justify-start gap-1">
                  <Award className="w-3 h-3 text-emerald-400" /> {result.accuracy}%
                </span>
              </div>
              <div className="p-1 space-y-0.5 border-l border-slate-800">
                <span className="text-[9px] text-slate-400 font-bold uppercase font-mono tracking-wider block">Penalties</span>
                <span className="text-xs font-bold text-rose-400 font-mono">
                  -{result.incorrect * negativeMarking} pts
                </span>
              </div>
            </div>
          </div>

          {/* Large dynamic Circular Ring Score indicator */}
          <div className="relative flex-shrink-0 flex items-center justify-center z-10 w-44 h-44 bg-slate-950/40 rounded-full border border-slate-800/80 p-1">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="74"
                stroke="#1e293b"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="88"
                cy="88"
                r="74"
                stroke="#10b981"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={465}
                strokeDashoffset={465 - (465 * scorePercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center space-y-0.5">
              <span className="block text-2xl font-black text-white font-mono tracking-tight">
                {result.score.toFixed(2)}
              </span>
              <span className="block text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                out of {result.maxScore}
              </span>
            </div>
          </div>
        </section>

        {/* Small detail count panel card Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[9px] text-slate-450 uppercase font-mono font-bold">Correct</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {result.correct} <span className="text-xs text-slate-400 font-medium">/{result.totalQuestions}</span>
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[9px] text-slate-455 uppercase font-mono font-bold">Wrong</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {result.incorrect} <span className="text-xs text-slate-400 font-medium">/{result.totalQuestions}</span>
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[9px] text-slate-460 uppercase font-mono font-bold">Skipped</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {result.unattempted} <span className="text-xs text-slate-400 font-medium">/{result.totalQuestions}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Filters panel segment */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl items-center justify-between text-xs font-semibold overflow-x-auto gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-2 rounded-lg text-xs leading-none transition-all cursor-pointer ${
                filterMode === 'all' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Questions ({result.totalQuestions})
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-2 rounded-lg text-xs leading-none transition-all cursor-pointer ${
                filterMode === 'correct' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Correct ({result.correct})
            </button>
            <button
              onClick={() => setFilterMode('incorrect')}
              className={`px-3 py-2 rounded-lg text-xs leading-none transition-all cursor-pointer ${
                filterMode === 'incorrect' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Incorrect ({result.incorrect})
            </button>
            <button
              onClick={() => setFilterMode('skipped')}
              className={`px-3 py-2 rounded-lg text-xs leading-none transition-all cursor-pointer ${
                filterMode === 'skipped' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Skipped ({result.unattempted})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 pr-4 text-slate-400 font-mono text-[10px]">
            <Filter className="w-3 h-3" /> Filters active
          </div>
        </div>

        {/* Detailed questions map layout */}
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 bg-white border border-slate-150 rounded-2xl text-center text-slate-400 text-sm italic">
              No questions matched the active filter category.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const studentAns = result.answers[q.questionNo];
              const isAnswered = studentAns !== null;
              const isCorrect = studentAns === q.correctAnswer;

              return (
                <div 
                  key={q.questionNo}
                  className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
                >
                  {/* Item Index Header Status bar */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Question No. {q.questionNo}
                    </span>

                    {/* Graded indicators */}
                    <div className="flex items-center gap-2">
                      {!isAnswered ? (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-bold font-mono uppercase">
                          Skipped (0.0 pts)
                        </span>
                      ) : isCorrect ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold font-mono uppercase flex items-center gap-1">
                          Correct (+{positiveMarking} pts)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold font-mono uppercase flex items-center gap-1">
                          Incorrect (-{negativeMarking} penalty)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question description text */}
                  <p className="text-base font-bold text-slate-800 leading-relaxed font-display whitespace-pre-line">
                    {q.question}
                  </p>

                  {/* Question Image if present */}
                  {q.questionImage && (
                    <div className="mt-3 max-w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex justify-center">
                      <img 
                        src={q.questionImage} 
                        alt={`Question ${q.questionNo}`} 
                        className="max-h-[300px] object-contain rounded-lg" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Colored responses buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { key: 'A', text: q.optionA },
                      { key: 'B', text: q.optionB },
                      { key: 'C', text: q.optionC },
                      { key: 'D', text: q.optionD },
                      ...(q.optionE ? [{ key: 'E', text: q.optionE }] : []),
                    ].map((opt) => {
                      const optKey = opt.key as 'A' | 'B' | 'C' | 'D' | 'E';
                      const isStudentSelected = studentAns === optKey;
                      const isCorrectOpt = q.correctAnswer === optKey;

                      let style = "bg-slate-50 border-slate-200 text-slate-700";
                      let badgeText = '';

                      if (isCorrectOpt) {
                        style = "bg-emerald-50/70 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500";
                        if (isStudentSelected) {
                          badgeText = 'Correct Choice';
                        } else {
                          badgeText = 'Correct Answer';
                        }
                      } else if (isStudentSelected) {
                        style = "bg-rose-50/70 border-rose-400 text-rose-900 font-semibold ring-1 ring-rose-350";
                        badgeText = 'Your Answer';
                      }

                      return (
                        <div 
                          key={opt.key}
                          className={`p-3 border rounded-xl flex items-center justify-between text-xs leading-relaxed transition ${style}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded text-[10px] font-bold font-mono flex items-center justify-center flex-shrink-0 border ${
                              isCorrectOpt 
                                ? 'bg-emerald-500 border-emerald-600 text-slate-950 font-black' 
                                : isStudentSelected 
                                  ? 'bg-rose-500 border-rose-600 text-white' 
                                  : 'bg-slate-200 text-slate-500 border-slate-300'
                            }`}>
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>

                          {badgeText && (
                            <span className={`text-[8px] font-black uppercase tracking-wider font-mono rounded px-1.5 py-0.5 select-none ${
                              isCorrectOpt 
                                ? 'bg-emerald-500 text-slate-950 font-extrabold' 
                                : 'bg-rose-500 text-white'
                            }`}>
                              {badgeText}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Spreadsheet explanation Box card */}
                  {(q.explanation || q.explanationImage) && (
                    <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/30 text-indigo-950 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-850 font-display">
                        <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        Explanation Sheet Details:
                      </div>
                      {q.explanation && (
                        <p className="text-xs sm:text-sm leading-relaxed text-indigo-900 italic font-medium pl-5 whitespace-pre-line">
                          "{q.explanation}"
                        </p>
                      )}
                      {q.explanationImage && (
                        <div className="mt-2 max-w-full rounded-lg overflow-hidden border border-indigo-100 bg-white p-1.5 flex justify-center pl-5">
                          <img 
                            src={q.explanationImage} 
                            alt={`Explanation ${q.questionNo}`} 
                            className="max-h-[250px] object-contain rounded" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Action button options */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
          <button
            onClick={onBackToDashboard}
            className="flex-1 py-3 border border-slate-200 bg-white hover:border-slate-800 text-slate-800 hover:bg-slate-50 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            ← Return to Dashboard
          </button>
          <button
            onClick={onRetake}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-805 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4" /> Retake This Exam Module
          </button>
        </div>

      </main>
    </div>
  );
}
