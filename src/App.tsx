/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Student, ClassTest, MockTest, JobNotification, LiveClass, Question, TestResult, UserResponse, VideoLecture, HomeWork, JudgeYourself } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TestEngine from './components/TestEngine';
import ResultDetails from './components/ResultDetails';
import { AlertCircle, Loader, RefreshCw, Compass, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classTests, setClassTests] = useState<ClassTest[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [homeworks, setHomeworks] = useState<HomeWork[]>([]);
  const [judgeYourself, setJudgeYourself] = useState<JudgeYourself[]>([]);
  const [jobNotifications, setJobNotifications] = useState<JobNotification[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [videoLectures, setVideoLectures] = useState<VideoLecture[]>([]);
  
  // App routing and student session state
  const [student, setStudent] = useState<Student | null>(null);
  const [pastResults, setPastResults] = useState<TestResult[]>([]);
  const [activeExam, setActiveExam] = useState<{
    name: string;
    questions: Question[];
    durationMinutes: number;
    link: string;
    positiveMarking: number;
    negativeMarking: number;
    language?: string;
  } | null>(null);
  
  const [activeResult, setActiveResult] = useState<TestResult | null>(null);

  // States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTestLoading, setIsTestLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Fetch spreadsheet data on mounted
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Sync session from localStorage
  useEffect(() => {
    if (students.length > 0) {
      const savedStudentId = localStorage.getItem('success-beacon-student-id');
      if (savedStudentId) {
        const matching = students.find(s => s.slNo === parseInt(savedStudentId));
        if (matching && matching.active) {
          handleStudentLogin(matching);
        } else {
          localStorage.removeItem('success-beacon-student-id');
        }
      }
    }
  }, [students]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorText(null);
    try {
      const response = await fetch('/api/dashboard-data');
      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }
      const data = await response.json();
      setStudents(data.students || []);
      setClassTests(data.classTests || []);
      setMockTests(data.mockTests || []);
      setHomeworks(data.homeworks || []);
      setJudgeYourself(data.judgeYourself || []);
      setJobNotifications(data.jobNotifications || []);
      setLiveClasses(data.liveClasses || []);
      setVideoLectures(data.videoLectures || []);
    } catch (e: any) {
      console.error('Failed to parse general spreadsheet details:', e);
      setErrorText('Check connection, or ensure the student database spreadsheet columns are valid and public.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = (loggedInStudent: Student) => {
    setStudent(loggedInStudent);
    localStorage.setItem('success-beacon-student-id', loggedInStudent.slNo.toString());
    
    // Fetch past score history specific to this student
    const storageKey = `beacon-results-${loggedInStudent.slNo}`;
    const historical = localStorage.getItem(storageKey);
    if (historical) {
      try {
        setPastResults(JSON.parse(historical));
      } catch (err) {
        setPastResults([]);
      }
    } else {
      setPastResults([]);
    }
  };

  const handleLogout = () => {
    setStudent(null);
    setPastResults([]);
    setActiveExam(null);
    setActiveResult(null);
    localStorage.removeItem('success-beacon-student-id');
  };

  const handleStartExam = async (
    sheetUrl: string, 
    title: string, 
    durationMinutes: number,
    positiveMarking: number,
    negativeMarking: number,
    language?: string
  ) => {
    setIsTestLoading(true);
    setErrorText(null);
    try {
      const response = await fetch(`/api/fetch-test-questions?sheetUrl=${encodeURIComponent(sheetUrl)}&language=${encodeURIComponent(language || '')}`);
      if (!response.ok) {
        throw new Error(`Host error status: ${response.status}`);
      }
      const questionsData: Question[] = await response.json();
      if (!questionsData || questionsData.length === 0) {
        throw new Error(`The test question list appears empty or missing necessary columns. Check columns: Question, Correct Answer, Explanation.`);
      }
      setActiveExam({
        name: title,
        questions: questionsData,
        durationMinutes,
        link: sheetUrl,
        positiveMarking,
        negativeMarking,
        language,
      });
    } catch (e: any) {
      console.error(e);
      alert(`Could not open assessment questions: ${e.message}`);
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleSubmitExamResult = (
    answers: { [key: number]: 'A' | 'B' | 'C' | 'D' | 'E' | null },
    spentTimeSeconds: number
  ) => {
    if (!activeExam || !student) return;

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const userResponses: UserResponse[] = activeExam.questions.map((q) => {
      const selected = answers[q.questionNo];
      const isAnswered = selected !== null;
      let isCorrect = false;
      let earnedMarks = 0;

      if (!isAnswered) {
        unattemptedCount++;
      } else if (selected === q.correctAnswer) {
        isCorrect = true;
        correctCount++;
        earnedMarks = activeExam.positiveMarking;
      } else {
        incorrectCount++;
        earnedMarks = -activeExam.negativeMarking;
      }

      return {
        questionNo: q.questionNo,
        selectedOption: selected,
        isCorrect,
        earnedMarks,
      };
    });

    const finalScore = userResponses.reduce((sum, res) => sum + res.earnedMarks, 0);
    const maxScoreVal = activeExam.questions.length * activeExam.positiveMarking;
    
    // accuracy ratio based on attempted questions
    const attemptedCount = correctCount + incorrectCount;
    const accuracyValue = attemptedCount > 0 
      ? Math.round((correctCount / attemptedCount) * 100) 
      : 0;

    const newResult: TestResult = {
      testName: activeExam.name,
      spentTime: spentTimeSeconds,
      totalQuestions: activeExam.questions.length,
      attempted: attemptedCount,
      unattempted: unattemptedCount,
      correct: correctCount,
      incorrect: incorrectCount,
      score: Number(finalScore),
      maxScore: maxScoreVal,
      accuracy: accuracyValue,
      answers,
      gradedResponses: userResponses,
      timestamp: Date.now(),
      questions: activeExam.questions,
      positiveMarking: activeExam.positiveMarking,
      negativeMarking: activeExam.negativeMarking,
    };

    // Save result matching active student index to localStorage
    const savedResults = [newResult, ...pastResults];
    setPastResults(savedResults);
    
    const storageKey = `beacon-results-${student.slNo}`;
    localStorage.setItem(storageKey, JSON.stringify(savedResults));

    // Move to view results webpage automatically!
    setActiveExam(null);
    setActiveResult(newResult);
  };

  // Spinner loader layout
  if (isLoading || isTestLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="space-y-4">
          <Loader className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-white text-base font-bold font-display tracking-wide uppercase">
              {isTestLoading ? 'Loading Assessment...' : 'Connecting Spreadsheet Portal...'}
            </h2>
            <p className="text-xs text-slate-400">Please wait. Processing sheets rows...</p>
          </div>
        </div>
      </div>
    );
  }

  // General network/validation error UI
  if (errorText) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center font-sans">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-white text-lg font-bold font-display">Spreadsheet Integration Issue</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {errorText}
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-705 text-white bg-emerald-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reconnect Database
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="portal-frame-node" className="font-sans">
      <AnimatePresence mode="wait">
        
        {/* Test taking Screen Router */}
        {activeExam && student ? (
          <motion.div
            key="test-taking-engine-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <TestEngine
              testName={activeExam.name}
              questions={activeExam.questions}
              durationMinutes={activeExam.durationMinutes}
              positiveMarking={activeExam.positiveMarking}
              negativeMarking={activeExam.negativeMarking}
              onCancel={() => setActiveExam(null)}
              onSubmit={handleSubmitExamResult}
            />
          </motion.div>
        
        /* Graded scorecard webpage detailed analysis */
        ) : activeResult && student ? (
          <motion.div
            key="analysis-result-route"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full h-full"
          >
            <ResultDetails
              result={activeResult}
              // Find matching questions or fallback directly
              questions={activeResult.questions || activeResult.gradedResponses.map((res) => {
                const found = activeExam?.questions?.find(q => q.questionNo === res.questionNo);
                if (found) return found;
                // Assemble mock object if they clicked review directly from dashboard list later in pastResults
                return {
                  questionNo: res.questionNo,
                  question: `Question ${res.questionNo} from ${activeResult.testName}`,
                  optionA: "Option A",
                  optionB: "Option B",
                  optionC: "Option C",
                  optionD: "Option D",
                  correctAnswer: "A",
                  explanation: "Detailed history assessment data. Start exam to refresh options explanations."
                } as Question;
              })}
              positiveMarking={activeResult.positiveMarking !== undefined ? activeResult.positiveMarking : 1.0}
              negativeMarking={activeResult.negativeMarking !== undefined ? activeResult.negativeMarking : 0.25}
              onBackToDashboard={() => setActiveResult(null)}
              // Reset and retake exam route: find mock test link matching result.testName
              onRetake={() => {
                const matchingTest = [...classTests, ...mockTests, ...homeworks, ...judgeYourself].find(t => t.testName === activeResult.testName);
                if (matchingTest) {
                  setActiveResult(null);
                  handleStartExam(
                    matchingTest.link, 
                    matchingTest.testName, 
                    matchingTest.timeLimit, 
                    matchingTest.positiveMarking, 
                    matchingTest.negativeMarking
                  );
                } else {
                  alert("Could not load original assessment link. Return to Class Tests list manually.");
                  setActiveResult(null);
                }
              }}
            />
          </motion.div>

        /* Standard dashboard student route */
        ) : student ? (
          <motion.div
            key="dashboard-home-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Dashboard
              student={student}
              classTests={classTests}
              mockTests={mockTests}
              homeworks={homeworks}
              judgeYourself={judgeYourself}
              jobNotifications={jobNotifications}
              liveClasses={liveClasses}
              videoLectures={videoLectures}
              pastResults={pastResults}
              onStartTest={(link, title, duration, pos, neg, lang) => handleStartExam(link, title, duration, pos, neg, lang)}
              onViewPastResult={async (pastRes) => {
                // If the past result already has questions, display it immediately
                if (pastRes.questions && pastRes.questions.length > 0) {
                  setActiveResult(pastRes);
                  return;
                }

                // Try to find the matching test URL in class tests or mock tests list to fetch on the fly
                const matchingTest = [...classTests, ...mockTests, ...homeworks, ...judgeYourself].find(t => t.testName === pastRes.testName);
                if (matchingTest) {
                  setIsTestLoading(true);
                  try {
                    const response = await fetch(`/api/fetch-test-questions?sheetUrl=${encodeURIComponent(matchingTest.link)}`);
                    if (response.ok) {
                      const questionsData: Question[] = await response.json();
                      if (questionsData && questionsData.length > 0) {
                        const enrichedResult: TestResult = {
                          ...pastRes,
                          questions: questionsData,
                          positiveMarking: matchingTest.positiveMarking,
                          negativeMarking: matchingTest.negativeMarking,
                        };
                        
                        // Update in local state pastResults list
                        setPastResults(prev => prev.map(r => r.timestamp === pastRes.timestamp ? enrichedResult : r));
                        
                        // Save the enriched result to localStorage for future zero-network instant loads
                        const storageKey = `beacon-results-${student.slNo}`;
                        const historical = localStorage.getItem(storageKey);
                        if (historical) {
                          try {
                            const parsed = JSON.parse(historical) as TestResult[];
                            const updated = parsed.map(r => r.timestamp === pastRes.timestamp ? enrichedResult : r);
                            localStorage.setItem(storageKey, JSON.stringify(updated));
                          } catch (err) {
                            console.error("Historical results parse error during enrichment: ", err);
                          }
                        }
                        
                        setActiveResult(enrichedResult);
                        return;
                      }
                    }
                  } catch (err) {
                    console.error("Error fetching past test questions on the fly", err);
                  } finally {
                    setIsTestLoading(false);
                  }
                }

                // Fallback if sheet not found or failed to fetch
                setActiveResult(pastRes);
              }}
              onLogout={handleLogout}
            />
          </motion.div>

        /* Initial login screen router */
        ) : (
          <motion.div
            key="login-screen-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Login
              students={students}
              onLoginSuccess={handleStudentLogin}
              isLoading={isLoading}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
