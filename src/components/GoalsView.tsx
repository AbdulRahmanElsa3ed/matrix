import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Goal, GoalStep } from '../types';
import { DonutGauge } from './DonutGauge';
import { Check, Plus, Trash2, Edit2, Sparkles, CheckCircle2, Target } from 'lucide-react';
import { playCheckSound, playGoalCelebrationSound } from '../utils/audio';
import { getDynamicActionColors } from '../utils/colorUtils';

interface GoalsViewProps {
  goals: Goal[];
  onUpdateGoal: (updatedGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onAddGoal: () => void;
  soundEnabled: boolean;
}

export const GoalsView: React.FC<GoalsViewProps> = React.memo(({
  goals,
  onUpdateGoal,
  onDeleteGoal,
  onAddGoal,
  soundEnabled,
}) => {
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingGoalTitleId, setEditingGoalTitleId] = useState<string | null>(null);
  const [editingGoalTitleText, setEditingGoalTitleText] = useState('');
  const [newStepInputs, setNewStepInputs] = useState<{ [goalId: string]: string }>({});
  const [showAddStepGoalId, setShowAddStepGoalId] = useState<string | null>(null);

  const handleToggleStep = useCallback((goal: Goal, stepId: string) => {
    playCheckSound(soundEnabled);
    const updatedSteps = goal.steps.map((s) =>
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );
    const updatedGoal = { ...goal, steps: updatedSteps };
    
    // Check if goal just hit 100%
    const prevCompleted = goal.steps.filter((s) => s.completed).length;
    const nowCompleted = updatedSteps.filter((s) => s.completed).length;
    if (nowCompleted === updatedSteps.length && prevCompleted < updatedSteps.length) {
      playGoalCelebrationSound(soundEnabled);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [goal.color, '#ffffff', '#38bdf8', '#34d399', '#facc15'],
      });
    }

    onUpdateGoal(updatedGoal);
  }, [soundEnabled, onUpdateGoal]);

  const handleStartEditStep = useCallback((step: GoalStep) => {
    setEditingStepId(step.id);
    setEditingText(step.text);
  }, []);

  const handleSaveStep = useCallback((goal: Goal, stepId: string) => {
    if (!editingText.trim()) return;
    const updatedSteps = goal.steps.map((s) =>
      s.id === stepId ? { ...s, text: editingText.trim() } : s
    );
    onUpdateGoal({ ...goal, steps: updatedSteps });
    setEditingStepId(null);
    setEditingText('');
  }, [editingText, onUpdateGoal]);

  const handleDeleteStep = useCallback((goal: Goal, stepId: string) => {
    const updatedSteps = goal.steps.filter((s) => s.id !== stepId);
    onUpdateGoal({ ...goal, steps: updatedSteps });
  }, [onUpdateGoal]);

  const handleAddStepToGoal = useCallback((goal: Goal) => {
    const text = newStepInputs[goal.id]?.trim();
    if (!text) return;
    const newStep: GoalStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      completed: false,
      order: goal.steps.length + 1,
    };
    onUpdateGoal({ ...goal, steps: [...goal.steps, newStep] });
    setNewStepInputs((prev) => ({ ...prev, [goal.id]: '' }));
    setShowAddStepGoalId(null);
  }, [newStepInputs, onUpdateGoal]);

  const handleStartEditGoalTitle = useCallback((goal: Goal) => {
    setEditingGoalTitleId(goal.id);
    setEditingGoalTitleText(goal.title);
  }, []);

  const handleSaveGoalTitle = useCallback((goal: Goal) => {
    if (!editingGoalTitleText.trim()) return;
    onUpdateGoal({ ...goal, title: editingGoalTitleText.trim() });
    setEditingGoalTitleId(null);
    setEditingGoalTitleText('');
  }, [editingGoalTitleText, onUpdateGoal]);

  return (
    <div className="w-full max-w-[1680px] mx-auto p-3 sm:p-6 space-y-6">
      
      {/* 6 Goals Bento Grid matching cube3.webp */}
      {goals.length === 0 ? (
        <div className="bg-[#101732] border border-[#1e2b52] rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">لا توجد أهداف شهرية بعد</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              الأداة جاهزة الآن بحالة نظيفة وصفرية. ابدأ بإضافة أهدافك وخطواتك التنفيذية لبدء التتبع.
            </p>
          </div>
          <button
            onClick={onAddGoal}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>إضافة أول هدف شهري</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
          const totalSteps = goal.steps.length;
          const completedSteps = goal.steps.filter((s) => s.completed).length;
          const percentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
          const isComplete = totalSteps > 0 && completedSteps === totalSteps;

          return (
            <div
              key={goal.id}
              className="bg-[#101732] border border-[#1e2b52] rounded-xl shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#2d3e75] hover:shadow-2xl"
              style={{
                boxShadow: isComplete
                  ? `0 0 20px -5px ${goal.glowColor}`
                  : '0 4px 20px -2px rgba(0,0,0,0.5)',
              }}
            >
              {/* Card Header Section: Donut gauge + Big Ratio number */}
              <div className="bg-[#131d3d] p-4 sm:p-5 flex items-center justify-around border-b border-[#1f2b54] relative">
                {/* Donut Progress Chart */}
                <div className="flex items-center justify-center">
                  <DonutGauge
                    percentage={percentage}
                    size={105}
                    strokeWidth={11}
                    color={goal.color}
                    glowColor={goal.glowColor}
                    fontSize="text-lg"
                  />
                </div>

                {/* Big Fraction Display (e.g. 8 / 5) matching screenshot */}
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-2xl sm:text-3xl font-bold font-mono-num text-white tracking-widest">
                    <span>{totalSteps}</span>
                    <span className="text-slate-500 font-light">/</span>
                    <span style={{ color: goal.color }}>{completedSteps}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    الخطوات المنجزة
                  </div>
                </div>

                {/* Quick actions top corner */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditGoalTitle(goal);
                    }}
                    className="p-1 rounded-md transition hover:scale-110 shadow-sm cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#38bdf8',
                    }}
                    title="تعديل اسم الهدف"
                  >
                    <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: '#38bdf8' }} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGoal(goal.id);
                    }}
                    className="p-1 rounded-md transition hover:scale-110 shadow-sm cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fb7185',
                    }}
                    title="حذف الهدف"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: '#fb7185' }} />
                  </button>
                </div>
              </div>

              {/* Goal Title Banner */}
              <div className="bg-[#152042] px-4 py-2.5 text-center border-b border-[#1f2b54]">
                {editingGoalTitleId === goal.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingGoalTitleText}
                      onChange={(e) => setEditingGoalTitleText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveGoalTitle(goal)}
                      className="w-full bg-[#0d1329] border border-blue-500 text-white text-sm rounded px-2 py-1 outline-none text-center font-bold"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveGoalTitle(goal)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                    >
                      حفظ
                    </button>
                  </div>
                ) : (
                  <h3
                    onClick={() => handleStartEditGoalTitle(goal)}
                    className="text-sm sm:text-base font-bold text-slate-100 truncate cursor-pointer hover:text-blue-300 transition"
                    title={goal.title}
                  >
                    {goal.title}
                  </h3>
                )}
              </div>

              {/* Steps Subheader: "الخطوات" */}
              <div className="bg-[#111936] py-1.5 px-4 text-center border-b border-[#1c274c] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
                  الخطوات
                </span>
                <button
                  onClick={() => setShowAddStepGoalId(showAddStepGoalId === goal.id ? null : goal.id)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>خطوة جديدة</span>
                </button>
              </div>

              {/* Inline Add Step Input (collapsible) */}
              {showAddStepGoalId === goal.id && (
                <div className="p-2 bg-[#0c1228] border-b border-[#1f2b54] flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="اكتب الخطوة الجديدة..."
                    value={newStepInputs[goal.id] || ''}
                    onChange={(e) =>
                      setNewStepInputs({ ...newStepInputs, [goal.id]: e.target.value })
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStepToGoal(goal)}
                    className="flex-1 bg-[#151d3b] border border-[#273769] text-xs text-white px-2.5 py-1.5 rounded outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAddStepToGoal(goal)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold transition"
                  >
                    إضافة
                  </button>
                </div>
              )}

              {/* Steps List */}
              <div className="flex-1 p-2.5 sm:p-3 space-y-1.5 max-h-[380px] overflow-y-auto">
                {goal.steps.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    لا توجد خطوات بعد. اضغط على "+ خطوة جديدة" للبدء.
                  </div>
                ) : (
                  goal.steps.map((step, idx) => {
                    const isStepComplete = step.completed;
                    const actionColors = getDynamicActionColors(goal.color, isStepComplete, '#121a38');

                    return (
                      <div
                        key={step.id}
                        className={`group relative flex items-center justify-between gap-2 px-2.5 py-1.5 rounded transition-all duration-150 border ${
                          isStepComplete
                            ? 'border-transparent text-white'
                            : 'bg-[#121a38]/80 border-[#1c274c] text-slate-300 hover:border-[#273769]'
                        }`}
                        style={{
                          backgroundColor: isStepComplete ? goal.color : undefined,
                        }}
                      >
                        {/* Right: Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleStep(goal, step.id)}
                          className={`w-4 h-4 rounded-sm flex items-center justify-center transition border ${
                            isStepComplete
                              ? 'bg-black/30 border-white/60 text-white shadow-sm'
                              : 'bg-[#182245] border-[#2d3e75] hover:border-slate-400 text-transparent'
                          }`}
                        >
                          {isStepComplete && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        {/* Middle: Step Text */}
                        {editingStepId === step.id ? (
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveStep(goal, step.id)}
                              className="w-full bg-[#0c1228] border border-blue-400 text-white text-xs px-2 py-0.5 rounded outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveStep(goal, step.id)}
                              className="text-[10px] bg-blue-600 px-2 py-0.5 rounded text-white font-bold"
                            >
                              تم
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => handleToggleStep(goal, step.id)}
                            onDoubleClick={() => handleStartEditStep(step)}
                            className={`flex-1 text-xs sm:text-[13px] leading-snug cursor-pointer select-none text-right ${
                              isStepComplete
                                ? 'line-through text-white/95 font-medium'
                                : 'text-slate-200 group-hover:text-white'
                            }`}
                            title="اضغط للتحديد / اضغط مرتين للتعديل"
                          >
                            {step.text}
                          </span>
                        )}

                        {/* Left: Step Number Index e.g. 1, 2, 3.. */}
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded ${
                              isStepComplete
                                ? 'bg-black/20 text-white/90'
                                : 'bg-[#182348] text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>

                          {/* Dynamic Action icons on hover */}
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditStep(step)}
                              className="p-1 rounded transition hover:scale-110 shadow-sm"
                              style={{
                                backgroundColor: actionColors.buttonBg,
                                border: `1px solid ${actionColors.borderColor}`,
                                color: actionColors.editColor,
                              }}
                              title="تعديل الخطوة"
                            >
                              <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: actionColors.editColor }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStep(goal, step.id)}
                              className="p-1 rounded transition hover:scale-110 shadow-sm"
                              style={{
                                backgroundColor: actionColors.buttonBg,
                                border: `1px solid ${actionColors.borderColor}`,
                                color: actionColors.deleteColor,
                              }}
                              title="حذف الخطوة"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: actionColors.deleteColor }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Progress Bar + Percentage Badge matching screenshot */}
              <div className="bg-[#0e142c] p-3 border-t border-[#1c274c] flex items-center justify-between gap-3">
                <span className="text-xs font-mono-num font-bold text-slate-300">
                  {percentage.toFixed(2)}%
                </span>

                {/* Progress bar line */}
                <div className="flex-1 h-2 bg-[#172145] rounded-full overflow-hidden border border-[#233160]">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: goal.color,
                      boxShadow: percentage > 0 ? `0 0 8px ${goal.glowColor}` : 'none',
                    }}
                  />
                </div>

                {isComplete && (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مكتمل!</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Floating or bottom add goal prompt */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onAddGoal}
          className="flex items-center gap-2 bg-[#131d3d] hover:bg-[#1a2752] border border-[#2a3a6e] hover:border-blue-500 text-slate-200 hover:text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition duration-200"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>إضافة هدف شهري جديد</span>
        </button>
      </div>
    </div>
  );
});
