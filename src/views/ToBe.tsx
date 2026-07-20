import { useState } from "react";
import { useStore } from "../store";
import { deriveTobe, nameById, namesByIds } from "../lib/derive";
import { STATUS_FUTURO, OWNERS } from "../lib/constants";
import { Badge, Chips } from "../ui";

export function ToBe() {
  const { db, upd } = useStore();
  const rows = deriveTobe(db);
  const [f, setF] = useState({ operadora: "", atendimento: "", responsavel: "", status: "", owner: "", gap: "" });
  const [uowPick, setUowPick] = useState<string | null>(null);
  const filtered = rows.filter((r) =>
    (!f.operadora || r.operadoras.includes(f.operadora)) && (!f.atendimento || r.tiposAtendimento.includes(f.atendimento)) &&
    (!f.responsavel || r.responsavel === f.responsavel) && (!f.status || r.statusFuturo === f.status) &&
    (!f.owner || r.owner === f.owner) && (f.gap === "" || (f.gap === "sim" ? r.isGap : !r.isGap)));
  const setStatus = (aid: string, val: string) => upd((d) => { const t = d.tobe[aid] || { statusFuturo: "", owner: "Hospital", uows: [], obs: "" }; t.statusFuturo = val; if (val !== "Executada pelo produto") t.uows = []; if (val === "Executada pelo produto") t.owner = "Rivio"; d.tobe[aid] = t; });
  const setOwner = (aid: string, val: string) => upd((d) => { const t = d.tobe[aid] || { statusFuturo: "Executada por ação humana", owner: val, uows: [], obs: "" }; t.owner = val; d.tobe[aid] = t; });
  const toggleUow = (aid: string, u: string) => upd((d) => { const t = d.tobe[aid] || { statusFuturo: "Executada pelo produto", owner: "Rivio", uows: [], obs: "" }; t.uows = t.uows.includes(u) ? t.uows.filter((x) => x !== u) : [...t.uows, u]; d.tobe[aid] = t; });

  return (
    <div>
      <div className="page-head"><div className="h1">To Be</div><p>Gerado a partir das ações do AS IS. Defina o status futuro, o owner (Rivio ou Hospital) e as Units of Work. Ação marcada como "Executada pelo produto" sem UoW vira Gap automaticamente.</p></div>
      <div className="filters">
        <select className="select-sm" value={f.operadora} onChange={(e) => setF({ ...f, operadora: e.target.value })}><option value="">Operadora</option>{db.operadoras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        <select className="select-sm" value={f.atendimento} onChange={(e) => setF({ ...f, atendimento: e.target.value })}><option value="">Atendimento</option>{db.tiposAtendimento.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        <select className="select-sm" value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })}><option value="">Responsável</option>{db.funcionarios.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        <select className="select-sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">Status futuro</option>{STATUS_FUTURO.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="select-sm" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })}><option value="">Owner</option>{OWNERS.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="select-sm" value={f.gap} onChange={(e) => setF({ ...f, gap: e.target.value })}><option value="">Gap?</option><option value="sim">Só gaps</option><option value="nao">Sem gap</option></select>
        <span className="chip" style={{ marginLeft: "auto" }}>{filtered.length} ações</span>
      </div>
      <div className="tbl-wrap"><div className="tbl-scroll"><table>
        <thead><tr><th>Ação</th><th>Processo</th><th>Operadora</th><th>Atendimento</th><th>Status futuro</th><th>Owner</th><th>Unit of Work</th><th>Gap</th><th>Obs.</th></tr></thead>
        <tbody>{filtered.map((r) => (<tr key={r.id}>
          <td style={{ minWidth: 180 }}><div style={{ fontWeight: 600 }}>{r.nome}</div></td>
          <td className="muted">{r.proc ? r.proc.nome : "—"}</td>
          <td><Chips items={namesByIds(db.operadoras, r.operadoras)} /></td>
          <td><Chips items={namesByIds(db.tiposAtendimento, r.tiposAtendimento)} /></td>
          <td><select className="select-sm" value={r.statusFuturo} onChange={(e) => setStatus(r.id, e.target.value)}>{STATUS_FUTURO.map((s) => <option key={s}>{s}</option>)}</select></td>
          <td><select className="select-sm" value={r.owner} onChange={(e) => setOwner(r.id, e.target.value)}>{OWNERS.map((s) => <option key={s}>{s}</option>)}</select></td>
          <td style={{ minWidth: 150 }}>{r.statusFuturo === "Executada pelo produto" ? (<div>
            <div className="chips" style={{ marginBottom: 4 }}>{r.uows.map((u) => <span key={u} className="chip b-green">{nameById(db.unitsOfWork, u)}</span>)}</div>
            <button className="btn ghost sm link" onClick={() => setUowPick(uowPick === r.id ? null : r.id)}>{r.uows.length ? "editar" : "+ vincular UoW"}</button>
            {uowPick === r.id && <div className="card card-pad" style={{ marginTop: 6, maxWidth: 300, maxHeight: 260, overflow: "auto" }}>{db.unitsOfWork.map((u) => (<label key={u.id} className="row" style={{ gap: 6, padding: "3px 0", cursor: "pointer" }}><input type="checkbox" checked={r.uows.includes(u.id)} onChange={() => toggleUow(r.id, u.id)} /><span style={{ fontSize: 12 }}>{u.id} · {u.nome}</span></label>))}</div>}
          </div>) : <span className="dim">—</span>}</td>
          <td>{r.isGap ? <Badge cls="b-red">Gap</Badge> : <Badge cls="b-green">OK</Badge>}</td>
          <td className="muted" style={{ fontSize: 12, maxWidth: 150 }}>{r.obs || "—"}</td>
        </tr>))}
        {!filtered.length && <tr><td colSpan={9}><div className="empty">Nenhuma ação. Cadastre processos e ações no AS IS.</div></td></tr>}</tbody>
      </table></div></div>
    </div>
  );
}
