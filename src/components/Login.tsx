import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { LogIn, KeyRound, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SuccessBeaconLogo from './SuccessBeaconLogo';

interface LoginProps {
  students: Student[];
  onLoginSuccess: (student: Student) => void;
  isLoading: boolean;
}

export default function Login({ students, onLoginSuccess, isLoading }: LoginProps) {
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [inactiveDetails, setInactiveDetails] = useState<{ name: string; msg: string } | null>(null);

  // Auto-fill student if there's only one, but there are multiple
  useEffect(() => {
    if (students.length > 0 && !isManualInput) {
      setSelectedStudentName(students[0].userId || students[0].name);
    }
  }, [students, isManualInput]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInactiveDetails(null);

    const targetInput = isManualInput ? manualName.trim() : selectedStudentName;
    const targetPassword = password.trim();

    if (!targetInput) {
      setErrorMessage(isManualInput ? 'Please enter your User ID or Name.' : 'Please select a student.');
      return;
    }
    if (!targetPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Find student in spreadsheet list by User ID (case-insensitive), name, or serial number
    const found = students.find(
      (s) =>
        (s.userId && s.userId.toLowerCase() === targetInput.toLowerCase()) ||
        s.name.toLowerCase() === targetInput.toLowerCase() ||
        s.slNo.toString() === targetInput
    );

    if (!found) {
      setErrorMessage(
        isManualInput 
          ? 'Student profile not found. Please verify your User ID (Serial No.) or spelling.'
          : 'Unable to locate selected student.'
      );
      return;
    }

    if (found.password !== targetPassword) {
      setErrorMessage('Incorrect password. Please try again.');
      return;
    }

    if (!found.active) {
      setInactiveDetails({
        name: found.name,
        msg: found.message,
      });
      return;
    }

    // Success!
    onLoginSuccess(found);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans relative overflow-hidden" id="login-container">
      {/* Background radial accent grids */}
      <div className="absolute top-0 right-0 p-8 text-neutral-400 font-mono text-xs hidden md:block select-none z-10">
        UTC Clock: 2026-05-26
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 z-10">
        
        {/* Left Branding Showcase Column */}
        <div className="md:w-1/2 bg-slate-50 p-8 md:p-12 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
          {/* Subtle background graphics */}
          <div className="absolute -left-24 -bottom-24 w-60 h-60 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-48 h-48 bg-[#0a1e38]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            {/* The Badge Icon option (as uploaded: Lighthouse over open book quill in dark-blue rounded square) */}
            <SuccessBeaconLogo variant="badge" className="mb-6 shadow-md shadow-slate-200" size={130} />
            
            {/* The full branding layout (Success Beacon / Guiding you to achieve) */}
            <h2 className="text-2xl font-black tracking-widest text-[#0a1e38] font-display text-center flex flex-col">
              <span>SUCCESS</span>
              <span className="text-amber-500 text-base font-extrabold tracking-[0.3em] border-t border-b border-slate-200/80 py-1 mt-1 font-sans">
                BEACON
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-[0.25em] font-black uppercase mt-3 text-center">
              GUIDING YOU TO ACHIEVE
            </p>

            <div className="mt-8 text-center max-w-xs space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wide">
                Official Student Portal
              </span>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Gain immediate access to diagnostic class sheets, mock chapter indices, interactive assessment scores, and live career notifications.
              </p>
            </div>
          </div>
        </div>

        {/* Right Input Form Column */}
        <div className="md:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {inactiveDetails ? (
              <motion.div
                key="inactive-alert"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-amber-900 text-sm">Account Inactive</h3>
                    <p className="text-xs mt-1 leading-relaxed text-amber-805">
                      Hi <span className="font-semibold">{inactiveDetails.name}</span>, your account status is currently marked inactive in our records.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Notice Board Message:</span>
                  <p className="text-sm italic font-medium text-slate-700">
                    "{inactiveDetails.msg}"
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setInactiveDetails(null)}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Return to Login
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-6" key="login-form">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-display">Student Portal Login</h3>
                  <p className="text-xs text-slate-400 mt-1">Log in using your official Student User ID or profile name</p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Toggle student list vs manual */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualInput(false);
                        setErrorMessage('');
                      }}
                      className={`flex-1 py-1.5 text-center rounded-md transition ${!isManualInput ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Autofill Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualInput(true);
                        setErrorMessage('');
                      }}
                      className={`flex-1 py-1.5 text-center rounded-md transition ${isManualInput ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Enter User ID
                    </button>
                  </div>

                  {/* Student input field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Student User ID / Name
                    </label>

                    {isManualInput ? (
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="Enter Student User ID (e.g. 1) or Name"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-sans"
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="relative">
                        <select
                          value={selectedStudentName}
                          onChange={(e) => setSelectedStudentName(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer transition font-mono text-xs"
                          disabled={isLoading || students.length === 0}
                        >
                          {isLoading ? (
                            <option>Loading student roster...</option>
                          ) : (
                            students.map((s) => (
                              <option key={s.slNo} value={s.userId || s.name}>
                                [{s.userId || s.slNo.toString().padStart(3, '0')}] {s.name} ({s.batchName})
                              </option>
                            ))
                          )}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px] uppercase font-bold font-mono">
                          Select
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Password Input field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      Secret Access Code / Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (e.g. 1235)"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-slate-100"
                  id="login-button"
                >
                  <LogIn className="w-4 h-4" />
                  {isLoading ? 'Booting Portal...' : 'Enter Dashboard'}
                </button>

                <div className="text-[10px] text-center text-slate-400 pt-2 leading-relaxed">
                  Fast student login is secured via direct Google spreadsheet validation. Ensure your access status is active and keys are current.
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
