import { ComponentNode, StyleProps } from "../types";

const styleToTailwind = (style: StyleProps, type: string): string => {
  const classes: string[] = [];
  
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
  if (style.borderRight) classes.push(`border-r-[${style.borderRight}]`);
  if (style.borderBottom) classes.push(`border-b-[${style.borderBottom}]`);
  
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

  return classes.join(' ');
};

const collectImports = (node: ComponentNode, imports: Set<string>, components: Set<string>) => {
    if (node.href) imports.add('import Link from "next/link"');

    if (node.library === 'shadcn') {
        if (node.type === 'button') {
            imports.add('import { Button } from "@/components/ui/button"');
        }
        if (node.type === 'card') {
            imports.add('import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"');
        }
        if (node.type === 'input') {
            imports.add('import { Input } from "@/components/ui/input"');
        }
        if (node.type === 'textarea') {
            imports.add('import { Textarea } from "@/components/ui/textarea"');
        }
        if (node.type === 'checkbox') {
            imports.add('import { Checkbox } from "@/components/ui/checkbox"');
        }
        if (node.type === 'switch') {
            imports.add('import { Switch } from "@/components/ui/switch"');
        }
        if (node.type === 'select') {
            imports.add('import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"');
        }
        if (node.type === 'divider') {
            imports.add('import { Separator } from "@/components/ui/separator"');
        }
    }
    node.children.forEach(child => collectImports(child, imports, components));
};

const generateNode = (node: ComponentNode, indent: number = 0): string => {
  const spaces = '  '.repeat(indent);
  const twClasses = styleToTailwind(node.style, node.type);
  const classNameProp = twClasses ? `className="${twClasses}"` : '';

  const wrapLink = (content: string) => {
      if (node.href) return `${spaces}<Link href="${node.href}">\n  ${content}\n${spaces}</Link>`;
      return content;
  };

  if (node.library === 'shadcn') {
      if (node.type === 'button') {
          const variant = node.props.variant ? `variant="${node.props.variant}"` : '';
          const content = node.children.length > 0 
             ? `\n${node.children.map(c => generateNode(c, indent + 1)).join('\n')}\n${spaces}` 
             : (node.content || 'Button');
          return wrapLink(`${spaces}<Button ${variant} ${classNameProp}>${content}</Button>`);
      }

      if (node.type === 'input') return `${spaces}<Input placeholder="${node.content || ''}" ${classNameProp} />`;
      
      if (node.type === 'textarea') return `${spaces}<Textarea placeholder="${node.content || ''}" ${classNameProp} />`;
      
      if (node.type === 'checkbox') return `${spaces}<Checkbox id="${node.id}" ${classNameProp} />`;
      
      if (node.type === 'switch') return `${spaces}<Switch id="${node.id}" ${classNameProp} />`;
      
      if (node.type === 'divider') {
          const orientation = node.style.height && parseInt(node.style.height) > 10 ? 'orientation="vertical"' : '';
          return `${spaces}<Separator ${orientation} ${classNameProp} />`;
      }

      if (node.type === 'select') {
          return `${spaces}<Select>\n${spaces}  <SelectTrigger ${classNameProp}>\n${spaces}    <SelectValue placeholder="${node.content || 'Select...'}" />\n${spaces}  </SelectTrigger>\n${spaces}  <SelectContent>\n${spaces}    <SelectItem value="1">Option 1</SelectItem>\n${spaces}    <SelectItem value="2">Option 2</SelectItem>\n${spaces}  </SelectContent>\n${spaces}</Select>`;
      }

      if (node.type === 'card') {
          let header = '';
          const childrenCode = node.children.map(c => generateNode(c, indent + 2)).join('\n');
          return wrapLink(`${spaces}<Card ${classNameProp}>\n${spaces}  <CardContent className="p-6">\n${childrenCode}\n${spaces}  </CardContent>\n${spaces}</Card>`);
      }
  }

  if (node.type === 'text') return wrapLink(`${spaces}<div ${classNameProp}>${node.content || ''}</div>`);
  if (node.type === 'image') return wrapLink(`${spaces}<img src="${node.content || "https://picsum.photos/200"}" alt="image" ${classNameProp} />`);
  
  if (node.type === 'icon') {
      const IconName = node.iconName || 'Box';
      return `${spaces}<${IconName} size={24} ${classNameProp} />`;
  }

  const childrenCode = node.children.map((child) => generateNode(child, indent + 1)).join('\n');
  return wrapLink(`${spaces}<div ${classNameProp}>\n${childrenCode}\n${spaces}</div>`);
};

export const generateFullCode = (root: ComponentNode) => {
  const imports = new Set<string>();
  const components = new Set<string>();
  const lucideIcons = new Set<string>();

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

  return `import React from 'react';
${importBlock}

export default function Page() {
  return (
${generateNode(root, 2)}
  );
}
`;