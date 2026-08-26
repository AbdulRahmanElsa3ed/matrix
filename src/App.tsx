/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ActiveTab, Goal, HabitMonthData, TaskItem } from './types';
import { DEFAULT_GOALS, DEFAULT_HABITS, getISODateKey, ARABIC_DAYS } from './data/defaultData';
import { HeaderNav } from './components/HeaderNav';
import { GoalsView } from './components/GoalsView';
import { TasksView } from './components/TasksView';
import { HabitsView } from './components/HabitsView';
import { AddGoalModal, AddTaskModal, AddHabitModal, ResetModal } from './components/Modals';
import { fetchServerData, saveServerData } from './services/api';

// Initial default seed tasks for the current week's days (all set to 0% completed / clean start)
function createInitialTasksMap(): Record<string, TaskItem[]> {
  const map: Record<string, TaskItem[]> = {};
  const baseNow = new Date();
  const currentDayOfWeek = baseNow.getDay();
  const diffToSaturday = (currentDayOfWeek + 1) % 7;
  const startOfWeek = new Date(baseNow);
  startOfWeek.setDate(baseNow.getDate() - diffToSaturday);

  const sampleTasksList = [
    [
      { id: 't1-1', text: 'إنهاء قراءة كتاب', completed: false, color: '#f472b6', order: 1 },
      { id: 't1-2', text: 'ترتيب غرفة النوم', completed: false, color: '#f472b6', order: 2 },
      { id: 't1-3', text: 'تنظيف المطبخ', completed: false, color: '#f472b6', order: 3 },
      { id: 't1-4', text: 'مشاهدة درس إنجليزي', completed: false, color: '#f472b6', order: 4 },
      { id: 't1-5', text: 'تمرين كارديو', completed: false, color: '#f472b6', order: 5 },
    ],
    [
      { id: 't2-1', text: 'كتابة تقرير العمل', completed: false, color: '#f87171', order: 1 },
      { id: 't2-2', text: 'شراء الخضار والفواكه', completed: false, color: '#f87171', order: 2 },
      { id: 't2-3', text: 'تسجيل حلقة البودكاست', completed: false, color: '#f87171', order: 3 },
      { id: 't2-4', text: 'غسيل الملابس', completed: false, color: '#f87171', order: 4 },
    ],
    [
      { id: 't3-1', text: 'مراجعة الميزانية', completed: false, color: '#4ade80', order: 1 },
      { id: 't3-2', text: 'تنظيم المستندات', completed: false, color: '#4ade80', order: 2 },
      { id: 't3-3', text: 'تجهيز عرض تقديمي', completed: false, color: '#4ade80', order: 3 },
      { id: 't3-4', text: 'تنظيف السيارة', completed: false, color: '#4ade80', order: 4 },
      { id: 't3-5', text: 'مكالمة هاتفية', completed: false, color: '#4ade80', order: 5 },
    ],
    [
      { id: 't4-1', text: 'ممارسة الرياضة', completed: false, color: '#facc15', order: 1 },
      { id: 't4-2', text: 'قراءة 30 صفحة', completed: false, color: '#facc15', order: 2 },
      { id: 't4-3', text: 'الرد على الإيميلات', completed: false, color: '#facc15', order: 3 },
      { id: 't4-4', text: 'سقي النباتات', completed: false, color: '#facc15', order: 4 },
      { id: 't4-5', text: 'ممارسة هواية', completed: false, color: '#facc15', order: 5 },
      { id: 't4-6', text: 'استرخاء تام', completed: false, color: '#facc15', order: 6 },
    ],
    [
      { id: 't5-1', text: 'إنهاء المشاريع', completed: false, color: '#34d399', order: 1 },
      { id: 't5-2', text: 'اجتماع سريع', completed: false, color: '#34d399', order: 2 },
      { id: 't5-3', text: 'موعد طبيب الساعة 6:00', completed: false, color: '#34d399', order: 3 },
      { id: 't5-4', text: 'مسح الأرضيات', completed: false, color: '#34d399', order: 4 },
    ],
    [
      { id: 't6-1', text: 'ترتيب السيارة', completed: false, color: '#38bdf8', order: 1 },
      { id: 't6-2', text: 'مشي نصف ساعة', completed: false, color: '#38bdf8', order: 2 },
      { id: 't6-3', text: 'تفريغ سلة المهملات', completed: false, color: '#38bdf8', order: 3 },
    ],
    [
      { id: 't7-1', text: 'ترتيب الخزانة', completed: false, color: '#818cf8', order: 1 },
      { id: 't7-2', text: 'شراء مستلزمات', completed: false, color: '#818cf8', order: 2 },
      { id: 't7-3', text: 'معاملة عاجلة', completed: false, color: '#818cf8', order: 3 },
    ],
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateKey = getISODateKey(d);
    map[dateKey] = sampleTasksList[i] || [];
  }

  return map;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('goals');
  const [weekOffset, setWeekOffset] = useState(0);

  // LocalStorage-backed state
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem('productivity_goals');
      return saved ? JSON.parse(saved) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  const [tasksByDate, setTasksByDate] = useState<Record<string, TaskItem[]>>(() => {
    try {
      const saved = localStorage.getItem('productivity_tasks_by_date');
      if (saved) return JSON.parse(saved);
      // Migration from old daysTasks if exists
      const oldSaved = localStorage.getItem('productivity_tasks');
      if (oldSaved) {
        const oldDays = JSON.parse(oldSaved);
        if (Array.isArray(oldDays)) {
          // Initialize map with today's week
          return createInitialTasksMap();
        }
      }
      return createInitialTasksMap();
    } catch {
      return createInitialTasksMap();
    }
  });

  const [habitsData, setHabitsData] = useState<HabitMonthData>(() => {
    try {
      const saved = localStorage.getItem('productivity_habits');
      return saved ? JSON.parse(saved) : DEFAULT_HABITS;
    } catch {
      return DEFAULT_HABITS;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('productivity_sound');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const isInitialLoadedRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch persisted data from server JSON file on startup
  useEffect(() => {
    let isMounted = true;
    fetchServerData().then((serverData) => {
      if (!isMounted || !serverData) {
        lastSavedSnapshotRef.current = JSON.stringify({ goals, tasksByDate, habitsData, soundEnabled });
        isInitialLoadedRef.current = true;
        return;
      }
      if (serverData.goals && Array.isArray(serverData.goals) && serverData.goals.length > 0) {
        setGoals(serverData.goals);
      }
      if (serverData.tasksByDate && typeof serverData.tasksByDate === 'object') {
        setTasksByDate(serverData.tasksByDate);
      }
      if (serverData.habitsData && Array.isArray(serverData.habitsData.habits)) {
        setHabitsData(serverData.habitsData);
      }
      if (typeof serverData.soundEnabled === 'boolean') {
        setSoundEnabled(serverData.soundEnabled);
      }
      // Record initial snapshot so we don't re-save what was just loaded
      lastSavedSnapshotRef.current = JSON.stringify({
        goals: serverData.goals || goals,
        tasksByDate: serverData.tasksByDate || tasksByDate,
        habitsData: serverData.habitsData || habitsData,
        soundEnabled: serverData.soundEnabled ?? soundEnabled,
      });
      isInitialLoadedRef.current = true;
    }).catch(() => {
      lastSavedSnapshotRef.current = JSON.stringify({ goals, tasksByDate, habitsData, soundEnabled });
      isInitialLoadedRef.current = true;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Modals state
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Save changes to localStorage AND to data/app-data.json ONLY when actual changes happen
  useEffect(() => {
    try {
      localStorage.setItem('productivity_goals', JSON.stringify(goals));
      localStorage.setItem('productivity_tasks_by_date', JSON.stringify(tasksByDate));
      localStorage.setItem('productivity_habits', JSON.stringify(habitsData));
      localStorage.setItem('productivity_sound', JSON.stringify(soundEnabled));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    if (!isInitialLoadedRef.current) return;

    const currentSnapshot = JSON.stringify({
      goals,
      tasksByDate,
      habitsData,
      soundEnabled,
    });

    // If no real difference between current state and last saved snapshot, do nothing
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');

    // Debounce server JSON disk write (400ms) to bundle rapid edits smoothly
    saveTimeoutRef.current = setTimeout(async () => {
      const success = await saveServerData({
        goals,
        tasksByDate,
        habitsData,
        soundEnabled,
      });

      if (success) {
        lastSavedSnapshotRef.current = currentSnapshot;
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
        }, 2000);
      } else {
        setSaveStatus('error');
      }
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [goals, tasksByDate, habitsData, soundEnabled]);

  // Calculations for Top Bar Statistics
  // For Tasks: calculate completed and total tasks for the current visible week
  const { completedCount, incompleteCount, totalCount } = useMemo(() => {
    if (activeTab === 'goals') {
      let completed = 0;
      let total = 0;
      goals.forEach((g) => {
        g.steps.forEach((s) => {
          total++;
          if (s.completed) completed++;
        });
      });
      return {
        completedCount: completed,
        incompleteCount: total - completed,
        totalCount: total,
      };
    } else if (activeTab === 'tasks') {
      // Calculate for the 7 days of the currently viewed week
      const baseNow = new Date();
      const currentDayOfWeek = baseNow.getDay();
      const diffToSaturday = (currentDayOfWeek + 1) % 7;
      const startOfWeek = new Date(baseNow);
      startOfWeek.setDate(baseNow.getDate() - diffToSaturday + (weekOffset * 7));

      let completed = 0;
      let total = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateKey = getISODateKey(d);
        const tasks = tasksByDate[dateKey] || [];
        tasks.forEach((t) => {
          total++;
          if (t.completed) completed++;
        });
      }

      return {
        completedCount: completed,
        incompleteCount: total - completed,
        totalCount: total,
      };
    } else {
      // Habits tab
      let completed = 0;
      let total = 0;
      habitsData.habits.forEach((h) => {
        h.checks.slice(0, 30).forEach((c) => {
          total++;
          if (c) completed++;
        });
      });
      return {
        completedCount: completed,
        incompleteCount: total - completed,
        totalCount: total,
      };
    }
  }, [activeTab, goals, tasksByDate, habitsData, weekOffset]);

  // Handlers for Goals
  const handleUpdateGoal = useCallback((updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  }, []);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  }, []);

  const handleAddGoal = useCallback((newGoal: Goal) => {
    setGoals((prev) => [...prev, newGoal]);
  }, []);

  // Handlers for Tasks with Date Keys
  const handleUpdateTasksForDate = useCallback((dateKey: string, tasks: TaskItem[]) => {
    setTasksByDate((prev) => ({
      ...prev,
      [dateKey]: tasks,
    }));
  }, []);

  const handleAddTaskToDate = useCallback((dateKey: string, text: string, color: string) => {
    setTasksByDate((prev) => {
      const existing = prev[dateKey] || [];
      const newTask: TaskItem = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text,
        completed: false,
        color,
        order: existing.length + 1,
      };
      return {
        ...prev,
        [dateKey]: [...existing, newTask],
      };
    });
  }, []);

  // Handlers for Habits
  const handleUpdateHabitsData = useCallback((updatedData: HabitMonthData) => {
    setHabitsData(updatedData);
  }, []);

  const handleAddHabit = useCallback((title: string) => {
    const newHabit = {
      id: `habit-${Date.now()}`,
      title,
      target: 30,
      checks: Array(30).fill(false),
    };
    setHabitsData((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));
  }, []);

  // Import / Export / Reset Handlers
  const handleExportData = useCallback(() => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      goals,
      tasksByDate,
      habitsData,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [goals, tasksByDate, habitsData]);

  const handleImportData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.tasksByDate) setTasksByDate(parsed.tasksByDate);
        if (parsed.habitsData) setHabitsData(parsed.habitsData);
        alert('تم استيراد البيانات بنجاح!');
      } catch {
        alert('خطأ: الملف المرفوع غير صالح!');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleOpenResetModal = useCallback(() => {
    setIsResetModalOpen(true);
  }, []);

  // 1. Zero out all progress to 0% (uncheck all steps, habit days, tasks, reset sleep)
  const handleZeroOutProgress = useCallback(() => {
    setGoals((prev) =>
      prev.map((g) => ({
        ...g,
        steps: g.steps.map((s) => ({ ...s, completed: false })),
      }))
    );
    setTasksByDate((prev) => {
      const updated: Record<string, TaskItem[]> = {};
      Object.keys(prev).forEach((dateKey) => {
        updated[dateKey] = prev[dateKey].map((t) => ({ ...t, completed: false }));
      });
      return updated;
    });
    setHabitsData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => ({ ...h, checks: Array(30).fill(false) })),
      sleepHours: Array(30).fill(0),
      sleepQuality: Array(30).fill(0),
    }));
  }, []);

  // 2. Wipe all data completely (empty arrays) for custom blank slate
  const handleWipeAllData = useCallback(() => {
    setGoals([]);
    setTasksByDate({});
    setHabitsData({
      month: 'September',
      lastCalendarDate: getISODateKey(new Date()),
      habits: [],
      sleepHours: Array(30).fill(0),
      sleepQuality: Array(30).fill(0),
    });
    localStorage.removeItem('productivity_goals');
    localStorage.removeItem('productivity_tasks');
    localStorage.removeItem('productivity_tasks_by_date');
    localStorage.removeItem('productivity_habits');
  }, []);

  // 3. Reset to default structured template with 0% completion
  const handleResetToCleanTemplate = useCallback(() => {
    setGoals(DEFAULT_GOALS);
    setTasksByDate(createInitialTasksMap());
    setHabitsData(DEFAULT_HABITS);
    localStorage.removeItem('productivity_goals');
    localStorage.removeItem('productivity_tasks');
    localStorage.removeItem('productivity_tasks_by_date');
    localStorage.removeItem('productivity_habits');
  }, []);

  const handleOpenAddModal = useCallback(() => {
    if (activeTab === 'goals') setIsAddGoalOpen(true);
    else if (activeTab === 'tasks') setIsAddTaskOpen(true);
    else setIsAddHabitOpen(true);
  }, [activeTab]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const handlePrevWeek = useCallback(() => {
    setWeekOffset((prev) => prev - 1);
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekOffset((prev) => prev + 1);
  }, []);

  const handleCurrentWeek = useCallback(() => {
    setWeekOffset(0);
  }, []);

  // Compute 7 days options for the AddTaskModal based on active weekOffset
  const currentWeekDayOptions = useMemo(() => {
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

      list.push({
        id: dateKey,
        dayName,
        dateStr: dateString,
      });
    }
    return list;
  }, [weekOffset]);

  return (
    <div className="min-h-screen bg-[#0b1021] text-slate-100 flex flex-col font-cairo selection:bg-indigo-600 selection:text-white">
      
      {/* Top Universal Productivity Header Nav */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        completedCount={completedCount}
        incompleteCount={incompleteCount}
        totalCount={totalCount}
        onOpenAddModal={handleOpenAddModal}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleOpenResetModal}
        saveStatus={saveStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onAddGoal={handleOpenAddModal}
            soundEnabled={soundEnabled}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasksByDate={tasksByDate}
            onUpdateTasksForDate={handleUpdateTasksForDate}
            onAddTaskToDate={handleAddTaskToDate}
            soundEnabled={soundEnabled}
            weekOffset={weekOffset}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onCurrentWeek={handleCurrentWeek}
          />
        )}

        {activeTab === 'habits' && (
          <HabitsView
            data={habitsData}
            onUpdateData={handleUpdateHabitsData}
            onAddHabit={handleAddHabit}
            soundEnabled={soundEnabled}
          />
        )}
      </main>

      {/* Modals */}
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAddGoal={handleAddGoal}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTaskToDate}
        dayOptions={currentWeekDayOptions}
      />

      <AddHabitModal
        isOpen={isAddHabitOpen}
        onClose={() => setIsAddHabitOpen(false)}
        onAddHabit={handleAddHabit}
      />

      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onZeroOutProgress={handleZeroOutProgress}
        onWipeAllData={handleWipeAllData}
        onResetToCleanTemplate={handleResetToCleanTemplate}
      />
    </div>
  );
}
