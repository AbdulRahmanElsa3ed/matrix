import React, { useState } from 'react';
import { X, Target, CheckSquare, CalendarCheck, RotateCcw, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { Goal, GoalStep } from '../types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goal: Goal) => void;
}

const COLOR_OPTIONS = [
  { color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.4)', name: 'بنفسجي' },
  { color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)', name: 'سماوي' },
  { color: '#34d399', glowColor: 'rgba(52, 211, 153, 0.4)', name: 'زمردي' },
  { color: '#a3e635', glowColor: 'rgba(163, 230, 53, 0.4)', name: 'ليموني' },
  { color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.4)', name: 'وردي فاقع' },
  { color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.4)', name: 'زهري' },
  { color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', name: 'برتقالي' },
];

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onAddGoal,
}) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [stepsText, setStepsText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const rawSteps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const steps: GoalStep[] = rawSteps.map((step, idx) => ({
      id: `step-${Date.now()}-${idx}`,
      text: step,
      completed: false,
      order: idx + 1,
    }));

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      color: selectedColor.color,
      glowColor: selectedColor.glowColor,
      steps: steps.length > 0 ? steps : [
        { id: `step-${Date.now()}-1`, text: 'الخطوة الأولى للهدف', completed: false, order: 1 }
      ],
      month: 'September',
    };

    onAddGoal(newGoal);
    setTitle('');
    setStepsText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#121938] border border-[#233160] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#162044] p-4 border-b border-[#233160] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-bold text-white">إضافة هدف جديد</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              عنوان الهدف الرئيسي *
            </label>
            <input
              type="text"
              placeholder="مثال: قراءة 4 كتب وتطوير مهارة جديدة..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0b1022] border border-[#263768] focus:border-violet-500 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              لون السمة للهدف
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    selectedColor.color === c.color ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              الخطوات التنفيذية (كل خطوة في سطر منفصل)
            </label>
            <textarea
              rows={4}
              placeholder="شراء الكتاب الأول&#10;تخصيص 30 دقيقة يومياً للقراءة&#10;كتابة ملخص أهم الأفكار"
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              className="w-full bg-[#0b1022] border border-[#263768] focus:border-violet-500 text-white rounded-xl p-3 text-xs outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c274c]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition"
            >
              حفظ الهدف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (dayId: string, text: string, color: string) => void;
  dayOptions: { id: string; dayName: string; dateStr: string }[];
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  dayOptions,
}) => {
  const [selectedDayId, setSelectedDayId] = useState(dayOptions[0]?.id || '');
  const [text, setText] = useState('');
  const [color, setColor] = useState('#38bdf8');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedDayId) return;
    onAddTask(selectedDayId, text.trim(), color);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#121938] border border-[#233160] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-[#162044] p-4 border-b border-[#233160] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">إضافة مهمة جديدة</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اليوم المستهدف *
            </label>
            <select
              value={selectedDayId}
              onChange={(e) => setSelectedDayId(e.target.value)}
              className="w-full bg-[#0b1022] border border-[#263768] focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
            >
              {dayOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.dayName} - {d.dateStr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              نص المهمة *
            </label>
            <input
              type="text"
              placeholder="مثال: تسليم التقرير الأسبوعي للعميل..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-[#0b1022] border border-[#263768] focus:border-emerald-500 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              لون تصنيف المهمة
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setColor(c.color)}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    color === c.color ? 'border-white scale-110' : 'border-transparent opacity-70'
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c274c]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-md transition"
            >
              حفظ المهمة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (title: string) => void;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onAddHabit,
}) => {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddHabit(title.trim());
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#121938] border border-[#233160] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-[#162044] p-4 border-b border-[#233160] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">إضافة عادة يومية جديدة</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اسم العادة اليومية *
            </label>
            <input
              type="text"
              placeholder="مثال: شرب 2 لتر ماء، قراءة 15 صفحة، رياضة الصباح..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0b1022] border border-[#263768] focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c274c]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition"
            >
              حفظ العادة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZeroOutProgress: () => void;
  onWipeAllData: () => void;
  onResetToCleanTemplate: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onZeroOutProgress,
  onWipeAllData,
  onResetToCleanTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#121938] border border-[#233160] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-[#162044] p-4 border-b border-[#233160] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">تصفير وإعادة تعيين الأداة</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-300 mb-2 leading-relaxed">
            اختر الإجراء المناسب لبدء استخدام الأداة بحالة نظيفة وصفرية:
          </p>

          {/* Option 1: Zero Out Progress */}
          <button
            type="button"
            onClick={() => {
              onZeroOutProgress();
              onClose();
            }}
            className="w-full text-right p-3.5 rounded-xl bg-[#0b1022] hover:bg-[#182348] border border-[#233160] hover:border-violet-500/50 transition group flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 mt-0.5 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-violet-300 transition mb-0.5">
                تصفير نسب الإنجاز (0%)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                إلغاء تحديد كافة المهام والعادات وخطوات الأهداف للبدء من نسبة إنجاز 0% مع الحفاظ على القوائم والعناوين الحالية.
              </p>
            </div>
          </button>

          {/* Option 2: Clean Zero Template */}
          <button
            type="button"
            onClick={() => {
              onResetToCleanTemplate();
              onClose();
            }}
            className="w-full text-right p-3.5 rounded-xl bg-[#0b1022] hover:bg-[#182348] border border-[#233160] hover:border-cyan-500/50 transition group flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 group-hover:scale-105 transition">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition mb-0.5">
                استعادة القالب الأولي الصِفري
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                إعادة ضبط الأداة بالهيكل النموذجي (6 أهداف شهرية، 15 عادة يومية، وجدول أسبوعي) بنسبة إنجاز 0% نظيفة وجاهزة للاستخدام.
              </p>
            </div>
          </button>

          {/* Option 3: Wipe Everything */}
          <button
            type="button"
            onClick={() => {
              onWipeAllData();
              onClose();
            }}
            className="w-full text-right p-3.5 rounded-xl bg-[#0b1022] hover:bg-[#2a1320] border border-[#233160] hover:border-rose-500/50 transition group flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5 group-hover:scale-105 transition">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-300 group-hover:text-rose-200 transition mb-0.5">
                مسح شامل (صفحة بيضاء فارغة تماماً)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                حذف كافة الأهداف والعادات والمهام المخزنة للبدء من لوحة بيضاء فارغة تماماً وإدخال خططك من البداية.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-3.5 bg-[#0e142e] border-t border-[#1c274c]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-[#1a2348] hover:bg-[#233060] rounded-lg transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
