import { useState } from "react";
import { useStore } from "../store";
import { uid, namesByIds } from "../lib/derive";
import { PRIORIDADES, REGRA_STATUS, prioClass, regraStatusClass } from "../lib/constants";
import { Badge, StatusBadge, Modal, Field, MultiSelect, MiniDropdown, Ic, icons } from "../ui";
import type { DB } from "../types";

export function Regras() {
  const { db, upd } = useStore();
  const [editP, setEditP] = useState<any>(null);
  const [editR, setEditR] = useState<any>(null);
  const [f, setF] = useState({ operadora: "", item: "" });
  const matchP = (p: any) => (!f.operadora || (p.operadoras || []).includes(f.operadora)) && (!f.item || (p.itensConta || []).includes(f.item));
  const matchR = (r: any) => (!f.operadora || (r.operadoras || []).includes(f.operadora)) && (!f.item || (r.itensConta || []).includes(f.item));
  const problemas = db.problemas.filter(matchP);
  const regras = db.regras.filter(matchR);
  return (
    <div>
      <div className="page-head"><div className="h1">Regras de Auditoria</div><p>Cadastre problemas (dores e motivos de glosa) com um score de esforço (0–10) e as regras que os endereçam. Uma regra pode atender vários problemas.</p></div>
      <div className="filters">
        <select className="select-sm" value={f.operadora} onChange={(e) => setF({ ...f, operadora: e.target.value })}><option value="">Operadora</option>{db.operadoras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        <select className="select-sm" value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })}><option value="">Item da conta</option>{db.itensConta.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        {(f.operadora || f.item) && <button className="btn ghost sm" onClick={() => setF({ operadora: "", item: "" })}>Limpar</button>}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        <div>
          <div className="between" style={{ marginBottom: 10 }}><div className="h2">Motivos & Dores <span className="chip">{problemas.length}</span></div><button className="btn primary sm" onClick={() => setEditP({})}><Ic d={icons.plus} size={13} />Problema</button></div>
          {problemas.map((p) => { const regrasRel = db.regras.filter((r) => (r.problemas || []).includes(p.id)); return (
            <div className="act-item" key={p.id}>
              <div className="between"><div className="row"><Badge cls={p.tipo === "Dor operacional" ? "b-blue" : "b-red"}>{p.tipo}</Badge><StatusBadge s={p.prioridade} fn={prioClass} /><span className="chip" title="Esforço / score">★ {p.esforco}/10</span></div>
                <div className="row" style={{ gap: 4 }}><button className="btn ghost sm" onClick={() => setEditP(p)}>Editar</button><button className="btn ghost sm danger" onClick={() => upd((d: DB) => { d.problemas = d.problemas.filter((x) => x.id !== p.id); })}>×</button></div></div>
              <div style={{ fontWeight: 650, marginTop: 5 }}>{p.nome}</div>
              <div className="muted" style={{ fontSize: 12, margin: "2px 0 6px" }}>{p.descricao}</div>
              <div className="chips">{namesByIds(db.operadoras, p.operadoras).map((n, i) => <span key={i} className="chip">{n}</span>)}{namesByIds(db.itensConta, p.itensConta).map((n, i) => <span key={i} className="chip b-purple">{n}</span>)}{namesByIds(db.tiposAtendimento, p.tiposAtendimento).map((n, i) => <span key={i} className="chip b-blue">{n}</span>)}
                <span className="chip" style={{ background: regrasRel.length ? "var(--green-soft)" : "var(--red-soft)", color: regrasRel.length ? "#15803d" : "#b91c1c" }}>{regrasRel.length} regra(s)</span></div>
            </div>); })}
          {!problemas.length && <div className="empty">Nenhum problema.</div>}
        </div>
        <div>
          <div className="between" style={{ marginBottom: 10 }}><div className="h2">Regras <span className="chip">{regras.length}</span></div><button className="btn primary sm" onClick={() => setEditR({})}><Ic d={icons.plus} size={13} />Regra</button></div>
          <div className="tbl-wrap"><div className="tbl-scroll"><table>
            <thead><tr><th>Regra</th><th>Item</th><th>Operadora</th><th>Problemas</th><th>Status</th><th /></tr></thead>
            <tbody>{regras.map((r) => (<tr key={r.id}>
              <td style={{ minWidth: 150 }}><div style={{ fontWeight: 600 }}>{r.nome}</div><div className="muted" style={{ fontSize: 11.5 }}>{r.descricao}</div></td>
              <td><span className="chips">{namesByIds(db.itensConta, r.itensConta).map((n, i) => <span className="chip" key={i}>{n}</span>)}</span></td>
              <td><span className="chips">{namesByIds(db.operadoras, r.operadoras).map((n, i) => <span className="chip" key={i}>{n}</span>)}</span></td>
              <td><MiniDropdown label={(r.problemas || []).length + " problema(s)"} items={namesByIds(db.problemas, r.problemas)} /></td>
              <td><StatusBadge s={r.status} fn={regraStatusClass} /></td>
              <td><div className="row" style={{ gap: 4 }}><button className="btn ghost sm" onClick={() => setEditR(r)}>Editar</button><button className="btn ghost sm danger" onClick={() => upd((d: DB) => { d.regras = d.regras.filter((x) => x.id !== r.id); })}>×</button></div></td>
            </tr>))}
            {!regras.length && <tr><td colSpan={6}><div className="empty">Nenhuma regra.</div></td></tr>}</tbody>
          </table></div></div>
        </div>
      </div>
      {editP && <ProblemaEditor p={editP} onClose={() => setEditP(null)} onSave={(data: any) => { upd((d: DB) => { if (editP.id) Object.assign(d.problemas.find((x) => x.id === editP.id)!, data); else d.problemas.push({ id: uid("pb"), ...data }); }); setEditP(null); }} />}
      {editR && <RegraEditor r={editR} onClose={() => setEditR(null)} onSave={(data: any) => { upd((d: DB) => { if (editR.id) Object.assign(d.regras.find((x) => x.id === editR.id)!, data); else d.regras.push({ id: uid("r"), ...data }); }); setEditR(null); }} />}
    </div>
  );
}

function ProblemaEditor({ p, onClose, onSave }: any) {
  const { db } = useStore();
  const [f, setF] = useState<any>({ tipo: "Motivo de glosa", nome: "", descricao: "", operadoras: [], itensConta: [], tiposAtendimento: [], prioridade: "Média", esforco: 5, ...p });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <Modal title={p.id ? "Editar problema" : "Novo problema"} onClose={onClose} onSave={() => { if (f.nome) onSave(f); }}>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Tipo"><select value={f.tipo} onChange={(e) => set("tipo", e.target.value)}><option>Dor operacional</option><option>Motivo de glosa</option></select></Field>
        <Field label="Prioridade"><select value={f.prioridade} onChange={(e) => set("prioridade", e.target.value)}>{PRIORIDADES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label={"Esforço / Score: " + f.esforco + "/10"}><input type="range" min={0} max={10} value={f.esforco} onChange={(e) => set("esforco", +e.target.value)} /></Field>
      </div>
      <Field label="Nome"><input type="text" value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Field>
      <Field label="Descrição"><textarea rows={2} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} /></Field>
      <Field label="Operadora (múltipla)"><MultiSelect options={db.operadoras} value={f.operadoras} onChange={(v) => set("operadoras", v)} /></Field>
      <Field label="Item da conta (múltipla)"><MultiSelect options={db.itensConta} value={f.itensConta} onChange={(v) => set("itensConta", v)} /></Field>
      <Field label="Tipo de atendimento (múltipla)"><MultiSelect options={db.tiposAtendimento} value={f.tiposAtendimento} onChange={(v) => set("tiposAtendimento", v)} /></Field>
    </Modal>
  );
}

function RegraEditor({ r, onClose, onSave }: any) {
  const { db } = useStore();
  const [f, setF] = useState<any>({ nome: "", descricao: "", itensConta: [], operadoras: [], tiposAtendimento: [], problemas: [], status: "Ativa", obs: "", ...r });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <Modal title={r.id ? "Editar regra" : "Nova regra"} onClose={onClose} onSave={() => { if (f.nome) onSave(f); }}>
      <Field label="Nome"><input type="text" value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Field>
      <Field label="Descrição"><textarea rows={2} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} /></Field>
      <Field label="Status"><select value={f.status} onChange={(e) => set("status", e.target.value)}>{REGRA_STATUS.map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Operadora (múltipla)"><MultiSelect options={db.operadoras} value={f.operadoras} onChange={(v) => set("operadoras", v)} /></Field>
      <Field label="Item da conta (múltipla)"><MultiSelect options={db.itensConta} value={f.itensConta} onChange={(v) => set("itensConta", v)} /></Field>
      <Field label="Tipo de atendimento (múltipla)"><MultiSelect options={db.tiposAtendimento} value={f.tiposAtendimento} onChange={(v) => set("tiposAtendimento", v)} /></Field>
      <Field label="Problemas relacionados (múltipla)"><MultiSelect options={db.problemas} value={f.problemas} onChange={(v) => set("problemas", v)} /></Field>
      <Field label="Observações"><textarea rows={2} value={f.obs} onChange={(e) => set("obs", e.target.value)} /></Field>
    </Modal>
  );
}
