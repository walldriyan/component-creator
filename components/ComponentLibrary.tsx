import React from 'react';
import { Box, Type, MousePointer2, CreditCard, Layout, Image as ImageIcon, Star, PanelLeft, GripHorizontal } from 'lucide-react';
import { ComponentType } from '../types';

const DraggableItem = ({ type, label, icon: Icon, onDragStart }: { type: string, label: string, icon: any, onDragStart: (e: React.DragEvent, type: string) => void }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      className="flex items-center gap-3 p-3 mb-2 bg-white border border-gray-200 rounded-lg cursor-move hover:border-blue-500 hover:shadow-sm transition-all"
    >
      <Icon size={18} className="text-gray-600" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
};

export default function ComponentLibrary() {
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('componentType', type);
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Layout size={20} />
          Components
        </h2>
        <p className="text-xs text-gray-500 mt-1">Drag items to the canvas</p>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1">
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Layout</h3>
          <DraggableItem type="container" label="Container" icon={Box} onDragStart={handleDragStart} />
          <DraggableItem type="card" label="Card" icon={CreditCard} onDragStart={handleDragStart} />
        </div>
        
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Elements</h3>
          <DraggableItem type="text" label="Text Block" icon={Type} onDragStart={handleDragStart} />
          <DraggableItem type="button" label="Button" icon={MousePointer2} onDragStart={handleDragStart} />
          <DraggableItem type="input" label="Input Field" icon={Layout} onDragStart={handleDragStart} />
          <DraggableItem type="image" label="Image" icon={ImageIcon} onDragStart={handleDragStart} />
          <DraggableItem type="icon" label="Icon" icon={Star} onDragStart={handleDragStart} />
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Presets (Templates)</h3>
          <DraggableItem type="sidebar" label="Sidebar" icon={PanelLeft} onDragStart={handleDragStart} />
          <DraggableItem type="navbar" label="Navbar" icon={GripHorizontal} onDragStart={handleDragStart} />
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 border-t border-blue-100">
        <p className="text-xs text-blue-700 text-center">
          Supports <strong>Radix UI</strong> & <strong>Shadcn</strong> styles
        </p>
      </div>
    </div>
  );
}