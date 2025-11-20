
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

  // Background & Color
  if (style.backgroundColor && style.backgroundColor !== '#ffffff') classes.push(`bg-[${style.backgroundColor}]`);
  else if (style.backgroundColor === '#f8fafc') classes.push('bg-slate-50');
  
  if (style.color) classes.push(`text-[${style.color}]`);

  // Spacing
  if (style.padding) classes.push(`p-[${style.padding}]`);
  if (style.margin) classes.push(`m-[${style.margin}]`);
  if (style.marginBottom) classes.push(`mb-[${style.marginBottom}]`);
  
  // Borders
  if (style.borderRadius) classes.push(`rounded-[${style.borderRadius}]`);
  if (style.borderWidth && style.borderWidth !== '0px') classes.push(`border-[${style.borderWidth}]`);
  if (style.borderColor) classes.push(`border-[${style.borderColor}]`);
  
  // Individual Borders
  if (style.borderRight) classes.push(`border-r-[${style.borderRight}]`);
  if (style.borderBottom) classes.push(`border-b-[${style.borderBottom}]`);
  if (style.borderTop) classes.push(`border-t-[${style.borderTop}]`);
  if (style.borderLeft) classes.push(`border-l-[${style.borderLeft}]`);
  
  // Flexbox
  const needsFlex = style.flexDirection || style.justifyContent || style.alignItems || style.gap;
  const isContainer = type === 'container' || type === 'card';
  const isButtonWithChildren = type === 'button'; 

  if (needsFlex || isContainer || isButtonWithChildren) {
      if (style.flexDirection === 'column') classes.push('flex flex-col');
      else classes.push('flex flex-row');
  }
  
  if (style.justifyContent === 'center') classes.push('justify-center');
  else if (style.justifyContent === 'space-between') classes.push('justify-between');
  else if (style.justifyContent === 'flex-end') classes.push('justify-end');
  
  if (style.alignItems === 'center') classes.push('items-center');
  else if (style.alignItems === 'flex-end') classes.push('items-end');
  else if (style.alignItems === 'stretch') classes.push('items-stretch');
  
  if (style.gap) classes.push(`gap-[${style.gap}]`);
  if (style.flexGrow === 1) classes.push('grow');
  if (style.flexGrow === 0) classes.push('grow-0');
  
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
  if (style.overflow) classes.push(`overflow-${style.overflow}`);
  
  if (style.boxShadow) classes.push('shadow-md');
  if (style.fontSize) classes.push(`text-[${style.fontSize}]`);
  if (style.fontWeight) classes.push(`font-[${style.fontWeight}]`);
  
  if (style.cursor) {
      classes.push(`cursor-${style.cursor}`);
      if (style.cursor === 'pointer' && type === 'container') {
          classes.push('hover:bg-slate-100 hover:text-slate-900 transition-colors');
      }
  }

  return classes.join(' ');
};

const collectImports = (node: ComponentNode, imports: Set<string>, components: Set<string>) => {
    if (node.href) imports.add('import Link from "next/link"');

    // Shadcn Imports
    if (node.library === 'shadcn') {
        if (node.type === 'button') imports.add('import { Button } from "@/components/ui/button"');
        if (node.type === 'card') imports.add('import { Card, CardContent } from "@/components/ui/card"');
        if (node.type === 'input') imports.add('import { Input } from "@/components/ui/input"');
        if (node.type === 'textarea') imports.add('import { Textarea } from "@/components/ui/textarea"');
        if (node.type === 'checkbox') imports.add('import { Checkbox } from "@/components/ui/checkbox"');
        if (node.type === 'switch') imports.add('import { Switch } from "@/components/ui/switch"');
        if (node.type === 'select') imports.add('import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"');
        if (node.type === 'divider') imports.add('import { Separator } from "@/components/ui/separator"');
    }
    
    // Radix Imports
    if (node.library === 'radix') {
        if (node.type === 'switch') imports.add('import * as Switch from "@radix-ui/react-switch"');
        if (node.type === 'checkbox') {
            imports.add('import * as Checkbox from "@radix-ui/react-checkbox"');
            imports.add('import { Check } from "lucide-react"');
        }
        // Other Radix primitives are typically plain HTML with logic, but here we map what we use.
    }
    
    // Table needs icons for pagination/search
    if (node.type === 'table') {
        imports.add('import { Search, ChevronLeft, ChevronRight } from "lucide-react"');
    }

    node.children.forEach(child => collectImports(child, imports, components));
};

const hasTable = (node: ComponentNode): boolean => {
    if (node.type === 'table') return true;
    return node.children.some(hasTable);
};

const generateNode = (node: ComponentNode, indent: number = 0): string => {
  const spaces = '  '.repeat(indent);
  const twClasses = styleToTailwind(node.style, node.type);
  const classNameProp = twClasses ? `className="${twClasses}"` : '';
  
  // Event Handlers
  const eventProps = node.events?.onClick ? ` onClick={${node.events.onClick}}` : '';

  const wrapLink = (content: string) => {
      if (node.href) return `${spaces}<Link href="${node.href}">\n  ${content}\n${spaces}</Link>`;
      return content;
  };

  // --- Table Generation ---
  if (node.type === 'table') {
      const dataStr = JSON.stringify(node.props.data || [], null, 2);
      const headers = node.props.data && node.props.data.length > 0 ? Object.keys(node.props.data[0]) : [];
      
      // Logic is hoisted to the main component, here we render the UI relying on state
      return `
${spaces}<div ${classNameProp}>
${spaces}  <div className="p-3 border-b border-gray-200 bg-white flex items-center gap-2">
${spaces}    <Search size={16} className="text-gray-400" />
${spaces}    <input 
${spaces}       type="text" 
${spaces}       placeholder="Search..." 
${spaces}       className="text-sm outline-none w-full text-gray-700 placeholder:text-gray-400"
${spaces}       value={searchTerm}
${spaces}       onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
${spaces}    />
${spaces}  </div>
${spaces}  <div className="flex-1 overflow-auto">
${spaces}    <table className="w-full text-sm text-left">
${spaces}      <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
${spaces}        <tr>
${spaces}          {${JSON.stringify(headers)}.map(h => (
${spaces}             <th key={h} className="px-4 py-3 font-semibold">{h}</th>
${spaces}          ))}
${spaces}        </tr>
${spaces}      </thead>
${spaces}      <tbody>
${spaces}        {paginatedData.length > 0 ? paginatedData.map((row: any, i: number) => (
${spaces}          <tr key={i} className="border-b last:border-0 even:bg-slate-50 hover:bg-blue-50 transition-colors">
${spaces}            {${JSON.stringify(headers)}.map(h => (
${spaces}               <td key={h} className="px-4 py-3 text-gray-600">{row[h]}</td>
${spaces}            ))}
${spaces}          </tr>
${spaces}        )) : (
${spaces}          <tr><td colSpan={${headers.length}} className="text-center py-4 text-gray-500">No records</td></tr>
${spaces}        )}
${spaces}      </tbody>
${spaces}    </table>
${spaces}  </div>
${spaces}  {totalPages > 1 && (
${spaces}    <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-500">
${spaces}       <span>Page {currentPage} of {totalPages}</span>
${spaces}       <div className="flex gap-1">
${spaces}         <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
${spaces}         <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
${spaces}       </div>
${spaces}    </div>
${spaces}  )}
${spaces}</div>`;
  }

  // --- Shadcn Library ---
  if (node.library === 'shadcn') {
      if (node.type === 'button') {
          const variant = node.props.variant ? `variant="${node.props.variant}"` : '';
          const content = node.children.length > 0 
             ? `\n${node.children.map(c => generateNode(c, indent + 1)).join('\n')}\n${spaces}` 
             : (node.content || 'Button');
          return wrapLink(`${spaces}<Button ${variant} ${classNameProp}${eventProps}>${content}</Button>`);
      }
      if (node.type === 'input') return `${spaces}<Input placeholder="${node.content || ''}" ${classNameProp}${eventProps} />`;
      if (node.type === 'textarea') return `${spaces}<Textarea placeholder="${node.content || ''}" ${classNameProp}${eventProps} />`;
      if (node.type === 'checkbox') return `${spaces}<div className="flex items-center gap-2">\n${spaces}  <Checkbox id="${node.id}" ${node.props.checked ? 'defaultChecked' : ''} />\n${spaces}  <label htmlFor="${node.id}" className="text-sm font-medium">${node.content || 'Checkbox'}</label>\n${spaces}</div>`;
      if (node.type === 'switch') return `${spaces}<div className="flex items-center gap-2">\n${spaces}  <Switch id="${node.id}" ${node.props.checked ? 'defaultChecked' : ''} />\n${spaces}  <label htmlFor="${node.id}" className="text-sm font-medium">${node.content || 'Switch Label'}</label>\n${spaces}</div>`;
      if (node.type === 'divider') return `${spaces}<Separator ${classNameProp} />`;
      if (node.type === 'select') return `${spaces}<Select>\n${spaces}  <SelectTrigger ${classNameProp}>\n${spaces}    <SelectValue placeholder="${node.content || 'Select...'}" />\n${spaces}  </SelectTrigger>\n${spaces}  <SelectContent>\n${spaces}    <SelectItem value="1">Option 1</SelectItem>\n${spaces}</SelectContent>\n${spaces}</Select>`;
      if (node.type === 'card') {
          const childrenCode = node.children.map(c => generateNode(c, indent + 2)).join('\n');
          return wrapLink(`${spaces}<Card ${classNameProp}${eventProps}>\n${spaces}  <CardContent className="p-6">\n${childrenCode}\n${spaces}  </CardContent>\n${spaces}</Card>`);
      }
  }

  // --- Radix Library (and Fallbacks) ---
  // Radix primitives often require detailed composition. We generate the structure.
  if (node.library === 'radix') {
      if (node.type === 'switch') {
          return `${spaces}<div className="flex items-center gap-2">\n${spaces}  <Switch.Root className="${twClasses} w-[42px] h-[25px] bg-black/50 rounded-full relative shadow-sm data-[state=checked]:bg-black outline-none cursor-default" ${node.props.checked ? 'defaultChecked' : ''} id="${node.id}"${eventProps}>\n${spaces}    <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-sm transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />\n${spaces}  </Switch.Root>\n${spaces}  <label className="text-sm" htmlFor="${node.id}">${node.content}</label>\n${spaces}</div>`;
      }
      if (node.type === 'checkbox') {
          return `${spaces}<div className="flex items-center gap-2">\n${spaces}  <Checkbox.Root className="${twClasses} flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] shadow-black/10 outline-none focus:shadow-[0_0_0_2px_black]" ${node.props.checked ? 'defaultChecked' : ''} id="${node.id}"${eventProps}>\n${spaces}    <Checkbox.Indicator className="text-black">\n${spaces}      <Check size={16} />\n${spaces}    </Checkbox.Indicator>\n${spaces}  </Checkbox.Root>\n${spaces}  <label className="text-sm" htmlFor="${node.id}">${node.content}</label>\n${spaces}</div>`;
      }
      // Radix doesn't have primitives for basic HTML elements like Button/Input/Div, so we use standard HTML + Tailwind
  }

  // --- Standard HTML / Common ---
  if (node.type === 'text') return wrapLink(`${spaces}<div ${classNameProp}${eventProps}>${node.content || ''}</div>`);
  if (node.type === 'image') return wrapLink(`${spaces}<img src="${node.content || "https://picsum.photos/200"}" alt="image" ${classNameProp}${eventProps} />`);
  if (node.type === 'icon') {
      const IconName = node.iconName || 'Box';
      return `${spaces}<${IconName} size={24} ${classNameProp}${eventProps} />`;
  }
  if (node.type === 'input') return `${spaces}<input placeholder="${node.content || ''}" ${classNameProp}${eventProps} />`;
  if (node.type === 'textarea') return `${spaces}<textarea placeholder="${node.content || ''}" ${classNameProp}${eventProps} />`;
  if (node.type === 'button') {
      const content = node.children.length > 0 
         ? `\n${node.children.map(c => generateNode(c, indent + 1)).join('\n')}\n${spaces}` 
         : (node.content || 'Button');
      return wrapLink(`${spaces}<button ${classNameProp}${eventProps}>${content}</button>`);
  }

  const childrenCode = node.children.map((child) => generateNode(child, indent + 1)).join('\n');
  return wrapLink(`${spaces}<div ${classNameProp}${eventProps}>\n${childrenCode}\n${spaces}</div>`);
};

export const generateFullCode = (root: ComponentNode) => {
  const imports = new Set<string>();
  const components = new Set<string>();
  const lucideIcons = new Set<string>();
  const useTable = hasTable(root);

  if (useTable) {
      imports.add('import { useState, useMemo } from "react"');
  }

  collectImports(root, imports, components);
  
  const gatherIcons = (n: ComponentNode) => {
      if(n.type === 'icon' && n.iconName) lucideIcons.add(n.iconName);
      n.children.forEach(gatherIcons);
  }
  gatherIcons(root);

  let importBlock = Array.from(imports).join('\n') + '\n';
  if (lucideIcons.size > 0) {
      importBlock += `import { ${Array.from(lucideIcons).join(', ')} } from 'lucide-react';\n`;
  }

  // Logic injection for Table if exists
  let componentLogic = '';
  
  if (useTable) {
      // Find the table data. For this simple generator, we pick the first table's data or a generic one.
      // In a real app you'd extract all data variables. Here we assume one table for simplicity of generation logic.
      const findTableData = (n: ComponentNode): any => {
          if (n.type === 'table') return n.props.data;
          for (const c of n.children) {
              const d = findTableData(c);
              if (d) return d;
          }
          return null;
      }
      const tableData = findTableData(root) || [];
      
      componentLogic = `
  const tableData = ${JSON.stringify(tableData, null, 2)};
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((item: any) => 
        Object.values(item).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
      `;
  }

  return `import React from 'react';
${importBlock}

export default function Page() {
  ${componentLogic}
  // Event Handlers
  return (
${generateNode(root, 2)}
  );
}
`;
};