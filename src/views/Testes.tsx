import { useState } from "react";
import { useStore } from "../store";
import { uid, nameById } from "../lib/derive";
import { Badge, Modal, Field, Ic, icons } from "../ui";
import type { DB } from "../types";

export function Testes() {
  const { db, upd } = useStore();
  const [f, setF] = useState({ tipoTeste: "", ambiente: "" });
  const [edit, setEdit] = useState<any>(null);
  const items = db.testes.filter((t) => (!f.tipoTeste || t.tipoTeste === f.tipoTeste) && (!f.ambiente || t.ambiente === f.ambiente));
  const media = items.length ? (items.reduce((s, t) => s + (+t.nota || 0), 0) / items.length).toFixed(1) : "—";
  return (
    <div>
      <div className="page-head"><div className="h1">Testes</div><p>Registro dos testes de regras e features do produto. A nota (0–10) indica o quanto foi aprovado — 10 = 100% validado.</p></div>
      <div className="filters">
        <select className="select-sm" value={f.tipoTeste} onChange={(e) => setF({ ...f, tipoTeste: e.target.value })}><option value="">Tipo de teste</option><option>Regra</option><option>Feature Produto</option></select>
        <select className="select-sm" value={f.ambiente} onChange={(e) => setF({ ...f, ambiente: e.target.value })}><option value="">Ambiente</option><option>Homologação</option><option>Produção</option></select>
        <span className="chip">Nota média: {media}</span>
        <button className="btn primary sm" style={{ marginLeft: "auto" }} onClick={() => setEdit({})}><Ic d={icons.plus} size={13} />Registrar teste</button>
      </div>
      <div className="tbl-wrap"><div className="tbl-scroll"><table><thead><tr><th>Data</th><th>Tipo de conta</th><th>Tipo de teste</th><th>Ambiente</th><th>Dono</th><th>Descrição</th><th>Nota</th><th /></tr></thead>
        <tbody>{items.map((t) => (<tr key={t.id}>
          <td className="muted">{t.data}</td>
          <td>{nameById(db.tiposConta, t.tipoConta)}</td>
          <td><Badge cls={t.tipoTeste === "Regra" ? "b-amber" : "b-blue"}>{t.tipoTeste}</Badge></td>
          <td><Badge cls={t.ambiente === "Produção" ? "b-green" : "b-gray"}>{t.ambiente}</Badge></td>
          <td className="muted">{t.dono}</td>
          <td className="muted" style={{ maxWidth: 260, fontSize: 12.5 }}>{t.descricao}</td>
          <td><Badge cls={t.nota >= 8 ? "b-green" : t.nota >= 5 ? "b-amber" : "b-red"}>{t.nota}/10</Badge></td>
          <td><div className="row" style={{ gap: 4 }}><button className="btn ghost sm" onClick={() => setEdit(t)}>Editar</button><button className="btn ghost sm danger" onClick={() => upd((d: DB) => { d.testes = d.testes.filter((x) => x.id !== t.id); })}>×</button></div></td>
        </tr>))}
        {!items.length && <tr><td colSpan={8}><div className="empty">Nenhum teste registrado.</div></td></tr>}</tbody>
      </table></div></div>
      {edit && <TesteEditor t={edit} onClose={() => setEdit(null)} onSave={(data: any) => { upd((d: DB) => { if (edit.id) Object.assign(d.testes.find((x) => x.id === edit.id)!, data); else d.testes.push({ id: uid("t"), ...data }); }); setEdit(null); }} />}
    </div>
  );
}

function TesteEditor({ t, onClose, onSave }: any) {
  const { db } = useStore();
  const [f, setF] = useState({ data: new Date().toISOString().slice(0, 10), tipoConta: "", tipoTeste: "Regra", ambiente: "Homologação", dono: "", descricao: "", nota: 10, ...t });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <Modal title={t.id ? "Editar teste" : "Registrar teste"} onClose={onClose} onSave={() => { if (f.descricao || f.dono) onSave(f); }}>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Data do teste"><input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} /></Field>
        <Field label="Tipo de conta"><select value={f.tipoConta} onChange={(e) => set("tipoConta", e.target.value)}><option value="">—</option>{db.tiposConta.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Tipo de teste"><select value={f.tipoTeste} onChange={(e) => set("tipoTeste", e.target.value)}><option>Regra</option><option>Feature Produto</option></select></Field>
        <Field label="Ambiente"><select value={f.ambiente} onChange={(e) => set("ambiente", e.target.value)}><option>Homologação</option><option>Produção</option></select></Field>
      </div>
      <Field label="Dono"><input type="text" placeholder="Nome do responsável pelo teste" value={f.dono} onChange={(e) => set("dono", e.target.value)} /></Field>
      <Field label="Descrição"><textarea rows={3} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} /></Field>
      <Field label={"Nota: " + f.nota + "/10 (10 = 100% aprovado)"}><input type="range" min={0} max={10} value={f.nota} onChange={(e) => set("nota", +e.target.value)} /></Field>
    </Modal>
  );
}
