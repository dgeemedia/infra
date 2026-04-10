// apps/dashboard/src/components/transactions/StatusBadge.tsx
import { cn, STATUS_CLASSES, STATUS_LABELS } from '@/lib/utils';

interface StatusBadgeProps {
  status:    string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const classes = STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  const label   = STATUS_LABELS[status]  ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        classes,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
