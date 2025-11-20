import React, { useState, useCallback, useEffect } from 'react';
import ComponentLibrary from './components/ComponentLibrary';
import CanvasRenderer from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import { ComponentNode, initialCanvas, ComponentType, StyleProps } from './types';
import { Code, Trash2, Sparkles, Download, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { generateFullCode } from './utils/codeGenerator';
import { generateLayoutWithGemini } from './services/geminiService';

export default function App() {
  const [rootNode, setRootNode] = useState<ComponentNode>(initialCanvas);
  const [selectedId, setSelectedId] = useState<string | null>('root');
  const [showCode, setShowCode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Recursive function to find a node by ID
  const findNode = useCallback((node: ComponentNode, id: string): ComponentNode | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  }, []);

  // Recursive update
  const updateNode = useCallback((root: ComponentNode, id: string, updates: Partial<ComponentNode>): ComponentNode => {
    if (root.id === id) {
      return { ...root, ...updates };
    }
    return {
      ...root,
      children: root.children.map(child => updateNode(child, id, updates))
    };
  }, []);

  // Recursive style update
  const updateNodeStyle = useCallback((root: ComponentNode, id: string, styleUpdates: any): ComponentNode => {
    if (root.id === id) {
      return { ...root, style: { ...root.style, ...styleUpdates } };
    }
    return {
      ...root,
      children: root.children.map(child => updateNodeStyle(child, id, styleUpdates))
    };
  }, []);

  // Generate ID
  const genId = () => `comp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  // Deep Clone Node
  const cloneNode = (node: ComponentNode, newParentId: string | null): ComponentNode => {
      const newId = genId();
      return {
          ...node,
          id: newId,
          parentId: newParentId,
          children: node.children.map(child => cloneNode(child, newId))
      };
  };

  // Create New Node Object
  const createNewNode = (type: string, parentId: string): ComponentNode => {
      // --- PRESETS ---
      if (type === 'sidebar') {
          const menuItemStyle: StyleProps = { 
            width: '100%', justifyContent: 'flex-start', gap: '12px', flexDirection: 'row', alignItems: 'center', padding: '5px', overflow: 'hidden'
          };
          return {
              id: genId(), type: 'container', name: 'Sidebar', library: 'shadcn', props: {},
              style: { width: '260px', height: '100%', backgroundColor: '#ffffff', flexDirection: 'column', padding: '20px', borderRight: '1px solid #e2e8f0', gap: '8px', overflow: 'hidden' },
              children: [
                  { id: genId(), type: 'text', name: 'Brand', library: 'shadcn', props: {}, content: 'Dashboard Pro', style: { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '24px', padding: '5px', gap: '10px', overflow: 'hidden' }, children: [] },
                  { id: genId(), type: 'button', name: 'Menu Item', library: 'shadcn', props: { variant: 'secondary' }, style: { ...menuItemStyle, backgroundColor: '#f1f5f9', color: '#0f172a' }, children: [
                       { id: genId(), type: 'icon', name: 'Home Icon', library: 'shadcn', props: {}, iconName: 'Home', style: { color: 'inherit', padding: '5px', gap: '10px', overflow: 'hidden' }, children: [] },
                       { id: genId(), type: 'text', name: 'Label', library: 'shadcn', props: {}, content: 'Home', style: { color: 'inherit', fontWeight: '500', padding: '5px', gap: '10px', overflow: 'hidden' }, children: [] }
                    ]
                  },
                  { id: genId(), type: 'button', name: 'Menu Item', library: 'shadcn', props: { variant: 'ghost' }, style: { ...menuItemStyle, color: '#64748b' }, children: [
                       { id: genId(), type: 'icon', name: 'Chart Icon', library: 'shadcn', props: {}, iconName: 'Layout', style: { color: 'inherit', padding: '5px', gap: '10px', overflow: 'hidden' }, children: [] },
                       { id: genId(), type: 'text', name: 'Label', library: 'shadcn', props: {}, content: 'Analytics', style: { color: 'inherit', padding: '5px', gap: '10px', overflow: 'hidden' }, children: [] }
                    ]
                  },
              ],
              parentId
          };
      } else if (type === 'navbar') {
          return {
              id: genId(), type: 'container', name: 'Navbar', library: 'shadcn', props: {},
              style: { width: '100%', height: '64px', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #e2e8f0', gap: '20px', overflow: 'hidden' },
              children: [
                  { id: genId(), type: 'text', name: 'Logo', library: 'shadcn', props: {}, content: 'My App', style: { fontSize: '18px', fontWeight: 'bold', padding: '5px', gap: '10px', overflow: 'hidden' }, children: [] },
                  { id: genId(), type: 'container', name: 'Links', library: 'plain', props: {}, style: { flexDirection: 'row', gap: '24px', alignItems: 'center', padding: '5px', overflow: 'hidden' }, children: [
                       { id: genId(), type: 'text', name: 'Link', library: 'shadcn', props: {}, content: 'Features', style: { color: '#64748b', fontSize: '14px', padding: '5px', gap: '10px', overflow: 'hidden' }, children: [] },
                       { id: genId(), type: 'text', name: 'Link', library: 'shadcn', props: {}, content: 'Pricing', style: { color: '#64748b', fontSize: '14px', padding: '5px', gap: '10px', overflow: 'hidden' }, children: [] },
                    ]
                  },
                  { id: genId(), type: 'button', name: 'Login', library: 'shadcn', props: {}, content: 'Sign In', style: { backgroundColor: '#0f172a', color: '#fff', padding: '5px', gap: '10px', overflow: 'hidden' }, children: [] }
              ],
              parentId
          };
      } 
      
      return {
        id: genId(),
        type: type as ComponentType,
        name: type,
        library: 'shadcn', 
        props: {},
        style: {
            // Global Defaults as requested
            padding: '5px', 
            gap: '10px',
            overflow: 'hidden',
            
            backgroundColor: (type === 'container' || type === 'card') ? '#ffffff' : undefined,
            minHeight: (type === 'container' || type === 'card') ? '100px' : undefined,
            borderWidth: (type === 'container' || type === 'card') ? '1px' : undefined,
            borderColor: '#e2e8f0',
            borderRadius: '8px',
        },
        content: type === 'text' ? 'Text Content' : type === 'button' ? 'Button' : '',
        children: [],
        parentId
      };
  }

  // Logic to Add (New) or Move (Existing) node
  const handleDrop = (e: React.DragEvent, targetId: string, index?: number) => {
    const type = e.dataTransfer.getData('componentType');
    const moveNodeId = e.dataTransfer.getData('nodeId');
    
    if (moveNodeId) {
        // MOVE EXISTING NODE
        if (moveNodeId === targetId) return;

        setRootNode(prev => {
            const nodeToMove = findNode(prev, moveNodeId);
            if (!nodeToMove) return prev;

            const removeNode = (node: ComponentNode): ComponentNode => ({
                ...node,
                children: node.children.filter(c => c.id !== moveNodeId).map(removeNode)
            });
            const cleanTree = removeNode(prev);

            const insertNode = (node: ComponentNode): ComponentNode => {
                if (node.id === targetId) {
                    const newChildren = [...node.children];
                    if (typeof index === 'number' && index >= 0) {
                        newChildren.splice(index, 0, { ...nodeToMove, parentId: targetId });
                    } else {
                        newChildren.push({ ...nodeToMove, parentId: targetId });
                    }
                    return { ...node, children: newChildren };
                }
                return { ...node, children: node.children.map(insertNode) };
            };

            return insertNode(cleanTree);
        });
    } else if (type) {
        // ADD NEW NODE
        setRootNode(prev => {
            const newNode = createNewNode(type, targetId);
            
            const addToParent = (node: ComponentNode): ComponentNode => {
                if (node.id === targetId) {
                    const newChildren = [...node.children];
                    if (typeof index === 'number' && index >= 0) {
                        newChildren.splice(index, 0, newNode);
                    } else {
                        newChildren.push(newNode);
                    }
                    return { ...node, children: newChildren };
                }
                return { ...node, children: node.children.map(addToParent) };
            };
            return addToParent(prev);
        });
    }
  };

  const handleDelete = (id: string) => {
    if (id === 'root') return;
    
    const deleteFromNode = (node: ComponentNode, targetId: string): ComponentNode => {
      return {
        ...node,
        children: node.children.filter(c => c.id !== targetId).map(c => deleteFromNode(c, targetId))
      };
    };
    setRootNode(prev => deleteFromNode(prev, id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDuplicate = (id: string, direction: 'before' | 'after') => {
      if (id === 'root') return;

      setRootNode(prev => {
          // Helper to find parent and duplicate child
          const duplicateInTree = (node: ComponentNode): ComponentNode => {
              // Check if any child matches the ID
              const childIndex = node.children.findIndex(c => c.id === id);
              
              if (childIndex !== -1) {
                  const childToClone = node.children[childIndex];
                  const clonedNode = cloneNode(childToClone, node.id);
                  
                  const newChildren = [...node.children];
                  const insertIndex = direction === 'after' ? childIndex + 1 : childIndex;
                  
                  newChildren.splice(insertIndex, 0, clonedNode);
                  return { ...node, children: newChildren };
              }
              
              // Recursively check children
              return {
                  ...node,
                  children: node.children.map(duplicateInTree)
              };
          };

          return duplicateInTree(prev);
      });
  };

  const handleGenerate = async () => {
     setIsGenerating(true);
     try {
         const result = await generateLayoutWithGemini(aiPrompt);
         if (result) {
             setRootNode(result);
             setShowAiModal(false);
             setAiPrompt('');
         } else {
             alert("Failed to generate layout. Please try again.");
         }
     } catch (e) {
         console.error(e);
     } finally {
         setIsGenerating(false);
     }
  };

  const handleUpdate = (id: string, updates: any) => {
      setRootNode(prev => updateNode(prev, id, updates));
  };

  // Keyboard Event Listener for Delete
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
              // Avoid deleting when typing in input fields
              const activeTag = document.activeElement?.tagName;
              if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

              if (selectedId && selectedId !== 'root') {
                  handleDelete(selectedId);
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  return (
    <div className="flex h-screen flex-col bg-white text-slate-900 font-sans">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 z-30 relative">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">UI</div>
           <h1 className="font-semibold text-lg tracking-tight">Builder Pro</h1>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={() => setShowAiModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-sm font-medium hover:bg-purple-100 transition-colors">
             <Sparkles size={16} />
             <span>Generate with AI</span>
           </button>
           <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
           <button onClick={() => setShowCode(!showCode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showCode ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
             <Code size={16} />
             <span>{showCode ? 'Editor' : 'Export Code'}</span>
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Left */}
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
           <ComponentLibrary />
        </div>
        
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-4 left-4 z-20 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 text-slate-500" style={{ left: isSidebarOpen ? '264px' : '16px' }}>
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-50 overflow-auto p-8 flex justify-center relative" onClick={() => setSelectedId(null)}>
            {showCode ? (
                <div className="w-full max-w-4xl h-full bg-[#1e1e1e] text-slate-300 rounded-lg shadow-2xl overflow-hidden border border-slate-800 font-mono text-sm relative">
                    <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-slate-800">
                        <span className="text-xs text-slate-500">page.tsx</span>
                        <button className="text-slate-400 hover:text-white"><Download size={16} /></button>
                    </div>
                    <pre className="p-4 overflow-auto h-[calc(100%-44px)]">{generateFullCode(rootNode)}</pre>
                </div>
            ) : (
                <div className="w-full h-full min-h-[800px] bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden transition-all">
                    <CanvasRenderer 
                        node={rootNode} 
                        selectedId={selectedId} 
                        onSelect={setSelectedId} 
                        onDrop={handleDrop}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onResize={(id, style) => setRootNode(prev => updateNodeStyle(prev, id, style))}
                        onUpdate={handleUpdate}
                    />
                </div>
            )}
        </div>

        {/* Properties Right */}
        {selectedId && (
            <PropertiesPanel 
                node={selectedId === 'root' ? rootNode : findNode(rootNode, selectedId)} 
                onChange={(updates) => setRootNode(prev => updateNode(prev, selectedId, updates))}
                onStyleChange={(style) => setRootNode(prev => updateNodeStyle(prev, selectedId, style))}
            />
        )}
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Sparkles className="text-purple-600" size={20} />Generate UI</h2>
                 <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <div className="p-6">
                 <p className="text-sm text-slate-500 mb-3">Describe the component or section you want to build.</p>
                 <textarea className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none text-sm" placeholder="e.g., A pricing card with 3 tiers..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
              </div>
              <div className="p-6 pt-0 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md">Cancel</button>
                 <button onClick={handleGenerate} disabled={isGenerating || !aiPrompt} className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">{isGenerating ? 'Generating...' : 'Generate'}<Sparkles size={14} /></button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}