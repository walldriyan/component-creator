import { ComponentNode, StyleProps } from "../types";

// Convert internal style object to Tailwind classes
const styleToTailwind = (style: StyleProps, type: string): string => {
  const classes: string[] = [];
  
  // Background
  if (style.backgroundColor && style.backgroundColor !== '#ffffff') {
      classes.push(`bg-[${style.backgroundColor}]`);
  } else if (style.backgroundColor === '#f8fafc') {
      classes.push('bg-slate-50');
  } else if (style.backgroundColor === '#f1f5f9') {
      classes.push('bg-slate-100');
  }

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
  // Containers always get flex, Buttons with children (icons) get flex
  const isContainer = type === 'container' || type === 'card';
  const isButtonWithChildren = type === 'button'; 

  if (needsFlex || isContainer || isButtonWithChildren) {
      if (style.flexDirection === 'column') classes.push('flex flex-col');
      else classes.push('flex flex-row');
  }
  
  if (style.justifyContent === 'center') classes.push('justify-center');
  else if (style.justifyContent === 'space-between') classes.push('justify-between');
  else if (style.justifyContent === 'flex-end') classes.push('justify-end');
  else if (style.justifyContent === 'flex-start') classes.push('justify-start');
  
  if (style.alignItems === 'center') classes.push('items-center');
  else if (style.alignItems === 'flex-end') classes.push('items-end');
  else if (style.alignItems === 'flex-start') classes.push('items-start');
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
  
  // Effects & Typography
  if (style.boxShadow) classes.push('shadow-md');
  if (style.fontSize) classes.push(`text-[${style.fontSize}]`);
  if (style.fontWeight) classes.push(`font-[${style.fontWeight}]`);

  return classes.join(' ');
};

// Recursively collect required imports
const collectImports = (node: ComponentNode, imports: Set<string>, components: Set<string>) => {
    if (node.href) {
        imports.add('import Link from "next/link"');
    }

    if (node.library === 'shadcn') {
        if (node.type === 'button') {
            imports.add('import { Button } from "@/components/ui/button"');
            components.add('Button');
        }
        if (node.type === 'card') {
            imports.add('import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"');
            components.add('Card');
            components.add('CardContent');
        }
        if (node.type === 'input') {
            imports.add('import { Input } from "@/components/ui/input"');
            components.add('Input');
        }
    }
    
    node.children.forEach(child => collectImports(child, imports, components));
};

const generateNode = (node: ComponentNode, indent: number = 0): string => {
  const spaces = '  '.repeat(indent);
  const twClasses = styleToTailwind(node.style, node.type);
  const classNameProp = twClasses ? `className="${twClasses}"` : '';

  // Logic to wrap content if it's a Link
  const wrapLink = (content: string) => {
      if (node.href) {
          return `${spaces}<Link href="${node.href}">\n  ${content}\n${spaces}</Link>`;
      }
      return content;
  };

  // --- SHADCN UI COMPONENTS ---
  if (node.library === 'shadcn') {
      
      // 1. BUTTON
      if (node.type === 'button') {
          const variant = node.props.variant ? `variant="${node.props.variant}"` : '';
          let btnCode = '';
          
          // If button has children (Icon + Text), render them
          if (node.children && node.children.length > 0) {
              const childrenCode = node.children.map(c => generateNode(c, indent + 1)).join('\n');
              btnCode = `${spaces}<Button ${variant} ${classNameProp}>\n${childrenCode}\n${spaces}</Button>`;
          } else {
              // Plain button with text
              btnCode = `${spaces}<Button ${variant} ${classNameProp}>${node.content || 'Button'}</Button>`;
          }
          return wrapLink(btnCode);
      }

      // 2. INPUT
      if (node.type === 'input') {
          return `${spaces}<Input placeholder="${node.content || 'Type here...'}" ${classNameProp} />`;
      }

      // 3. CARD
      if (node.type === 'card') {
          let headerContent = null;
          let bodyChildren = node.children;

          const potentialTitle = node.children[0];
          if (potentialTitle && potentialTitle.type === 'text' && 
             (potentialTitle.style.fontWeight === 'bold' || potentialTitle.style.fontWeight === '700' || (potentialTitle.style.fontSize && parseInt(potentialTitle.style.fontSize) >= 18))) {
              headerContent = potentialTitle.content;
              bodyChildren = node.children.slice(1);
          }

          const childrenCode = bodyChildren.map(c => generateNode(c, indent + 3)).join('\n');
          
          let cardInner = '';
          if (headerContent) {
              cardInner += `\n${spaces}  <CardHeader>\n${spaces}    <CardTitle>${headerContent}</CardTitle>\n${spaces}  </CardHeader>`;
          }
          
          cardInner += `\n${spaces}  <CardContent${childrenCode ? ' className="p-6 space-y-4"' : ''}>\n${childrenCode}\n${spaces}  </CardContent>`;

          const cardCode = `${spaces}<Card ${classNameProp}>${cardInner}\n${spaces}</Card>`;
          return wrapLink(cardCode);
      }
  }

  // --- STANDARD ELEMENTS ---

  if (node.type === 'text') {
      const textCode = `${spaces}<div ${classNameProp}>${node.content || ''}</div>`;
      return wrapLink(textCode);
  }

  if (node.type === 'image') {
      const imgSrc = node.content || "https://picsum.photos/200/200";
      const imgCode = `${spaces}<img src="${imgSrc}" alt="image" ${classNameProp} />`;
      return wrapLink(imgCode);
  }

  if (node.type === 'icon') {
      const IconName = node.iconName || 'Box';
      const iconClasses = [];
      if (node.style.color) iconClasses.push(`text-[${node.style.color}]`);
      const iconClassProp = iconClasses.length > 0 ? `className="${iconClasses.join(' ')}"` : '';
      
      return `${spaces}<${IconName} size={20} ${iconClassProp} />`;
  }

  // --- CONTAINER (Default) ---
  const childrenCode = node.children
    .map((child) => generateNode(child, indent + 1))
    .join('\n');

  const containerCode = `${spaces}<div ${classNameProp}>\n${childrenCode}\n${spaces}</div>`;
  return wrapLink(containerCode);
};

export const generateFullCode = (root: ComponentNode) => {
  const imports = new Set<string>();
  const usedComponents = new Set<string>();
  const lucideIcons = new Set<string>();

  // 1. Gather Shadcn Imports
  collectImports(root, imports, usedComponents);
  
  // 2. Gather Lucide Icons
  const gatherIcons = (n: ComponentNode) => {
      if(n.type === 'icon' && n.iconName) lucideIcons.add(n.iconName);
      n.children.forEach(gatherIcons);
  }
  gatherIcons(root);

  const componentTree = generateNode(root, 2);

  let importBlock = "";
  if (imports.size > 0) {
      importBlock += Array.from(imports).join('\n') + '\n';
  }
  if (lucideIcons.size > 0) {
      importBlock += `import { ${Array.from(lucideIcons).join(', ')} } from 'lucide-react';\n`;
  }

  return `import React from 'react';
${importBlock}

export default function Page() {
  return (
${componentTree}
  );
}
`;