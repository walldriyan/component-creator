
export type ComponentType = 'container' | 'text' | 'button' | 'input' | 'textarea' | 'checkbox' | 'switch' | 'select' | 'card' | 'image' | 'icon' | 'divider' | 'label' | 'table' | 'form' | 'avatarGroup' | 'interaction' | 'dropdown' | 'list' | 'tabs';

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
  maxWidth?: string;
  minWidth?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRight?: string;
  borderBottom?: string;
  borderTop?: string;
  borderLeft?: string;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  flexGrow?: number;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  gap?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  boxShadow?: string;
  cursor?: string;
  // Positioning
  position?: 'relative' | 'absolute' | 'fixed' | 'static';
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  zIndex?: string;
}

export interface ComponentNode {
  id: string;
  type: ComponentType;
  name: string;
  library: LibraryType;
  props: Record<string, any>;
  style: StyleProps;
  content?: string;
  iconName?: string;
  href?: string;
  children: ComponentNode[];
  parentId?: string | null;
  events?: {
    onClick?: string;
  };
}

export interface DragItem {
  type: ComponentType | 'sidebar' | 'navbar';
  library: LibraryType;
}

// Initial state helper
export const initialCanvas: ComponentNode = {
  id: 'root',
  type: 'container',
  name: 'Root Page',
  library: 'radix',
  props: {},
  style: {
    width: '100%',
    height: '100%',
    padding: '20px', 
    backgroundColor: '#ffffff',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px', 
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
  },
  children: [],
};