"use client";
import { useEffect, useState } from "react";
import { getTrialPeriods, getLogs, getTrackedSymptoms, upsertTodayLog, getTodayLog } from "@/lib/api";
import { TrialPeriod, UserProfile, Log } from "@/types";
import { getUserProfile } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';

const MOCK_SYMPTOMS = ["Bloating", "Cravings", "Fatigue", "Mood swings", "Headache"];

export default function TrackPage() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, loading, router]);
  if (loading || !isLoggedIn) return null;
  const [strategy, setStrategy] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>(MOCK_SYMPTOMS);
  const [scores, setScores] = useState<{ [key: string]: number }>({
    Energy: 5,
    Mood: 3,
    ...MOCK_SYMPTOMS.reduce((acc, s) => ({ ...acc, [s]: 1 }), {}),
  });
  const [appliedStrategy, setAppliedStrategy] = useState<null | boolean>(null);
  const [showApplyStrategyError, setShowApplyStrategyError] = useState(false);
  const [extraSymptoms, setExtraSymptoms] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [logStored, setLogStored] = useState(false);
  const [editingSymptoms, setEditingSymptoms] = useState(false);
  const [editSymptomsList, setEditSymptomsList] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState("");
  const [selectedLogDate, setSelectedLogDate] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [trialPeriods, setTrialPeriods] = useState<TrialPeriod[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [logError, setLogError] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showApplyStrategyPopup, setShowApplyStrategyPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trialPeriod, setTrialPeriod] = useState<TrialPeriod | null>(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    loadLogsForMonth(newMonth);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load strategy
        setStrategy("Blood Sugar Balance");
        
        // Load symptoms
        try {
          const fetchedSymptoms = await getTrackedSymptoms();
          setSymptoms(fetchedSymptoms.length > 0 ? fetchedSymptoms : MOCK_SYMPTOMS);
        } catch (error) {
          console.error("Failed to load symptoms:", error);
          // Fallback to intake data or mock symptoms
          const intake = typeof window !== 'undefined' ? localStorage.getItem('intakeData') : null;
          if (intake) {
            try {
              const parsed = JSON.parse(intake);
              if (parsed.symptoms && Array.isArray(parsed.symptoms)) {
                setSymptoms(parsed.symptoms);
              }
            } catch {}
          }
        }

        // Load trial periods
        try {
          const fetchedTrialPeriods = await getTrialPeriods();
          setTrialPeriods(fetchedTrialPeriods);
        } catch (error) {
          console.error("Failed to load trial periods:", error);
        }

        // Load logs for current month
        await loadLogsForMonth(new Date());
        
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const fetchProfileAndPeriods = async () => {
      try {
        const userProfile: UserProfile = await getUserProfile();
        setProfile(userProfile);
        setStrategy(userProfile.strategy_details?.['Strategie naam'] || userProfile.current_strategy);
        const periods = await getTrialPeriods();
        // Find active period for current strategy, fallback to any active
        const normalize = (s: string) => s?.trim().toLowerCase();
        let active = periods.find((p: TrialPeriod) => normalize(p.strategy_name) === normalize(userProfile.current_strategy) && p.is_active);
        if (!active) active = periods.find((p: TrialPeriod) => p.is_active);
        setTrialPeriod(active || null);
        if (active) {
          const start = new Date(active.start_date);
          const end = new Date(active.end_date);
          const today = new Date();
          setCurrentDay(Math.max(1, Math.min(
            Math.floor((today.getTime() - start.getTime()) / (1000*60*60*24)) + 1,
            Math.floor((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1
          )));
          setTotalDays(Math.floor((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1);
        }
      } catch {
        // fallback: do nothing
      }
    };
    fetchProfileAndPeriods();
  }, []);

  useEffect(() => {
    async function checkTodayLog() {
      try {
        const todayLog: Log | null = await getTodayLog();
        if (todayLog && todayLog.date === toLocalDateString(new Date())) {
          setLogStored(true);
          setEditMode(false);
          // Pre-fill form data if needed
          setAppliedStrategy(todayLog.strategy_applied ?? null);
          setScores((prev: Record<string, number>) => ({
            ...prev,
            Energy: todayLog.energy ?? 3,
            Mood: todayLog.mood ?? 3,
            ...todayLog.symptom_scores,
          }));
          setExtraSymptoms(todayLog.extra_symptoms || '');
          setExtraNotes(todayLog.extra_notes || '');
        } else {
          setLogStored(false);
          setEditMode(false);
        }
      } catch {
        setLogStored(false);
        setEditMode(false);
      }
    }
    checkTodayLog();
    // Optionally, set up a timer to reset at midnight
  }, []);

  const loadLogsForMonth = async (month: Date) => {
    try {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];
      const fetchedLogs = await getLogs({ start: startDate, end: endDate });
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Failed to load logs:", error);
    }
  };

  const handleSlider = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleStoreLog = async () => {
    setLogError(null);
    setShowApplyStrategyError(false);
    if (appliedStrategy === null) {
      setShowApplyStrategyPopup(true);
      return;
    }
    try {
      const today = new Date().toISOString().slice(0, 10);
      const logData = {
        date: today,
        applied_strategy: appliedStrategy,
        energy: scores.Energy,
        mood: scores.Mood,
        symptom_scores: Object.fromEntries(symptoms.map(s => [s, scores[s] || 1])),
        extra_symptoms: extraSymptoms,
        extra_notes: extraNotes,
        strategy_name: strategy,
      };
      await upsertTodayLog(logData);
      setLogStored(true);
      await loadLogsForMonth(currentMonth); // Refetch logs to update UI
    } catch (err: unknown) {
      setLogError((err as Error).message || 'Failed to store log');
    }
  };

  const handleDayClick = async (dateStr: string) => {
    setSelectedLogDate(dateStr);
    setSelectedLog(null);
    setShowLogModal(true);
    try {
      const logsForDay = await getLogs({ start: dateStr, end: dateStr });
      setSelectedLog(logsForDay && logsForDay.length > 0 ? logsForDay[0] : null);
    } catch {
      setSelectedLog(null);
    }
  };

  const STRATEGY_COLORS: Record<string, string> = {
    "Blood Sugar Balance": "bg-green-100 border-green-400 text-green-700",
    "Cycle Sync": "bg-purple-100 border-purple-400 text-purple-700",
    "Gut Reset": "bg-pink-100 border-pink-400 text-pink-700",
    "Bloedsuiker in balans": "bg-green-100 border-green-400 text-green-700",
    "Hormoonbalans": "bg-blue-100 border-blue-400 text-blue-700",
    "Darm reset": "bg-orange-100 border-orange-400 text-orange-700",
  };
  
  const STRATEGY_ICONS: Record<string, string> = {
    "Blood Sugar Balance": "🍬",
    "Cycle Sync": "🔄",
    "Gut Reset": "🦠",
    "Bloedsuiker in balans": "🍬",
    "Hormoonbalans": "🔄",
    "Darm reset": "🦠",
  } as const;

  function getMonthDays(month: Date) {
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const lastDay = new Date(year, monthIdx + 1, 0);
    const days = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, monthIdx, d));
    }
    return days;
  }

  function buildStrategyMap(trialPeriods: TrialPeriod[], month: Date) {
    const days = getMonthDays(month);
    const map: Record<string, TrialPeriod> = {};
    // Sort trial periods by start_date ascending
    const sorted = [...trialPeriods].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    days.forEach(dateObj => {
      const dateStr = toLocalDateString(dateObj);
      // Find all trial periods that include this day
      const activePeriods = sorted.filter(tp => {
        const start = new Date(tp.start_date);
        const end = new Date(tp.end_date);
        const d = new Date(dateStr);
        return d >= start && d <= end;
      });
      // If multiple, pick the one with the latest start_date (most recent strategy)
      if (activePeriods.length > 0) {
        const mostRecent = activePeriods.reduce((a, b) => new Date(a.start_date) > new Date(b.start_date) ? a : b);
        map[dateStr] = mostRecent;
      }
    });
    return map;
  }

  // Helper to get local date string (YYYY-MM-DD)
  function toLocalDateString(dateObj: Date) {
    return dateObj.getFullYear() + '-' +
      String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
      String(dateObj.getDate()).padStart(2, '0');
  }

  // Helper: get start and end of current week (Monday–Sunday)
  function getWeekRange(date = new Date()) {
    const day = date.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return [toLocalDateString(monday), toLocalDateString(sunday)];
  }

  const [weekStart, weekEnd] = getWeekRange();
  const weekLogs = logs.filter(l => l.date >= weekStart && l.date <= weekEnd);
  const avgEnergy = weekLogs.length ? (weekLogs.reduce((sum, l) => sum + (l.energy || 0), 0) / weekLogs.length).toFixed(1) : '-';
  const avgMood = weekLogs.length ? (weekLogs.reduce((sum, l) => sum + (l.mood || 0), 0) / weekLogs.length).toFixed(1) : '-';

  // Calculate logs for current trial period
  let trialLogs: Log[] = [];
  let daysAppliedTrial = 0;
  let trialTotalDays = totalDays;
  if (trialPeriod) {
    const start = trialPeriod.start_date;
    const end = trialPeriod.end_date;
    trialLogs = logs.filter(l => l.date >= start && l.date <= end);
    daysAppliedTrial = trialLogs.filter(l => l.applied_strategy).length;
    // trialTotalDays is already set from useEffect, but fallback if not
    if (!trialTotalDays && trialPeriod.start_date && trialPeriod.end_date) {
      const s = new Date(trialPeriod.start_date);
      const e = new Date(trialPeriod.end_date);
      trialTotalDays = Math.floor((e.getTime() - s.getTime()) / (1000*60*60*24)) + 1;
    }
  }

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center min-h-[70vh] py-8 px-2">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col gap-6">
          <div className="text-center text-gray-500">Loading your tracking data...</div>
        </div>
      </div>
    );
  }

  const strategyMap = buildStrategyMap(trialPeriods, currentMonth);
  const allStrategyNames = Array.from(new Set(trialPeriods.map(tp => tp.strategy_name)));

  return (
    <div className="flex flex-col items-center min-h-[70vh] py-8 px-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold mb-1 text-gray-900 text-center">Daily Check-in</h1>
        <p className="text-center text-green-900 mb-4">How are you feeling today?</p>
        {/* Strategy Card */}
        <div className="bg-gradient-to-r from-orange-50 to-green-50 border border-orange-100 rounded-xl p-4 mb-2 flex flex-col gap-1 relative">
          {trialPeriod && (
            <span className="absolute top-2 right-4 bg-red-100 text-red-500 text-xs font-bold px-3 py-1 rounded-full">
              Day {currentDay} out of {totalDays}
            </span>
          )}
          <div className="font-semibold text-lg text-gray-900">Current Strategy</div>
          <div className="font-bold text-base text-orange-900 mt-1">{profile?.strategy_details?.['Strategie naam'] || strategy}</div>
          <div className="text-gray-700 text-sm">{profile?.strategy_details?.Uitleg || 'No description available.'}</div>
        </div>
        {/* Did you apply strategy? */}
        {(!logStored || editMode) && (
          <div className="flex items-center gap-4 mb-2">
            <span className="w-48 text-gray-700">Did you successfully apply the strategy today?</span>
            <button
              className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${appliedStrategy === true ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'}`}
              onClick={() => setAppliedStrategy(true)}
              type="button"
            >
              Yes ✓
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${appliedStrategy === false ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'}`}
              onClick={() => setAppliedStrategy(false)}
              type="button"
            >
              Not today
            </button>
          </div>
        )}
        {showApplyStrategyError && (
          <div className="text-red-500 text-sm mb-2">Please select if you applied the strategy today.</div>
        )}
        {/* Score Your Symptoms Block or Confirmation */}
        {logStored && !editMode ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col items-center mb-4">
            <div className="text-green-700 font-semibold mb-2">You successfully entered today&apos;s log.</div>
            <button
              className="bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 px-6 rounded-xl transition-colors"
              onClick={() => setEditMode(true)}
            >
              Edit log
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-lg text-gray-900">Score your symptoms</div>
              {!editingSymptoms && (
                <button className="text-purple-600 font-medium underline text-sm" onClick={() => { setEditingSymptoms(true); setEditSymptomsList(symptoms); }}>Edit symptoms</button>
              )}
            </div>
            {editingSymptoms ? (
              <div className="flex flex-col gap-2">
                {editSymptomsList.map((symptom, idx) => (
                  <div key={symptom} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={symptom}
                      onChange={e => {
                        const updated = [...editSymptomsList];
                        updated[idx] = e.target.value;
                        setEditSymptomsList(updated);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 flex-1"
                    />
                    <button
                      className="text-red-500 text-lg font-bold px-2"
                      onClick={() => setEditSymptomsList(editSymptomsList.filter((_, i) => i !== idx))}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newSymptom}
                    onChange={e => setNewSymptom(e.target.value)}
                    placeholder="Add symptom"
                    className="border border-gray-300 rounded px-2 py-1 flex-1"
                  />
                  <button
                    className="bg-purple-400 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded"
                    onClick={() => {
                      if (newSymptom.trim() && !editSymptomsList.includes(newSymptom.trim())) {
                        setEditSymptomsList([...editSymptomsList, newSymptom.trim()]);
                        setNewSymptom("");
                      }
                    }}
                    type="button"
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded"
                    onClick={() => { setSymptoms(editSymptomsList); setEditingSymptoms(false); }}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded"
                    onClick={() => setEditingSymptoms(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Energy Slider */}
                <div className="flex items-center gap-4">
                  <span className="w-32 text-gray-700">Energy</span>
                  <input type="range" min={1} max={5} value={scores.Energy} onChange={e => handleSlider("Energy", Number(e.target.value))} className="flex-1 accent-purple-400" />
                  <span className="w-8 text-center">{scores.Energy}</span>
                </div>
                {/* Mood Slider */}
                <div className="flex items-center gap-4">
                  <span className="w-32 text-gray-700">Mood</span>
                  <input type="range" min={1} max={5} value={scores.Mood} onChange={e => handleSlider("Mood", Number(e.target.value))} className="flex-1 accent-purple-400" />
                  <span className="w-8 text-center">{scores.Mood}</span>
                </div>
                {/* Symptom Sliders */}
                {symptoms.map((symptom) => (
                  <div key={symptom} className="flex items-center gap-4">
                    <span className="w-32 text-gray-700">{symptom}</span>
                    <input type="range" min={1} max={5} value={scores[symptom] || 1} onChange={e => handleSlider(symptom, Number(e.target.value))} className="flex-1 accent-purple-400" />
                    <span className="w-8 text-center">{scores[symptom] || 1}</span>
                  </div>
                ))}
                {/* Extra Symptoms */}
                <div className="flex flex-col gap-1 mt-2">
                  <label htmlFor="extraSymptoms" className="text-gray-700 font-medium">Extra symptoms</label>
                  <input
                    id="extraSymptoms"
                    type="text"
                    value={extraSymptoms}
                    onChange={e => setExtraSymptoms(e.target.value)}
                    placeholder="Describe any other symptoms..."
                    className="border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                {/* Extra Notes */}
                <div className="flex flex-col gap-1 mt-2">
                  <label htmlFor="extraNotes" className="text-gray-700 font-medium">Extra notes</label>
                  <textarea
                    id="extraNotes"
                    value={extraNotes}
                    onChange={e => setExtraNotes(e.target.value)}
                    placeholder="Anything else you want to add about today?"
                    className="border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-200 min-h-[60px]"
                  />
                </div>
                {logError && <div className="text-red-500 text-center mt-2">{logError}</div>}
                <button className="mt-4 bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 px-6 rounded-xl self-center transition-colors" onClick={handleStoreLog}>Store todays logs</button>
              </>
            )}
          </div>
        )}
        {/* Progress Overview Block */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-2 mt-2">
          <div className="font-semibold text-lg text-gray-900 mb-2">This Week&apos;s Progress</div>
          <div className="flex justify-between text-sm">
            <span>Strategy followed</span>
            <span className="font-bold text-purple-600">{daysAppliedTrial}/{trialTotalDays} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Average energy</span>
            <span className="font-bold text-purple-600">{avgEnergy}/5</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Average mood</span>
            <span className="font-bold text-purple-600">{avgMood}/5</span>
          </div>
        </div>
        {/* Calendar Log Overview */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6 mt-4 flex flex-col items-center">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => handleMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">&lt; Prev</button>
            <div className="font-bold text-xl text-purple-900 flex items-center gap-2">
              <span className="inline-block w-6 h-6 rounded-full border-2 border-purple-400 flex items-center justify-center mr-1">🎯</span>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={() => handleMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Next &gt;</button>
          </div>
          <div className="text-gray-700 mb-4"> Strategy & Log Overview ({getMonthDays(currentMonth).length} days)</div>
          <div className="grid grid-cols-7 gap-3 mb-4">
            {getMonthDays(currentMonth).map(dateObj => {
              const dateStr = toLocalDateString(dateObj);
              const log = logs.find((l: Log) => l.date === dateStr);
              const trial = strategyMap[dateStr];
              const isToday = dateStr === new Date().toISOString().slice(0, 10);
              let status: "today" | "success" | "none" = "none";
              if (isToday) status = "today";
              if (log && log.applied_strategy) status = "success";
              const strategyColor = trial ? STRATEGY_COLORS[trial.strategy_name] || "bg-gray-100 border-gray-300 text-gray-500" : "bg-white border-gray-200 text-gray-400";
              const strategyIcon = trial ? STRATEGY_ICONS[trial.strategy_name] || "" : "";
              return (
                <div
                  key={dateStr}
                  className={`w-10 h-10 flex flex-col items-center justify-center rounded-full border-2 text-lg font-semibold transition-all cursor-pointer ${strategyColor} ${status === "today" ? "ring-2 ring-blue-400" : ""}`}
                  onClick={() => handleDayClick(dateStr)}
                  title={trial ? trial.strategy_name : undefined}
                >
                  <span>{dateObj.getDate()}</span>
                  {strategyIcon && <span className="text-xs">{strategyIcon}</span>}
                </div>
              );
            })}
          </div>
          
          {/* Strategy Legend */}
          {allStrategyNames.length > 0 && (
            <div className="w-full mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2 text-center"> Your strategies </h4>
              <div className="flex flex-wrap justify-center gap-3">
                {allStrategyNames.map(strategyName => (
                  <div key={strategyName} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${STRATEGY_COLORS[strategyName] || "bg-gray-100 border-gray-300"}`}>
                      {STRATEGY_ICONS[strategyName as keyof typeof STRATEGY_ICONS] && <span className="text-xs">{STRATEGY_ICONS[strategyName as keyof typeof STRATEGY_ICONS]}</span>}
                    </div>
                    <span className="text-sm text-gray-700">{strategyName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-4 mb-2 text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-50 inline-block"></span> Today</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-green-400 bg-green-50 inline-block"></span> Success</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-red-400 bg-red-50 inline-block"></span> Not successful</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-gray-200 bg-white inline-block"></span> No log</span>
          </div>
          <div className="text-green-700 font-bold bg-green-100 rounded-lg px-4 py-1 mb-2">100% succesvol</div>
          <div className="text-gray-700 mb-2">1/1 logged days</div>
          <div className="flex gap-8 mb-2">
            <div className="flex flex-col items-center"><span className="text-green-600 font-bold text-lg">↗ 1</span><span className="text-xs text-gray-500">Current streak</span></div>
            <div className="flex flex-col items-center"><span className="text-blue-600 font-bold text-lg">📅 1</span><span className="text-xs text-gray-500">Total logged</span></div>
          </div>
          <div className="bg-blue-50 text-blue-700 rounded-lg px-4 py-2 mt-2 text-center font-medium w-full">🎉 Great! You&apos;re doing great following your strategy!</div>
        </div>
      </div>
      {/* Modal for viewing previous logs */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowLogModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-2">Log for {selectedLogDate}</h3>
            {selectedLog ? (
              <div>
                <div className="mb-2"><b>Applied strategy:</b> {selectedLog.applied_strategy ? 'Yes' : 'No'}</div>
                <div className="mb-2"><b>Energy:</b> {selectedLog.energy}</div>
                <div className="mb-2"><b>Mood:</b> {selectedLog.mood}</div>
                <div className="mb-2"><b>Symptoms:</b>
                  <ul className="pl-4 list-disc">
                    {selectedLog.symptom_scores && Object.entries(selectedLog.symptom_scores).map(([symptom, score]) => (
                      <li key={symptom}>{symptom}: {String(score)}</li>
                    ))}
                  </ul>
                </div>
                {selectedLog.extra_symptoms && <div className="mb-2"><b>Extra symptoms:</b> {selectedLog.extra_symptoms}</div>}
                {selectedLog.extra_notes && <div className="mb-2"><b>Extra notes:</b> {selectedLog.extra_notes}</div>}
              </div>
            ) : (
              <div className="text-gray-500">No log for this day.</div>
            )}
          </div>
        </div>
      )}
      {showApplyStrategyPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowApplyStrategyPopup(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-lg font-bold mb-2">Missing Information</div>
            <div className="mb-4">Please select if you applied the strategy today before storing your log.</div>
            <button
              className="bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 px-4 rounded-xl"
              onClick={() => setShowApplyStrategyPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
} 