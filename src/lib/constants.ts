export const STATUS_FUTURO = ["Eliminada", "Executada pelo produto", "Executada por ação humana"];
export const OWNERS = ["Rivio", "Hospital"];
export const PRIORIDADES = ["Alta", "Média", "Baixa"];
export const REGRA_STATUS = ["Ativa", "Em teste", "Inativa"];
export const STATUS_WEIGHT: Record<string, number> = { Ativa: 1, "Em teste": 0.5, Inativa: 0 };
export const ETAPAS_UOW = [
  "01. Auditoria Concorrente", "02. Auditoria Retrospectiva", "03. Consenso",
  "04. Faturamento", "05. Conciliação", "06. Recurso de Glosa", "07. Conciliação de Recurso de Glosa",
];
export const MODOS_UOW = ["Automático (produto)", "Assistido (produto+manual)", "Manual (backoffice)", "Não executa"];
export const COBERTURAS = ["Coberta", "Em refinamento", "WIP", "Não coberta"];
export const PLATAFORMAS_UOW = ["Marvin", "Trinity", "ERP", "Unificado", "Metabase", "n/a"];

export const futuroClass = (s: string) => (({ "Eliminada": "b-red", "Executada pelo produto": "b-green", "Executada por ação humana": "b-blue" } as any)[s] || "b-gray");
export const ownerClass = (o: string) => (o === "Rivio" ? "b-purple" : "b-gray");
export const prioClass = (p: string) => (({ Alta: "b-red", "Média": "b-amber", Baixa: "b-gray" } as any)[p] || "b-gray");
export const regraStatusClass = (s: string) => (({ Ativa: "b-green", "Em teste": "b-amber", Inativa: "b-gray" } as any)[s] || "b-gray");
export const coberturaClass = (s: string) => (({ "Coberta": "b-green", "Em refinamento": "b-amber", "WIP": "b-blue", "Não coberta": "b-red" } as any)[s] || "b-gray");
export const modoClass = (s: string) => (({ "Automático (produto)": "b-green", "Assistido (produto+manual)": "b-amber", "Manual (backoffice)": "b-purple", "Não executa": "b-gray" } as any)[s] || "b-gray");
