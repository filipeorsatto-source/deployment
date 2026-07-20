import { useState } from "react";
import { useStore } from "../store";
import { deriveGaps, nameById } from "../lib/derive";
import { PRIORIDADES, prioClass } from "../lib/constants";
import { Badge, StatusBadge } from "../ui";

export function Gaps() {
  const { db } = useStore();
  const gaps = deriveGaps(db);
  const [f, setF] = useState({ tipo: "", prioridade: "", status: "" });
  const tipos = [...new Set(gaps.map((g) => g.tipo))];
  const filtered = gaps.filter((g) => (!f.tipo || g.tipo === f.tipo) && (!f.prioridade || g.prioridade === f.prioridade) && (!f.status || g.status === f.status));
  return (
    <div>
      <div className="page-head"><div className="h1">Gaps</div><p>Preenchido automaticamente: ações "Executada pelo produto" sem UoW e problemas sem regra. Gaps automáticos aparecem marcados; também há gaps manuais.</p></div>
      <div className="filters">
        <select className="select-sm" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}><option value="">Tipo</option>{tipos.map((t) => <option key={t}>{t}</option>)}</select>
        <select className="select-sm" value={f.prioridade} onChange={(e) => setF({ ...f, prioridade: e.target.value })}><option value="">Prioridade</option>{PRIORIDADES.map((p) => <option key={p}>{p}</option>)}</select>
        <select className="select-sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">Status</option><option>Aberto</option><option>Em análise</option><option>Resolvido</option></select>
        <span className="chip" style={{ marginLeft: "auto" }}>{filtered.length} gaps</span>
      </div>
      <div className="tbl-wrap"><div className="tbl-scroll"><table><thead><tr><th>Tipo</th><th>Origem</th><th>Processo</th><th>Ação</th><th>Operadora</th><th>Prioridade</th><th>Responsável</th><th>Status</th><th>Obs.</th></tr></thead>
        <tbody>{filtered.map((g) => (<tr key={g.id}>
          <td><Badge cls={g.tipo.includes("Unit") ? "b-red" : g.tipo.includes("Regra") ? "b-amber" : "b-blue"}>{g.tipo}</Badge> {g.auto && <span className="chip" style={{ marginLeft: 4 }}>auto</span>}</td>
          <td className="muted">{g.origem}</td>
          <td className="muted">{g.processo ? nameById(db.processos, g.processo) : "—"}</td>
          <td className="muted">{g.acao ? nameById(db.acoes, g.acao) : "—"}</td>
          <td className="muted">{g.operadora ? nameById(db.operadoras, g.operadora) : "—"}</td>
          <td><StatusBadge s={g.prioridade} fn={prioClass} /></td>
          <td className="muted">{g.responsavel ? nameById(db.funcionarios, g.responsavel) : "—"}</td>
          <td><Badge cls={g.status === "Resolvido" ? "b-green" : g.status === "Em análise" ? "b-amber" : "b-gray"}>{g.status}</Badge></td>
          <td className="muted" style={{ fontSize: 12, maxWidth: 180 }}>{g.obs}</td>
        </tr>))}
        {!filtered.length && <tr><td colSpan={9}><div className="empty">Nenhum gap no momento.</div></td></tr>}</tbody>
      </table></div></div>
    </div>
  );
}
