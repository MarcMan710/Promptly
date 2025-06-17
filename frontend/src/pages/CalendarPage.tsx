import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Define Entry type
interface Entry {
  id: string; // Or number
  date: string; // Backend date string (e.g., ISO format)
  content: string;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// Utility function to format a Date object into YYYY-MM-DD string
const formatDateToKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * CalendarPage displays a calendar allowing users to view their journal entries by date.
 * It fetches entries from the backend and highlights dates with entries.
 * Users can click on a date to see the entry content for that day.
 */
export default function CalendarPage() {
  const [value, setValue] = useState<Value>(new Date());
  const [entriesMap, setEntriesMap] = useState<Map<string, Entry>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntryContent, setSelectedEntryContent] = useState<string | null>(null);

  // Placeholder for userId - in a real app, this would come from auth context
  const userId = "currentUser123";

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/entries?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch entries: ${response.statusText} (${response.status})`);
        }
        const data: Entry[] = await response.json();

        const newEntriesMap = new Map<string, Entry>();
        data.forEach(entry => {
          // Backend date needs to be parsed and formatted to local YYYY-MM-DD
          const entryDate = new Date(entry.date);
          const dateStr = formatDateToKey(entryDate);
          newEntriesMap.set(dateStr, entry);
        });
        setEntriesMap(newEntriesMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching entries.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [userId]); // Dependency array includes userId

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = formatDateToKey(date);
      return entriesMap.has(dateStr) ? 'bg-accent-100' : '';
    }
    return '';
  };

  const handleDateClick = (clickedDate: Date) => {
    setValue(clickedDate);
    const dateStr = formatDateToKey(clickedDate);
    const entry = entriesMap.get(dateStr);
    setSelectedEntryContent(entry ? entry.content : null);
  };

  if (isLoading) {
    return <div className="text-center p-8 text-xl text-primary-700">Loading entries...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-xl text-red-600">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif text-primary-900 mb-8">Journal Archive</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card">
          <Calendar
            value={value}
            tileClassName={tileClassName}
            onClickDay={handleDateClick}
            className="w-full border-none"
          />
        </div>

        <div className="card">
          {selectedEntryContent ? (
            <div>
              <h2 className="text-xl font-serif text-primary-900 mb-4">
                Entry for {value instanceof Date ? value.toLocaleDateString() :
                            (Array.isArray(value) && value[0] ? value[0].toLocaleDateString() : 'Selected Date')}
              </h2>
              <p className="text-primary-700 whitespace-pre-wrap">{selectedEntryContent}</p>
            </div>
          ) : (
            <div className="text-center text-primary-600 py-8">
              { value instanceof Date && entriesMap.has(formatDateToKey(value))
                ? 'This date has an entry, but its content appears empty or could not be displayed.'
                : 'Select a date with an entry to view it, or pick any date to start a new reflection.'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 