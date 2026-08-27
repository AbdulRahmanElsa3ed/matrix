import React, { useState, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { TaskItem } from '../types';
import { DonutGauge } from './DonutGauge';
import { Check, Plus, Trash2, Edit2, Calendar, ChevronRight, ChevronLeft, CalendarDays, Eye, Filter } from 'lucide-react';
import { playCheckSound, playGoalCelebrationSound } from '../utils/audio';
import { ARABIC_DAYS, getISODateKey } from '../data/defaultData';
import { getDynamicActionColors } from '../utils/colorUtils';

interface TasksViewProps {
  tasksByDate: Record<string, TaskItem[]>;
  onUpdateTasksForDate: (dateKey: string, tasks: TaskItem[]) => void;
  onAddTaskToDate: (dateKey: string, text: string, color: string) => void;
  soundEnabled: boolean;
  weekOffset?: number;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onCurrentWeek?: () => void;
}

const DAY_COLORS = ['#f472b6', '#f87171', '#4ade80', '#facc15', '#34d399', '#38bdf8', '#818cf8'];

export const TasksView: React.FC<TasksViewProps> = React.memo(({
  tasksByDate,
  onUpdateTasksForDate,
  onAddTaskToDate,
  soundEnabled,
  weekOffset = 0,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [quickInputDateKey, setQuickInputDateKey] = useState<string | null>(null);
  const [quickInputText, setQuickInputText] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null); // null = show all 7 days

  // Today reference
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getISODateKey(today), [today]);

  // Calculate the 7 dynamic days of the navigated week
  const dynamicDays = useMemo(() => {
    const list = [];
    const baseNow = new Date();
    const currentDayOfWeek = baseNow.getDay();
    const diffToSaturday = (currentDayOfWeek + 1) % 7;
    
    const startOfWeek = new Date(baseNow);
    startOfWeek.setDate(baseNow.getDate() - diffToSaturday + (weekOffset * 7));

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const dateKey = getISODateKey(d);
      const dayNum = d.getDate();
      const monthNum = d.getMonth() + 1;
      const yearNum = d.getFullYear();
      const dateString = `${dayNum}/${monthNum}/${yearNum}`;
      const dayName = ARABIC_DAYS[d.getDay()];
      const isToday = dateKey === todayKey;

      const tasks = tasksByDate[dateKey] || [];

      list.push({
        dateKey,
        dayName,
        dateStr: dateString,
        dateObj: d,
        dayIndex: i,
        tasks,
        isToday,
      });
    }

    return list;
  }, [weekOffset, tasksByDate, todayKey]);

  // Week Date Range text in Arabic
  const weekRangeText = useMemo(() => {
    if (dynamicDays.length === 0) return '';
    const first = dynamicDays[0];
    const last = dynamicDays[dynamicDays.length - 1];
    return `من ${first.dayName} (${first.dateStr}) إلى ${last.dayName} (${last.dateStr})`;
  }, [dynamicDays]);

  const handleToggleTask = useCallback((dateKey: string, taskId: string) => {
    playCheckSound(soundEnabled);
    const dayTasks = tasksByDate[dateKey] || [];
    const updatedTasks = dayTasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    // If day reaches 100% completion
    const prevCompleted = dayTasks.filter((t) => t.completed).length;
    const nowCompleted = updatedTasks.filter((t) => t.completed).length;
    if (nowCompleted === updatedTasks.length && prevCompleted < updatedTasks.length && updatedTasks.length > 0) {
      playGoalCelebrationSound(soundEnabled);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    onUpdateTasksForDate(dateKey, updatedTasks);
  }, [soundEnabled, tasksByDate, onUpdateTasksForDate]);

  const handleStartEditTask = useCallback((task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  }, []);

  const handleSaveEditTask = useCallback((dateKey: string, taskId: string) => {
    if (!editingText.trim()) return;
    const dayTasks = tasksByDate[dateKey] || [];
    const updatedTasks = dayTasks.map((t) =>
      t.id === taskId ? { ...t, text: editingText.trim() } : t
    );
    onUpdateTasksForDate(dateKey, updatedTasks);
    setEditingTaskId(null);
    setEditingText('');
  }, [editingText, tasksByDate, onUpdateTasksForDate]);

  const handleDeleteTask = useCallback((dateKey: string, taskId: string) => {
    const dayTasks = tasksByDate[dateKey] || [];
    const updatedTasks = dayTasks.filter((t) => t.id !== taskId);
    onUpdateTasksForDate(dateKey, updatedTasks);
  }, [tasksByDate, onUpdateTasksForDate]);

  const handleQuickAdd = useCallback((dateKey: string, defaultColor: string) => {
    if (!quickInputText.trim()) return;
    onAddTaskToDate(dateKey, quickInputText.trim(), defaultColor);
    setQuickInputText('');
    setQuickInputDateKey(null);
  }, [quickInputText, onAddTaskToDate]);

  // Day navigation jumper helpers
  const handlePrevDay = useCallback(() => {
    if (selectedDayIndex === null) {
      setSelectedDayIndex(0);
    } else if (selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1);
    } else {
      if (onPrevWeek) onPrevWeek();
      setSelectedDayIndex(6);
    }
  }, [selectedDayIndex, onPrevWeek]);

  const handleNextDay = useCallback(() => {
    if (selectedDayIndex === null) {
      setSelectedDayIndex(0);
    } else if (selectedDayIndex < 6) {
      setSelectedDayIndex(selectedDayIndex + 1);
    } else {
      if (onNextWeek) onNextWeek();
      setSelectedDayIndex(0);
    }
  }, [selectedDayIndex, onNextWeek]);

  const handleSelectToday = () => {
    if (onCurrentWeek) onCurrentWeek();
    const todayIndex = dynamicDays.findIndex((d) => d.isToday);
    if (todayIndex !== -1) {
      setSelectedDayIndex(todayIndex);
    } else {
      setSelectedDayIndex(null);
    }
  };

  // Visible days based on selection filter
  const visibleDays = selectedDayIndex !== null
    ? [dynamicDays[selectedDayIndex]]
    : dynamicDays;

  // Mini Chart data
  const daysForChart = [...dynamicDays];

  return (
    <div className="w-full max-w-[1680px] mx-auto p-3 sm:p-6 space-y-5">
      
      {/* 1. Date & Week Navigation Toolbar */}
      <div className="bg-[#101735] border border-[#202d58] rounded-xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Week Switcher Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={onPrevWeek}
            className="flex items-center gap-1 bg-[#162044] hover:bg-[#1f2d5e] text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-[#25366c]"
            title="الأسبوع السابق"
          >
            <ChevronRight className="w-4 h-4" />
            <span>الأسبوع السابق</span>
          </button>

          <button
            onClick={handleSelectToday}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition transform active:scale-95 border border-emerald-400/30"
            title="الرجوع إلى اليوم والأسبوع الحالي"
          >
            <CalendarDays className="w-4 h-4" />
            <span>اليوم / هذا الأسبوع</span>
          </button>

          <button
            onClick={onNextWeek}
            className="flex items-center gap-1 bg-[#162044] hover:bg-[#1f2d5e] text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-[#25366c]"
            title="الأسبوع التالي"
          >
            <span>الأسبوع التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Current Week Date Range Badge */}
        <div className="bg-[#0b1024] border border-[#1e2b54] rounded-lg px-4 py-1.5 text-center">
          <div className="text-xs sm:text-sm font-bold text-white font-mono-num flex items-center justify-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>{weekRangeText}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            {weekOffset === 0 ? 'الأسبوع الحالي النشط' : weekOffset > 0 ? `بعد ${weekOffset} أسبوع` : `قبل ${Math.abs(weekOffset)} أسبوع`}
          </div>
        </div>

        {/* Day-by-Day Jumper Controls */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
          <button
            onClick={handlePrevDay}
            className="p-1.5 bg-[#162044] hover:bg-[#1f2d5e] text-slate-300 hover:text-white rounded-lg text-xs transition border border-[#25366c]"
            title="اليوم السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDayIndex(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              selectedDayIndex === null
                ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                : 'bg-[#162044] text-slate-300 border-[#25366c] hover:bg-[#1f2d5e]'
            }`}
          >
            عرض كافة الأيام (7)
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 bg-[#162044] hover:bg-[#1f2d5e] text-slate-300 hover:text-white rounded-lg text-xs transition border border-[#25366c]"
            title="اليوم التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Days Chips / Tabs (Quick filter by specific day) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
        <button
          onClick={() => setSelectedDayIndex(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
            selectedDayIndex === null
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#121938] text-slate-400 hover:text-white hover:bg-[#1a244d] border border-[#1f2b54]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>كل الأيام</span>
        </button>

        {dynamicDays.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          const completedCount = day.tasks.filter((t) => t.completed).length;
          const totalCount = day.tasks.length;
          const dayColor = DAY_COLORS[idx % DAY_COLORS.length];

          return (
            <button
              key={day.dateKey}
              onClick={() => setSelectedDayIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border relative ${
                isSelected
                  ? 'text-white shadow-md border-white/40'
                  : 'bg-[#121938] text-slate-300 hover:text-white hover:bg-[#1a244d] border-[#1f2b54]'
              }`}
              style={{
                backgroundColor: isSelected ? dayColor : undefined,
                color: isSelected ? '#000000' : undefined,
              }}
            >
              <span>{day.dayName}</span>
              <span className="text-[10px] font-mono-num opacity-75">({day.dateStr.split('/')[0]}/{day.dateStr.split('/')[1]})</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/25 text-white font-mono-num">
                {completedCount}/{totalCount}
              </span>
              {day.isToday && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" title="اليوم" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Top Mini Daily Bar Chart with Spacious Layout & Horizontal Mobile Scroll */}
      <div className="bg-[#111938] border border-[#1f2b54] rounded-xl p-4 sm:p-5 shadow-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#1b264a]">
          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-sm font-bold text-white tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-md">
              PROGRESS
            </span>
            <span className="text-xs text-slate-300 font-medium">
              معدل إنجاز الأيام — عدد المهام المكتملة لكل يوم من الأسبوع المحدد
            </span>
          </div>
          {selectedDayIndex !== null && (
            <button
              onClick={() => setSelectedDayIndex(null)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-semibold bg-[#162145] border border-blue-500/30 px-3 py-1 rounded-lg transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>إلغاء التصفية وعرض الأسبوع كاملاً</span>
            </button>
          )}
        </div>

        {/* Scrollable Progress Chart on Mobile */}
        <div className="overflow-x-auto pb-2 scrollbar-none touch-pan-x">
          <div className="flex items-end justify-around gap-3 sm:gap-10 h-44 pt-3 px-1 sm:px-4 min-w-[520px] sm:min-w-full">
            {daysForChart.map((d, index) => {
              const completedCount = d.tasks.filter((t) => t.completed).length;
              const totalCount = d.tasks.length;
              const realIdx = index;
              const dayColor = DAY_COLORS[realIdx % DAY_COLORS.length];
              const heightPercent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;
              const isDaySelected = selectedDayIndex === realIdx;
              const isComplete = totalCount > 0 && completedCount === totalCount;

              return (
                <div
                  key={d.dateKey}
                  onClick={() => setSelectedDayIndex(realIdx)}
                  className={`flex flex-col items-center flex-1 min-w-0 max-w-[90px] sm:max-w-[105px] cursor-pointer rounded-lg p-1.5 transition-all duration-200 ${
                    isDaySelected 
                      ? 'bg-[#1c2852] ring-2 ring-blue-400 shadow-lg shadow-blue-950/50 translate-y-0.5' 
                      : 'hover:bg-[#162044] hover:translate-y-0.5'
                  }`}
                >
                  {/* Number Badge with Percentage */}
                  <div className="flex flex-col items-center justify-center h-9 mb-2 shrink-0 leading-none">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm font-mono-num font-bold text-white leading-none">
                        {completedCount}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-num leading-none">
                        /{totalCount}
                      </span>
                    </div>
                    {totalCount > 0 && (
                      <span
                        className="text-[10px] font-mono-num font-bold mt-0.5 leading-none"
                        style={{ color: dayColor }}
                      >
                        {heightPercent}%
                      </span>
                    )}
                  </div>

                  {/* Vertical Bar with fixed track height and rounded fill */}
                  <div className="w-full bg-[#16203f] rounded-lg h-20 flex items-end p-1 border border-[#223363] overflow-hidden">
                    <div
                      className="w-full transition-all duration-500 rounded-md"
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: heightPercent > 0 ? '6px' : '0px',
                        background: `linear-gradient(180deg, ${dayColor} 0%, ${dayColor}cc 100%)`,
                        boxShadow: isComplete ? `0 0 14px ${dayColor}` : `0 0 8px ${dayColor}40`,
                      }}
                    />
                  </div>

                  {/* Day Label with Date */}
                  <div className="text-center mt-2 w-full">
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {d.dayName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-num block">
                      {d.dateStr.split('/')[0]}/{d.dateStr.split('/')[1]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Columns Grid for the Days of the Week */}
      <div className={`grid gap-3 ${
        selectedDayIndex !== null 
          ? 'grid-cols-1 max-w-xl mx-auto'
          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7'
      }`}>
        {visibleDays.map((day, idx) => {
          const realIndex = selectedDayIndex !== null ? selectedDayIndex : idx;
          const totalTasks = day.tasks.length;
          const completedTasks = day.tasks.filter((t) => t.completed).length;
          const incompleteTasks = totalTasks - completedTasks;
          const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          const dayColor = DAY_COLORS[realIndex % DAY_COLORS.length];

          return (
            <div
              key={day.dateKey}
              className={`bg-[#101732] border rounded-xl overflow-hidden flex flex-col justify-between shadow-md transition ${
                day.isToday
                  ? 'border-emerald-500/80 shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'border-[#1e2b52] hover:border-[#2b3c70]'
              }`}
            >
              {/* Column Top Header: Day Name + Date */}
              <div className="bg-[#141e40] p-2.5 text-center border-b border-[#1f2b54] relative">
                {day.isToday && (
                  <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow animate-pulse">
                    اليوم
                  </span>
                )}
                <h4 className="text-sm font-bold text-slate-100">{day.dayName}</h4>
                <div className="text-[11px] font-mono-num text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{day.dateStr}</span>
                </div>
              </div>

              {/* Day Donut Chart Section */}
              <div className="bg-[#121a38] py-3 flex items-center justify-center border-b border-[#1c274c]">
                <DonutGauge
                  percentage={percentage}
                  size={85}
                  strokeWidth={9}
                  color={dayColor}
                  fontSize="text-sm"
                />
              </div>

              {/* Tasks Subheader: "المهام" */}
              <div className="bg-[#0f1630] py-1 px-2.5 flex items-center justify-between border-b border-[#1c274c]">
                <span className="text-[11px] font-semibold text-slate-400">المهام</span>
                <button
                  onClick={() => setQuickInputDateKey(quickInputDateKey === day.dateKey ? null : day.dateKey)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                  title="إضافة مهمة لهذا اليوم"
                >
                  <Plus className="w-3 h-3" />
                  <span>إضافة</span>
                </button>
              </div>

              {/* Quick Add Task Input */}
              {quickInputDateKey === day.dateKey && (
                <div className="p-1.5 bg-[#0b1022] border-b border-[#1f2b54] flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="مهمة جديدة لهذا اليوم..."
                    value={quickInputText}
                    onChange={(e) => setQuickInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(day.dateKey, dayColor)}
                    className="flex-1 bg-[#141d3c] border border-[#27386d] text-white text-[11px] px-2 py-1 rounded outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleQuickAdd(day.dateKey, dayColor)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-bold"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Tasks List */}
              <div className="flex-1 p-2 space-y-1.5 min-h-[190px] max-h-[300px] overflow-y-auto bg-[#0e142c]/60">
                {day.tasks.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-[11px]">
                    لا توجد مهام مسجلة لهذا اليوم
                  </div>
                ) : (
                  day.tasks.map((task) => {
                    const isDone = task.completed;
                    const itemColor = task.color || dayColor;
                    const actionColors = getDynamicActionColors(itemColor, isDone, '#131c3c');

                    return (
                      <div
                        key={task.id}
                        className={`group relative flex items-center justify-between gap-1.5 px-2 py-1.5 rounded transition border ${
                          isDone
                            ? 'text-white border-transparent'
                            : 'bg-[#131c3c] border-[#1f2c56] text-slate-300 hover:border-[#2a3c75]'
                        }`}
                        style={{
                          backgroundColor: isDone ? itemColor : undefined,
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleTask(day.dateKey, task.id)}
                          className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center transition border shrink-0 ${
                            isDone
                              ? 'bg-black/30 border-white/60 text-white'
                              : 'bg-[#182348] border-[#2e3f75] text-transparent hover:border-slate-400'
                          }`}
                        >
                          {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </button>

                        {/* Task Name */}
                        {editingTaskId === task.id ? (
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEditTask(day.dateKey, task.id)}
                              className="w-full bg-[#0a0f21] border border-blue-400 text-white text-[11px] px-1.5 py-0.5 rounded outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditTask(day.dateKey, task.id)}
                              className="text-[9px] bg-blue-600 px-1 py-0.5 rounded text-white font-bold"
                            >
                              تم
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => handleToggleTask(day.dateKey, task.id)}
                            onDoubleClick={() => handleStartEditTask(task)}
                            className={`flex-1 text-[11px] leading-tight truncate cursor-pointer select-none text-right ${
                              isDone
                                ? 'line-through text-white/95 font-medium'
                                : 'text-slate-200 group-hover:text-white'
                            }`}
                            title={task.text}
                          >
                            {task.text}
                          </span>
                        )}

                        {/* Dynamic Action buttons on hover */}
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditTask(task)}
                            className="p-1 rounded transition hover:scale-110 shadow-sm"
                            style={{
                              backgroundColor: actionColors.buttonBg,
                              border: `1px solid ${actionColors.borderColor}`,
                              color: actionColors.editColor,
                            }}
                            title="تعديل المهمة"
                          >
                            <Edit2 className="w-3 h-3 stroke-[2.5]" style={{ color: actionColors.editColor }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(day.dateKey, task.id)}
                            className="p-1 rounded transition hover:scale-110 shadow-sm"
                            style={{
                              backgroundColor: actionColors.buttonBg,
                              border: `1px solid ${actionColors.borderColor}`,
                              color: actionColors.deleteColor,
                            }}
                            title="حذف المهمة"
                          >
                            <Trash2 className="w-3 h-3 stroke-[2.5]" style={{ color: actionColors.deleteColor }} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Day Bottom Footer Counters matching design */}
              <div className="border-t border-[#1c274c] text-[10px] font-mono-num">
                {/* Completed Row (Green) */}
                <div className="bg-[#10b981]/90 text-slate-950 font-bold px-2.5 py-1 flex items-center justify-between">
                  <span className="font-sans text-[11px]">المكتمل</span>
                  <span className="text-xs">{completedTasks}</span>
                </div>

                {/* Incomplete Row (Red/Coral) */}
                <div className="bg-[#f43f5e]/90 text-slate-950 font-bold px-2.5 py-1 flex items-center justify-between border-t border-[#101732]">
                  <span className="font-sans text-[11px]">غير مكتمل</span>
                  <span className="text-xs">{incompleteTasks}</span>
                </div>

                {/* Total Tasks Row (White/Light) */}
                <div className="bg-[#f1f5f9] text-slate-900 font-bold px-2.5 py-1 flex items-center justify-between border-t border-[#101732]">
                  <span className="font-sans text-[11px]">عدد المهام</span>
                  <span className="text-xs">{totalTasks}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
