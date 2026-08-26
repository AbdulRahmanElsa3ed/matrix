import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { HabitItem, HabitMonthData } from '../types';
import { WEEK_COLORS, getISODateKey, ARABIC_DAYS } from '../data/defaultData';
import { Check, Plus, Trash2, Edit2, TrendingUp, Award, Moon, Sparkles, Clock, Calendar, RefreshCw, ChevronRight, ChevronLeft, CalendarDays, Eye, EyeOff, CheckSquare, Square, SlidersHorizontal } from 'lucide-react';
import { playCheckSound } from '../utils/audio';
import { getDynamicActionColors } from '../utils/colorUtils';

export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Color palette for individually selected habits in the comparison chart
export const HABIT_CHART_COLORS = [
  { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.25)', bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/40', dot: 'bg-sky-400' },
  { stroke: '#c084fc', fill: 'rgba(192, 132, 252, 0.25)', bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40', dot: 'bg-purple-400' },
  { stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.25)', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', dot: 'bg-emerald-400' },
  { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.25)', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40', dot: 'bg-amber-400' },
  { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.25)', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40', dot: 'bg-rose-400' },
  { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.25)', bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40', dot: 'bg-orange-400' },
  { stroke: '#2dd4bf', fill: 'rgba(45, 212, 191, 0.25)', bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/40', dot: 'bg-teal-400' },
  { stroke: '#818cf8', fill: 'rgba(129, 140, 248, 0.25)', bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/40', dot: 'bg-indigo-400' },
  { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.25)', bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/40', dot: 'bg-pink-400' },
];

interface HabitsViewProps {
  data: HabitMonthData;
  onUpdateData: (updatedData: HabitMonthData) => void;
  onAddHabit: (title: string) => void;
  soundEnabled: boolean;
}

export const HabitsView: React.FC<HabitsViewProps> = React.memo(({
  data,
  onUpdateData,
  onAddHabit,
  soundEnabled,
}) => {
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [newHabitInput, setNewHabitInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Real-world Time state based on device calendar
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [timeLeftToMidnight, setTimeLeftToMidnight] = useState<string>('');

  const { habits, sleepHours, sleepQuality } = data;

  // Selected habits to plot on the Fluctuation & Comparison Graph
  const [selectedHabitIdsForChart, setSelectedHabitIdsForChart] = useState<string[]>(() => {
    return habits.slice(0, 3).map((h) => h.id);
  });

  // Keep selected habits synchronized if habits are deleted
  useEffect(() => {
    setSelectedHabitIdsForChart((prev) => {
      const validIds = prev.filter((id) => habits.some((h) => h.id === id));
      if (validIds.length === 0 && habits.length > 0) {
        return habits.slice(0, Math.min(3, habits.length)).map((h) => h.id);
      }
      return validIds;
    });
  }, [habits]);

  // Interactive state for Fluctuation & Comparison Graph
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);
  const [visibleTrends, setVisibleTrends] = useState<{
    habits: boolean;
    sleepQuality: boolean;
    sleepHours: boolean;
  }>({
    habits: true,
    sleepQuality: true,
    sleepHours: false,
  });

  // Constant 30 days continuous rolling window ending with Today (i = 0 is today at the end)
  const totalDaysInMonth = 30;

  // Compute the 30 continuous calendar days ending with Today at the end (index 29)
  const calendarDays = useMemo(() => {
    const list: {
      date: Date;
      dateKey: string;
      dayNum: number;
      monthNum: number;
      monthName: string;
      year: number;
      dayName: string;
      dayInitial: string;
      isToday: boolean;
      index: number;
    }[] = [];

    const now = currentTime;

    // 30 days: from 29 days ago (i=29) up to today (i=0)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey = getISODateKey(d);
      const dayOfWeek = d.getDay(); // 0 is Sun
      const dayName = ARABIC_DAYS[dayOfWeek];
      
      const dayInitial = dayName === 'الجمعة' ? 'ج' : dayName === 'السبت' ? 'س' : dayName === 'الأحد' ? 'ح' : dayName === 'الإثنين' ? 'ن' : dayName === 'الثلاثاء' ? 'ث' : dayName === 'الأربعاء' ? 'ر' : 'خ';
      const isToday = i === 0;

      list.push({
        date: d,
        dateKey,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        monthName: ARABIC_MONTHS[d.getMonth()],
        year: d.getFullYear(),
        dayName,
        dayInitial,
        isToday,
        index: 29 - i, // 0 to 29
      });
    }
    return list;
  }, [currentTime]);

  // Group and classify the 30 continuous days by their respective Month(s) for the table top header
  const monthSpans = useMemo(() => {
    const spans: { monthName: string; monthNum: number; year: number; count: number; startIndex: number }[] = [];
    calendarDays.forEach((day, idx) => {
      const lastSpan = spans[spans.length - 1];
      if (lastSpan && lastSpan.monthNum === day.monthNum && lastSpan.year === day.year) {
        lastSpan.count++;
      } else {
        spans.push({
          monthName: day.monthName,
          monthNum: day.monthNum,
          year: day.year,
          count: 1,
          startIndex: idx,
        });
      }
    });
    return spans;
  }, [calendarDays]);

  // Rolling 30-day midnight check logic:
  // Updates periodically every 60 seconds (no need for 1000ms re-render storm)
  useEffect(() => {
    const checkMidnightShift = () => {
      const now = new Date();
      setCurrentTime(now);

      const todayKey = getISODateKey(now);
      const lastDate = data.lastCalendarDate || todayKey;

      if (lastDate !== todayKey) {
        // Calculate how many days passed between lastDate and today
        const last = new Date(lastDate);
        const diffTime = Math.abs(now.getTime() - last.getTime());
        const diffDays = Math.min(30, Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24))));

        // Shift habits checks
        const updatedHabits = habits.map((h) => {
          let newChecks = [...h.checks];
          // ensure length 30
          while (newChecks.length < 30) newChecks.push(false);
          // Shift by diffDays (remove oldest, append false for new days)
          newChecks = newChecks.slice(diffDays);
          while (newChecks.length < 30) {
            newChecks.push(false);
          }
          return { ...h, checks: newChecks };
        });

        // Shift sleep data
        let newSleepHours = [...sleepHours];
        while (newSleepHours.length < 30) newSleepHours.push(7);
        newSleepHours = newSleepHours.slice(diffDays);
        while (newSleepHours.length < 30) newSleepHours.push(7);

        let newSleepQuality = [...sleepQuality];
        while (newSleepQuality.length < 30) newSleepQuality.push(8);
        newSleepQuality = newSleepQuality.slice(diffDays);
        while (newSleepQuality.length < 30) newSleepQuality.push(8);

        onUpdateData({
          ...data,
          lastCalendarDate: todayKey,
          habits: updatedHabits,
          sleepHours: newSleepHours,
          sleepQuality: newSleepQuality,
        });
      }

      // Calculate countdown to next midnight (00:00:00)
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeftToMidnight(`${hours} ساعة و ${mins} دقيقة`);
    };

    checkMidnightShift();
    const interval = setInterval(checkMidnightShift, 60000);
    return () => clearInterval(interval);
  }, [data.lastCalendarDate, habits, sleepHours, sleepQuality, onUpdateData]);

  // Toggle habit checkbox for a specific day index (0..totalDaysInMonth-1)
  const handleToggleDay = useCallback((habitId: string, dayIndex: number) => {
    playCheckSound(soundEnabled);
    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        const newChecks = [...h.checks];
        while (newChecks.length < totalDaysInMonth) {
          newChecks.push(false);
        }
        newChecks[dayIndex] = !newChecks[dayIndex];
        return { ...h, checks: newChecks };
      }
      return h;
    });
    onUpdateData({ ...data, habits: updatedHabits });
  }, [habits, data, onUpdateData, soundEnabled, totalDaysInMonth]);

  // Quick edit habit title
  const handleStartEdit = useCallback((habit: HabitItem) => {
    setEditingHabitId(habit.id);
    setEditingTitle(habit.title);
  }, []);

  const handleSaveEdit = useCallback((habitId: string) => {
    if (!editingTitle.trim()) return;
    const updatedHabits = habits.map((h) =>
      h.id === habitId ? { ...h, title: editingTitle.trim() } : h
    );
    onUpdateData({ ...data, habits: updatedHabits });
    setEditingHabitId(null);
    setEditingTitle('');
  }, [editingTitle, habits, data, onUpdateData]);

  const handleDeleteHabit = useCallback((habitId: string) => {
    const updatedHabits = habits.filter((h) => h.id !== habitId);
    onUpdateData({ ...data, habits: updatedHabits });
  }, [habits, data, onUpdateData]);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitInput.trim()) return;
    onAddHabit(newHabitInput.trim());
    setNewHabitInput('');
    setShowAddForm(false);
  };

  // Update sleep data
  const handleUpdateSleepHours = useCallback((index: number, val: number) => {
    const updated = [...sleepHours];
    while (updated.length < totalDaysInMonth) updated.push(7);
    updated[index] = Math.max(0, Math.min(24, val));
    onUpdateData({ ...data, sleepHours: updated });
  }, [sleepHours, data, onUpdateData, totalDaysInMonth]);

  const handleUpdateSleepQuality = useCallback((index: number, val: number) => {
    const updated = [...sleepQuality];
    while (updated.length < totalDaysInMonth) updated.push(8);
    updated[index] = Math.max(0, Math.min(10, val));
    onUpdateData({ ...data, sleepQuality: updated });
  }, [sleepQuality, data, onUpdateData, totalDaysInMonth]);

  // Daily statistics for all days of active month
  const dailyStats = useMemo(() => {
    return calendarDays.map((cDay) => {
      const idx = cDay.index;
      if (habits.length === 0) return { dayObj: cDay, completed: 0, percentage: 0 };
      const completed = habits.filter((h) => !!h.checks[idx]).length;
      const percentage = Math.round((completed / habits.length) * 100);
      return { dayObj: cDay, completed, percentage };
    });
  }, [habits, calendarDays]);

  // Top 5 committed habits for the month
  const topHabits = useMemo(() => {
    return [...habits]
      .map((h) => {
        const count = h.checks.slice(0, totalDaysInMonth).filter(Boolean).length;
        const rate = totalDaysInMonth > 0 ? (count / totalDaysInMonth) * 100 : 0;
        return { ...h, count, rate };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [habits, totalDaysInMonth]);

  // Weekly progress statistics within the active month
  const weeklyStats = useMemo(() => {
    const weekRanges = [
      { name: 'الأسبوع 1 (1 - 7)', start: 0, end: Math.min(6, totalDaysInMonth - 1) },
      { name: 'الأسبوع 2 (8 - 14)', start: 7, end: Math.min(13, totalDaysInMonth - 1) },
      { name: 'الأسبوع 3 (15 - 21)', start: 14, end: Math.min(20, totalDaysInMonth - 1) },
      { name: 'الأسبوع 4 (22 - 28)', start: 21, end: Math.min(27, totalDaysInMonth - 1) },
    ];

    if (totalDaysInMonth > 28) {
      weekRanges.push({
        name: `الأيام المتبقية (29 - ${totalDaysInMonth})`,
        start: 28,
        end: totalDaysInMonth - 1,
      });
    }

    return weekRanges
      .filter((w) => w.start < totalDaysInMonth)
      .map((w) => {
        let totalChecks = 0;
        let completedChecks = 0;
        habits.forEach((h) => {
          for (let i = w.start; i <= w.end; i++) {
            totalChecks++;
            if (h.checks[i]) completedChecks++;
          }
        });
        const percentage = totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0;
        return { ...w, percentage: Number(percentage.toFixed(2)) };
      });
  }, [habits, totalDaysInMonth]);

  // Sleep averages
  const avgSleepHours = useMemo(() => {
    if (sleepHours.length === 0) return '0.00';
    const sum = sleepHours.slice(0, totalDaysInMonth).reduce((a, b) => a + b, 0);
    return ((sum / (totalDaysInMonth * 8)) * 100).toFixed(2); // relative to 8h benchmark
  }, [sleepHours, totalDaysInMonth]);

  const avgSleepQuality = useMemo(() => {
    if (sleepQuality.length === 0) return '0.00';
    const sum = sleepQuality.slice(0, totalDaysInMonth).reduce((a, b) => a + b, 0);
    return ((sum / (totalDaysInMonth * 10)) * 100).toFixed(2);
  }, [sleepQuality, totalDaysInMonth]);

  // SVG Spline path for the continuous line chart
  const splinePath = useMemo(() => {
    const width = 1000;
    const height = 140;
    const len = dailyStats.length;
    if (len < 2) return '';
    const points = dailyStats.map((stat, i) => {
      const x = (i / (len - 1)) * width;
      const y = height - (stat.percentage / 100) * (height - 30) - 15;
      return { x, y };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [dailyStats]);

  // Dynamic comparison and fluctuation curves for the comparative chart
  const comparisonData = useMemo(() => {
    const len = calendarDays.length;
    if (len === 0) return { paths: { habitsLine: '', habitsArea: '', sleepQualityLine: '', sleepQualityArea: '', sleepHoursLine: '' }, habitCurves: [], points: [] };

    // Find all selected habits
    const selectedHabitsList = habits
      .filter((h) => selectedHabitIdsForChart.includes(h.id))
      .map((h) => {
        const originalIndex = habits.findIndex((item) => item.id === h.id);
        const color = HABIT_CHART_COLORS[originalIndex % HABIT_CHART_COLORS.length];
        return { ...h, color };
      });

    const points = calendarDays.map((cDay, i) => {
      const habitStat = dailyStats[i]?.percentage ?? 0;
      const sleepQ = Math.min(100, Math.max(0, ((sleepQuality[i] ?? 8) / 10) * 100));
      const sleepH = Math.min(100, Math.max(0, ((sleepHours[i] ?? 7) / 8) * 100));

      const habitStatuses: { [id: string]: { checked: boolean; title: string; color: typeof HABIT_CHART_COLORS[0] } } = {};
      selectedHabitsList.forEach((sh) => {
        habitStatuses[sh.id] = {
          checked: !!sh.checks[i],
          title: sh.title,
          color: sh.color,
        };
      });

      return {
        day: cDay,
        index: i,
        habits: habitStat,
        sleepQuality: Math.round(sleepQ),
        sleepHours: Math.round(sleepH),
        rawSleepQuality: sleepQuality[i] ?? 8,
        rawSleepHours: sleepHours[i] ?? 7,
        habitStatuses,
      };
    });

    const createPath = (values: number[], width = 400, height = 120) => {
      if (values.length < 2) return '';
      const step = width / (values.length - 1);
      const coords = values.map((val, idx) => ({
        x: idx * step,
        y: height - (val / 100) * (height - 24) - 12,
      }));

      let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i];
        const p1 = coords[i + 1];
        const mx = (p0.x + p1.x) / 2;
        d += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
      return d;
    };

    const createArea = (values: number[], width = 400, height = 120) => {
      const linePath = createPath(values, width, height);
      if (!linePath) return '';
      return `${linePath} L ${width} ${height} L 0 ${height} Z`;
    };

    // Calculate curves for each selected habit
    const habitCurves = selectedHabitsList.map((sh) => {
      // 100 if completed on that day, 0 if not completed
      const rawValues = calendarDays.map((_, idx) => (sh.checks[idx] ? 100 : 0));
      return {
        id: sh.id,
        title: sh.title,
        color: sh.color,
        linePath: createPath(rawValues),
        areaPath: createArea(rawValues),
        values: rawValues,
      };
    });

    return {
      points,
      habitCurves,
      paths: {
        habitsLine: createPath(points.map((p) => p.habits)),
        habitsArea: createArea(points.map((p) => p.habits)),
        sleepQualityLine: createPath(points.map((p) => p.sleepQuality)),
        sleepQualityArea: createArea(points.map((p) => p.sleepQuality)),
        sleepHoursLine: createPath(points.map((p) => p.sleepHours)),
      },
    };
  }, [calendarDays, dailyStats, sleepQuality, sleepHours, habits, selectedHabitIdsForChart]);

  const firstDay = calendarDays[0];
  const lastDay = calendarDays[calendarDays.length - 1];

  // Helper to toggle habit selection for comparison chart
  const handleToggleHabitChartSelection = (habitId: string) => {
    setSelectedHabitIdsForChart((prev) => {
      if (prev.includes(habitId)) {
        return prev.filter((id) => id !== habitId);
      } else {
        return [...prev, habitId];
      }
    });
  };

  const handleSelectAllHabitsForChart = () => {
    setSelectedHabitIdsForChart(habits.map((h) => h.id));
  };

  const handleClearHabitsForChart = () => {
    setSelectedHabitIdsForChart([]);
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto p-3 sm:p-6 space-y-6">
      
      {/* 1. Rolling 30 Days Status Bar */}
      <div className="bg-[#101735] border border-[#202d58] rounded-xl p-3.5 sm:p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-2">
              <span>تتبع الـ 30 يوماً المستمرة</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold">
                من {firstDay?.dayNum} {firstDay?.monthName} إلى {lastDay?.dayNum} {lastDay?.monthName} (اليوم)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>اليوم في آخر الأعمدة</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ترقيم الأيام مستمر تصاعدياً وينتهي باليوم الحالي، مع تصنيف وتجميع الأيام بالأعلى حسب الشهر التابع له.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-[#0b1024] border border-[#1e2b54] px-3 py-1.5 rounded-lg text-center font-mono-num text-xs">
            <span className="text-slate-400 text-[10px] ml-1.5">نهاية يوم اليوم:</span>
            <span className="font-bold text-cyan-300">{timeLeftToMidnight || 'مستمر'}</span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-md border border-blue-400/30 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>إضافة عادة</span>
          </button>
        </div>
      </div>

      {/* 2. Top Daily Progress Bar Chart */}
      <div className="bg-[#111938] border border-[#1f2b54] rounded-xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#1f2b54]">
          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-sm font-bold text-white tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 rounded-md">
              PROGRESS
            </span>
            <span className="text-xs text-slate-300 font-medium">
              معدل الإنجاز اليومي خلال آخر 30 يوماً (تنتهي باليوم في اليمين/الآخر)
            </span>
          </div>
          <div className="text-xs text-cyan-300 font-medium flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-lg">
            <Calendar className="w-4 h-4" />
            <span>30 يوماً متتالية</span>
          </div>
        </div>

        {/* Inline Add Habit form */}
        {showAddForm && (
          <form onSubmit={handleCreateHabit} className="mb-4 p-3 bg-[#0c1228] border border-[#27386b] rounded-lg flex items-center gap-2">
            <input
              type="text"
              placeholder="اكتب اسم العادة اليومية الجديدة..."
              value={newHabitInput}
              onChange={(e) => setNewHabitInput(e.target.value)}
              className="flex-1 bg-[#151f42] border border-[#2e4078] text-white text-xs px-3 py-2 rounded outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold shadow cursor-pointer"
            >
              إضافة
            </button>
          </form>
        )}

        {/* Day Bar Column Visuals for 30 continuous days */}
        <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-36 pt-4 px-1 sm:px-3 overflow-x-auto pb-2 scrollbar-none">
          {dailyStats.map((stat, idx) => {
            const weekIndex = Math.min(4, Math.floor(idx / 7));
            const weekColor = WEEK_COLORS[weekIndex];
            const barHeight = Math.max(8, stat.percentage);
            const isToday = stat.dayObj.isToday;

            return (
              <div key={idx} className="flex flex-col items-center min-w-[24px] sm:min-w-[32px] flex-1 relative group">
                {/* Day Number Tooltip / Date */}
                <span className={`text-[10px] font-mono-num mb-1 font-semibold ${isToday ? 'text-emerald-400 font-bold scale-110' : 'text-slate-400'}`}>
                  {stat.dayObj.dayNum}
                </span>

                {/* Vertical Bar with emerald highlight for today */}
                <div className={`w-full h-24 rounded-t-md flex items-end overflow-hidden transition-all ${
                  isToday
                    ? 'ring-2 ring-emerald-400 bg-[#1e2d5c] shadow-lg shadow-emerald-500/30'
                    : 'bg-[#162145] group-hover:bg-[#1a2752]'
                }`}>
                  <div
                    className="w-full transition-all duration-500 rounded-t-md"
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: isToday ? '#34d399' : weekColor.color,
                      boxShadow: isToday ? '0 0 14px #34d399' : `0 0 6px ${weekColor.bg}`,
                    }}
                  />
                </div>

                {/* Percentage Below Bar */}
                <span className={`text-[10px] font-mono-num font-bold mt-1.5 ${isToday ? 'text-emerald-400 font-extrabold' : 'text-slate-300'}`}>
                  {stat.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Habit Matrix Grid Organized with Month Classification on Top */}
      <div className="bg-[#101732] border border-[#1e2b52] rounded-xl shadow-xl overflow-x-auto">
        <table className="w-full text-right border-collapse min-w-[1250px]">
          
          {/* Top Month Classification Row: Spanning over days belonging to each month */}
          <thead>
            <tr className="border-b border-[#1f2b54] bg-[#0c1228]">
              {/* Habits Column Header */}
              <th className="p-3 text-sm font-bold text-slate-100 w-[250px] text-right border-l border-[#1f2b54]">
                العادات اليومية (30 يوماً)
              </th>

              {/* Month Spans: Classifying days by their actual calendar Month with adaptive width formatting */}
              {monthSpans.map((span, idx) => {
                const gradientClass = idx % 2 === 0
                  ? 'bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#172554] text-cyan-200'
                  : 'bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-indigo-200';
                
                const shortYear = String(span.year).slice(-2);
                const fullTitle = `شهر ${span.monthName} ${span.year}`;
                const mediumTitle = `شهر ${span.monthName} ${shortYear}`;
                const compactTitle = `${span.monthName} ${shortYear}`;
                const miniTitle = `${span.monthNum} / ${shortYear}`;

                return (
                  <th
                    key={`${span.year}-${span.monthNum}-${idx}`}
                    colSpan={span.count}
                    className={`py-2 px-1 sm:px-2 text-center border-l border-[#1f2b54] ${gradientClass} shadow-inner overflow-hidden`}
                    title={`${fullTitle} (${span.count} ${span.count === 1 ? 'يوم' : span.count === 2 ? 'يومان' : span.count <= 10 ? 'أيام' : 'يوماً'})`}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-extrabold tracking-wide overflow-hidden">
                      {/* Calendar Icon shown when space allows */}
                      {span.count >= 4 && (
                        <Calendar className="w-3.5 h-3.5 text-cyan-300 shrink-0 hidden sm:block" />
                      )}
                      
                      {/* Adaptive Month Title based on available day count and responsive width */}
                      {span.count >= 10 ? (
                        <span className="whitespace-nowrap truncate">
                          <span className="hidden xl:inline">{fullTitle}</span>
                          <span className="hidden md:inline xl:hidden">{mediumTitle}</span>
                          <span className="hidden sm:inline md:hidden">{compactTitle}</span>
                          <span className="sm:hidden">{miniTitle}</span>
                        </span>
                      ) : span.count >= 6 ? (
                        <span className="whitespace-nowrap truncate">
                          <span className="hidden md:inline">{mediumTitle}</span>
                          <span className="hidden sm:inline md:hidden">{compactTitle}</span>
                          <span className="sm:hidden">{miniTitle}</span>
                        </span>
                      ) : span.count >= 3 ? (
                        <span className="whitespace-nowrap truncate text-[11px] sm:text-xs">
                          <span className="hidden sm:inline">{compactTitle}</span>
                          <span className="sm:hidden">{miniTitle}</span>
                        </span>
                      ) : (
                        <span className="whitespace-nowrap font-mono-num text-[11px] font-bold px-0.5">
                          {miniTitle}
                        </span>
                      )}

                      {/* Day Count Badge */}
                      {span.count >= 6 ? (
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-black/40 border border-white/20 shrink-0 whitespace-nowrap hidden sm:inline">
                          {span.count} {span.count === 1 ? 'يوم' : span.count === 2 ? 'يومان' : span.count <= 10 ? 'أيام' : 'يوماً'}
                        </span>
                      ) : span.count >= 3 ? (
                        <span className="text-[9px] font-normal px-1.5 py-0.2 rounded bg-black/40 border border-white/10 shrink-0 whitespace-nowrap hidden sm:inline">
                          {span.count} ي
                        </span>
                      ) : null}
                    </div>
                  </th>
                );
              })}

              {/* Right Summary Headers */}
              <th colSpan={3} className="py-2.5 px-4 text-center text-xs font-bold text-slate-200 bg-[#0e152e]">
                التقدم الكلي
              </th>
            </tr>

            {/* Subheader: Day Numbers & Letters Row (Days Underneath the Month) */}
            <tr className="border-b border-[#1c274c] bg-[#121a38] text-[10px] text-slate-400 font-mono-num text-center">
              <th className="p-2.5 text-right font-sans text-xs font-semibold text-slate-300 border-l border-[#1c274c]">
                العادة
              </th>

              {/* Day Headers (1 to 30) */}
              {calendarDays.map((cDay, idx) => {
                const weekIndex = Math.min(4, Math.floor(idx / 7));
                const weekColor = WEEK_COLORS[weekIndex];
                const isToday = cDay.isToday;

                return (
                  <th
                    key={cDay.dateKey}
                    className={`p-1 min-w-[28px] border-l border-[#182348] relative ${
                      isToday ? 'bg-emerald-950/70 ring-1 ring-emerald-400 font-bold' : ''
                    }`}
                    style={{ color: isToday ? '#34d399' : weekColor.text }}
                    title={`${cDay.dayName} ${cDay.dayNum} ${cDay.monthName} ${cDay.year}`}
                  >
                    <div className="text-[9px] opacity-80">{cDay.dayInitial}</div>
                    <div className="font-bold text-[11px]">{cDay.dayNum}</div>
                    {isToday && (
                      <div className="text-[8px] text-emerald-400 font-extrabold">اليوم</div>
                    )}
                  </th>
                );
              })}

              {/* Summary columns subheaders */}
              <th className="py-2 px-3 text-xs font-semibold text-slate-300 border-r border-[#1c274c] w-14 text-center">
                الهدف
              </th>
              <th className="py-2 px-4 text-xs font-semibold text-slate-300 w-48 sm:w-56 text-center">
                التقدم
              </th>
              <th className="py-2 px-3 text-xs font-semibold text-slate-300 w-20 text-center">
                عدد الأيام
              </th>
            </tr>
          </thead>

          {/* Habit Matrix Rows */}
          <tbody>
            {habits.length === 0 ? (
              <tr>
                <td colSpan={totalDaysInMonth + 4} className="py-12 text-center text-slate-400 bg-[#0e142c]">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Calendar className="w-8 h-8 text-cyan-400 opacity-60" />
                    <p className="text-sm font-semibold text-slate-300">لا توجد عادات مسجلة بعد</p>
                    <p className="text-xs text-slate-400">الأداة نظيفة وجاهزة، ابدأ بإضافة عاداتك اليومية للتتبع.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 font-bold transition shadow cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>إضافة عادة يومية الآن</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              habits.map((habit, habitIdx) => {
                const completedDaysCount = habit.checks.slice(0, totalDaysInMonth).filter(Boolean).length;
                const rate = (completedDaysCount / totalDaysInMonth) * 100;
                const barColor = rate >= 80 ? '#38bdf8' : rate >= 50 ? '#34d399' : '#facc15';

                return (
                  <tr
                    key={habit.id}
                    className="border-b border-[#1a254a] hover:bg-[#151f40] transition-colors group"
                  >
                    {/* Habit Name + Index Number */}
                    <td className="p-3 text-xs text-slate-200 border-l border-[#1c274c]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[10px] font-mono-num bg-[#182245] text-slate-400 px-2 py-0.5 rounded font-bold">
                            {habitIdx + 1}
                          </span>
                          {editingHabitId === habit.id ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(habit.id)}
                                className="w-full bg-[#0a0f21] border border-blue-400 text-white text-xs px-2.5 py-1 rounded outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(habit.id)}
                                className="text-[10px] bg-blue-600 px-2 py-1 rounded text-white font-bold cursor-pointer"
                              >
                                تم
                              </button>
                            </div>
                          ) : (
                            <span
                              onDoubleClick={() => handleStartEdit(habit)}
                              className="font-medium truncate text-right cursor-pointer hover:text-white"
                              title={habit.title}
                            >
                              {habit.title}
                            </span>
                          )}
                        </div>

                        {/* Action buttons on row hover */}
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(habit)}
                            className="p-1 rounded transition hover:scale-110 shadow-sm cursor-pointer"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#38bdf8',
                            }}
                            title="تعديل اسم العادة"
                          >
                            <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: '#38bdf8' }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="p-1 rounded transition hover:scale-110 shadow-sm cursor-pointer"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#fb7185',
                            }}
                            title="حذف العادة"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: '#fb7185' }} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Day Checkbox Cells (30 continuous days) */}
                    {calendarDays.map((cDay, dayIdx) => {
                      const isChecked = !!habit.checks[dayIdx];
                      const weekIdx = Math.min(4, Math.floor(dayIdx / 7));
                      const weekColor = WEEK_COLORS[weekIdx];
                      const isToday = cDay.isToday;

                      return (
                        <td
                          key={cDay.dateKey}
                          className={`p-1 text-center border-l border-[#172144] ${
                            isToday ? 'bg-emerald-950/30' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleDay(habit.id, dayIdx)}
                            className={`w-4 h-4 rounded-sm mx-auto flex items-center justify-center transition border cursor-pointer ${
                              isChecked
                                ? 'border-transparent text-white shadow-sm'
                                : isToday
                                ? 'bg-[#18264d] border-emerald-500/60 text-transparent hover:border-emerald-400'
                                : 'bg-[#141c3a] border-[#273665] text-transparent hover:border-slate-400'
                            }`}
                            style={{
                              backgroundColor: isChecked ? weekColor.color : undefined,
                            }}
                            title={`${habit.title} - ${cDay.dayName} (${cDay.dayNum} ${cDay.monthName})`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        </td>
                      );
                    })}

                    {/* Target */}
                    <td className="py-2.5 px-3 text-center text-xs font-mono-num font-bold text-slate-300 border-r border-[#1c274c]">
                      {totalDaysInMonth}
                    </td>

                    {/* Progress Bar + % */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono-num font-bold text-slate-200 w-10 text-left">
                          {Math.round(rate)}%
                        </span>
                        <div className="flex-1 h-2.5 bg-[#172247] rounded-full overflow-hidden border border-[#233160]">
                          <div
                            className="h-full rounded-full transition-all duration-300 shadow-sm"
                            style={{
                              width: `${rate}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Fraction count */}
                    <td className="py-2.5 px-3 text-center text-xs font-mono-num font-bold text-slate-200">
                      {completedDaysCount} / {totalDaysInMonth}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Middle Analytics: Trend Chart & Sleep Logs */}
      <div className="bg-[#111938] border border-[#1f2b54] rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
        
        {/* Continuous Spline Trend Chart (0% - 100%) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>منحنى الالتزام والإنتاجية خلال آخر 30 يوماً (100% - 0%)</span>
            </span>
          </div>

          <div className="h-32 w-full bg-[#0c1228] rounded-lg p-2 border border-[#1c274c] relative overflow-hidden flex items-center">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
              <div className="border-b border-slate-400 w-full text-[9px] text-slate-400">100%</div>
              <div className="border-b border-slate-400 w-full text-[9px] text-slate-400">75%</div>
              <div className="border-b border-slate-400 w-full text-[9px] text-slate-400">50%</div>
              <div className="border-b border-slate-400 w-full text-[9px] text-slate-400">25%</div>
            </div>

            {/* Smooth SVG Spline */}
            <svg
              viewBox="0 0 1000 140"
              className="w-full h-full overflow-visible z-10"
              preserveAspectRatio="none"
            >
              <path
                d={splinePath}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(45, 212, 191, 0.5))',
                }}
              />
            </svg>
          </div>
        </div>

        {/* Sleep Log Cards - Responsive & Mobile-Optimized */}
        <div className="space-y-3 pt-2 border-t border-[#1d2950]">
          
          {/* Card 1: ساعات النوم */}
          <div className="bg-[#0d132a] p-3 sm:p-3.5 rounded-xl border border-[#1d2b56] space-y-2.5 shadow-md">
            {/* Header: Title & Average Gauge */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#182348]">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block">ساعات النوم اليومية</span>
                  <span className="text-[10px] text-slate-400 font-medium">الهدف الموصى به: 8 ساعات يومياً</span>
                </div>
              </div>

              {/* Average Pill (Never overlaps inputs) */}
              <div className="flex items-center gap-2.5 bg-[#121a3a] px-3 py-1.5 rounded-lg border border-[#202d5a] shadow-inner">
                <span className="text-xs font-semibold text-slate-300">المعدل:</span>
                <div className="w-20 sm:w-28 h-2.5 bg-[#172247] rounded-full overflow-hidden border border-[#243362]">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Number(avgSleepHours))}%` }}
                  />
                </div>
                <span className="text-xs font-mono-num font-extrabold text-cyan-300">{avgSleepHours}%</span>
              </div>
            </div>

            {/* Days Inputs Track (Smooth Touch Scrolling with Day Numbers) */}
            <div className="overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
              <div className="flex items-center gap-1.5 min-w-max pt-1 px-1">
                {calendarDays.map((cDay, idx) => (
                  <div key={cDay.dateKey} className="flex flex-col items-center gap-1">
                    <span className={`text-[9px] font-mono-num ${cDay.isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                      {cDay.dayNum}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={sleepHours[idx] ?? 7}
                      onChange={(e) => handleUpdateSleepHours(idx, parseInt(e.target.value) || 0)}
                      className={`w-7 h-6 text-center font-mono-num text-[11px] font-bold text-slate-200 rounded border outline-none focus:border-cyan-400 transition-colors ${
                        cDay.isToday ? 'bg-[#1e2f5e] border-emerald-400 ring-1 ring-emerald-400/60' : 'bg-[#162145] border-[#27386d]'
                      }`}
                      title={`${cDay.dayName} (${cDay.dayNum} ${cDay.monthName})`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: تقييم جودة النوم */}
          <div className="bg-[#0d132a] p-3 sm:p-3.5 rounded-xl border border-[#1d2b56] space-y-2.5 shadow-md">
            {/* Header: Title & Average Gauge */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#182348]">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block">تقييم جودة النوم</span>
                  <span className="text-[10px] text-slate-400 font-medium">التقييم من (1 إلى 10)</span>
                </div>
              </div>

              {/* Average Pill (Never overlaps inputs) */}
              <div className="flex items-center gap-2.5 bg-[#121a3a] px-3 py-1.5 rounded-lg border border-[#202d5a] shadow-inner">
                <span className="text-xs font-semibold text-slate-300">المعدل:</span>
                <div className="w-20 sm:w-28 h-2.5 bg-[#172247] rounded-full overflow-hidden border border-[#243362]">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Number(avgSleepQuality))}%` }}
                  />
                </div>
                <span className="text-xs font-mono-num font-extrabold text-amber-300">{avgSleepQuality}%</span>
              </div>
            </div>

            {/* Days Inputs Track (Smooth Touch Scrolling with Day Numbers) */}
            <div className="overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
              <div className="flex items-center gap-1.5 min-w-max pt-1 px-1">
                {calendarDays.map((cDay, idx) => (
                  <div key={cDay.dateKey} className="flex flex-col items-center gap-1">
                    <span className={`text-[9px] font-mono-num ${cDay.isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                      {cDay.dayNum}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={sleepQuality[idx] ?? 8}
                      onChange={(e) => handleUpdateSleepQuality(idx, parseInt(e.target.value) || 0)}
                      className={`w-7 h-6 text-center font-mono-num text-[11px] font-bold text-amber-200 rounded border outline-none focus:border-amber-400 transition-colors ${
                        cDay.isToday ? 'bg-[#1e2f5e] border-amber-400 ring-1 ring-amber-400/60' : 'bg-[#162145] border-[#27386d]'
                      }`}
                      title={`${cDay.dayName} (${cDay.dayNum} ${cDay.monthName})`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 5. Bottom Analytics: Top Habits, Comparison Chart with Custom Habit Selector, & Weekly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: أكثر العادات التزاماً (Top 5 committed habits) */}
        <div className="lg:col-span-3 bg-[#111938] border border-[#1f2b54] rounded-xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-[#1e2b54]">
              <Award className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-100">أكثر العادات التزاماً</h4>
            </div>

            <div className="space-y-2.5">
              {topHabits.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  لا توجد عادات مسجلة بعد لعرض الترتيب
                </div>
              ) : (
                topHabits.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#141d3e] border border-[#202d58] hover:border-amber-500/40 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono-num font-bold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-xs text-slate-200 font-medium truncate">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-xs font-mono-num font-bold text-cyan-300 shrink-0 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
                      {Math.round(item.rate)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center: Dynamic Comparative Habit & Sleep Fluctuation Chart with Adding / Removing Custom Habits */}
        <div className="lg:col-span-6 bg-[#111938] border border-[#1f2b54] rounded-xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#1e2b54]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-slate-100">مقارنة وتذبذب الالتزام</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                تتبع مسار العادات المحددة خلال آخر 30 يوماً
              </span>
            </div>

            {/* General metrics toggle chips */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() => setVisibleTrends((prev) => ({ ...prev, habits: !prev.habits }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition border cursor-pointer ${
                  visibleTrends.habits
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-[#141c3d] text-slate-400 border-slate-700/50 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>إجمالي العادات العامة</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibleTrends((prev) => ({ ...prev, sleepQuality: !prev.sleepQuality }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition border cursor-pointer ${
                  visibleTrends.sleepQuality
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                    : 'bg-[#141c3d] text-slate-400 border-slate-700/50 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>جودة النوم</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibleTrends((prev) => ({ ...prev, sleepHours: !prev.sleepHours }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition border cursor-pointer ${
                  visibleTrends.sleepHours
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-[#141c3d] text-slate-400 border-slate-700/50 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>ساعات النوم</span>
              </button>
            </div>

            {/* Custom Habits Selector for Graph (إضافة وإزالة العادات المحددة) */}
            <div className="bg-[#0b1024] border border-[#1d2a54] rounded-lg p-2.5 mb-3">
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#182348]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>تحديد العادات المعروضة في الرسم البياني:</span>
                </div>

                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={handleSelectAllHabitsForChart}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                  >
                    تحديد الكل
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={handleClearHabitsForChart}
                    className="text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {habits.length === 0 ? (
                <div className="text-[11px] text-slate-400 text-center py-1">لا توجد عادات مسجلة للاختيار</div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {habits.map((habit, idx) => {
                    const isSelected = selectedHabitIdsForChart.includes(habit.id);
                    const colorStyle = HABIT_CHART_COLORS[idx % HABIT_CHART_COLORS.length];

                    return (
                      <button
                        key={habit.id}
                        type="button"
                        onClick={() => handleToggleHabitChartSelection(habit.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition border cursor-pointer ${
                          isSelected
                            ? `${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} shadow-sm ring-1 ring-white/10`
                            : 'bg-[#121936] text-slate-400 border-slate-700/50 hover:border-slate-500 opacity-60'
                        }`}
                        title={isSelected ? 'انقر لإزالة العادة من الرسم' : 'انقر لإضافة العادة للرسم'}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: isSelected ? colorStyle.stroke : '#64748b' }}
                        />
                        <span className="truncate max-w-[130px]">{habit.title}</span>
                        {isSelected ? (
                          <Eye className="w-3 h-3 text-emerald-400 shrink-0 mr-0.5" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-slate-500 shrink-0 mr-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Interactive SVG Chart Container */}
            <div
              className="h-44 bg-[#0c1228] rounded-xl p-3 border border-[#1b264d] relative overflow-hidden flex flex-col justify-between select-none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                const total = comparisonData.points.length;
                if (total > 0) {
                  const idx = Math.min(total - 1, Math.max(0, Math.round((x / rect.width) * (total - 1))));
                  setChartHoverIndex(idx);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
                  const total = comparisonData.points.length;
                  if (total > 0) {
                    const idx = Math.min(total - 1, Math.max(0, Math.round((x / rect.width) * (total - 1))));
                    setChartHoverIndex(idx);
                  }
                }
              }}
              onMouseLeave={() => setChartHoverIndex(null)}
              onTouchEnd={() => setChartHoverIndex(null)}
            >
              <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  {/* Cyan Gradient for Habits */}
                  <linearGradient id="habitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Purple Gradient for Sleep Quality */}
                  <linearGradient id="sleepQGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="20" x2="400" y2="20" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />

                {/* 1. General Habits Area and Line */}
                {visibleTrends.habits && comparisonData.paths.habitsArea && (
                  <path d={comparisonData.paths.habitsArea} fill="url(#habitsGradient)" />
                )}
                {visibleTrends.habits && comparisonData.paths.habitsLine && (
                  <path
                    d={comparisonData.paths.habitsLine}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}

                {/* 2. Sleep Quality Area and Line */}
                {visibleTrends.sleepQuality && comparisonData.paths.sleepQualityArea && (
                  <path d={comparisonData.paths.sleepQualityArea} fill="url(#sleepQGradient)" />
                )}
                {visibleTrends.sleepQuality && comparisonData.paths.sleepQualityLine && (
                  <path
                    d={comparisonData.paths.sleepQualityLine}
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}

                {/* 3. Sleep Hours Line */}
                {visibleTrends.sleepHours && comparisonData.paths.sleepHoursLine && (
                  <path
                    d={comparisonData.paths.sleepHoursLine}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}

                {/* 4. Custom Individual Selected Habits Lines */}
                {comparisonData.habitCurves.map((curve) => (
                  <path
                    key={curve.id}
                    d={curve.linePath}
                    fill="none"
                    stroke={curve.color.stroke}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className="transition-all duration-300"
                    style={{
                      filter: `drop-shadow(0 0 4px ${curve.color.stroke})`,
                    }}
                  />
                ))}

                {/* Active Hover Guide & Intersection Dots */}
                {chartHoverIndex !== null && comparisonData.points[chartHoverIndex] && (
                  (() => {
                    const total = comparisonData.points.length;
                    const hx = total > 1 ? (chartHoverIndex / (total - 1)) * 400 : 200;
                    const p = comparisonData.points[chartHoverIndex];
                    const hyHabit = 120 - (p.habits / 100) * 96 - 12;
                    const hySleepQ = 120 - (p.sleepQuality / 100) * 96 - 12;
                    const hySleepH = 120 - (p.sleepHours / 100) * 96 - 12;

                    return (
                      <g>
                        {/* Vertical Guide Line */}
                        <line
                          x1={hx}
                          y1="6"
                          x2={hx}
                          y2="114"
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                          className="opacity-90"
                        />
                        {/* Dots */}
                        {visibleTrends.habits && (
                          <circle cx={hx} cy={hyHabit} r="4" fill="#38bdf8" stroke="#0c1228" strokeWidth="2" />
                        )}
                        {visibleTrends.sleepQuality && (
                          <circle cx={hx} cy={hySleepQ} r="3.5" fill="#c084fc" stroke="#0c1228" strokeWidth="2" />
                        )}
                        {visibleTrends.sleepHours && (
                          <circle cx={hx} cy={hySleepH} r="3.5" fill="#34d399" stroke="#0c1228" strokeWidth="2" />
                        )}
                        {/* Intersection Dots for each selected habit */}
                        {comparisonData.habitCurves.map((curve) => {
                          const val = curve.values[chartHoverIndex] ?? 0;
                          const cy = 120 - (val / 100) * 96 - 12;
                          return (
                            <circle
                              key={curve.id}
                              cx={hx}
                              cy={cy}
                              r="3.5"
                              fill={curve.color.stroke}
                              stroke="#0c1228"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </g>
                    );
                  })()
                )}
              </svg>

              {/* Hover Tooltip Overlay */}
              {chartHoverIndex !== null && comparisonData.points[chartHoverIndex] && (
                (() => {
                  const pt = comparisonData.points[chartHoverIndex];
                  return (
                    <div
                      className="absolute top-2 left-2 pointer-events-none bg-[#090d1c]/95 border border-cyan-500/40 backdrop-blur-md px-3 py-2 rounded-lg shadow-2xl text-[11px] space-y-1 z-20 max-w-[240px]"
                    >
                      <div className="font-bold text-white flex items-center justify-between border-b border-slate-700/60 pb-1 gap-2">
                        <span className="text-cyan-300">{pt.day.dayName}</span>
                        <span className="text-slate-300 font-mono-num">{pt.day.dayNum} {pt.day.monthName} {pt.day.isToday ? '(اليوم)' : ''}</span>
                      </div>

                      <div className="pt-0.5 space-y-1 font-mono-num text-[10px]">
                        {visibleTrends.habits && (
                          <div className="flex items-center justify-between gap-3 text-cyan-300">
                            <span className="text-slate-400 font-sans">إجمالي العادات:</span>
                            <span className="font-bold">{pt.habits}%</span>
                          </div>
                        )}
                        {visibleTrends.sleepQuality && (
                          <div className="flex items-center justify-between gap-3 text-purple-300">
                            <span className="text-slate-400 font-sans">جودة النوم:</span>
                            <span className="font-bold">{pt.rawSleepQuality}/10 ({pt.sleepQuality}%)</span>
                          </div>
                        )}
                        {visibleTrends.sleepHours && (
                          <div className="flex items-center justify-between gap-3 text-emerald-300">
                            <span className="text-slate-400 font-sans">ساعات النوم:</span>
                            <span className="font-bold">{pt.rawSleepHours} س ({pt.sleepHours}%)</span>
                          </div>
                        )}

                        {/* Selected habits specific status */}
                        {comparisonData.habitCurves.length > 0 && (
                          <div className="pt-1 border-t border-slate-800 space-y-0.5">
                            {comparisonData.habitCurves.map((hc) => {
                              const isDone = hc.values[chartHoverIndex] === 100;
                              return (
                                <div key={hc.id} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{ backgroundColor: hc.color.stroke }}
                                    />
                                    <span className="text-slate-300 truncate max-w-[120px] font-sans">
                                      {hc.title}:
                                    </span>
                                  </div>
                                  <span
                                    className="font-bold shrink-0 text-[9px]"
                                    style={{ color: isDone ? hc.color.stroke : '#94a3b8' }}
                                  >
                                    {isDone ? 'منجز (100%)' : 'لم ينجز (0%)'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Bottom day indicators */}
              <div className="flex items-center justify-between text-[9px] font-mono-num text-slate-500 pt-1 border-t border-[#172042]">
                <span>{firstDay?.dayNum} {firstDay?.monthName}</span>
                <span>منتصف الـ 30 يوماً</span>
                <span className="text-emerald-400 font-bold">{lastDay?.dayNum} {lastDay?.monthName} (اليوم)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Weekly Progress Bars */}
        <div className="lg:col-span-3 bg-[#111938] border border-[#1f2b54] rounded-xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-[#1e2b54]">
              <h4 className="text-sm font-bold text-slate-100">التقدم الأسبوعي</h4>
              <span className="text-xs text-slate-400 font-medium">النسبة المئوية</span>
            </div>

            <div className="space-y-3">
              {weeklyStats.map((week) => (
                <div key={week.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{week.name}</span>
                    <span className="font-mono-num font-bold text-teal-300">
                      {week.percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-3 bg-[#162145] rounded-full overflow-hidden border border-[#233160] p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${week.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
});

