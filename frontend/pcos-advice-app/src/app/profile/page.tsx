"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTrialPeriods, getLogs, createTrialPeriod, API_BASE_URL } from '@/lib/api';
import { getUserProfile, getTodayLog } from '@/lib/api';
import { UserProfile, TrialPeriod, Log } from '@/types';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayLog, setTodayLog] = useState<Log | null>(null);
  const [trialPeriod, setTrialPeriod] = useState<TrialPeriod | null>(null);
  const [daysApplied, setDaysApplied] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [cyclePhase, setCyclePhase] = useState<string>('');
  const [cycleExplanation, setCycleExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [newStart, setNewStart] = useState<string | null>(null);
  const [newEnd, setNewEnd] = useState<string | null>(null);
  const [trialError, setTrialError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    if (!auth.isLoggedIn()) {
      router.push('/login');
      return;
    }
    async function fetchData() {
      const [profileData, trials, todayLogData] = await Promise.all([
        getUserProfile(),
        getTrialPeriods(),
        getTodayLog()
      ]);
      setProfile(profileData as UserProfile);
      setTodayLog(todayLogData as Log | null);
      const active = trials.find((t: TrialPeriod) => t.is_active);
      setTrialPeriod(active || null);
      if (active) {
        const logsInPeriod = await getLogs({ start: active.start_date, end: active.end_date });
        setDaysApplied(logsInPeriod.filter((l: Log) => l.strategy_applied).length);
        const today = new Date();
        const start = new Date(active.start_date);
        setCurrentDay(Math.max(1, Math.min(
          Math.floor((today.getTime() - start.getTime()) / (1000*60*60*24)) + 1,
          Math.floor((new Date(active.end_date).getTime() - start.getTime()) / (1000*60*60*24)) + 1
        )));
      }
    }
    fetchData().finally(() => setIsLoading(false));

    // Calculate cycle phase from intakeData in localStorage
    const intakeString = typeof window !== 'undefined' ? localStorage.getItem('intakeData') : null;
    if (intakeString) {
      try {
        const intake = JSON.parse(intakeString);
        // If user has no cycle or irregular cycle
        if (intake.cycle && (intake.cycle.toLowerCase().includes('no cycle') || intake.cycle.toLowerCase().includes('irregular'))) {
          setCyclePhase(intake.cycle);
          setCycleExplanation("You reported not having a regular cycle or period. Your experience and needs may differ from typical cycle-based advice.");
        } else if (intake.cycle) {
          // If user provided a phase, use it
          const phase = intake.cycle;
          setCyclePhase(phase);
          // Add explanations for each phase
          let explanation = '';
          switch (phase.toLowerCase()) {
            case 'menstruation':
              explanation = "Menstruation: This is your period. Your body is shedding the uterine lining. Focus on rest, iron-rich foods, and gentle self-care.";
              break;
            case 'follicular':
              explanation = "Follicular Phase: Hormones rise, energy increases, and your body prepares for ovulation. Great time for creativity and new projects.";
              break;
            case 'ovulation':
              explanation = "Ovulation: Your body releases an egg. You may feel most energetic and social. Support with protein, fiber, and hydration.";
              break;
            case 'luteal':
              explanation = "Luteal Phase: Hormones shift, PMS symptoms may appear. Focus on magnesium, B vitamins, and stress reduction.";
              break;
            default:
              explanation = "Cycle phase information is not specific. Listen to your body and adjust as needed.";
          }
          setCycleExplanation(explanation);
        } else {
          setCyclePhase("Unclear");
          setCycleExplanation("No cycle information provided. If you don&apos;t have a period, that&apos;s okay—nutrition can still support your health!");
        }
      } catch {
        setCyclePhase("Unclear");
        setCycleExplanation("No cycle information provided. If you don&apos;t have a period, that&apos;s okay—nutrition can still support your health!");
      }
    } else {
      setCyclePhase("Unclear");
      setCycleExplanation("No cycle information provided. If you don&apos;t have a period, that&apos;s okay—nutrition can still support your health!");
    }
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  const handleViewDetails = () => {
    router.push('/today');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
    const token = auth.getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/delete_account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        auth.logout();
        localStorage.clear();
        router.push('/');
      } else {
        alert('Failed to delete account.');
      }
    } catch {
      alert('Failed to delete account.');
    }
  };

  const handleNewStrategy = () => {
    if (window.confirm('You can only follow 1 strategy at a time. Are you sure you want to reset your strategy, including your progress?')) {
      router.push('/strategy_selection');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-pink-50 to-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10"></div>
        <div className="relative bg-white/80 backdrop-blur-sm border-b border-pink-200/50 px-6 py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-white text-2xl">👤</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Your Profile
                  </h1>
                  <p className="text-gray-600 text-xl">Manage your health journey</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">

        {/* Current Strategy */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-200/50 p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🎯</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Current Strategy</h2>
                <p className="text-gray-600 mt-1 text-lg">{trialPeriod ? trialPeriod.strategy_name : 'No active strategy'}</p>
              </div>
            </div>
            {trialPeriod && (
              <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold border border-green-200">
                Active
              </span>
            )}
          </div>
          {trialPeriod ? (
            <div className="flex flex-col sm:flex-row justify-between items-center w-full">
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">
                  Day {currentDay} of {Math.floor((new Date(trialPeriod.end_date).getTime() - new Date(trialPeriod.start_date).getTime()) / (1000*60*60*24)) + 1}
                </div>
                {/* Progress Bar */}
                <div className="w-full h-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full overflow-hidden mb-4 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300 shadow-lg"
                    style={{ width: `${Math.round((currentDay / (Math.floor((new Date(trialPeriod.end_date).getTime() - new Date(trialPeriod.start_date).getTime()) / (1000*60*60*24)) + 1)) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 mb-4 font-medium">Progress through your strategy period</div>
                <div className="text-lg text-gray-700 mb-6 font-semibold">
                  Successfully applied: {daysApplied} days
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button onClick={handleViewDetails} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold">
                    View Details
                  </button>
                  <button type="button" onClick={handleNewStrategy} className="border-2 border-pink-500 text-pink-600 font-semibold py-3 px-6 rounded-xl bg-white hover:bg-pink-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    New Strategy
                  </button>
                  <button type="button" onClick={() => {
                    setShowTrialModal(true);
                    setNewStart(trialPeriod?.start_date || null);
                    setNewEnd(trialPeriod?.end_date || null);
                    setTrialError(null);
                  }} className="border-2 border-purple-500 text-purple-600 font-semibold py-3 px-6 rounded-xl bg-white hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Change trial period
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No active trial period.</div>
          )}
        </div>

        {/* User Profile */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-200/50 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Goals</h3>
              <div className="space-y-2">
                {(profile?.goals || []).map((goal: string, index: number) => (
                  <div key={index} className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg border border-pink-200 font-medium">
                    {goal}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Symptoms</h3>
              <div className="space-y-2">
                {(profile?.symptoms || []).map((symptom: string, index: number) => (
                  <div key={index} className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg border border-purple-200 font-medium">
                    {symptom}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-pink-50 rounded-xl p-4 border border-indigo-200">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Dietary Preferences</h3>
              <div className="space-y-2">
                {(() => {
                  let intake = null;
                  if (typeof window !== 'undefined') {
                    const intakeString = localStorage.getItem('intakeData');
                    if (intakeString) {
                      try { intake = JSON.parse(intakeString); } catch {}
                    }
                  }
                  return (intake?.dietaryRestrictions || []).length > 0
                    ? intake.dietaryRestrictions.map((pref: string, idx: number) => (
                        <div key={idx} className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg border border-indigo-200 font-medium">{pref}</div>
                      ))
                    : <div className="text-sm text-gray-500 italic">None specified</div>;
                })()}
              </div>
            </div>
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Cycle Phase</h3>
              <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg border border-pink-200 font-medium mb-2">
                {cyclePhase}
              </div>
              <div className="text-xs text-gray-600 leading-relaxed">
                {cycleExplanation}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/intake" className="flex-1">
              <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Update Profile
              </button>
            </Link>
          </div>
        </div>
        {/* Recent Progress */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-200/50 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Progress</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
              <div className="text-3xl font-bold text-pink-600 mb-2">
                {todayLog?.applied_strategy ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-700 font-semibold">Strategy Followed Today</div>
            </div>
            <div className="text-center bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">{todayLog?.energy ? `${todayLog.energy}/5` : '-'}</div>
              <div className="text-sm text-gray-700 font-semibold">Energy Level</div>
            </div>
            <div className="text-center bg-gradient-to-r from-indigo-50 to-pink-50 rounded-xl p-6 border border-indigo-200">
              <div className="text-3xl font-bold text-indigo-600 mb-2">{todayLog?.mood ? todayLog.mood : '-'}</div>
              <div className="text-sm text-gray-700 font-semibold">Mood</div>
            </div>
          </div>
          <div className="flex justify-center mt-8">
            <Link href="/track">
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Add Today&apos;s Log
              </button>
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 text-pink-600 border-2 border-pink-500 rounded-xl hover:bg-pink-50 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Logout
          </button>
          <button onClick={handleDeleteAccount} className="w-full border-2 border-red-400 text-red-600 font-semibold py-4 px-6 rounded-xl bg-white hover:bg-red-50 transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Delete Account
          </button>
        </div>
      </div>
      {showTrialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowTrialModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-lg font-bold mb-2">Change Trial Period</div>
            <div className="mb-2 text-sm text-gray-600">Current: {trialPeriod?.start_date} to {trialPeriod?.end_date}</div>
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-sm">Start date:</label>
              <input type="date" value={newStart || ''} onChange={e => setNewStart(e.target.value)} className="border rounded px-2 py-1" />
              <label className="text-sm">End date:</label>
              <input type="date" value={newEnd || ''} min={newStart || ''} onChange={e => setNewEnd(e.target.value)} className="border rounded px-2 py-1" />
            </div>
            {trialError && <div className="text-red-500 text-sm mb-2">{trialError}</div>}
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-100 text-gray-700" onClick={() => setShowTrialModal(false)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-pink-500 text-white font-bold" onClick={async () => {
                setTrialError(null);
                if (!newStart || !newEnd) {
                  setTrialError('Please select both start and end date.');
                  return;
                }
                if (newStart >= newEnd) {
                  setTrialError('End date must be after start date.');
                  return;
                }
                try {
                  if (!trialPeriod) {
                    setTrialError('No trial period found.');
                    return;
                  }
                  await createTrialPeriod({ strategy_name: trialPeriod.strategy_name, start_date: newStart, end_date: newEnd });
                  setShowTrialModal(false);
                  setIsLoading(true);
                  // Refetch data
                  const trials = await getTrialPeriods();
                  const active = trials.find((t: TrialPeriod) => t.is_active);
                  setTrialPeriod(active || null);
                  if (active) {
                    const logsInPeriod = await getLogs({ start: active.start_date, end: active.end_date });
                    setDaysApplied(logsInPeriod.filter((l: Log) => l.strategy_applied).length);
                    const today = new Date();
                    const start = new Date(active.start_date);
                    setCurrentDay(Math.max(1, Math.min(
                      Math.floor((today.getTime() - start.getTime()) / (1000*60*60*24)) + 1,
                      Math.floor((new Date(active.end_date).getTime() - start.getTime()) / (1000*60*60*24)) + 1
                    )));
                  }
                  setIsLoading(false);
                } catch {
                  setTrialError('Failed to update trial period.');
                }
              }}>Confirm</button>
            </div>
          </div>
        </div>
              )}
        <BottomNav />
      </div>
    );
  } 