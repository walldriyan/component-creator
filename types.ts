export type ComponentType = 'container' | 'text' | 'button' | 'input' | 'card' | 'image' | 'icon';

export type LibraryType = 'radix' | 'shadcn' | 'plain';

export interface StyleProps {
  backgroundColor?: string;
  color?: string;
  padding?: string;
  margin?: string;
  marginBottom?: string;
  width?: string;
  height?: string;
  minHeight?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRight?: string;
  borderBottom?: string;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  flexGrow?: number; // Added for Flex Grow feature
  gap?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  boxShadow?: string;
}

export interface ComponentNode {
  id: string;
  type: ComponentType;
  name: string;
  library: LibraryType; // Radix (simulated) vs Shadcn
  props: Record<string, any>;
  style: StyleProps;
  content?: string; // For text nodes
  iconName?: string; // For icons (e.g., "Home", "User")
  href?: string; // For Next.js Link
  children: ComponentNode[];
  parentId?: string | null;
}

export interface DragItem {
  type: ComponentType | 'sidebar' | 'navbar'; // Extended for presets
  library: LibraryType;
}

// Initial state helper
export const initialCanvas: ComponentNode = {
  id: 'root',
  type: 'container',
  name: 'Root Page',
  library: 'shadcn', // Changed default to shadcn
  props: {},
  style: {
    width: '100%',
    height: '100%',
    padding: '24px',
    backgroundColor: '#ffffff',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
    justifyContent: 'flex-start',
  },
  children: [],
};