import { Goal, DayTasks, HabitMonthData } from '../types';

// 6 Structured Monthly Goals with 0% initial completion (clean slate)
export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'g-1',
    title: 'تعلم مهارة جديدة',
    color: '#8b5cf6', // Violet
    glowColor: 'rgba(139, 92, 246, 0.4)',
    month: 'September',
    steps: [
      { id: 's1-1', text: 'إنهاء قراءة الفصل الأول', completed: false, order: 1 },
      { id: 's1-2', text: 'تلخيص أهم النقاط', completed: false, order: 2 },
      { id: 's1-3', text: 'مراجعة الملاحظات وتدوين الأسئلة', completed: false, order: 3 },
      { id: 's1-4', text: 'حل الاختبار الذاتي الأول', completed: false, order: 4 },
      { id: 's1-5', text: 'مشاركة الملخص مع الصديق', completed: false, order: 5 },
      { id: 's1-6', text: 'إعداد خطة الفصل الثاني', completed: false, order: 6 },
      { id: 's1-7', text: 'إنهاء قراءة الفصل الثاني', completed: false, order: 7 },
      { id: 's1-8', text: 'حل الاختبار الذاتي الثاني', completed: false, order: 8 },
    ],
  },
  {
    id: 'g-2',
    title: 'تطوير موقع شخصي',
    color: '#ec4899', // Pink / Rose
    glowColor: 'rgba(236, 72, 153, 0.4)',
    month: 'September',
    steps: [
      { id: 's2-1', text: 'شراء الدومين والاستضافة', completed: false, order: 1 },
      { id: 's2-2', text: 'تصميم الواجهة في فيجما', completed: false, order: 2 },
      { id: 's2-3', text: 'برمجة الصفحة الرئيسية', completed: false, order: 3 },
      { id: 's2-4', text: 'برمجة صفحة من أنا ومعرض الأعمال', completed: false, order: 4 },
      { id: 's2-5', text: 'إضافة نموذج التواصل وربط البريد', completed: false, order: 5 },
      { id: 's2-6', text: 'تجربة الموقع على الهواتف', completed: false, order: 6 },
      { id: 's2-7', text: 'تحسين سرعة الموقع ومحركات البحث', completed: false, order: 7 },
      { id: 's2-8', text: 'نشر الموقع رسمياً على الإنترنت', completed: false, order: 8 },
    ],
  },
  {
    id: 'g-3',
    title: 'تحسين اللياقة البدنية',
    color: '#22c55e', // Green
    glowColor: 'rgba(34, 197, 94, 0.4)',
    month: 'September',
    steps: [
      { id: 's3-1', text: 'الاشتراك في النادي الرياضي', completed: false, order: 1 },
      { id: 's3-2', text: 'تحديد جدول التمارين الأسبوعي', completed: false, order: 2 },
      { id: 's3-3', text: 'الالتزام بـ 4 أيام تمرين بالأسبوع', completed: false, order: 3 },
      { id: 's3-4', text: 'شرب 3 لتر ماء يومياً بانتظام', completed: false, order: 4 },
      { id: 's3-5', text: 'الامتناع عن السكريات والمشروبات الغازية', completed: false, order: 5 },
      { id: 's3-6', text: 'المشي 10,000 خطوة يومياً', completed: false, order: 6 },
      { id: 's3-7', text: 'قياس الوزن ونسبة الدهون كل أسبوعين', completed: false, order: 7 },
      { id: 's3-8', text: 'النوم المبكر لمدة 8 ساعات', completed: false, order: 8 },
    ],
  },
  {
    id: 'g-4',
    title: 'تطوير قناة اليوتيوب',
    color: '#eab308', // Amber / Gold
    glowColor: 'rgba(234, 179, 8, 0.4)',
    month: 'September',
    steps: [
      { id: 's4-1', text: 'تحديد أفكار 4 فيديوهات للشهر', completed: false, order: 1 },
      { id: 's4-2', text: 'كتابة سكربت الفيديو الأول', completed: false, order: 2 },
      { id: 's4-3', text: 'تصوير وتسجيل الفيديو الأول', completed: false, order: 3 },
      { id: 's4-4', text: 'مونتاج الفيديو الأول وتجهيزه', completed: false, order: 4 },
      { id: 's4-5', text: 'تصميم الصورة المصغرة الجذابة', completed: false, order: 5 },
      { id: 's4-6', text: 'نشر الفيديو وتحسين الكلمات المفتاحية', completed: false, order: 6 },
      { id: 's4-7', text: 'تصوير ومونتاج الفيديو الثاني', completed: false, order: 7 },
      { id: 's4-8', text: 'التفاعل والرد على كل التعليقات', completed: false, order: 8 },
    ],
  },
  {
    id: 'g-5',
    title: 'تنظيم المصاريف والادخار',
    color: '#10b981', // Emerald
    glowColor: 'rgba(16, 185, 129, 0.4)',
    month: 'September',
    steps: [
      { id: 's5-1', text: 'تسجيل كافة المصاريف الثابتة', completed: false, order: 1 },
      { id: 's5-2', text: 'تحديد ميزانية الأكل والتسوق', completed: false, order: 2 },
      { id: 's5-3', text: 'ادخار 20% من الراتب فور استلامه', completed: false, order: 3 },
      { id: 's5-4', text: 'إلغاء الاشتراكات الشهرية غير الضرورية', completed: false, order: 4 },
      { id: 's5-5', text: 'البحث عن فرص استثمارية صغيرة', completed: false, order: 5 },
      { id: 's5-6', text: 'شراء الأساسيات فقط خلال هذا الشهر', completed: false, order: 6 },
      { id: 's5-7', text: 'مراجعة الميزانية بنهاية كل أسبوع', completed: false, order: 7 },
      { id: 's5-8', text: 'إعداد تقرير مالي لنهاية الشهر', completed: false, order: 8 },
    ],
  },
  {
    id: 'g-6',
    title: 'قراءة كتابين',
    color: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.4)',
    month: 'September',
    steps: [
      { id: 's6-1', text: 'اختيار الكتابين وشرائهما', completed: false, order: 1 },
      { id: 's6-2', text: 'قراءة 20 صفحة يومياً من الكتاب الأول', completed: false, order: 2 },
      { id: 's6-3', text: 'تدوين الاقتباسات والأفكار المميزة', completed: false, order: 3 },
      { id: 's6-4', text: 'إنهاء الكتاب الأول وكتابة مراجعة عنه', completed: false, order: 4 },
      { id: 's6-5', text: 'البدء بقراءة الكتاب الثاني', completed: false, order: 5 },
      { id: 's6-6', text: 'قراءة 20 صفحة يومياً من الكتاب الثاني', completed: false, order: 6 },
      { id: 's6-7', text: 'إنهاء الكتاب الثاني كاملاً', completed: false, order: 7 },
      { id: 's6-8', text: 'تطبيق فكرة عملية واحدة من كل كتاب', completed: false, order: 8 },
    ],
  },
];

// Helper to get formatted ISO date string YYYY-MM-DD
export function getISODateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Arabic Day Names
export const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Default Tasks seeded by realistic date keys around today (clean 0% completed)
export const DEFAULT_TASKS_BY_DATE: Record<string, any[]> = {};

// 15 Habits initialized cleanly with all false checks (0/30, 0% complete)
export const DEFAULT_HABITS: HabitMonthData = {
  month: 'September',
  lastCalendarDate: getISODateKey(new Date()),
  habits: [
    {
      id: 'h-1',
      title: 'بدء العمل الساعة 6 صباحاً',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-2',
      title: 'أذكار الصباح',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-3',
      title: 'الرد السريع على الإيميلات',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-4',
      title: 'التفاعل مع المتابعين',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-5',
      title: 'استماع لبودكاست تعليمي',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-6',
      title: 'قراءة 20 صفحة من كتاب',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-7',
      title: 'ممارسة الرياضة 45 دقيقة',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-8',
      title: 'شرب 3 لتر ماء',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-9',
      title: 'تدوين اليوميات والامتنان',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-10',
      title: 'جلسة تأمل وتنفس عميق',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-11',
      title: 'الامتناع عن السكريات',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-12',
      title: 'تعلم كلمات إنجليزية جديدة',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-13',
      title: 'ترتيب وتنظيف المكتب',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-14',
      title: 'النوم قبل الساعة 11 مساءً',
      target: 30,
      checks: Array(30).fill(false),
    },
    {
      id: 'h-15',
      title: 'عدم استخدام الهاتف قبل النوم',
      target: 30,
      checks: Array(30).fill(false),
    },
  ],
  sleepHours: Array(30).fill(0),
  sleepQuality: Array(30).fill(0),
};

export const WEEK_COLORS = [
  { name: 'الأسبوع 1', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.2)', text: '#f472b6' }, // Pink
  { name: 'الأسبوع 2', color: '#f87171', bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' }, // Red/Coral
  { name: 'الأسبوع 3', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' }, // Green
  { name: 'الأسبوع 4', color: '#facc15', bg: 'rgba(250, 204, 21, 0.2)', text: '#facc15' }, // Yellow
  { name: 'الأسبوع 5', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8' }, // Blue
];
