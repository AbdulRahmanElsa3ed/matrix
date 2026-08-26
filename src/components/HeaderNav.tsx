import React, { useRef } from 'react';
import { Check, X, ClipboardList, Target, CalendarCheck, CheckSquare, Volume2, VolumeX, Download, Upload, RotateCcw, Plus } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  completedCount: number;
  incompleteCount: number;
  totalCount: number;
  onOpenAddModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onResetData: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = React.memo(({
  activeTab,
  onTabChange,
  completedCount,
  incompleteCount,
  totalCount,
  onOpenAddModal,
  soundEnabled,
  onToggleSound,
  onExportData,
  onImportData,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getAddLabel = () => {
    switch (activeTab) {
      case 'goals':
        return 'إضافة هدف جديد';
      case 'habits':
        return 'إضافة عادة يومية';
      case 'tasks':
        return 'إضافة مهمة جديدة';
    }
  };

  const getStatContextLabel = () => {
    switch (activeTab) {
      case 'goals':
        return 'إحصائيات الأهداف';
      case 'habits':
        return 'إحصائيات العادات (30 يوم)';
      case 'tasks':
        return 'إحصائيات المهام الأسبوعية';
    }
  };

  const getActiveTabBadgeClass = () => {
    switch (activeTab) {
      case 'goals':
        return 'text-violet-400 border-violet-500/30 bg-violet-500/10';
      case 'habits':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'tasks':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <header className="bg-[#0e142c] border-b border-[#1f2b54] sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-md">
      <div className="max-w-[1680px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Side: Summary Badges (Completed, Incomplete, Total) dedicated to the currently active tab */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-start">
          
          {/* Active Tab Stats Context Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold shrink-0 transition-colors shadow-inner"
            style={{
              borderColor: activeTab === 'goals' ? '#8b5cf666' : activeTab === 'habits' ? '#06b6d466' : '#10b98166',
              backgroundColor: activeTab === 'goals' ? 'rgba(139, 92, 246, 0.12)' : activeTab === 'habits' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: activeTab === 'goals' ? '#c4b5fd' : activeTab === 'habits' ? '#67e8f9' : '#6ee7b7'
            }}
          >
            {activeTab === 'goals' && <Target className="w-3.5 h-3.5" />}
            {activeTab === 'habits' && <CalendarCheck className="w-3.5 h-3.5" />}
            {activeTab === 'tasks' && <CheckSquare className="w-3.5 h-3.5" />}
            <span>{getStatContextLabel()}</span>
          </div>

          {/* Completed Checkmark Widget */}
          <div className="flex flex-col items-center bg-[#131b38] border border-[#233160] rounded-lg px-3 py-1 min-w-[70px] sm:min-w-[80px] shadow-inner relative overflow-hidden group">
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>مكتمل</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-mono-num text-white tracking-wider">
              {completedCount}
            </span>
            <div className="w-full h-0.5 bg-emerald-500/50 absolute bottom-0 left-0" />
          </div>

          {/* Incomplete X Widget */}
          <div className="flex flex-col items-center bg-[#131b38] border border-[#233160] rounded-lg px-3 py-1 min-w-[70px] sm:min-w-[80px] shadow-inner relative overflow-hidden group">
            <div className="flex items-center gap-1 text-rose-400 text-xs font-semibold">
              <X className="w-4 h-4 stroke-[3]" />
              <span>متبقي</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-mono-num text-white tracking-wider">
              {incompleteCount}
            </span>
            <div className="w-full h-0.5 bg-rose-500/50 absolute bottom-0 left-0" />
          </div>

          {/* Total Clipboard Widget */}
          <div className="flex flex-col items-center bg-[#131b38] border border-[#233160] rounded-lg px-3 py-1 min-w-[70px] sm:min-w-[80px] shadow-inner relative overflow-hidden group">
            <div className="flex items-center gap-1 text-blue-400 text-xs font-semibold">
              <ClipboardList className="w-4 h-4 stroke-[2.5]" />
              <span>الإجمالي</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-mono-num text-white tracking-wider">
              {totalCount}
            </span>
            <div className="w-full h-0.5 bg-blue-500/50 absolute bottom-0 left-0" />
          </div>

          {/* Primary View Switcher Tabs (Clean titles without Cube text) */}
          <div className="hidden lg:flex items-center bg-[#090d1f] p-1 rounded-xl border border-[#212e5a] mr-2">
            <button
              onClick={() => onTabChange('goals')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'goals'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-900/40 border border-violet-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#162044]'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>الأهداف</span>
            </button>

            <button
              onClick={() => onTabChange('habits')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'habits'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#162044]'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>العادات</span>
            </button>

            <button
              onClick={() => onTabChange('tasks')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'tasks'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#162044]'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>المهام</span>
            </button>
          </div>
        </div>

        {/* Center Tab Bar for Mobile and Small screens */}
        <div className="flex lg:hidden items-center justify-center w-full bg-[#090d1f] p-1 rounded-xl border border-[#212e5a]">
          <button
            onClick={() => onTabChange('goals')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'goals'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>الأهداف</span>
          </button>
          <button
            onClick={() => onTabChange('habits')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'habits'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>العادات</span>
          </button>
          <button
            onClick={() => onTabChange('tasks')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tasks'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>المهام</span>
          </button>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-end">
          {/* Add Item Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-md transition transform active:scale-95 border border-blue-400/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">{getAddLabel()}</span>
            <span className="sm:hidden">إضافة</span>
          </button>

          {/* Quick Tool Actions Menu */}
          <div className="flex items-center bg-[#131b38] border border-[#233160] rounded-lg p-0.5">
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded transition ${
                soundEnabled ? 'text-cyan-400 hover:bg-[#1d274f]' : 'text-slate-500 hover:bg-[#1d274f]'
              }`}
              title={soundEnabled ? 'كتم الصوت' : 'تفعيل الأصوات التفاعلية'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onExportData}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1d274f] transition"
              title="تصدير نسخة احتياطية (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1d274f] transition"
              title="استيراد بيانات (JSON)"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={onResetData}
              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1d274f] transition"
              title="إعادة تعيين للبيانات النموذجية"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});
