import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  utilization: number;
  showDonut?: boolean;
  // Expandable details
  detailRows?: { label: string; value: string }[];
  // Sync expand state externally
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function MetricCard({ 
  title, 
  value, 
  subValue, 
  utilization, 
  showDonut = true,
  detailRows,
  isExpanded,
  onToggleExpand,
}: MetricCardProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const cappedUtil = Math.min(utilization, 100);
  const offset = circumference - (cappedUtil / 100) * circumference;

  const getUtilColor = () => {
    if (utilization > 100) return 'text-util-over';
    if (utilization > 80) return 'text-util-high';
    if (utilization > 50) return 'text-util-medium';
    return 'text-util-low';
  };

  const getStrokeColor = () => {
    if (utilization > 100) return 'stroke-util-over';
    if (utilization > 80) return 'stroke-util-high';
    if (utilization > 50) return 'stroke-util-medium';
    return 'stroke-util-low';
  };

  const hasDetails = detailRows && detailRows.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-medium text-muted-foreground mb-1.5 truncate">{title}</h3>
            <p className="text-lg font-semibold text-foreground">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
            )}
          </div>
          
          {showDonut && (
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 88 88">
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="none"
                  className="stroke-border"
                  strokeWidth="6"
                />
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="none"
                  className={getStrokeColor()}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-sm font-bold", getUtilColor())}>
                  {utilization}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        {hasDetails && (
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-3"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Подробнее
          </button>
        )}
      </div>

      {/* Expanded details */}
      {hasDetails && isExpanded && (
        <div className="px-5 pb-4 pt-0 border-t border-border/50 space-y-1.5">
          {detailRows!.map((row, i) => (
            <div key={i} className={cn("flex items-baseline justify-between", i === 0 && "pt-3")}>
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-sm font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
