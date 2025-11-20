
import React, { useState, useCallback, useEffect } from 'react';
import ComponentLibrary from './components/ComponentLibrary';
import CanvasRenderer from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import { ComponentNode, initialCanvas, ComponentType, LibraryType } from './types';
import { Code, Sparkles, Download, X, PanelLeftClose, PanelLeftOpen, Undo2, Redo2 } from 'lucide-react';
import { generateFullCode } from './utils/codeGenerator';
import { generateLayoutWithGemini } from './services/geminiService';

export default function App() {
  // History State
  const [history, setHistory] = useState<ComponentNode[]>([{
      ...initialCanvas,
      style: { ...initialCanvas.style, backgroundColor: '#ffffff' } // Root is White
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [rootNode, setRootNodeState] = useState<ComponentNode>({
      ...initialCanvas,
      style: { ...initialCanvas.style, backgroundColor: '#ffffff' } // Root is White
  });
  const [selectedId, setSelectedId] = useState<string | null>('root');
  const [showCode, setShowCode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Wrapper to update root node and push to history
  const updateRootNode = (newNode: ComponentNode | ((prev: ComponentNode) => ComponentNode), addToHistory = true) => {
    setRootNodeState((prev) => {
      const updatedNode = typeof newNode === 'function' ? newNode(prev) : newNode;
      
      if (addToHistory) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updatedNode);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      
      return updatedNode;
    });
  };

  // Undo / Redo Functions
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setRootNodeState(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setRootNodeState(history[newIndex]);
    }
  };

  // Sync rootNode with history if history changes externally (though we control it mainly via updateRootNode)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
              if (e.shiftKey) handleRedo();
              else handleUndo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);


  // Recursive finder
  const findNode = useCallback((node: ComponentNode, id: string): ComponentNode | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  }, []);

  // Recursive update (pure function for React state)
  const updateNode = useCallback((root: ComponentNode, id: string, updates: Partial<ComponentNode>): ComponentNode => {
    if (root.id === id) {
      return { ...root, ...updates };
    }
    return {
      ...root,
      children: root.children.map(child => updateNode(child, id, updates))
    };
  }, []);

  const updateNodeStyle = useCallback((root: ComponentNode, id: string, styleUpdates: any): ComponentNode => {
    if (root.id === id) {
      return { ...root, style: { ...root.style, ...styleUpdates } };
    }
    return {
      ...root,
      children: root.children.map(child => updateNodeStyle(child, id, styleUpdates))
    };
  }, []);

  const genId = () => `comp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const cloneNode = (node: ComponentNode, newParentId: string | null): ComponentNode => {
      const newId = genId();
      return {
          ...node,
          id: newId,
          parentId: newParentId,
          children: node.children.map(child => cloneNode(child, newId))
      };
  };

  const createNewNode = (type: string, parentId: string): ComponentNode => {
      const base: ComponentNode = {
        id: genId(),
        type: type as ComponentType,
        name: type,
        library: 'radix', // Default set to Radix
        props: {},
        style: {
            padding: '0px', 
            overflow: 'hidden',
            gap: '10px',
            borderColor: '#e2e8f0',
            borderRadius: '6px',
        },
        content: '',
        children: [],
        parentId
      };

      // Specific defaults
      if (type === 'container') {
          base.style = { 
              ...base.style, 
              width: '100%', 
              minHeight: '100px', 
              backgroundColor: '#f8fafc', 
              padding: '16px', 
              borderWidth: '1px', 
              borderStyle: 'dashed', 
              flexDirection: 'column' 
          };
      } else if (type === 'card') {
           base.style = { 
               ...base.style, 
               width: '100%', 
               minHeight: '150px', 
               backgroundColor: '#ffffff', 
               padding: '0px', 
               borderWidth: '1px', 
               borderStyle: 'solid', 
               flexDirection: 'column',
               boxShadow: 'shadow-sm'
           };
      } else if (type === 'button') {
          base.content = 'Button';
          base.style = { 
            ...base.style, 
            width: 'auto', 
            height: 'auto', 
            backgroundColor: '#1e293b', 
            color: '#ffffff', 
            padding: '8px 16px', 
            borderRadius: '6px',
            cursor: 'pointer'
          };
      } else if (type === 'text') {
          base.content = 'Text block';
          base.style = { ...base.style, width: 'auto' };
      } else if (type === 'input') {
          base.content = 'Enter text...';
          base.style = { ...base.style, width: '100%', height: '40px', borderWidth: '1px', padding: '8px' };
      } else if (type === 'textarea') {
          base.content = 'Type your message here.';
          base.style = { ...base.style, width: '100%', height: 'auto', minHeight: '80px', borderWidth: '1px', padding: '8px' };
      } else if (type === 'select') {
          base.content = 'Select an option';
          base.style = { ...base.style, width: '200px', height: '40px', borderWidth: '1px', padding: '8px' };
      } else if (type === 'checkbox') {
          base.content = 'Checkbox Label';
          base.style = { 
            ...base.style, 
            width: 'auto', 
            height: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px'
          };
          base.props.checked = false;
      } else if (type === 'switch') {
          base.content = 'Switch Label';
          base.style = { 
            ...base.style, 
            width: 'auto', 
            height: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px'
          };
          base.props.checked = false;
      } else if (type === 'divider') {
          base.style = { 
              ...base.style, 
              width: '100%', 
              height: '1px', 
              backgroundColor: '#cbd5e1', 
              margin: '10px 0',
              minHeight: '1px'
          };
      } else if (type === 'table') {
          base.style = {
              ...base.style,
              width: '100%',
              height: 'auto',
              padding: '0px',
              borderWidth: '1px',
              borderColor: '#e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              boxShadow: 'shadow-md'
          };
          base.props.data = [
              { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
              { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
          ];
      } else if (type === 'form') {
          base.name = 'Smart Form';
          base.style = {
              ...base.style,
              width: '100%',
              padding: '24px',
              borderWidth: '1px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              flexDirection: 'column',
              gap: '16px'
          };
          base.props = {
              mode: 'serverAction', // 'api' or 'serverAction'
              endpoint: 'submitForm',
              submitLabel: 'Submit',
              cancelLabel: 'Cancel',
              clearLabel: 'Clear',
              fields: [
                  { id: 'f1', type: 'text', name: 'fullName', label: 'Full Name', placeholder: 'John Doe', required: true },
                  { id: 'f2', type: 'email', name: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
                  { id: 'f3', type: 'select', name: 'role', label: 'User Role', placeholder: 'Select role', required: true, options: ['User', 'Admin', 'Editor'] }
              ]
          };
      } else if (type === 'avatarGroup') {
          base.name = 'Avatar Group';
          base.style = { ...base.style, flexDirection: 'row', alignItems: 'center', width: 'auto' };
          base.props = {
              max: 4,
              images: [
                  'https://i.pravatar.cc/150?img=1',
                  'https://i.pravatar.cc/150?img=2',
                  'https://i.pravatar.cc/150?img=3',
                  'https://i.pravatar.cc/150?img=4',
                  'https://i.pravatar.cc/150?img=5',
                  'https://i.pravatar.cc/150?img=6'
              ]
          };
      } else if (type === 'interaction') {
          base.name = 'Social Interactions';
          base.style = { ...base.style, flexDirection: 'row', alignItems: 'center', gap: '16px', width: 'auto' };
          base.props = {
              likes: 120,
              dislikes: 5,
              views: 1500,
              liked: false,
              disliked: false
          };
      } else if (type === 'tabs') {
          base.name = 'Tabs';
          base.style = { ...base.style, width: '100%', height: 'auto', flexDirection: 'column' };
          base.props = {
              items: [
                  { id: 'account', label: 'Account', icon: 'User', content: '<p>Manage your account settings here.</p>' },
                  { id: 'security', label: 'Security', icon: 'Lock', content: '<p>Security preferences and 2FA.</p>' },
                  { id: 'notifications', label: 'Notifications', icon: 'Bell', content: '<p>Email and push notification settings.</p>' }
              ],
              activeTab: 'account'
          };
      } else if (type === 'list') {
          base.name = 'Dynamic List';
          base.style = { ...base.style, width: '100%', flexDirection: 'column', backgroundColor: '#ffffff', borderWidth: '1px', borderRadius: '8px', padding: '16px' };
          base.props = {
              itemsPerPage: 5,
              pagination: true,
              items: [
                  { id: 1, title: 'Project A Update', description: 'Daily standup notes', icon: 'FileText' },
                  { id: 2, title: 'Client Meeting', description: 'Discuss requirements', icon: 'Users' },
                  { id: 3, title: 'Code Review', description: 'PR #123 needs review', icon: 'Code' },
                  { id: 4, title: 'Deployment', description: 'Deploy to production', icon: 'Server' },
                  { id: 5, title: 'Bug Fix', description: 'Fix login issue', icon: 'Bug' },
                  { id: 6, title: 'Design Sync', description: 'Sync with UI team', icon: 'PenTool' },
              ]
          };
      } else if (type === 'dropdown') {
          base.name = 'Dropdown Menu';
          base.style = { ...base.style, width: 'auto', position: 'relative' };
          base.props = {
              label: 'Options',
              items: [
                  { id: 'edit', label: 'Edit', icon: 'Edit' },
                  { id: 'duplicate', label: 'Duplicate', icon: 'Copy' },
                  { id: 'delete', label: 'Delete', icon: 'Trash', danger: true }
              ]
          };
      }

      // Templates with full children structure
      if (type === 'sidebar') {
           const sidebarId = genId();
           
           const createMenuItem = (label: string, icon: string, isActive: boolean = false): ComponentNode => {
               const itemId = genId();
               return {
                   id: itemId,
                   type: 'container',
                   name: 'Menu Item',
                   library: 'radix',
                   props: {},
                   style: { 
                       width: '100%', 
                       padding: '10px', 
                       borderRadius: '6px', 
                       flexDirection: 'row', 
                       alignItems: 'center', 
                       gap: '12px', 
                       backgroundColor: isActive ? '#eff6ff' : 'transparent', 
                       color: isActive ? '#2563eb' : '#64748b',
                       cursor: 'pointer' 
                   },
                   children: [
                       { id: genId(), type: 'icon', name: 'Icon', library: 'radix', props: {}, style: { color: isActive ? '#2563eb' : 'inherit' }, iconName: icon, children: [], parentId: itemId },
                       { id: genId(), type: 'text', name: 'Label', library: 'radix', props: {}, style: { fontSize: '14px', fontWeight: '500', color: 'inherit' }, content: label, children: [], parentId: itemId }
                   ],
                   parentId: sidebarId
               };
           };

           const sidebar: ComponentNode = { 
               ...base, 
               id: sidebarId,
               type: 'container', 
               name: 'Sidebar', 
               style: { 
                   width: '260px', 
                   height: '100%', 
                   backgroundColor: '#ffffff', 
                   borderRight: '1px solid #e2e8f0', 
                   padding: '24px', 
                   flexDirection: 'column', 
                   gap: '8px' 
               },
               children: [
                   {
                       id: genId(),
                       type: 'text',
                       name: 'Brand',
                       library: 'radix',
                       props: {},
                       style: { fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#0f172a' },
                       content: 'Dashboard',
                       children: [],
                       parentId: sidebarId
                   },
                   createMenuItem('Home', 'Home', true), 
                   createMenuItem('Profile', 'User'),
                   createMenuItem('Settings', 'Settings'),
                   {
                        id: genId(),
                        type: 'container',
                        name: 'Spacer',
                        library: 'radix',
                        props: {},
                        style: { flexGrow: 1 },
                        children: [],
                        parentId: sidebarId
                   },
                   {
                       id: genId(),
                       type: 'divider',
                       name: 'Divider',
                       library: 'radix',
                       props: {},
                       style: { width: '100%', height: '1px', backgroundColor: '#e2e8f0', margin: '10px 0' },
                       children: [],
                       parentId: sidebarId
                   },
                   {
                       ...createMenuItem('Log Out', 'ArrowRight'),
                   }
               ]
           };
           
           const setParentIds = (node: ComponentNode, pid: string | null) => {
               node.parentId = pid;
               node.children.forEach(c => setParentIds(c, node.id));
           };
           setParentIds(sidebar, parentId);

           return sidebar;
      }

      if (type === 'navbar') {
           const navbarId = genId();
           const navbar: ComponentNode = { 
               ...base, 
               id: navbarId,
               type: 'container', 
               name: 'Navbar', 
               style: { 
                   width: '100%', 
                   height: '64px', 
                   backgroundColor: '#ffffff', 
                   borderBottom: '1px solid #e2e8f0', 
                   padding: '0 24px', 
                   flexDirection: 'row', 
                   alignItems: 'center', 
                   justifyContent: 'space-between' 
               },
               children: [
                   // Logo Section
                   {
                       id: genId(),
                       type: 'container',
                       name: 'Logo Group',
                       library: 'radix',
                       props: {},
                       style: { flexDirection: 'row', alignItems: 'center', gap: '10px' },
                       children: [
                            { id: genId(), type: 'icon', name: 'Logo Icon', library: 'radix', props: {}, style: { color: '#2563eb' }, iconName: 'Box', children: [], parentId: '' },
                            { id: genId(), type: 'text', name: 'Brand', library: 'radix', props: {}, style: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }, content: 'Brand', children: [], parentId: '' }
                       ],
                       parentId: navbarId
                   },
                   // Nav Links
                   {
                       id: genId(),
                       type: 'container',
                       name: 'Links Group',
                       library: 'radix',
                       props: {},
                       style: { flexDirection: 'row', alignItems: 'center', gap: '24px' },
                       children: [
                           { id: genId(), type: 'text', name: 'Link', library: 'radix', props: {}, style: { fontSize: '14px', fontWeight: '500', color: '#0f172a', cursor: 'pointer' }, content: 'Overview', children: [], parentId: '' }, 
                           { id: genId(), type: 'text', name: 'Link', library: 'radix', props: {}, style: { fontSize: '14px', fontWeight: '500', color: '#64748b', cursor: 'pointer' }, content: 'Customers', children: [], parentId: '' },
                           { 
                               id: genId(), 
                               type: 'button', 
                               name: 'Action', 
                               library: 'radix', 
                               props: { variant: 'default' }, 
                               style: { 
                                 height: '36px', 
                                 borderRadius: '6px', 
                                 backgroundColor: '#1e293b', 
                                 color: 'white', 
                                 padding: '0 16px',
                                 cursor: 'pointer' 
                               }, 
                               content: 'Log In', 
                               children: [], 
                               parentId: '' 
                           }
                       ],
                       parentId: navbarId
                   }
               ]
           };
           
           const setParentIds = (node: ComponentNode, pid: string | null) => {
               node.parentId = pid;
               node.children.forEach(c => setParentIds(c, node.id));
           };
           setParentIds(navbar, parentId);
           
           return navbar;
      }

      return base;
  }

  const handleDrop = (e: React.DragEvent, targetId: string, index?: number) => {
    const type = e.dataTransfer.getData('componentType');
    const moveNodeId = e.dataTransfer.getData('nodeId');
    
    if (moveNodeId) {
        if (moveNodeId === targetId) return;
        updateRootNode(prev => {
            const nodeToMove = findNode(prev, moveNodeId);
            if (!nodeToMove) return prev;
            const removeNode = (node: ComponentNode): ComponentNode => ({ ...node, children: node.children.filter(c => c.id !== moveNodeId).map(removeNode) });
            const cleanTree = removeNode(prev);
            const insertNode = (node: ComponentNode): ComponentNode => {
                if (node.id === targetId) {
                    const newChildren = [...node.children];
                    const safeIndex = typeof index === 'number' ? index : newChildren.length;
                    newChildren.splice(safeIndex, 0, { ...nodeToMove, parentId: targetId });
                    return { ...node, children: newChildren };
                }
                return { ...node, children: node.children.map(insertNode) };
            };
            return insertNode(cleanTree);
        });
    } else if (type) {
        updateRootNode(prev => {
            const newNode = createNewNode(type, targetId);
            const addToParent = (node: ComponentNode): ComponentNode => {
                if (node.id === targetId) {
                    const newChildren = [...node.children];
                    const safeIndex = typeof index === 'number' ? index : newChildren.length;
                    newChildren.splice(safeIndex, 0, newNode);
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
    const deleteFromNode = (node: ComponentNode, targetId: string): ComponentNode => ({
        ...node, children: node.children.filter(c => c.id !== targetId).map(c => deleteFromNode(c, targetId))
    });
    updateRootNode(prev => deleteFromNode(prev, id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDuplicate = (id: string, direction: 'before' | 'after') => {
      if (id === 'root') return;
      updateRootNode(prev => {
          const duplicateInTree = (node: ComponentNode): ComponentNode => {
              const childIndex = node.children.findIndex(c => c.id === id);
              if (childIndex !== -1) {
                  const clonedNode = cloneNode(node.children[childIndex], node.id);
                  const newChildren = [...node.children];
                  newChildren.splice(direction === 'after' ? childIndex + 1 : childIndex, 0, clonedNode);
                  return { ...node, children: newChildren };
              }
              return { ...node, children: node.children.map(duplicateInTree) };
          };
          return duplicateInTree(prev);
      });
  };

  const handleWrap = (id: string, type: 'container' | 'card') => {
    if (id === 'root') return;
    updateRootNode(prev => {
      const wrapNodeInTree = (node: ComponentNode): ComponentNode => {
         const childIndex = node.children.findIndex(c => c.id === id);
         if (childIndex !== -1) {
             const wrapper = createNewNode(type, node.id);
             wrapper.children = [{ ...node.children[childIndex], parentId: wrapper.id }];
             wrapper.style = { ...wrapper.style, width: '100%', flexDirection: 'column', padding: '10px' };
             const newChildren = [...node.children];
             newChildren[childIndex] = wrapper;
             return { ...node, children: newChildren };
         }
         return { ...node, children: node.children.map(wrapNodeInTree) };
      }
      return wrapNodeInTree(prev);
    });
  };

  const handleGenerate = async () => {
     setIsGenerating(true);
     try {
         const result = await generateLayoutWithGemini(aiPrompt);
         if (result) { 
             updateRootNode(result); 
             setShowAiModal(false); 
             setAiPrompt(''); 
         }
     } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
              if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;
              if (selectedId && selectedId !== 'root') handleDelete(selectedId);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  return (
    <div className="flex h-screen flex-col bg-white text-slate-900 font-sans">
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 z-30 relative">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">UI</div>
           <h1 className="font-semibold text-lg tracking-tight">Builder Pro</h1>
           
           {/* Undo / Redo Buttons */}
           <div className="flex items-center gap-1 ml-4 border-l border-slate-200 pl-4">
               <button 
                 onClick={handleUndo} 
                 disabled={historyIndex === 0}
                 className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"
                 title="Undo (Ctrl+Z)"
               >
                   <Undo2 size={18} />
               </button>
               <button 
                 onClick={handleRedo} 
                 disabled={historyIndex === history.length - 1}
                 className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"
                 title="Redo (Ctrl+Shift+Z)"
               >
                   <Redo2 size={18} />
               </button>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setShowAiModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-sm font-medium hover:bg-purple-100 transition-colors"><Sparkles size={16} /><span>AI Generate</span></button>
           <button onClick={() => setShowCode(!showCode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showCode ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Code size={16} /><span>{showCode ? 'Editor' : 'Export'}</span></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
           <ComponentLibrary />
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-4 left-4 z-20 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500" style={{ left: isSidebarOpen ? '264px' : '16px' }}>
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

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
                        onWrap={handleWrap}
                        // Property updates trigger history update
                        onResize={(id, style) => updateRootNode(prev => updateNodeStyle(prev, id, style))}
                        onUpdate={(id, ups) => updateRootNode(prev => updateNode(prev, id, ups))}
                    />
                </div>
            )}
        </div>
        {selectedId && (
            <PropertiesPanel 
                node={selectedId === 'root' ? rootNode : findNode(rootNode, selectedId)} 
                onChange={(updates) => updateRootNode(prev => updateNode(prev, selectedId, updates))}
                onStyleChange={(style) => updateRootNode(prev => updateNodeStyle(prev, selectedId, style))}
            />
        )}
      </div>
      {showAiModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl p-6 max-w-lg w-full"><textarea className="w-full border p-2 rounded mb-4" value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}/><button onClick={handleGenerate} disabled={isGenerating} className="bg-purple-600 text-white px-4 py-2 rounded w-full">Generate</button><button onClick={()=>setShowAiModal(false)} className="mt-2 text-slate-500 w-full">Cancel</button></div></div>}
    </div>
  );
}
