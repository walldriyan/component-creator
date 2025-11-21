
import React from 'react';
import { Box, Type, MousePointer2, CreditCard, Layout, Image as ImageIcon, Star, PanelLeft, GripHorizontal, SplitSquareHorizontal, ToggleLeft, CheckSquare, TextCursorInput, ChevronDown, CaseSensitive, Table, FileText, Users, ThumbsUp, List, AppWindow, MoreVertical, FoldVertical, Columns, Rows } from 'lucide-react';
import { FrameworkType } from '../types';

const DraggableItem = ({ type, label, icon: Icon, onDragStart }: { type: string, label: string, icon: any, onDragStart: (e: React.DragEvent, type: string) => void }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      className="flex items-center gap-3 p-3 mb-2 bg-white border border-gray-200 rounded-lg cursor-move hover:border-blue-500 hover:shadow-sm transition-all group"
    >
      <Icon size={18} className="text-gray-500 group-hover:text-blue-600" />
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </div>
  );
};

export default function ComponentLibrary({ framework }: { framework: FrameworkType }) {
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('componentType', type);
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col select-none">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Layout size={20} />
          {framework === 'flutter' ? 'Widgets' : 'Components'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">Drag items to the canvas</p>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Layout</h3>
          <DraggableItem type="container" label={framework === 'flutter' ? 'Container' : 'Container'} icon={Box} onDragStart={handleDragStart} />
          {framework === 'flutter' && (
            <>
               <DraggableItem type="container" label="Row (Flex)" icon={Columns} onDragStart={handleDragStart} />
               <DraggableItem type="container" label="Column (Flex)" icon={Rows} onDragStart={handleDragStart} />
            </>
          )}
          <DraggableItem type="card" label="Card" icon={CreditCard} onDragStart={handleDragStart} />
          <DraggableItem type="divider" label="Divider" icon={SplitSquareHorizontal} onDragStart={handleDragStart} />
          <DraggableItem type="tabs" label="Tabs" icon={AppWindow} onDragStart={handleDragStart} />
          <DraggableItem type="accordion" label="Accordion" icon={FoldVertical} onDragStart={handleDragStart} />
        </div>
        
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Basic</h3>
          <DraggableItem type="text" label="Text" icon={Type} onDragStart={handleDragStart} />
          <DraggableItem type="button" label={framework === 'flutter' ? 'ElevatedButton' : 'Button'} icon={MousePointer2} onDragStart={handleDragStart} />
          <DraggableItem type="image" label="Image" icon={ImageIcon} onDragStart={handleDragStart} />
          <DraggableItem type="icon" label="Icon" icon={Star} onDragStart={handleDragStart} />
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Inputs</h3>
          <DraggableItem type="input" label={framework === 'flutter' ? 'TextField' : 'Input'} icon={TextCursorInput} onDragStart={handleDragStart} />
          <DraggableItem type="textarea" label="Textarea" icon={CaseSensitive} onDragStart={handleDragStart} />
          <DraggableItem type="select" label="Dropdown" icon={ChevronDown} onDragStart={handleDragStart} />
          <DraggableItem type="checkbox" label="Checkbox" icon={CheckSquare} onDragStart={handleDragStart} />
          <DraggableItem type="switch" label="Switch" icon={ToggleLeft} onDragStart={handleDragStart} />
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Advanced</h3>
          <DraggableItem type="list" label={framework === 'flutter' ? 'ListView' : 'Dynamic List'} icon={List} onDragStart={handleDragStart} />
          <DraggableItem type="avatarGroup" label="Avatar Group" icon={Users} onDragStart={handleDragStart} />
          
          {/* Enabled for both frameworks now */}
          <DraggableItem type="table" label={framework === 'flutter' ? 'DataTable' : 'Smart Table'} icon={Table} onDragStart={handleDragStart} />
          <DraggableItem type="form" label="Smart Form" icon={FileText} onDragStart={handleDragStart} />
          <DraggableItem type="dropdown" label="Menu Dropdown" icon={MoreVertical} onDragStart={handleDragStart} />

          {framework === 'nextjs' && (
             <>
                 {/* Next.js specific if any, currently all are shared or mapped */}
             </>
          )}
          <DraggableItem type="interaction" label="Social Interaction" icon={ThumbsUp} onDragStart={handleDragStart} />
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Presets</h3>
          <DraggableItem type="sidebar" label="Sidebar" icon={PanelLeft} onDragStart={handleDragStart} />
          <DraggableItem type="navbar" label="Navbar" icon={GripHorizontal} onDragStart={handleDragStart} />
        </div>
      </div>
    </div>
  );
}
