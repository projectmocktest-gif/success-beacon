import React, { useState } from 'react';
import { Student, ClassTest, MockTest, JobNotification, LiveClass, TestResult, VideoLecture, HomeWork, JudgeYourself } from '../types';
import { 
  User, LogOut, Award, ClipboardList, Briefcase, Calendar, CheckCircle, 
  MapPin, Clock, ArrowUpRight, Megaphone, CheckSquare, Sparkles, TrendingUp, ChevronRight,
  Copy, ExternalLink, AlertTriangle, X, Video, Search, Filter, Play, Volume2, BookOpen, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SuccessBeaconLogo from './SuccessBeaconLogo';

// Helper to extract video ID from standard YouTube links
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
  } catch (e) {
    console.error("Failed to parse YouTube ID: " + url, e);
  }
  return null;
}

// Helper to convert YouTube url into a playable embed url
function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

interface DashboardProps {
  student: Student;
  classTests: ClassTest[];
  mockTests: MockTest[];
  homeworks?: HomeWork[];
  judgeYourself?: JudgeYourself[];
  jobNotifications: JobNotification[];
  liveClasses: LiveClass[];
  videoLectures?: VideoLecture[]; // Optional to protect legacy compiles
  pastResults: TestResult[];
  onStartTest: (testUrl: string, title: string, durationMin: number, positive: number, negative: number, language: string) => void;
  onViewPastResult: (result: TestResult) => void;
  onLogout: () => void;
}

export default function Dashboard({
  student,
  classTests,
  mockTests,
  homeworks = [],
  judgeYourself = [],
  jobNotifications,
  liveClasses,
  videoLectures = [],
  pastResults,
  onStartTest,
  onViewPastResult,
  onLogout,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'mock' | 'jobs' | 'live' | 'results' | 'video'>('mock');
  const [mockSubTab, setMockSubTab] = useState<'class' | 'homework' | 'mock' | 'judge'>('class');
  const [selectedJob, setSelectedJob] = useState<JobNotification | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Video Lecture related states
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>('');
  const [videoSelectedSubject, setVideoSelectedSubject] = useState<string>('All');
  const [selectedVideoForPlay, setSelectedVideoForPlay] = useState<VideoLecture | null>(null);

  // Language Selection dialog states
  const [selectedTestToLaunch, setSelectedTestToLaunch] = useState<{
    link: string;
    testName: string;
    timeLimit: number;
    positiveMarking: number;
    negativeMarking: number;
  } | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Bengali' | 'Hindi'>('English');
  const [isReadyToBegin, setIsReadyToBegin] = useState<boolean>(false);

  // Test Filter and Auto-Suggested Search states
  const [testFilterSubject, setTestFilterSubject] = useState<string>('All');
  const [testSearchQuery, setTestSearchQuery] = useState<string>('');
  const [showTestSuggestions, setShowTestSuggestions] = useState<boolean>(false);

  // Extract unique subjects from videoLectures to display as filter pills
  const subjectsList = ['All', ...Array.from(new Set(videoLectures.map(v => v.subject))).filter(Boolean)];

  // Filter videoLectures list based on active subject filter and active search text query
  const filteredLectures = videoLectures.filter(item => {
    const matchesSubject = videoSelectedSubject === 'All' || item.subject.toLowerCase() === videoSelectedSubject.toLowerCase();
    const matchesSearch = !videoSearchQuery.trim() || 
      item.topicName.toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(videoSearchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const handleCopyLink = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  // Compute stats
  const totalAttempted = pastResults.length;
  const avgScore = totalAttempted > 0 
    ? (pastResults.reduce((sum, r) => sum + r.score, 0) / totalAttempted).toFixed(2)
    : '0.00';
  const avgAccuracy = totalAttempted > 0
    ? Math.round(pastResults.reduce((sum, r) => sum + r.accuracy, 0) / totalAttempted)
    : 0;

  // Render score history graph (custom visual SVG curve)
  const renderMiniChart = () => {
    if (pastResults.length < 2) {
      return (
        <div className="h-28 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs text-center p-4">
          Complete at least 2 exams to calibrate tracking curves.
        </div>
      );
    }

    const maxScoreVal = Math.max(...pastResults.map(r => r.maxScore), 10);
    const height = 90;
    const width = 280;
    const padding = 15;
    
    // map results to coords
    const points = pastResults.slice(-5).map((r, i) => {
      const x = padding + (i / (Math.min(pastResults.length, 5) - 1)) * (width - padding * 2);
      const ratio = r.score / r.maxScore;
      const y = height - padding - (ratio * (height - padding * 2));
      return { x, y, score: r.score, title: r.testName };
    });

    const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');
    // area path
    const areaPath = `${points[0].x},${height - padding} ` + polylinePath + ` ${points[points.length - 1].x},${height - padding}`;

    return (
      <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Recent Score Trends</span>
          <span className="text-xs text-emerald-600 font-bold font-mono">Active</span>
        </div>
        <div className="relative h-20 w-full" style={{ maxWidth: '300px' }}>
          <svg className="w-full h-fulloverflow-visible" viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <linearGradient id="chart-gradle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2" />

            {/* Gradient area */}
            <polygon points={areaPath} fill="url(#chart-gradle)" />
            {/* Direct Line */}
            <polyline points={polylinePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Verticals and points */}
            {points.map((p, idx) => (
              <g key={idx}>
                <line x1={p.x} y1={height - padding} x2={p.x} y2={p.y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="1,2" />
                <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
              </g>
            ))}
          </svg>
        </div>
        <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400 px-1 mt-1">
          <span>First Attempt</span>
          <span>Latest Attempt ({pastResults[pastResults.length - 1].score.toFixed(1)} pts)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-28 md:pb-12" id="dashboard-viewport">
      {/* Header bar and navigation */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-0.5 bg-slate-950/45 rounded-xl">
              <SuccessBeaconLogo variant="icon" lightMode={true} size={50} />
            </div>
            <div>
              <h1 className="text-base font-bold font-display tracking-tight text-white flex items-center gap-2">
                Success Beacon
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold font-mono leading-none">Student ID: SL{student.slNo.toString().padStart(3, '0')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="block text-xs font-bold text-slate-200">{student.name}</span>
              <span className="block text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Batch: {student.batchName}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 rounded-xl text-slate-300 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Logout"
              id="logout-button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6">
        {/* Welcome message / Fee pending alert */}
        {student.message && student.message !== 'None' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase font-mono tracking-wider">Broadcast notification:</span>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">
                "{student.message}"
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Profile Card and Mini Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500 rounded-full opacity-10 blur-3xl -z-0"></div>
            
            <div className="space-y-2 z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold text-emerald-300 tracking-wider uppercase font-mono mb-2">
                <Sparkles className="w-3 h-3" /> Dashboard
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white font-display">
                Welcome back, {student.name}!
              </h2>
              <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
                Complete mock chapters and diagnostic exams to review customized grading, time tracking metrics, and correct answer explanations sheet.
              </p>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 mt-6 z-10 bg-slate-950/20 rounded-xl p-2">
              <div className="text-center sm:text-left">
                <span className="block text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">Exams Taken</span>
                <span className="text-lg font-bold font-display text-white">{totalAttempted}</span>
              </div>
              <div className="text-center sm:text-left border-l border-slate-800 pl-2">
                <span className="block text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">Avg Grade</span>
                <span className="text-lg font-bold font-display text-white">{avgScore} <span className="text-xs text-slate-400 font-medium">pts</span></span>
              </div>
              <div className="text-center sm:text-left border-l border-slate-800 pl-2">
                <span className="block text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">Accuracy</span>
                <span className="text-lg font-bold font-display text-white">{avgAccuracy}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            {renderMiniChart()}
          </div>
        </div>

        {/* Dynamic Category Navigation Wheel Tabs as Small Square Bubbles (Desktop Style) */}
        <div className="hidden md:flex flex-wrap justify-center items-center gap-4 mb-8" id="category-tabs">
          {[
            {
              id: 'mock' as const,
              label: 'Mock Tests',
              icon: CheckSquare,
              badgeCount: mockTests.filter(m => m.active).length,
              badgeColor: 'bg-emerald-500',
              badgeText: '',
              iconColor: 'text-slate-700',
            },
            {
              id: 'video' as const,
              label: 'Video Labs',
              icon: Video,
              badgeCount: videoLectures.length,
              badgeColor: 'bg-red-500',
              badgeText: '',
              iconColor: 'text-red-500',
            },
            {
              id: 'jobs' as const,
              label: 'Job Alerts',
              icon: Briefcase,
              badgeCount: jobNotifications.length,
              badgeColor: 'bg-blue-500',
              badgeText: '',
              iconColor: 'text-blue-500',
            },
            {
              id: 'live' as const,
              label: 'Routine',
              icon: Calendar,
              badgeCount: liveClasses.filter(l => l.active).length > 0 ? 1 : 0,
              badgeColor: 'bg-rose-500',
              badgeText: 'Live',
              iconColor: 'text-violet-500',
            },
            {
              id: 'results' as const,
              label: 'My Grades',
              icon: Award,
              badgeCount: totalAttempted,
              badgeColor: 'bg-slate-500',
              badgeText: '',
              iconColor: 'text-slate-500',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.badgeCount;
            const textBadge = tab.badgeText;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-24 w-24 sm:h-26 sm:w-26 md:h-28 md:w-28 rounded-[24px] p-3 flex flex-col items-center justify-center text-center gap-2 border transition-all duration-300 relative cursor-pointer shadow-sm ${
                  isActive 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105 ring-2 ring-slate-900/10' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Icon className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-white' : tab.iconColor}`} />
                <span className="text-xs font-extrabold leading-tight">{tab.label}</span>
                {count > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 flex h-6 min-w-[24px] px-1.5 text-[10px] font-black leading-none text-white rounded-full items-center justify-center border border-white shadow-sm ${textBadge === 'Live' ? 'bg-rose-500 animate-pulse' : tab.badgeColor}`}>
                    {textBadge || count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Sticky Bottom Navigation (Screenshot-Style) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-150 shadow-[0_-10px_35px_rgba(0,0,0,0.08)] px-4 py-2.5 z-50 flex justify-around items-center gap-1.5 pb-safe-bottom">
          {[
            {
              id: 'mock' as const,
              label: 'Mock Tests',
              icon: CheckSquare,
              badgeCount: mockTests.filter(m => m.active).length,
              badgeColor: 'bg-emerald-500',
              badgeText: '',
              iconColor: 'text-slate-700',
            },
            {
              id: 'video' as const,
              label: 'Video Labs',
              icon: Video,
              badgeCount: videoLectures.length,
              badgeColor: 'bg-red-500',
              badgeText: '',
              iconColor: 'text-red-500',
            },
            {
              id: 'jobs' as const,
              label: 'Job Alerts',
              icon: Briefcase,
              badgeCount: jobNotifications.length,
              badgeColor: 'bg-blue-500',
              badgeText: '',
              iconColor: 'text-blue-500',
            },
            {
              id: 'live' as const,
              label: 'Routine',
              icon: Calendar,
              badgeCount: liveClasses.filter(l => l.active).length > 0 ? 1 : 0,
              badgeColor: 'bg-rose-500',
              badgeText: 'Live',
              iconColor: 'text-violet-500',
            },
            {
              id: 'results' as const,
              label: 'My Grades',
              icon: Award,
              badgeCount: totalAttempted,
              badgeColor: 'bg-slate-500',
              badgeText: '',
              iconColor: 'text-slate-500',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.badgeCount;
            const textBadge = tab.badgeText;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 aspect-square max-w-[65px] rounded-2xl flex flex-col items-center justify-center p-1 text-center gap-1 relative border transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105'
                    : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : tab.iconColor}`} />
                <span className="text-[9px] font-extrabold leading-tight tracking-tight scale-90 origin-center truncate w-full select-none">
                  {tab.label}
                </span>
                {count > 0 && (
                  <span className={`absolute -top-1 -right-1 flex h-4.5 min-w-[18px] px-1 text-[9px] font-black leading-none text-white rounded-full items-center justify-center border border-white shadow-sm ${textBadge === 'Live' ? 'bg-rose-500 animate-pulse font-sans' : tab.badgeColor}`}>
                    {textBadge || count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab contents */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[300px]" id="tab-content-area">
          
          {/* Video Lectures / Labs Tab */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 font-display">Integrated Lecture Theater & Labs</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Access selective chapters, concepts, and doubt-clearing sessions recorded by Success Beacon instructors.
                </p>
              </div>

              {(() => {
                const playingVideo = selectedVideoForPlay || (filteredLectures.length > 0 ? filteredLectures[0] : null);
                const embedUrl = playingVideo ? getYouTubeEmbedUrl(playingVideo.link) : null;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Embedded Player (Left / Top) */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-800 aspect-video relative flex items-center justify-center">
                        {embedUrl ? (
                          <iframe
                            id="youtube-player-iframe"
                            src={embedUrl}
                            title={playingVideo?.topicName || "Lecture Video"}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full absolute inset-0"
                          ></iframe>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                            <Video className="w-12 h-12 text-slate-600 animate-pulse" />
                            <p className="text-sm font-semibold">No Video Selected to Play</p>
                            <p className="text-xs max-w-xs text-slate-500 font-medium">
                              Select any lecture from the checklist table on the side to stream high-definition interactive contents directly.
                            </p>
                          </div>
                        )}
                      </div>

                      {playingVideo && (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md font-mono uppercase tracking-wider">
                              Class Room Player
                            </span>
                            <span className="text-xs text-slate-500 font-bold font-mono">
                              Subject: {playingVideo.subject}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 font-display">
                            Topic: {playingVideo.topicName}
                          </h4>
                          <a
                            href={playingVideo.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline pt-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open on YouTube Website
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Interactive Table with search and subject filters (Right / Bottom) */}
                    <div className="lg:col-span-5 space-y-4 flex flex-col">
                      {/* Search and subject filter pills */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search subjects or topics..."
                            value={videoSearchQuery}
                            onChange={(e) => setVideoSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 font-semibold focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all shadow-sm"
                          />
                          {videoSearchQuery && (
                            <button
                              onClick={() => setVideoSearchQuery('')}
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Subject filters */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-500 font-display uppercase tracking-wider">
                            Filter by Subject:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {subjectsList.map((subj) => (
                              <button
                                key={subj}
                                onClick={() => setVideoSelectedSubject(subj)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer ${
                                  videoSelectedSubject === subj
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                                }`}
                              >
                                {subj}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Lists of lectures inside table card */}
                      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm flex-1 bg-white max-h-[350px] overflow-y-auto">
                        {filteredLectures.length === 0 ? (
                          <div className="py-12 px-4 text-center text-slate-400 text-xs">
                            No matching lecture streams found. Try searching another keyword.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-mono font-bold uppercase tracking-wider text-[10px]">
                                <th className="p-3 pl-4">Topic / Subject</th>
                                <th className="p-3 pr-4 text-right">Playback</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {filteredLectures.map((item, idx) => {
                                const isCurrentPlaying = playingVideo?.link === item.link;
                                const ytId = getYouTubeVideoId(item.link);
                                const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;

                                return (
                                  <tr
                                    key={idx}
                                    onClick={() => setSelectedVideoForPlay(item)}
                                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer group ${
                                      isCurrentPlaying ? 'bg-slate-50/80 font-bold border-l-4 border-slate-900' : ''
                                    }`}
                                  >
                                    <td className="p-3 pl-4 flex items-center gap-3">
                                      {/* Thumbnail compact representation */}
                                      <div className="w-12 h-8 rounded-md bg-slate-900/5 overflow-hidden flex-shrink-0 relative border border-slate-100 flex items-center justify-center">
                                        {thumbUrl ? (
                                          <img
                                            src={thumbUrl}
                                            alt={item.topicName}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <Play className="w-3.5 h-3.5 text-slate-400 font-bold" />
                                        )}
                                        {isCurrentPlaying && (
                                          <div className="absolute inset-0 bg-slate-950/45 flex items-center justify-center">
                                            <Volume2 className="w-4 h-4 text-white animate-pulse" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-800 leading-tight truncate">
                                          {item.topicName}
                                        </div>
                                        <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase tracking-widest text-[#008080] font-mono">
                                          {item.subject}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-3 pr-4 text-right">
                                      <button
                                        type="button"
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer ${
                                          isCurrentPlaying
                                            ? 'bg-slate-900 text-white border-slate-900 border'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 border shadow-sm'
                                        }`}
                                      >
                                        <Play className="w-2.5 h-2.5 fill-current" />
                                        {isCurrentPlaying ? 'Streaming' : 'Play'}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}



          {/* Mock Tests Tab */}
          {activeTab === 'mock' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-display">Integrated Mock Tests & Assignments</h3>
                </div>
              </div>

              {/* Internal Tab Selector matching Google Sheets tabs (Styled Big & Square-shaped) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pb-6 border-b border-slate-105" id="mock-subtabs">
                {[
                  { id: 'class', label: 'Class_test', count: classTests.length, icon: ClipboardList },
                  { id: 'homework', label: 'Home_work', count: homeworks.length, icon: BookOpen },
                  { id: 'mock', label: 'Mock_test', count: mockTests.length, icon: CheckSquare },
                  { id: 'judge', label: 'Judge yourself', count: judgeYourself.length, icon: UserCheck }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = mockSubTab === tab.id;
                  let niceLabel = '';
                  if (tab.id === 'class') niceLabel = 'Class Test';
                  else if (tab.id === 'homework') niceLabel = 'Home Work';
                  else if (tab.id === 'mock') niceLabel = 'Mock Test';
                  else niceLabel = 'Judge Yourself';

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMockSubTab(tab.id as any);
                        setTestFilterSubject('All');
                        setTestSearchQuery('');
                        setShowTestSuggestions(false);
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 relative aspect-square cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105 ring-2 ring-slate-900/10'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
                      }`}
                    >
                      <Icon className={`w-7 h-7 sm:w-9 sm:h-9 mb-1.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                      <span className="text-[10px] sm:text-xs font-bold leading-tight select-none">
                        {niceLabel}
                      </span>
                      {tab.count > 0 && (
                        <span className={`absolute top-2.5 right-2.5 flex h-5 min-w-[20px] px-1 text-[9px] font-black rounded-full items-center justify-center border border-white leading-none ${
                          isActive ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {(() => {
                let originalList: any[] = [];
                let tabLabel = '';
                if (mockSubTab === 'class') {
                  originalList = classTests;
                  tabLabel = 'Class Test';
                } else if (mockSubTab === 'homework') {
                  originalList = homeworks;
                  tabLabel = 'Home Work';
                } else if (mockSubTab === 'mock') {
                  originalList = mockTests;
                  tabLabel = 'Mock Test';
                } else {
                  originalList = judgeYourself;
                  tabLabel = 'Judge Yourself';
                }

                // Dynamically compute subjects lists based on the selected tab list to filter by
                const allSubjectsList = ['All', ...Array.from(new Set(originalList.map(t => t.subject || 'General'))).filter(Boolean)];

                // Gather suggestions for autofill based on testName and subject
                const suggestionsSet = new Set<string>();
                originalList.forEach(t => {
                  if (t.testName) suggestionsSet.add(t.testName.trim());
                  if (t.subject) suggestionsSet.add(t.subject.trim());
                });
                
                const activeSuggestions = Array.from(suggestionsSet).filter(item => 
                  item.toLowerCase().includes(testSearchQuery.toLowerCase()) && 
                  item.toLowerCase() !== testSearchQuery.toLowerCase()
                ).slice(0, 6);

                // Filter the list based on query and subject selection
                const currentFilteredList = originalList.filter((test) => {
                  const subVal = test.subject || 'General';
                  const matchesSub = testFilterSubject === 'All' || subVal.toLowerCase() === testFilterSubject.toLowerCase();
                  
                  const matchesSearch = !testSearchQuery.trim() ||
                    test.testName.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                    subVal.toLowerCase().includes(testSearchQuery.toLowerCase());
                    
                  return matchesSub && matchesSearch;
                });

                if (originalList.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 block text-xs bg-slate-50 border border-slate-100 rounded-2xl">
                      No active entries compiled under &quot;{tabLabel}&quot; tab inside Google Sheets currently.
                    </div>
                  );
                }

                if (currentFilteredList.length === 0) {
                  return (
                    <div className="py-10 text-center text-slate-500 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-6 space-y-3">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">No Assessment Results Match Current Filters</h4>
                        <p className="text-[11px] text-slate-400 mt-1">Try typing a different name or resetting the subject filter selection.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setTestSearchQuery('');
                          setTestFilterSubject('All');
                          setShowTestSuggestions(false);
                        }}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-850 transition"
                      >
                        Reset Search Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Search and Dynamic Subject Filter Panel */}
                    <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl md:flex md:items-center md:justify-between gap-4 space-y-3.5 md:space-y-0 shadow-sm" id="test-search-filter">
                      {/* Left: Auto-suggest Search */}
                      <div className="relative flex-1 max-w-md">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Search {tabLabel}s</span>
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Type topic or subject to autofill..."
                            value={testSearchQuery}
                            onChange={(e) => {
                              setTestSearchQuery(e.target.value);
                              setShowTestSuggestions(true);
                            }}
                            onFocus={() => setShowTestSuggestions(true)}
                            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 focus:border-slate-800 text-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-800/10 shadow-sm"
                          />
                          {testSearchQuery && (
                            <button
                              onClick={() => {
                                setTestSearchQuery('');
                                setShowTestSuggestions(false);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-0.5 animate-fadeIn"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Search Autocomplete / Suggestion Dropdown */}
                        <AnimatePresence>
                          {showTestSuggestions && testSearchQuery.trim() && activeSuggestions.length > 0 && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowTestSuggestions(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-25 max-h-48 overflow-y-auto overflow-hidden divide-y divide-slate-105"
                              >
                                <div className="p-2 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase font-mono px-3 select-none">
                                  Autofill Suggestions
                                </div>
                                {activeSuggestions.map((item, idx) => {
                                  const queryLower = testSearchQuery.toLowerCase();
                                  const idxMatch = item.toLowerCase().indexOf(queryLower);
                                  const beforeMatch = item.slice(0, idxMatch);
                                  const matchText = item.slice(idxMatch, idxMatch + testSearchQuery.length);
                                  const afterMatch = item.slice(idxMatch + testSearchQuery.length);

                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setTestSearchQuery(item);
                                        setShowTestSuggestions(false);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs text-slate-750 hover:bg-slate-50 transition cursor-pointer font-medium flex items-center justify-between"
                                    >
                                      <span>
                                        {beforeMatch}
                                        <span className="font-bold text-slate-900 bg-amber-55 rounded-sm px-0.5">{matchText}</span>
                                        {afterMatch}
                                      </span>
                                      <span className="text-[9px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 font-bold uppercase font-mono select-none">
                                        Autofill
                                      </span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Right: Dynamic Subject selection */}
                      <div className="flex-shrink-0 md:max-w-xs w-full md:w-auto">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Filter by Subject</span>
                        <div className="relative">
                          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <select
                            value={testFilterSubject}
                            onChange={(e) => setTestFilterSubject(e.target.value)}
                            className="w-full md:w-52 pl-9 pr-8 py-2.5 bg-white border border-slate-200 focus:border-slate-800 text-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-800/10 cursor-pointer appearance-none shadow-sm"
                          >
                            <option value="All">All Subjects ({allSubjectsList.length - 1} found)</option>
                            {allSubjectsList.filter(s => s !== "All").map((sub, idx) => (
                              <option key={idx} value={sub}>{sub}</option>
                            ))}
                          </select>
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentFilteredList.map((test, index) => {
                      const isTaken = pastResults.some(r => r.testName === test.testName);
                      const pastBest = pastResults.filter(r => r.testName === test.testName).sort((a,b)=>b.score - a.score)[0];
                      const limit = test.timeLimit || 15;
                      const pos = test.positiveMarking !== undefined ? test.positiveMarking : 1.0;
                      const neg = test.negativeMarking !== undefined ? test.negativeMarking : 0.25;

                      return (
                        <div 
                          key={index}
                          className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                            test.active 
                              ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md' 
                              : 'bg-slate-50/50 border-slate-100 opacity-60'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold font-mono tracking-wider rounded-full uppercase">
                                {test.subject || 'General'}
                              </span>
                              <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${
                                test.active 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-slate-300 text-slate-600'
                              }`}>
                                {test.active ? 'Active' : 'Disabled'}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-base font-bold text-slate-800 leading-tight font-display">{test.testName}</h4>
                              <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> {limit} min
                                </span>
                                <span>•</span>
                                <span>Marks: +{pos} / -{neg}</span>
                              </div>
                            </div>
                          </div>

                          {/* Best score indicator */}
                          {isTaken && pastBest && (
                            <div className="mt-4 p-2.5 bg-slate-50 rounded-lg text-xs leading-none flex justify-between items-center text-slate-500 font-mono">
                              <span>High Score:</span>
                              <span className="font-bold text-slate-800">
                                {pastBest.score.toFixed(1)} / {pastBest.maxScore}
                              </span>
                            </div>
                          )}

                          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                            {test.active ? (
                              <button
                                onClick={() => {
                                  setSelectedTestToLaunch({
                                    link: test.link,
                                    testName: test.testName,
                                    timeLimit: limit,
                                    positiveMarking: pos,
                                    negativeMarking: neg
                                  });
                                  setSelectedLanguage('English');
                                  setIsReadyToBegin(false);
                                }}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                              >
                                Launch {tabLabel}
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Closed</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            </div>
          )}

          {/* Job Notifications Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 font-display">Active Government & Private Job Work Alerts</h3>
              </div>

              {jobNotifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 block text-sm">
                  No career alerts matching batch eligibility reported.
                </div>
              ) : (
                <div className="space-y-4">
                  {jobNotifications.map((job, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedJob(job)}
                      className="p-5 border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group hover:shadow-sm"
                    >
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 leading-tight font-display transition-colors">{job.title}</h4>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1"> Age Limit: <span className="text-slate-700">{job.age || "N/A"}</span></span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1"> Qualification: <span className="text-slate-700">{job.qualification || "N/A"}</span></span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1 text-rose-600"> Last Date: <span>{job.lastDate || "N/A"}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJob(job);
                          }}
                          className="px-4 py-2 bg-slate-900 group-hover:bg-emerald-600 text-white group-hover:text-slate-950 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-all"
                        >
                          View Details
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Classes Tab */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 font-display">Daily Class Routine & Live Mentoring Rooms</h3>
                <p className="text-xs text-slate-400 mt-1">Direct video lecture accesses from your learning dashboard</p>
              </div>

              {liveClasses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 block text-sm">
                  No classes scheduled on the spreadsheet GID routine block.
                </div>
              ) : (
                <div className="space-y-4">
                  {liveClasses.map((cl, idx) => (
                    <div 
                      key={idx}
                      className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        cl.active 
                          ? 'bg-slate-950 text-white border-slate-900 shadow-lg shadow-slate-900/10' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 px-2 text-[9px] font-bold font-mono tracking-wider uppercase rounded ${
                            cl.active 
                              ? 'bg-rose-600 text-white animate-pulse' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {cl.active ? '● Scheduled Live' : 'Archive / Inactive'}
                          </span>
                          <span className="text-xs font-mono opacity-80">{cl.date} at {cl.time}</span>
                        </div>

                        <h4 className="text-base font-bold font-display leading-tight">{cl.subject} Lecture Module</h4>
                      </div>

                      {cl.active && cl.classLink && cl.classLink !== '-' ? (
                        <a
                          href={cl.classLink}
                          target="_blank"
                          rel="noreferrer referrer"
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold text-center float-right flex items-center justify-center gap-1.5 transition"
                        >
                          Enter Meeting Room
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic px-3 py-1.5 border border-slate-100 rounded-lg bg-slate-50 text-center select-none">
                          No links published yet
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Past Results / Seizure (See Your) Result List */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 font-display">Diagnotic Assessments Scorecards</h3>
                <p className="text-xs text-slate-400 mt-1">Select any row below to review your answers, grades, and spreadsheet descriptions</p>
              </div>

              {pastResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 block text-sm">
                  You have not submitted any test modules yet. Finished exams will display here with exact performance grades and correctness ratios.
                </div>
              ) : (
                <div className="space-y-3">
                  {pastResults.map((result, idx) => (
                    <div 
                      key={idx}
                      onClick={() => onViewPastResult(result)}
                      className="p-4 border border-slate-100 hover:border-slate-300 rounded-xl bg-slate-50/20 hover:bg-white cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 leading-tight font-display">{result.testName}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold font-mono">
                          Completed on {new Date(result.timestamp).toLocaleDateString()} • Spend time: {Math.floor(result.spentTime / 60)}m {result.spentTime % 60}s
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="block text-sm font-extrabold text-slate-900 font-mono">
                            {result.score.toFixed(2)} <span className="text-[10px] text-slate-400 font-medium">/ {result.maxScore}</span>
                          </span>
                          <span className="block text-[9px] text-emerald-600 font-bold uppercase font-mono">
                            Accuracy {result.accuracy}%
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Animated Security & Detail Drawer Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden z-10 border border-slate-100 flex flex-col"
            >
              {/* Close Button top corner */}
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Cover Header */}
              <div className="bg-slate-50 p-6 border-b border-slate-100">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                  Official Career Alert
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug font-display mr-6">
                  {selectedJob.title}
                </h3>
              </div>

              {/* Body Content Scroll container */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                
                {/* Status grids */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Age Limit</span>
                    <p className="text-xs font-semibold text-slate-800">{selectedJob.age || "Not specified"}</p>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Last Date to Apply</span>
                    <p className="text-xs font-semibold text-rose-600">{selectedJob.lastDate || "Not listed"}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Required Qualification</span>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{selectedJob.qualification || "Any Graduate / Matriculation"}</p>
                  </div>
                </div>

                {/* Browser SSL Advisor Notice */}
                <div className="p-4 bg-amber-50/80 border border-amber-200/60 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-950 font-display">State Portal Connection Note</h4>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Many official Indian state recruitment platforms (e.g. <code className="bg-amber-100/60 px-1 py-0.5 rounded text-amber-900">.wb.gov.in</code>) frequently trigger browser SSL warnings ("Your connection is not private") due to municipal security credentials. This is standard; the links are safe and official.
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-semibold">
                      If your browser blocks the link, copy the official URL below to open it directly in a private/incognito window.
                    </p>
                  </div>
                </div>

                {/* Deep link copy box */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Official Portal URL</span>
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <span className="text-slate-500 font-mono truncate select-all flex-1 pr-2">
                      {selectedJob.link}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(selectedJob.link)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all flex items-center gap-1 shrink-0 ${
                        isCopied 
                          ? "bg-emerald-600 text-white" 
                          : "bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-200" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                {selectedJob.link && (
                  <a
                    href={selectedJob.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    Visit Official Site
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Selection & Checklist Modal */}
      <AnimatePresence>
        {selectedTestToLaunch && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="lang-selector-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
              id="lang-modal-card"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedTestToLaunch(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
                id="btn-close-lang-modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                {/* Branding Badge Accent */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                  <SuccessBeaconLogo variant="icon" lightMode={false} size={48} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight font-display">
                    Launch Assessment Instruction
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal font-medium">
                    Please specify your selective assessment guidelines and language preferences below to download questions.
                  </p>
                </div>
              </div>

              {/* Assessment Specification Specs */}
              <div className="mt-5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-505">
                  <span className="font-medium text-slate-500">Exam Name:</span>
                  <span className="font-bold text-slate-800">{selectedTestToLaunch.testName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-505">
                  <span className="font-medium text-slate-500">Time Available:</span>
                  <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedTestToLaunch.timeLimit} Mins
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-505">
                  <span className="font-medium text-slate-500">Marking Weights:</span>
                  <span className="font-mono text-slate-800">
                    <span className="text-emerald-600 font-bold">+{selectedTestToLaunch.positiveMarking}</span>
                    <span className="mx-1 text-slate-300">/</span>
                    <span className="text-rose-600 font-semibold">-{selectedTestToLaunch.negativeMarking}</span>
                  </span>
                </div>
              </div>

              {/* Language Selection Header & Drop Down list */}
              <div className="mt-5 space-y-2">
                <label className="block text-xs font-bold text-slate-700 font-display uppercase tracking-wider">
                  Selective Question Language
                </label>
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as any)}
                    className="w-full text-sm py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition font-medium appearance-none shadow-sm cursor-pointer"
                    id="language-select-dropdown"
                  >
                    <option value="English">English (English Sheet Tab)</option>
                    <option value="Bengali">Bengali (Bengali Sheet Tab)</option>
                    <option value="Hindi">Hindi (Hindi Sheet Tab)</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronRight className="w-4 h-4 transform rotate-90" />
                  </div>
                </div>
              </div>

              {/* Cheque Box readiness indicator */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-3">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    id="checkbox-ready-to-begin"
                    checked={isReadyToBegin}
                    onChange={(e) => setIsReadyToBegin(e.target.checked)}
                    className="peer h-5 w-5 rounded-md border-2 border-slate-300 text-slate-900 focus:ring-slate-950 cursor-pointer transition-colors checked:bg-slate-950 checked:border-slate-950"
                  />
                </div>
                <label 
                  htmlFor="checkbox-ready-to-begin"
                  className="text-xs text-slate-600 hover:text-slate-950 transition font-semibold leading-normal cursor-pointer select-none"
                >
                  I am ready to begin. Click here
                </label>
              </div>

              {/* Bottom Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTestToLaunch(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  id="btn-cancel-test-launch"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isReadyToBegin) {
                      onStartTest(
                        selectedTestToLaunch.link,
                        selectedTestToLaunch.testName,
                        selectedTestToLaunch.timeLimit,
                        selectedTestToLaunch.positiveMarking,
                        selectedTestToLaunch.negativeMarking,
                        selectedLanguage
                      );
                      setSelectedTestToLaunch(null);
                    }
                  }}
                  disabled={!isReadyToBegin}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                    isReadyToBegin
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                  id="btn-confirm-test-launch"
                >
                  Confirm & Start
                  <CheckSquare className="w-4 h-4 text-emerald-100" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
