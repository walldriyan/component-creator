import React from 'react';
import { ComponentNode, LibraryType } from '../types';
import { Settings2, Layout, Palette, Square, Star } from 'lucide-react';

interface PropertiesPanelProps {
  node: ComponentNode | null;
  onChange: (updates: Partial<ComponentNode>) => void;
  onStyleChange: (styleUpdates: any) => void;
}

export default function PropertiesPanel({ node, onChange, onStyleChange }: PropertiesPanelProps) {
  if (!node) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
        <Settings2 size={48} className="mb-4 opacity-20" />
        <p>Select a component on the canvas to edit its properties.</p>
      </div>
    );
  }

  const inputClass = "w-full text-sm border border-gray-200 bg-[#fafafa] hover:bg-white focus:bg-white rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-700";
  const sectionHeaderClass = "text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2";

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col overflow-y-auto shadow-[rgba(0,0,0,0.05)_0px_0px_10px] z-20">
      <div className="p-5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
           <h2 className="font-semibold text-gray-800">Properties</h2>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-1 ml-4">{node.id} • {node.type}</p>
      </div>

      <div className="p-5 space-y-8">
        
        {/* General Settings */}
        <section>
           <h3 className={sectionHeaderClass}>
               <Settings2 size={14} /> General
           </h3>
           
           <div className="space-y-4">
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1.5">Library Style</label>
               <select className={inputClass} value={node.library} onChange={(e) => onChange({ library: e.target.value as LibraryType })}>
                 <option value="plain">Tailwind (Default)</option>
                 <option value="radix">Radix UI (Base)</option>
                 <option value="shadcn">Shadcn UI</option>
               </select>
             </div>

             {(node.type === 'text' || node.type === 'button' || node.type === 'input') && (
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1.5">Content / Label</label>
                 <input type="text" className={inputClass} value={node.content || ''} onChange={(e) => onChange({ content: e.target.value })} />
               </div>
             )}

             {node.type === 'icon' && (
                 <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-2">
                         <Star size={12} /> Icon Name
                     </label>
                     <input 
                        type="text" 
                        className={inputClass} 
                        value={node.iconName || ''} 
                        onChange={(e) => onChange({ iconName: e.target.value })} 
                        placeholder="Home, User, Settings..."
                    />
                     <p className="text-[10px] text-gray-400 mt-1">Use Lucide icon names (e.g. Home, User, Bell)</p>
                 </div>
             )}
           </div>
        </section>

        {/* Layout Settings */}
        <section>
            <h3 className={sectionHeaderClass}>
               <Layout size={14} /> Layout
           </h3>
           <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Width</label>
                        <input type="text" className={inputClass} placeholder="auto" value={node.style.width || ''} onChange={(e) => onStyleChange({ width: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Height</label>
                        <input type="text" className={inputClass} placeholder="auto" value={node.style.height || ''} onChange={(e) => onStyleChange({ height: e.target.value })} />
                    </div>
                </div>
                
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Flex Direction</label>
                   <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                       <button onClick={() => onStyleChange({ flexDirection: 'row' })} className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${node.style.flexDirection === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Row</button>
                       <button onClick={() => onStyleChange({ flexDirection: 'column' })} className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${node.style.flexDirection === 'column' || !node.style.flexDirection ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Col</button>
                   </div>
                </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Padding</label>
                        <input type="text" className={inputClass} placeholder="0px" value={node.style.padding || ''} onChange={(e) => onStyleChange({ padding: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Gap</label>
                        <input type="text" className={inputClass} placeholder="0px" value={node.style.gap || ''} onChange={(e) => onStyleChange({ gap: e.target.value })} />
                    </div>
                </div>

                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Justify Content</label>
                    <select className={inputClass} value={node.style.justifyContent || 'flex-start'} onChange={(e) => onStyleChange({ justifyContent: e.target.value })}>
                        <option value="flex-start">Start</option>
                        <option value="center">Center</option>
                        <option value="flex-end">End</option>
                        <option value="space-between">Space Between</option>
                    </select>
                 </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Align Items</label>
                    <select className={inputClass} value={node.style.alignItems || 'stretch'} onChange={(e) => onStyleChange({ alignItems: e.target.value })}>
                        <option value="stretch">Stretch</option>
                        <option value="flex-start">Start</option>
                        <option value="center">Center</option>
                        <option value="flex-end">End</option>
                    </select>
                 </div>
           </div>
        </section>

        {/* Visuals */}
        <section>
            <h3 className={sectionHeaderClass}>
               <Palette size={14} /> Appearance
           </h3>
           <div className="space-y-4">
               <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Background</label>
                   <div className="flex gap-2">
                       <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                            <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0" value={node.style.backgroundColor || '#ffffff'} onChange={(e) => onStyleChange({ backgroundColor: e.target.value })} />
                       </div>
                       <input type="text" className={inputClass} value={node.style.backgroundColor || ''} onChange={(e) => onStyleChange({ backgroundColor: e.target.value })} placeholder="#ffffff" />
                   </div>
               </div>
               <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Text Color</label>
                   <div className="flex gap-2">
                       <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                           <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" value={node.style.color || '#000000'} onChange={(e) => onStyleChange({ color: e.target.value })} />
                       </div>
                        <input type="text" className={inputClass} value={node.style.color || ''} onChange={(e) => onStyleChange({ color: e.target.value })} placeholder="#000000" />
                   </div>
               </div>
                <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="shadow" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={!!node.style.boxShadow} onChange={(e) => onStyleChange({ boxShadow: e.target.checked ? 'shadow-md' : '' })} />
                    <label htmlFor="shadow" className="text-sm text-gray-700 select-none cursor-pointer">Enable Shadow</label>
                </div>
           </div>
        </section>

        {/* Border Settings */}
        <section>
            <h3 className={sectionHeaderClass}>
               <Square size={14} /> Border
           </h3>
           <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                   <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Radius</label>
                        <input type="text" className={inputClass} placeholder="4px" value={node.style.borderRadius || ''} onChange={(e) => onStyleChange({ borderRadius: e.target.value })} />
                   </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Width</label>
                        <input type="text" className={inputClass} placeholder="1px" value={node.style.borderWidth || ''} onChange={(e) => onStyleChange({ borderWidth: e.target.value })} />
                   </div>
               </div>
               <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Border Color</label>
                   <div className="flex gap-2">
                       <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                            <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0" value={node.style.borderColor || '#e5e7eb'} onChange={(e) => onStyleChange({ borderColor: e.target.value })} />
                       </div>
                       <input type="text" className={inputClass} value={node.style.borderColor || ''} onChange={(e) => onStyleChange({ borderColor: e.target.value })} placeholder="#e5e7eb" />
                   </div>
               </div>
               <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Style</label>
                   <select className={inputClass} value={node.style.borderStyle || 'none'} onChange={(e) => onStyleChange({ borderStyle: e.target.value })}>
                       <option value="none">None</option>
                       <option value="solid">Solid</option>
                       <option value="dashed">Dashed</option>
                       <option value="dotted">Dotted</option>
                   </select>
               </div>
           </div>
        </section>

      </div>
    </div>
  );
}