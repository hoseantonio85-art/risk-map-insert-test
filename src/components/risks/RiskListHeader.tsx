export function RiskListHeader() {
  return (
    <div className="grid grid-cols-[minmax(160px,1fr)_minmax(220px,2fr)_repeat(4,minmax(120px,1fr))] items-center gap-0 px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-medium text-muted-foreground sticky top-0 z-10">
      <div>ID / Статус</div>
      <div className="border-l border-border px-3">Риск / Контекст</div>
      <div className="border-l border-border px-3 text-right">Чистые</div>
      <div className="border-l border-border px-3 text-right">Кредитные</div>
      <div className="border-l border-border px-3 text-right">Косвенные</div>
      <div className="border-l border-border px-3 text-right">Потенциальные</div>
    </div>
  );
}
