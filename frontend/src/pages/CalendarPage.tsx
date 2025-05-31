import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function CalendarPage() {
  const [value, setValue] = useState<Value>(new Date());
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // Mock data - replace with actual data from backend
  const entries = {
    '2024-03-20': 'Today\'s entry about perspective...',
    '2024-03-19': 'Yesterday\'s reflection on growth...',
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries[dateStr as keyof typeof entries] ? 'bg-accent-100' : '';
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedEntry(entries[dateStr as keyof typeof entries] || null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif text-primary-900 mb-8">Journal Archive</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card">
          <Calendar
            onChange={setValue}
            value={value}
            tileClassName={tileClassName}
            onClickDay={handleDateClick}
            className="w-full border-none"
          />
        </div>

        <div className="card">
          {selectedEntry ? (
            <div>
              <h2 className="text-xl font-serif text-primary-900 mb-4">
                Entry for {value instanceof Date ? value.toLocaleDateString() : ''}
              </h2>
              <p className="text-primary-700 whitespace-pre-wrap">{selectedEntry}</p>
            </div>
          ) : (
            <div className="text-center text-primary-600 py-8">
              Select a date to view your entry
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 