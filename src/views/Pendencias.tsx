import { useMemo, useState } from "react";
import { useStore } from "../store";
import { uid, namesByIds } from "../lib/derive";
import { Badge, Modal, Field, MultiSelect, MiniDropdown, Ic, icons } from "../ui";
import type { DB } from "../types";

const STATUS = ["Ativa", "Inativa"];
const statusClass = (s: string) => (s === "Ativa" ? "b-green" : "b-gray");

export function Pendencias() {
  const { db, upd } = useStore();
  const [f, setF] = useState({ operadora: "", setor: "", status: "" });
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<any>(null);

  const regrasOpt = useMemo(() => db.regras.map((r) => ({ id: r.id, nome: r.nome })), [db.regras]);
  const match = (p: any) =>
    (!f.operadora || (p.operadorasAplicaveis || []).includes(f.operadora)) &&
    (!f.setor || p.setor === f.setor) &&
    (!f.status || p.status === f.status) &&
    (!q || (p.nome + " " + p.descricao).toLowerCase().includes(q.toLowerCase()));
  const rows = db.pendencias.filter(match);
  const semRegra = db.pendencias.filter((p) => !(p.regras || []).length).length;

  return (
    <div>
      <div className="page-head">
        <div className="h1">Pendências</div>
        <p>Pendências do módulo de gestão do Tasy que impactam negativamente a conta do paciente. Cada uma se aplica a operadoras específicas, tem setor/responsável, pode alertar por e-mail e nasce de pelo menos uma regra de auditoria.</p>
      </div>

      <div className="filters">
        <input type="text" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 200 }} />
        <select className="select-sm" value={f.operadora} onChange={(e) => setF({ ...f, operadora: e.target.value })}><option value="">Operadora</option>{db.operadoras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        <select className="select-sm" value={f.setor} onChange={(e) => setF({ ...f, setor: e.target.value })}><option value="">Setor</option>{db.setores.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        <select className="select-sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">Status</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
        <span className="chip">{rows.length}</span>
        {semRegra > 0 && <Badge cls="b-red">{semRegra} sem regra</Badge>}
        <button className="btn primary sm" style={{ marginLeft: "auto" }} onClick={() => setEdit({})}><Ic d={icons.plus} size={13} />Nova pendência</button>
      </div>

      <div className="tbl-wrap"><div className="tbl-scroll" style={{ maxHeight: "calc(100vh - 250px)" }}><table>
        <thead><tr><th>Pendência</th><th>Setor</th><th>Responsável</th><th>E-mail</th><th>Regras</th><th>Operadoras</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map((p) => {
          const regs = (p.regras || []).length;
          return (<tr key={p.id}>
            <td style={{ fontWeight: 600, minWidth: 220 }}>{p.nome}{p.descricao && <div className="muted" style={{ fontSize: 11.5, fontWeight: 400 }}>{p.descricao}</div>}</td>
            <td className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{namesByIds(db.setores, p.setor ? [p.setor] : [])[0] || <span className="dim">—</span>}</td>
            <td className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{namesByIds(db.funcionarios, p.responsavel ? [p.responsavel] : [])[0] || <span className="dim">—</span>}</td>
            <td>{p.alertaEmail ? <Badge cls="b-blue">✓ e-mail</Badge> : <span className="dim">—</span>}</td>
            <td>{regs ? <MiniDropdown label={regs + " regra(s)"} items={namesByIds(db.regras, p.regras)} /> : <Badge cls="b-red">sem regra</Badge>}</td>
            <td><MiniDropdown label={(p.operadorasAplicaveis || []).length + " oper."} items={namesByIds(db.operadoras, p.operadorasAplicaveis)} /></td>
            <td><Badge cls={statusClass(p.status)}>{p.status}</Badge></td>
            <td><div className="row" style={{ gap: 4 }}><button className="btn ghost sm" onClick={() => setEdit(p)}>Editar</button><button className="btn ghost sm danger" onClick={() => { if (confirm('Excluir a pendência "' + p.nome + '"?')) upd((d: DB) => { d.pendencias = d.pendencias.filter((x) => x.id !== p.id); }); }}>×</button></div></td>
          </tr>);
        })}
        {!rows.length && <tr><td colSpan={8}><div className="empty">Nenhuma pendência. Importe sua lista em frame/pendencias ou clique em "Nova pendência".</div></td></tr>}
        </tbody></table></div></div>

      {edit && <PendEditor pd={edit} regrasOpt={regrasOpt} onClose={() => setEdit(null)} onSave={(data: any) => { upd((d: DB) => { if (edit.id) Object.assign(d.pendencias.find((x) => x.id === edit.id)!, data); else d.pendencias.push({ id: uid("pend"), ...data }); }); setEdit(null); }} />}
    </div>
  );
}

function PendEditor({ pd, regrasOpt, onClose, onSave }: any) {
  const { db } = useStore();
  const [f, setF] = useState<any>({ nome: "", descricao: "", operadorasAplicaveis: [], setor: "", responsavel: "", alertaEmail: false, regras: [], status: "Ativa", obs: "", ...pd });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const semRegra = !(f.regras || []).length;
  return (
    <Modal title={pd.id ? "Editar pendência" : "Nova pendência"} onClose={onClose} onSave={() => { if (f.nome) onSave(f); }} width={640}>
      <Field label="Pendência (nome)"><input type="text" value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Field>
      <Field label="Descrição"><textarea rows={2} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} /></Field>
      <Field label="Status"><select value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Setor responsável (opcional)"><select value={f.setor} onChange={(e) => set("setor", e.target.value)}><option value="">—</option>{db.setores.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
        <Field label="Pessoa encarregada (opcional)"><select value={f.responsavel} onChange={(e) => set("responsavel", e.target.value)}><option value="">—</option>{db.funcionarios.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
      </div>
      <Field label="Alerta por e-mail (opcional)"><label className="row" style={{ gap: 8, fontSize: 13 }}><input type="checkbox" checked={f.alertaEmail} onChange={(e) => set("alertaEmail", e.target.checked)} style={{ width: "auto" }} />Sim, enviar alerta por e-mail</label></Field>
      <Field label="Operadoras em que se aplica (flag por operadora)"><MultiSelect options={db.operadoras} value={f.operadorasAplicaveis} onChange={(v) => set("operadorasAplicaveis", v)} /></Field>
      <Field label="Regras de auditoria vinculadas (ao menos uma)"><MultiSelect options={regrasOpt} value={f.regras} onChange={(v) => set("regras", v)} /></Field>
      {semRegra && <div className="badge b-red" style={{ marginTop: 4 }}>Toda pendência deve nascer de ao menos uma regra de auditoria.</div>}
      <Field label="Observações"><textarea rows={2} value={f.obs} onChange={(e) => set("obs", e.target.value)} /></Field>
    </Modal>
  );
}
