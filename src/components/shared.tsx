'use client';
import { Pencil, Trash2, Wallet, Plus } from 'lucide-react';
import { EditableKind, Entity, ViewProps } from './client-utils';
import { money } from '@/lib/domain';
export function RowTools({
  kind,
  item,
  edit,
  remove,
}: {
  kind: EditableKind;
  item: Entity;
  edit: ViewProps['edit'];
  remove: ViewProps['remove'];
}) {
  return (
    <div className="row-tools">
      <button
        className="icon-button"
        aria-label={`Edit ${item.name || item.title || item.description}`}
        onClick={() => edit(kind, item)}
      >
        <Pencil size={16} />
      </button>
      <button
        className="icon-button"
        aria-label={`Delete ${item.name || item.title || item.description}`}
        onClick={() => remove(item)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
export function Empty({
  title,
  text,
  action,
  label,
}: {
  title: string;
  text: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <div className="empty">
      <Wallet size={25} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="secondary small-button" onClick={action}>
          {label}
          <Plus size={15} />
        </button>
      )}
    </div>
  );
}
export function CashChart({ points }: { points: { date: string; balanceCents: number }[] }) {
  const values = points.map((p) => p.balanceCents);
  const low = Math.min(0, ...values),
    high = Math.max(100, ...values);
  const span = high - low;
  const xy = points.map(
    (p, i) =>
      `${75 + i * (600 / (points.length - 1))},${25 + ((high - p.balanceCents) / span) * 160}`,
  );
  const zero = 25 + (high / span) * 160;
  return (
    <div className="cash-chart">
      <svg
        viewBox="0 0 720 230"
        role="img"
        aria-label={`Projected end-of-day cash starts at ${money(values[0])} and ends at ${money(values.at(-1)!)}. Lowest end-of-day balance ${money(Math.min(...values))}.`}
      >
        <polygon points={`${xy[0].split(',')[0]},185 ${xy.join(' ')} 675,185`} fill="#e7f0e4" />
        <line x1="75" x2="675" y1={zero} y2={zero} stroke="#ccd7c8" strokeDasharray="4 4" />
        <text x="0" y="25">
          {money(high)}
        </text>
        <text x="0" y="193">
          {money(low)}
        </text>
        <polyline
          points={xy.join(' ')}
          fill="none"
          stroke="#346b50"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {[0, 10, 20, 30]
          .filter((i) => points[i])
          .map((i) => (
            <text key={i} x={75 + i * (600 / (points.length - 1))} y="220" textAnchor="middle">
              {points[i].date.slice(5)}
            </text>
          ))}
      </svg>
      <div className="chart-caption">
        <span>
          End of today <b>{money(values[0])}</b>
        </span>
        <span>
          End of window <b>{money(values.at(-1)!)}</b>
        </span>
      </div>
    </div>
  );
}
