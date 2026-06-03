import { useState, useMemo } from 'react';
import { History, Plus, FileText, Sparkles, Pencil, XCircle, ArrowRight, Check, Undo2, MessageSquareWarning } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FullscreenLightbox } from '@/components/ui/fullscreen-lightbox';
import { UtilizationDrawer } from './UtilizationDrawer';
import { HistoryDrawer } from './HistoryDrawer';
import { UtilizationCard } from './UtilizationCard';
import { Risk, Mirror, MirrorApprovalStatus } from '@/types/risk';
import { cn } from '@/lib/utils';
import { mockMeasures } from '@/data/mockRisks';

interface RiskDetailViewProps {
  risk: Risk | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (risk: Risk) => void;
  onOpenWizard?: (risk: Risk) => void;
}

function RiskLevelBadge({ level }: { level: Risk['riskLevel'] }) {
  const map: Record<Risk['riskLevel'], string> = {
    'Высокий': 'bg-destructive/8 text-destructive/80 border-destructive/20',
    'Средний': 'bg-[hsl(var(--chart-yellow))]/8 text-[hsl(var(--chart-yellow))]/80 border-[hsl(var(--chart-yellow))]/20',
    'Низкий': 'bg-primary/8 text-primary/80 border-primary/20',
  };
  return (
    <span className={cn("text-xs px-2.5 py-0.5 rounded-md font-medium border", map[level])}>
      {level}
    </span>
  );
}

function StatusTag({ status }: { status: Risk['status'] }) {
  const colorMap: Record<Risk['status'], string> = {
    'Черновик': 'text-muted-foreground border-muted-foreground/40',
    'В работе': 'text-foreground border-border',
    'На согласовании': 'text-orange-500 border-orange-300',
    'Утверждён': 'text-primary border-primary/40',
  };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border bg-transparent", colorMap[status])}>
      {status}
    </span>
  );
}

const mirrorStatusStyles: Record<MirrorApprovalStatus, string> = {
  'Черновик': 'text-muted-foreground border-muted-foreground/30 bg-muted/40',
  'Требует согласования': 'text-orange-600 border-orange-300 bg-orange-50/60',
  'Согласовано': 'text-primary border-primary/30 bg-primary/8',
  'Возвращено': 'text-destructive border-destructive/30 bg-destructive/8',
  'Ожидает другого согласующего': 'text-muted-foreground border-border bg-muted/40',
};

function MirrorStatusTag({ status }: { status: MirrorApprovalStatus }) {
  return (
    <span className={cn("text-[11px] px-2 py-0.5 rounded-md font-medium border whitespace-nowrap", mirrorStatusStyles[status])}>
      {status}
    </span>
  );
}

const sections = [
  { id: 'utilization', label: 'Утилизация' },
  { id: 'potential', label: 'Потенциальные потери' },
  { id: 'scenarios', label: 'Сценарии' },
  { id: 'mirroring', label: 'Зеркалирование' },
  { id: 'connections', label: 'Связи' },
];



import type { Scenario } from '@/types/risk';

/** Compact scenario row — opens a side drawer with full details. */
function ScenarioRow({ scenario, risk, fmtVal, onOpen }: { scenario: Scenario; risk: Risk; fmtVal: (v: number) => string; onOpen: () => void }) {
  const factClean = Math.round((risk.cleanOpRisk.value || 0) * scenario.percentage / 100 * 10) / 10;
  const factCredit = Math.round((risk.creditOpRisk.value || 0) * scenario.percentage / 100 * 10) / 10;
  const factIndirect = Math.round((risk.indirectLosses.value || 0) * scenario.percentage / 100 * 10) / 10;
  const totalFact = factClean + factCredit + factIndirect;
  const potentialLosses = Math.round(risk.potentialLosses * scenario.percentage / 100);
  const hasMeasures = scenario.id.endsWith('1') || scenario.id.endsWith('3');

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-accent/30 transition-colors p-4 space-y-2"
    >
      <p className="text-sm text-foreground">{scenario.description}</p>
      <div className="flex items-center gap-4 text-xs flex-wrap text-muted-foreground">
        <span>Потенциальные <span className="font-semibold text-foreground">{fmtVal(potentialLosses)} ₽</span></span>
        <span>Доля <span className="font-semibold text-foreground">{scenario.percentage}%</span></span>
        {totalFact > 0 && <span>Факт <span className="font-semibold text-foreground">{fmtVal(totalFact)} ₽</span></span>}
        <span className={cn("font-medium", hasMeasures ? "text-primary" : "")}>{hasMeasures ? 'Меры: есть' : 'Меры: нет'}</span>
      </div>
    </button>
  );
}

/** Drawer with full scenario details. */
function ScenarioDrawer({ scenario, risk, fmtVal, isOpen, onClose }: { scenario: Scenario | null; risk: Risk | null; fmtVal: (v: number) => string; isOpen: boolean; onClose: () => void }) {
  if (!scenario || !risk) return null;
  const factClean = Math.round((risk.cleanOpRisk.value || 0) * scenario.percentage / 100 * 10) / 10;
  const factCredit = Math.round((risk.creditOpRisk.value || 0) * scenario.percentage / 100 * 10) / 10;
  const factIndirect = Math.round((risk.indirectLosses.value || 0) * scenario.percentage / 100 * 10) / 10;
  const forecastClean = Math.round(factClean * 1.2 * 10) / 10;
  const forecastCredit = Math.round(factCredit * 1.15 * 10) / 10;
  const forecastIndirect = Math.round(factIndirect * 1.1 * 10) / 10;
  const potentialLosses = Math.round(risk.potentialLosses * scenario.percentage / 100);

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base leading-snug pr-6">{scenario.description}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80 font-medium">Потенциальные</p>
              <p className="text-sm font-semibold mt-1">{fmtVal(potentialLosses)} ₽</p>
            </div>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80 font-medium">Доля</p>
              <p className="text-sm font-semibold mt-1">{scenario.percentage}%</p>
            </div>
          </div>

          {(scenario.causeType || scenario.itService) && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Параметры</p>
              <div className="space-y-1 text-sm">
                {scenario.causeType && (
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Тип причины</span><span className="text-right">{scenario.causeType}</span></div>
                )}
                {scenario.itService && (
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">ИТ-услуга</span><span className="text-right">{scenario.itService}</span></div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Потери (Факт)</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Чистые</span><span className="font-medium">{fmtVal(factClean)} ₽</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Кредитные</span><span className="font-medium">{fmtVal(factCredit)} ₽</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Косвенные</span><span className="font-medium">{fmtVal(factIndirect)} ₽</span></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Прогноз</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Чистые</span><span className="font-medium">{fmtVal(forecastClean)} ₽</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Кредитные</span><span className="font-medium">{fmtVal(forecastCredit)} ₽</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Косвенные</span><span className="font-medium">{fmtVal(forecastIndirect)} ₽</span></div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Источник: <span className="text-foreground">Ручное создание</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Modal to return one or many mirrors with a comment. */
function ReturnMirrorsDialog({ isOpen, onClose, onSubmit, count }: { isOpen: boolean; onClose: () => void; onSubmit: (comment: string) => void; count: number }) {
  const [comment, setComment] = useState('');
  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) { setComment(''); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Вернуть на доработку</DialogTitle>
          <DialogDescription>
            {count > 1
              ? `Комментарий будет применён ко всем выбранным зеркалам (${count}).`
              : 'Опишите, что нужно скорректировать.'}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Комментарий для исполнителя…"
          className="min-h-[120px]"
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => { setComment(''); onClose(); }}>Отмена</Button>
          <Button
            disabled={!comment.trim()}
            onClick={() => { onSubmit(comment.trim()); setComment(''); onClose(); }}
          >
            Вернуть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Modal to read a returned-mirror comment. */
function CommentDialog({ isOpen, onClose, comment, author, date, subdivision }: { isOpen: boolean; onClose: () => void; comment?: string; author?: string; date?: string; subdivision?: string }) {
  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Комментарий согласующего</DialogTitle>
          {subdivision && <DialogDescription>{subdivision}</DialogDescription>}
        </DialogHeader>
        <div className="rounded-lg border border-destructive/20 bg-destructive/[0.04] p-3">
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment}</p>
        </div>
        {(author || date) && (
          <p className="text-xs text-muted-foreground">
            {author}{author && date ? ' · ' : ''}{date}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RiskDetailView({ risk, isOpen, onClose, onEdit, onOpenWizard }: RiskDetailViewProps) {
  const [utilizationOpen, setUtilizationOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [scenarioDrawerId, setScenarioDrawerId] = useState<string | null>(null);
  const [returnDialog, setReturnDialog] = useState<{ open: boolean; mirrorIds: string[] }>({ open: false, mirrorIds: [] });
  const [commentDialog, setCommentDialog] = useState<{ open: boolean; mirror: Mirror | null }>({ open: false, mirror: null });

  // Local mirror approval state (prototype-only, mocked over the immutable risk prop)
  const [mirrorOverrides, setMirrorOverrides] = useState<Record<string, { status?: MirrorApprovalStatus; returnComment?: string }>>({});
  const [selectedMirrorIds, setSelectedMirrorIds] = useState<Set<string>>(new Set());

  const fmtVal = (val: number) => {
    if (val >= 1_000_000_000) {
      const v = val / 1_000_000_000;
      return `${Number.isInteger(v) ? v : v.toFixed(1)} млрд`;
    }
    if (val >= 1_000_000) {
      const v = val / 1_000_000;
      return `${Number.isInteger(v) ? v : v.toFixed(1)} млн`;
    }
    if (val >= 1_000) {
      const v = val / 1_000;
      return `${Number.isInteger(v) ? v : v.toFixed(1)} тыс`;
    }
    return val.toLocaleString('ru-RU');
  };

  // Helper to read effective status (override > mock)
  const readMirror = (m: Mirror) => {
    const o = mirrorOverrides[m.id];
    return {
      status: (o?.status ?? m.approvalStatus) as MirrorApprovalStatus | undefined,
      returnComment: o?.returnComment ?? m.returnComment,
    };
  };

  // "My mirrors needing approval" — based on mock isMine + status Требует согласования
  const myPendingMirrors = useMemo(() => {
    if (!risk) return [];
    return risk.mirrors.filter(m => {
      const r = readMirror(m);
      return m.isMine && r.status === 'Требует согласования';
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risk, mirrorOverrides]);

  const updateMirror = (id: string, patch: { status?: MirrorApprovalStatus; returnComment?: string }) => {
    setMirrorOverrides(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const approveMirror = (id: string) => updateMirror(id, { status: 'Согласовано', returnComment: undefined });
  const returnMirror = (id: string, comment: string) => updateMirror(id, { status: 'Возвращено', returnComment: comment });

  const approveAllMyMirrors = () => {
    myPendingMirrors.forEach(m => approveMirror(m.id));
    setSelectedMirrorIds(new Set());
  };

  const returnSelectedMirrors = (comment: string) => {
    selectedMirrorIds.forEach(id => returnMirror(id, comment));
    setSelectedMirrorIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedMirrorIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!risk) return null;

  const campaignActive = !!(risk.campaignStatus || risk.proposedLimits);
  const proposed = risk.proposedLimits;

  // Risk-level next-year limit fallback (from proposedLimits if provided)
  const nextYearRisk = {
    clean: proposed?.cleanOpRisk,
    credit: proposed?.creditOpRisk,
    indirect: proposed?.indirectLosses,
  };

  const aiMessage = risk.riskLevel === 'Высокий'
    ? 'Уровень риска высокий. Рекомендуется проработать мероприятия по снижению или пересмотреть стратегию реагирования.'
    : 'Показатели риска в пределах нормы. Продолжайте мониторинг в рамках текущей стратегии.';

  const headerContent = (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold truncate">
          {risk.id}: {risk.riskName}
        </h1>
        <RiskLevelBadge level={risk.riskLevel} />
      </div>
      <p className="text-sm text-muted-foreground truncate">
        {risk.process} • {risk.riskProfile}
      </p>
    </div>
  );

  const headerActions = (
    <Button variant="outline" size="sm" className="gap-2" onClick={() => onOpenWizard?.(risk)}>
      <Pencil className="w-3.5 h-3.5" />
      Редактировать
    </Button>
  );

  return (
    <>
      <FullscreenLightbox
        isOpen={isOpen}
        onClose={onClose}
        title=""
        headerContent={headerContent}
        actions={headerActions}
        wide
      >
        <div className="grid grid-cols-[1fr,320px] gap-8 px-2">
          {/* Main content */}
          <div className="space-y-6">
            {risk.monitoringStatus === 'Корректировка' && risk.rpComment && (
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/60">
                <p className="text-sm font-semibold text-amber-900 mb-1">Комментарий риск-партнёра</p>
                <p className="text-sm text-amber-900/90">{risk.rpComment}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="default" onClick={() => onOpenWizard?.(risk)}>Исправить оценку</Button>
                  <Button size="sm" variant="outline">Отправить повторно</Button>
                </div>
              </div>
            )}

            {campaignActive && (
              <p className="text-xs text-muted-foreground -mb-2">
                Лимитная кампания открыта: следующий год показан рядом с действующими лимитами.
              </p>
            )}

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Оценка риска</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Качественные потери</p>
                  <p className="text-sm font-semibold">{risk.qualitativeLosses || 'Нет'}</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Уровень потерь</p>
                  <RiskLevelBadge level={risk.riskLevel} />
                </div>
              </div>
            </section>

            <div className="p-4 rounded-xl border" style={{
              backgroundColor: 'hsl(var(--ai-alert))',
              borderColor: 'hsl(var(--ai-alert-border))',
            }}>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--ai-alert-foreground))' }} />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--ai-alert-foreground))' }}>
                    Рекомендация AI-ассистента
                  </p>
                  <p className="text-sm text-muted-foreground">{aiMessage}</p>
                  {risk.riskLevel === 'Высокий' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 text-sm font-medium border border-[hsl(var(--ai-alert-border))]"
                      style={{ color: 'hsl(var(--ai-alert-foreground))' }}
                      onClick={() => onOpenWizard?.(risk)}
                    >
                      Переоценить риск
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky top-0 z-10 bg-card py-2 -mx-1 px-1 flex gap-2">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Utilization */}
            <section id="utilization" className="space-y-3">
              <h2 className="text-base font-semibold">Утилизация лимитов</h2>
              <div className="grid grid-cols-3 gap-5">
                {([
                  { title: 'Чистые', limit: risk.cleanOpRisk, nextYear: nextYearRisk.clean },
                  { title: 'Кредитные', limit: risk.creditOpRisk, nextYear: nextYearRisk.credit },
                  { title: 'Косвенные', limit: risk.indirectLosses, nextYear: nextYearRisk.indirect },
                ] as const).map((item) => (
                  <div key={item.title} className="space-y-1.5">
                    <UtilizationCard title={item.title} lossLimit={item.limit} onExpand={() => setUtilizationOpen(true)} />
                    {campaignActive && item.nextYear != null && (
                      <div className="px-3 py-2 rounded-lg bg-primary/[0.04] border border-primary/15 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Следующий год</span>
                        <span className="text-xs font-semibold text-foreground">{item.nextYear} млн ₽</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Potential Losses — current only */}
            <section id="potential" className="space-y-3">
              <h2 className="text-base font-semibold">Потенциальные потери</h2>
              <div className="grid grid-cols-3 gap-4">
                {([
                  { label: 'Чистые', value: risk.cleanOpRisk.value },
                  { label: 'Кредитные', value: risk.creditOpRisk.value },
                  { label: 'Косвенные', value: risk.indirectLosses.value },
                ] as const).map((item) => (
                  <div key={item.label} className="p-4 rounded-xl border border-border/60 bg-card space-y-1.5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80 font-medium">{item.label}</p>
                    <p className="text-lg font-semibold">{fmtVal(item.value)} <span className="text-xs font-normal text-muted-foreground">₽</span></p>
                  </div>
                ))}
              </div>
            </section>

            {/* Scenarios — current only */}
            <section id="scenarios" className="space-y-3">
              <h2 className="text-base font-semibold">Сценарии реализации риска</h2>
              {risk.scenarios.length > 0 ? (
                <div className="space-y-3">
                  {risk.scenarios.map((scenario) => (
                    <ScenarioDetailCard key={scenario.id} scenario={scenario} risk={risk} fmtVal={fmtVal} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Сценарии не добавлены</p>
              )}
            </section>

            {/* Mirroring */}
            {risk.mirrors.length > 0 && (
              <section id="mirroring" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Зеркалирование</h2>
                </div>

                {/* Group action for "my mirrors" awaiting approval */}
                {campaignActive && myPendingMirrors.length > 1 && (
                  <div className="p-3 rounded-lg bg-primary/[0.04] border border-primary/20 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">На вашем согласовании: {myPendingMirrors.length} {myPendingMirrors.length === 1 ? 'зеркало' : 'зеркала'}</span>
                      {selectedMirrorIds.size > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">Выбрано: {selectedMirrorIds.size}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="gap-1.5 h-8" onClick={approveAllMyMirrors}>
                        <Check className="w-3.5 h-3.5" />
                        Согласовать все мои зеркала
                      </Button>
                      <ReturnPopover
                        label="Вернуть выбранные"
                        helper="Комментарий будет применён ко всем выбранным зеркалам."
                        onSubmit={returnSelectedMirrors}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {risk.mirrors.map((mirror) => {
                    const r = readMirror(mirror);
                    const status = r.status;
                    const isMine = !!mirror.isMine;
                    const requiresMyApproval = isMine && status === 'Требует согласования';

                    // current per-loss-type values
                    const calc = (val: number, lim: number) => {
                      const v = Math.round(val * mirror.percentage / 100 * 10) / 10;
                      const l = Math.round(lim * mirror.percentage / 100 * 10) / 10;
                      const pct = l > 0 ? Math.round(v / l * 100) : 0;
                      return { v, l, pct };
                    };
                    const cClean = calc(risk.cleanOpRisk.value || 0, risk.cleanOpRisk.limit || 0);
                    const cCredit = calc(risk.creditOpRisk.value || 0, risk.creditOpRisk.limit || 0);
                    const cIndirect = calc(risk.indirectLosses.value || 0, risk.indirectLosses.limit || 0);

                    const ny = mirror.nextYearLimits;

                    const rows = [
                      { label: 'Чистые', cur: cClean, ny: ny?.cleanOp },
                      { label: 'В кредитовании', cur: cCredit, ny: ny?.creditOp },
                      { label: 'Косвенные', cur: cIndirect, ny: ny?.indirect },
                    ];

                    return (
                      <div key={mirror.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                        {/* Header: subdivision + status + select */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            {requiresMyApproval && (
                              <Checkbox
                                checked={selectedMirrorIds.has(mirror.id)}
                                onCheckedChange={() => toggleSelect(mirror.id)}
                                className="mt-1"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{mirror.subdivision}</p>
                              {status === 'Ожидает другого согласующего' && mirror.approver && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Ожидает согласования: {mirror.approver}
                                </p>
                              )}
                              {status === 'Согласовано' && mirror.approver && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Согласовал: {mirror.approver}
                                </p>
                              )}
                            </div>
                          </div>
                          {status && <MirrorStatusTag status={status} />}
                        </div>

                        {/* Per loss-type rows */}
                        <div className="space-y-2">
                          {rows.map(row => (
                            <div key={row.label} className="rounded-lg border border-border/50 overflow-hidden">
                              <div className="px-3 py-2 flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground w-28 shrink-0">{row.label}</span>
                                <div className="flex items-center gap-4 flex-1 justify-end">
                                  <span className="text-sm font-medium text-foreground">{row.cur.v} млн ₽</span>
                                  <span className={cn(
                                    "text-xs font-semibold w-10 text-right",
                                    row.cur.pct > 100 ? "text-destructive" : "text-muted-foreground"
                                  )}>
                                    {row.cur.pct}%
                                  </span>
                                  <span className="text-[11px] text-muted-foreground w-28 text-right">
                                    лимит {row.cur.l} млн ₽
                                  </span>
                                </div>
                              </div>
                              {campaignActive && row.ny != null && (
                                <div className="px-3 py-1.5 bg-primary/[0.04] border-t border-primary/10 flex items-center justify-between">
                                  <span className="text-[11px] text-muted-foreground">Следующий год</span>
                                  <span className="text-xs font-semibold text-foreground">{row.ny} млн ₽</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Returned comment */}
                        {status === 'Возвращено' && r.returnComment && (
                          <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/[0.04]">
                            <p className="text-[11px] uppercase tracking-wide font-medium text-destructive/80 mb-1">
                              Комментарий согласующего
                            </p>
                            <p className="text-xs text-foreground/90">{r.returnComment}</p>
                          </div>
                        )}

                        {/* Local actions only when this mirror needs my approval */}
                        {requiresMyApproval && (
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <ReturnPopover
                              label="Вернуть"
                              onSubmit={(c) => returnMirror(mirror.id, c)}
                            />
                            <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => approveMirror(mirror.id)}>
                              <Check className="w-3 h-3" />
                              Согласовать
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Connections */}
            <section id="connections" className="space-y-4">
              <h2 className="text-base font-semibold">Связи</h2>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Меры</h3>
                {mockMeasures.map((measure) => (
                  <div key={measure.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{measure.title}</p>
                      <p className="text-xs text-muted-foreground">{measure.id} • {measure.plannedDate}</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/40 shrink-0">
                      {measure.status}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Решения по рискам</h3>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Пересмотр стратегии реагирования</p>
                    <p className="text-xs text-muted-foreground">RSK-001 • 10.02.2026</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">В работе</Badge>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar — single Информация panel, no tab toggle */}
          <div className="space-y-4">
            <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <h3 className="text-sm font-semibold">Информация</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Статус</span>
                      <StatusTag status={risk.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Источник</span>
                      <span>{risk.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Подразделение</span>
                      <span className="text-right max-w-[160px] text-xs">{risk.subdivision}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Создан</span>
                      <span>{risk.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Автор</span>
                      <span className="text-right text-xs">{risk.author}</span>
                    </div>
                    {risk.riskOwner && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Владелец</span>
                        <span className="text-right text-xs">{risk.riskOwner}</span>
                      </div>
                    )}
                  </div>
                  {risk.responseStrategy && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-xs px-2.5 py-0.5 rounded-md font-medium border bg-primary/8 text-primary/80 border-primary/20">
                        {risk.responseStrategy}
                      </span>
                    </div>
                  )}
                </div>
              </div>


            <Button variant="outline" className="w-full gap-2" onClick={() => setHistoryOpen(true)}>
              <History className="w-4 h-4" />
              История изменений
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Button>

            <Button variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Добавить меру
            </Button>

            {/* Mirror approval block — separate from general risk approval */}
            {campaignActive && myPendingMirrors.length > 0 && (
              <div className="p-3 rounded-xl border border-primary/20 bg-primary/[0.04] space-y-2">
                <p className="text-xs font-semibold text-foreground">Зеркалирование</p>
                <p className="text-xs text-muted-foreground">
                  {myPendingMirrors.length} {myPendingMirrors.length === 1 ? 'требует' : 'требуют'} вашего согласования
                </p>
                <Button size="sm" className="w-full gap-1.5" onClick={approveAllMyMirrors}>
                  <Check className="w-3.5 h-3.5" />
                  Согласовать все мои зеркала
                </Button>
              </div>
            )}

            {/* General risk workflow actions — short labels */}
            <div className="sticky top-4 space-y-2 pt-2 border-t border-border">
              {risk.mirrorStage === 'Заполнение' ? (
                <Button variant="default" className="w-full" size="sm">Отправить зеркала</Button>
              ) : (
                <>
                  <Button variant="default" className="w-full" size="sm" disabled={risk.mirrorStage === 'Согласование'} title={risk.mirrorStage === 'Согласование' ? 'Сначала согласуйте зеркала' : undefined}>
                    Согласовать
                  </Button>
                  {risk.mirrorStage === 'Согласование' && (
                    <p className="text-[11px] text-muted-foreground text-center">Сначала согласуйте зеркала</p>
                  )}
                  <Button variant="outline" className="w-full" size="sm">Вернуть</Button>
                </>
              )}
              <Button variant="secondary" className="w-full gap-2" size="sm">
                <XCircle className="w-3.5 h-3.5" />
                Закрыть
              </Button>
            </div>

          </div>
        </div>
      </FullscreenLightbox>

      <UtilizationDrawer
        isOpen={utilizationOpen}
        onClose={() => setUtilizationOpen(false)}
      />
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
