
import { ComponentNode, StyleProps } from "../types";

// Helper to parse values like "10px" to 10.0
const parseDouble = (val?: string): string => {
  if (!val) return '0.0';
  const num = parseFloat(val);
  return isNaN(num) ? '0.0' : num.toFixed(1);
};

// Helper for Colors
const parseColor = (color?: string): string => {
  if (!color || color === 'transparent') return 'Colors.transparent';
  if (color.startsWith('#')) {
    return `Color(0xFF${color.substring(1)})`;
  }
  // Basic mapping for named colors (simplified)
  const map: Record<string, string> = {
    'white': 'Colors.white',
    'black': 'Colors.black',
    'red': 'Colors.red',
    'blue': 'Colors.blue',
    'green': 'Colors.green',
    'grey': 'Colors.grey',
  };
  return map[color.toLowerCase()] || 'Colors.black';
};

const getPadding = (style: StyleProps): string => {
  if (style.padding) {
    return `EdgeInsets.all(${parseDouble(style.padding)})`;
  }
  // Individual sides could be added here
  return 'EdgeInsets.zero';
};

const getDecoration = (style: StyleProps): string => {
  const props = [];
  if (style.backgroundColor) props.push(`color: ${parseColor(style.backgroundColor)}`);
  if (style.borderRadius) props.push(`borderRadius: BorderRadius.circular(${parseDouble(style.borderRadius)})`);
  if (style.borderWidth && style.borderColor) {
    props.push(`border: Border.all(color: ${parseColor(style.borderColor)}, width: ${parseDouble(style.borderWidth)})`);
  }
  if (style.boxShadow) {
    props.push(`boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))]`);
  }
  
  if (props.length === 0) return '';
  return `decoration: BoxDecoration(\n        ${props.join(',\n        ')}\n      ),`;
};

const generateWidget = (node: ComponentNode, indentLevel: number = 0): string => {
  const i = '  '.repeat(indentLevel);
  const i2 = '  '.repeat(indentLevel + 1);

  // Handle Layouts (Row/Column based on flex direction)
  const isFlex = node.style.flexDirection === 'row' || node.style.flexDirection === 'column';
  const isRow = node.style.flexDirection === 'row';
  
  // Children Generation
  const childrenCode = node.children.map(c => generateWidget(c, indentLevel + 2)).join(`,\n${i2}  `);

  // 1. Container / Card
  if (node.type === 'container' || node.type === 'card') {
    const decoration = getDecoration(node.style);
    const padding = getPadding(node.style);
    const width = node.style.width === '100%' ? 'double.infinity' : (node.style.width !== 'auto' ? parseDouble(node.style.width) : 'null');
    const height = node.style.height === '100%' ? 'double.infinity' : (node.style.height !== 'auto' ? parseDouble(node.style.height) : 'null');

    let content = '';
    
    // If it has flex direction, wrap children in Row/Column
    if (node.children.length > 0) {
        const mainAxis = node.style.justifyContent === 'center' ? 'MainAxisAlignment.center' : 
                         node.style.justifyContent === 'flex-end' ? 'MainAxisAlignment.end' : 
                         node.style.justifyContent === 'space-between' ? 'MainAxisAlignment.spaceBetween' : 'MainAxisAlignment.start';
        
        const crossAxis = node.style.alignItems === 'center' ? 'CrossAxisAlignment.center' : 
                          node.style.alignItems === 'flex-end' ? 'CrossAxisAlignment.end' : 
                          node.style.alignItems === 'stretch' ? 'CrossAxisAlignment.stretch' : 'CrossAxisAlignment.start';

        const flexWidget = isRow ? 'Row' : 'Column';
        
        content = `child: ${flexWidget}(\n${i2}  mainAxisAlignment: ${mainAxis},\n${i2}  crossAxisAlignment: ${crossAxis},\n${i2}  children: [\n${i2}    ${childrenCode}\n${i2}  ],\n${i2})`;
    }

    return `${i}Container(\n${i2}width: ${width},\n${i2}height: ${height},\n${i2}padding: ${padding},\n${i2}${decoration}\n${i2}${content}\n${i})`;
  }

  // 2. Text
  if (node.type === 'text') {
    const fontSize = parseDouble(node.style.fontSize || '14');
    const color = parseColor(node.style.color || 'black');
    const fontWeight = node.style.fontWeight === 'bold' || node.style.fontWeight === '700' ? 'FontWeight.bold' : 'FontWeight.normal';
    
    return `${i}Text(\n${i2}"${node.content}",\n${i2}style: TextStyle(\n${i2}  fontSize: ${fontSize},\n${i2}  color: ${color},\n${i2}  fontWeight: ${fontWeight},\n${i2}),\n${i})`;
  }

  // 3. Button
  if (node.type === 'button') {
    return `${i}ElevatedButton(\n${i2}onPressed: () { print("Clicked"); },\n${i2}child: Text("${node.content}"),\n${i2}style: ElevatedButton.styleFrom(\n${i2}  backgroundColor: ${parseColor(node.style.backgroundColor || '#1e293b')},\n${i2}  foregroundColor: ${parseColor(node.style.color || 'white')},\n${i2}),\n${i})`;
  }

  // 4. Image
  if (node.type === 'image') {
     return `${i}Image.network(\n${i2}"${node.content || 'https://picsum.photos/200'}",\n${i2}width: ${parseDouble(node.style.width)},\n${i2}height: ${parseDouble(node.style.height)},\n${i2}fit: BoxFit.cover,\n${i})`;
  }

  // 5. Icon
  if (node.type === 'icon') {
     return `${i}Icon(Icons.${node.iconName?.toLowerCase() || 'star'}, size: 24, color: ${parseColor(node.style.color)})`;
  }

  // 6. Input
  if (node.type === 'input') {
      return `${i}TextField(\n${i2}decoration: InputDecoration(\n${i2}  hintText: "${node.content}",\n${i2}  border: OutlineInputBorder(),\n${i2}),\n${i})`;
  }

  // 7. List (ListView.builder)
  if (node.type === 'list') {
      return `${i}ListView.builder(\n${i2}shrinkWrap: true,\n${i2}physics: NeverScrollableScrollPhysics(),\n${i2}itemCount: ${node.props.items?.length || 0},\n${i2}itemBuilder: (context, index) {\n${i2}  return ListTile(\n${i2}    leading: Icon(Icons.circle),\n${i2}    title: Text("Item $index"),\n${i2}  );\n${i2}},\n${i})`;
  }

  // 8. Scaffold (If explicitly used or fallback)
  if (node.type === 'scaffold') {
      return `${i}Scaffold(\n${i2}appBar: AppBar(title: Text("${node.name}")),\n${i2}body: Padding(\n${i2}  padding: EdgeInsets.all(16.0),\n${i2}  child: Column(children: [\n${i2}    ${childrenCode}\n${i2}  ]),\n${i2}),\n${i})`;
  }

  // Default fallback
  return `${i}SizedBox(child: Text("Unknown ${node.type}"))`;
};

export const generateFlutterCode = (root: ComponentNode, widgetName: string = 'MyWidget', isStateful: boolean = false): string => {
  const body = generateWidget(root, 2);

  if (isStateful) {
      return `
import 'package:flutter/material.dart';

class ${widgetName} extends StatefulWidget {
  const ${widgetName}({Key? key}) : super(key: key);

  @override
  State<${widgetName}> createState() => _${widgetName}State();
}

class _${widgetName}State extends State<${widgetName}> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ${body},
      ),
    );
  }
}
`;
  }

  return `
import 'package:flutter/material.dart';

class ${widgetName} extends StatelessWidget {
  const ${widgetName}({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ${body},
      ),
    );
  }
}
`;
};
