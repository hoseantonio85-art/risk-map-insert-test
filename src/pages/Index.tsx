import { useState, useMemo } from 'react';
import { Plus, Pencil, Save, Send, X, ListTodo, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/risks/MetricCard';
import { RiskRow } from '@/components/risks/RiskRow';
import { CreateRiskForm } from '@/components/risks/CreateRiskForm';
import { RiskDetailView } from '@/components/risks/RiskDetailView';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockRisks } from '@/data/mockRisks';
import { Risk } from '@/types/risk';

type ScreenMode = 'view' | 'edit';

interface DraftLimits {
  [riskId: string]: {
    cleanOpRisk: number;
    creditOpRisk: number;
    indirectLosses: number;
    potentialLosses: number;
  };
}

const Index = () => {
  const [risks, setRisks] = useState<Risk[]>(mockRisks);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  
  // Screen mode state
  const [screenMode, setScreenMode] = useState<ScreenMode>('view');
  const [draftLimits, setDraftLimits] = useState<DraftLimits>({});
  const [pendingChanges, setPendingChanges] = useState<DraftLimits>({});

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRiskIds, setSelectedRiskIds] = useState<Set<string>>(new Set());

  // Filter state
  const [showTasksOnly, setShowTasksOnly] = useState(false);
  const [selectedSubdivision, setSelectedSubdivision] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026');

  const subdivisions = useMemo(() => {
    return [...new Set(risks.map(r => r.subdivision))];
  }, [risks]);

  const filteredRisks = useMemo(() => {
    let filtered = risks;
    if (showTasksOnly) {
      filtered = filtered.filter(r => r.status === 'В работе' || r.status === 'На согласовании');
    }
    if (selectedSubdivision !== 'all') {
      filtered = filtered.filter(r => r.subdivision === selectedSubdivision);
    }
    return filtered;
  }, [risks, showTasksOnly, selectedSubdivision]);

  const aggregates = useMemo(() => {
    const limitsToUse = screenMode === 'edit' ? draftLimits : pendingChanges;
    let cleanOpTotal = 0, cleanOpLimit = 0;
    let creditOpTotal = 0, creditOpLimit = 0;
    let indirectTotal = 0, indirectLimit = 0;
    let potentialTotal = 0;

    filteredRisks.forEach(risk => {
      const draft = limitsToUse[risk.id];
      cleanOpTotal += risk.cleanOpRisk.value || 0;
      cleanOpLimit += draft?.cleanOpRisk ?? (risk.cleanOpRisk.limit || 0);
      creditOpTotal += risk.creditOpRisk.value || 0;
      creditOpLimit += draft?.creditOpRisk ?? (risk.creditOpRisk.limit || 0);
      indirectTotal += risk.indirectLosses.value || 0;
      indirectLimit += draft?.indirectLosses ?? (risk.indirectLosses.limit || 0);
      potentialTotal += risk.potentialLosses || 0;
    });

    return {
      cleanOpRisk: { total: cleanOpTotal, limit: cleanOpLimit, utilization: cleanOpLimit > 0 ? Math.round((cleanOpTotal / cleanOpLimit) * 100) : 0 },
      creditOpRisk: { total: creditOpTotal, limit: creditOpLimit, utilization: creditOpLimit > 0 ? Math.round((creditOpTotal / creditOpLimit) * 100) : 0 },
      indirectLosses: { total: indirectTotal, limit: indirectLimit, utilization: indirectLimit > 0 ? Math.round((indirectTotal / indirectLimit) * 100) : 0 },
      potentialLosses: { total: potentialTotal },
    };
  }, [filteredRisks, screenMode, draftLimits, pendingChanges]);

  const handleRiskClick = (risk: Risk) => {
    setSelectedRisk(risk);
    setIsDetailOpen(true);
  };

  const handleCreateRisk = (newRisk: Partial<Risk>) => {
    const fullRisk: Risk = {
      ...newRisk,
      id: newRisk.id || `QNR-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'В работе',
      block: 'Блок Сеть продаж',
      subdivision: newRisk.subdivision || 'Управление продаж и обслуживания',
      process: newRisk.process || '',
      riskName: newRisk.riskProfile || '',
      riskLevel: newRisk.riskLevel || 'Низкий',
      riskProfile: newRisk.riskProfile || '',
      cleanOpRisk: newRisk.cleanOpRisk || { value: 0, utilization: 0 },
      creditOpRisk: newRisk.creditOpRisk || { value: 0, utilization: 0 },
      indirectLosses: newRisk.indirectLosses || { value: 0, utilization: 0 },
      potentialLosses: newRisk.potentialLosses || 0,
      responseStrategy: newRisk.responseStrategy || '',
      qualitativeLosses: newRisk.qualitativeLosses || '',
      scenarios: newRisk.scenarios || [],
      mirrors: newRisk.mirrors || [],
      author: 'Садыков Илья',
      createdAt: new Date().toLocaleDateString('ru-RU'),
      source: 'Ручное создание',
    } as Risk;
    setRisks([...risks, fullRisk]);
  };

  const handleEditRisk = (risk: Risk) => {
    setEditingRisk(risk);
    setIsDetailOpen(false);
    setIsEditOpen(true);
  };

  const handleSaveRiskEdit = (updatedRisk: Partial<Risk>) => {
    setRisks(risks.map(r => r.id === editingRisk?.id ? { ...r, ...updatedRisk } : r));
    setIsEditOpen(false);
    setEditingRisk(null);
  };

  const handleLimitChange = (riskId: string, field: 'cleanOpRisk' | 'creditOpRisk' | 'indirectLosses' | 'potentialLosses', value: number) => {
    const risk = risks.find(r => r.id === riskId);
    setDraftLimits(prev => ({
      ...prev,
      [riskId]: {
        cleanOpRisk: prev[riskId]?.cleanOpRisk ?? (risk?.cleanOpRisk.limit || 0),
        creditOpRisk: prev[riskId]?.creditOpRisk ?? (risk?.creditOpRisk.limit || 0),
        indirectLosses: prev[riskId]?.indirectLosses ?? (risk?.indirectLosses.limit || 0),
        potentialLosses: prev[riskId]?.potentialLosses ?? (risk?.potentialLosses || 0),
        [field]: value,
      },
    }));
  };

  const handleStartEdit = () => {
    const initialDraft: DraftLimits = {};
    risks.forEach(risk => {
      initialDraft[risk.id] = pendingChanges[risk.id] || {
        cleanOpRisk: risk.cleanOpRisk.limit || 0,
        creditOpRisk: risk.creditOpRisk.limit || 0,
        indirectLosses: risk.indirectLosses.limit || 0,
        potentialLosses: risk.potentialLosses || 0,
      };
    });
    setDraftLimits(initialDraft);
    setSelectionMode(false);
    setSelectedRiskIds(new Set());
    setScreenMode('edit');
  };

  const handleCancelEdit = () => {
    setDraftLimits({});
    setScreenMode('view');
  };

  const handleSaveLimits = () => {
    setPendingChanges(draftLimits);
    setScreenMode('view');
  };

  const handleSendForApproval = () => {
    const idsToSend = selectionMode && selectedRiskIds.size > 0
      ? [...selectedRiskIds]
      : Object.keys(pendingChanges);

    setRisks(risks.map(r => {
      if (idsToSend.includes(r.id) && pendingChanges[r.id]) {
        return {
          ...r,
          status: 'На согласовании' as const,
          cleanOpRisk: { ...r.cleanOpRisk, limit: pendingChanges[r.id].cleanOpRisk },
          creditOpRisk: { ...r.creditOpRisk, limit: pendingChanges[r.id].creditOpRisk },
          indirectLosses: { ...r.indirectLosses, limit: pendingChanges[r.id].indirectLosses },
        };
      }
      return r;
    }));
    setPendingChanges({});
    setDraftLimits({});
    setSelectionMode(false);
    setSelectedRiskIds(new Set());
  };

  const handleReturnForRevision = () => {
    setRisks(risks.map(r => r.status === 'На согласовании' ? { ...r, status: 'В работе' as const } : r));
  };

  const handleToggleSelect = (riskId: string) => {
    setSelectedRiskIds(prev => {
      const next = new Set(prev);
      if (next.has(riskId)) next.delete(riskId);
      else next.add(riskId);
      return next;
    });
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedRiskIds(new Set());
    }
    setSelectionMode(!selectionMode);
  };

  const pendingChangesCount = Object.keys(pendingChanges).filter(id => {
    const risk = risks.find(r => r.id === id);
    const pending = pendingChanges[id];
    if (!risk || !pending) return false;
    return (
      pending.cleanOpRisk !== (risk.cleanOpRisk.limit || 0) ||
      pending.creditOpRisk !== (risk.creditOpRisk.limit || 0) ||
      pending.indirectLosses !== (risk.indirectLosses.limit || 0) ||
      pending.potentialLosses !== (risk.potentialLosses || 0)
    );
  }).length;

  const awaitingApprovalCount = risks.filter(r => r.status === 'На согласовании').length;
  const tasksCount = risks.filter(r => r.status === 'В работе' || r.status === 'На согласовании').length;

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* === HEADER === */}
        <div className="px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">Карта рисков за период</h1>
              {screenMode === 'edit' && (
                <Badge variant="default" className="gap-1.5">Режим редактирования</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {screenMode === 'view' && (
                <>
                  <Button variant="outline" onClick={handleStartEdit} className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Редактировать лимиты
                  </Button>
                  <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Создать риск
                  </Button>
                </>
              )}
              {screenMode === 'edit' && (
                <>
                  <Button variant="outline" onClick={handleCancelEdit} className="gap-2">
                    <X className="w-4 h-4" />
                    Отменить редактирование
                  </Button>
                  <Button onClick={handleSaveLimits} className="gap-2">
                    <Save className="w-4 h-4" />
                    Сохранить
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* === SCROLLABLE CONTENT === */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                title="Чистый операционный риск"
                value={`${aggregates.cleanOpRisk.total.toLocaleString('ru-RU')} млн руб.`}
                subValue={`из ${aggregates.cleanOpRisk.limit.toLocaleString('ru-RU')} млн руб.`}
                utilization={aggregates.cleanOpRisk.utilization}
              />
              <MetricCard
                title="Оперриск в кредитовании"
                value={`${aggregates.creditOpRisk.total.toLocaleString('ru-RU')} млн руб.`}
                subValue={`из ${aggregates.creditOpRisk.limit.toLocaleString('ru-RU')} млн руб.`}
                utilization={aggregates.creditOpRisk.utilization}
              />
              <MetricCard
                title="Косвенные потери"
                value={`${aggregates.indirectLosses.total.toLocaleString('ru-RU')} млн руб.`}
                subValue={`из ${aggregates.indirectLosses.limit.toLocaleString('ru-RU')} млн руб.`}
                utilization={aggregates.indirectLosses.utilization}
              />
              <MetricCard
                title="Потенциальные потери"
                value={`${aggregates.potentialLosses.total.toLocaleString('ru-RU')} млн руб.`}
                utilization={0}
                showDonut={false}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <ToggleGroup
                type="single"
                value={showTasksOnly ? 'tasks' : ''}
                onValueChange={(val) => setShowTasksOnly(val === 'tasks')}
              >
                <ToggleGroupItem value="tasks" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <ListTodo className="w-4 h-4" />
                  Задачи
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-md bg-background/20 font-medium">{tasksCount}</span>
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="h-6 w-px bg-border" />

              <Select value={selectedSubdivision} onValueChange={setSelectedSubdivision}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Подразделение" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все подразделения</SelectItem>
                  {subdivisions.map(sub => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1" />

              {/* Selection button moved to footer */}

              <span className="text-sm text-muted-foreground">
                Показано {filteredRisks.length} из {risks.length}
              </span>
            </div>

            {/* Risk List */}
            <div className="space-y-2">
              {filteredRisks.map((risk) => (
                <RiskRow
                  key={risk.id}
                  risk={risk}
                  mode={screenMode}
                  draftLimits={screenMode === 'edit' ? draftLimits[risk.id] : undefined}
                  onLimitChange={handleLimitChange}
                  onRiskClick={handleRiskClick}
                  selectionMode={selectionMode}
                  isSelected={selectedRiskIds.has(risk.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
              {filteredRisks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Нет рисков, соответствующих выбранным фильтрам
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === FOOTER: Workflow (View mode only) === */}
        {screenMode === 'view' && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant={selectionMode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="gap-1.5"
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectionMode ? `Отменить выбор (${selectedRiskIds.size})` : 'Выбрать несколько'}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {pendingChangesCount > 0 && (
                    <span><span className="font-medium text-foreground">{pendingChangesCount}</span> с изменёнными лимитами</span>
                  )}
                  {pendingChangesCount > 0 && awaitingApprovalCount > 0 && ' • '}
                  {awaitingApprovalCount > 0 && (
                    <span><span className="font-medium text-foreground">{awaitingApprovalCount}</span> на согласовании</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleReturnForRevision} disabled={awaitingApprovalCount === 0}>
                  Вернуть на доработку
                </Button>
                <Button onClick={handleSendForApproval} disabled={pendingChangesCount === 0 && selectedRiskIds.size === 0} className="gap-2">
                  <Send className="w-4 h-4" />
                  Отправить на согласование
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateRiskForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={handleCreateRisk} />
      <CreateRiskForm isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingRisk(null); }} onSave={handleSaveRiskEdit} editRisk={editingRisk} />
      <RiskDetailView risk={selectedRisk} isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedRisk(null); }} onEdit={handleEditRisk} />
    </MainLayout>
  );
};

export default Index;
