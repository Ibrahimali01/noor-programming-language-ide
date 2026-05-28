import React, { useState, useEffect } from 'react';
import { NoorPackage } from './noor-builder.ts';
import { NoorInterpreter, tokenize, Parser } from './noor-compiler.ts';

interface NPKRuntimeProps {
  npk: NoorPackage | null;
  onClose: () => void;
}

export function NPKRuntime({ npk, onClose }: NPKRuntimeProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [uiTree, setUiTree] = useState<any[]>([]);
  const [isBooting, setIsBooting] = useState(false);

  useEffect(() => {
    if (npk) {
      bootApp(npk);
    }
  }, [npk]);

  const bootApp = async (pkg: NoorPackage) => {
    setIsBooting(true);
    setLogs([`⚡ تشغيل نظام بيئة نور للتطبيقات (NRE)...`, `📱 تحميل تطبيق: ${pkg.manifest.appName}`]);
    
    setTimeout(() => {
      // Simulate App Engine setup
      const appEngine = new NoorInterpreter();
      
      // Define App UI APIs in Noor
      (appEngine as any).localRegistry.uiNodes = [];
      (appEngine as any).localRegistry.addLogs = (msg: string) => {
          setLogs(prev => [...prev, msg]);
      };

      const codeFiles = pkg.files.filter(f => f.type === 'code');
      const entryFile = codeFiles.find(f => f.path === pkg.manifest.entryPoint);

      if (!entryFile) {
        setLogs(prev => [...prev, `❌ خطأ كارثي: نقطة الإطلاق "${pkg.manifest.entryPoint}" غير موجودة في الحزمة.`]);
        setIsBooting(false);
        return;
      }

      try {
        setLogs(prev => [...prev, `🔄 تفسير واجهة المستخدم والشفرة البرمجية...`]);
        const result = appEngine.run(entryFile.content);
        setLogs(prev => [...prev, ...result.logs]);
        
        // Extract rendered UI tree if the application registered it
        if (appEngine.activePage && appEngine.activePage.elements) {
            setUiTree(appEngine.activePage.elements);
        } else {
            setLogs(prev => [...prev, `⚠️ التطبيق لم يقم بإنشاء واجهة مستخدم رسومية (GUI).`]);
        }

      } catch (e: any) {
         setLogs(prev => [...prev, `❌ انهيار التطبيق أثناء التشغيل: ${e.message || e.error}`]);
      }

      setIsBooting(false);
    }, 1500);
  };

  if (!npk) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
      <div className="flex w-full max-w-5xl h-[90vh] gap-6">
        
        {/* Mobile Device Simulator Container */}
        <div className="relative w-[380px] h-[780px] bg-black rounded-[48px] border-[12px] border-slate-800 shadow-[0_0_100px_rgba(34,211,253,0.15)] flex flex-col overflow-hidden shrink-0 ring-1 ring-slate-700">
           {/* Device Notch */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-3xl z-20"></div>
           
           {/* Status Bar */}
           <div className="h-8 w-full px-6 flex items-center justify-between text-[10px] text-white/70 bg-slate-900 z-10 shrink-0 select-none">
             <span>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
             <div className="flex items-center gap-1.5">
               <span>5G</span>
               <span>100%</span>
               <div className="w-5 h-2.5 bg-white/70 rounded-sm relative">
                  <div className="absolute right-[-2px] top-[1px] w-1 h-[6px] bg-white/70 rounded-r-sm"></div>
               </div>
             </div>
           </div>

           {/* App Content Area */}
           <div className="flex-1 overflow-y-auto bg-slate-50 relative flex flex-col">
              {isBooting ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-cyan-400 font-bold animate-pulse">جاري تشغيل {npk.manifest.appName}</p>
                 </div>
              ) : (
                <div className="flex-1 p-4 flex flex-col gap-3">
                  {uiTree.length > 0 ? (
                    uiTree.map((el, idx) => {
                      if (el.type === 'نص') return <p key={idx} className="text-slate-800 text-base">{el.content}</p>;
                      if (el.type === 'عنوان') return <h1 key={idx} className="text-2xl font-bold text-slate-900 my-2">{el.content}</h1>;
                      if (el.type === 'زر') return (
                        <button key={idx} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-[0.98]">
                           {el.content}
                        </button>
                      );
                      if (el.type === 'بطاقة') return (
                         <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                             <h3 className="font-bold text-slate-800 text-lg">{el.title}</h3>
                             <p className="text-slate-500 text-sm">{el.content}</p>
                         </div>
                      );
                      return <div key={idx} className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-lg">عنصر واجهة غير معروف: {el.type}</div>;
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <span className="text-4xl">📭</span>
                        <p className="text-sm">واجهة التطبيق فارغة</p>
                    </div>
                  )}
                </div>
              )}
           </div>

           {/* Home Indicator */}
           <div className="h-6 bg-slate-50 w-full flex items-center justify-center shrink-0 rounded-b-[36px]">
              <div className="w-32 h-1.5 bg-slate-800 rounded-full"></div>
           </div>
        </div>

        {/* Console & Debug Area */}
        <div className="flex-1 flex flex-col gap-4">
           
           <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col gap-2">
               <div className="flex justify-between items-start">
                   <div>
                       <h2 className="text-2xl font-bold text-white mb-1">محاكي تطبيقات نور (NRE)</h2>
                       <p className="text-slate-400 text-sm">بيئة تنفيذ صيغة .npk المستقلة للأنظمة المحمولة</p>
                   </div>
                   <button onClick={onClose} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm font-bold border border-red-500/20">
                     إغلاق المحاكي
                   </button>
               </div>
               
               <div className="mt-4 grid grid-cols-2 gap-4">
                   <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                     <span className="text-xs text-slate-500 block mb-1">اسم الحزمة</span>
                     <span className="text-sm text-cyan-400 font-mono">{npk.manifest.appName}_{npk.manifest.version}.npk</span>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                     <span className="text-xs text-slate-500 block mb-1">توقيع السيادة</span>
                     <span className="text-[10px] text-emerald-400 font-mono break-all">{npk.signature}</span>
                   </div>
               </div>
           </div>

           <div className="flex-1 bg-[#1e1e1e] rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
              <div className="h-10 bg-[#2d2d2d] flex items-center px-4 border-b border-black shrink-0">
                  <span className="text-xs text-slate-400 font-mono">سجل النظام (System Log)</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5 isolate" dir="ltr">
                  {logs.map((log, i) => (
                      <div key={i} className="font-mono text-[11px] leading-relaxed break-words text-slate-300">
                           <span className="text-slate-600 mr-2 select-none">[{new Date().toISOString().substring(11,19)}]</span>
                           <span dir="rtl" className="inline-block">{log}</span>
                      </div>
                  ))}
                  <div className="animate-pulse w-2 h-4 bg-slate-500 mt-2"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
