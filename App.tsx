

import React, { useState, useCallback, useEffect } from 'react';
import ComponentLibrary from './components/ComponentLibrary';
import CanvasRenderer from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import Header from './components/Header';
import { ComponentNode, initialCanvas, ComponentType, LibraryType, FrameworkType } from './types';
import { Download, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { generateFullCode } from './utils/codeGenerator';
import { generateFlutterCode } from './utils/flutterGenerator';
import { generateLayoutWithGemini } from './services/geminiService';

export default function App() {
  // History State
  const [history, setHistory] = useState<ComponentNode[]>([{
      ...initialCanvas,
      style: { ...initialCanvas.style, backgroundColor: '#ffffff' }
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [rootNode, setRootNodeState] = useState<ComponentNode>({
      ...initialCanvas,
      style: { ...initialCanvas.style, backgroundColor: '#ffffff' }
  });
  
  const [selectedId, setSelectedId] = useState<string | null>('root');
  const [showCode, setShowCode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // New State for Framework and Flutter Options
  const [framework, setFramework] = useState<FrameworkType>('nextjs');
  const [flutterStateful, setFlutterStateful] = useState(false);

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
      const id = genId();
      
      const base: ComponentNode = {
        id,
        type: (type === 'sidebar' || type === 'navbar') ? 'container' : type as ComponentType,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        library: 'radix',
        props: {},
        style: {
            position: 'relative',
            flexDirection: 'column',
            padding: '0px',
            gap: '10px',
            // Default sensible styles
            width: 'auto',
            height: 'auto',
        },
        content: '',
        children: [],
        parentId
      };

      switch (type) {
        case 'container':
            base.style = { 
                ...base.style, 
                width: '100%', 
                minHeight: '100px', 
                backgroundColor: '#f8fafc', 
                padding: '16px', 
                borderWidth: '1px', 
                borderStyle: 'dashed', 
                borderColor: '#cbd5e1' 
            };
            break;

        case 'card':
            base.style = { 
                ...base.style, 
                width: '100%', 
                minHeight: '150px', 
                backgroundColor: '#ffffff', 
                padding: '20px', 
                borderRadius: '8px', 
                boxShadow: 'shadow-md', 
                borderWidth: '1px', 
                borderColor: '#e2e8f0' 
            };
            break;

        case 'text':
            base.content = 'Text Block';
            base.style = { ...base.style, width: 'auto' };
            break;

        case 'button':
             base.content = 'Button';
             base.style = { ...base.style, width: 'auto', backgroundColor: '#1e293b', color: '#ffffff', padding: '8px 16px', borderRadius: '6px' };
             break;

        case 'image':
             base.content = 'https://picsum.photos/300/200';
             base.style = { ...base.style, width: '100%', height: '200px', borderRadius: '8px' };
             break;

        case 'input':
             base.content = 'Enter text...';
             base.style = { ...base.style, width: '100%', padding: '8px', borderWidth: '1px', borderRadius: '6px', borderColor: '#cbd5e1' };
             break;
             
        case 'textarea':
             base.content = 'Enter description...';
             base.style = { ...base.style, width: '100%', height: '80px', padding: '8px', borderWidth: '1px', borderRadius: '6px', borderColor: '#cbd5e1' };
             break;

        case 'select':
             base.content = 'Select option';
             base.style = { ...base.style, width: '100%', padding: '8px', borderWidth: '1px', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff' };
             break;

        case 'checkbox':
             base.content = 'Enable Option'; // Label
             base.style = { ...base.style, flexDirection: 'row', alignItems: 'center', gap: '8px', width: 'auto' };
             base.props.checked = true;
             break;
             
        case 'switch':
             base.content = 'Toggle Mode'; // Label
             base.style = { ...base.style, flexDirection: 'row', alignItems: 'center', gap: '8px', width: 'auto' };
             base.props.checked = true;
             break;

        case 'divider':
             base.style = { ...base.style, width: '100%', height: '1px', backgroundColor: '#e2e8f0', margin: '10px 0' };
             break;
             
        case 'icon':
             base.iconName = 'Star';
             base.style = { ...base.style, color: '#64748b' };
             break;

        case 'tabs':
             base.props.items = [
                 { id: 'tab1', label: 'Account', icon: 'User', content: '<p>Manage your account settings here.</p>' },
                 { id: 'tab2', label: 'Password', icon: 'Lock', content: '<p>Change your password securely.</p>' },
                 { id: 'tab3', label: 'Notifications', icon: 'Bell', content: '<p>Configure your notification preferences.</p>' }
             ];
             base.props.activeTab = 'tab1';
             base.style = { ...base.style, width: '100%' };
             break;

        case 'accordion':
             base.props.items = [
                 { id: 'item1', title: 'Is it accessible?', icon: 'Check', content: 'Yes. It adheres to the WAI-ARIA design pattern.' },
                 { id: 'item2', title: 'Is it styled?', icon: 'Palette', content: 'Yes. It comes with default styles that matches the other components.' },
                 { id: 'item3', title: 'Is it animated?', icon: 'Sparkles', content: 'Yes. It uses CSS transitions for smooth expansion.' }
             ];
             base.style = { ...base.style, width: '100%' };
             break;

        case 'list':
             base.props.items = [
                 { id: '1', title: 'Inbox', description: '12 Unread messages', icon: 'Box' },
                 { id: '2', title: 'Sent', description: '5 pending items', icon: 'ArrowRight' },
                 { id: '3', title: 'Junk', description: 'Cleared', icon: 'Trash2' }
             ];
             base.style = { ...base.style, width: '100%' };
             break;
             
        case 'dropdown':
             base.props.label = "Options";
             base.props.items = [
                 { id: '1', label: 'Profile', icon: 'User' },
                 { id: '2', label: 'Settings', icon: 'Settings' },
                 { id: '3', label: 'Logout', icon: 'LogOut', danger: true }
             ];
             base.style = { ...base.style, width: 'auto' };
             break;

        case 'avatarGroup':
             base.props.images = [
                 "https://i.pravatar.cc/150?u=a042581f4e29026024d",
                 "https://i.pravatar.cc/150?u=a04258a2462d826712d",
                 "https://i.pravatar.cc/150?u=a042581f4e29026704d",
                 "https://i.pravatar.cc/150?u=a04258114e29026302d"
             ];
             base.props.max = 3;
             base.style = { ...base.style, width: 'auto', flexDirection: 'row' };
             break;

        case 'table':
            base.props.data = [
                { id: 1, name: 'John Doe', role: 'Admin', status: 'Active' },
                { id: 2, name: 'Jane Smith', role: 'User', status: 'Active' },
                { id: 3, name: 'Bob Johnson', role: 'Guest', status: 'Inactive' }
            ];
            base.props.actionLabel = "Edit";
            base.style = { ...base.style, width: '100%', overflow: 'auto' };
            break;
            
        case 'form':
            base.props.submitLabel = "Submit Request";
            base.props.fields = [
                { id: 'f1', name: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com', required: true },
                { id: 'f2', name: 'subject', label: 'Subject', type: 'text', placeholder: 'How can we help?', required: true },
                { id: 'f3', name: 'message', label: 'Message', type: 'textarea', placeholder: 'Describe your issue...', required: true }
            ];
            base.style = { ...base.style, width: '100%' };
            break;

        case 'interaction':
            base.props.likes = 124;
            base.props.dislikes = 12;
            base.props.views = 5400;
            base.style = { ...base.style, width: 'auto' };
            break;

        // --- Presets ---
        case 'sidebar':
             base.name = 'Sidebar Preset';
             base.style = { 
                 ...base.style, 
                 width: '250px', 
                 height: '100%', 
                 backgroundColor: '#ffffff', 
                 borderRight: '1px', 
                 borderColor: '#e2e8f0', 
                 padding: '20px',
                 alignItems: 'flex-start'
             };
             // Manually constructing children for the preset
             const logo = createNewNode('text', id);
             logo.content = "Dashboard Pro";
             logo.style = { ...logo.style, fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' };
             
             const navList = createNewNode('list', id);
             navList.props.items = [
                 { id: 'p1', title: 'Overview', icon: 'Layout' },
                 { id: 'p2', title: 'Analytics', icon: 'BarChart' },
                 { id: 'p3', title: 'Customers', icon: 'Users' },
                 { id: 'p4', title: 'Settings', icon: 'Settings' }
             ];
             
             const userProfile = createNewNode('container', id);
             userProfile.style = { ...userProfile.style, marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', width: '100%', minHeight: 'auto' };
             
             const avatar = createNewNode('image', userProfile.id);
             avatar.content = "https://i.pravatar.cc/150?u=a042581f4e29026024d";
             avatar.style = { ...avatar.style, width: '40px', height: '40px', borderRadius: '20px' };
             
             const userName = createNewNode('text', userProfile.id);
             userName.content = "John Admin";
             userName.style = { ...userName.style, fontSize: '14px', fontWeight: '500' };
             
             userProfile.children = [avatar, userName];
             base.children = [logo, navList, userProfile];
             break;

        case 'navbar':
             base.name = 'Navbar Preset';
             base.style = { 
                 ...base.style, 
                 width: '100%', 
                 height: '64px', 
                 backgroundColor: '#ffffff', 
                 borderBottom: '1px', 
                 borderColor: '#e2e8f0', 
                 flexDirection: 'row', 
                 alignItems: 'center', 
                 justifyContent: 'space-between', 
                 padding: '0 24px'
             };
             
             const navLogo = createNewNode('text', id);
             navLogo.content = "MyApp";
             navLogo.style = { ...navLogo.style, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' };
             
             const linksContainer = createNewNode('container', id);
             linksContainer.style = { ...linksContainer.style, flexDirection: 'row', gap: '20px', alignItems: 'center', width: 'auto', minHeight: 'auto', backgroundColor: 'transparent', borderWidth: '0' };
             
             ['Features', 'Pricing', 'About'].forEach(text => {
                 const link = createNewNode('text', linksContainer.id);
                 link.content = text;
                 link.style = { ...link.style, fontSize: '14px', color: '#64748b', cursor: 'pointer' };
                 linksContainer.children.push(link);
             });
             
             const ctaBtn = createNewNode('button', id);
             ctaBtn.content = "Get Started";
             
             base.children = [navLogo, linksContainer, ctaBtn];
             break;
      }
      return base;
  };

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

  return (
    <div className="flex h-screen flex-col bg-white text-slate-900 font-sans">
      <Header 
        historyIndex={historyIndex}
        historyLength={history.length}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAiOpen={() => setShowAiModal(true)}
        showCode={showCode}
        onToggleCode={() => setShowCode(!showCode)}
        framework={framework}
        onFrameworkChange={setFramework}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
           <ComponentLibrary framework={framework} />
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-4 left-4 z-20 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500" style={{ left: isSidebarOpen ? '264px' : '16px' }}>
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        <div className="flex-1 bg-slate-50 overflow-auto p-8 flex justify-center relative" onClick={() => setSelectedId(null)}>
            {showCode ? (
                <div className="w-full max-w-4xl h-full bg-[#1e1e1e] text-slate-300 rounded-lg shadow-2xl overflow-hidden border border-slate-800 font-mono text-sm relative flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-slate-800">
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500">{framework === 'flutter' ? 'main.dart' : 'page.tsx'}</span>
                            {framework === 'flutter' && (
                                <div className="flex items-center gap-2 bg-slate-800 rounded px-2 py-0.5">
                                    <label className="text-xs text-slate-400">Type:</label>
                                    <select 
                                        value={flutterStateful ? 'stateful' : 'stateless'} 
                                        onChange={(e) => setFlutterStateful(e.target.value === 'stateful')}
                                        className="bg-transparent text-xs text-white outline-none"
                                    >
                                        <option value="stateless">Stateless</option>
                                        <option value="stateful">Stateful</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <button className="text-slate-400 hover:text-white"><Download size={16} /></button>
                    </div>
                    <pre className="p-4 overflow-auto flex-1">
                        {framework === 'flutter' ? generateFlutterCode(rootNode, 'MyPage', flutterStateful) : generateFullCode(rootNode)}
                    </pre>
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