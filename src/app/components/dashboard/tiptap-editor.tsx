import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  ImageIcon,
  LinkIcon,
  Minus,
  Undo,
  Redo,
  Type,
  Plus,
  Upload,
  Pilcrow,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Copy,
  Check,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '../ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { motion, AnimatePresence } from 'motion/react';

// ─── Lowlight singleton ───
let _lowlight: ReturnType<typeof createLowlight> | null = null;
function getLowlight() {
  if (!_lowlight) {
    _lowlight = createLowlight(common);
  }
  return _lowlight;
}

// ─── Constants ───
const SUPPORTED_LANGUAGES = [
  { value: '', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'r', label: 'R' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'dart', label: 'Dart' },
];

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

// ─── Toolbar Button ───
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ElementType;
  label: string;
  disabled?: boolean;
  className?: string;
}

function TBtn({ onClick, isActive, icon: Icon, label, disabled, className }: ToolbarButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            } ${className ?? ''}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Toolbar Separator ───
function TSep() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0 hidden sm:block" />;
}

// ─── Toolbar Group ───
function TGroup({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={label}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Notion-style Code Block NodeView
// ═══════════════════════════════════════════════════
function NotionCodeBlock({ node, updateAttributes }: ReactNodeViewProps) {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || '';

  const handleCopy = useCallback(() => {
    const text = node.textContent;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [node]);

  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateAttributes({ language: e.target.value });
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper className="notion-code-block-wrapper">
      <div className="notion-code-block">
        {/* Header bar */}
        <div className="notion-code-header">
          <select
            value={language}
            onChange={handleLanguageChange}
            contentEditable={false}
            className="notion-code-lang-select"
          >
            {SUPPORTED_LANGUAGES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCopy}
            contentEditable={false}
            className="notion-code-copy-btn"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        {/* Code content */}
        <pre className="notion-code-pre">
          <NodeViewContent as="code" />
        </pre>
      </div>
    </NodeViewWrapper>
  );
}

// ═══════════════════════════════════════════════════
// Image NodeView with Alignment & Text Wrap Toolbar
// ═══════════════════════════════════════════════════
type ImageLayout = 'inline-left' | 'center' | 'inline-right' | 'wide';
type ImageSize = '25' | '50' | '75' | '100';

function ImageToolbarBtn({
  onClick,
  isActive,
  icon: Icon,
  label,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  icon?: React.ElementType;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className={`h-7 min-w-[28px] px-1.5 flex items-center justify-center rounded transition-colors text-xs ${
              isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ResizableImageView({ node, updateAttributes, selected, deleteNode, editor }: ReactNodeViewProps) {
  const { src, alt } = node.attrs;
  const layout: ImageLayout = node.attrs.dataLayout || 'center';
  const width: string = node.attrs.dataWidth || '100';
  const [showToolbar, setShowToolbar] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Show toolbar on selection
  useEffect(() => {
    setShowToolbar(!!selected);
  }, [selected]);

  // Close on outside click
  useEffect(() => {
    if (!showToolbar) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowToolbar(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showToolbar]);

  const setLayout = (l: ImageLayout) => {
    updateAttributes({ dataLayout: l });
  };

  const setWidth = (w: ImageSize) => {
    updateAttributes({ dataWidth: w });
  };

  // Compute wrapper classes
  const layoutClasses = {
    'inline-left': 'editor-img-float-left',
    'center': 'editor-img-center',
    'inline-right': 'editor-img-float-right',
    'wide': 'editor-img-wide',
  };

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`editor-img-wrapper ${layoutClasses[layout]} ${selected ? 'editor-img-selected' : ''}`}
      data-layout={layout}
      style={{ width: layout === 'center' || layout === 'wide' ? `${width}%` : `${Math.min(Number(width), 50)}%` }}
    >
      <div className="relative group">
        <img
          src={src}
          alt={alt || ''}
          className="editor-img-element"
          draggable={false}
        />

        {/* Floating toolbar */}
        <AnimatePresence>
          {showToolbar && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-gray-900/90 backdrop-blur-sm rounded-lg px-1 py-0.5 shadow-xl border border-white/10"
              contentEditable={false}
            >
              {/* Layout buttons */}
              <ImageToolbarBtn
                onClick={() => setLayout('inline-left')}
                isActive={layout === 'inline-left'}
                icon={AlignLeft}
                label="Float Left (wrap text)"
              />
              <ImageToolbarBtn
                onClick={() => setLayout('center')}
                isActive={layout === 'center'}
                icon={AlignCenter}
                label="Center"
              />
              <ImageToolbarBtn
                onClick={() => setLayout('inline-right')}
                isActive={layout === 'inline-right'}
                icon={AlignRight}
                label="Float Right (wrap text)"
              />

              <div className="w-px h-5 bg-white/20 mx-0.5" />

              {/* Size buttons */}
              {(['25', '50', '75', '100'] as ImageSize[]).map((s) => (
                <ImageToolbarBtn
                  key={s}
                  onClick={() => setWidth(s)}
                  isActive={width === s}
                  label={`${s}% width`}
                >
                  <span className="text-[10px] tabular-nums">{s}%</span>
                </ImageToolbarBtn>
              ))}

              <div className="w-px h-5 bg-white/20 mx-0.5" />

              {/* Delete button */}
              <ImageToolbarBtn
                onClick={() => deleteNode()}
                icon={Trash2}
                label="Delete image"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NodeViewWrapper>
  );
}

// ═══════════════════════════════════════════════════
// Slash Command Items
// ═══════════════════════════════════════════════════
interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ElementType;
  command: (editor: ReturnType<typeof useEditor>) => void;
}

const SLASH_COMMANDS: SlashMenuItem[] = [
  {
    title: 'Text',
    description: 'Plain text paragraph',
    icon: Pilcrow,
    command: (editor) => editor?.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Heading 4',
    description: 'Sub-section heading',
    icon: Heading4,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    title: 'Heading 5',
    description: 'Minor heading',
    icon: Heading5,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 5 }).run(),
  },
  {
    title: 'Heading 6',
    description: 'Smallest heading',
    icon: Heading6,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 6 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Unordered list of items',
    icon: List,
    command: (editor) => editor?.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Ordered list of items',
    icon: ListOrdered,
    command: (editor) => editor?.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    description: 'Blockquote element',
    icon: Quote,
    command: (editor) => editor?.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Code with syntax highlighting',
    icon: CodeSquare,
    command: (editor) => editor?.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    description: 'Horizontal line separator',
    icon: Minus,
    command: (editor) => editor?.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Image',
    description: 'Upload or embed an image',
    icon: ImageIcon,
    command: () => {},
  },
];

// ═══════════════════════════════════════════════════
// Slash Command Menu
// ═══════════════════════════════════════════════════
function SlashCommandMenu({
  editor,
  query,
  onClose,
  onSelectImage,
  position,
}: {
  editor: ReturnType<typeof useEditor>;
  query: string;
  onClose: () => void;
  onSelectImage: () => void;
  position: { top: number; left: number };
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = SLASH_COMMANDS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = useCallback(
    (item: SlashMenuItem) => {
      if (editor) {
        const { from } = editor.state.selection;
        const textBefore = editor.state.doc.textBetween(
          Math.max(0, from - query.length - 1),
          from
        );
        const slashPos = textBefore.lastIndexOf('/');
        if (slashPos !== -1) {
          const deleteFrom = from - query.length - 1;
          editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
        }
      }
      if (item.title === 'Image') {
        onSelectImage();
      } else {
        item.command(editor);
      }
      onClose();
    },
    [editor, query, onClose, onSelectImage]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) executeCommand(item);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedIndex, filteredItems, executeCommand, onClose]);

  if (filteredItems.length === 0) return null;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-1.5 max-h-72 overflow-y-auto">
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => executeCommand(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 ${
                  index === selectedIndex
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-muted/50 border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════
// Floating Plus Button
// ═══════════════════════════════════════════════════
function FloatingPlusButton({
  editor,
  onUploadImage,
}: {
  editor: ReturnType<typeof useEditor>;
  onUploadImage: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    if (!editor) return;

    const updatePosition = () => {
      try {
        const { selection } = editor.state;
        const { $from } = selection;
        const node = $from.node();

        const isEmptyParagraph =
          node.type.name === 'paragraph' && node.content.size === 0;

        if (isEmptyParagraph && editor.isFocused) {
          const cursorCoords = editor.view.coordsAtPos($from.pos);
          const editorDom = editor.view.dom;
          const editorRect = editorDom.getBoundingClientRect();

          setCoords({
            top: cursorCoords.top + (cursorCoords.bottom - cursorCoords.top) / 2 - 16,
            left: editorRect.left - 36,
          });
          setVisible(true);
        } else {
          setVisible(false);
          setExpanded(false);
        }
      } catch {
        setVisible(false);
        setExpanded(false);
      }
    };

    editor.on('selectionUpdate', updatePosition);
    editor.on('focus', updatePosition);

    const handleScroll = () => {
      if (editor.isFocused) updatePosition();
    };
    window.addEventListener('scroll', handleScroll, true);

    const handleBlur = () => {
      setTimeout(() => {
        if (!isInteractingRef.current) {
          setVisible(false);
          setExpanded(false);
        }
      }, 200);
    };
    editor.on('blur', handleBlur);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('focus', updatePosition);
      editor.off('blur', handleBlur);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [editor]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isInteractingRef.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isInteractingRef.current = false;
  }, []);

  if (!visible || !editor) return null;

  const insertBlock = (type: string) => {
    setExpanded(false);
    isInteractingRef.current = false;
    switch (type) {
      case 'image':
        onUploadImage();
        break;
      case 'divider':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'codeblock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-40"
      style={{ top: coords.top, left: coords.left }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <AnimatePresence>
        {!expanded ? (
          <motion.button
            key="plus"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => setExpanded(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0, width: 32 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 32 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 bg-card border border-border rounded-full px-1 py-0.5 shadow-lg"
          >
            <button
              onClick={() => {
                setExpanded(false);
                isInteractingRef.current = false;
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-5 bg-border" />
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => insertBlock('image')}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Upload Image
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => insertBlock('codeblock')}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <CodeSquare className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Code Block
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => insertBlock('quote')}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Blockquote
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => insertBlock('divider')}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Divider
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Block-Type Dropdown (Paragraph / H1 / H2 / H3)
// ═══════════════════════════════════════════════════
function BlockTypeDropdown({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const currentType = editor.isActive('heading', { level: 1 })
    ? 'H1'
    : editor.isActive('heading', { level: 2 })
    ? 'H2'
    : editor.isActive('heading', { level: 3 })
    ? 'H3'
    : editor.isActive('heading', { level: 4 })
    ? 'H4'
    : editor.isActive('heading', { level: 5 })
    ? 'H5'
    : editor.isActive('heading', { level: 6 })
    ? 'H6'
    : 'P';

  const items = [
    { label: 'Paragraph', value: 'P', icon: Type, action: () => editor.chain().focus().setParagraph().run() },
    { label: 'Heading 1', value: 'H1', icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', value: 'H2', icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', value: 'H3', icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Heading 4', value: 'H4', icon: Heading4, action: () => editor.chain().focus().toggleHeading({ level: 4 }).run() },
    { label: 'Heading 5', value: 'H5', icon: Heading5, action: () => editor.chain().focus().toggleHeading({ level: 5 }).run() },
    { label: 'Heading 6', value: 'H6', icon: Heading6, action: () => editor.chain().focus().toggleHeading({ level: 6 }).run() },
  ];

  const currentItem = items.find((i) => i.value === currentType) || items[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <currentItem.icon className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">{currentItem.label}</span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 z-50 w-44 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = item.value === currentType;
              return (
                <button
                  key={item.value}
                  onClick={() => {
                    item.action();
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Custom Bubble Menu (replaces @tiptap/react/menus BubbleMenu
// to avoid pnpm resolution issues with @tiptap/extension-bubble-menu)
// ═══════════════════════════════════════════════════
function CustomBubbleMenu({
  editor,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
}) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMenu = () => {
      try {
        const { state, view } = editor;
        const { selection } = state;
        const { empty, $from } = selection;

        // Don't show for image selections
        const nodeAfter = $from.nodeAfter;
        if (nodeAfter?.type.name === 'image') {
          setShow(false);
          return;
        }

        // Only show for non-empty text selections in paragraph/heading
        if (
          !empty &&
          (editor.isActive('paragraph') || editor.isActive('heading'))
        ) {
          const { from, to } = selection;
          const start = view.coordsAtPos(from);
          const end = view.coordsAtPos(to);
          const top = start.top - 50;
          const left = (start.left + end.left) / 2;
          setCoords({ top, left });
          setShow(true);
        } else {
          setShow(false);
        }
      } catch {
        setShow(false);
      }
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('blur', () => {
      // Small delay to allow clicking menu buttons
      setTimeout(() => {
        if (
          menuRef.current &&
          !menuRef.current.contains(document.activeElement)
        ) {
          setShow(false);
        }
      }, 150);
    });

    return () => {
      editor.off('selectionUpdate', updateMenu);
    };
  }, [editor]);

  if (!show) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{ top: coords.top, left: coords.left, transform: 'translateX(-50%)' }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.12 }}
        className="flex items-center gap-0.5 bg-card border border-border rounded-lg p-1 shadow-lg"
      >
        <TBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          label="Bold"
          className="!h-7 !w-7"
        />
        <TBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          label="Italic"
          className="!h-7 !w-7"
        />
        <TBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={Strikethrough}
          label="Strikethrough"
          className="!h-7 !w-7"
        />
        <TBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          icon={Code}
          label="Code"
          className="!h-7 !w-7"
        />
        <div className="w-px h-5 bg-border mx-0.5" />
        <TBtn
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={AlignLeft}
          label="Left"
          className="!h-7 !w-7"
        />
        <TBtn
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={AlignCenter}
          label="Center"
          className="!h-7 !w-7"
        />
        <TBtn
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={AlignRight}
          label="Right"
          className="!h-7 !w-7"
        />
        <div className="w-px h-5 bg-border mx-0.5" />
        <TBtn
          onClick={() => {
            const url = window.prompt('Enter link URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          isActive={editor.isActive('link')}
          icon={LinkIcon}
          label="Link"
          className="!h-7 !w-7"
        />
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Main Editor
// ═══════════════════════════════════════════════════
export function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [slashMenu, setSlashMenu] = useState<{
    open: boolean;
    query: string;
    position: { top: number; left: number };
  }>({ open: false, query: '', position: { top: 0, left: 0 } });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Custom CodeBlock extension with Notion-style node view and proper HTML parsing
  const CustomCodeBlockLowlight = useMemo(
    () =>
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(NotionCodeBlock);
        },
        parseHTML() {
          return [
            { tag: 'pre code' },
            { tag: 'pre' },
          ];
        },
      }),
    []
  );

  // Custom Image extension with alignment/float/width support
  const CustomImage = useMemo(
    () =>
      ImageExtension.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            dataLayout: {
              default: 'center',
              parseHTML: (element: HTMLElement) => element.getAttribute('data-layout') || 'center',
              renderHTML: (attributes: Record<string, string>) => ({
                'data-layout': attributes.dataLayout || 'center',
              }),
            },
            dataWidth: {
              default: '100',
              parseHTML: (element: HTMLElement) => element.getAttribute('data-width') || '100',
              renderHTML: (attributes: Record<string, string>) => ({
                'data-width': attributes.dataWidth || '100',
              }),
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ResizableImageView);
        },
      }),
    []
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary/30 pl-4 italic text-muted-foreground',
          },
        },
        HTMLAttributes: {
          class: 'prose prose-neutral dark:prose-invert max-w-none',
        },
      }),
      CustomImage.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading...';
          return 'Write something, or type "/" for commands...';
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CustomCodeBlockLowlight.configure({
        lowlight: getLowlight(),
        HTMLAttributes: {
          class: 'code-block-wrapper',
        },
      }),
    ],
    [CustomCodeBlockLowlight, CustomImage]
  );

  const editor = useEditor({
    extensions,
    content: '',
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
      checkSlashCommand(e);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-4 sm:px-6 py-4',
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const files = Array.from(event.dataTransfer.files);
          const images = files.filter((f) => f.type.startsWith('image/'));
          if (images.length > 0) {
            event.preventDefault();
            images.forEach((f) => handleFileUpload(f));
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) handleFileUpload(file);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Update editor content when prop changes (e.g., when navigating from AI Chat)
  // Only update if content actually changed to avoid unnecessary re-renders
  const initialContent = useRef<string | null>(null);
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getHTML();
      // Skip if content is the same or if editor already has content and new content is empty
      if (initialContent.current !== content && (content !== '' || currentContent === '<p></p>')) {
        initialContent.current = content;
        // Use setContent with parseHTML options to properly parse AI-generated HTML
        editor.commands.setContent(content, { parseHTML: true });
      }
    }
  }, [content, editor]);

  // Check for slash command
  const checkSlashCommand = useCallback(
    (e: ReturnType<typeof useEditor>) => {
      if (!e) return;
      try {
        const { from } = e.state.selection;
        const textBefore = e.state.doc.textBetween(
          Math.max(0, from - 20),
          from,
          '\0',
          '\0'
        );
        const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);
        if (slashMatch) {
          const coords = e.view.coordsAtPos(from);
          setSlashMenu({
            open: true,
            query: slashMatch[1],
            position: { top: coords.bottom + 8, left: coords.left },
          });
        } else {
          setSlashMenu((prev) => (prev.open ? { ...prev, open: false } : prev));
        }
      } catch {
        setSlashMenu((prev) => (prev.open ? { ...prev, open: false } : prev));
      }
    },
    []
  );

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!editor) {
        console.error('Editor not available');
        return;
      }
      if (!file.type.startsWith('image/')) {
        console.error('Not an image file:', file.type);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ 
          src: reader.result as string,
          dataLayout: 'center',
          dataWidth: '100'
        }).run();
      };
      reader.onerror = () => {
        console.error('Error reading file:', reader.error);
      };
      reader.readAsDataURL(file);
    },
    [editor]
  );

  const triggerFileUpload = useCallback(() => {
    console.log('Trigger file upload clicked');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input ref is null');
    }
  }, []);

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('File input changed, files:', e.target.files?.length);
      const files = e.target.files;
      if (files) {
        Array.from(files).forEach(handleFileUpload);
      }
      e.target.value = '';
    },
    [handleFileUpload]
  );

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
    }
  }, [editor, imageUrl]);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
    }
  }, [editor, linkUrl]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      Array.from(e.dataTransfer.files)
        .filter((f) => f.type.startsWith('image/'))
        .forEach(handleFileUpload);
    },
    [handleFileUpload]
  );

  if (!editor) return null;

  return (
    <div className="relative min-w-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileInputChange}
        className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
        style={{ clip: 'rect(0px, 0px, 0px, 0px)' }}
      />

      <div
        ref={editorWrapperRef}
        className={`rounded-xl border bg-card overflow-hidden transition-colors ${
          isDragOver ? 'border-primary ring-2 ring-primary/20' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* ─── Toolbar ─── */}
        <div className="border-b border-border bg-muted/20 px-1.5 py-1.5">
          <div className="flex flex-wrap items-center gap-0.5">
            {/* Block type selector */}
            <BlockTypeDropdown editor={editor} />

            <TSep />

            {/* Text formatting */}
            <TGroup label="Text formatting">
              <TBtn
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                icon={Bold}
                label="Bold (Ctrl+B)"
              />
              <TBtn
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                icon={Italic}
                label="Italic (Ctrl+I)"
              />
              <TBtn
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                icon={Strikethrough}
                label="Strikethrough"
              />
              <TBtn
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                icon={Code}
                label="Inline Code (Ctrl+E)"
              />
            </TGroup>

            <TSep />

            {/* Text alignment */}
            <TGroup label="Text alignment">
              <TBtn
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                icon={AlignLeft}
                label="Align Left"
              />
              <TBtn
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                icon={AlignCenter}
                label="Align Center"
              />
              <TBtn
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                icon={AlignRight}
                label="Align Right"
              />
              <TBtn
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                icon={AlignJustify}
                label="Justify"
              />
            </TGroup>

            <TSep />

            {/* Lists & blocks */}
            <TGroup label="Lists and blocks">
              <TBtn
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                icon={List}
                label="Bullet List"
              />
              <TBtn
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                icon={ListOrdered}
                label="Ordered List"
              />
              <TBtn
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                icon={Quote}
                label="Blockquote"
              />
              <TBtn
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                icon={CodeSquare}
                label="Code Block"
              />
              <TBtn
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                icon={Minus}
                label="Divider"
              />
            </TGroup>

            <TSep />

            {/* Insert: image & link */}
            <TGroup label="Insert">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={triggerFileUpload}
                      className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Upload Image
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Image URL popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <p className="text-sm text-foreground">Insert Image URL</p>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addImage()}
                    />
                    <Button size="sm" onClick={addImage} className="w-full">
                      Insert Image
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Link popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${
                      editor.isActive('link')
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <p className="text-sm text-foreground">Insert Link</p>
                    <Input
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addLink()}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addLink} className="flex-1">
                        Add Link
                      </Button>
                      {editor.isActive('link') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editor.chain().focus().unsetLink().run()}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </TGroup>

            {/* Spacer to push undo/redo right */}
            <div className="flex-1" />

            {/* History */}
            <TGroup label="History">
              <TBtn
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                icon={Undo}
                label="Undo (Ctrl+Z)"
              />
              <TBtn
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                icon={Redo}
                label="Redo (Ctrl+Shift+Z)"
              />
            </TGroup>
          </div>
        </div>

        {/* ─── Drag overlay ─── */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-primary/5 backdrop-blur-sm flex items-center justify-center rounded-xl pointer-events-none"
            >
              <div className="flex flex-col items-center gap-3 text-primary">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <p className="text-sm">Drop image here to upload</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Bubble menu (text only, not for images) ─── */}
        {editor && (
          <CustomBubbleMenu
            editor={editor}
          />
        )}

        {/* ─── Editor content ─── */}
        <div className="relative">
          <EditorContent editor={editor} />
          <FloatingPlusButton editor={editor} onUploadImage={triggerFileUpload} />
        </div>
      </div>

      {/* ─── Slash Command Menu ─── */}
      <AnimatePresence>
        {slashMenu.open && (
          <SlashCommandMenu
            editor={editor}
            query={slashMenu.query}
            onClose={() => setSlashMenu((prev) => ({ ...prev, open: false }))}
            onSelectImage={triggerFileUpload}
            position={slashMenu.position}
          />
        )}
      </AnimatePresence>
    </div>
  );
}