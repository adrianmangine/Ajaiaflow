import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { useEffect, useState } from 'react';

const COLORS = [
  { label: 'Black', value: '#1a1714' },
  { label: 'Dark gray', value: '#4a4a4a' },
  { label: 'Gray', value: '#888888' },
  { label: 'Light gray', value: '#bbbbbb' },
  { label: 'Red', value: '#c0392b' },
  { label: 'Orange', value: '#e67e22' },
  { label: 'Yellow', value: '#f1c40f' },
  { label: 'Green', value: '#27ae60' },
  { label: 'Blue', value: '#2980b9' },
  { label: 'Purple', value: '#8e44ad' },
];

const FONTS = [
  { label: 'Default', value: null },
  { label: 'Lora', value: 'Lora, Georgia, serif' },
  { label: 'Merriweather', value: 'Merriweather, Georgia, serif' },
  { label: 'Playfair Display', value: '\'Playfair Display\', Georgia, serif' },
  { label: 'Nunito', value: 'Nunito, sans-serif' },
  { label: 'Fira Sans', value: '\'Fira Sans\', sans-serif' },
  { label: 'Space Mono', value: '\'Space Mono\', monospace' },
];

const ToolbarButton = ({ onClick, active, title, children }) => (
  <button type="button" className={'toolbar-btn ' + (active ? 'active' : '')} onClick={onClick} title={title}>
    {children}
  </button>
);

export default function Editor({ content, onChange, readOnly = false }) {
  const [showColors, setShowColors] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline, TextStyle, Color, FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => onChange && onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) editor.commands.setContent(content || '', false);
  }, [content]);

  if (!editor) return null;
  const currentColor = editor.getAttributes('textStyle').color || '#1a1714';

  return (
    <div className={'editor-wrapper' + (readOnly ? ' read-only' : '')}>
      {!readOnly && (
        <div className="toolbar">
          <div className="toolbar-group">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><strong>B</strong></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><em>I</em></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolbarButton>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">H1</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">H2</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">H3</ToolbarButton>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullets">list</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered">1.</ToolbarButton>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Left">L</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">C</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Right">R</ToolbarButton>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group" style={{ position: 'relative' }}>
            <button type="button" className="toolbar-btn color-btn" title="Text color" onClick={() => setShowColors(v => !v)}>
              <span style={{ borderBottom: '3px solid ' + currentColor, paddingBottom: '1px' }}>A</span>
            </button>
            {showColors && (
              <div className="color-palette">
                {COLORS.map(c => (
                  <button key={c.value} type="button" className="color-swatch" title={c.label}
                    style={{ background: c.value }}
                    onClick={() => { editor.chain().focus().setColor(c.value).run(); setShowColors(false); }} />
                ))}
                <button type="button" className="color-swatch color-reset" title="Reset"
                  onClick={() => { editor.chain().focus().unsetColor().run(); setShowColors(false); }}>x</button>
              </div>
            )}
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <select className="font-select" onChange={e => {
              const val = e.target.value;
              if (!val) editor.chain().focus().unsetFontFamily().run();
              else editor.chain().focus().setFontFamily(val).run();
            }} defaultValue="">
              {FONTS.map(f => (
                <option key={f.label} value={f.value || ''} style={{ fontFamily: f.value || 'inherit' }}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">&#8617;</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">&#8618;</ToolbarButton>
          </div>
        </div>
      )}
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
