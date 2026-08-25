"use client";

import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill with no SSR
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link'
  ];

  return (
    <div className="bg-secondary/50 rounded-xl overflow-hidden border border-border focus-within:border-primary">
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange} 
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="min-h-[300px] text-foreground"
      />
      {/* Custom styles to make quill look good with dark mode */}
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid var(--border);
          background-color: var(--secondary);
        }
        .ql-container.ql-snow {
          border: none;
          min-height: 250px;
          font-size: 1rem;
          color: var(--foreground);
        }
        .ql-editor {
          min-height: 250px;
        }
        .ql-snow .ql-stroke {
          stroke: var(--foreground);
        }
        .ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill {
          fill: var(--foreground);
        }
        .ql-snow .ql-picker {
          color: var(--foreground);
        }
        .ql-editor.ql-blank::before {
          color: var(--muted-foreground);
        }
      `}</style>
    </div>
  );
}
