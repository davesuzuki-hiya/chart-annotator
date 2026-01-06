import { useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DataPoint } from '../App';
import * as domtoimage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';

interface AnnotatedChartProps {
  data: DataPoint[];
  showNotes: boolean;
}

// Custom annotation bubble component
const AnnotationBubble = ({
  x,
  y,
  note,
  position,
}: {
  x: number;
  y: number;
  note: string;
  position: 'top' | 'bottom';
}) => {
  const bubblePadding = 8;
  const bubbleWidth = Math.min(180, note.length * 6 + bubblePadding * 2);
  const bubbleHeight = 40;
  const tailSize = 8;

  // Position bubble above or below the point
  const bubbleY =
    position === 'top'
      ? y - bubbleHeight - tailSize - 15
      : y + tailSize + 15;

  const bubbleX = x - bubbleWidth / 2;

  return (
    <g>
      {/* Connecting line from point to bubble */}
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={position === 'top' ? bubbleY + bubbleHeight : bubbleY}
        stroke="#94a3b8"
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />

      {/* Bubble tail (pointer) */}
      <path
        d={
          position === 'top'
            ? `M ${x - tailSize} ${bubbleY + bubbleHeight}
               L ${x} ${bubbleY + bubbleHeight + tailSize}
               L ${x + tailSize} ${bubbleY + bubbleHeight} Z`
            : `M ${x - tailSize} ${bubbleY}
               L ${x} ${bubbleY - tailSize}
               L ${x + tailSize} ${bubbleY} Z`
        }
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth={1.5}
      />

      {/* Bubble background */}
      <rect
        x={bubbleX}
        y={bubbleY}
        width={bubbleWidth}
        height={bubbleHeight}
        rx={6}
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth={1.5}
      />

      {/* Text inside bubble */}
      <text
        x={x}
        y={bubbleY + bubbleHeight / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '11px',
          fill: '#92400e',
          fontWeight: '600',
        }}
      >
        {note.length > 26 ? note.substring(0, 24) + '…' : note}
      </text>
    </g>
  );
};

export function AnnotatedChart({ data, showNotes }: AnnotatedChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload as DataPoint;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm mb-1">
            <span className="font-semibold">Date:</span> {row.date}
          </p>
          <p className="text-sm mb-1">
            <span className="font-semibold">Value:</span>{' '}
            {row.value.toLocaleString()}
          </p>
          {row.note && row.note.trim() !== '' && (
            <p className="text-sm mt-2 pt-2 border-t border-gray-200">
              <span className="font-semibold">Note:</span> {row.note}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom dot component that renders annotations
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const hasNote = payload.note && payload.note.trim() !== '';

    if (!hasNote || !showNotes) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#3b82f6"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }

    // Alternate top/bottom to reduce overlaps
    const dataWithNotes = data.filter((d) => d.note && d.note.trim() !== '');
    const noteIndex = dataWithNotes.findIndex((d) => d.id === payload.id);
    const position = noteIndex % 2 === 0 ? 'top' : 'bottom';

    return (
      <g>
        {/* The data point */}
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#ef4444"
          stroke="#fff"
          strokeWidth={2}
        />

        {/* The annotation bubble */}
        <AnnotationBubble x={cx} y={cy} note={payload.note} position={position} />
      </g>
    );
  };

  const exportChart = async (format: 'png' | 'pdf') => {
    const node = chartRef.current;
    if (!node) return;

    try {
      // Let layout settle
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      // Wait for fonts if supported (prevents blank/misaligned text)
      // @ts-ignore
      if (document.fonts?.ready) {
        // @ts-ignore
        await document.fonts.ready;
      }

      const rect = node.getBoundingClientRect();
      const exportWidth = Math.round(rect.width);
      const exportHeight = Math.round(rect.height);

      // Higher = sharper exports (also larger file)
      const scale = 2;

      const dataUrl = await domtoimage.toPng(node, {
        bgcolor: '#ffffff',
        cacheBust: true,

        // IMPORTANT: output canvas size must reflect scaling
        width: exportWidth * scale,
        height: exportHeight * scale,

        // IMPORTANT: force the cloned node to the original size, then scale it up
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${exportWidth}px`,
          height: `${exportHeight}px`,
        },
      });

      const baseName = `chart-${new Date().toISOString().slice(0, 10)}`;

      if (format === 'png') {
        const blob = await (await fetch(dataUrl)).blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
        return;
      }

      // PDF: use CSS pixel units and enable px scaling hotfix for correct sizing
      const pdf = new jsPDF({
        orientation: exportWidth > exportHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [exportWidth, exportHeight],
        hotfixes: ['px_scaling'],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, exportWidth, exportHeight, undefined, 'FAST');
      pdf.save(`${baseName}.pdf`);
    } catch (error) {
      console.error('Error exporting chart:', error);
      alert('Error exporting chart. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Data Visualization</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportChart('png')}
            className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
            style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
          >
            <Download className="w-4 h-4" />
            Export PNG
          </button>
          <button
            onClick={() => exportChart('pdf')}
            className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div
        ref={chartRef}
        style={{
          width: '100%',
          height: '700px',
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          overflow: 'visible',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 100, right: 50, left: 50, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12, fill: '#374151' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#374151' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 7 }}
              name="Value"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
