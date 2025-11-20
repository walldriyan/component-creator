
import { ComponentNode, StyleProps } from "../types";

const styleToTailwind = (style: StyleProps, type: string): string => {
  const classes: string[] = [];
  
  // Positioning
  if (style.position && style.position !== 'static') classes.push(style.position);
  if (style.top) classes.push(`top-[${style.top}]`);
  if (style.left) classes.push(`left-[${style.left}]`);
  if (style.right) classes.push(`right-[${style.right}]`);
  if (style.bottom) classes.push(`bottom-[${style.bottom}]`);
  if (style.zIndex) classes.push(`z-[${style.zIndex}]`);

  // Spacing
  if (style.padding) classes.push(`p-[${style.padding}]`);
  if (style.margin) classes.push(`m-[${style.margin}]`);
  if (style.marginBottom) classes.push(`mb-[${style.marginBottom}]`);

  // Sizing
  if (style.width === '100%') classes.push('w-full');
  else if (style.width === 'auto') classes.push('w-auto');
  else if (style.width) classes.push(`w-[${style.width}]`);

  if (style.height === '100%') classes.push('h-full');
  else if (style.height === 'auto') classes.push('h-auto');
  else if (style.height) classes.push(`h-[${style.height}]`);
  
  if (style.minHeight) classes.push(`min-h-[${style.minHeight}]`);
  if (style.maxWidth) classes.push(`max-w-[${style.maxWidth}]`);
  if (style.minWidth) classes.push(`min-w-[${style.minWidth}]`);

  // Colors & Visuals
  if (style.backgroundColor) classes.push(`bg-[${style.backgroundColor}]`);
  if (style.color) classes.push(`text-[${style.color}]`);
  if (style.borderRadius) classes.push(`rounded-[${style.borderRadius}]`);
  if (style.boxShadow) classes.push('shadow-md');
  if (style.cursor) classes.push(`cursor-${style.cursor}`);
  if (style.overflow) classes.push(`overflow-${style.overflow}`);

  // Borders
  if (style.borderWidth) classes.push(`border-[${style.borderWidth}]`);
  if (style.borderColor) classes.push(`border-[${style.borderColor}]`);
  if (style.borderStyle) classes.push(`border-${style.borderStyle}`);
  if (style.borderTop) classes.push(`border-t-[${style.borderTop}]`);
  if (style.borderBottom) classes.push(`border-b-[${style.borderBottom}]`);
  if (style.borderLeft) classes.push(`border-l-[${style.borderLeft}]`);
  if (style.borderRight) classes.push(`border-r-[${style.borderRight}]`);

  // Flex
  if (style.flexDirection || style.gap || style.justifyContent || style.alignItems) classes.push('flex');
  if (style.flexDirection) classes.push(style.flexDirection === 'row' ? 'flex-row' : 'flex-col');
  if (style.justifyContent) classes.push(`justify-${style.justifyContent.replace('flex-', '').replace('space-', '')}`);
  if (style.alignItems) classes.push(`items-${style.alignItems.replace('flex-', '')}`);
  if (style.gap) classes.push(`gap-[${style.gap}]`);
  if (style.flexGrow !== undefined) classes.push(style.flexGrow === 1 ? 'grow' : 'grow-0');

  // Typography
  if (style.fontSize) classes.push(`text-[${style.fontSize}]`);
  if (style.fontWeight) classes.push(`font-[${style.fontWeight}]`);
  if (style.textAlign) classes.push(`text-${style.textAlign}`);

  return classes.join(' ');
};

const generateComponentCode = (node: ComponentNode, indentLevel: number = 0): string => {
  const indent = '  '.repeat(indentLevel);
  const className = styleToTailwind(node.style, node.type);
  const props = Object.entries(node.props)
    .filter(([key]) => !['data', 'customColumns', 'fields', 'images', 'max', 'items', 'label', 'pagination', 'itemsPerPage', 'activeTab'].includes(key)) // handled separately
    .map(([key, val]) => `${key}={${typeof val === 'string' ? `"${val}"` : `{${val}}`}}`)
    .join(' ');

  const eventHandlers = node.events?.onClick ? ` onClick={${node.events.onClick}}` : '';
  
  if (node.type === 'container' || node.type === 'card') {
    return `${indent}<div className="${className}"${eventHandlers}>\n${node.children.map(c => generateComponentCode(c, indentLevel + 1)).join('\n')}\n${indent}</div>`;
  }

  if (node.type === 'text') {
    return `${indent}<div className="${className}">${node.content}</div>`;
  }

  if (node.type === 'button') {
    const variantClass = node.library === 'shadcn' 
        ? (node.props.variant === 'secondary' ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/80' : 'bg-slate-900 text-white hover:bg-slate-900/90')
        : 'bg-slate-900 text-white';
    return `${indent}<button className="${className} ${variantClass} px-4 py-2 rounded-md"${eventHandlers}>${node.content}</button>`;
  }

  if (node.type === 'input') return `${indent}<input placeholder="${node.content}" className="${className}" disabled />`;
  if (node.type === 'textarea') return `${indent}<textarea placeholder="${node.content}" className="${className}" disabled />`;
  if (node.type === 'select') return `${indent}<select className="${className}"><option>{node.content}</option></select>`;
  if (node.type === 'image') return `${indent}<img src="${node.content}" className="${className} object-cover" />`;
  if (node.type === 'divider') return `${indent}<div className="${className}" />`;
  
  if (node.type === 'checkbox') {
     return `${indent}<div className="${className}">\n${indent}  <div className="w-4 h-4 border border-gray-300 rounded ${node.props.checked ? 'bg-slate-900' : 'bg-white'}" />\n${indent}  <label>${node.content}</label>\n${indent}</div>`;
  }
  if (node.type === 'switch') {
     return `${indent}<div className="${className}">\n${indent}  <div className="w-9 h-5 rounded-full ${node.props.checked ? 'bg-slate-900' : 'bg-gray-200'} p-1"><div className="w-3 h-3 bg-white rounded-full" /></div>\n${indent}  <span>${node.content}</span>\n${indent}</div>`;
  }
  if (node.type === 'icon') {
      return `${indent}<${node.iconName} size={24} className="${className}" />`;
  }

  // Reusable Components Generation
  if (node.type === 'table') {
      const dataVar = `tableData_${node.id.replace(/-/g, '_')}`;
      return `${indent}<div className="${className} overflow-x-auto">\n${indent}  <Table data={${dataVar}} customColumns={${JSON.stringify(node.props.customColumns || [])}} actionLabel="${node.props.actionLabel || ''}" />\n${indent}</div>`;
  }

  if (node.type === 'form') {
     const schemaName = `formSchema_${node.id.replace(/-/g, '_')}`;
     return `${indent}<div className="${className}">\n${indent}  <SmartForm schema={${schemaName}} fields={${JSON.stringify(node.props.fields)}} submitLabel="${node.props.submitLabel}" endpoint="${node.props.endpoint}" mode="${node.props.mode}" />\n${indent}</div>`;
  }

  if (node.type === 'avatarGroup') {
      return `${indent}<div className="${className}">\n${indent}  <AvatarGroup images={${JSON.stringify(node.props.images)}} max={${node.props.max}} />\n${indent}</div>`;
  }

  if (node.type === 'interaction') {
      return `${indent}<div className="${className}">\n${indent}  <Interaction likes={${node.props.likes}} dislikes={${node.props.dislikes}} views={${node.props.views}} />\n${indent}</div>`;
  }

  if (node.type === 'tabs') {
      const itemsVar = `tabsItems_${node.id.replace(/-/g, '_')}`;
      const contentMapVar = `tabsContent_${node.id.replace(/-/g, '_')}`;
      return `${indent}<div className="${className}">\n${indent}  <Tabs items={${itemsVar}} contentMap={${contentMapVar}} defaultActive="${node.props.activeTab}" />\n${indent}</div>`;
  }

  if (node.type === 'list') {
      const itemsVar = `listItems_${node.id.replace(/-/g, '_')}`;
      return `${indent}<div className="${className}">\n${indent}  <PaginatedList items={${itemsVar}} itemsPerPage={${node.props.itemsPerPage || 5}} pagination={${node.props.pagination}} />\n${indent}</div>`;
  }

  if (node.type === 'dropdown') {
      const itemsVar = `dropdownItems_${node.id.replace(/-/g, '_')}`;
      return `${indent}<div className="${className}">\n${indent}  <DropdownMenu label="${node.props.label}" items={${itemsVar}} />\n${indent}</div>`;
  }

  return `${indent}<div className="${className}">Unknown Component</div>`;
};

export const generateFullCode = (root: ComponentNode): string => {
  const imports = new Set(['React', 'useState', 'useCallback', 'useMemo']);
  const icons = new Set<string>();
  
  let hasTable = false;
  let hasForm = false;
  let hasAvatar = false;
  let hasInteraction = false;
  let hasTabs = false;
  let hasList = false;
  let hasDropdown = false;

  // Recursive scanner
  const scan = (node: ComponentNode) => {
      if (node.type === 'icon' && node.iconName) icons.add(node.iconName);
      if (node.type === 'table') { hasTable = true; icons.add('Search'); icons.add('ChevronLeft'); icons.add('ChevronRight'); icons.add('Star'); }
      if (node.type === 'form') { hasForm = true; imports.add('useForm'); imports.add('z'); imports.add('zodResolver'); icons.add('ChevronDown'); }
      if (node.type === 'avatarGroup') { hasAvatar = true; }
      if (node.type === 'interaction') { hasInteraction = true; icons.add('ThumbsUp'); icons.add('ThumbsDown'); icons.add('Eye'); }
      
      if (node.type === 'tabs') { 
          hasTabs = true; 
          if (node.props.items) node.props.items.forEach((i: any) => i.icon && icons.add(i.icon));
      }
      if (node.type === 'list') { 
          hasList = true; 
          icons.add('ChevronLeft'); icons.add('ChevronRight');
          if (node.props.items) node.props.items.forEach((i: any) => i.icon && icons.add(i.icon));
      }
      if (node.type === 'dropdown') { 
          hasDropdown = true; 
          icons.add('ChevronDown');
          if (node.props.items) node.props.items.forEach((i: any) => i.icon && icons.add(i.icon));
      }

      // Scan for icon buttons in table columns
      if (node.type === 'table' && node.props.customColumns) {
          node.props.customColumns.forEach((col: any) => {
              if (col.type === 'icon' && col.content) icons.add(col.content);
          });
      }
      node.children.forEach(scan);
  };
  scan(root);

  let code = `import React, { useState, useCallback, useMemo } from 'react';\n`;
  // Import all used icons from Lucide
  if (icons.size > 0) code += `import { ${Array.from(icons).join(', ')} } from 'lucide-react';\n`;
  if (hasForm) code += `import { useForm } from 'react-hook-form';\nimport { zodResolver } from '@hookform/resolvers/zod';\nimport * as z from 'zod';\n`;
  
  code += `\n// Helper to render dynamic icons
const DynamicIcon = ({ name, size = 16, className }) => {
  const IconMap = { ${Array.from(icons).map(i => `${i}`).join(', ')} };
  const Icon = IconMap[name];
  return Icon ? <Icon size={size} className={className} /> : null;
};\n\n`;

  // Generate Definitions for Reusable Components
  if (hasAvatar) {
      code += `
const AvatarGroup = React.memo(({ images, max }) => {
  const displayed = images.slice(0, max);
  const remaining = Math.max(0, images.length - max);
  return (
    <div className="flex -space-x-4 rtl:space-x-reverse">
      {displayed.map((src, i) => (
        <img key={i} className="w-10 h-10 border-2 border-white rounded-full object-cover" src={src} alt="" />
      ))}
      {remaining > 0 && (
        <div className="flex items-center justify-center w-10 h-10 text-xs font-medium text-white bg-gray-700 border-2 border-white rounded-full">+{remaining}</div>
      )}
    </div>
  );
});\n\n`;
  }

  if (hasInteraction) {
      code += `
const Interaction = React.memo(({ likes: initialLikes, dislikes: initialDislikes, views }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userAction, setUserAction] = useState(null);

  const handleLike = useCallback(() => {
    if (userAction === 'liked') {
        setLikes(prev => prev - 1);
        setUserAction(null);
    } else {
        setLikes(prev => prev + 1);
        if (userAction === 'disliked') setDislikes(prev => prev - 1);
        setUserAction('liked');
    }
    console.log('Action: Like Clicked');
  }, [userAction]);

  const handleDislike = useCallback(() => {
    if (userAction === 'disliked') {
        setDislikes(prev => prev - 1);
        setUserAction(null);
    } else {
        setDislikes(prev => prev + 1);
        if (userAction === 'liked') setLikes(prev => prev - 1);
        setUserAction('disliked');
    }
    console.log('Action: Dislike Clicked');
  }, [userAction]);

  return (
    <div className="flex items-center gap-4 p-2 rounded-lg bg-slate-50 border border-slate-200 w-fit">
       <button onClick={handleLike} className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all \${userAction === 'liked' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-600'}\`}>
          <ThumbsUp size={16} className={userAction === 'liked' ? 'scale-110' : ''} fill={userAction === 'liked' ? 'currentColor' : 'none'} />
          <span>{likes}</span>
       </button>
       <button onClick={handleDislike} className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all \${userAction === 'disliked' ? 'bg-red-100 text-red-600' : 'hover:bg-slate-200 text-slate-600'}\`}>
          <ThumbsDown size={16} className={userAction === 'disliked' ? 'scale-110 mt-1' : ''} fill={userAction === 'disliked' ? 'currentColor' : 'none'} />
          <span>{dislikes}</span>
       </button>
       <div className="w-px h-5 bg-slate-200 mx-1" />
       <div className="flex items-center gap-1.5 px-2 text-sm text-slate-500">
          <Eye size={16} /> <span>{views.toLocaleString()}</span>
       </div>
    </div>
  );
});\n\n`;
  }

  if (hasTabs) {
      code += `
// Dynamic Tabs Component with Content Mapping
const Tabs = React.memo(({ items, defaultActive, contentMap }) => {
  const [activeTab, setActiveTab] = useState(defaultActive || items[0]?.id);
  
  const handleTabClick = useCallback((id) => {
      setActiveTab(id);
      console.log('Tab Changed:', id);
  }, []);

  return (
    <div className="w-full">
      <div className="flex border-b border-slate-200">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={\`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors \${activeTab === item.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}\`}
          >
            {item.icon && <DynamicIcon name={item.icon} />}
            {item.label}
          </button>
        ))}
      </div>
      <div className="p-4 bg-white rounded-b-lg border border-t-0 border-slate-100">
         {/* Render Dynamic Component based on Map or Fallback */}
         {contentMap && contentMap[activeTab] ? contentMap[activeTab] : <div className="text-gray-400 text-sm">No content mapped for this tab.</div>}
      </div>
    </div>
  );
});\n\n`;
  }

  if (hasList) {
      code += `
const PaginatedList = React.memo(({ items, itemsPerPage, pagination }) => {
  const [page, setPage] = useState(1);
  
  const displayItems = useMemo(() => {
     return pagination ? items.slice((page - 1) * itemsPerPage, page * itemsPerPage) : items;
  }, [items, page, itemsPerPage, pagination]);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const handleItemClick = useCallback((item) => {
      console.log('List Item Clicked:', item);
  }, []);

  return (
    <div className="w-full flex flex-col gap-2">
        {displayItems.map((item) => (
            <div 
                key={item.id} 
                onClick={() => handleItemClick(item)}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group"
            >
                {item.icon && <div className="p-2 bg-slate-100 text-slate-600 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600"><DynamicIcon name={item.icon} size={18} /></div>}
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900">{item.title}</h4>
                    {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                </div>
                <DynamicIcon name="ChevronRight" className="text-slate-300 group-hover:text-slate-400" />
            </div>
        ))}
        {pagination && totalPages > 1 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"><DynamicIcon name="ChevronLeft" /></button>
                <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"><DynamicIcon name="ChevronRight" /></button>
            </div>
        )}
    </div>
  );
});\n\n`;
  }

  if (hasDropdown) {
      code += `
const DropdownMenu = React.memo(({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggle = useCallback(() => setIsOpen(p => !p), []);
  const handleSelect = useCallback((id) => {
      console.log('Dropdown Selected:', id);
      setIsOpen(false);
  }, []);

  return (
    <div className="relative inline-block">
        <button onClick={toggle} className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
            {label}
            <DynamicIcon name="ChevronDown" className={\`transition-transform \${isOpen ? 'rotate-180' : ''}\`} />
        </button>
        {isOpen && (
            <div className="absolute top-full mt-1 right-0 w-48 bg-white rounded-md shadow-lg border border-slate-100 py-1 z-50">
                {items.map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={\`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 \${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'}\`}
                    >
                        {item.icon && <DynamicIcon name={item.icon} size={14} />}
                        {item.label}
                    </button>
                ))}
            </div>
        )}
    </div>
  );
});\n\n`;
  }

  // Table Code
  if (hasTable) {
      code += `const Table = ({ data, customColumns, actionLabel }) => { \n  /* ... Table Implementation ... */ \n  return <div className="border rounded-lg p-4">Table Component Placeholder</div>;\n};\n\n`;
  }

  // Form Code
  if (hasForm) {
      code += `const SmartForm = ({ schema, fields, submitLabel, endpoint, mode }) => { \n  /* ... Form Implementation ... */ \n  return <div className="border rounded-lg p-4">Form Component Placeholder</div>;\n};\n\n`;
  }

  // Main Component
  code += `export default function Page() {\n`;
  
  // Generate data variables
  const scanForData = (node: ComponentNode) => {
      if (node.type === 'table') {
          code += `  const tableData_${node.id.replace(/-/g, '_')} = ${JSON.stringify(node.props.data, null, 2)};\n`;
      }
      if (node.type === 'tabs') {
          code += `  const tabsItems_${node.id.replace(/-/g, '_')} = ${JSON.stringify(node.props.items, null, 2)};\n`;
          // Generate the content map for dynamic components
          code += `  const tabsContent_${node.id.replace(/-/g, '_')} = {\n`;
          node.props.items?.forEach((item: any) => {
             code += `    "${item.id}": <div className="p-4 text-slate-600">Dynamic Content for <strong>${item.label}</strong> (Prop Passed Component)</div>,\n`;
          });
          code += `  };\n`;
      }
      if (node.type === 'list') {
          code += `  const listItems_${node.id.replace(/-/g, '_')} = ${JSON.stringify(node.props.items, null, 2)};\n`;
      }
      if (node.type === 'dropdown') {
          code += `  const dropdownItems_${node.id.replace(/-/g, '_')} = ${JSON.stringify(node.props.items, null, 2)};\n`;
      }
      if (node.type === 'form') {
          let schemaStr = 'z.object({';
          node.props.fields?.forEach((f: any) => {
              let fieldSchema = 'z.string()';
              if (f.type === 'email') fieldSchema += '.email()';
              if (f.type === 'number') fieldSchema = 'z.number()';
              if (!f.required) fieldSchema += '.optional()';
              else fieldSchema += '.min(1, "Required")';
              schemaStr += `\n    ${f.name}: ${fieldSchema},`;
          });
          schemaStr += '\n  })';
          code += `  const formSchema_${node.id.replace(/-/g, '_')} = ${schemaStr};\n`;
      }
      node.children.forEach(scanForData);
  };
  scanForData(root);

  code += `\n  return (\n    <div className="min-h-screen bg-white">\n`;
  code += generateComponentCode(root, 3);
  code += `\n    </div>\n  );\n}`;

  return code;
};
