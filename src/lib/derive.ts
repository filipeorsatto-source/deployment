import type { DB, Named } from "../types";

export const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 9);
export const nameById = (list: Named[], id: string) => { const x = list.find((i) => i.id === id); return x ? x.nome : "—"; };
export const namesByIds = (list: Named[], ids: string[] = []) => (ids || []).map((id) => nameById(list, id));

export function deriveTobe(db: DB) {
  return db.acoes.map((a) => {
    const t = db.tobe[a.id] || { statusFuturo: "Executada por ação humana", owner: "Hospital", uows: [], obs: "" };
    const proc = db.processos.find((p) => p.id === a.processo);
    const owner = t.owner || (t.statusFuturo === "Executada pelo produto" ? "Rivio" : "Hospital");
    const cobre = t.statusFuturo === "Executada pelo produto" && (t.uows || []).length > 0;
    const isGap = t.statusFuturo === "Executada pelo produto" && (!t.uows || t.uows.length === 0);
    return { ...a, proc, statusFuturo: t.statusFuturo, owner, uows: t.uows || [], obs: t.obs || "", cobre, isGap };
  });
}

export function deriveGaps(db: DB) {
  const rows = deriveTobe(db);
  const auto: any[] = [];
  rows.forEach((r) => {
    if (r.isGap)
      auto.push({ id: "auto_" + r.id, tipo: "Sem Unit of Work", origem: "To Be", processo: r.processo, acao: r.id, operadora: r.operadoras[0] || "", prioridade: "Alta", responsavel: "", status: "Aberto", obs: "Ação será executada pelo produto mas nenhuma UoW a cobre.", auto: true });
  });
  db.problemas.forEach((pb) => {
    const hasRule = db.regras.some((r) => (r.problemas || []).includes(pb.id));
    if (!hasRule)
      auto.push({ id: "autoR_" + pb.id, tipo: "Regra não criada", origem: "Regras", processo: "", acao: "", operadora: (pb.operadoras || [])[0] || "", prioridade: pb.prioridade, responsavel: "", status: "Aberto", obs: 'Problema "' + pb.nome + '" sem regra vinculada.', auto: true });
  });
  return [...auto, ...db.gapsManuais.map((g) => ({ ...g, auto: false }))];
}
