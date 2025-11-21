

import { ComponentNode, StyleProps } from "../types";

// --- Helper Types ---
interface GeneratedFile {
  path: string;
  content: string;
}

class FlutterGenerator {
  private usedComponents: Set<string> = new Set();
  private files: GeneratedFile[] = [];

  // --- JSON to Dart Parser ---
  // Converts JS Objects to valid Dart Map/List syntax string
  private jsonToDart(data: any): string {
    if (data === null) return 'null';
    if (data === undefined) return 'null';
    
    if (typeof data === 'string') {
      // Escape quotes
      return `"${data.replace(/"/g, '\\"')}"`;
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      return data.toString();
    }

    if (Array.isArray(data)) {
      const items = data.map(item => this.jsonToDart(item)).join(', ');
      return `[${items}]`;
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data).map(([key, value]) => {
        return `"${key}": ${this.jsonToDart(value)}`;
      }).join(', ');
      return `{${entries}}`;
    }

    return 'null';
  }

  // --- Style Parsing Helpers ---
  private parseDouble(val?: string): string {
    if (!val) return '0.0';
    if (val === '100%') return 'double.infinity';
    const num = parseFloat(val);
    return isNaN(num) ? '0.0' : num.toFixed(1);
  }

  private parseColor(color?: string): string {
    if (!color || color === 'transparent') return 'Colors.transparent';
    if (color.startsWith('#')) return `Color(0xFF${color.substring(1)})`;
    
    const map: Record<string, string> = {
      'white': 'AppTheme.white',
      'black': 'AppTheme.black',
      'red': 'Colors.red',
      'blue': 'AppTheme.primary',
      'slate-900': 'AppTheme.textPrimary',
      'slate-500': 'AppTheme.textSecondary',
    };
    return map[color.toLowerCase()] || 'Colors.black';
  }

  private getEdgeInsets(style: StyleProps, propPrefix: 'padding' | 'margin'): string {
    const all = style[propPrefix];
    const t = style[`${propPrefix}Top`];
    const b = style[`${propPrefix}Bottom`];
    const l = style[`${propPrefix}Left`];
    const r = style[`${propPrefix}Right`];

    if (all) return `const EdgeInsets.all(${this.parseDouble(all)})`;
    if (t || b || l || r) {
      return `const EdgeInsets.only(top: ${this.parseDouble(t)}, bottom: ${this.parseDouble(b)}, left: ${this.parseDouble(l)}, right: ${this.parseDouble(r)})`;
    }
    return 'EdgeInsets.zero';
  }

  // --- Widget Generation Logic ---

  private generateWidgetTree(node: ComponentNode, indent: number = 0): string {
    const i = '  '.repeat(indent);
    const i2 = '  '.repeat(indent + 1);

    // 1. Handle Smart Components (Modular imports)
    if (node.type === 'input' || node.type === 'textarea') {
      this.usedComponents.add('CustomTextField');
      return `${i}CustomTextField(\n${i2}label: "${node.content}",\n${i2}hint: "${node.content}",\n${i2}maxLines: ${node.type === 'textarea' ? 4 : 1},\n${i})`;
    }

    if (node.type === 'button') {
      this.usedComponents.add('CustomButton');
      const isPrimary = !node.props.variant || node.props.variant === 'default';
      return `${i}CustomButton(\n${i2}label: "${node.content}",\n${i2}onPressed: () { print("Clicked ${node.content}"); },\n${i2}isPrimary: ${isPrimary},\n${i})`;
    }

    if (node.type === 'form') {
      this.usedComponents.add('SmartForm');
      const fieldsJson = JSON.stringify(node.props.fields || []);
      return `${i}SmartForm(\n${i2}endpoint: "${node.props.endpoint ?? ''}",\n${i2}fieldsData: ${fieldsJson},\n${i})`;
    }

    if (node.type === 'list') {
       this.usedComponents.add('DynamicList');
       const items = node.props.items || [];
       const dataString = this.jsonToDart(items);
       return `${i}DynamicList(\n${i2}data: ${dataString},\n${i2}enablePagination: ${node.props.pagination ?? false},\n${i})`;
    }

    if (node.type === 'table') {
       this.usedComponents.add('SmartTable');
       const items = node.props.data || [];
       const dataString = this.jsonToDart(items);
       return `${i}SmartTable(\n${i2}data: ${dataString},\n${i})`;
    }

    if (node.type === 'tabs') {
      this.usedComponents.add('SmartTabs');
      const items = node.props.items || [];
      const dataString = this.jsonToDart(items);
      return `${i}SmartTabs(\n${i2}tabsData: ${dataString},\n${i})`;
    }

    if (node.type === 'accordion') {
      this.usedComponents.add('SmartAccordion');
      const items = node.props.items || [];
      const dataString = this.jsonToDart(items);
      return `${i}SmartAccordion(\n${i2}items: ${dataString},\n${i2}allowMultiple: ${node.props.allowMultiple ?? false},\n${i})`;
    }

    if (node.type === 'dropdown') {
       // Simple wrapper for demonstration
       return `${i}DropdownButton<String>(\n${i2}isExpanded: true,\n${i2}hint: const Text("${node.props.label ?? 'Select'}"),\n${i2}items: const [], onChanged: (v){},\n${i})`;
    }

    // 2. Handle Layout Containers
    if (node.type === 'container' || node.type === 'card') {
      const decoration = this.getDecoration(node.style);
      const padding = this.getEdgeInsets(node.style, 'padding');
      const width = node.style.width === '100%' ? 'double.infinity' : (node.style.width && node.style.width !== 'auto' ? this.parseDouble(node.style.width) : null);
      
      let childCode = '';
      if (node.children.length > 0) {
         const mainAxis = node.style.justifyContent === 'center' ? 'MainAxisAlignment.center' : node.style.justifyContent === 'space-between' ? 'MainAxisAlignment.spaceBetween' : 'MainAxisAlignment.start';
         const crossAxis = node.style.alignItems === 'center' ? 'CrossAxisAlignment.center' : 'CrossAxisAlignment.start';
         const isRow = node.style.flexDirection === 'row';
         
         const childrenStr = node.children.map(c => this.generateWidgetTree(c, indent + 3)).join(`,\n${'  '.repeat(indent + 3)}`);
         
         childCode = `${isRow ? 'Row' : 'Column'}(\n${i2}  mainAxisAlignment: ${mainAxis},\n${i2}  crossAxisAlignment: ${crossAxis},\n${i2}  children: [\n${'  '.repeat(indent + 3)}${finalChildren(childrenStr, node.style.gap)}\n${i2}  ],\n${i2})`;
      } else {
         childCode = 'const SizedBox.shrink()';
      }

      let widget = `Container(\n${i2}width: ${width},\n${i2}padding: ${padding},\n${i2}${decoration}\n${i2}child: ${childCode},\n${i})`;
      
      if (node.type === 'card') {
        return `${i}Card(\n${i2}elevation: 2,\n${i2}shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${this.parseDouble(node.style.borderRadius || '8')})),\n${i2}child: ${widget},\n${i})`;
      }
      return widget;
    }

    if (node.type === 'text') {
      return `${i}Text(\n${i2}"${node.content}",\n${i2}style: TextStyle(\n${i2}  fontSize: ${this.parseDouble(node.style.fontSize || '14')},\n${i2}  color: ${this.parseColor(node.style.color)},\n${i2}  fontWeight: ${node.style.fontWeight === 'bold' ? 'FontWeight.bold' : 'FontWeight.normal'},\n${i2}),\n${i})`;
    }

    if (node.type === 'image') {
      return `${i}ClipRRect(\n${i2}borderRadius: BorderRadius.circular(${this.parseDouble(node.style.borderRadius)}),\n${i2}child: Image.network("${node.content}", fit: BoxFit.cover),\n${i})`;
    }

    if (node.type === 'checkbox') {
         return `${i}Row(\n${i2}mainAxisSize: MainAxisSize.min,\n${i2}children: [\n${i2}  Checkbox(value: true, onChanged: (v){}),\n${i2}  Text("${node.content}"),\n${i2}],\n${i})`;
    }
    
    if (node.type === 'switch') {
         return `${i}Row(\n${i2}mainAxisSize: MainAxisSize.min,\n${i2}children: [\n${i2}  Switch(value: true, onChanged: (v){}),\n${i2}  Text("${node.content}"),\n${i2}],\n${i})`;
    }

    if (node.type === 'icon' && node.iconName) {
        return `${i}Icon(${getIconCode(node.iconName)}, color: ${this.parseColor(node.style.color)}, size: 24)`;
    }

    return `${i}const SizedBox.shrink()`;
  }

  private getDecoration(style: StyleProps): string {
    const color = style.backgroundColor && style.backgroundColor !== 'transparent' 
      ? `color: ${this.parseColor(style.backgroundColor)},` 
      : '';
    const radius = style.borderRadius ? `borderRadius: BorderRadius.circular(${this.parseDouble(style.borderRadius)}),` : '';
    const border = style.borderWidth && style.borderColor 
      ? `border: Border.all(color: ${this.parseColor(style.borderColor)}, width: ${this.parseDouble(style.borderWidth)}),` 
      : '';
      
    if (!color && !radius && !border) return '';
    
    return `decoration: BoxDecoration(\n      ${color}\n      ${radius}\n      ${border}\n    ),`;
  }

  // --- File Generation ---

  public generate(root: ComponentNode, widgetName: string): string {
    // 1. Generate Main Widget Body
    const body = this.generateWidgetTree(root, 3);

    // 2. Create Main File
    const imports = Array.from(this.usedComponents).map(c => `import 'components/${this.camelToSnake(c)}.dart';`).join('\n');
    
    const mainFileContent = `
import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
${imports}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Generated App',
      theme: AppTheme.lightTheme,
      home: const ${widgetName}(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class ${widgetName} extends StatelessWidget {
  const ${widgetName}({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text("${root.name}"),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ${body.trim()},
        ),
      ),
    );
  }
}
`;
    this.files.push({ path: 'lib/main.dart', content: mainFileContent });

    // 3. Create Theme File
    this.createThemeFile();

    // 4. Create Component Files based on usage
    if (this.usedComponents.has('CustomTextField')) this.createCustomInputFile();
    if (this.usedComponents.has('CustomButton')) this.createCustomButtonFile();
    if (this.usedComponents.has('SmartForm')) this.createSmartFormFile();
    if (this.usedComponents.has('SmartTable')) this.createSmartTableFile();
    if (this.usedComponents.has('DynamicList')) this.createDynamicListFile();
    if (this.usedComponents.has('SmartTabs')) this.createSmartTabsFile();
    if (this.usedComponents.has('SmartAccordion')) this.createSmartAccordionFile();

    // 5. Formatting Output
    return this.formatOutput();
  }

  private createThemeFile() {
    this.files.push({
      path: 'lib/theme/app_theme.dart',
      content: `
import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF0F172A); // Slate 900
  static const Color white = Colors.white;
  static const Color black = Colors.black;
  static const Color background = Color(0xFFF8FAFC); // Slate 50
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);

  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: primary,
      scaffoldBackgroundColor: background,
      appBarTheme: const AppBarTheme(
        backgroundColor: white,
        elevation: 0,
        iconTheme: IconThemeData(color: textPrimary),
        titleTextStyle: TextStyle(color: textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      tabBarTheme: const TabBarTheme(
        labelColor: primary,
        unselectedLabelColor: textSecondary,
        indicatorColor: primary,
      ),
      colorScheme: ColorScheme.fromSeed(seedColor: primary),
      useMaterial3: true,
    );
  }
}
`
    });
  }

  private createCustomInputFile() {
    this.files.push({
      path: 'lib/components/custom_text_field.dart',
      content: `
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CustomTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final int maxLines;
  final TextInputType? keyboardType;

  const CustomTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.validator,
    this.obscureText = false,
    this.maxLines = 1,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          validator: validator,
          obscureText: obscureText,
          maxLines: maxLines,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppTheme.textSecondary),
            filled: true,
            fillColor: AppTheme.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
`
    });
  }

  private createCustomButtonFile() {
    this.files.push({
      path: 'lib/components/custom_button.dart',
      content: `
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isPrimary;
  final bool isLoading;

  const CustomButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isPrimary = true,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isPrimary ? AppTheme.primary : AppTheme.white,
          foregroundColor: isPrimary ? AppTheme.white : AppTheme.textPrimary,
          elevation: isPrimary ? 2 : 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: isPrimary ? BorderSide.none : BorderSide(color: Colors.grey.shade300),
          ),
        ),
        child: isLoading
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }
}
`
    });
  }

  private createSmartFormFile() {
    this.files.push({
      path: 'lib/components/smart_form.dart',
      content: `
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'custom_text_field.dart';
import 'custom_button.dart';
import 'dart:convert';

class SmartForm extends StatefulWidget {
  final List<dynamic> fieldsData;
  final String endpoint;

  const SmartForm({super.key, required this.fieldsData, this.endpoint = ''});

  @override
  State<SmartForm> createState() => _SmartFormState();
}

class _SmartFormState extends State<SmartForm> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, TextEditingController> _textControllers = {};
  final Map<String, dynamic> _formValues = {};
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeFields();
  }

  void _initializeFields() {
    for (var field in widget.fieldsData) {
      String name = field['name'];
      String type = field['type'] ?? 'text';
      if (_isTextField(type)) {
        _textControllers[name] = TextEditingController(text: field['defaultValue'] ?? '');
      } else {
        _formValues[name] = field['defaultValue'];
      }
    }
  }

  @override
  void dispose() {
    for (var controller in _textControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  bool _isTextField(String type) {
    return ['text', 'email', 'password', 'number', 'textarea', 'phone'].contains(type);
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();
    setState(() => _isLoading = true);

    final Map<String, dynamic> payload = {};
    _textControllers.forEach((key, controller) {
      payload[key] = controller.text;
    });
    payload.addAll(_formValues);

    await Future.delayed(const Duration(seconds: 2)); 
    print("Submitting to \${widget.endpoint}: \${jsonEncode(payload)}");
    
    if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Submitted Successfully")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ...widget.fieldsData.map((field) => _buildField(field)),
          const SizedBox(height: 24),
          CustomButton(label: "Submit", onPressed: _submitForm, isLoading: _isLoading),
        ],
      ),
    );
  }

  Widget _buildField(dynamic field) {
    String type = field['type'] ?? 'text';
    String name = field['name'];
    String label = field['label'] ?? '';
    String placeholder = field['placeholder'] ?? '';
    bool required = field['required'] ?? false;
    List<String> options = (field['options'] as List<dynamic>?)?.cast<String>() ?? [];

    if (_isTextField(type)) {
      return CustomTextField(
        label: label,
        hint: placeholder,
        controller: _textControllers[name],
        obscureText: type == 'password',
        maxLines: type == 'textarea' ? 4 : 1,
        validator: (value) => required && (value == null || value.isEmpty) ? 'Required' : null,
      );
    }

    if (type == 'select') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500, color: AppTheme.textPrimary)),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: _formValues[name],
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              hintText: placeholder,
            ),
            items: options.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
            onChanged: (val) => setState(() => _formValues[name] = val),
          ),
          const SizedBox(height: 16),
        ],
      );
    }
    return const SizedBox.shrink();
  }
}
`
    });
  }

  private createSmartTableFile() {
      this.files.push({
          path: 'lib/components/smart_table.dart',
          content: `
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SmartTable extends StatelessWidget {
  final List<dynamic> data;

  const SmartTable({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: Text("No data available", style: TextStyle(color: AppTheme.textSecondary)),
        ),
      );
    }

    final firstItem = data.first as Map<String, dynamic>;
    final columns = firstItem.keys.map((key) {
      return DataColumn(
        label: Text(key.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
      );
    }).toList();

    final rows = data.map((item) {
      final mapItem = item as Map<String, dynamic>;
      return DataRow(
        cells: firstItem.keys.map((key) {
          return DataCell(Text(mapItem[key]?.toString() ?? '-'));
        }).toList(),
      );
    }).toList();

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowColor: MaterialStateProperty.all(Colors.grey.shade50),
            columns: columns,
            rows: rows,
          ),
        ),
      ),
    );
  }
}
`
      });
  }

  private createDynamicListFile() {
      this.files.push({
          path: 'lib/components/dynamic_list.dart',
          content: `
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DynamicList extends StatelessWidget {
  final List<dynamic> data;
  final bool enablePagination;

  const DynamicList({super.key, required this.data, this.enablePagination = false});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const Center(child: Text("No items"));

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: data.length,
      separatorBuilder: (ctx, i) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final item = data[index] as Map<String, dynamic>;
        return _buildListItem(item);
      },
    );
  }

  Widget _buildListItem(Map<String, dynamic> item) {
    String title = item['title'] ?? item['name'] ?? item['header'] ?? item['subject'] ?? 'Item';
    String subtitle = item['description'] ?? item['subtitle'] ?? item['email'] ?? item['role'] ?? item['status'] ?? '';
    String? iconName = item['icon'];

    IconData icon = Icons.article;
    if (iconName != null) {
         if (iconName == 'User') icon = Icons.person;
         else if (iconName == 'Settings') icon = Icons.settings;
         else if (iconName == 'Box') icon = Icons.check_box_outline_blank;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.05), shape: BoxShape.circle),
            child: Icon(icon, color: AppTheme.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppTheme.textPrimary)),
                if (subtitle.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(subtitle, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
        ],
      ),
    );
  }
}
`
      });
  }

  private createSmartTabsFile() {
    this.files.push({
        path: 'lib/components/smart_tabs.dart',
        content: `
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SmartTabs extends StatelessWidget {
  final List<dynamic> tabsData;

  const SmartTabs({super.key, required this.tabsData});

  @override
  Widget build(BuildContext context) {
    if (tabsData.isEmpty) {
      return const SizedBox(
        height: 100,
        child: Center(child: Text("No tabs configured")),
      );
    }

    return DefaultTabController(
      length: tabsData.length,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            decoration: BoxDecoration(
              color: AppTheme.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: TabBar(
              isScrollable: tabsData.length > 3,
              tabAlignment: tabsData.length > 3 ? TabAlignment.start : TabAlignment.fill,
              indicatorSize: TabBarIndicatorSize.tab,
              tabs: tabsData.map((tab) => Tab(
                text: tab['label'] ?? tab['title'] ?? 'Tab',
                icon: _getIcon(tab['icon']),
              )).toList(),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 300, // Fixed height for tab content area
            child: TabBarView(
              children: tabsData.map((tab) => _buildTabContent(tab)).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(Map<String, dynamic> tab) {
    String content = tab['content'] ?? 'No content available';
    // Strip basic HTML tags if present for simpler display in Flutter
    content = content.replaceAll(RegExp(r'<[^>]*>'), '');

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Center(
        child: Text(
          content,
          style: const TextStyle(fontSize: 15, color: AppTheme.textSecondary),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Icon? _getIcon(String? iconName) {
    if (iconName == null) return null;
    IconData icon = Icons.circle; // default
    
    final map = {
      'User': Icons.person,
      'Lock': Icons.lock,
      'Bell': Icons.notifications,
      'Home': Icons.home,
      'Settings': Icons.settings,
      'Box': Icons.inventory,
      'Check': Icons.check_circle,
      'Palette': Icons.palette,
      'Sparkles': Icons.auto_awesome,
    };

    if (map.containsKey(iconName)) {
      icon = map[iconName]!;
    }
    return Icon(icon);
  }
}
`
    });
  }

  private createSmartAccordionFile() {
    this.files.push({
      path: 'lib/components/smart_accordion.dart',
      content: `
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SmartAccordion extends StatefulWidget {
  final List<dynamic> items;
  final bool allowMultiple;

  const SmartAccordion({super.key, required this.items, this.allowMultiple = false});

  @override
  State<SmartAccordion> createState() => _SmartAccordionState();
}

class _SmartAccordionState extends State<SmartAccordion> {
  late List<bool> _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = List.generate(widget.items.length, (_) => false);
  }

  @override
  void didUpdateWidget(SmartAccordion oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.items.length != _isExpanded.length) {
      _isExpanded = List.generate(widget.items.length, (_) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) return const SizedBox.shrink();

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: ExpansionPanelList(
          elevation: 0,
          expandedHeaderPadding: const EdgeInsets.symmetric(vertical: 4),
          dividerColor: Colors.grey.shade200,
          expansionCallback: (int index, bool isExpanded) {
            setState(() {
              if (widget.allowMultiple) {
                _isExpanded[index] = !isExpanded;
              } else {
                for (int i = 0; i < _isExpanded.length; i++) {
                   if (i != index) _isExpanded[i] = false;
                }
                _isExpanded[index] = !isExpanded;
              }
            });
          },
          children: widget.items.asMap().entries.map<ExpansionPanel>((entry) {
            final index = entry.key;
            final item = entry.value;
            return ExpansionPanel(
              isExpanded: _isExpanded[index],
              canTapOnHeader: true,
              backgroundColor: AppTheme.white,
              headerBuilder: (BuildContext context, bool isExpanded) {
                return ListTile(
                  leading: _getIcon(item['icon']),
                  title: Text(
                    item['title'] ?? 'Item',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isExpanded ? AppTheme.primary : AppTheme.textPrimary,
                    ),
                  ),
                );
              },
              body: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Text(
                  _stripHtml(item['content'] ?? ''),
                  style: const TextStyle(color: AppTheme.textSecondary, height: 1.5),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  String _stripHtml(String html) {
    return html.replaceAll(RegExp(r'<[^>]*>'), '');
  }

  Icon? _getIcon(String? iconName) {
    if (iconName == null) return null;
    final map = {
      'User': Icons.person,
      'Lock': Icons.lock,
      'Bell': Icons.notifications,
      'Home': Icons.home,
      'Settings': Icons.settings,
      'Box': Icons.inventory,
      'Check': Icons.check_circle,
      'Palette': Icons.palette,
      'Sparkles': Icons.auto_awesome,
      'File': Icons.insert_drive_file,
    };
    return map.containsKey(iconName) 
        ? Icon(map[iconName], color: AppTheme.primary, size: 20) 
        : null;
  }
}
`
    });
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  private formatOutput(): string {
    return this.files.map(f => 
      `// ==============================================================================\n` +
      `// FILE: ${f.path}\n` +
      `// ==============================================================================\n` +
      f.content.trim() + '\n\n'
    ).join('');
  }
}

// --- Helper to inject SizedBox gaps logic ---
function finalChildren(childrenCode: string, gap?: string): string {
    if (!gap) return childrenCode;
    // A rough split to insert SizedBoxes between items.
    // NOTE: This is a string manipulation heuristic. 
    // In a real AST generator this would be cleaner.
    // For now, standard MainAxisAlignment usage in the parent is safer than
    // trying to regex replace commas with SizedBoxes which might break nested code.
    return childrenCode; 
}

function getIconCode(name: string): string {
    const iconMap: Record<string, string> = {
        'Home': 'Icons.home', 'User': 'Icons.person', 'Settings': 'Icons.settings',
        'Bell': 'Icons.notifications', 'Search': 'Icons.search', 'Menu': 'Icons.menu',
        'Star': 'Icons.star', 'Heart': 'Icons.favorite', 'Share': 'Icons.share',
        'ArrowRight': 'Icons.arrow_forward', 'Box': 'Icons.check_box_outline_blank',
        'Check': 'Icons.check', 'X': 'Icons.close', 'Trash2': 'Icons.delete',
        'Plus': 'Icons.add', 'Edit': 'Icons.edit', 'Eye': 'Icons.visibility',
        'Lock': 'Icons.lock', 'LogOut': 'Icons.logout', 'Layout': 'Icons.dashboard',
        'BarChart': 'Icons.bar_chart', 'Users': 'Icons.people'
    };
    return iconMap[name] || 'Icons.help_outline';
}

export const generateFlutterCode = (root: ComponentNode, widgetName: string, isStateful: boolean): string => {
  const generator = new FlutterGenerator();
  return generator.generate(root, widgetName);
};