export interface Risk {
  id: string;
  status: 'Утверждён' | 'В работе' | 'На согласовании' | 'Черновик';
  block: string;
  subdivision: string;
  process: string;
  riskName: string;
  description?: string;
  riskLevel: 'Высокий' | 'Средний' | 'Низкий';
  riskProfile: string;

  // Workflow stage for limit campaign: mirroring fill → mirror approval → final approval
  mirrorStage?: 'Заполнение' | 'Согласование' | 'Согласовано';

  
  // Loss limits
  cleanOpRisk: LossLimit;
  creditOpRisk: LossLimit;
  indirectLosses: LossLimit;
  potentialLosses: number;
  
  // Strategy
  responseStrategy: string;
  qualitativeLosses: string;
  
  // Scenarios
  scenarios: Scenario[];
  
  // Mirroring
  mirrors: Mirror[];
  
  // Meta
  author: string;
  createdAt: string;
  source: string;

  // Monitoring workflow (optional)
  monitoringStatus?: MonitoringStatus;
  signals?: MonitoringSignal[];
  rpComment?: string;
  riskPartner?: string;
  riskOwner?: string;
  sentToRpAt?: string;

  // Limit campaign (optional)
  campaignStatus?: CampaignStatus;
  campaignComment?: string;
  proposedLimits?: {
    cleanOpRisk?: number;
    creditOpRisk?: number;
    indirectLosses?: number;
    potentialLosses?: number;
    justification?: string;
  };
}

export type MonitoringStatus =
  | 'Утверждён'
  | 'На оценке'
  | 'Согласование РП'
  | 'Корректировка'
  | 'Требует внимания';

export type MonitoringSignal =
  | 'Лимит превышен'
  | 'Уровень риска вырос'
  | 'Новые инциденты'
  | 'Прогноз ухудшился';

export type CampaignStatus =
  | 'Черновик лимита'
  | 'На согласовании'
  | 'Возвращён на корректировку'
  | 'Согласован'
  | 'Утверждён'
  | 'Исключён из кампании';

export interface LossLimit {
  value: number;
  utilization: number;
  limit?: number;
  fact2024?: number;
  fact2025?: number;
  forecast2025?: number;
}

export interface Scenario {
  id: string;
  description: string;
  percentage: number;
  groupScenario: string;
  causeType?: string;
  itService?: string;
  riskTypes?: string[];
  probability?: number;
  sources?: { type: string; count: number; hasNew?: boolean }[];
  riskKind?: string;
  measures?: { id: string; title: string; date: string; dateLabel?: string; status: string; statusTone?: 'progress' | 'done' | 'new' }[];
  factClean?: number;
  factCredit?: number;
  factIndirect?: number;
}


export type MirrorApprovalStatus =
  | 'Черновик'
  | 'Требует согласования'
  | 'Согласовано'
  | 'Возвращено'
  | 'Ожидает другого согласующего';

export interface Mirror {
  id: string;
  subdivision: string;
  percentage: number;
  fact?: number;
  factPercentage?: number;
  limitLastYear?: number;
  utilizationLastYear?: string;

  // Mirror approval workflow (independent of risk status)
  approvalStatus?: MirrorApprovalStatus;
  approver?: string;
  isMine?: boolean;
  returnComment?: string;
  returnCommentDate?: string;
  returnCommentAuthor?: string;
  currentLimits?: { cleanOp?: number; creditOp?: number; indirect?: number };
  currentFact?: { cleanOp?: number; creditOp?: number; indirect?: number };
  nextYearLimits?: {
    cleanOp?: number;
    creditOp?: number;
    indirect?: number;
  };
}

export interface Incident {
  id: string;
  title: string;
  date: string;
  directLosses: number;
  indirectLosses: number;
  status: 'Утверждён' | 'В работе';
}

export interface Measure {
  id: string;
  title: string;
  plannedDate: string;
  status: 'Новая' | 'В работе' | 'Выполнена';
}

export interface MonthlyLoss {
  month: string;
  directLosses: number;
  indirectLosses: number;
}
