import React, { MouseEvent, useRef, useState } from 'react';
import { ComponentNode } from '../types';
import { Trash2, Home, User, Settings, Bell, Search, Menu, Star, Heart, Share, ArrowRight, Box, Check, X, Layout, Maximize2, Minimize2, Link as LinkIcon, Image as ImageIcon, GripHorizontal, Square, Scaling } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Icon mapping for dynamic rendering
const IconMap: Record<string, any> = {
  Home, User, Settings, Bell, Search, Menu, Star, Heart, Share, ArrowRight, Box, Check, X, Layout
};

interface CanvasProps {
  node: ComponentNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrop: (e: React.DragEvent, targetId: string, index?: number) => void; // Updated to accept index
  onDelete: (id: string) => void;
  onResize: (id: string, style: any) => void;
  onUpdate?: (id: string, updates: Partial<ComponentNode> | any) => void;
  index?: number; // Pass current index from parent
  parentId?: string | null;
}

const getComponentClasses = (node: ComponentNode, isSelected: boolean) => {
  const { style, library, type } = node;
  const base = "relative transition-all duration-200 ease-in-out"; 
  const selection = isSelected ? "ring-2 ring-blue-500 ring-offset-2 z-10" : "hover:ring-1 hover:ring-blue-300 ring-offset-1";
  
  // Simulate Library Styles
  let libStyles = "";
  if (library === 'shadcn') {
    // Shadcn Button Base Styles
    if (type === 'button') {
        const variant = node.props.variant || 'default';
        if (variant === 'default') libStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-900/90 h-10 px-4 py-2";
        else if (variant === 'secondary') libStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none bg-slate-100 text-slate-900 hover:bg-slate-100/80 h-10 px-4 py-2";
        else if (variant === 'ghost') libStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2";
        else if (variant === 'outline') libStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2";
    } 
    if (type === 'card') libStyles = "rounded-lg border bg-white text-slate-950 shadow-sm";
    if (type === 'input') libStyles = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  } else if (library === 'radix') {
     if (type === 'button') libStyles = "bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm";
  } else {
     if (type === 'button') libStyles = "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm";
     if (type === 'card') libStyles = "bg-white border border-gray-200 rounded shadow-sm";
     if (type === 'input') libStyles = "border border-gray-300 rounded p-2 w-full";
  }

  // Tailwind Utility Class Construction
  const dynamicStyles = [
    style.backgroundColor ? `bg-[${style.backgroundColor}]` : '',
    style.color ? `text-[${style.color}]` : '',
    style.padding ? `p-[${style.padding}]` : '',
    style.margin ? `m-[${style.margin}]` : '',
    style.marginBottom ? `mb-[${style.marginBottom}]` : '',
    style.borderRadius ? `rounded-[${style.borderRadius}]` : '',
    (style.borderWidth && style.borderWidth !== '0px') ? `border-[${style.borderWidth}]` : '',
    style.borderColor ? `border-[${style.borderColor}]` : '',
    (style.borderStyle && style.borderStyle !== 'none') ? `border-${style.borderStyle}` : '',
    style.width === '100%' ? 'w-full' : style.width === 'auto' ? 'w-auto' : style.width ? `w-[${style.width}]` : '',
    style.height === '100%' ? 'h-full' : style.height === 'auto' ? 'h-auto' : style.height ? `h-[${style.height}]` : '',
    style.minHeight ? `min-h-[${style.minHeight}]` : '',
    
    // Flex and Gap Logic
    (style.flexDirection || style.gap || style.justifyContent || style.alignItems) ? 'flex' : '',
    style.flexDirection === 'row' ? 'flex-row' : style.flexDirection === 'column' ? 'flex-col' : '',
    style.flexGrow === 1 ? 'grow' : style.flexGrow === 0 ? 'grow-0' : '',
    
    style.gap ? `gap-[${style.gap}]` : '',
    style.justifyContent ? `justify-${style.justifyContent.replace('flex-', '').replace('space-', '')}` : '',
    style.alignItems ? `items-${style.alignItems.replace('flex-', '')}` : '',
    style.boxShadow ? 'shadow-md' : '',
    style.fontSize ? `text-[${style.fontSize}]` : '',
    style.fontWeight ? `font-[${style.fontWeight}]` : '',
  ].filter(Boolean).join(' ');

  return cn(base, selection, libStyles, dynamicStyles);
};

const CanvasRenderer: React.FC<CanvasProps> = ({ node, selectedId, onSelect, onDrop, onDelete, onResize, onUpdate, index = 0, parentId = null }) => {
  const isSelected = selectedId === node.id;
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Drag Over State: 'top' | 'bottom' | 'inside' | null
  const [dragPosition, setDragPosition] = useState<'top' | 'bottom' | 'inside' | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.setData('nodeId', node.id);
      e.dataTransfer.effectAllowed = "move";

      const dragIcon = document.createElement('div');
      dragIcon.innerHTML = `
        <div style="background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif; font-size: 12px;">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
           Moving ${node.name}
        </div>
      `;
      dragIcon.style.position = 'absolute';
      dragIcon.style.top = '-1000px';
      document.body.appendChild(dragIcon);
      e.dataTransfer.setDragImage(dragIcon, 0, 0);
      setTimeout(() => document.body.removeChild(dragIcon), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const clientY = e.clientY;
    const clientX = e.clientX;
    
    // Check if node is a container that accepts children "inside"
    const isContainer = node.type === 'container' || node.type === 'card' || (node.type === 'button' && node.children.length > 0);
    
    // Logic to decide if we drop Inside, Above or Below
    // If we are strictly hovering the edges, we might drop inside if it's empty
    
    // Simple vertical sort logic
    const height = rect.height;
    const relativeY = clientY - rect.top;
    
    // If it's a container and we are in the middle zone, drop inside (append)
    if (isContainer && relativeY > 10 && relativeY < height - 10) {
        // But wait, if it has children, the children's dragOver will capture it. 
        // So this only triggers if we are in the container's padding area.
        setDragPosition('inside');
        return;
    }

    // Otherwise, decide Top or Bottom relative to THIS element in the parent's list
    if (relativeY < height / 2) {
        setDragPosition('top');
    } else {
        setDragPosition('bottom');
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId === node.id) {
        setDragPosition(null);
        return;
    }

    if (dragPosition === 'inside') {
        // Drop inside this node (append to end)
        onDrop(e, node.id); 
    } else if (dragPosition === 'top') {
        // Drop into PARENT, at this node's index
        if (parentId) {
             onDrop(e, parentId, index);
        }
    } else if (dragPosition === 'bottom') {
        // Drop into PARENT, at this node's index + 1
        if (parentId) {
             onDrop(e, parentId, index + 1);
        }
    }
    
    setDragPosition(null);
  };

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };
  
  const handleDelete = (e: MouseEvent) => {
      e.stopPropagation();
      onDelete(node.id);
  }

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startRect = elementRef.current?.getBoundingClientRect();
    if (!startRect) return;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const newStyle: any = {};
        if (direction.includes('e')) newStyle.width = `${Math.max(20, startRect.width + deltaX)}px`;
        if (direction.includes('s')) newStyle.height = `${Math.max(20, startRect.height + deltaY)}px`;
        onResize(node.id, newStyle);
    };
    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // --- Popup Toolbar Handlers ---
  const toggleWidth = (e: MouseEvent) => { e.stopPropagation(); if(onUpdate) onUpdate(node.id, { style: { ...node.style, width: node.style.width === '100%' ? 'auto' : '100%' }}); }
  const toggleHeight = (e: MouseEvent) => { e.stopPropagation(); if(onUpdate) onUpdate(node.id, { style: { ...node.style, height: node.style.height === '100%' ? 'auto' : '100%' }}); }
  const toggleGrow = (e: MouseEvent) => { e.stopPropagation(); if(onUpdate) onUpdate(node.id, { style: { ...node.style, flexGrow: node.style.flexGrow === 1 ? 0 : 1 }}); }
  const toggleBorder = (e: MouseEvent) => { e.stopPropagation(); if(onUpdate) onUpdate(node.id, { style: { ...node.style, borderWidth: (node.style.borderWidth && node.style.borderWidth !== '0px') ? '0px' : '1px' }}); }
  const addLink = (e: MouseEvent) => { e.stopPropagation(); const url = prompt("Enter URL:", node.href || ""); if (url !== null && onUpdate) onUpdate(node.id, { href: url }); }
  const changeImage = (e: MouseEvent) => { e.stopPropagation(); const url = prompt("Enter Image URL:", node.content || ""); if (url !== null && onUpdate) onUpdate(node.id, { content: url }); }

  const classes = getComponentClasses(node, isSelected);

  // Popup Menu Component
  const renderPopupMenu = () => {
      if (!isSelected || node.id === 'root') return null;
      
      return (
          <div className="absolute left-0 -top-12 h-10 bg-slate-800 text-white rounded-md shadow-xl flex items-center px-2 gap-1 z-[100] animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-1 pr-2 border-r border-slate-600">
                <button onClick={toggleWidth} title="Toggle Width" className={cn("p-1.5 rounded hover:bg-slate-700", node.style.width === '100%' && "bg-blue-600")}><Maximize2 size={14} className="rotate-90" /></button>
                <button onClick={toggleHeight} title="Toggle Height" className={cn("p-1.5 rounded hover:bg-slate-700", node.style.height === '100%' && "bg-blue-600")}><Maximize2 size={14} /></button>
                <button onClick={toggleGrow} title="Toggle Flex Grow" className={cn("p-1.5 rounded hover:bg-slate-700", node.style.flexGrow === 1 && "bg-blue-600")}><Scaling size={14} /></button>
              </div>
              <div className="flex items-center gap-1 px-1">
                 <button onClick={toggleBorder} title="Toggle Border" className={cn("p-1.5 rounded hover:bg-slate-700", node.style.borderWidth === '1px' && "bg-blue-600")}><Square size={14} /></button>
                 <button onClick={addLink} title="Link" className={cn("p-1.5 rounded hover:bg-slate-700", node.href && "text-green-400")}><LinkIcon size={14} /></button>
                 {node.type === 'image' && <button onClick={changeImage} className="p-1.5 rounded hover:bg-slate-700"><ImageIcon size={14} /></button>}
              </div>
               <div className="flex items-center pl-2 border-l border-slate-600 ml-1">
                  <button onClick={handleDelete} className="p-1.5 rounded hover:bg-red-600 text-red-400 hover:text-white"><Trash2 size={14} /></button>
               </div>
          </div>
      );
  };

  const renderHandles = () => {
      if (!isSelected || node.id === 'root') return null;
      return (
          <>
             <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-4 bg-blue-500 cursor-e-resize rounded z-50 opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeStart(e, 'e')} />
             <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-4 h-2 bg-blue-500 cursor-s-resize rounded z-50 opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeStart(e, 's')} />
             <div className="absolute bottom-[-5px] right-[-5px] w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize rounded-full z-50" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          </>
      );
  };

  // Render Drop Indicators (Blue Lines)
  const renderDropIndicator = () => {
      if (!dragPosition) return null;
      
      if (dragPosition === 'inside') {
          return <div className="absolute inset-0 border-2 border-blue-500 bg-blue-50/20 rounded-lg pointer-events-none z-50 animate-pulse" />
      }
      if (dragPosition === 'top') {
          return <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded pointer-events-none z-50 shadow-sm" />
      }
      if (dragPosition === 'bottom') {
          return <div className="absolute -bottom-1 left-0 right-0 h-1 bg-blue-500 rounded pointer-events-none z-50 shadow-sm" />
      }
      return null;
  }

  const structuralStyles = { 
      width: node.style.width, height: node.style.height,
      borderWidth: node.style.borderWidth, borderColor: node.style.borderColor, borderStyle: node.style.borderStyle as any,
      borderRight: node.style.borderRight, borderBottom: node.style.borderBottom, marginBottom: node.style.marginBottom,
      gap: node.style.gap, display: (node.style.flexDirection || node.style.gap || node.type === 'container' || node.type === 'button') ? 'flex' : undefined,
      flexDirection: node.style.flexDirection as any, justifyContent: node.style.justifyContent, alignItems: node.style.alignItems,
      flexGrow: node.style.flexGrow, padding: node.style.padding 
  };

  const renderContent = () => {
    if (node.type === 'text') return node.content || 'Text';
    if (node.type === 'button') {
        if (node.children && node.children.length > 0) {
            return node.children.map((child, idx) => (
                <CanvasRenderer key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} onDrop={onDrop} onDelete={onDelete} onResize={onResize} onUpdate={onUpdate} index={idx} parentId={node.id} />
            ));
        }
        return node.content || 'Button';
    }
    if (node.type === 'input') return null; 
    if (node.type === 'image') return <img src={node.content || "https://picsum.photos/200/200"} className="w-full h-full object-cover rounded" alt="placeholder" draggable={false}/>
    if (node.type === 'icon') {
        const IconComponent = IconMap[node.iconName || 'Box'] || Box;
        return <IconComponent size={20} />;
    }
    
    return node.children.map((child, idx) => (
      <CanvasRenderer key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} onDrop={onDrop} onDelete={onDelete} onResize={onResize} onUpdate={onUpdate} index={idx} parentId={node.id} />
    ));
  };

  const emptyHelper = (node.type === 'container' && node.children.length === 0 && !node.style.minHeight)
    ? { minHeight: '80px', borderStyle: 'dashed', borderWidth: '2px', borderColor: '#e5e7eb' }
    : {};
  
  const linkIndicator = node.href ? ( <div className="absolute top-1 right-1 bg-green-500 text-white p-0.5 rounded-full z-20 pointer-events-none"><LinkIcon size={8} /></div> ) : null;

  // Wrapper for non-container elements (Leaf nodes) to handle DragOver logic correctly
  if (node.type === 'input' || node.type === 'icon') {
      return (
        <div ref={elementRef} className="relative group inline-block" onClick={handleClick} draggable onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={structuralStyles} >
             {node.type === 'input' ? <input type="text" placeholder={node.content || "Input..."} className={classes} readOnly /> : <div className={classes}>{renderContent()}</div>}
            {linkIndicator}
            {renderHandles()}
            {renderPopupMenu()} 
            {renderDropIndicator()}
        </div>
      )
  }

  return (
    <div
      ref={elementRef}
      className={cn(classes, "group")}
      onClick={handleClick}
      draggable={node.id !== 'root'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ ...structuralStyles, ...emptyHelper }}
    >
      {linkIndicator}
      {renderHandles()}
      {renderPopupMenu()}
      {renderDropIndicator()}
      {node.id === 'root' && <div className="absolute top-0 left-0 bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-br uppercase font-bold tracking-wider opacity-50 pointer-events-none">Canvas</div>}
      {renderContent()}
    </div>
  );
}

export default CanvasRenderer;