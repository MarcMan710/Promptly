import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export default function WritingPage() {
  const [wordCount, setWordCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your thoughts here...',
      }),
    ],
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(text.trim().split(/\s+/).length);
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif text-primary-900">Today's Prompt</h2>
          <button className="btn btn-secondary">
            New Prompt
          </button>
        </div>
        <p className="text-lg text-primary-700 font-serif">
          Write about a moment that changed your perspective on life.
        </p>
      </div>

      <div className="card">
        <EditorContent editor={editor} className="prose prose-lg max-w-none min-h-[400px]" />
        
        <div className="mt-4 flex justify-between items-center text-sm text-primary-600">
          <div className="flex items-center space-x-4">
            <span>{wordCount} words</span>
            <span>🔥 {streak} day streak</span>
          </div>
          <span className="text-green-600">✓ Saved</span>
        </div>
      </div>
    </div>
  );
} 