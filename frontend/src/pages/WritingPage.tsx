import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * WritingPage provides an interface for users to write journal entries.
 * It fetches a daily prompt, user statistics (like streak), and allows users to
 * write content using a rich text editor (Tiptap). Entries can be saved to the backend,
 * and the component provides feedback on save status, word count, and streak.
 */
// Interfaces
interface Prompt {
  id: string;
  text: string;
}

interface UserStats {
  streak: number;
  totalWords: number;
}

interface JournalEntryPayload {
  userId: string;
  promptId?: string | null;
  content: string;
  wordCount: number;
  date: string;
}

export default function WritingPage() {
  const [editorWordCount, setEditorWordCount] = useState(0);

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [streak, setStreak] = useState(0);

  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [errorPrompt, setErrorPrompt] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("Idle");
  const [errorSaving, setErrorSaving] = useState<string | null>(null); // Specific error message for saving
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const userId = "currentUser123"; // Placeholder

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your thoughts here...',
      }),
    ],
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      // Robust word count: matches sequences of non-whitespace characters.
      setEditorWordCount(text.match(/\S+/g)?.length || 0);
      if (!isSaving) {
        setSaveStatus("Unsaved changes");
      }
      setHasUnsavedChanges(true);
    },
    editable: true,
  });

  useEffect(() => {
    if (isSaving && editor) {
      editor.setEditable(false);
    } else if (!isSaving && editor) {
      editor.setEditable(true);
    }
  }, [isSaving, editor]);

  useEffect(() => {
    const fetchPrompt = async () => {
      setIsLoadingPrompt(true);
      setErrorPrompt(null);
      try {
        const response = await fetch('/api/prompts/today');
        if (!response.ok) throw new Error(`Failed to fetch prompt: ${response.statusText} (${response.status})`);
        const data: Prompt = await response.json();
        setPrompt(data);
      } catch (err) {
        setErrorPrompt(err instanceof Error ? err.message : 'Error fetching prompt. Please try again.');
      } finally {
        setIsLoadingPrompt(false);
      }
    };
    fetchPrompt();
  }, []);

  const fetchUserStats = useCallback(async () => {
    setIsLoadingStats(true);
    setErrorStats(null);
    try {
      const response = await fetch(`/api/users/stats?userId=${userId}`);
      if (!response.ok) throw new Error(`Failed to fetch stats: ${response.statusText} (${response.status})`);
      const data: UserStats = await response.json();
      setStreak(data.streak);
    } catch (err) {
      setErrorStats(err instanceof Error ? err.message : 'Error fetching stats. Please try again.');
    } finally {
      setIsLoadingStats(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  const handleSaveEntry = async () => {
    if (!editor || editorWordCount === 0 && !editor.getText().trim()) { // Prevent saving empty entries unless explicitly desired
        setSaveStatus("Cannot save empty entry.");
        return;
    }
    if (!hasUnsavedChanges && !isSaving) return;


    setIsSaving(true);
    setErrorSaving(null);
    setSaveStatus("Saving...");

    const entryData: JournalEntryPayload = {
      userId,
      promptId: prompt?.id || undefined, // Send undefined if null
      content: editor.getHTML(),
      wordCount: editorWordCount,
      date: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error during save.' }));
        throw new Error(errorData.message || `Failed to save entry: ${response.statusText} (${response.status})`);
      }

      setSaveStatus(`Saved ✓ ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setHasUnsavedChanges(false);
      editor.commands.blur(); // Unfocus editor after save.
      await fetchUserStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error saving entry.';
      setErrorSaving(errorMessage);
      setSaveStatus(`Error saving. Try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const getSaveStatusColor = () => {
    if (saveStatus.startsWith("Error") || errorSaving) return "text-red-500";
    if (saveStatus.startsWith("Saved")) return "text-green-600";
    if (saveStatus === "Saving...") return "text-blue-500";
    return "text-primary-600"; // Idle, Unsaved changes
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif text-primary-900">Today's Prompt</h2>
        </div>
        {isLoadingPrompt && <p className="text-lg text-primary-700 font-serif">Loading prompt...</p>}
        {errorPrompt && <p className="text-lg text-red-500 font-serif">Error: {errorPrompt}</p>}
        {prompt && !isLoadingPrompt && !errorPrompt && (
          <p className="text-lg text-primary-700 font-serif">{prompt.text}</p>
        )}
        {!prompt && !isLoadingPrompt && !errorPrompt && (
            <p className="text-lg text-primary-600 font-serif">No prompt for today. Feel free to write about anything on your mind!</p>
        )}
      </div>

      <div className="card">
        <EditorContent editor={editor} className="prose prose-lg max-w-none min-h-[300px] mb-4 data-[disabled=true]:opacity-50" data-disabled={isSaving}/>
        
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
          <div className="flex items-center space-x-4 text-primary-600 mb-2 sm:mb-0">
            <span>{editorWordCount} words</span>
            {isLoadingStats && <span>Loading streak...</span>}
            {errorStats && <span className="text-red-500">Error loading streak</span>}
            {!isLoadingStats && !errorStats && <span>🔥 {streak} day streak</span>}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`italic ${getSaveStatusColor()}`}>{saveStatus}</span>
            <button
              onClick={handleSaveEntry}
              disabled={isSaving || !hasUnsavedChanges || !editor?.isEditable}
              className="btn btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
        {errorSaving && <p className="text-xs text-red-500 mt-1 text-right">Save failed: {errorSaving}</p>}
      </div>
    </div>
  );
} 