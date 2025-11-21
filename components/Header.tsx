
import React from 'react';
import { Undo2, Redo2, Sparkles, Code, Smartphone, Monitor, Download } from 'lucide-react';
import { FrameworkType } from '../types';

interface HeaderProps {
  historyIndex: number;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onAiOpen: () => void;
  showCode: boolean;
  onToggleCode: () => void;
  framework: FrameworkType;
  onFrameworkChange: (f: FrameworkType) => void;
}

export default function Header({ 
  historyIndex, 
  historyLength, 
  onUndo, 
  onRedo, 
  onAiOpen, 
  showCode, 
  onToggleCode,
  framework,
  onFrameworkChange
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 z-30 relative">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">UI</div>
              <h1 className="font-semibold text-lg tracking-tight hidden sm:block">Builder Pro</h1>
           </div>
           
           {/* Framework Switcher */}
           <div className="flex bg-slate-100 p-1 rounded-lg ml-4">
              <button 
                onClick={() => onFrameworkChange('nextjs')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${framework === 'nextjs' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Monitor size={14} /> Next.js
              </button>
              <button 
                onClick={() => onFrameworkChange('flutter')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${framework === 'flutter' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Smartphone size={14} /> Flutter
              </button>
           </div>

           {/* Undo / Redo Buttons */}
           <div className="flex items-center gap-1 border-l border-slate-200 pl-4 h-6">
               <button 
                 onClick={onUndo} 
                 disabled={historyIndex === 0}
                 className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"
                 title="Undo (Ctrl+Z)"
               >
                   <Undo2 size={16} />
               </button>
               <button 
                 onClick={onRedo} 
                 disabled={historyIndex === historyLength - 1}
                 className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"
                 title="Redo (Ctrl+Shift+Z)"
               >
                   <Redo2 size={16} />
               </button>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <button onClick={onAiOpen} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors">
              <Sparkles size={14} /><span>AI Generate</span>
           </button>
           <button onClick={onToggleCode} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showCode ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              <Code size={14} /><span>{showCode ? 'Editor' : 'Export'}</span>
           </button>
        </div>
      </header>
  );
}
