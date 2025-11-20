
import React, { MouseEvent, useRef, useState, useLayoutEffect, useEffect, useMemo } from 'react';
import { ComponentNode } from '../types';
import { Settings, Home, User, Bell, Search, Menu, Star, Heart, Share, ArrowRight, Box, Check, X, Layout, Maximize2, Scaling, Copy, CreditCard, Link as LinkIcon, Image as ImageIcon, Square, Minimize2, MoveHorizontal, MoveVertical, ChevronDown, ArrowUp, ArrowDown, AlignCenter, AlignLeft, ArrowRightFromLine, ArrowDownFromLine, Trash2, Minimize, Maximize, ChevronLeft, ChevronRight, Edit, Eye, MoreHorizontal, Plus, Download, Upload, FileText } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Expanded Icon Map for more options
const IconMap: Record<string, any> = {
  Home, User, Settings, Bell, Search, Menu, Star, Heart, Share, ArrowRight, Box, Check, X, Layout,
  Edit, Eye, Trash2, MoreHorizontal, Plus, Download, Upload, ChevronRight, ChevronLeft, FileText
};

interface CanvasProps {
  node: ComponentNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrop: (e: React.DragEvent, targetId: string, index?: number) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string, direction: 'before' | 'after') => void;
  onWrap?: (id: string, type: 'container' | 'card') => void;
  onResize: (id: string, style: any) => void;
  onUpdate?: (id: string, updates: Partial<ComponentNode> | any) => void;
  index?: number;
  parentId?: string | null;
}

const getComponentClasses = (node: ComponentNode, isSelected: boolean) => {
  const { style, library, type } = node;
  const base = "transition-all duration-200 ease-in-out group"; 
  const selection = isSelected ? "z-[100] ring-2 ring-blue-500 ring-offset-2" : "hover:ring-1 hover:ring-blue-300 ring-offset-1";
  
  let libStyles = "";
  // Shadcn Styling
  if (library === 'shadcn') {
    if (type === 'button') {
        const variant = node.props.variant || 'default';
        if (variant === 'default') libStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-900/90 h-10 px-4 py-2";
        else if (variant === 'secondary') libStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none bg-slate-100 text-slate-900 hover:bg-slate-100/80 h-10 px-4 py-2";
        else if (variant === 'ghost') libStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2";
        else if (variant === 'outline') libStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2";
    } 
    if (type === 'card') libStyles = "rounded-lg border text-slate-950 shadow-sm";
    if (type === 'input') libStyles = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    if (type === 'textarea') libStyles = "flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    if (type === 'select') libStyles = "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1";
    if (type === 'divider') libStyles = "shrink-0 bg-slate-200";
  } 

  // Radix / Plain Styling (Basic Defaults so they aren't invisible)
  if (library === 'radix' || library === 'plain') {
     if (type === 'button') libStyles = "inline-flex items-center justify-center rounded px-4 py-2 font-medium focus:outline-none focus-visible:ring";
     if (type === 'input') libStyles = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border";
  }

  const dynamicStyles = [
    // Positioning
    style.position ? style.position : 'relative',
    style.top ? `top-[${style.top}]` : '',
    style.left ? `left-[${style.left}]` : '',
    style.right ? `right-[${style.right}]` : '',
    style.bottom ? `bottom-[${style.bottom}]` : '',
    style.zIndex ? `z-[${style.zIndex}]` : '',

    style.backgroundColor ? `bg-[${style.backgroundColor}]` : '',
    style.color ? `text-[${style.color}]` : '',
    style.padding ? `p-[${style.padding}]` : '',
    style.margin ? `m-[${style.margin}]` : '',
    style.marginBottom ? `mb-[${style.marginBottom}]` : '',
    style.borderRadius ? `rounded-[${style.borderRadius}]` : '',
    (style.borderWidth && style.borderWidth !== '0px') ? `border-[${style.borderWidth}]` : '',
    style.borderColor ? `border-[${style.borderColor}]` : '',
    (style.borderStyle && style.borderStyle !== 'none') ? `border-${style.borderStyle}` : '',
    
    // 4 Side Borders
    style.borderTop ? `border-t-[${style.borderTop}]` : '',
    style.borderBottom ? `border-b-[${style.borderBottom}]` : '',
    style.borderLeft ? `border-l-[${style.borderLeft}]` : '',
    style.borderRight ? `border-r-[${style.borderRight}]` : '',

    style.width === '100%' ? 'w-full' : style.width === 'auto' ? 'w-auto' : '',
    style.height === '100%' ? 'h-full' : style.height === 'auto' ? 'h-auto min-h-[20px]' : '',
    (!style.height || style.height === 'auto' || style.height === '100%') && style.minHeight ? `min-h-[${style.minHeight}]` : '',
    
    style.maxWidth ? `max-w-[${style.maxWidth}]` : '',
    style.minWidth ? `min-w-[${style.minWidth}]` : '',
    style.overflow ? `overflow-${style.overflow}` : '',

    (style.flexDirection || style.gap || style.justifyContent || style.alignItems) ? 'flex' : '',
    style.flexDirection === 'row' ? 'flex-row' : style.flexDirection === 'column' ? 'flex-col' : '',
    style.flexGrow === 1 ? 'grow' : style.flexGrow === 0 ? 'grow-0' : '',
    
    style.gap ? `gap-[${style.gap}]` : '',
    style.justifyContent ? `justify-${style.justifyContent.replace('flex-', '').replace('space-', '')}` : '',
    style.alignItems ? `items-${style.alignItems.replace('flex-', '')}` : '',
    style.boxShadow ? 'shadow-md' : '',
    style.fontSize ? `text-[${style.fontSize}]` : '',
    style.fontWeight ? `font-[${style.fontWeight}]` : '',
    style.cursor ? `cursor-${style.cursor}` : '',
    
    (style.cursor === 'pointer' && type === 'container') ? 'hover:bg-slate-100 hover:text-slate-900' : ''
  ].filter(Boolean).join(' ');

  return cn(base, selection, libStyles, dynamicStyles);
};

const MenuBtn = ({ onClick, icon: Icon, title, variant = 'default' }: { onClick: (e: React.MouseEvent) => void, icon: any, title: string, variant?: 'default' | 'danger' }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(e); }} 
        title={title} 
        className={cn(
            "p-1.5 rounded transition-colors flex items-center justify-center",
            variant === 'danger' ? "hover:bg-red-600 text-slate-300 hover:text-white" : "hover:bg-slate-700 text-slate-300 hover:text-white"
        )}
    >
        <Icon size={14} />
    </button>
);

const MenuDivider = () => <div className="w-[1px] h-4 bg-slate-600 mx-1 opacity-50"></div>;

// --- Internal Table Logic ---
const TableRenderer = ({ node }: { node: ComponentNode }) => {
    const data = Array.isArray(node.props.data) ? node.props.data : [];
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const actionLabel = node.props.actionLabel;
    const customColumns = node.props.customColumns || [];

    // Reset pagination if data changes
    useEffect(() => setCurrentPage(1), [data.length]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter(item => 
            Object.values(item).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [data, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleActionClick = (funcName: string, row: any) => {
        alert(`Action Triggered!\n\nFunction: ${funcName}\nData: ${JSON.stringify(row, null, 2)}`);
    };

    if (data.length === 0) return <div className="p-4 text-center text-gray-400">No data found in props.data</div>;
    
    const headers = Object.keys(data[0]);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Search Bar */}
            <div className="p-3 border-b border-gray-200 bg-white flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="text-sm outline-none w-full text-gray-700 placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
            </div>
            
            {/* Table Content */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            {headers.map(h => (
                                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                            ))}
                            {/* Legacy Action Column */}
                            {actionLabel && <th className="px-4 py-3 font-semibold text-right">Action</th>}
                            
                            {/* Dynamic Custom Columns */}
                            {customColumns.map((col: any) => (
                                <th key={col.id} className="px-4 py-3 font-semibold text-center">{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? paginatedData.map((row, i) => (
                            <tr key={i} className="border-b last:border-0 even:bg-slate-50 hover:bg-blue-50 transition-colors cursor-default">
                                {headers.map(h => (
                                    <td key={h} className="px-4 py-3 text-gray-600">{String((row as any)[h])}</td>
                                ))}
                                
                                {/* Legacy Action Button */}
                                {actionLabel && (
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleActionClick(node.props.actionFunction || 'handleAction', row); }}
                                            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 rounded hover:bg-slate-700 transition-colors"
                                        >
                                            {actionLabel}
                                        </button>
                                    </td>
                                )}

                                {/* Dynamic Custom Columns Logic */}
                                {customColumns.map((col: any) => (
                                    <td key={col.id} className="px-4 py-3 text-center">
                                        {col.type === 'button' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleActionClick(col.actionFunction, row); }}
                                                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                            >
                                                {col.content || 'Action'}
                                            </button>
                                        )}
                                        {col.type === 'icon' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleActionClick(col.actionFunction, row); }}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                title={col.content || 'Action'}
                                            >
                                                {React.createElement(IconMap[col.content] || Star, { size: 16 })}
                                            </button>
                                        )}
                                        {col.type === 'image' && (
                                            <div className="flex justify-center">
                                                <img src={col.content || "https://picsum.photos/30"} alt="img" className="w-8 h-8 rounded object-cover border border-gray-200" />
                                            </div>
                                        )}
                                        {col.type === 'text' && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                {col.content || 'Label'}
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={headers.length + (actionLabel ? 1 : 0) + customColumns.length} className="text-center py-4 text-gray-500">No matching records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-500">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-1">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Form Renderer ---
const FormRenderer = ({ node }: { node: ComponentNode }) => {
    const fields = node.props.fields || [];
    const mode = node.props.mode || 'api';

    return (
        <div className="w-full flex flex-col gap-4 pointer-events-none">
             <div className="text-xs text-blue-600 font-mono mb-2 bg-blue-50 p-2 rounded border border-blue-100 inline-block w-fit">
                Mode: {mode === 'serverAction' ? 'Server Action' : 'API Route'} 
                <span className="ml-2 text-gray-400">|</span> 
                <span className="ml-2">Dest: {node.props.endpoint}</span>
             </div>

            {fields.map((f: any) => (
                <div key={f.id} className="flex flex-col gap-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {f.type === 'textarea' ? (
                        <textarea placeholder={f.placeholder} className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none" />
                    ) : f.type === 'select' ? (
                        <div className="relative">
                            <div className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                                {f.placeholder || 'Select...'} <ChevronDown size={16} />
                            </div>
                        </div>
                    ) : f.type === 'checkbox' || f.type === 'switch' ? (
                        <div className="flex items-center gap-2">
                             <div className={`h-4 w-4 rounded border border-slate-900 flex items-center justify-center ${f.type === 'switch' ? 'rounded-full w-8 h-4 border-0 bg-slate-200' : ''}`}></div>
                             <span className="text-xs text-gray-500">{f.placeholder || 'Enable'}</span>
                        </div>
                    ) : f.type === 'radio' ? (
                        <div className="flex gap-4">
                            {(f.options || ['Option 1', 'Option 2']).map((opt: string, i: number) => (
                                <div key={i} className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full border border-slate-400"></div>
                                    <span className="text-sm text-slate-600">{opt}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <input type={f.type} placeholder={f.placeholder} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50" />
                    )}
                </div>
            ))}

            <div className="flex items-center gap-3 mt-4 pt-2 border-t border-gray-100">
                <button className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium">{node.props.submitLabel || 'Submit'}</button>
                <button className="bg-white border border-slate-200 text-slate-900 px-4 py-2 rounded-md text-sm font-medium">{node.props.clearLabel || 'Clear'}</button>
                <button className="text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 ml-auto">{node.props.cancelLabel || 'Cancel'}</button>
            </div>
        </div>
    );
};

const CanvasRenderer: React.FC<CanvasProps> = React.memo(({ node, selectedId, onSelect, onDrop, onDelete, onResize, onUpdate, onDuplicate, onWrap, index = 0, parentId = null }) => {
  const isSelected = selectedId === node.id;
  const elementRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number, height: number} | null>(null);
  const [resizeFeedback, setResizeFeedback] = useState<{w: number, h: number} | null>(null);
  const [dragPosition, setDragPosition] = useState<'top' | 'bottom' | 'inside' | null>(null);

  useEffect(() => {
    const clearDragState = () => setDragPosition(null);
    window.addEventListener('dragend', clearDragState);
    window.addEventListener('drop', clearDragState);
    window.addEventListener('mouseup', clearDragState);
    return () => {
      window.removeEventListener('dragend', clearDragState);
      window.removeEventListener('drop', clearDragState);
      window.removeEventListener('mouseup', clearDragState);
    };
  }, []);

  useLayoutEffect(() => {
      if (isSelected && elementRef.current) {
          const updatePosition = () => {
              if (elementRef.current) {
                  const rect = elementRef.current.getBoundingClientRect();
                  setMenuPosition({ top: rect.top, left: rect.left, height: rect.height });
              }
          };
          updatePosition();
          window.addEventListener('scroll', updatePosition, true);
          window.addEventListener('resize', updatePosition);
          return () => {
              window.removeEventListener('scroll', updatePosition, true);
              window.removeEventListener('resize', updatePosition);
          };
      } else {
          setMenuPosition(null);
      }
  }, [isSelected, node.style, resizeFeedback]);

  const handleDragStart = (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.setData('nodeId', node.id);
      e.dataTransfer.effectAllowed = "move";
      const dragIcon = document.createElement('div');
      dragIcon.innerHTML = `
        <div style="background: #3b82f6; color: white; padding: 6px 10px; border-radius: 4px; font-family: sans-serif; font-size: 12px; font-weight: 600;">
           Moving ${node.name}
        </div>
      `;
      dragIcon.style.position = 'absolute';
      dragIcon.style.top = '-1000px';
      document.body.appendChild(dragIcon);
      e.dataTransfer.setDragImage(dragIcon, 0, 0);
      requestAnimationFrame(() => document.body.removeChild(dragIcon));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!elementRef.current) return;
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId === node.id) return;

    const rect = elementRef.current.getBoundingClientRect();
    const height = rect.height;
    const relativeY = e.clientY - rect.top;
    
    const isLeaf = ['text', 'image', 'input', 'icon', 'switch', 'checkbox', 'divider', 'textarea', 'select', 'table', 'form'].includes(node.type);
    const canAcceptChildren = !isLeaf;
    
    let newPosition: 'top' | 'bottom' | 'inside' | null = null;

    if (canAcceptChildren) {
        const edgeThreshold = 15;
        if (relativeY < edgeThreshold) newPosition = 'top';
        else if (relativeY > height - edgeThreshold) newPosition = 'bottom';
        else newPosition = 'inside';
    } else {
        newPosition = relativeY < height / 2 ? 'top' : 'bottom';
    }
    
    if (dragPosition !== newPosition) setDragPosition(newPosition);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragPosition(null);
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId === node.id) return;

    if (dragPosition === 'inside') onDrop(e, node.id); 
    else if (dragPosition === 'top' && parentId) onDrop(e, parentId, index);
    else if (dragPosition === 'bottom' && parentId) onDrop(e, parentId, index + 1);
  };

  const handleResizeStart = (e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = elementRef.current?.offsetWidth || 0;
      const startH = elementRef.current?.offsetHeight || 0;
      
      setResizeFeedback({ w: startW, h: startH });

      const onMouseMove = (moveEvent: MouseEvent | any) => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          
          const newStyle: any = {};
          let newW = startW;
          let newH = startH;
          
          if (direction === 'right' || direction === 'corner') {
              newW = Math.max(20, startW + dx);
              newStyle.width = `${newW}px`;
              newStyle.maxWidth = 'none'; 
          }
          if (direction === 'bottom' || direction === 'corner') {
              newH = Math.max(20, startH + dy);
              newStyle.height = `${newH}px`;
              newStyle.minHeight = '0px'; 
              newStyle.flexGrow = 0; 
          }
          setResizeFeedback({ w: newW, h: newH });
          onResize(node.id, newStyle);
      };

      const onMouseUp = () => {
          setResizeFeedback(null);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
  };

  const renderContent = () => {
      if (node.type === 'text') return <div className="pointer-events-none">{node.content}</div>;
      if (node.type === 'button') return node.children.length > 0 ? null : <span className="pointer-events-none">{node.content}</span>;
      if (node.type === 'input') return <input disabled placeholder={node.content} className="w-full h-full bg-transparent outline-none pointer-events-none text-slate-500" />;
      if (node.type === 'textarea') return <textarea disabled placeholder={node.content} className="w-full h-full bg-transparent outline-none pointer-events-none text-slate-500 resize-none" />;
      
      // Render Checkbox (Supports Shadcn and Radix look)
      if (node.type === 'checkbox') return (
          <>
            <div className={cn("h-4 w-4 shrink-0 rounded-sm border border-slate-900 flex items-center justify-center transition-colors", node.props.checked ? "bg-slate-900 text-slate-50" : "bg-white")}>
                {node.props.checked && <Check size={12} strokeWidth={3} />}
            </div>
            <span className="text-sm font-medium leading-none pointer-events-none select-none truncate ml-2">{node.content}</span>
          </>
      );

      // Render Switch (Supports Shadcn and Radix look)
      if (node.type === 'switch') return (
          <>
             <div className={cn("h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors", node.props.checked ? "bg-slate-900" : "bg-slate-200")} >
                 <div className={cn("pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform", node.props.checked ? "translate-x-4" : "translate-x-0")} />
             </div>
             <span className="text-sm font-medium leading-none pointer-events-none select-none truncate ml-2">{node.content}</span>
          </>
      );
      
      if (node.type === 'select') return <><span className="text-muted-foreground pointer-events-none">{node.content || 'Select...'}</span><ChevronDown size={16} className="opacity-50" /></>;
      if (node.type === 'divider') return <div className="w-full h-[2px] bg-slate-300 my-2 min-w-[40px]" />;
      if (node.type === 'image') return <img src={node.content || 'https://picsum.photos/200'} alt="" className="w-full h-full object-cover pointer-events-none" />;
      if (node.type === 'icon' && node.iconName) return React.createElement(IconMap[node.iconName] || Box, { size: 24, className: "pointer-events-none" });
      
      if (node.type === 'table') return <TableRenderer node={node} />;
      if (node.type === 'form') return <FormRenderer node={node} />;

      return null;
  };

  // Style helper for updates
  const updateStyle = (newStyles: any) => {
      if(onUpdate) onUpdate(node.id, { style: { ...node.style, ...newStyles } });
  };

  return (
    <>
      {isSelected && menuPosition && node.id !== 'root' && (
           <div 
            style={{ top: `${menuPosition.top < 50 ? menuPosition.top + menuPosition.height + 10 : menuPosition.top - 48}px`, left: `${menuPosition.left}px`, position: 'fixed' }}
            className="h-10 bg-slate-800 text-white rounded-md shadow-xl flex items-center px-2 gap-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none"
            onMouseDown={(e) => e.stopPropagation()} 
          >
             {/* Wrapping */}
             <MenuBtn onClick={() => onWrap?.(node.id, 'container')} icon={Box} title="Wrap in Container" />
             <MenuBtn onClick={() => onWrap?.(node.id, 'card')} icon={CreditCard} title="Wrap in Card" />
             
             <MenuDivider />
             
             {/* Direction & Alignment */}
             <MenuBtn onClick={() => updateStyle({ flexDirection: 'row' })} icon={ArrowRightFromLine} title="Direction: Row" />
             <MenuBtn onClick={() => updateStyle({ flexDirection: 'column' })} icon={ArrowDownFromLine} title="Direction: Column" />
             <MenuBtn onClick={() => updateStyle({ alignItems: 'center', justifyContent: 'center' })} icon={AlignCenter} title="Align: Center" />
             <MenuBtn onClick={() => updateStyle({ alignItems: 'flex-start', justifyContent: 'flex-start' })} icon={AlignLeft} title="Align: Start" />
             
             <MenuDivider />

             {/* Sizing */}
             <MenuBtn onClick={() => updateStyle({ flexGrow: 1 })} icon={Maximize} title="Flex Grow (Expand)" />
             <MenuBtn onClick={() => updateStyle({ flexGrow: 0 })} icon={Minimize} title="Flex Shrink (Fixed)" />
             <MenuBtn onClick={() => updateStyle({ width: 'auto', height: 'auto' })} icon={Scaling} title="Auto Size (Fit Content)" />

             <MenuDivider />

             {/* Edit Actions */}
             <MenuBtn onClick={() => onDuplicate?.(node.id, 'before')} icon={ArrowUp} title="Duplicate Before" />
             <MenuBtn onClick={() => onDuplicate?.(node.id, 'after')} icon={ArrowDown} title="Duplicate After" />
             
             <MenuDivider />
             
             <MenuBtn onClick={() => onDelete(node.id)} icon={Trash2} title="Delete" variant="danger" />
          </div>
      )}

      <div
        ref={elementRef}
        className={getComponentClasses(node, isSelected)}
        style={{ 
            width: node.style.width !== 'auto' ? node.style.width : undefined, 
            height: node.style.height !== 'auto' ? node.style.height : undefined 
        }}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        draggable={node.id !== 'root'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragPosition(null)}
        onDrop={handleDrop}
        data-state={node.props.checked ? 'checked' : 'unchecked'} 
      >
        {isSelected && ( <div className="absolute inset-0 ring-2 ring-blue-500 ring-offset-2 pointer-events-none z-20 rounded-[inherit]"></div> )}
        
        {isSelected && resizeFeedback && (
            <div className="absolute bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-[60] pointer-events-none whitespace-nowrap" style={{ bottom: '-30px', right: '0px' }}>
                {Math.round(resizeFeedback.w)} x {Math.round(resizeFeedback.h)}
            </div>
        )}

        {isSelected && node.id !== 'root' && (
            <>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-6 bg-white border border-blue-500 shadow-sm rounded-full cursor-ew-resize z-30 -mr-1.5" onMouseDown={(e) => handleResizeStart(e, 'right')} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-white border border-blue-500 shadow-sm rounded-full cursor-ns-resize z-30 -mb-1.5" onMouseDown={(e) => handleResizeStart(e, 'bottom')} />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nwse-resize z-30 -mr-1.5 -mb-1.5" onMouseDown={(e) => handleResizeStart(e, 'corner')} />
            </>
        )}

        {dragPosition === 'top' && <div className="absolute top-0 left-2 right-2 h-1.5 bg-blue-500 z-50 pointer-events-none rounded-full shadow-sm mt-1" />}
        {dragPosition === 'bottom' && <div className="absolute bottom-0 left-2 right-2 h-1.5 bg-blue-500 z-50 pointer-events-none rounded-full shadow-sm mb-1" />}
        {dragPosition === 'inside' && <div className="absolute inset-2 border-2 border-blue-500 bg-blue-500/10 z-50 pointer-events-none rounded-[inherit]" />}

        {renderContent()}
        
        {node.children.map((child, i) => (
          <CanvasRenderer
            key={child.id}
            node={child}
            selectedId={selectedId}
            onSelect={onSelect}
            onDrop={onDrop}
            onDelete={onDelete}
            onResize={onResize}
            onUpdate={onUpdate}
            onDuplicate={onDuplicate}
            onWrap={onWrap}
            index={i}
            parentId={node.id}
          />
        ))}
      </div>
    </>
  );
});

export default CanvasRenderer;