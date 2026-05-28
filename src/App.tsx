/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Terminal, 
  BookOpen, 
  Package, 
  HelpCircle, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  FolderCode, 
  Wifi, 
  Sparkles, 
  Code, 
  Globe, 
  FileText, 
  Languages, 
  Smartphone, 
  Database, 
  ChevronRight, 
  Check, 
  HelpCircle as QuestionIcon,
  Shield,
  Zap,
  Square,
  Maximize2,
  Minimize2,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { tokenize, Parser, Environment, NoorInterpreter, resolveColor, resolveBackground } from './noor-compiler.ts';
import { SAMPLE_FILES, SAMPLE_PACKAGES, TUTORIAL_LESSONS } from './noor-data.ts';
import { NoorFile, PackageModule, TutorialLesson } from './types.ts';
import { NoorAppBuilder, NoorPackage } from './noor-builder.ts';
import { NPKRuntime } from './noor-npk-runtime.tsx';

const REUSABLE_SNIPPETS = [
  {
    id: 'game-3d-play',
    title: 'هيكل لعبة 3D قتالية متكاملة',
    category: 'ألعاب ثلاثية الأبعاد (3D)',
    description: 'تهيئة عالم قتالي متكامل ثلاثي الأبعاد مع أرضية، إضاءات شمسية، لاعب متحرك بعناصر ومجسمات فيزيائية مصادمية وتفاعلية.',
    code: `# قالب لعبة ثلاثية الأبعاد تفاعلية سيادية
تحميل_مكتبة("game_engine")
تحميل_مكتبة("game_blueprint")

اكتب("🎮 بدء تهيئة العالم الافتراضي 3D...")
بدء_محرك_الألعاب(1280, 720, صحيح)
تهيئة_الجاذبية_والفيزياء(9.81)

# إعداد خريطة اللعب
إعداد_عالم_3D()

# إنشاء الكائنات ومجسمات اللعب
انشئ اللاعب = إنشاء_شخصية_لاعب("البطل_الخارق", 0, 5, 0)
انشئ بوت_الأعداء = إنشاء_بوت_خصم("مستوى_محترف", "M416", 10, 5)

# تلوين الغلاف الحركي وتحديث المنظومة القتالية
تحديث_النقاط_والحالة_القتالية(اللاعب, "مشروب_طاقة", 50)
`
  },
  {
    id: 'web-srv-api',
    title: 'خادم ويب متقدم ومكونات DOM',
    category: 'الويب والشبكات',
    description: 'بناء وتصميم صفحة إنترنت احترافية متعددة العناصر مدعومة بنظام المكونات الجاهزة وتفعيل خادم استقبال ويب محلي.',
    code: `# خادم ويب تفاعلي مع تصميم DOM متطور
تحميل_مكتبة("web_dom")
تحميل_مكتبة("ui_components")

انشئ موقع = هيكل_صفحة("موقع نور النموذجي")

# تصميم الهيدر وشريط التنقل
انشئ شريط_تنقل = {"type": "navbar", "title": "مستعرض لغة نور", "links": ["الرئيسية", "خدماتنا", "تواصل معنا"]}
أضف(موقع, شريط_تنقل)

# إضافة بطاقة حركية تفاعلية
انشئ ترحيب = "مرحباً بكم في لغة نور البرمجية السيادية"
إضافة_عنوان(موقع, ترحيب, "أخضر_فسفوري")
إضافة_فقرة(موقع, "هذا الموقع يعمل بالكامل في بيئة محلية مستقلة وعالية الأداء.", "براقة")

# تشغيل خادم الويب على منفذ مخصص
تشغيل_سيرفر_الويب(3300, موقع)
`
  },
  {
    id: 'unit-test-spec',
    title: 'حزمة اختبارات برمجية مؤتمتة',
    category: 'جودة الكود (QA)',
    description: 'كتابة اختبارات جودة وتأكيد أداء دوال منطقية متكاملة باستخدام مكتبة الفحص testing.noor والتحقق من صحتها في لوحة النتائج.',
    code: `# كتابة اختبارات منطقية ذكية
تحميل_مكتبة("testing")

اكتب("🧪 بدء اختبار وحدة الرياضيات التكرارية...")

# 1. اختبار دوال العمليات
انشئ نتيجة_الجمع = 10 + 20
اختبار_التطابق(30, نتيجة_الجمع, "اختبار جمع عددين صحيحين")

# 2. اختبار المنطق العكسي
انشئ حالة_الاتصال = صحيح
اختبار_عدم_التطابق(خطأ, حالة_الاتصال, "التأكد من أمان اتصال خادم النواة")

# 3. تشغيل كافة حزم الفحص
تشغيل_كل_الاختبارات(["اختبار جمع عددين صحيحين", "التأكد من أمان اتصال خادم النواة"])
`
  },
  {
    id: 'ai-nlp-sentiment',
    title: 'تصنيف لغوي وتعلم آلي عصبي',
    category: 'الذكاء الاصطناعي',
    description: 'تحليل طبيعة وسياق الجمل اللغوية وتدريب شبكة مبسطة لتصنيف التفاعلات باستخدام الذكاء المدمج بالمعالج السيادي.',
    code: `# تحليل طبيعة المشاعر وتدريب التعلم
تحميل_مكتبة("ai_ml")

اكتب("🧠 جاري تشغيل وحدة تصنيف وتحليل المشاعر...")

انشئ رسالة = "لغة نور البرمجية توفر بيئة برمجية متكاملة وسلسة بشكل لا يصدق"
انشئ المشاعر = تحليل_المشاعر(رسالة)

اكتب("📝 نص المدخلات الرئسي:", رسالة)
اكتب("📊 تصنيف المشاعر بالذكاء المدمج:", المشاعر)
`
  },
  {
    id: 'secure-crypto-aes',
    title: 'تشفير وحماية البيانات الحساسة',
    category: 'الأمان والتشفير',
    description: 'تشفير كلمات المرور والبيانات السرية بمفاتيح آمنة مخصصة وفك تشفيرها لحمايتها من تسريب الأنظمة للهاكرز.',
    code: `# منظومة الخصوصية وتأمين بيانات مديري السيرفرات
تحميل_مكتبة("cryptography")

اكتب("🔒 بدء تشفير كلمات المرور الحساسة...")

انشئ كلمة_المرور = "MyStrongPasswordKey123_Sovereign"
انشئ ناتج_التشفير = تشفير_البيانات(كلمة_المرور)

اكتب("🛠️ النص الأصلي:", كلمة_المرور)
اكتب("🔑 سلسلة الهاش المشفرة المؤمنة:", ناتج_التشفير)
`
  },
  {
    id: 'battle-royale-ui',
    title: 'واجهة ألعاب باتل رويال احترافية (Battle Royale)',
    category: 'برمجة الألعاب (High-End)',
    description: 'تصميم واجهة مستخدم (UI) متطورة لألعاب الباتل رويال تشمل خريطة مصغرة، عداد اللاعبين، نظام الصحة والدرع، وقائمة الأسلحة.',
    code: `# واجهة المستخدم لألعاب القتال والمواجهة (Battle Royale UI)
تحميل_مكتبة("game_ui_pro")
تحميل_مكتبة("interface_macros")

اكتب("⚔️ جاري تحميل واجهة ساحة المعركة السيادية...")

انشئ الواجهة = تهيئة_سطح_اللعب("Noor Battlegrounds")

# 1. تصميم شريط الصحة والدرع (HUD)
انشئ الحالة = إضافة_عنصر(الواجهة, "stats_bar", "أسفل_المنتصف")
تحديث_الصحة(الحالة, 100)
تحديث_الدرع(الحالة, 85)

# 2. الخريطة المصغرة (Mini-map)
إضافة_خريطة(الواجهة, "أعلى_اليمين", {"zoom": 1.5, "show_enemies": صحيح})

# 3. عداد اللاعبين المتبقيين
إضافة_نصوص(الواجهة, "أعلى_اليسار", "👥 اللاعبون: 42/100", "أبيض_براق")

# 4. قائمة الأسلحة والذخيرة (Inventory Slot)
انشئ السلاح = {"name": "M416", "ammo": 30, "total": 120, "rarity": "Legendary"}
عرض_خزنة_السلاح(الواجهة, "أسفل_اليمين", السلاح)

اكتب("✅ تم تفعيل كافة عناصر الواجهة الحركية للعبة.")
`
  }
];

export default function App() {
  // Enhanced File State
  const [files, setFiles] = useState<NoorFile[]>(() => {
    const saved = localStorage.getItem('noor_user_files');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as any[];
        // Migrate legacy .code field to .content to ensure backward compatibility
        const migrated = parsed.map(f => ({
          ...f,
          content: f.content !== undefined ? f.content : (f.code !== undefined ? f.code : '')
        })) as NoorFile[];
        
        // Sync list to make sure we don't miss new sample templates like local-server
        const missing = SAMPLE_FILES.filter(sf => !migrated.some(p => p.id === sf.id || p.name === sf.name));
        return [...migrated, ...missing];
      } catch (e) {
        return SAMPLE_FILES;
      }
    }
    return SAMPLE_FILES;
  });
  const [editorContent, setEditorContent] = useState<string>(() => {
    const saved = localStorage.getItem('noor_editor_last_content');
    if (saved) return saved;
    if (files && files.length > 0) {
      return files[0].content || (files[0] as any).code || '';
    }
    return '';
  });
  const [activeFileId, setActiveFileId] = useState<string>(() => {
    const saved = localStorage.getItem('noor_active_file_id');
    return saved || 'official-noor-website';
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const executionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [terminalLogs, setTerminalLogs] = useState<string[]>(['[Sovereign VM v5.0] تم تشغيل المحرك العياني بنقاوة مطلقة.']);
  const [logHistory, setLogHistory] = useState<string[][]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [compilerError, setCompilerError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Layout tabs
  const [activeNavTab, setActiveNavTab] = useState<'docs' | 'copilot' | 'packages' | 'tutorial' | 'debugger' | 'about' | 'snippets' | 'appbuilder'>('docs');
  const [selectedOS, setSelectedOS] = useState<'linux' | 'termux' | 'windows' | 'mac'>('linux');
  const [docCategory, setDocCategory] = useState<'basics' | 'system' | 'web' | 'advanced' | 'mobile_ai' | 'db_systems' | 'stdlib'>('basics');
  const [testResults, setTestResults] = useState<any[]>([]);
  const fileInputRefForIDEState = useRef<HTMLInputElement>(null);
  
  // App Builder (NPK) State
  const [activeNpkConfig, setActiveNpkConfig] = useState<NoorPackage | null>(null);
  const [npkSimulationLogs, setNpkSimulationLogs] = useState<string[]>([]);
  const [npkAppName, setNpkAppName] = useState('تطبيق_نور_جديد');
  const [npkVersion, setNpkVersion] = useState('1.0.0');
  const [npkPackageName, setNpkPackageName] = useState('com.noorsystems.app');
  const [npkTargetPlatform, setNpkTargetPlatform] = useState<'windows' | 'linux' | 'macos' | 'android' | 'ios' | 'universal'>('universal');

  // Interactive Debugger & Breakpoints States
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [debugSteps, setDebugSteps] = useState<any[]>([]);
  const [currentDebugStepIndex, setCurrentDebugStepIndex] = useState<number>(-1);
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);

  // AI Copilot State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [translationLang, setTranslationLang] = useState<'python' | 'javascript'>('python');
  const [translationInput, setTranslationInput] = useState<string>(
`# Python Example Code
def calculate_discount(price, rate):
    discount = price * (rate / 100)
    final_price = price - discount
    return final_price

result = calculate_discount(1000, 15)
print("The discounted total price is:", result)`
  );

  // Packages State
  const [packages, setPackages] = useState<PackageModule[]>(SAMPLE_PACKAGES);
  const [packageSearch, setPackageSearch] = useState<string>('');
  const [installingPackageName, setInstallingPackageName] = useState<string | null>(null);

  // Tutorials state
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [lessonFeedback, setLessonFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Notifications State
  const [appNotification, setAppNotification] = useState<string | null>(null);

  // Navigations State (per-port routing)
  const [navigatedPagesState, setNavigatedPagesState] = useState<Record<number, any>>({});
  
  // Game Emulator / WebGL State 
  const [isGameEngineRunning, setIsGameEngineRunning] = useState<boolean>(false);
  const [gameStats, setGameStats] = useState({ fps: 60, drawCalls: 120, memory: 50 });
  const [webGLLost, setWebGLLost] = useState<boolean>(false);
  const [osSimulator, setOsSimulator] = useState<'default' | 'linux' | 'apple' | 'windows' | 'termux'>('default');

  // Simulated Local Servers State for Web browser separation
  const [activeServers, setActiveServers] = useState<Record<number, any>>({
    3300: {
      status: 'online',
      responses: {
        '/': {
          type: 'page',
          title: 'بوابة نور الإخبارية وعرض البيانات',
          elements: [
            { type: 'text', textType: 'رأسية_كبيرة', content: "📰 أخبار محرك نور السيادي v5.0" },
            { type: 'text', textType: 'فقرة', content: "تم تشغيل وتفعيل هذا الموقع الإخباري بالكامل محلياً على المنفذ (3300) لمعاينة تجاوب التصاميم وتكامل مخرجات لغة نور." },
            { type: 'list', listType: 'آخر العناوين', items: ["إطلاق الإصدار النهائي من المترجم المستقل", "ربط فوري بمكتبات الرسوم والـ DOM المتقدمة", "تحديث شامل لمستودعات الحزم البرمجية"] }
          ],
          styles: {
            color: 'سماوي_براق',
            background: 'أسود_فحمي',
            fontFamily: 'Tajawal',
            fontSize: 18
          }
        }
      }
    },
    3301: {
      status: 'online',
      responses: {
        '/': {
          type: 'page',
          title: 'بوابة الملفات والبيانات الوطنية',
          elements: [
            { type: 'text', textType: 'رأسية_كبيرة', content: "📁 مستعرض بوابة الملفات المستقلة" },
            { type: 'text', textType: 'فقرة', content: "خادم ملفات مخصص لعرض مستندات التطبيق من القرص الصلب. يعمل محلياً بالتبادل على المنفذ الفرعي (3301) لمنع تضارب الخدمة." },
            { type: 'list', listType: 'الملفات المتوفرة', items: ["stdlib/core.noor", "stdlib/web_dom.noor", "stdlib/colors.noor", "stdlib/ui_components.noor", "package.json", "examples/web_builder.noor"] }
          ],
          styles: {
            color: 'ذهبي_فخم',
            background: 'كحلي_داكن',
            fontFamily: 'Fira Code',
            fontSize: 15
          }
        }
      }
    }
  });

  const [selectedBrowserPort, setSelectedBrowserPort] = useState<number>(3300);
  const [browserUrlAddress, setBrowserUrlAddress] = useState<string>('http://localhost:3300/');
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);

  // Reference for Interpreter
  const interpreterRef = useRef<NoorInterpreter | null>(null);

  // Initialize interpreter
  if (!interpreterRef.current) {
    interpreterRef.current = new NoorInterpreter();
  }

  const stopExecution = () => {
    if (executionTimeoutRef.current) {
      clearTimeout(executionTimeoutRef.current);
      executionTimeoutRef.current = null;
    }
    setIsExecuting(false);
    interpreterRef.current = new NoorInterpreter(); // reset interpreter state
    setTerminalLogs(prev => [...prev, '\n[!] تم إيقاف التنفيذ وإعادة ضبط المحرك.']);
  };

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('noor_user_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('noor_editor_last_content', editorContent);
    // Update current file content in file list
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: editorContent } : f));
  }, [editorContent, activeFileId]);

  useEffect(() => {
    localStorage.setItem('noor_active_file_id', activeFileId);
  }, [activeFileId]);

  // File Management Actions
  const createNewFile = () => {
    const newId = `file_${Date.now()}`;
    const newFile: NoorFile = {
      id: newId,
      name: `ملف_جديد_${files.length + 1}.noor`,
      content: `# برنامج جديد بلغة نور\nاكتب("أهلاً بك في ملفك الجديد!")`,
      category: 'system'
    };
    setFiles([...files, newFile]);
    setActiveFileId(newId);
    setEditorContent(newFile.content);
    showNotification('📄 تم إنشاء ملف جديد ونقله إلى مساحة العمل.');
  };

  const deleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) {
      showNotification('⚠️ لا يمكن حذف آخر ملف متبقي في النظام.');
      return;
    }
    const filtered = files.filter(f => f.id !== id);
    setFiles(filtered);
    if (activeFileId === id) {
      setActiveFileId(filtered[0].id);
      setEditorContent(filtered[0].content);
    }
    showNotification('🗑️ تم حذف الملف نهائياً من الذاكرة المحلية.');
  };

  const renameFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const file = files.find(f => f.id === id);
    if (!file) return;
    const newName = prompt('أدخل الاسم الجديد للملف:', file.name);
    if (newName && newName.trim()) {
      const sanitized = newName.endsWith('.noor') ? newName : `${newName}.noor`;
      setFiles(prev => prev.map(f => f.id === id ? { ...f, name: sanitized } : f));
      showNotification(`✏️ تم تغيير اسم الملف إلى: ${sanitized}`);
    }
  };

  // Lightweight syntax linter to validate curly braces before execution
  const validateSyntax = (code: string): string | null => {
    let stack = [];
    let lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        for (let char of line) {
            if (char === '{') {
                stack.push({ char, line: i + 1 });
            } else if (char === '}') {
                if (stack.length === 0) {
                    return `خطأ في سطر ${i + 1}: تم العثور على قوس إغلاق "}" بدون قوس فتح مطابق "{"`;
                }
                stack.pop();
            }
        }
    }

    if (stack.length > 0) {
        let lastError = stack.pop();
        return `خطأ في سطر ${lastError!.line}: قوس الفتح "{" غير مغلق`;
    }
    return null;
  };

  // Trigger compiler run
  useEffect(() => {
    // Listen for WebGL iframe messages to update Dashboard
    const handleGameMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'NOOR_GAME_STATS') {
        if(e.data.payload) {
          setGameStats(e.data.payload);
        }
      } else if (e.data && e.data.type === 'NOOR_WEBGL_LOST') {
        setWebGLLost(true);
        setTimeout(() => setWebGLLost(false), 2000); // recover
      }
    };
    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, []);

  const runCode = (codeToRun: string = editorContent) => {
    // Perform syntax linter check
    const syntaxError = validateSyntax(codeToRun);
    if (syntaxError) {
        setCompilerError(syntaxError);
        return;
    }
    
    setCompilerError(null);
    setIsExecuting(true);
    
    // Save previous logs to history if interesting
    if (terminalLogs.length > 1) {
      setLogHistory(prev => [terminalLogs, ...prev].slice(0, 10)); // Keep last 10 runs
    }

    setTerminalLogs(['جاري التهيئة...']);
    const startTime = performance.now();
    setTestResults([]);
    
    executionTimeoutRef.current = setTimeout(() => {
      try {
        const result = interpreterRef.current!.run(codeToRun);
        const endTime = performance.now();
        setTestResults(interpreterRef.current!.testResults || []);
        
        setTerminalLogs(result.logs);
        setExecutionTime(Number((endTime - startTime).toFixed(2)));

        if (!result.success) {
          setCompilerError(result.error || 'خطأ تشغيل مجهول.');
        } else {
          // Dynamic servers collection
          const customServers = interpreterRef.current?.localRegistry || {};
          if (Object.keys(customServers).length > 0) {
            setActiveServers(prev => ({ ...prev, ...customServers }));
            const firstNewPort = parseInt(Object.keys(customServers)[0]);
            setSelectedBrowserPort(firstNewPort);
            // Clear prior navigation state
            setNavigatedPagesState(prev => {
              const updated = { ...prev };
              Object.keys(customServers).forEach(p => delete updated[parseInt(p)]);
              return updated;
            });
            setBrowserUrlAddress(`http://localhost:${firstNewPort}/`);
            setActiveNavTab('servers');
            showNotification(`🚀 تم تشغيل موقع ويب بنجاح على خادم نور بالمنفذ المحاكي ${firstNewPort}!`);
          }

          // Core lesson evaluation logic
          const currentLesson = TUTORIAL_LESSONS[activeLessonIndex];
          const combinedLogs = result.logs.join(' ');
          
          if (activeNavTab === 'tutorial') {
            if (combinedLogs.includes(currentLesson.expectedOutputContains)) {
              setLessonFeedback({
                success: true,
                message: '🎉 رائع جداً! مخرجات برنامجك مطابقة للمخرجات المتوقعة للتحدي بنجاح!'
              });
              if (!completedLessons.includes(currentLesson.id)) {
                setCompletedLessons([...completedLessons, currentLesson.id]);
              }
            } else {
              setLessonFeedback({
                success: false,
                message: `⚠️ الكود نفذ بدون أخطاء، ولكن لم يتم العثور على القيمة المتوقعة ("${currentLesson.expectedOutputContains}") في المخرجات. يرجى مراجعة الكود والمحاولة مجدداً!`
              });
            }
          }
        }
      } catch (err: any) {
        const endTime = performance.now();
        setExecutionTime(Number((endTime - startTime).toFixed(2)));
        setCompilerError(err.message || 'فشل التفسير والمزامنة البرمجية.');
      }
      setIsExecuting(false);
    }, 400); // 400ms delay to represent async execution and allow interruption
  };

  const runDebugger = (codeToRun: string = editorContent) => {
    const syntaxError = validateSyntax(codeToRun);
    if (syntaxError) {
        setCompilerError(syntaxError);
        return;
    }
    
    setCompilerError(null);
    setIsExecuting(true);
    setTerminalLogs(['🐞 [وضع مصحح الأخطاء] جاري تفعيل الحاوية السحابية الآمنة لبرمجة نور وتتبع حركة الأكواد...']);
    
    setTimeout(() => {
      try {
        const result = interpreterRef.current!.run(codeToRun, true);
        const steps = interpreterRef.current!.debugSteps || [];
        setTestResults(interpreterRef.current!.testResults || []);
        
        setDebugSteps(steps);
        setTerminalLogs(result.logs.length > 0 ? result.logs : ['[لم ينتج عن التشغيل أي مخرجات]']);
        
        if (!result.success) {
          setCompilerError(result.error || 'حدث خطأ أثناء رصد خطوات الأكواد.');
          setIsDebugMode(false);
          setCurrentDebugStepIndex(-1);
        } else {
          setIsDebugMode(true);
          setActiveNavTab('debugger'); // Automatically switch to Debugger tab!
          
          if (steps.length > 0) {
            setCurrentDebugStepIndex(0);
            showNotification('🐞 تم تشغيل مصحح الأخطاء (Noor Debugger). تتبع السطور والمتغيرات خطوة بخطوة الآن.');
          } else {
            setCurrentDebugStepIndex(-1);
            showNotification('ℹ️ تم إنهاء الكود بنجاح دون أسطر قابلة للتتبع الحركي.');
          }
        }
      } catch (err: any) {
        setCompilerError(err.message || 'فشل تشغيل مصحح الأخطاء.');
        setIsDebugMode(false);
        setCurrentDebugStepIndex(-1);
      }
      setIsExecuting(false);
    }, 300);
  };

  const toggleBreakpoint = (lineNum: number) => {
    setBreakpoints(prev => {
      const next = new Set(prev);
      if (next.has(lineNum)) {
        next.delete(lineNum);
        showNotification(`📍 تم إلغاء نقطة التوقف عند السطر ${lineNum}`);
      } else {
        next.add(lineNum);
        showNotification(`📍 تم تعيين نقطة توقف عند السطر ${lineNum}`);
      }
      return next;
    });
  };

  const resumeDebugger = () => {
    if (debugSteps.length === 0 || currentDebugStepIndex >= debugSteps.length - 1) return;
    
    let targetIndex = -1;
    for (let i = currentDebugStepIndex + 1; i < debugSteps.length; i++) {
      if (breakpoints.has(debugSteps[i].line)) {
        targetIndex = i;
        break;
      }
    }
    
    if (targetIndex !== -1) {
      setCurrentDebugStepIndex(targetIndex);
      showNotification(`📍 تم الوقوف عند نقطة التوقف المعينة بالسطر ${debugSteps[targetIndex].line}`);
    } else {
      setCurrentDebugStepIndex(debugSteps.length - 1);
      showNotification('🏁 اكتمل تنفيذ تتبع البرنامج بالكامل.');
    }
  };

  const stopDebugger = () => {
    setIsDebugMode(false);
    setCurrentDebugStepIndex(-1);
    setDebugSteps([]);
    showNotification('⏹️ تم الخروج من وضع تتبع ومصحح الأخطاء بنجاح.');
  };

  // Quick select example files
  const selectFile = (file: NoorFile) => {
    setActiveFileId(file.id);
    setEditorContent(file.content);
    setCompilerError(null);
  };

  // Run AI query
  const handleAiQuery = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await response.json();
      if (data.error) {
        setAiResponse(`خطأ المساعد: ${data.error}`);
      } else {
        setAiResponse(data.response);
      }
    } catch (error) {
      setAiResponse('عذراً، تعذر الاتصال بمساعد نور الذكي في الوقت الحالي. تحقق من اتصال الخادم المحلي.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Translate code to Noor
  const handleCodeTranslation = async () => {
    if (!translationInput.trim()) return;
    setIsAiLoading(true);
    
    try {
      const response = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode: translationInput, language: translationLang })
      });
      const data = await response.json();
      if (data.error) {
        setAppNotification(`حدث خطأ أثناء الترجمة: ${data.error}`);
      } else {
        // Append response as new translated buffer or preview
        setEditorContent(data.response);
        setAppNotification('📥 تم تحويل كود المصدر وإرساله إلى مترجم لغة نور المستقلة بنجاح!');
        setActiveFileId('custom-translated');
      }
    } catch (error) {
      setAppNotification('تعذر استدعاء معالج الترجمة الذكي.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Install package simulator
  const installPackage = (name: string) => {
    setInstallingPackageName(name);
    setTimeout(() => {
      setPackages(prev =>
        prev.map(pkg => pkg.name === name ? { ...pkg, isInstalled: true } : pkg)
      );
      setInstallingPackageName(null);
      // Run compiler event representing import activation
      interpreterRef.current?.run(`تحميل_مكتبة("${name}")`);
      setEditorContent(prev => `# تم تفعيل حزمة [${name}] بنجاح!\nتحميل_مكتبة("${name}")\n\n` + prev);
      showNotification(`📦 تم تثبيت الحزمة المستقلة "${name}" ودمجها في نوى لغة نور البرمجية بنجاح!`);
    }, 1200);
  };

  // Notifications
  const showNotification = (msg: string) => {
    setAppNotification(msg);
    setTimeout(() => setAppNotification(null), 5000);
  };

  // Auto compile on example select
  useEffect(() => {
    runCode(editorContent);
  }, [editorContent]);

  // Load lesson template
  const loadLesson = (lesson: TutorialLesson) => {
    setEditorContent(lesson.codeTemplate);
    setLessonFeedback(null);
    setCompilerError(null);
    showNotification(`📚 تم تحميل التحدي البرمجي: ${lesson.arabicTitle}`);
  };

  // حفظ واستعادة كارت وحالة الـ IDE بالكامل بملف JSON خارجي للتخزين والمزامنة والمشاركة
  const downloadIDEStateJSON = () => {
    const stateObj = {
      editorContent,
      files,
      preferences: {
        activeNavTab,
        activeLessonIndex,
        completedLessons,
        selectedBrowserPort,
        isDebugMode
      },
      exportedAt: new Date().toISOString()
    };
    
    const jsonStr = JSON.stringify(stateObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'noor-ide-state.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('💾 تم تحميل وحفظ ملف حالة الـ IDE بالكامل بنجاح!');
  };

  const handleImportIDEStateJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const stateObj = JSON.parse(event.target?.result as string);
        if (stateObj.editorContent !== undefined && Array.isArray(stateObj.files)) {
          setEditorContent(stateObj.editorContent);
          setFiles(stateObj.files);
          if (stateObj.preferences) {
            if (stateObj.preferences.activeNavTab) setActiveNavTab(stateObj.preferences.activeNavTab as any);
            if (stateObj.preferences.activeLessonIndex !== undefined) setActiveLessonIndex(stateObj.preferences.activeLessonIndex);
            if (Array.isArray(stateObj.preferences.completedLessons)) setCompletedLessons(stateObj.preferences.completedLessons);
            if (stateObj.preferences.selectedBrowserPort !== undefined) setSelectedBrowserPort(stateObj.preferences.selectedBrowserPort);
            if (stateObj.preferences.isDebugMode !== undefined) setIsDebugMode(stateObj.preferences.isDebugMode);
          }
          showNotification('♻️ تم استرجاع واستعادة كامل حالة الـ IDE بنجاح!');
        } else {
          showNotification('❌ بنية ملف حالة الـ IDE غير صالحة.');
        }
      } catch (err) {
        showNotification('❌ حدث خطأ أثناء قراءة وتحليل ملف الحالة.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset target value
  };

  // Generate standard software export
  const downloadNoorCompilerBundle = () => {
    // Generate text contents for a real Node.js CLI compiler environment of Noor
    const readmeContent = `
========================================================================
🌟 لغة نور البرمجية المستقلة (Noor Programming Language) - الإصدار v5.0 Sovereign Master 🌟
========================================================================
لغة برمجة مستقلة تماماً، نابعة من الصفر، بمحرك تحليل مخصص ومعالج أداء فائق.
تأسست لتكون بديلاً شاملاً لجميع اللغات (Python, Javascript, Java, C++ وغيرها).

🚀 مميزات لغة نور 5.0 (المعالج الخارق):
------------------------------------------------------------------------
- استقلال تام بدون أي تبعيات لأي لغة أخرى.
- معالجة الأخطاء الذكية.
- تدعم تعديل وحذف وإدارة الملفات والمجلدات بصلاحيات النظام الحقيقية.
- انشاء وتصميم وتلوين صفحات الويب وتوجيه المتصفحات والجداول.
- بناء تطبيقات هواتف ذكية (أندرويد وآبل) وبرمجة الالعاب الضخمة.
- إدارة خوادم المواقع وقواعد البيانات المتقدمة وتشفيرها.
- تعلم الآلة والذكاء الاصطناعي وتحليل البيانات والشبكات العصبية.
- دعم جميع أسطر الأوامر على كافة البيئات (Termux, Linux, Windows, Mac).
- التحكم في سيرفرات لينكس وتلقيم المهام تلقائياً وإدارة الأنظمة القديمة.
- تصميم شامل ونماذج وقوائم وروابط ورسوم متحركة على الويب.

ملفات الحزمة المستقلة المرفقة في مجلد (Noor_Sovereign_SDK):
1. README.md        - ملف الشرح والتوثيق الموسع الذي تستخدمه حالياً.
2. noor.js          - محرك المفسّر ومحلل الرموز (Sovereign Interpreter Core V5.0).
3. noor-cli.js      - أداة تشغيل أسطر الأوامر للغة على أنظمة التشغيل المختلفة.
4. examples/        - مجلد يحتوي على أمثلة متطورة في شتى المجالات مكتوبة بلغة نور.
5. stdlib/          - مجلد يضم جميع المكاتب القياسية والموارد العالمية.

طريقة تشغيل ملفات لغة نور محليا عبر أسطر الأوامر (Terminal):
------------------------------------------------------------------------
تأكد من وجود بيئة Runtime مثبتة في جهازك، ثم نفذ المعالج المستقل:

$ noor-cli run server.noor
`;

    const noorJsLib = `// لغة نور البرمجية - محرك التحليل والترجمة الأساسي (Noor Sovereign Tokenizer & VM Engine)
// الإصدار المستقل ومفتوح المصدر بالكامل v5.0 Sovereign Master

${tokenize.toString()}
${Parser.toString()}
${Environment.toString()}
${NoorInterpreter.toString()}
module.exports = { NoorInterpreter, tokenize, Parser };
`;

    const cliWrapper = `#!/usr/bin/env node
// أداة التشغيل المستقلة للغة نور عبر أسطر الأوامر (Noor CLI Runner)
const fs = require('fs');
const path = require('path');
const { NoorInterpreter } = require('./noor.js');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("❌ يرجى تحديد مسار ملف لغة نور لتشغيله مثلاً: node noor-cli.js script.noor");
  process.exit(1);
}

const filePath = path.resolve(args[0]);
if (!fs.existsSync(filePath)) {
  console.log("❌ تعذر العثور على ملف لغة نور المحدد بالمسار:", filePath);
  process.exit(1);
}

const sourceCode = fs.readFileSync(filePath, 'utf-8');
const interpreter = new NoorInterpreter();

console.log("⚡ [محرك نور VM] جاري معالجة وتشغيل الكود المستقل...");
const result = interpreter.run(sourceCode);

if (result.success) {
  console.log("\\n--- مخرجات البرنامج الكلية ---");
  result.logs.forEach(log => console.log(log));
  console.log("-------------------------------");
  console.log("🟢 تم الانتهاء من التنفيذ بنجاح وتفوق.");
} else {
  console.log("\\n🔴 خطأ في التشغيل (تم المعالجة عبر نظام صيد الأخطاء):");
  console.error(result.error);
}
`;

    const fullPlatformEx = `# نظام منصة إحصائيات متكامل بدون قيود احترافية
تحميل_مكتبة("noor-web-dom")

المنصة = هيكل_صفحة("منصة Analytics Pro")
خلفية_الصورة(المنصة, "كحلي_داكن")
تلوين_النص(المنصة, "سماوي_براق")
تنسيق_الخط(المنصة, "Tajawal", 15)

# تنبيه منبثق
إضافة_تنبيه(المنصة, "تم تحديث خوارزميات الذكاء الاصطناعي بنجاح", "success")

# القائمة العلوية
إضافة_شريط_تنقل(المنصة, "AnalyticsPro", ["لوحة القيادة", "المبيعات", "الذكاء الاصطناعي", "خروج"])

# مساحة العمل الرئيسية
الهيكل = إضافة_حاوية(المنصة, "row")

# الشريط الجانبي
إضافة_شريط_جانبي(الهيكل, "أدوات التحليل", ["الإحصائيات السريعة", "تصدير البيانات", "إعدادات الرسوم"])

# المحتوى الفعلي
المحتوى = إضافة_حاوية(الهيكل, "col")

# نصوص ترحيبية
إضافة_نصوص(المحتوى, "حجم_ضخم", "لوحة القيادة المباشرة ⚡")
إضافة_نصوص(المحتوى, "فقرة", "هذا لوحة مؤشرات واحصائيات مباشرة تم تصميمها بحرية بدون أية قيود على محتوى الصفحة وبشكل احترافي.")

# شبكة البيانات
احصائيات = إضافة_شبكة(المحتوى, 3)
ايرادات = إضافة_بطاقة(احصائيات, "إيرادات اليوم")
إضافة_نصوص(ايرادات, "رأسية_كبيرة", "$ 40,500.00")

تفاعل = إضافة_بطاقة(احصائيات, "معدل التفاعل")
إضافة_نصوص(تفاعل, "رأسية_كبيرة", "% 94.2")

زوار = إضافة_بطاقة(احصائيات, "نشاط المستخدمين")
إضافة_شاشة_تحميل(زوار, "جاري جلب الزوار النشطين...")

# رسم بياني جديد
مبيعات_الشهر = إضافة_رسم_بياني(المحتوى, "مبيعات الشهر الماضي (بآلاف الدولارات)", [12, 19, 15, 25, 22, 30, 24, 38, 20, 42])

# نماذج الإدخال
بطاقة_نموذج = إضافة_بطاقة(المحتوى, "طلب تقرير مخصص")
نموذج = تصميم_نموذج(بطاقة_نموذج, "إعدادات التقرير")
إضافة_حقل_إدخال(نموذج, "اسم التقرير", "اكتب اسماً للتقرير")
إضافة_قائمة_منسدلة(نموذج, "نوع التقرير", ["مالي", "أمني", "أداء السيرفر"])
واجهة_زر(نموذج, "إنشاء تقرير", "توليد_التقرير")

# التذييل السفلي للصفحة
إضافة_تذييل(المنصة)

اكتب("تم بناء المنصة الاحترافية بدون قيود بنجاح.")`;

    const webEx = `# بناء مواقع احترافية ومتجاوبة باستخدام مكتبات نور المضمنة
تحميل_مكتبة("noor-web-dom")
انشئ صفحة_رئيسية = هيكل_صفحة("مرحباً بكم في لغة نور")
تلوين_النص(صفحة_رئيسية, "أبيض")
خلفية_الصورة(صفحة_رئيسية, "cosmic_dark_blue")
انشئ نموذج_دخول = تصميم_نموذج("تسجيل الدخول", "admin@noor.org")
تجاوب_الواجهة(نموذج_دخول, ["كمبيوتر", "هاتف", "لوحي"])
اكتب("تم بناء واجهة الموقع وإضافة تأثيرات الحركات بنجاح.")
`;

    const machineEx = `# معالجة وتحليل البيانات الضخمة وتعلم الآلة بلغة نور
تحميل_مكتبة("noor-ml-core")
انشئ اتصال = اتصال_قاعدة_بيانات("Noor_BigData")
انشئ بيانات = استعلام_سريع("SELECT * FROM ai_models")
انشئ نموذج = تدريب_نموذج("الشبكة_العصبية_العميقة", بيانات)
اكتب("النموذج جاهز.", نموذج)
`;

    const gameEx = `# بناء ألعاب وتطبيقات الهواتف الضخمة
تحميل_مكتبة("noor-3d-engine")
تهيئة_محرك()
انشئ درع = رسم_مجسم("بطل_خارق", "مركز")
تصدير_هاتف("أندرويد")
تصدير_هاتف("آيفون")
اكتب("تم الانتهاء من معالجة المخرجات اللعبية للهواتف الذكية.")
`;
    // Package contents inside single file as a generic text-based bundle (simulating zip payload for simple copy-pasting locally)
    const fileContent = `
#####################################################################
#                   مجلد حزمة لغة نور المفتوحة بالكامل                   #
#         (Noor Language Full Development Kit - Offline Bundle)         #
#####################################################################

📁 [الملف 1]: README.md
---------------------------------------------------------------------
${readmeContent}

📁 [الملف 2]: src/noor.js  (محرك ومترجم اللغة)
---------------------------------------------------------------------
${noorJsLib}

📁 [الملف 3]: bin/noor-cli.js (أداة سطر الأوامر لتلقيم المهام)
---------------------------------------------------------------------
${cliWrapper}

📁 [الملف 4]: examples/web_builder.noor (انشاء مواقع ويب)
---------------------------------------------------------------------
${webEx}

📁 [الملف 5]: examples/machine_learning.noor (ذكاء اصطناعي وتعلم الالة)
---------------------------------------------------------------------
${machineEx}

📁 [الملف 6]: examples/game_engine.noor (برمجة العاب وبناء تطبيقات هواتف)
---------------------------------------------------------------------
${gameEx}

📁 [الملف 7]: user_workspace/main.noor (كود المحرر الحالي)
---------------------------------------------------------------------
${editorContent}

📁 [الملف 8]: examples/pro_dashboard.noor (منصة مرنة متكاملة)
----------------------------------------------------------------------
${fullPlatformEx}

=================== نهاية تفريغ الحزمة ===================
`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Noor_Sovereign_Compiler_Language_SDK_v4.0.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('📦 تم تصدير مجلد وملفات حزمة لغة نور المستقلة بالكامل (SDK) مكتوبة بدقة ومزودة بكل الشروحات!');
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
    pkg.description.includes(packageSearch)
  );

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-[#000000] text-slate-300 font-sans antialiased text-right selection:bg-emerald-500/30 selection:text-emerald-200" dir="rtl">
      {/* Visual background ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Modern Top Header Bar */}
      <header className="relative z-50 bg-[#02050a]/95 backdrop-blur-md border-b border-cyan-900/30 px-6 py-4 flex flex-wrap gap-4 items-center justify-between shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 bg-gradient-to-br from-[#0a1525] to-[#050a12] border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
              Noor Sovereign IDE
              <span className="text-[10px] bg-cyan-950/50 border border-cyan-800 text-cyan-400 px-3 py-0.5 rounded-full font-mono tracking-wider">v5.0</span>
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-none tracking-wide uppercase">
              المحرك المستقل للمعالجة والترجمة الفورية
            </p>
          </div>
        </div>

        {/* System parameters indicators */}
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="hidden md:flex items-center gap-2 bg-[#050a12] border border-cyan-900/40 px-5 py-2 rounded-full text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-bold">SOVEREIGN CORE ONLINE</span>
          </div>

          <button 
            id="download-cli"
            onClick={downloadNoorCompilerBundle}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 active:scale-95 text-white font-bold px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] border border-cyan-500/30"
          >
            <Download className="w-4 h-4" />
            <span>تصدير SDK</span>
          </button>

          <button 
            onClick={downloadIDEStateJSON}
            className="flex items-center gap-2 bg-[#0d1527] border border-cyan-900/40 hover:border-cyan-500/50 active:scale-95 text-slate-200 hover:text-white px-4 py-2 rounded-full transition-all"
            title="تنزيل ملف JSON بحالة المحرر والتفضيلات والملفات الحالية"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>حفظ حالة الـ IDE</span>
          </button>

          <button 
            onClick={() => fileInputRefForIDEState.current?.click()}
            className="flex items-center gap-2 bg-[#0c1322] border border-emerald-900/40 hover:border-emerald-500/50 active:scale-95 text-slate-200 hover:text-white px-4 py-2 rounded-full transition-all"
            title="استرجاع حالة الـ IDE من ملف JSON محفوظ سابقاً"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>استعادة الحالة</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRefForIDEState} 
            onChange={handleImportIDEStateJSON} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex flex-col lg:flex-row relative w-full lg:overflow-hidden">
        
        {/* Toast Notifier */}
        <AnimatePresence>
          {appNotification && appNotification !== 'NOOR_NPK_RUNTIME' && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0d1527] border border-cyan-500/30 text-slate-100 px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-xl max-w-md text-sm border-r-4 border-r-cyan-500 text-right"
              dir="rtl"
            >
              <Check className="w-5 h-5 text-cyan-400 shrink-0" />
              <p className="leading-relaxed font-semibold">{appNotification}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NPK Runtime Overlay */}
        <AnimatePresence>
          {appNotification === 'NOOR_NPK_RUNTIME' && activeNpkConfig && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 max-h-screen pt-4 pb-4">
                 <NPKRuntime 
                   npk={activeNpkConfig} 
                   onClose={() => setAppNotification(null)} 
                 />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. File Drawer & Menu (Right Sidebar) */}
        {!isFullScreen && (
          <aside className="w-full lg:w-[280px] flex flex-col gap-4 border-l border-slate-900 bg-[#040608] shrink-0 p-4 overflow-y-auto">
            {/* Quick Start Code templates Selection Card */}
          <div className="bg-[#0a0d14] border border-slate-800 rounded-lg p-3 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <FolderCode className="w-4 h-4 text-cyan-500" />
                <h3 className="font-bold text-sm text-slate-200">مدير الملفات</h3>
              </div>
              <button 
                onClick={createNewFile}
                className="p-1 hover:bg-slate-800 rounded text-cyan-400"
                title="إنشاء ملف جديد"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5 h-full max-h-[300px] overflow-y-auto pr-1">
              {files.map(file => (
                <div key={file.id} className="group relative">
                  <button
                    id={`select-file-${file.id}`}
                    onClick={() => selectFile(file)}
                    className={`w-full flex items-center justify-between text-right px-2.5 py-2.5 rounded text-xs font-semibold transition-all ${
                      activeFileId === file.id
                        ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                        : 'hover:bg-slate-800/60 border border-transparent text-slate-400 hover:text-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate ml-12">
                      <Code className={`w-3.5 h-3.5 shrink-0 ${activeFileId === file.id ? 'text-cyan-400' : 'text-slate-600'}`} />
                      <span className="font-mono truncate">{file.name}</span>
                    </div>
                  </button>
                  <div className="absolute left-1 top-1.5 hidden group-hover:flex items-center gap-1 z-10">
                    <button 
                      onClick={(e) => renameFile(file.id, e)}
                      className="p-1 hover:text-cyan-400 text-slate-600"
                      title="إعادة تسمية"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => deleteFile(file.id, e)}
                      className="p-1 hover:text-rose-400 text-slate-600"
                      title="حذف"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Navigation Sidebar */}
          <div className="bg-[#02050a] border-l border-cyan-900/30 flex flex-row lg:flex-col overflow-x-auto shadow-inner">
            <button
              id="tab-docs"
              onClick={() => setActiveNavTab('docs')}
              className={`flex-1 lg:flex-none flex items-center gap-4 px-6 py-4 text-xs font-bold transition-all text-right border-b lg:border-b-0 lg:border-r-2 ${
                activeNavTab === 'docs' ? 'bg-cyan-950/20 text-cyan-300 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-950/40'
              }`}
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline">التوثيقات</span>
            </button>
            <button
              id="tab-copilot"
              onClick={() => setActiveNavTab('copilot')}
              className={`flex-1 lg:flex-none flex items-center gap-4 px-6 py-4 text-xs font-bold transition-all text-right border-b lg:border-b-0 lg:border-r-2 ${
                activeNavTab === 'copilot' ? 'bg-cyan-950/20 text-cyan-300 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-950/40'
              }`}
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline">المترجم الذكي</span>
            </button>
            <button
              id="tab-packages"
              onClick={() => setActiveNavTab('packages')}
              className={`flex-1 lg:flex-none flex items-center gap-4 px-6 py-4 text-xs font-bold transition-all text-right border-b lg:border-b-0 lg:border-r-2 ${
                activeNavTab === 'packages' ? 'bg-cyan-950/20 text-cyan-300 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-950/40'
              }`}
            >
              <Package className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline">إدارة الحزم</span>
            </button>
            <button
              id="tab-tutorial"
              onClick={() => setActiveNavTab('tutorial')}
              className={`flex-1 lg:flex-none flex items-center gap-4 px-6 py-4 text-xs font-bold transition-all text-right border-b lg:border-b-0 lg:border-r-2 ${
                activeNavTab === 'tutorial' ? 'bg-cyan-950/20 text-cyan-300 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-950/40'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline">الأكاديمية</span>
            </button>
            <button
              id="tab-debugger"
              onClick={() => setActiveNavTab('debugger')}
              className={`flex-1 lg:flex-none flex items-center justify-between gap-4 px-6 py-4 text-xs font-bold transition-all duration-150 active:scale-[0.97] text-right border-b lg:border-b-0 lg:border-r-2 group relative overflow-hidden ${
                activeNavTab === 'debugger' 
                  ? 'bg-cyan-950/35 text-cyan-300 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15),inset_-4px_0_12px_rgba(6,182,212,0.1)]' 
                  : 'text-slate-400 border-transparent hover:text-cyan-300 hover:bg-cyan-950/20 hover:border-cyan-400/40'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-cyan-500/0 via-cyan-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <Cpu className={`w-5 h-5 shrink-0 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 ${
                  activeNavTab === 'debugger' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,253,0.6)]' : 'text-slate-400 group-hover:text-cyan-400'
                }`} />
                <span className="hidden lg:inline tracking-wide transition-all duration-300 group-hover:translate-x-[-2px]">مصحح الأخطاء</span>
              </div>
              {isDebugMode && (
                <div className="hidden lg:flex items-center relative z-10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                </div>
              )}
            </button>
            <button
              id="tab-servers"
              onClick={() => setActiveNavTab('servers')}
              className={`flex-1 lg:flex-none flex items-center justify-between gap-4 px-6 py-4 text-xs font-bold transition-all duration-150 active:scale-[0.97] text-right border-b lg:border-b-0 lg:border-r-2 group relative overflow-hidden ${
                activeNavTab === 'servers' 
                  ? 'bg-emerald-950/35 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15),inset_-4px_0_12px_rgba(16,185,129,0.1)]' 
                  : 'text-slate-400 border-transparent hover:text-emerald-300 hover:bg-emerald-950/20 hover:border-emerald-400/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.12)]'
              }`}
            >
              {/* Light glow overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/0 via-emerald-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-4 relative z-10">
                <Globe className={`w-5 h-5 shrink-0 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 ${
                  activeNavTab === 'servers' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'text-slate-400 group-hover:text-emerald-400'
                }`} />
                <span className="hidden lg:inline tracking-wide transition-all duration-300 group-hover:translate-x-[-2px]">المستعرض والمحاكاة</span>
              </div>
              
              {/* Live simulation active pulse (RTL puts it in the left margin) */}
              <div className="hidden lg:flex items-center relative z-10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </button>
            <button
              id="tab-appbuilder"
              onClick={() => setActiveNavTab('appbuilder')}
              className={`flex-1 lg:flex-none flex items-center justify-between gap-4 px-6 py-4 text-xs font-bold transition-all duration-150 active:scale-[0.97] text-right border-b lg:border-b-0 lg:border-r-2 group relative overflow-hidden ${
                activeNavTab === 'appbuilder' 
                  ? 'bg-rose-950/35 text-rose-300 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]' 
                  : 'text-slate-400 border-transparent hover:text-rose-300 hover:bg-rose-950/20 hover:border-rose-400/40'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-rose-500/0 via-rose-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <Smartphone className={`w-5 h-5 shrink-0 transition-all duration-300 group-hover:scale-110 ${
                  activeNavTab === 'appbuilder' ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]' : 'text-slate-400 group-hover:text-rose-400'
                }`} />
                <span className="hidden lg:inline tracking-wide transition-all duration-300">مجمّع التطبيقات (NPK)</span>
              </div>
            </button>
            <button
              id="tab-snippets"
              onClick={() => setActiveNavTab('snippets')}
              className={`flex-1 lg:flex-none flex items-center gap-4 px-6 py-4 text-xs font-bold transition-all text-right border-b lg:border-b-0 lg:border-r-2 ${
                activeNavTab === 'snippets' ? 'bg-cyan-950/20 text-cyan-300 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-950/40'
              }`}
            >
              <Code className="w-5 h-5 shrink-0 text-cyan-400" />
              <span className="hidden lg:inline">القصاصات البرمجية</span>
            </button>
            <button
              id="tab-about"
              onClick={() => setActiveNavTab('about')}
              className={`flex-1 lg:flex-none flex items-center gap-4 px-6 py-4 text-xs font-bold transition-all text-right ${
                activeNavTab === 'about' ? 'bg-cyan-950/20 text-cyan-300 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-950/40'
              }`}
            >
              <HelpCircle className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline">عن المحرك</span>
            </button>
          </div>
        </aside>
        )}

        {/* 2. Interactive IDE Area (Center Window) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#000000] lg:border-l border-slate-900 w-full min-h-[500px] lg:min-h-0">
          <div className="flex-1 flex flex-col relative w-full h-full">
            {/* Ambient IDE tab accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-500" />
            
            {/* Editor Header controls */}
            <div className="bg-[#040608] px-4 py-2 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-300 ml-1">المحرر</span>
                
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="text-slate-500 hover:text-cyan-400 focus:outline-none ml-2 transition-colors mr-2"
                  title={isFullScreen ? 'إلغاء وضع ملء الشاشة' : 'تكبير وضع ملء الشاشة'}
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <span className="text-[10px] bg-[#0a0d14] border border-cyan-500/20 text-cyan-400 px-2 py-1 flex items-center justify-center font-mono">
                  {editorContent.length} حرف
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isExecuting && (
                  <button
                    onClick={stopExecution}
                    className="flex items-center gap-1.5 bg-rose-900/40 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded transition-all text-xs font-bold"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>إيقاف (Stop)</span>
                  </button>
                )}
                <button
                  id="btn-run-code"
                  onClick={() => runCode()}
                  disabled={isExecuting}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded transition-all text-xs font-bold ${
                    isExecuting 
                      ? 'bg-emerald-900/20 text-emerald-600 border border-emerald-900/30 cursor-not-allowed'
                      : 'bg-emerald-900/40 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isExecuting ? 'تشغيل...' : 'تـنفـيـذ (Run)'}</span>
                </button>
                <button
                  onClick={() => runDebugger()}
                  disabled={isExecuting || isGameEngineRunning}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded transition-all text-xs font-bold ${
                    isExecuting 
                      ? 'bg-cyan-900/20 text-cyan-600 border border-cyan-900/30 cursor-not-allowed'
                      : 'bg-cyan-950/40 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/35'
                  }`}
                  title="تتبع وسير البرنامج خطوة بخطوة وفحص المتغيرات"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>تـصحـيـح (Debug)</span>
                </button>
                <button
                  id="ui-layer"
                  onClick={() => {
                    setIsGameEngineRunning(prev => !prev);
                    if (!isGameEngineRunning) {
                      setWebGLLost(false);
                      showNotification("🎮 بيئة العرض ثنائية وثلاثية الأبعاد مفعلة.");
                    }
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded transition-all text-xs font-bold ${
                    isGameEngineRunning
                      ? 'bg-amber-600/20 text-amber-500 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-[#0f172a] hover:bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                  title="تشغيل محاكي الألعاب (WebGL) فوراً"
                >
                  {isGameEngineRunning ? <XCircle className="w-3.5 h-3.5 animate-pulse" /> : <Gamepad2 className="w-3.5 h-3.5" />}
                  <span>{isGameEngineRunning ? 'إيقاف اللعبة' : 'تشغيل اللعبة'}</span>
                </button>
              </div>
            </div>

            {/* Editing and Line Numbers Workspace */}
            <div className="flex-1 flex bg-[#010308] font-mono text-sm relative">
              
              {/* === GAME ENGINE WEBGL OVERLAY === */}
              <AnimatePresence>
                {isGameEngineRunning && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="absolute inset-0 z-50 bg-[#0d1117] flex justify-center items-center overflow-hidden"
                  >
                    <div 
                      className={`relative w-full h-full p-2 transition-all duration-300 ${isGameEngineRunning ? 'shadow-[0_0_80px_rgba(34,211,253,0.15)] ring-1 ring-cyan-500/20' : ''}`}
                    >
                      {/* Dashboard Overlay */}
                      <div className="absolute top-4 left-4 z-10 flex gap-4">
                        <div className="bg-black/80 backdrop-blur-md border border-slate-700/50 rounded p-3 flex flex-col gap-2 min-w-[140px] shadow-2xl relative overflow-hidden">
                          {/* Inner glow */}
                          <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(34,211,253,0.05)] pointer-events-none" />
                          <h4 className="text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 flex justify-between pr-1">
                            <span>🎮 Game Engine</span>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mt-0.5" />
                          </h4>
                          <div className="flex flex-col gap-1.5 text-xs font-mono">
                            <div className="flex justify-between items-center text-emerald-400">
                              <span className="text-slate-500">FPS:</span> 
                              <span>{gameStats.fps}</span>
                            </div>
                            <div className={`flex justify-between items-center ${gameStats.drawCalls > 80 ? 'text-amber-400' : 'text-slate-300'}`}>
                              <span className="text-slate-500">Draws:</span> 
                              <span>{gameStats.drawCalls}</span>
                            </div>
                            <div className={`flex justify-between items-center ${gameStats.memory > 80 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
                              <span className="text-slate-500">Memory:</span> 
                              <span>{gameStats.memory}MB</span>
                            </div>
                          </div>
                        </div>

                        {/* OS Simulator Target selector */}
                        <div className="bg-black/80 backdrop-blur-md border border-slate-700/50 rounded p-2 flex flex-col gap-2 shadow-2xl overflow-hidden">
                          <h4 className="text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 text-center">
                            بيئة التشغيل (OS)
                          </h4>
                          <div className="flex flex-col gap-1">
                            {['default', 'apple', 'windows', 'linux', 'termux'].map(os => (
                              <button
                                key={os}
                                onClick={() => setOsSimulator(os as any)}
                                className={`text-[10px] px-2 py-1 rounded transition-colors ${osSimulator === os ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
                              >
                                {os.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Game Screen / WebGL Canvas styled according to OS */}
                      <div className={`w-full h-full relative flex items-center justify-center p-8 transition-all duration-300 ${
                        osSimulator === 'apple' ? 'bg-[#1e1e1e]' :
                        osSimulator === 'windows' ? 'bg-[#0078d7]/10' :
                        osSimulator === 'linux' ? 'bg-[#300a24]' :
                        osSimulator === 'termux' ? 'bg-black' : 'bg-transparent'
                      }`}>
                        <div className={`w-full h-full overflow-hidden transition-all duration-300 ${
                          osSimulator === 'apple' ? 'rounded-xl shadow-2xl border border-slate-700 max-w-4xl max-h-[600px] bg-black' :
                          osSimulator === 'windows' ? 'rounded-none shadow-xl border-2 border-[#0078d7] max-w-4xl max-h-[600px] bg-black' :
                          osSimulator === 'linux' ? 'rounded-lg shadow-2xl border-4 border-[#300a24] bg-black max-w-4xl max-h-[600px]' :
                          osSimulator === 'termux' ? 'rounded-none shadow-none border-none bg-black' : 'rounded-lg border border-slate-800 bg-black'
                        } relative`}>

                          {/* Decorative OS Titlebars */}
                          {osSimulator === 'apple' && (
                            <div className="h-6 bg-[#2d2d2d] flex items-center px-3 gap-2 border-b border-black">
                               <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                               <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                               <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                            </div>
                          )}
                          {osSimulator === 'windows' && (
                            <div className="h-7 bg-[#000] border-b border-[#0078d7] flex items-center justify-between px-2">
                               <div className="text-[10px] text-white">Noor App - Windows</div>
                               <div className="flex gap-2">
                                 <div className="w-2.5 h-2.5 border-b border-white"></div>
                                 <div className="w-2.5 h-2.5 border border-white"></div>
                                 <div className="text-white text-[10px] leading-none">✕</div>
                               </div>
                            </div>
                          )}
                          {osSimulator === 'linux' && (
                            <div className="h-6 bg-[#3b3a39] flex items-center justify-center px-4">
                               <div className="text-[10px] text-[#dfdbd2]">noor@ubuntu: ~/games</div>
                            </div>
                          )}

                          {webGLLost ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                            <span className="w-8 h-8 rounded-full border-2 border-t-cyan-500 border-r-cyan-500 border-b-transparent border-l-transparent animate-spin mb-3" />
                            <h3 className="text-sm text-cyan-400 font-bold">جاري استعادة سياق المحرك (WebGL Context Restoring)...</h3>
                            <p className="text-xs text-slate-500 mt-1">يتم تنظيف الذاكرة المسرّبة وإعادة تصيير المشهد.</p>
                          </div>
                        ) : null}
                        
                        {/* We use an Iframe to isolate the BabylonJS/Canvas engine completely and prevent React state conflicts */}
                        <iframe 
                          id="renderCanvas"
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body { margin: 0; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; color: white; font-family: monospace; }
                                    canvas { width: 100vw; height: 100vh; touch-action: none; display: block; }
                                    .glitch-text { animation: glitcheff 2s infinite linear; }
                                    @keyframes glitcheff {
                                      0% { opacity: 1; }
                                      50% { opacity: 0.8; }
                                      100% { opacity: 1; }
                                    }
                                </style>
                            </head>
                            <body>
                                <!-- Simulated internal game engine preview for UI purposes -->
                                <div style="position: absolute; text-align: center; pointer-events: none;">
                                  <div style="font-size: 24px; color: #22d3fd; text-shadow: 0 0 10px rgba(34,213,253,0.5); margin-bottom:10px;">🛡️ Noor Sovereign Game Engine v5.0</div>
                                  <div style="color: #64748b; font-size: 11px;">(WebGL 2.0 Backend Render Preview)</div>
                                </div>
                                <canvas></canvas>
                                
                                <script>
                                  const canvas = document.querySelector('canvas');
                                  let gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                                  
                                  let w, h;
                                  function resize() {
                                    w = canvas.width = window.innerWidth;
                                    h = canvas.height = window.innerHeight;
                                    if(gl) gl.viewport(0, 0, w, h);
                                  }
                                  window.addEventListener('resize', resize);
                                  resize();

                                  let isContextLost = false;
                                  
                                  // Context loss handling
                                  canvas.addEventListener("webglcontextlost", (event) => {
                                      event.preventDefault(); // allow context restoration
                                      isContextLost = true;
                                      window.parent.postMessage({ type: 'NOOR_WEBGL_LOST' }, '*');
                                  }, false);

                                  canvas.addEventListener("webglcontextrestored", () => {
                                      isContextLost = false;
                                      initWebGL(); // Re-initialize shaders and buffers
                                      resize();
                                  }, false);

                                  function initWebGL() {
                                    if(!gl) return;
                                    gl.clearColor(0.02, 0.04, 0.08, 1.0);
                                  }
                                  initWebGL();

                                  let frameCount = 0;
                                  let lastTime = performance.now();
                                  
                                  function draw() {
                                    requestAnimationFrame(draw);
                                    if(isContextLost || !gl) return;
                                    
                                    // Clear canvas properly
                                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                                    
                                    // Simulate Draw Calls (ECS simulation placeholder)
                                    let fakeDrawCalls = 150 + Math.floor(Math.random() * 50);
                                    
                                    frameCount++;
                                    let now = performance.now();
                                    if (now - lastTime >= 1000) {
                                      let fps = frameCount;
                                      frameCount = 0;
                                      lastTime = now;
                                      // Send metrics to Rendering Profiler
                                      window.parent.postMessage({ 
                                        type: 'NOOR_GAME_STATS', 
                                        payload: { 
                                          fps: fps, 
                                          drawCalls: fakeDrawCalls, 
                                          memory: Math.floor(performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 45 + Math.random()*20)
                                        } 
                                      }, '*');
                                    }
                                    
                                    // Simulate random engine crash (context loss) every ~30 seconds for robust handling test
                                    if(Math.random() < 0.0005) {
                                        const ext = gl.getExtension('WEBGL_lose_context');
                                        if (ext) {
                                            ext.loseContext();
                                            setTimeout(() => ext.restoreContext(), 3000); // 3 seconds to recover
                                        }
                                    }
                                  }
                                  draw();
                                </script>
                            </body>
                            </html>
                          `}
                          title="Noor Game Engine WebGL Canvas"
                          className="w-full h-full border-none outline-none"
                          sandbox="allow-scripts allow-same-origin"
                        />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fake line numbers for outstanding aesthetic spacing */}
              <div className="w-12 bg-[#04060a]/80 text-slate-500 py-4 select-none text-center flex flex-col gap-[2px] border-l border-slate-900/40 text-[11px] font-medium leading-6">
                {Array.from({ length: Math.max(12, editorContent.split('\n').length) }).map((_, idx) => {
                  const lineNum = idx + 1;
                  const isBreakpoint = breakpoints.has(lineNum);
                  const isCurrentLine = isDebugMode && debugSteps[currentDebugStepIndex]?.line === lineNum;
                  return (
                    <div 
                      key={idx} 
                      className={`cursor-pointer hover:text-slate-200 hover:bg-slate-950/40 transition-all duration-150 flex items-center justify-center gap-1 leading-6 ${
                        isCurrentLine 
                          ? 'bg-cyan-400/20 text-cyan-400 font-bold border-r-2 border-cyan-400' 
                          : isBreakpoint 
                            ? 'text-rose-400 font-semibold' 
                            : ''
                      }`}
                      onClick={() => toggleBreakpoint(lineNum)}
                      title={isBreakpoint ? '📍 نقطة توقف (انقر للإلغاء)' : '📍 انقر لتعيين نقطة توقف'}
                    >
                      {isBreakpoint && (
                        <motion.span 
                          layoutId={`bp-${lineNum}`}
                          className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" 
                        />
                      )}
                      <span>{lineNum}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 relative overflow-hidden bg-[#010308]">
                {/* Visual Background Highlighter for Debugger Mode */}
                {isDebugMode && debugSteps[currentDebugStepIndex]?.line && (
                  <div 
                    className="absolute z-0 w-full bg-cyan-900/40 border-y border-cyan-500/30 blur-[0.5px] pointer-events-none transition-all duration-300"
                    style={{
                      height: '24px', // leading-6 is 24px usually
                      top: `calc(1rem + ${(debugSteps[currentDebugStepIndex].line - 1) * 26}px - ${document.getElementById('noor-editor')?.scrollTop || 0}px)`
                    }}
                  />
                )}
                
                {/* Code input text area */}
                <textarea
                  id="noor-editor"
                  onScroll={(e) => {
                    // Force re-render of hacky inline style on scroll, or rely on a state?
                    // Better to just update a ref or state for scrollTop, but minimal impact:
                    const target = e.target as HTMLTextAreaElement;
                    const highlighter = target.previousElementSibling as HTMLElement;
                    if (highlighter && isDebugMode && debugSteps[currentDebugStepIndex]?.line) {
                      highlighter.style.transform = `translateY(-${target.scrollTop}px)`;
                      highlighter.style.top = `calc(1rem + ${(debugSteps[currentDebugStepIndex].line - 1) * 26}px)`;
                    }
                  }}
                  className="w-full h-full relative z-10 px-4 py-4 focus:outline-none resize-none overflow-y-auto leading-6 font-mono text-xs md:text-sm text-right font-medium caret-cyan-400 border-none placeholder-slate-700 bg-transparent"
                  style={{ direction: 'rtl', color: '#f1f5f9' }}
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="# اكتب كود برنامجك المستقل بلغة نور هنا..."
                />
              </div>
            </div>

            {/* Error messaging bar */}
            {compilerError && (
              <div className="bg-[#1f0f15] border-t border-rose-950/40 px-4 py-3 flex items-start gap-2.5 text-rose-300 text-xs">
                <XCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">خطأ في التفسير والتشغيل:</span>
                  <p className="mt-0.5">{compilerError}</p>
                </div>
              </div>
            )}

            {/* Terminal Live Output logs Container */}
            <div className="h-[200px] lg:h-[280px] bg-[#020305] border-t border-slate-800 flex flex-col shrink-0">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-4 py-2 border-b border-slate-900 bg-[#06080d]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>مخرجات النظام (Terminal)</span>
                  </div>
                  
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                      showHistory 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                        : 'hover:bg-slate-800 text-slate-500 border border-transparent'
                    }`}
                  >
                    السجل {logHistory.length > 0 && `(${logHistory.length})`}
                  </button>
                </div>

                <button 
                  onClick={() => {
                    if (showHistory) setLogHistory([]);
                    else setTerminalLogs([]);
                  }}
                  className="text-slate-600 hover:text-slate-300 transition-colors"
                >
                  مسح {showHistory ? 'السجل' : ''}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-6 text-slate-300 p-4">
                {showHistory ? (
                  <div className="space-y-6">
                    {logHistory.length === 0 ? (
                      <div className="text-slate-700 italic text-center py-10">--- لا يوجد سجل للعمليات السابقة ---</div>
                    ) : (
                      logHistory.map((history, hIdx) => (
                        <div key={hIdx} className="border-b border-slate-900 pb-4 last:border-0">
                          <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-700" />
                            تشغيل رقم {logHistory.length - hIdx}
                          </div>
                          {history.map((log, idx) => (
                            <div key={idx} className="border-r border-slate-800 pr-2 hover:bg-slate-900/10">
                              {log}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  terminalLogs.length === 0 ? (
                    <div className="text-slate-700 italic flex items-center justify-center h-full text-center">
                      -- لا توجد مخرجات، النظام في وضع الخمول --
                    </div>
                  ) : (
                    terminalLogs.map((log, index) => (
                      <div key={index} className="border-r border-slate-800 pr-2 hover:bg-slate-900/30">
                        {log}
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>
        </div>

      {/* 3. Utilities & Info Workspace (Left Sidebar) */}
      {!isFullScreen && (
        <div className="w-full lg:w-[380px] bg-[#040608] lg:border-r border-t lg:border-t-0 border-slate-900 flex flex-col shrink-0 overflow-y-auto lg:min-h-0 border-b lg:border-b-0">
          <div className="flex-1 flex flex-col p-4">
            
            {/* TITLE HEADER */}
            <div className="mb-4 pb-3 border-b border-slate-900/40">
              <div className="flex items-center gap-2">
                {activeNavTab === 'docs' && <BookOpen className="w-4.5 h-4.5 text-cyan-400" />}
                {activeNavTab === 'copilot' && <Sparkles className="w-4.5 h-4.5 text-cyan-400" />}
                {activeNavTab === 'packages' && <Package className="w-4.5 h-4.5 text-cyan-400" />}
                {activeNavTab === 'tutorial' && <CheckCircle2 className="w-4.5 h-4.5 text-cyan-400" />}
                {activeNavTab === 'debugger' && <Cpu className="w-4.5 h-4.5 text-cyan-400 font-bold" />}
                {activeNavTab === 'servers' && <Globe className="w-4.5 h-4.5 text-emerald-400" />}
                {activeNavTab === 'about' && <HelpCircle className="w-4.5 h-4.5 text-cyan-400" />}
                
                <h2 className="font-bold text-base text-slate-100">
                  {activeNavTab === 'docs' && 'دليل استخدام نور البرمجية متاح على مدار الساعة'}
                  {activeNavTab === 'copilot' && 'المترجم الذكي ومساعد الذكاء الاصطناعي'}
                  {activeNavTab === 'packages' && 'مستودع وتحميل حزم لغة نور المعيارية'}
                  {activeNavTab === 'tutorial' && 'تحديات الأكاديمية التفاعلية'}
                  {activeNavTab === 'debugger' && 'مصحح وتتبع الأخطاء البرمجية (Noor Debugger)'}
                  {activeNavTab === 'servers' && 'مدير وخادم المواقع الافتراضية المستقلة'}
                  {activeNavTab === 'about' && 'عن لغة نور والمحرك المستقل'}
                </h2>
              </div>
            </div>

            {/* CONTENT MODULES RENDERING */}

            {/* TAB: DOCUMENTATION */}
            {activeNavTab === 'docs' && (
              <div className="flex-1 flex flex-col gap-5 overflow-hidden">
                {/* Category toggles - Scrollable on mobile */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 text-xs font-bold shrink-0 mask-image-fade-right">
                  <button
                    onClick={() => setDocCategory('basics')}
                    className={`shrink-0 px-4 py-2.5 rounded-full border transition-all ${
                      docCategory === 'basics'
                        ? 'bg-gradient-to-tr from-cyan-600/20 to-cyan-400/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    🚀 الأساسيات
                  </button>
                  <button
                    onClick={() => setDocCategory('web')}
                    className={`shrink-0 px-4 py-2.5 rounded-full border transition-all ${
                      docCategory === 'web'
                        ? 'bg-gradient-to-tr from-cyan-600/20 to-cyan-400/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    🌐 الويب و الواجهات
                  </button>
                  <button
                    onClick={() => setDocCategory('advanced')}
                    className={`shrink-0 px-4 py-2.5 rounded-full border transition-all ${
                      docCategory === 'advanced'
                        ? 'bg-gradient-to-tr from-cyan-600/20 to-cyan-400/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    ⚡ الشبكات والسيرفر
                  </button>
                  <button
                    onClick={() => setDocCategory('system')}
                    className={`shrink-0 px-4 py-2.5 rounded-full border transition-all ${
                      docCategory === 'system'
                        ? 'bg-gradient-to-tr from-cyan-600/20 to-cyan-400/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    📂 النظام والملفات
                  </button>
                  <button
                    onClick={() => setDocCategory('mobile_ai')}
                    className={`shrink-0 px-4 py-2.5 rounded-full border transition-all ${
                      docCategory === 'mobile_ai'
                        ? 'bg-gradient-to-tr from-cyan-600/20 to-cyan-400/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    🧠 الهواتف والذكاء
                  </button>
                  <button
                    onClick={() => setDocCategory('db_systems')}
                    className={`shrink-0 px-4 py-2.5 rounded-full border transition-all ${
                      docCategory === 'db_systems'
                        ? 'bg-gradient-to-tr from-cyan-600/20 to-cyan-400/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    🛡️ قواعد البيانات والتشفير
                  </button>
                  <button
                    onClick={() => setDocCategory('stdlib')}
                    className={`shrink-0 px-4 py-2.5 rounded-full border transition-all ${
                      docCategory === 'stdlib'
                        ? 'bg-gradient-to-tr from-fuchsia-600/20 to-fuchsia-400/10 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.15)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    📚 المكتبة القياسية (10,000+ دالة)
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto text-[13px] text-slate-300 space-y-5 pr-2 leading-relaxed pb-4 custom-scrollbar">
                  {docCategory === 'stdlib' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-gradient-to-br from-[#0c162c] to-[#040812] p-5 rounded-2xl border border-fuchsia-900/40 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full" />
                        <h4 className="font-bold text-fuchsia-300 flex items-center gap-2 mb-3 text-[15px] relative z-10">
                          <Database className="w-5 h-5 text-fuchsia-400" />
                          <span>المكتبة القياسية العظمى</span>
                        </h4>
                        <p className="text-slate-300 mb-4 leading-loose relative z-10 text-[13px]">
                          تتميز لغة نور 5.0 باحتوائها على أكثر من <strong className="text-fuchsia-300">عشرات الآلاف من الدوال، المتغيرات، والكلمات المحجوزة غير المكررة</strong>. 
                          هذه المكتبة مدمجة آلياً (Auto-Mocked) وتمكنك من استدعاء أي دالة تخطر على بالك دون الحاجة لتثبيت أي حزم خارجية!
                        </p>
                        <div className="bg-black/60 p-4 rounded-xl border border-fuchsia-900/30 mt-4 relative z-10">
                          <strong className="text-fuchsia-400 block mb-3 text-[13px]">أمثلة سريعة من آلاف الدوال المتاحة فوراً:</strong>
                          <ul className="list-none space-y-2.5 text-slate-300 text-[12px] font-mono">
                            <li className="flex items-start gap-2"><span className="text-fuchsia-500 shrink-0">❖</span><span><code className="text-emerald-300">تحليل_مصفوفة_ثلاثية_الأبعاد(بيانات)</code> — للرياضيات.</span></li>
                            <li className="flex items-start gap-2"><span className="text-fuchsia-500 shrink-0">❖</span><span><code className="text-emerald-300">تشفير_بلوك_تشين_ذكي(النص)</code> — أمان سيبراني.</span></li>
                            <li className="flex items-start gap-2"><span className="text-fuchsia-500 shrink-0">❖</span><span><code className="text-emerald-300">توليد_صورة_بالذكاء_الاصطناعي("مدينة")</code> — رسوميات.</span></li>
                            <li className="flex items-start gap-2"><span className="text-fuchsia-500 shrink-0">❖</span><span><code className="text-emerald-300">اختراق_أخلاقي_للشبكة(IP)</code> — فحص ثغرات.</span></li>
                          </ul>
                        </div>
                        <p className="text-[12px] text-fuchsia-200 mt-5 pt-4 border-t border-fuchsia-900/50 relative z-10">
                          💡 <strong>جرب بنفسك:</strong> اكتب أي اسم دالة تعبر عن مرادك بالعربية وسيتعرف المحرك عليها.
                        </p>
                      </div>
                    </div>
                  )}
                  {docCategory === 'basics' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Zap className="w-4 h-4 text-cyan-400" />
                          <span>تعريف المتغيرات</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">لتعريف متغير مستقل في لغة نور، نستخدم الكلمة المفتاحية <strong>"انشئ"</strong>.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          انشئ اسم = "نور البرمجية"
                        </pre>
                      </div>

                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Zap className="w-4 h-4 text-cyan-400" />
                          <span>التفرع الشرطي والتكرار</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">الشرط يتم عبر <strong>"اذا"</strong> وبديله <strong>"والا"</strong>.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`اذا (الدرجة >= 50) {
  اكتب("ناجح ومميز")
} والا {
  اكتب("راسب")
}`}
                        </pre>
                      </div>

                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Code className="w-4 h-4 text-cyan-400" />
                          <span>الدوال والوحدات البرمجية</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">الدوال مرنة وممتازة للتنفيذ التلقائي للمهام الصعبة والمستقلة.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`دالة ضرب(أ, ب) {
  ارجع أ * ب
}`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {docCategory === 'system' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <FolderCode className="w-4 h-4 text-cyan-400" />
                          <span>إدارة الملفات والمجلدات</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">تستطيع قراءة وكتابة المجلدات عبر النظام السحابي بكل حرية.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`انشئ_مجلد("projects/myapp")
كتابة_ملف("projects/myapp/index.noor", "اكتب('بداية')")
انشئ محتوى = قراءة_ملف("projects/myapp/index.noor")`}
                        </pre>
                      </div>

                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Terminal className="w-4 h-4 text-cyan-400" />
                          <span>تنفيذ أوامر النظام (Shell)</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">تمرير أوامر سحسية وتلقي الرد المباشر من المضيف.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`انشئ حالة = تنفيذ_شيل("sudo systemctl status noord")
اكتب("حالة النظام:", حالة)`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {docCategory === 'web' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <span>بناء واجهات المواقع التفاعلية</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">محرك نور يتكفل بشجرة الـ DOM، لتبني صفحات عبر أوامر نصية دون HTML.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`انشئ موقع = هيكل_صفحة("موقعي الشخصي")
تلوين_النص(موقع, "أزرق_سماوي")
إضافة_نصوص(موقع, "حجم_كبير", "أهلاً بالعالم")`}
                        </pre>
                      </div>

                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          < Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>تجاوب الأبعاد والرسوم المتحركة</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">دوال مؤثرات مبنية داخلياً لإنتاج سريع بلا تعقيدات CSS.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`إضافة_تأثير_حركة(موقع, "انزلاق_من_الأعلى")
تجاوب_الواجهة(موقع, ["هاتف", "شاشة_كبيرة"])`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {docCategory === 'advanced' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <span>خوادم الشبكة الفائقة في نور</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">لغة نور تمتلك سيرفر ويب مدمج قادر على معالجة آلاف الطلبات في الثانية.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`انشئ منفذ = 3300
انشئ سيرفر = انشئ_سيرفر(منفذ)`}
                        </pre>
                      </div>

                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <span>طلبات الويب المباشرة</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">الاتصال الآمن مع المنصات عبر دالة مدمجة سريعة الاستجابة.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`انشئ استجابة = طلب_ويب("https://api.stripe.com/v3")`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {docCategory === 'mobile_ai' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Smartphone className="w-4 h-4 text-cyan-400" />
                          <span>تطوير تطبيقات الهواتف الذكية</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">مترجم لغة نور يحزم الكود البرمجي لمخرجات بايتكود سريعة متصلة مباشرة بمكتبات أندرويد وآيفون، واجهات واحدة لجميع الهواتف.</p>
                      </div>

                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>تعلم الآلة (Machine Learning)</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">دوال خوارزمية جاهزة لتحليل تنبؤات الشركات وتشغيل النماذج الرياضية.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`انشئ التنبؤ = تحليل_عصبي("مبيعات", 0.95)`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {docCategory === 'db_systems' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Database className="w-4 h-4 text-cyan-400" />
                          <span>قواعد البيانات الشاملة (NoorDB)</span>
                        </h4>
                        <p className="text-slate-400 mb-3 text-[12px]">كتابة الجداول والمخططات بشكل فوري بدون إعداد SQL.</p>
                        <pre className="bg-black p-3.5 rounded-xl text-[12px] font-mono text-emerald-300 text-left border border-slate-800/80 shadow-inner" dir="ltr">
                          {`كتابة_ملف("بيانات.ndb", "بيانات مشفرة ومصنفة")
انشئ قراءة = قراءة_ملف("بيانات.ndb")`}
                        </pre>
                      </div>

                      <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black">
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 mb-2 text-[14px]">
                          <Shield className="w-4 h-4 text-cyan-400" />
                          <span>أمان النظم السيادية</span>
                        </h4>
                        <p className="text-slate-400 text-[12px]">خوارزميات تشفير قوية، حماية متقدمة للذاكرة لضمان منع تسريب البيانات الحساسة والبلوكتشين.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live technical assistance status bar */}
                <div className="shrink-0 mt-auto bg-gradient-to-r from-[#030912] to-[#0a1222] border border-cyan-500/10 rounded-2xl p-4 flex items-center justify-between text-[11px] shadow-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                    <span className="font-bold text-slate-200 text-[12px]">الدعم الفني متاح 24/7 للغة نور</span>
                  </div>
                  <span className="text-cyan-400 font-mono bg-cyan-950/40 px-3 py-1.5 rounded-full border border-cyan-900">متصل الآن</span>
                </div>
              </div>
            )}

            {/* TAB: AI COPILOT AND CODE TRANSLATOR */}
            {activeNavTab === 'copilot' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[480px]">
                {/* 1. Code Translator Console */}
                <div className="bg-[#06080d] border border-slate-900 rounded-xl p-4">
                  <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5 mb-2">
                    <Languages className="w-4 h-4 text-cyan-400" />
                    <span>مترجم الأكواد البرمجية إلى لغة نور (Translate)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    ترجمة الكود البرمجي من لغة بايثون أو جافا سكريبت إلى لغة نور بشكل آمن وذكي وفوري.
                  </p>

                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-slate-400">لغة كود المصدر الأصلية:</label>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setTranslationLang('python');
                          setTranslationInput(`# بايثون حساب المجموع\nnums = [5, 12, 8]\ntotal = sum(nums)\nprint("الناتج الكلي هو:", total)`);
                        }}
                        className={`text-[11px] font-mono px-2 py-1 rounded transition-colors ${
                          translationLang === 'python' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-950 text-slate-500'
                        }`}
                      >
                        Python
                      </button>
                      <button
                        onClick={() => {
                          setTranslationLang('javascript');
                          setTranslationInput(`// جافا سكريبت تكرار آمن\nlet i = 1;\nwhile(i <= 5) {\n  console.log("الرقم الآن هو:", i);\n  i++;\n}`);
                        }}
                        className={`text-[11px] font-mono px-2 py-1 rounded transition-colors ${
                          translationLang === 'javascript' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-950 text-slate-500'
                        }`}
                      >
                        JavaScript
                      </button>
                    </div>
                  </div>

                  <textarea
                    className="w-full bg-slate-950 text-slate-300 font-mono text-[11px] p-2.5 rounded-lg border border-slate-900 focus:outline-none focus:border-cyan-500/50 leading-5 text-left h-24"
                    dir="ltr"
                    value={translationInput}
                    onChange={(e) => setTranslationInput(e.target.value)}
                  />

                  <button
                    id="btn-translate"
                    onClick={handleCodeTranslation}
                    disabled={isAiLoading}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-100 py-2 rounded-lg text-xs font-semibold cursor-pointer mt-2 flex items-center justify-center gap-1.5 hover:border-cyan-500/30 transition-all font-mono active:scale-95"
                  >
                    {isAiLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>ترجمة وتحميل الكود في محرر نور</span>
                  </button>
                </div>

                {/* 2. Chat with Noor Assistant panel */}
                <div className="bg-[#06080d] border border-slate-900 rounded-xl p-4">
                  <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>اسأل مهندس ومساعد نور المتطور (AI Noor Assistant)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    لدينا خوارزميات ذكاء اصطناعي مدمجة في الخلفية للإجابة على كامل الأسئلة اللوجيستية وكتابة أي كود مخصص.
                  </p>

                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-slate-950 px-3 py-2 rounded-lg text-xs text-slate-200 border border-slate-900 focus:outline-none focus:border-cyan-500/50"
                      placeholder="كيف أكتب كود تصنيف مصفوفة آمن بلغة نور؟..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
                    />
                    <button
                      id="btn-ai-query"
                      onClick={handleAiQuery}
                      disabled={isAiLoading}
                      className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 rounded-lg px-4 py-2 text-xs font-bold text-slate-950 transition-colors"
                    >
                      {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" /> : 'اسأل'}
                    </button>
                  </div>

                  {aiResponse && (
                    <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-900 text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-right font-medium text-slate-200 border-r-2 border-cyan-500">
                      {aiResponse}
                    </div>
                  )}
                </div>

                {/* Automated Unit Tests Panel (Noor Test Suite) */}
                <div className="bg-[#0b101a] border border-cyan-950/60 rounded-xl p-4 text-right flex flex-col gap-3">
                  <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-900/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>مرصد نتائج الاختبارات الآلية (Noor Test Suite Studio)</span>
                  </h4>

                  {testResults.length === 0 ? (
                    <div className="py-2 flex flex-col gap-2">
                      <p className="text-[11px] text-slate-400 leading-relaxed text-right">
                        لم يتم تشغيل أي اختبارات آلية في الكود الحالي حتى الآن. يمكنك برمجة اختبارات مؤتمتة لقدرات دوالك البرمجية بسهولة:
                      </p>
                      <pre className="text-[10px] bg-slate-950 border border-slate-900 p-2.5 rounded-lg text-slate-400 text-left font-mono leading-normal" dir="ltr">
{`تحميل_مكتبة("testing")
اختبار_التطابق(10, 5 + 5, "فحص منطق الحساب")
تشغيل_كل_الاختبارات(["فحص منطق الحساب"])`}
                      </pre>
                      <button
                        onClick={() => {
                          const testSnip = REUSABLE_SNIPPETS.find(s => s.id === 'unit-test-spec');
                          if (testSnip) {
                            setEditorContent(testSnip.code);
                            showNotification('🧪 تم تحميل قالب الاختبارات الآلية في المحرر بنجاح!');
                          }
                        }}
                        className="mt-1 self-end bg-[#0c221a] hover:bg-[#0f2d22] text-xs font-bold text-emerald-400 border border-emerald-950 px-3 py-1.5 rounded-lg transition-all"
                      >
                        تحميل كود عينة الاختبارات
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Summary analytics metrics */}
                      {(() => {
                        const passedCount = testResults.filter(t => t.success).length;
                        const totalCount = testResults.length;
                        const pct = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
                        const allPassed = passedCount === totalCount;
                        
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className={allPassed ? 'text-emerald-400' : 'text-amber-500'}>
                                {passedCount} من {totalCount} ناجحة ({pct}%)
                              </span>
                              <span className="text-slate-400">حالة تغطية الفحص</span>
                            </div>
                            
                            {/* Coverage loading bar */}
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                              <div 
                                className={`h-full transition-all duration-500 ${allPassed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Detailed test list */}
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 mt-2">
                              {testResults.map((t, idx) => (
                                <div 
                                  key={idx} 
                                  className={`p-2 rounded border text-xs flex items-start gap-2 text-right justify-between ${
                                    t.success 
                                      ? 'bg-emerald-500/5 border-emerald-500/15' 
                                      : 'bg-rose-500/5 border-rose-500/15'
                                  }`}
                                >
                                  <div className="flex flex-col gap-0.5 text-left text-[10px] font-mono leading-tight">
                                    <span className="text-slate-500">
                                      {t.success ? 'متطابق' : 'فشل التطابق'}
                                    </span>
                                    <span className={t.success ? 'text-slate-400' : 'text-rose-400'}>
                                      توقع: {String(t.expected)} | حصل على: {String(t.actual)}
                                    </span>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">
                                      {t.name}
                                    </span>
                                    <span className={t.success ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                                      {t.success ? '✅' : '❌'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: PACKAGE MANAGER */}
            {activeNavTab === 'packages' && (
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-[#06080d] p-3 rounded-lg border border-slate-900">
                  <div className="flex items-center gap-2 bg-slate-950 rounded-lg px-2.5 py-2 border border-slate-900">
                    <Package className="w-4 h-4 text-slate-500" />
                    <input
                      className="w-full bg-transparent text-xs text-slate-300 focus:outline-none placeholder-slate-600 font-semibold"
                      placeholder="البحث في الحزم القياسية للغة نور..."
                      value={packageSearch}
                      onChange={(e) => setPackageSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 pr-1">
                  {filteredPackages.map((pkg, idx) => (
                    <div key={idx} className="bg-[#040810] border border-slate-900/60 p-3.5 rounded-xl hover:border-slate-800 transition-colors">
                      <div className="flex items-center justify-between gap-2.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-cyan-300">{pkg.name}</span>
                          <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                            v{pkg.version}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">⬇️ {pkg.downloads}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed text-right font-medium">
                        {pkg.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">المؤلف: {pkg.author}</span>
                        {pkg.isInstalled ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-900/15 border border-emerald-500/20 px-2 py-0.5 rounded-lg select-none">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>مفعّل باللغة</span>
                          </span>
                        ) : (
                          <button
                            id={`install-pkg-${pkg.name}`}
                            onClick={() => installPackage(pkg.name)}
                            disabled={installingPackageName === pkg.name}
                            className="bg-slate-900 text-slate-200 border border-slate-800 hover:border-cyan-500/20 text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer hover:text-cyan-400 active:scale-95 transition-all"
                          >
                            {installingPackageName === pkg.name ? (
                              <div className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                                <span>تثبيت...</span>
                              </div>
                            ) : (
                              <span>تنزيل وتثبيت</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: TUTORIAL SYSTEM */}
            {activeNavTab === 'tutorial' && (
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-[#06080d] border border-slate-900/40 p-4 rounded-xl flex items-center justify-between gap-3 shadow-md">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-500 font-bold">التحدي البرمجي المفتوح:</span>
                    <h3 className="font-bold text-sm text-slate-100 mt-0.5 text-right leading-snug">
                      {TUTORIAL_LESSONS[activeLessonIndex].arabicTitle}
                    </h3>
                  </div>
                  <div className="font-mono text-xs bg-slate-950 px-2 text-slate-400 py-1 rounded">
                    {activeLessonIndex + 1} / {TUTORIAL_LESSONS.length}
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[350px] text-xs text-slate-300 pr-1">
                  <div className="bg-[#090b10] p-3.5 rounded-xl border border-slate-900/60 leading-relaxed text-right font-medium">
                    <p className="font-bold text-slate-200 mb-1 text-[13px] text-cyan-300 flex items-center gap-1.5">
                      <QuestionIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>المطلوب في هذا التحدي:</span>
                    </p>
                    <p className="text-slate-400 text-xs mb-1">
                      {TUTORIAL_LESSONS[activeLessonIndex].arabicDescription}
                    </p>
                    <p className="bg-[#0f1523] border border-cyan-500/10 text-cyan-200 px-3 py-2.5 rounded-lg mt-2.5 text-right font-semibold leading-relaxed">
                      💡 {TUTORIAL_LESSONS[activeLessonIndex].arabicTask}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      id="btn-lesson-load"
                      onClick={() => loadLesson(TUTORIAL_LESSONS[activeLessonIndex])}
                      className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-200 py-2.5 rounded-xl border border-slate-800 text-xs font-bold active:scale-95 transition-all text-center"
                    >
                      تحميل قالب الكود الخاص بالتحدي البرمجي
                    </button>
                  </div>

                  {lessonFeedback && (
                    <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                      lessonFeedback.success
                        ? 'bg-emerald-900/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-900/10 border-rose-500/20 text-rose-300'
                    }`}>
                      {lessonFeedback.message}
                    </div>
                  )}
                </div>

                {/* Lesson Pagination Control */}
                <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-slate-900/40">
                  <button
                    id="btn-prev-lesson"
                    disabled={activeLessonIndex === 0}
                    onClick={() => {
                      setActiveLessonIndex(prev => prev - 1);
                      setLessonFeedback(null);
                      setCompilerError(null);
                    }}
                    className="bg-[#06080d]/80 text-xs text-slate-400 font-bold px-3 py-1.5 rounded-lg border border-slate-900/40 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                  >
                    السابق
                  </button>

                  <div className="flex gap-1.5">
                    {TUTORIAL_LESSONS.map((ls, idx) => (
                      <div
                        key={ls.id}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === activeLessonIndex
                            ? 'bg-cyan-500 scale-125'
                            : completedLessons.includes(ls.id)
                            ? 'bg-emerald-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    id="btn-next-lesson"
                    disabled={activeLessonIndex === TUTORIAL_LESSONS.length - 1}
                    onClick={() => {
                      setActiveLessonIndex(prev => prev + 1);
                      setLessonFeedback(null);
                      setCompilerError(null);
                    }}
                    className="bg-[#06080d]/80 text-xs text-slate-400 font-bold px-3 py-1.5 rounded-lg border border-slate-900/40 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}

            {/* TAB: VIRTUAL SITES & LOCAL SERVERS */}
            {activeNavTab === 'servers' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[580px]">
                {/* 1. Header Information */}
                <div className="bg-[#0b111e] rounded-xl border border-slate-900 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <h3 className="font-bold text-sm text-slate-200">الربط المتعدد وفصل المنافذ (Multi-Port Separation)</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed text-right">
                    في بيئة لغة نور السيادية، يعمل نظام الـ <span className="text-cyan-400 font-semibold font-mono">Port Router v5.0</span> على تشغيل عدة خوادم ويب ومواقع مختلفة بشكل مستقل تماماً.
                    يتميز موقع النظام (IDE) بالاستقرار على المنفذ <span className="text-amber-400 font-bold">3000</span>، بينما تقع الملفات ومواقعك الخاصة على خوادم منفصلة (مثل <span className="text-cyan-400">3300</span> أو <span className="text-cyan-400">3301</span>) لتجنب تضارب الصلاحيات.
                  </p>
                </div>

                {/* 2. Active Server List */}
                <div className="bg-[#040609] border border-slate-900 rounded-xl p-3.5">
                  <h4 className="text-xs font-bold text-slate-400 mb-3 border-b border-slate-900 pb-2">📂 الخوادم النشطة على بيئة الذاكرة:</h4>
                  <div className="space-y-2.5">
                    {/* Main IDE Port 3000 (Locked & Guarded) */}
                    <div className="flex items-center justify-between p-2.5 bg-cyan-950/20 border border-cyan-500/25 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-xs font-bold text-cyan-200 font-mono">http://localhost:3000</p>
                          <p className="text-[10px] text-slate-500">حبيسة البوابة - موقع لغة نور والـ IDE</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 font-bold rounded">نشط ومؤمن 🔒</span>
                    </div>

                    {/* Simulated user ports */}
                    {Object.entries(activeServers).map(([portString, value]: [string, any]) => {
                      const port = parseInt(portString);
                      const isSelected = selectedBrowserPort === port;
                      const responseObj = value.responses?.['/'] || {};
                      const pageTitle = typeof responseObj === 'object' ? responseObj.title : 'استجابة نصية';
                      
                      return (
                        <div 
                          key={port} 
                          className={`flex items-center justify-between p-2.5 border rounded-lg transition-all ${
                            isSelected 
                              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-500/5' 
                              : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-400" />
                            <div>
                              <p className="text-xs font-bold text-slate-200 font-mono">http://localhost:{port}</p>
                              <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">{pageTitle}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedBrowserPort(port);
                              setBrowserUrlAddress(`http://localhost:${port}/`);
                            }}
                            className={`text-[10px] px-2.5 py-1 rounded transition-all font-bold ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            معاينة 🌐
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Interactive Web Emulator View with OS Simulation */}
                <div className="flex items-center justify-between mt-2 mb-1 px-1">
                  <h4 className="text-[11px] font-bold text-slate-400">🖥️ معاينة حية للمواقع المستضافة محلياً</h4>
                  
                  {/* OS Selector */}
                  <div className="flex items-center gap-1.5 p-1 bg-[#0b101a] border border-cyan-950/60 rounded-md">
                    <span className="text-[9px] text-slate-500 font-bold px-1">البيئة:</span>
                    {(['mac', 'windows', 'linux', 'termux'] as const).map(os => (
                      <button
                        key={os}
                        onClick={() => setSelectedOS(os)}
                        className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all ${
                          selectedOS === os 
                           ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                           : 'bg-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {os.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div 
                  className={`border border-slate-900 rounded-xl overflow-hidden bg-[#07090e] shadow-lg flex flex-col transition-all duration-300 ${
                    selectedOS === 'windows' ? 'rounded-md shadow-xl' :
                    selectedOS === 'termux' ? 'rounded-none border-b-0 shadow-none bg-black max-w-[375px] mx-auto w-full border-x-4 border-t-8 border-slate-800' :
                    'rounded-xl'
                  }`}
                >
                  {/* Browser Address Bar controls with OS specific styling */}
                  <div 
                    className={`border-b border-slate-900 p-2.5 flex items-center justify-between gap-2 ${
                      selectedOS === 'windows' ? 'bg-[#f0f0f0] border-slate-300 flex-row-reverse' :
                      selectedOS === 'termux' ? 'bg-[#000000] border-[#333] p-1 text-[10px] text-green-500 font-mono flex-row-reverse' :
                      selectedOS === 'linux' ? 'bg-[#2b2b2b] border-[#444]' :
                      'bg-[#0c0f16]'
                    }`}
                  >
                    {selectedOS === 'termux' ? (
                      <div className="px-2 font-mono flex-1 text-left flex items-center gap-2">
                        <span>~</span>
                        <span>$ curl http://localhost:{selectedBrowserPort}/</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          {selectedOS === 'windows' ? (
                            <div className="flex gap-2 pl-2">
                              {/* Windows controls */}
                              <span className="w-3 h-0.5 bg-slate-500 hover:bg-slate-800 cursor-pointer mt-2" />
                              <span className="w-3 h-3 border border-slate-500 hover:border-slate-800 cursor-pointer" />
                              <XCircle className="w-4 h-4 text-slate-500 hover:text-rose-500 cursor-pointer shrink-0" />
                            </div>
                          ) : (
                            <div className={`flex gap-1.5 ${selectedOS !== 'mac' ? 'flex-row-reverse' : ''} pr-1.5`}>
                              {/* Mac/Linux controls */}
                              <span className={`w-3 h-3 rounded-full ${selectedOS === 'mac' ? 'bg-rose-500/80' : 'bg-[#e95420]'}`} />
                              <span className={`w-3 h-3 rounded-full ${selectedOS === 'mac' ? 'bg-amber-500/80' : 'bg-[#777]'}`} />
                              <span className={`w-3 h-3 rounded-full ${selectedOS === 'mac' ? 'bg-emerald-500/80' : 'bg-[#777]'}`} />
                            </div>
                          )}
                          
                          <button 
                            onClick={() => setIsPreviewFullScreen(true)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-bold transition-all active:scale-95 cursor-pointer ${
                              selectedOS === 'windows' ? 'text-slate-600 border-slate-300 hover:bg-slate-200' :
                              'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/20'
                            }`}
                            title="مشاهدة الموقع بملء الشاشة بالكامل"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>ملء الشاشة 🖥️</span>
                          </button>
                        </div>

                        <div className={`flex-1 border rounded-md px-3 py-1 flex items-center gap-2 text-[11px] font-mono text-left max-w-md ${
                          selectedOS === 'windows' ? 'bg-white border-slate-300 text-slate-800' :
                          selectedOS === 'linux' ? 'bg-[#1e1e1e] border-[#444] text-[#ccc]' :
                          'bg-black/40 border-slate-900/60 text-slate-400'
                        }`}>
                          <span className={`${selectedOS === 'windows' ? 'text-green-700' : 'text-emerald-500'}`}>Secure |</span>
                          <input 
                            type="text" 
                            value={browserUrlAddress} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setBrowserUrlAddress(val);
                              const match = val.match(/localhost:(\d+)/);
                              if (match) {
                                setSelectedBrowserPort(parseInt(match[1]));
                              }
                            }}
                            className={`bg-transparent border-none outline-none flex-1 text-left w-full ${
                              selectedOS === 'windows' ? 'text-slate-800' : 'text-slate-300 focus:text-white'
                            }`}
                          />
                        </div>
                        
                        <button 
                          onClick={() => {
                            setBrowserUrlAddress(`http://localhost:${selectedBrowserPort}/`);
                            showNotification('🔄 تم تحديث المتصفح المحاكي بنجاح.');
                          }}
                          className={`p-1 rounded cursor-pointer ${
                            selectedOS === 'windows' ? 'text-slate-500 hover:bg-slate-200 hover:text-slate-800' :
                            'hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-900 bg-[#0e121a]'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Browser Iframe Simulator Body */}
                  <div className="p-3 min-h-[250px] bg-black/30 relative flex flex-col justify-between">
                    {(() => {
                      const currentServer = activeServers[selectedBrowserPort];
                      if (!currentServer) {
                        return (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0d0408]/40 h-full">
                            <XCircle className="w-10 h-10 text-rose-500/60 mb-2" />
                            <h5 className="font-bold text-xs text-rose-400">⚠️ خطأ 404 - هذا الخادم غير متصل</h5>
                            <p className="text-[10px] text-slate-500 max-w-[220px] mt-1">لا يوجد أي خادم ويب بلغة نور يستمع حالياً لهذا المنفذ في بيئتك السحابية الافتراضية.</p>
                          </div>
                        );
                      }

                      const rawPages = Object.values(currentServer.responses || {}).filter((r:any) => r && typeof r === 'object' && r.type === 'page') as any[];
                      const seenTitles = new Set();
                      const availablePages: any[] = [];
                      for (const p of rawPages) {
                        if (p && p.title && !seenTitles.has(p.title)) {
                          seenTitles.add(p.title);
                          availablePages.push(p);
                        }
                      }
                      const responseContent = navigatedPagesState[selectedBrowserPort] || currentServer.responses?.['/'] || '';
                      
                      return (
                        <SimulatedWebPage 
                          responseContent={responseContent} 
                          showNotification={showNotification} 
                          availablePages={availablePages}
                          onNavigate={(page) => setNavigatedPagesState(prev => ({...prev, [selectedBrowserPort]: page}))}
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* BRAND NEW: Fullscreen Browser Emulator Overlay */}
                <AnimatePresence>
                  {isPreviewFullScreen && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="fixed inset-0 bg-[#02040a] z-[9999] flex flex-col text-slate-100 font-sans"
                    >
                      {/* Immersive Top Navigation Header */}
                      <div className="bg-[#0b0e14] border-b border-slate-900 px-4 py-3 flex items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setIsPreviewFullScreen(false)}
                            className="px-3.5 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>إغلاق المعاينة الكاملة</span>
                          </button>
                          
                          <div className="hidden md:flex gap-1.5">
                            {Object.keys(activeServers).map((portStr) => {
                              const port = parseInt(portStr);
                              const isSelected = selectedBrowserPort === port;
                              return (
                                <button
                                  key={port}
                                  onClick={() => {
                                    setSelectedBrowserPort(port);
                                    setBrowserUrlAddress(`http://localhost:${port}/`);
                                  }}
                                  className={`px-3 py-1 text-xs rounded font-bold border transition-colors cursor-pointer ${
                                    isSelected 
                                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  خادم {port}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Address Bar */}
                        <div className="flex-1 max-w-xl bg-black/50 border border-slate-900 rounded-lg px-4 py-2 flex items-center gap-2 text-xs font-mono text-slate-400 text-left">
                          <span className="text-emerald-500 font-bold">🔒 اتصالات آمنة |</span>
                          <span className="text-slate-300">{browserUrlAddress}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setBrowserUrlAddress(`http://localhost:${selectedBrowserPort}/`);
                              showNotification('🔄 تم تحديث المعاينة الحية بنجاح.');
                            }}
                            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded font-bold uppercase select-none">
                            Noor Sovereign Web Engine
                          </span>
                        </div>
                      </div>

                      {/* Main Page Area */}
                      <div className="flex-1 overflow-auto bg-[#05070c] p-6 flex flex-col">
                        {(() => {
                          const currentServer = activeServers[selectedBrowserPort];
                          if (!currentServer) {
                            return (
                              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0d0408]/40 h-full">
                                <XCircle className="w-12 h-12 text-rose-500/60 mb-2" />
                                <h5 className="font-bold text-sm text-rose-400">⚠️ خطأ 404 - الخادم غير جاهز</h5>
                                <p className="text-xs text-slate-500 max-w-sm mt-1">يرجى التحقق من صياغة الأمر وتشغيل خادم محلي لاستلام وحقن المكونات.</p>
                              </div>
                            );
                          }
                          const rawPages = Object.values(currentServer.responses || {}).filter((r:any) => r && typeof r === 'object' && r.type === 'page') as any[];
                          const seenTitles = new Set();
                          const availablePages: any[] = [];
                          for (const p of rawPages) {
                            if (p && p.title && !seenTitles.has(p.title)) {
                              seenTitles.add(p.title);
                              availablePages.push(p);
                            }
                          }
                          const responseContent = navigatedPagesState[selectedBrowserPort] || currentServer.responses?.['/'] || '';
                          
                          return (
                            <SimulatedWebPage 
                              responseContent={responseContent} 
                              showNotification={showNotification} 
                              availablePages={availablePages}
                              onNavigate={(page) => setNavigatedPagesState(prev => ({...prev, [selectedBrowserPort]: page}))}
                            />
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* TAB: APP BUILDER (.NPK) */}
            {activeNavTab === 'appbuilder' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[580px]">
                <div className="bg-[#100609] border border-rose-900/40 p-4 rounded-xl shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-sm text-slate-200">تحزيم التطبيقات (NPK Builder)</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed text-right mb-4">
                    قم بتحويل كود نور الخاص بك إلى حزمة تطبيق مستقلة (.npk) جاهزة للنشر والتشغيل على محرك العرض NRE الخاص بلغة نور دون الحاجة للملصقات القديمة.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">اسم التطبيق:</label>
                      <input 
                        className="w-full bg-[#050002] border border-rose-950 px-3 py-2 rounded text-xs text-rose-100 focus:outline-none focus:border-rose-700 font-mono text-right"
                        value={npkAppName}
                        onChange={e => setNpkAppName(e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">اسم الحزمة (Package ID):</label>
                      <input 
                        className="w-full bg-[#050002] border border-rose-950 px-3 py-2 rounded text-xs text-cyan-200/80 focus:outline-none focus:border-rose-700 font-mono text-left"
                        value={npkPackageName}
                        onChange={e => setNpkPackageName(e.target.value)}
                        dir="ltr"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 mb-1">الإصدار (Version):</label>
                        <input 
                          className="w-full bg-[#050002] border border-rose-950 px-3 py-2 rounded text-xs text-rose-100 focus:outline-none focus:border-rose-700 font-mono text-left"
                          value={npkVersion}
                          onChange={e => setNpkVersion(e.target.value)}
                          dir="ltr"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 mb-1">المنصة المستهدفة:</label>
                        <select 
                          className="w-full bg-[#050002] border border-rose-950 px-3 py-2 rounded text-xs text-rose-100 focus:outline-none focus:border-rose-700 font-mono text-right appearance-none"
                          value={npkTargetPlatform}
                          onChange={e => setNpkTargetPlatform(e.target.value as any)}
                        >
                          <option value="universal">العالمية (Universal)</option>
                          <option value="windows">ويندوز (Windows)</option>
                          <option value="linux">لينكس (Linux)</option>
                          <option value="macos">ماك (macOS)</option>
                          <option value="android">أندرويد (Android)</option>
                          <option value="ios">آيفون (iOS)</option>
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        try {
                          const builder = new NoorAppBuilder();
                          builder.setManifest({
                            packageName: npkPackageName,
                            appName: npkAppName,
                            version: npkVersion,
                            developer: 'نور_سيستمز',
                            entryPoint: 'main.noor',
                            targetPlatform: npkTargetPlatform
                          });
                          builder.addFile('main.noor', editorContent, 'code');
                          
                          const result = builder.buildNPK();
                          setActiveNpkConfig(result.packageObject);
                          
                          // توليد محاكاة التشغيل
                          const simLogs = builder.generatePlatformSimulation(npkTargetPlatform);
                          setNpkSimulationLogs(simLogs);
                          
                          showNotification('📦 تم بناء حزمة التطبيق (NPK) وتوقيعها بنجاح!');
                        } catch (e: any) {
                          showNotification(`❌ خطأ في البناء: ${e.message}`);
                        }
                      }}
                      className="w-full bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>تجميع وبناء حزمة (Build .npk)</span>
                    </button>
                  </div>
                </div>
                
                {activeNpkConfig && (
                   <div className="bg-[#0b101a] border border-cyan-950/60 rounded-xl overflow-hidden mt-2 p-3">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                         <h4 className="font-bold text-[11px] text-cyan-400">✅ الحزمة الجاهزة ({activeNpkConfig.manifest.appName})</h4>
                         <span className="text-[10px] text-slate-500">الحجم: {activeNpkConfig.manifest.size} bytes</span>
                      </div>
                      
                      {npkSimulationLogs.length > 0 && (
                          <div className="mb-4 bg-slate-950/80 border border-rose-900/10 rounded-lg p-3 font-mono text-[9px] overflow-hidden">
                             <div className="flex items-center gap-2 mb-2 border-b border-rose-900/20 pb-1.5 shadow-[0_0_15px_rgba(251,113,133,0.05)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                <span className="text-rose-300 font-bold opacity-80">محاكاة التشغيل (Live Simulation Preview)</span>
                             </div>
                             <div className="space-y-1 max-h-28 overflow-y-auto no-scrollbar scroll-smooth">
                                {npkSimulationLogs.map((log, i) => (
                                   <div key={i} className={log.startsWith('[') ? 'text-cyan-400/70' : 'text-slate-500 italic'}>
                                      {log}
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}
                      
                      <div className="flex gap-2">
                        <button
                           onClick={() => {
                              if (!activeNpkConfig) return;
                              const check = NoorAppBuilder.preFlightCheck(activeNpkConfig);
                              if (!check.safe) {
                                 if (window.confirm(`${check.error}\n\n⚠️ هل تود تجاوز هذا التحذير الأمني وتشغيل التطبيق في البيئة المعزولة؟`)) {
                                    setAppNotification('NOOR_NPK_RUNTIME');
                                 }
                              } else {
                                 setAppNotification('NOOR_NPK_RUNTIME');
                              }
                           }}
                           className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                           <Play className="w-4 h-4" />
                           <span>تشغيل في المحاكي (Run on NRE)</span>
                        </button>
                        
                        <button
                           onClick={() => {
                              const pkgString = JSON.stringify(activeNpkConfig);
                              const encoded = btoa(unescape(encodeURIComponent(pkgString)));
                              const blob = new Blob([encoded], { type: 'application/octet-stream' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `${activeNpkConfig.manifest.appName}_v${activeNpkConfig.manifest.version}.npk`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              showNotification('📥 تم تحميل حزمة NPK بنجاح! الملف موقع رقمياً وجاهز للنشر والتشغيل السيادي.');
                           }}
                           className="flex-1 bg-rose-900/40 hover:bg-rose-800/60 text-rose-100 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-700/30"
                        >
                           <Download className="w-4 h-4" />
                           <span>تحميل حزمة NPK (Download)</span>
                        </button>
                      </div>
                   </div>
                )}
              </div>
            )}

            {/* TAB: NOOR DEBUGGER (ثورة تتبع وفحص المتغيرات الحركية) */}
            {activeNavTab === 'debugger' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[480px]">
                {!isDebugMode ? (
                  <div className="bg-[#0b101a] border border-cyan-950/60 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-950/50 flex items-center justify-center text-cyan-400 border border-cyan-800/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                      <Cpu className="w-6 h-6 shrink-0 animate-pulse" />
                    </div>
                    <div className="space-y-1 text-right w-full">
                      <h3 className="font-bold text-sm text-slate-200 text-center">مصحح الأخطاء متوقف حالياً</h3>
                      <p className="text-xs text-slate-400 leading-relaxed text-center">
                        لم يتم بدء جلسة تتبع حركية بعد. انقر على زر <span className="text-cyan-400 font-bold">"تصحيح (Debug)"</span> في ترويسة محرر الأكواد لتفعيل وضع فحص المتغيرات خطوة بخطوة ورصد نقاط التوقف.
                      </p>
                    </div>
                    
                    {/* Interactive Breakpoints quick summary */}
                    <div className="w-full border-t border-slate-900 pt-4 text-right">
                      <h4 className="font-bold text-xs text-slate-300 mb-2 flex items-center justify-between">
                        <span>📍 نقاط التوقف المعينة ({breakpoints.size})</span>
                        {breakpoints.size > 0 && (
                          <button 
                            onClick={() => setBreakpoints(new Set())}
                            className="text-[10px] text-rose-400 hover:underline"
                          >
                            مسح الكل
                          </button>
                        )}
                      </h4>
                      {breakpoints.size === 0 ? (
                        <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                          انقر على أرقام السطور البرمجية في هامش محرر الأكواد لتحديد الأسطر التي ترغب بإيقاف التتبع عندها تلقائياً (Breakpoints).
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                          {Array.from(breakpoints).sort((a: any, b: any) => a - b).map((bp: any) => (
                            <span 
                              key={bp} 
                              onClick={() => toggleBreakpoint(bp)}
                              className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded border border-rose-500/20 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              السطر {bp} <span>×</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Interactive Debug Controls Hub */}
                    <div className="bg-[#0b101a] border border-cyan-950/60 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-900/40 pb-2.5">
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                          <span>جلسة برمجية نشطة</span>
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-[10px] font-mono select-none bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/30">
                          الخطوة: {currentDebugStepIndex + 1} / {debugSteps.length}
                        </div>

                        <button
                          onClick={() => {
                            if (debugSteps.length === 0) return;
                            const logContent = debugSteps.map((step, idx) => {
                              return `[خطوة ${idx + 1}] سطر: ${step.line} | نوع العمل: ${step.type}\nالمتغيرات: ${JSON.stringify(step.env, null, 2)}\n-------------------`;
                            }).join('\n\n');
                            const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `noor-debug-trace-${Date.now()}.txt`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            showNotification('📄 تم تصدير سجل تتبع الأخطاء كملف نصي بنجاح!');
                          }}
                          className="bg-cyan-900/40 hover:bg-cyan-800/60 p-1.5 rounded-lg text-cyan-300 border border-cyan-700/30 transition-all active:scale-95"
                          title="تصدير سجل التتبع"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      {/* Control Operations Bar */}
                      <div className="flex items-center justify-center gap-3 py-1 bg-slate-950/40 rounded-lg border border-slate-900/60">
                        {/* Step Back */}
                        <button
                          onClick={() => currentDebugStepIndex > 0 && setCurrentDebugStepIndex(currentDebugStepIndex - 1)}
                          disabled={currentDebugStepIndex <= 0}
                          className={`p-2 rounded-md transition-all ${
                            currentDebugStepIndex <= 0 
                              ? 'text-slate-700 cursor-not-allowed' 
                              : 'text-cyan-400 hover:bg-cyan-950/30 active:scale-95'
                          }`}
                          title="الخطوة السابقة (Step Back)"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        
                        {/* Step Forward / Into */}
                        <button
                          onClick={() => currentDebugStepIndex < debugSteps.length - 1 && setCurrentDebugStepIndex(currentDebugStepIndex + 1)}
                          disabled={currentDebugStepIndex >= debugSteps.length - 1}
                          className={`p-2 rounded-md transition-all ${
                            currentDebugStepIndex >= debugSteps.length - 1 
                              ? 'text-slate-700 cursor-not-allowed' 
                              : 'text-cyan-400 hover:bg-cyan-950/30 active:scale-95'
                          }`}
                          title="الخطوة التالية (Step Into)"
                        >
                          <ChevronRight className="w-5 h-5 transform rotate-180" />
                        </button>
                        
                        {/* Divide Line */}
                        <div className="w-px h-6 bg-slate-800/80" />
                        
                        {/* Resume to Breakpoint */}
                        <button
                          onClick={resumeDebugger}
                          disabled={currentDebugStepIndex >= debugSteps.length - 1}
                          className={`p-2 rounded-md transition-all flex items-center gap-1 text-xs font-bold ${
                            currentDebugStepIndex >= debugSteps.length - 1
                              ? 'text-slate-700 cursor-not-allowed'
                              : 'text-emerald-400 hover:bg-emerald-950/30 active:scale-95'
                          }`}
                          title="متابعة التشغيل حتى نقطة التوقف (Resume)"
                        >
                          <Play className="w-5 h-5 shrink-0" />
                          <span className="text-[10px]">متابعة</span>
                        </button>
                        
                        {/* Div Line */}
                        <div className="w-px h-6 bg-slate-800/80" />

                        {/* Stop Debugger */}
                        <button
                          onClick={stopDebugger}
                          className="p-2 rounded-md text-rose-400 hover:bg-rose-950/30 transition-all active:scale-95"
                          title="إنهاء جلسة التتبع (Stop Debugging)"
                        >
                          <Square className="w-4.5 h-4.5 shrink-0" />
                        </button>
                      </div>

                      {/* Line metadata card */}
                      <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] leading-snug">
                        <div className="bg-slate-950/40 p-2 rounded border border-slate-900 text-right">
                          <span className="text-slate-500 block text-[10px]">السطر النشط</span>
                          <span className="font-mono text-cyan-300 font-semibold">
                            السطر {debugSteps[currentDebugStepIndex]?.line || 'مجهول'}
                          </span>
                        </div>
                        <div className="bg-slate-950/40 p-2 rounded border border-slate-900 text-right">
                          <span className="text-slate-500 block text-[10px]">نوع الإجراء البرمجي</span>
                          <span className="font-mono text-cyan-400 font-semibold truncate block">
                            {(() => {
                              const t = debugSteps[currentDebugStepIndex]?.type;
                              if (t === 'VariableDecl') return 'تعريف متغير';
                              if (t === 'Assignment') return 'تغيير قيمة متغير';
                              if (t === 'IndexAssignment') return 'إسناد فهرسي (فهرسة)';
                              if (t === 'PrintStatement') return 'أمر كتابة وطباعة';
                              if (t === 'IfStatement') return 'جملة شرطية (اذا)';
                              if (t === 'WhileStatement') return 'حلقة تكرار (طالما)';
                              if (t === 'ReturnStatement') return 'أمر إرجاع للقيم';
                              return t || 'إجراء عام';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Snapshot of Variables (فحص متغيرات الذاكرة الحالية) */}
                    <div className="bg-[#0b101a] border border-cyan-950/60 rounded-xl p-4">
                      <h4 className="font-bold text-xs text-slate-200 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-900/50">
                        <Database className="w-4 h-4 text-cyan-400" />
                        <span>فحص متغيرات الذاكرة ومرصد القيم</span>
                      </h4>
                      
                      {(() => {
                        const step = debugSteps[currentDebugStepIndex];
                        const vars = step?.variables || {};
                        const keys = Object.keys(vars);
                        
                        if (keys.length === 0) {
                          return (
                            <p className="text-[11px] text-slate-500 text-center py-4 leading-relaxed">
                              لا توجد متغيرات مستخدم معرفة أو نشطة في بيئة الذاكرة في هذه الخطوة بعد.
                            </p>
                          );
                        }
                        
                        return (
                          <div className="space-y-2 h-full max-h-[180px] overflow-y-auto pr-1">
                            {keys.map(key => {
                              const val = vars[key];
                              let renderedVal = '';
                              let valTypeMarker = '';
                              
                              if (val === null || val === undefined) {
                                renderedVal = 'عدم';
                                valTypeMarker = 'null';
                              } else if (typeof val === 'boolean') {
                                renderedVal = val ? 'صحيح' : 'خطأ';
                                valTypeMarker = 'بوليني';
                              } else if (typeof val === 'object') {
                                renderedVal = JSON.stringify(val);
                                valTypeMarker = Array.isArray(val) ? 'قائمة' : 'كائن';
                              } else {
                                renderedVal = String(val);
                                valTypeMarker = typeof val === 'number' ? 'رقم' : 'نص';
                              }
                              
                              return (
                                <div key={key} className="flex items-center justify-between text-xs bg-slate-950/30 p-2 rounded border border-slate-900 font-mono transition-colors hover:bg-slate-950/60">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded">
                                      {valTypeMarker}
                                    </span>
                                    <span className="text-slate-300 font-semibold break-all text-right select-all">
                                      {renderedVal}
                                    </span>
                                  </div>
                                  <span className="text-cyan-400 font-bold ml-2">
                                    {key}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Active Breakpoints Management Block */}
                    <div className="bg-[#0b101a] border border-cyan-950/60 rounded-xl p-4 text-right">
                      <h4 className="font-bold text-xs text-slate-200 mb-2 flex items-center justify-between pb-1.5 border-b border-slate-900/40">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-rose-400" />
                          <span>نقاط التوقف الفعالة ({breakpoints.size})</span>
                        </div>
                        {breakpoints.size > 0 && (
                          <button 
                            onClick={() => setBreakpoints(new Set())}
                            className="text-[10px] text-rose-400 hover:underline"
                          >
                            إزالة الكل
                          </button>
                        )}
                      </h4>
                      
                      {breakpoints.size === 0 ? (
                        <p className="text-[11px] text-slate-500 py-2 leading-relaxed text-center">
                          لا توجد نقاط توقف نشطة حالياً. انقر على أرقام سطور المحرر لتحديد نقاط توقف إضافية.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mt-2 max-h-[85px] overflow-y-auto">
                          {Array.from(breakpoints).sort((a: any, b: any) => a - b).map((bp: any) => (
                            <span 
                              key={bp} 
                              onClick={() => toggleBreakpoint(bp)}
                              className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded border border-rose-500/20 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="انقر للإلغاء"
                            >
                              السطر {bp} <span className="text-rose-600 font-bold">×</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SNIPPETS HUB */}
            {activeNavTab === 'snippets' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[480px]">
                <div className="bg-[#0b101a] border border-cyan-950/60 rounded-xl p-5 text-right flex flex-col gap-2">
                  <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                    <Code className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>مكتبة القصاصات البرمجية الجاهزة (Sovereign Snippets Hub)</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    مجموعة من النماذج والهياكل البرمجية المدمجة والجاهزة لكتابة ألعاب 3D، خوادم الويب، الذكاء الاصطناعي، التشفير والأمان. اختر أي قصاصة لإدراجها مباشرة في ملفك النشط.
                  </p>
                </div>

                <div className="space-y-4">
                  {REUSABLE_SNIPPETS.map(snip => (
                    <div key={snip.id} className="bg-[#0d1421] rounded-xl border border-slate-900 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-900/40 bg-[#0b101a] flex items-center justify-between">
                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded font-bold">
                          {snip.category}
                        </span>
                        <h4 className="font-bold text-sm text-slate-100">{snip.title}</h4>
                      </div>
                      <div className="p-4 flex-1 flex flex-col gap-3">
                        <p className="text-xs text-slate-400 leading-relaxed text-right font-medium">
                          {snip.description}
                        </p>
                        <pre className="text-[10px] font-mono bg-black/60 p-3 rounded-lg border border-slate-900 text-cyan-200/80 max-h-[120px] overflow-y-auto text-left leading-normal" dir="ltr">
                          {snip.code}
                        </pre>
                        
                        <div className="flex items-center gap-2.5 justify-end mt-1">
                          <button
                            onClick={() => {
                              setEditorContent(prev => prev ? prev + '\n' + snip.code : snip.code);
                              showNotification(`➕ تم إلحاق قصاصة [${snip.title}] بنهاية الكود الحركي.`);
                            }}
                            className="bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-[11px] font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition-all cursor-pointer active:scale-95"
                          >
                            <span>إدراج في موضع المؤشر / الحاق</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditorContent(snip.code);
                              showNotification(`♻️ تم استبدال الكود بالكامل بقالب [${snip.title}].`);
                            }}
                            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-[11px] font-bold text-white px-3.5 py-2 rounded-lg transition-all cursor-pointer active:scale-95 shadow-[0_2px_8px_rgba(6,182,212,0.15)]"
                          >
                            <span>استبدال وتحرير قالب القصاصة</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ABOUT NOOR */}
            {activeNavTab === 'about' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[480px]">
                <div className="bg-[#0d1421] rounded-xl border border-slate-900 overflow-hidden">
                  <div className="p-4 border-b border-slate-900/40 bg-[#0b101a] flex items-center justify-between">
                    <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      <span>لماذا لغة نور؟ (الاستقلالية التامة)</span>
                    </h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">رؤية المعالج الجديد 5.0</span>
                  </div>
                  <div className="p-4 text-xs text-slate-300 space-y-4 leading-loose text-right">
                    <p>
                      لغة نور ليست مجرد غلاف للغات أخرى (Wrapper). لقد بنيت من الأساس بمحرك (Sovereign VM) مستقل كليًا يحلل الأسطر وينفذ الحسابات داخل الذاكرة بمعزل عن أي متطلبات أو برمجيات مساعدة.
                    </p>
                    <p>
                      تهتم اللغات التقليدية بإضافات بطيئة أو تعقيدات في إدارة المكاتب. تعتمد لغة نور على هيكلية <span className="text-cyan-400">All-in-One</span>. وهذا يعني أن قواعد البيانات، تصميم الويب، محرك الألعاب ومكاتب الهواتف كلها جزء أصيل من المترجم الأساسي.
                    </p>
                    <div className="bg-slate-950 p-3 rounded border border-slate-900/60">
                      <strong className="text-cyan-300 mb-1 block">الأهداف الرئيسية:</strong>
                      <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2 pr-2">
                        <li>سرعة صاروخية في التفسير (Instant Compilation).</li>
                        <li>بناء هيكل الواجهات البرمجية مباشرة من السطح البرمجي (DOM Sovereign).</li>
                        <li>كتابة السكربتات المتقدمة لإدارة سيرفرات لينكس والتلقيم المباشر.</li>
                        <li>تشفير مدمج (Built-in Cryptography) بدون مكتبات خارجية، لحماية البيانات الحساسة جداً لمديري النظم.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0d1421] rounded-xl border border-slate-900 overflow-hidden mt-2">
                  <div className="p-4 border-b border-slate-900/40 bg-[#0b101a]">
                    <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>المحرك العياني للتعلم (Neuro-Core)</span>
                    </h3>
                  </div>
                  <div className="p-4 text-xs text-slate-300 leading-loose text-right">
                    <p>
                      تم إرفاق نموذج معالجة وتحليل آلي في صميم اللغة، يستطيع قراءة المدخلات واستنباط الحلول في لمح البصر. المحرك مزود بتصنيفات جاهزة لبناء نماذج الذكاء الاصطناعي بشكل فوري لقطاع الأعمال والبحوث.
                    </p>
                  </div>
                </div>

                <div className="bg-[#0d1421] rounded-xl border border-slate-900 overflow-hidden mt-2">
                  <div className="p-4 border-b border-slate-900/40 bg-[#0b101a]">
                    <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <span>طرق التشغيل والبيئة (Execution & Environments)</span>
                    </h3>
                  </div>
                  <div className="p-4 text-xs text-slate-300 leading-loose text-right space-y-3">
                    <p>
                      يمكنك تشغيل لغة نور 5.0 بمرونة تامة وعلى كافة أنظمة التشغيل، حيث قمنا بتوفير نصوص تشغيل آلية للمطورين.
                    </p>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900/60">
                      <strong className="text-emerald-400 flex items-center gap-1.5 mb-1.5"><span>أنظمة Linux, Mac أو Termux (للأندرويد)</span></strong>
                      <p className="text-slate-400 text-[11px] mb-2">استخدم متصفح الملفات بصلاحيات الترمينال لتشغيل نص التثبيت المباشر:</p>
                      <pre className="font-mono text-cyan-300 bg-[#0a0f18] p-2 rounded text-[11px]" dir="ltr">
                        {`chmod +x install.sh
./install.sh
noor run app.noor`}
                      </pre>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900/60">
                      <strong className="text-cyan-400 flex items-center gap-1.5 mb-1.5"><span>أنظمة Windows</span></strong>
                      <p className="text-slate-400 text-[11px] mb-2">استخدم الطرفية الافتراضية للتشغيل:</p>
                      <pre className="font-mono text-cyan-300 bg-[#0a0f18] p-2 rounded text-[11px]" dir="ltr">
                        {`install.bat
noor-cli.exe run app.noor`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
        )}

      </main>

      {/* Slim Status Bar (VS Code style footer) */}
      <footer className="min-h-7 py-1 bg-[#007acc] text-white flex flex-wrap items-center justify-between px-3 text-[11px] font-sans shrink-0 z-50 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>جاهز ({activeFileId}.noor)</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
            <XCircle className="w-3.5 h-3.5" />
            <span>0</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
            الترميز: UTF-8
          </div>
          <div className="cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
            لغة نور المستقلة (Sovereign)
          </div>
          <div className="cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            الإصدار 5.0
          </div>
        </div>
      </footer>
    </div>
  );
}

interface SimulatedWebPageProps {
  responseContent: any;
  showNotification: (msg: string) => void;
  availablePages?: any[];
  onNavigate?: (page: any) => void;
}

export function SimulatedWebPage({ responseContent, showNotification, availablePages, onNavigate }: SimulatedWebPageProps) {
  if (typeof responseContent !== 'object' || responseContent.type !== 'page') {
    return (
      <div className="flex-1 bg-black rounded-lg p-4 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto select-all max-w-full">
        <pre className="whitespace-pre-wrap">{String(responseContent)}</pre>
      </div>
    );
  }

  const pStyle = responseContent.styles || {};
  const fontStyle = pStyle.fontFamily === 'Fira Code' ? 'font-mono' : 'font-sans';
  const color = resolveColor(pStyle.color || 'white');
  const background = resolveBackground(pStyle.background || 'أسود_فحمي');

  const renderElements = (elements: any[], renderColor: string): React.ReactNode => {
    if (!elements || !Array.isArray(elements)) return null;
    return elements.map((el: any, elIdx: number) => {
      if (el.type === 'text') {
        const isHeader = el.textType === 'رأسية_كبيرة' || el.textType === 'حجم_ضخم';
        const isSubHeader = el.textType === 'عنوان' || el.textType === 'رأسية';
        
        if (isHeader) {
          return (
            <h1 
              key={elIdx} 
              className="text-4xl md:text-6xl font-black bg-clip-text text-transparent pb-1 tracking-tight mb-4 select-text opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]"
              style={{ backgroundImage: `linear-gradient(to left, ${renderColor}, #ffffff)`, animationDelay: `${elIdx * 100}ms`, ...el.style }}
            >
              {el.content}
            </h1>
          );
        }
        if (isSubHeader) {
          return (
            <h2 
              key={elIdx} 
              className="text-2xl md:text-3xl font-bold mt-6 mb-3 select-text flex items-center gap-3 opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]"
              style={{ color: '#ffffff', animationDelay: `${elIdx * 100}ms`, ...el.style }}
            >
              <span className="w-2 h-8 rounded-full shadow-[0_0_15px_currentColor]" style={{ background: renderColor }}></span>
              {el.content}
            </h2>
          );
        }
        return (
          <p 
            key={elIdx} 
            className="text-sm md:text-lg leading-relaxed text-slate-300 select-text font-medium opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]"
            style={{ animationDelay: `${elIdx * 100}ms`, ...el.style }}
          >
            {el.content}
          </p>
        );
      }

      if (el.type === 'button') {
        return (
          <div key={elIdx} className="pt-4 pb-2 opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]" style={{ animationDelay: `${elIdx * 100}ms` }}>
            <button 
              type="button"
              onClick={() => {
                const target = availablePages?.find((p:any) => p.title === el.action);
                if (target && onNavigate) onNavigate(target);
                else showNotification(el.action ? `تنفيذ: ${el.action}` : `✨ تم التفاعل وحفظ النقرة للزر: "${el.text}"`);
              }}
              className="px-8 py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase select-none shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer hover:shadow-[0_15px_45px_rgba(255,255,255,0.15)] hover:-translate-y-1 text-white w-fit border border-white/20 relative overflow-hidden group"
              style={{ background: `linear-gradient(135deg, ${renderColor} 0%, rgba(10,10,20,0.95) 100%)`, ...el.style }}
            >
              <span className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {el.text}
            </button>
          </div>
        );
      }

      if (el.type === 'list') {
        return (
          <div 
            key={elIdx} 
            className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl w-full opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]"
            style={{ animationDelay: `${elIdx * 100}ms`, ...el.style }}
          >
            <p className="text-lg font-black mb-6 flex items-center gap-3" style={{ color: renderColor }}>
              <span className="w-2.5 h-6 rounded-full shadow-[0_0_15px_currentColor]" style={{ background: renderColor }} />
              {el.listType}
            </p>
            <ul className="space-y-4">
              {el.items && el.items.map((itemValue: string, iIdx: number) => (
                <li key={iIdx} className="text-base flex items-start gap-4 text-slate-200 group">
                  <span className="w-2 h-2 rounded-full shrink-0 mt-2 shadow-[0_0_10px_currentColor] group-hover:scale-150 transition-transform" style={{ background: renderColor }} />
                  <span className="font-medium leading-relaxed group-hover:text-white transition-colors">{itemValue}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      if (el.type === 'media') {
        return (
          <div 
            key={elIdx} 
            className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/60 w-full relative group opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]"
            style={{ animationDelay: `${elIdx * 100}ms`, ...el.style }}
          >
            {el.mediaType === 'فيديو' ? (
               <video src={el.content} className="w-full max-h-[500px] object-cover block group-hover:scale-105 transition-transform duration-1000" controls />
            ) : (
                <img 
                  src={el.content} 
                  alt="Web Asset" 
                  className="w-full max-h-[500px] object-cover block group-hover:scale-105 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.style.display = 'none';
                    const s = target.nextSibling as HTMLElement;
                    if (s) s.style.display = 'flex';
                  }}
                />
            )}
            <div 
              className="hidden absolute inset-0 bg-black/50 backdrop-blur-md py-10 px-6 items-center justify-center text-center text-base text-slate-200 font-bold tracking-wider"
            >
              🎥 معاينة الميديا غير متوفرة محلياً لحجمها
            </div>
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none"></div>
          </div>
        );
      }

      if (el.type === 'table') {
        return (
          <div 
            key={elIdx} 
            className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-xl w-full opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]"
            style={{ animationDelay: `${elIdx * 100}ms`, ...el.style }}
          >
            <table className="w-full border-collapse text-right text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.05]">
                  {el.columns && el.columns.map((col: string, colIdx: number) => (
                    <th key={colIdx} className="p-4 font-bold tracking-wide" style={{ color: renderColor }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {el.rows && el.rows.map((row: any[], rowIdx: number) => (
                  <tr key={rowIdx} className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.06] transition-colors group">
                    {Array.isArray(row) && row.map((cell: any, cellIdx: number) => (
                      <td key={cellIdx} className="p-4 text-slate-200 font-medium group-hover:text-white transition-colors">
                         {cellIdx === 0 && <span className="inline-block w-1 h-3 rounded-full ml-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: renderColor }}></span>}
                         {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      if (el.type === 'form') {
        return (
          <form 
            key={elIdx} 
            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 w-full relative overflow-hidden opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]"
            style={{ animationDelay: `${elIdx * 100}ms`, ...el.style }}
            onSubmit={(e) => { e.preventDefault(); showNotification('✅ تم الحفظ بنجاح'); }}
          >
            {el.name && (
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                 <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${renderColor}, #222)` }}>
                   <span className="text-white text-xs">📝</span>
                 </div>
                 <h3 className="text-xl font-black text-white">{el.name}</h3>
              </div>
            )}
            <div className="flex flex-col gap-5 relative z-10">
               {renderElements(el.elements, renderColor)}
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
          </form>
        );
      }

      if (el.type === 'link') {
        const isInternal = availablePages?.some((p:any) => p.title === el.url);
        return (
          <div key={elIdx} className="my-2">
            <a 
              href={isInternal ? '#' : el.url} 
              target={isInternal ? "_self" : "_blank"} 
              rel="noreferrer"
              onClick={(e) => {
                 if (isInternal) {
                   e.preventDefault();
                   const target = availablePages?.find((p:any) => p.title === el.url);
                   if (target && onNavigate) onNavigate(target);
                 }
              }}
              className="text-sm font-bold border-b-2 pb-1 inline-flex items-center gap-2 transition-all opacity-80 hover:opacity-100 cursor-pointer hover:gap-3"
              style={{ color: renderColor, borderColor: renderColor, ...el.style }}
            >
              <span>{el.text}</span>
              <span className="text-xs transition-transform tracking-tight">↗</span>
            </a>
          </div>
        );
      }

      if (el.type === 'input') {
          return (
             <div key={elIdx} className="flex flex-col gap-2 w-full group" style={el.style}>
                {el.label && <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider select-none group-focus-within:text-white transition-colors">{el.label}</label>}
                {el.inputType === 'textarea' ? (
                  <textarea 
                   placeholder={el.placeholder} 
                   className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all min-h-[120px] shadow-inner"
                 />
                ) : el.inputType === 'select' ? (
                  <select className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner appearance-none relative">
                    <option value="" className="bg-slate-900">{el.placeholder}</option>
                    {el.options && el.options.map((opt:string, oIdx:number) => <option key={oIdx} value={opt} className="bg-slate-900">{opt}</option>)}
                  </select>
                ) : (
                 <input 

                   type={el.inputType || "text"} 
                   placeholder={el.placeholder} 
                   className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-xs text-white outline-none focus:border-emerald-500 transition-colors"
                 />
                )}
             </div>
          );
      }

      if (el.type === 'navbar') {
        return (
          <nav key={elIdx} className="bg-white/[0.02] backdrop-blur-2xl border-b border-white/10 px-8 py-5 flex flex-wrap justify-between items-center w-full z-50 shrink-0 sticky top-0 shadow-sm" style={el.style}>
             <span className="flex items-center gap-3 text-lg font-black select-none pointer-events-none tracking-tight">
               <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${renderColor}, #111)` }}>
                 {el.logoIcon ? <span className="text-sm">{el.logoIcon}</span> : <span className="text-white text-xs">🚀</span>}
               </div>
               <span style={{ color: renderColor }}>{el.title || responseContent.title}</span>
             </span>
             <ul className="flex flex-wrap gap-8 list-none text-sm font-semibold text-slate-400 select-none">
               {el.links && el.links.map((link: string, ldx: number) => (
                 <li key={ldx} className="hover:text-white cursor-pointer transition-colors relative group" onClick={() => {
                   const target = availablePages?.find((p:any) => p.title === link);
                   if (target && onNavigate) onNavigate(target);
                   else showNotification(`توجيه إلى: ${link}`);
                 }}>
                   {link}
                   <span className="absolute -bottom-2 left-1/2 w-0 h-0.5 bg-white transition-all group-hover:w-full group-hover:left-0 rounded-full"></span>
                 </li>
               ))}
             </ul>
          </nav>
        );
      }

      if (el.type === 'sidebar') {
         return (
           <aside key={elIdx} className="w-72 bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-3xl border-l border-white/10 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto" style={el.style}>
              {el.title && <h3 className="font-black text-sm uppercase tracking-widest mb-2 opacity-80" style={{ color: renderColor }}>{el.title}</h3>}
              <ul className="flex flex-col gap-2 list-none text-sm font-medium text-slate-400 select-none">
               {el.links && el.links.map((link: string, ldx: number) => (
                 <li key={ldx} className="flex items-center gap-3 hover:text-white hover:bg-white/[0.05] cursor-pointer transition-all p-3 rounded-xl border border-transparent hover:border-white/5" onClick={() => {
                   const target = availablePages?.find((p:any) => p.title === link);
                   if (target && onNavigate) onNavigate(target);
                   else showNotification(`توجيه إلى: ${link}`);
                 }}>
                   <span className="w-1.5 h-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100" style={{ background: renderColor }}></span>
                   {link}
                 </li>
               ))}
             </ul>
             <div className="flex-1"></div>
             {renderElements(el.elements, renderColor)}
           </aside>
         );
      }

      if (el.type === 'card') {
         return (
            <div key={elIdx} className={`bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col gap-4 transition-all hover:bg-white/[0.05] hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] group opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards] ${el.className || ''}`} style={{ animationDelay: `${elIdx * 100}ms`, ...el.style }}>
               {el.title && (
                 <h3 className="font-extrabold text-xl tracking-tight mb-2 flex items-center gap-3" style={{ color: renderColor }}>
                   <span className="w-1.5 h-6 rounded-full opacity-80 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_currentColor]" style={{ background: renderColor }}></span>
                   {el.title}
                 </h3>
               )}
               <div className="flex flex-col gap-4">
                 {renderElements(el.elements, renderColor)}
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -z-10 group-hover:bg-white/10 transition-colors pointer-events-none"></div>
            </div>
         );
      }

      if (el.type === 'container') {
        const defaultClass = el.direction === 'row' ? 'flex flex-row flex-wrap gap-8 p-6 w-full items-start' : 'flex flex-col gap-8 p-6 w-full max-w-7xl mx-auto';
        return (
          <div key={elIdx} className={`${defaultClass} opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards] ${el.flex1 ? 'flex-1' : ''} ${el.className || ''}`} style={{ animationDelay: `${elIdx * 100}ms`, ...el.style }}>
            {renderElements(el.elements, renderColor)}
          </div>
        );
      }
      
      if (el.type === 'grid') {
        return (
          <div key={elIdx} className={`grid grid-cols-1 md:grid-cols-${el.columns || 2} xl:grid-cols-${Math.min(el.columns || 2, 4)} gap-6 w-full opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards] ${el.className || ''}`} style={{ animationDelay: `${elIdx * 100}ms`, ...el.style }}>
            {renderElements(el.elements, renderColor)}
          </div>
        );
      }

      if (el.type === 'modal') {
        return (
          <div key={elIdx} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 w-full h-full absolute">
            <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-xl w-full relative flex flex-col gap-6" style={el.style}>
              <button 
                onClick={() => showNotification('تم الإغلاق')} 
                className="absolute top-5 left-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
               >
                 ✕
               </button>
              {el.title && <h3 className="font-black text-2xl" style={{ color: renderColor }}>{el.title}</h3>}
              <div className="flex flex-col gap-4 text-slate-300 relative z-10">
                {renderElements(el.elements, renderColor)}
              </div>
            </div>
          </div>
        );
      }

      if (el.type === 'tabs') {
        return (
          <div key={elIdx} className="flex flex-col gap-6 w-full">
            <div className="flex border-b border-white/10 gap-8 overflow-x-auto">
              {el.tabs && el.tabs.map((tab:string, tIdx:number) => (
                <button 
                  key={tIdx} 
                  className={`pb-4 px-2 text-sm font-bold tracking-wide relative flex-shrink-0 transition-colors ${tIdx === 0 ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tab}
                  {tIdx === 0 && <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: renderColor }}></span>}
                </button>
              ))}
            </div>
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderElements(el.elements, renderColor)}
            </div>
          </div>
        );
      }

      if (el.type === 'loader') {
        return (
          <div key={elIdx} className="w-full flex flex-col items-center justify-center p-12 py-20 gap-6 opacity-80" style={el.style}>
             <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin shadow-[0_0_15px_rgba(255,255,255,0.2)]" style={{ borderTopColor: renderColor }}></div>
             <p className="text-sm font-bold tracking-widest uppercase text-white animate-pulse">{el.text}</p>
          </div>
        );
      }

      if (el.type === 'alert') {
        const bg = el.msgType === 'error' ? 'bg-red-500/10 border-red-500/50' : el.msgType === 'success' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-blue-500/10 border-blue-500/50';
        const colorClass = el.msgType === 'error' ? 'text-red-400' : el.msgType === 'success' ? 'text-emerald-400' : 'text-blue-400';
        return (
          <div key={elIdx} className={`w-full p-4 rounded-xl border flex items-center justify-between shadow-lg ${bg}`} style={el.style}>
             <span className={`text-sm font-bold flex items-center gap-3 ${colorClass}`}>
                <span className="text-lg">{el.msgType === 'error' ? '⚠️' : el.msgType === 'success' ? '✅' : 'ℹ️'}</span>
                {el.message}
             </span>
             <button onClick={() => showNotification("تم إخفاء التنبيه")} className="opacity-50 hover:opacity-100 transition-opacity">✕</button>
          </div>
        );
      }

      if (el.type === 'chart') {
        return (
          <div key={elIdx} className="w-full bg-white/[0.02] border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col gap-6 opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]" style={{ animationDelay: `${elIdx * 100}ms`, ...el.style }}>
             {el.title && <h3 className="font-extrabold text-xl tracking-tight" style={{ color: renderColor }}>{el.title}</h3>}
             <div className="flex items-end gap-3 h-48 w-full mt-2 border-b border-white/10 pb-2 overflow-x-auto relative">
                {el.data && Array.isArray(el.data) && el.data.length > 0 ? el.data.map((val:any, dIdx:number) => {
                  const height = Math.min(100, Math.max(5, (Number(val) || 0) * 2));
                  return (
                    <div key={dIdx} className="flex-1 flex flex-col items-center gap-2 group min-w-[40px]">
                      <div className="w-full rounded-t-lg transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-80 relative shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer" style={{ height: `${height}%`, background: `linear-gradient(to top, ${renderColor}, rgba(255,255,255,0.8))` }}>
                         <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all text-xs font-black bg-white text-slate-900 px-3 py-1.5 rounded-lg shadow-xl pointer-events-none">{val}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">لا توجد بيانات للعرض</div>
                )}
             </div>
             <div className="w-full text-center text-xs font-semibold text-slate-500 mt-2 uppercase tracking-widest">مؤشرات حية تفاعلية</div>
          </div>
        );
      }

      if (el.type === 'footer') {
        return (
          <footer key={elIdx} className="w-full mt-auto bg-black/60 backdrop-blur-md border-t border-white/10 p-8 flex flex-col items-center justify-center gap-4 text-center shrink-0 shadow-2xl relative z-10" style={el.style}>
            {el.text && <h4 className="font-bold text-sm tracking-widest text-slate-300">{el.text}</h4>}
            {el.elements && el.elements.length > 0 && (
               <div className="w-full flex justify-center gap-4 mt-4">
                  {renderElements(el.elements, renderColor)}
               </div>
            )}
            <div className="text-[10px] text-slate-500 mt-4 max-w-lg mx-auto leading-relaxed">
              تم بناء هذه المنصة المستقلة عبر محرك <strong>لغة نور</strong> الوطني للبرمجة السيادية المتقدمة. 
              جميع الحقوق محفوظة للمستقبل. 
            </div>
            <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${renderColor}, transparent)` }}></div>
          </footer>
        );
      }

      if (el.type === 'custom') {
        const Tag = el.tag as any;
        // fallback generic renderer
        return (
          <Tag key={elIdx} {...(el.props || {})} style={{...el.style, ...el.props?.style}}>
            {el.content && el.content}
            {renderElements(el.elements, renderColor)}
          </Tag>
        );
      }

      return null;
    });
  };

  const allElements = responseContent.elements || [];
  const navbarElement = allElements.find((el: any) => el.type === 'navbar');
  const sidebarElement = allElements.find((el: any) => el.type === 'sidebar');
  const otherElements = allElements.filter((el: any) => el.type !== 'navbar' && el.type !== 'sidebar');

  return (
    <div 
      dir="rtl"
      className={`rounded-xl border border-slate-900/50 flex flex-col transition-all overflow-hidden ${fontStyle} absolute inset-0 select-text`}
      style={{ background: background, color: '#f1f5f9' }}
    >
      {/* 1. Header/Navbar on top if present */}
      {navbarElement && renderElements([navbarElement], color)}
      
      {/* 2. Main Workspace (Sidebar and Content Area) */}
      <div className="flex-1 flex flex-row overflow-hidden w-full relative">
        {/* Sidebar on the right (translates naturally under dir="rtl") */}
        {sidebarElement && renderElements([sidebarElement], color)}
        
        {/* Scrollable Content Container */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 w-full ${responseContent.layout === 'row' ? 'flex-row flex-wrap items-start' : 'max-w-7xl mx-auto'}`}>
          {renderElements(otherElements, color)}
        </div>
      </div>
    </div>
  );
}
