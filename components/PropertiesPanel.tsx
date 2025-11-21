
import React, { useState } from 'react';
import { ComponentNode, LibraryType } from '../types';
import { Settings2, Layout, Palette, Square, Star, Ban, MousePointerClick, Move, Code, TableProperties, MousePointer2, Plus, Trash2, Image as ImageIcon, Type, FileText, Server, Link as LinkIcon, CheckCircle, Users, ThumbsUp, List, AppWindow, MoreVertical, FoldVertical } from 'lucide-react';

interface PropertiesPanelProps {
  node: ComponentNode | null;
  onChange: (updates: Partial<ComponentNode>) => void;
  onStyleChange: (styleUpdates: any) => void;
}

export default function PropertiesPanel({ node, onChange, onStyleChange }: PropertiesPanelProps) {
  // Local state for adding new table column
  const [newColType, setNewColType] = useState('button');
  const [newColHeader, setNewColHeader] = useState('');
  const [newColContent, setNewColContent] = useState('');
  const [newColFunc, setNewColFunc] = useState('');

  // Local state for adding form field
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');

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

  const handleJsonChange = (value: string, propName: string = 'data') => {
      try {
          const parsed = JSON.parse(value);
          onChange({ props: { ...node.props, [propName]: parsed } });
      } catch (e) {
          // Allow user to type invalid JSON while editing
      }
  };

  const addCustomColumn = () => {
      if (!newColHeader) return;
      const newCol = {
          id: Date.now().toString(),
          type: newColType,
          header: newColHeader,
          content: newColContent,
          actionFunction: newColFunc || `handle${newColHeader.replace(/\s+/g, '')}`
      };
      const existingCols = node.props.customColumns || [];
      onChange({ props: { ...node.props, customColumns: [...existingCols, newCol] } });
      
      // Reset form
      setNewColHeader('');
      setNewColContent('');
      setNewColFunc('');
  };

  const removeCustomColumn = (id: string) => {
      const existingCols = node.props.customColumns || [];
      onChange({ props: { ...node.props, customColumns: existingCols.filter((c: any) => c.id !== id) } });
  };

  const addFormField = () => {
      if (!newFieldName || !newFieldLabel) return;
      const newField = {
          id: Date.now().toString(),
          type: newFieldType,
          name: newFieldName.replace(/\s+/g, '_').toLowerCase(), // Ensure valid key
          label: newFieldLabel,
          placeholder: newFieldPlaceholder,
          required: newFieldRequired,
          options: (newFieldType === 'select' || newFieldType === 'radio') && newFieldOptions 
             ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean) 
             : undefined
      };
      const existingFields = node.props.fields || [];
      onChange({ props: { ...node.props, fields: [...existingFields, newField] } });
      
      // Reset
      setNewFieldName('');
      setNewFieldLabel('');
      setNewFieldPlaceholder('');
      setNewFieldRequired(false);
      setNewFieldOptions('');
  };

  const removeFormField = (id: string) => {
      const existingFields = node.props.fields || [];
      onChange({ props: { ...node.props, fields: existingFields.filter((f: any) => f.id !== id) } });
  };

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
           <h3 className={sectionHeaderClass}><Settings2 size={14} /> General</h3>
           
           <div className="space-y-4">
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1.5">Library</label>
               <select className={inputClass} value={node.library} onChange={(e) => onChange({ library: e.target.value as LibraryType })}>
                 <option value="radix">Radix UI (Default)</option>
                 <option value="shadcn">Shadcn UI</option>
                 <option value="plain">Plain HTML/Tailwind</option>
               </select>
             </div>

             {(node.type === 'text' || node.type === 'button' || node.type === 'input' || node.type === 'textarea' || node.type === 'select' || node.type === 'checkbox' || node.type === 'switch') && (
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1.5">
                   {node.type === 'input' || node.type === 'textarea' ? 'Placeholder' : (node.type === 'checkbox' || node.type === 'switch' ? 'Label Text' : 'Content')}
                 </label>
                 <input type="text" className={inputClass} value={node.content || ''} onChange={(e) => onChange({ content: e.target.value })} />
               </div>
             )}

            {(node.type === 'checkbox' || node.type === 'switch') && (
                <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="checkedState" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={!!node.props.checked} onChange={(e) => onChange({ props: { ...node.props, checked: e.target.checked } })} />
                    <label htmlFor="checkedState" className="text-sm text-gray-700">Checked by default</label>
                </div>
            )}

             {node.type === 'icon' && (
                 <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-2"><Star size={12} /> Icon Name</label>
                     <input type="text" className={inputClass} value={node.iconName || ''} onChange={(e) => onChange({ iconName: e.target.value })} placeholder="Home, User..." />
                 </div>
             )}
             
             {node.type === 'container' && (
                 <div className="flex items-center gap-2 mt-2">
                    <input 
                        type="checkbox" 
                        id="cursorPointer" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={node.style.cursor === 'pointer'} 
                        onChange={(e) => onStyleChange({ cursor: e.target.checked ? 'pointer' : 'default' })} 
                    />
                    <label htmlFor="cursorPointer" className="text-sm text-gray-700 flex items-center gap-1"><MousePointerClick size={12}/> Clickable (Hover Effect)</label>
                </div>
             )}
           </div>
        </section>
        
        {/* Avatar Group Properties */}
        {node.type === 'avatarGroup' && (
            <section>
                <h3 className={sectionHeaderClass}><Users size={14} /> Avatar Configuration</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Max Display Count</label>
                        <input 
                            type="number" 
                            className={inputClass} 
                            value={node.props.max || 3} 
                            onChange={(e) => onChange({ props: { ...node.props, max: parseInt(e.target.value) || 1 } })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Images List (JSON Array)</label>
                        <textarea 
                            className={`${inputClass} font-mono text-xs h-28 resize-y`} 
                            defaultValue={JSON.stringify(node.props.images || [], null, 2)}
                            onBlur={(e) => handleJsonChange(e.target.value, 'images')}
                            placeholder='["url1", "url2"]'
                        />
                    </div>
                </div>
            </section>
        )}

        {/* Interaction Properties */}
        {node.type === 'interaction' && (
            <section>
                <h3 className={sectionHeaderClass}><ThumbsUp size={14} /> Interaction Data</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label className="block text-[10px] font-medium text-gray-500 mb-1">Likes</label>
                             <input type="number" className={inputClass} value={node.props.likes || 0} onChange={(e) => onChange({ props: { ...node.props, likes: parseInt(e.target.value) } })} />
                        </div>
                         <div>
                             <label className="block text-[10px] font-medium text-gray-500 mb-1">Dislikes</label>
                             <input type="number" className={inputClass} value={node.props.dislikes || 0} onChange={(e) => onChange({ props: { ...node.props, dislikes: parseInt(e.target.value) } })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Views</label>
                        <input type="number" className={inputClass} value={node.props.views || 0} onChange={(e) => onChange({ props: { ...node.props, views: parseInt(e.target.value) } })} />
                    </div>
                </div>
            </section>
        )}

         {/* Tabs Properties */}
         {node.type === 'tabs' && (
            <section>
                <h3 className={sectionHeaderClass}><AppWindow size={14} /> Tabs Configuration</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Tab Items (JSON)</label>
                        <p className="text-[10px] text-blue-600 mb-1">Use 'icon' for dynamic icons.</p>
                        <textarea 
                            className={`${inputClass} font-mono text-xs h-40 resize-y`} 
                            defaultValue={JSON.stringify(node.props.items || [], null, 2)}
                            onBlur={(e) => handleJsonChange(e.target.value, 'items')}
                            placeholder='[{"id":"1", "label":"Tab 1", "icon":"Home", "content":"Optional HTML"}]'
                        />
                    </div>
                </div>
            </section>
        )}

        {/* Accordion Properties */}
        {node.type === 'accordion' && (
            <section>
                <h3 className={sectionHeaderClass}><FoldVertical size={14} /> Accordion Configuration</h3>
                <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <input type="checkbox" id="allowMultiple" className="rounded border-gray-300 text-blue-600" checked={!!node.props.allowMultiple} onChange={(e) => onChange({ props: { ...node.props, allowMultiple: e.target.checked } })} />
                        <label htmlFor="allowMultiple" className="text-sm text-gray-700">Allow Multiple Open</label>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Accordion Items (JSON)</label>
                        <p className="text-[10px] text-blue-600 mb-1">Use 'icon' for dynamic icons.</p>
                        <textarea 
                            className={`${inputClass} font-mono text-xs h-40 resize-y`} 
                            defaultValue={JSON.stringify(node.props.items || [], null, 2)}
                            onBlur={(e) => handleJsonChange(e.target.value, 'items')}
                            placeholder='[{"id":"1", "title":"Item 1", "icon":"Plus", "content":"Content..."}]'
                        />
                    </div>
                </div>
            </section>
        )}

        {/* Dropdown Properties */}
        {node.type === 'dropdown' && (
             <section>
                <h3 className={sectionHeaderClass}><MoreVertical size={14} /> Menu Configuration</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Trigger Button Label</label>
                        <input type="text" className={inputClass} value={node.props.label || ''} onChange={(e) => onChange({ props: { ...node.props, label: e.target.value } })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Menu Items (JSON)</label>
                        <p className="text-[10px] text-blue-600 mb-1">Use 'icon' for dynamic icons.</p>
                        <textarea 
                            className={`${inputClass} font-mono text-xs h-40 resize-y`} 
                            defaultValue={JSON.stringify(node.props.items || [], null, 2)}
                            onBlur={(e) => handleJsonChange(e.target.value, 'items')}
                            placeholder='[{"id":"edit", "label":"Edit", "icon":"Edit"}]'
                        />
                    </div>
                </div>
            </section>
        )}

        {/* Dynamic List Properties */}
        {node.type === 'list' && (
             <section>
                <h3 className={sectionHeaderClass}><List size={14} /> List Configuration</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="pagination" className="rounded border-gray-300 text-blue-600" checked={!!node.props.pagination} onChange={(e) => onChange({ props: { ...node.props, pagination: e.target.checked } })} />
                        <label htmlFor="pagination" className="text-sm text-gray-700">Enable Pagination</label>
                    </div>
                    {node.props.pagination && (
                         <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Items Per Page</label>
                            <input type="number" className={inputClass} value={node.props.itemsPerPage || 5} onChange={(e) => onChange({ props: { ...node.props, itemsPerPage: parseInt(e.target.value) } })} />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">List Items (JSON)</label>
                         <p className="text-[10px] text-blue-600 mb-1">Use 'icon' for dynamic icons.</p>
                        <textarea 
                            className={`${inputClass} font-mono text-xs h-40 resize-y`} 
                            defaultValue={JSON.stringify(node.props.items || [], null, 2)}
                            onBlur={(e) => handleJsonChange(e.target.value, 'items')}
                            placeholder='[{"id":1, "title":"Item 1", "description":"...", "icon":"File"}]'
                        />
                    </div>
                </div>
            </section>
        )}

        {/* Form Builder Properties */}
        {node.type === 'form' && (
            <>
            <section>
                <h3 className={sectionHeaderClass}><Server size={14} /> Submission</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Submission Mode</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => onChange({ props: { ...node.props, mode: 'serverAction' } })}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${node.props.mode === 'serverAction' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            >Server Action</button>
                            <button 
                                onClick={() => onChange({ props: { ...node.props, mode: 'api' } })}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${node.props.mode === 'api' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            >API Route</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            {node.props.mode === 'serverAction' ? 'Action Name' : 'API Endpoint'}
                        </label>
                        <input 
                            type="text" 
                            className={inputClass} 
                            placeholder={node.props.mode === 'serverAction' ? 'submitForm' : '/api/submit'}
                            value={node.props.endpoint || ''} 
                            onChange={(e) => onChange({ props: { ...node.props, endpoint: e.target.value } })}
                        />
                    </div>
                </div>
            </section>

            <section>
                <h3 className={sectionHeaderClass}><FileText size={14} /> Form Fields</h3>
                
                {/* Existing Fields List */}
                <div className="space-y-2 mb-4">
                    {node.props.fields?.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-2 bg-slate-50 border border-gray-200 rounded text-xs group">
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-gray-700">{f.label}</span>
                                <div className="flex gap-2 text-[10px] text-gray-400">
                                    <span>{f.name}</span>
                                    <span>•</span>
                                    <span className="uppercase">{f.type}</span>
                                    {f.required && <span className="text-red-400">• Req</span>}
                                </div>
                            </div>
                            <button onClick={() => removeFormField(f.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add New Field */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-500">Add New Field</h4>
                    <div>
                         <label className="block text-[10px] text-gray-500 mb-1">Input Type</label>
                         <select className={inputClass} value={newFieldType} onChange={e => setNewFieldType(e.target.value)}>
                             <option value="text">Text</option>
                             <option value="email">Email</option>
                             <option value="password">Password</option>
                             <option value="number">Number</option>
                             <option value="textarea">Textarea</option>
                             <option value="select">Select / Dropdown</option>
                             <option value="radio">Radio Group</option>
                             <option value="checkbox">Checkbox</option>
                             <option value="switch">Switch</option>
                         </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Label</label>
                            <input type="text" className="w-full text-xs border rounded p-1.5" placeholder="Full Name" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Key Name (Code)</label>
                            <input type="text" className="w-full text-xs border rounded p-1.5" placeholder="full_name" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} />
                        </div>
                    </div>
                    {(newFieldType !== 'checkbox' && newFieldType !== 'switch' && newFieldType !== 'radio') && (
                         <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Placeholder</label>
                            <input type="text" className="w-full text-xs border rounded p-1.5" placeholder="Enter value..." value={newFieldPlaceholder} onChange={e => setNewFieldPlaceholder(e.target.value)} />
                         </div>
                    )}
                    {(newFieldType === 'select' || newFieldType === 'radio') && (
                        <div>
                             <label className="block text-[10px] text-gray-500 mb-1">Options (Comma separated)</label>
                             <input type="text" className="w-full text-xs border rounded p-1.5" placeholder="Option 1, Option 2" value={newFieldOptions} onChange={e => setNewFieldOptions(e.target.value)} />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="req" className="rounded border-gray-300 text-blue-600" checked={newFieldRequired} onChange={e => setNewFieldRequired(e.target.checked)} />
                        <label htmlFor="req" className="text-xs text-gray-600">Required Field</label>
                    </div>
                    <button onClick={addFormField} className="w-full py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700 flex items-center justify-center gap-1">
                        <Plus size={12} /> Add Input
                    </button>
                </div>
            </section>
            </>
        )}
        
        {/* Table Properties */}
        {node.type === 'table' && (
            <>
            <section>
                <h3 className={sectionHeaderClass}><TableProperties size={14} /> Table Data (JSON)</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">JSON Array</label>
                    <textarea 
                        className={`${inputClass} font-mono text-xs h-40 resize-y`} 
                        defaultValue={JSON.stringify(node.props.data, null, 2)}
                        onBlur={(e) => handleJsonChange(e.target.value)}
                        placeholder='[{"id":1, "name":"John"}]'
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Paste array of objects. Columns are auto-generated.</p>
                </div>
            </section>
            
            <section>
                <h3 className={sectionHeaderClass}><MousePointer2 size={14} /> Custom Actions / Columns</h3>
                
                {/* List Existing Custom Columns */}
                <div className="space-y-2 mb-4">
                    {node.props.customColumns?.map((col: any) => (
                        <div key={col.id} className="flex items-center justify-between p-2 bg-slate-50 border border-gray-200 rounded text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-600">{col.header}</span>
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] uppercase">{col.type}</span>
                            </div>
                            <button onClick={() => removeCustomColumn(col.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add New Column Form */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-500">Add New Column</h4>
                    <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Type</label>
                        <div className="flex gap-1">
                            <button onClick={() => setNewColType('button')} className={`flex-1 py-1 text-[10px] border rounded ${newColType === 'button' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}>Button</button>
                            <button onClick={() => setNewColType('icon')} className={`flex-1 py-1 text-[10px] border rounded ${newColType === 'icon' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}>Icon</button>
                            <button onClick={() => setNewColType('image')} className={`flex-1 py-1 text-[10px] border rounded ${newColType === 'image' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}>Image</button>
                             <button onClick={() => setNewColType('text')} className={`flex-1 py-1 text-[10px] border rounded ${newColType === 'text' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}>Label</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Header Title</label>
                            <input type="text" className="w-full text-xs border rounded p-1.5" placeholder="e.g. Edit" value={newColHeader} onChange={e => setNewColHeader(e.target.value)} />
                        </div>
                        <div>
                             <label className="block text-[10px] text-gray-500 mb-1">{newColType === 'icon' ? 'Icon Name' : newColType === 'image' ? 'Image URL' : 'Label/Text'}</label>
                             <input type="text" className="w-full text-xs border rounded p-1.5" placeholder={newColType === 'icon' ? 'Edit' : 'Click me'} value={newColContent} onChange={e => setNewColContent(e.target.value)} />
                        </div>
                    </div>
                    {(newColType === 'button' || newColType === 'icon') && (
                        <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Function Name</label>
                            <input type="text" className="w-full text-xs border rounded p-1.5" placeholder="e.g. handleEdit" value={newColFunc} onChange={e => setNewColFunc(e.target.value)} />
                        </div>
                    )}
                    <button onClick={addCustomColumn} className="w-full py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700 flex items-center justify-center gap-1">
                        <Plus size={12} /> Add Column
                    </button>
                </div>

                {/* Deprecated/Legacy Single Action Support (kept for backward compatibility) */}
                <div className="mt-6 pt-4 border-t border-gray-200 opacity-60 hover:opacity-100 transition-opacity">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Legacy Action (Single)</h4>
                    <div className="space-y-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Action Button Label</label>
                            <input 
                                type="text" 
                                className={inputClass} 
                                placeholder="e.g., Edit, View"
                                value={node.props.actionLabel || ''} 
                                onChange={(e) => onChange({ props: { ...node.props, actionLabel: e.target.value } })} 
                            />
                        </div>
                    </div>
                </div>
            </section>
            </>
        )}

        {/* Positioning */}
        <section>
            <h3 className={sectionHeaderClass}><Move size={14} /> Positioning</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Position</label>
                    <select className={inputClass} value={node.style.position || 'relative'} onChange={(e) => onStyleChange({ position: e.target.value })}>
                        <option value="relative">Relative (Default)</option>
                        <option value="absolute">Absolute</option>
                        <option value="fixed">Fixed</option>
                        <option value="static">Static</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                    <div><label className="block text-[10px] font-medium text-gray-400 mb-1">Top</label><input type="text" className="w-full text-xs border border-gray-200 rounded p-1" placeholder="auto" value={node.style.top || ''} onChange={(e) => onStyleChange({ top: e.target.value })} /></div>
                    <div><label className="block text-[10px] font-medium text-gray-400 mb-1">Right</label><input type="text" className="w-full text-xs border border-gray-200 rounded p-1" placeholder="auto" value={node.style.right || ''} onChange={(e) => onStyleChange({ right: e.target.value })} /></div>
                    <div><label className="block text-[10px] font-medium text-gray-400 mb-1">Bottom</label><input type="text" className="w-full text-xs border border-gray-200 rounded p-1" placeholder="auto" value={node.style.bottom || ''} onChange={(e) => onStyleChange({ bottom: e.target.value })} /></div>
                    <div><label className="block text-[10px] font-medium text-gray-400 mb-1">Left</label><input type="text" className="w-full text-xs border border-gray-200 rounded p-1" placeholder="auto" value={node.style.left || ''} onChange={(e) => onStyleChange({ left: e.target.value })} /></div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Z-Index</label>
                    <input type="text" className={inputClass} placeholder="0" value={node.style.zIndex || ''} onChange={(e) => onStyleChange({ zIndex: e.target.value })} />
                </div>
            </div>
        </section>

        {/* Layout Settings */}
        <section>
            <h3 className={sectionHeaderClass}><Layout size={14} /> Layout</h3>
           <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Width</label><input type="text" className={inputClass} placeholder="auto" value={node.style.width || ''} onChange={(e) => onStyleChange({ width: e.target.value })} /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Height</label><input type="text" className={inputClass} placeholder="auto" value={node.style.height || ''} onChange={(e) => onStyleChange({ height: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Min Width</label><input type="text" className={inputClass} placeholder="0px" value={node.style.minWidth || ''} onChange={(e) => onStyleChange({ minWidth: e.target.value })} /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Max Width</label><input type="text" className={inputClass} placeholder="none" value={node.style.maxWidth || ''} onChange={(e) => onStyleChange({ maxWidth: e.target.value })} /></div>
                </div>

                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Flex Direction</label>
                   <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                       <button onClick={() => onStyleChange({ flexDirection: 'row' })} className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${node.style.flexDirection === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Row</button>
                       <button onClick={() => onStyleChange({ flexDirection: 'column' })} className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${node.style.flexDirection === 'column' || !node.style.flexDirection ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Col</button>
                   </div>
                </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Padding</label><input type="text" className={inputClass} placeholder="5px" value={node.style.padding || ''} onChange={(e) => onStyleChange({ padding: e.target.value })} /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Gap</label><input type="text" className={inputClass} placeholder="10px" value={node.style.gap || ''} onChange={(e) => onStyleChange({ gap: e.target.value })} /></div>
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
            <h3 className={sectionHeaderClass}><Palette size={14} /> Appearance</h3>
           <div className="space-y-4">
               <div>
                   <div className="flex justify-between mb-1.5">
                       <label className="block text-xs font-medium text-gray-500">Background</label>
                       <button onClick={() => onStyleChange({ backgroundColor: 'transparent' })} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"><Ban size={10} /> Transparent</button>
                   </div>
                   <div className="flex gap-2">
                       <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-md border border-gray-200 shadow-sm"><input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0" value={node.style.backgroundColor === 'transparent' ? '#ffffff' : node.style.backgroundColor || '#ffffff'} onChange={(e) => onStyleChange({ backgroundColor: e.target.value })} /></div>
                       <input type="text" className={inputClass} value={node.style.backgroundColor || ''} onChange={(e) => onStyleChange({ backgroundColor: e.target.value })} placeholder="#ffffff" />
                   </div>
               </div>
               <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Text Color</label>
                   <div className="flex gap-2">
                       <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-md border border-gray-200 shadow-sm"><input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" value={node.style.color || '#000000'} onChange={(e) => onStyleChange({ color: e.target.value })} /></div>
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
            <h3 className={sectionHeaderClass}><Square size={14} /> Border</h3>
           <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                   <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Radius</label><input type="text" className={inputClass} placeholder="4px" value={node.style.borderRadius || ''} onChange={(e) => onStyleChange({ borderRadius: e.target.value })} /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Width (All)</label><input type="text" className={inputClass} placeholder="1px" value={node.style.borderWidth || ''} onChange={(e) => onStyleChange({ borderWidth: e.target.value })} /></div>
               </div>
               
               <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                    <div><label className="block text-[10px] font-medium text-gray-400 mb-1">Top</label><input type="text" className="w-full text-xs border border-gray-200 rounded p-1" placeholder="0px" value={node.style.borderTop || ''} onChange={(e) => onStyleChange({ borderTop: e.target.value })} /></div>
                    <div><label className="block text-[10px] font-medium text-gray-400 mb-1">Right</label><input type="text" className="w-full text-xs border border-gray-200 rounded p-1" placeholder="0px" value={node.style.borderRight || ''} onChange={(e) => onStyleChange({ borderRight: e.target.value })} /></div>
                    <div><label className="block text-[10px] font-medium text-gray-400 mb-1">Bottom</label><input type="text" className="w-full text-xs border border-gray-200 rounded p-1" placeholder="0px" value={node.style.borderBottom || ''} onChange={(e) => onStyleChange({ borderBottom: e.target.value })} /></div>
                    <div><label className="block text-[10px] font-medium text-gray-400 mb-1">Left</label><input type="text" className="w-full text-xs border border-gray-200 rounded p-1" placeholder="0px" value={node.style.borderLeft || ''} onChange={(e) => onStyleChange({ borderLeft: e.target.value })} /></div>
               </div>

               <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Border Color</label>
                   <div className="flex gap-2">
                       <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-md border border-gray-200 shadow-sm"><input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0" value={node.style.borderColor || '#e5e7eb'} onChange={(e) => onStyleChange({ borderColor: e.target.value })} /></div>
                       <input type="text" className={inputClass} value={node.style.borderColor || ''} onChange={(e) => onStyleChange({ borderColor: e.target.value })} placeholder="#e5e7eb" />
                   </div>
               </div>
           </div>
        </section>

        {/* Events */}
        <section>
            <h3 className={sectionHeaderClass}><Code size={14} /> Events</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">OnClick Function</label>
                    <input 
                        type="text" 
                        className={inputClass} 
                        placeholder="handleClick" 
                        value={node.events?.onClick || ''} 
                        onChange={(e) => onChange({ events: { ...node.events, onClick: e.target.value } })} 
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Enter function name (e.g., handleSubmit)</p>
                </div>
            </div>
        </section>

      </div>
    </div>
  );
}