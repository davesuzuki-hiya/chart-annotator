import { useMemo, useState } from 'react';
import { AnnotatedChart } from './components/AnnotatedChart';

export interface DataPoint {
  id: string;
  date: string;   // keep as string for display (e.g., 2026-01-01)
  value: number;
  note?: string;
}

const seedData: DataPoint[] = [
  { id: '1', date: '2025-10-01', value: 1200, note: 'Launch' },
  { id: '2', date: '2025-11-01', value: 1800 },
  { id: '3', date: '2025-12-01', value: 1400, note: 'Dip' },
  { id: '4', date: '2026-01-01', value: 2200, note: 'New high' },
];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function App() {
  const [data, setData] = useState<DataPoint[]>(seedData);
  const [showNotes, setShowNotes] = useState(true);

  const [newDate, setNewDate] = useState('2026-02-01');
  const [newValue, setNewValue] = useState('2000');
  const [newNote, setNewNote] = useState('');

  const sortedData = useMemo(() => {
    // Sort by date string (works for YYYY-MM-DD)
    return [...data].sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const updateNote = (id: string, note: string) => {
    setData((prev) =>
      prev.map((d) => (d.id === id ? { ...d, note } : d))
    );
  };

  const updateValue = (id: string, value: number) => {
    setData((prev) =>
      prev.map((d) => (d.id === id ? { ...d, value } : d))
    );
  };

  const removePoint = (id: string) => {
    setData((prev) => prev.filter((d) => d.id !== id));
  };

  const addPoint = () => {
    const valueNum = Number(newValue);
    if (!newDate || Number.isNaN(valueNum)) return;

    setData((prev) => [
      ...prev,
      {
        id: makeId(),
        date: newDate,
        value: valueNum,
        note: newNote.trim() ? newNote.trim() : '',
      },
    ]);

    setNewNote('');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-2">Chart Annotator</h1>
          <p className="text-slate-600">
            Add notes to points and export the chart as PNG/PDF.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <input
              id="showNotes"
              type="checkbox"
              className="h-4 w-4"
              checked={showNotes}
              onChange={(e) => setShowNotes(e.target.checked)}
            />
            <label htmlFor="showNotes" className="text-sm text-slate-700">
              Show notes on chart
            </label>
          </div>
        </header>

        <AnnotatedChart data={sortedData} showNotes={showNotes} />

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Edit data</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Value</label>
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Note (optional)</label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g., Product launch"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div className="md:col-span-4">
              <button
                onClick={addPoint}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Add point
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Value</th>
                  <th className="py-2 pr-2">Note</th>
                  <th className="py-2 pr-2"></th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row) => (
                  <tr key={row.id} className="border-b align-top">
                    <td className="py-2 pr-2 whitespace-nowrap">{row.date}</td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={row.value}
                        onChange={(e) => updateValue(row.id, Number(e.target.value))}
                        className="w-32 border rounded-md px-2 py-1"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={row.note ?? ''}
                        onChange={(e) => updateNote(row.id, e.target.value)}
                        className="w-full min-w-[240px] border rounded-md px-2 py-1"
                      />
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <button
                        onClick={() => removePoint(row.id)}
                        className="px-3 py-1 rounded-md bg-slate-200 hover:bg-slate-300"
                        title="Remove point"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-center text-xs text-slate-500 pb-10">
          Built for GitHub Pages deployment.
        </footer>
      </div>
    </div>
  );
}
