import { useState } from "react";
import { useStore } from "../store";
import { uid } from "../lib/derive";
import { ETAPAS_UOW, MODOS_UOW, COBERTURAS, PLATAFORMAS_UOW, coberturaClass, modoClass } from "../lib/constants";
import { Badge, Modal, Field, Ic, icons } from "../ui";
import type { DB } from "../types";

export function UoWView() {
  const { db, upd } = useStore();
  const [f, setF] = useState({ etapa: "", modo: "", cobertura: "", plataforma: "" });
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const items = db.unitsOfWork.filter((u) => (!f.etapa || u.etapa === f.etapa) && (!f.modo || u.modo === f.modo) && (!f.cobertura || u.cobertura === f.cobertura) && (!f.plataforma || u.plataforma === f.plataforma) && (!q || (u.nome + u.id + (u.descricao || "")).toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <div className="page-head"><div className="h1">Units of Work</div><p>Base oficial <b>RCM 2.0</b> — {db.unitsOfWork.length} unidades de trabalho nas 7 etapas do ciclo de RCM.</p></div>
      <div className="filters">
        <input type="text" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 200 }} />
        <select className="select-sm" value={f.etapa} onChange={(e) => setF({ ...f, etapa: e.target.value })}><option value="">Etapa</option>{ETAPAS_UOW.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="select-sm" value={f.modo} onChange={(e) => setF({ ...f, modo: e.target.value })}><option value="">Modo</option>{MODOS_UOW.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="select-sm" value={f.cobertura} onChange={(e) => setF({ ...f, cobertura: e.target.value })}><option value="">Cobertura</option>{COBERTURAS.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="select-sm" value={f.plataforma} onChange={(e) => setF({ ...f, plataforma: e.target.value })}><option value="">Plataforma</option>{PLATAFORMAS_UOW.map((x) => <option key={x}>{x}</option>)}</select>
        <span className="chip">{items.length}</span>
        <button className="btn primary sm" style={{ marginLeft: "auto" }} onClick={() => setEdit({})}><Ic d={icons.plus} size={13} />Nova UoW</button>
      </div>
      <div className="tbl-wrap"><div className="tbl-scroll" style={{ maxHeight: "calc(100vh - 235px)" }}><table><thead><tr><th>ID</th><th>Ação / Unidade de Trabalho</th><th>Etapa</th><th>Modo</th><th>Cobertura</th><th>Autom.</th><th>Plataforma</th><th>Executa</th><th>Resp.</th><th /></tr></thead>
        <tbody>{items.map((u) => (<tr key={u.id}>
          <td className="dim" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{u.id}</td>
          <td style={{ fontWeight: 600, minWidth: 240 }}>{u.nome}{u.descricao && <div className="muted" style={{ fontSize: 11.5, fontWeight: 400 }}>{u.descricao}</div>}</td>
          <td className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{(u.etapa || "").replace(/^\d+\.\s*/, "")}</td>
          <td><Badge cls={modoClass(u.modo)}>{u.modo}</Badge></td>
          <td><Badge cls={coberturaClass(u.cobertura)}>{u.cobertura}</Badge></td>
          <td>{Math.round((u.automacao || 0) * 100)}%</td>
          <td className="muted">{u.plataforma}</td>
          <td className="muted">{u.quemExecuta}</td>
          <td className="muted">{u.responsavel}</td>
          <td><button className="btn ghost sm" onClick={() => setEdit(u)}>Editar</button></td>
        </tr>))}</tbody></table></div></div>
      {edit && <UoWEditor u={edit} onClose={() => setEdit(null)} onSave={(data: any) => { upd((d: DB) => { if (edit.id) Object.assign(d.unitsOfWork.find((x) => x.id === edit.id)!, data); else d.unitsOfWork.push({ ...data, id: data.id || uid("RCM") }); }); setEdit(null); }} />}
    </div>
  );
}

function UoWEditor({ u, onClose, onSave }: any) {
  const [f, setF] = useState({ id: "", nome: "", descricao: "", etapa: ETAPAS_UOW[0], modo: "Automático (produto)", cobertura: "Coberta", automacao: 1, plataforma: "Marvin", quemExecuta: "Rivio", responsavel: "Rivio", ...u });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <Modal title={u.id ? "Editar Unit of Work" : "Nova Unit of Work"} onClose={onClose} onSave={() => { if (f.nome) onSave(f); }}>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Identificador"><input type="text" value={f.id} placeholder="RCM-XX-XXX" onChange={(e) => set("id", e.target.value)} /></Field>
        <Field label="Etapa"><select value={f.etapa} onChange={(e) => set("etapa", e.target.value)}>{ETAPAS_UOW.map((x) => <option key={x}>{x}</option>)}</select></Field>
      </div>
      <Field label="Ação / Unidade de Trabalho"><input type="text" value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Field>
      <Field label="Descrição"><textarea rows={2} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} /></Field>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Modo de execução"><select value={f.modo} onChange={(e) => set("modo", e.target.value)}>{MODOS_UOW.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Cobertura Rivio"><select value={f.cobertura} onChange={(e) => set("cobertura", e.target.value)}>{COBERTURAS.map((x) => <option key={x}>{x}</option>)}</select></Field>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Plataforma"><select value={f.plataforma} onChange={(e) => set("plataforma", e.target.value)}>{PLATAFORMAS_UOW.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label={"Automação: " + Math.round((f.automacao || 0) * 100) + "%"}><select value={f.automacao} onChange={(e) => set("automacao", +e.target.value)}><option value={1}>100% (Automático)</option><option value={0.5}>50% (Assistido)</option><option value={0}>0% (Manual)</option></select></Field>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Quem executa"><select value={f.quemExecuta} onChange={(e) => set("quemExecuta", e.target.value)}><option>Rivio</option><option>Cliente</option><option>—</option></select></Field>
        <Field label="Responsável atual"><select value={f.responsavel} onChange={(e) => set("responsavel", e.target.value)}><option>Rivio</option><option>Hospital</option><option>Rivio / Hospital</option><option>—</option></select></Field>
      </div>
    </Modal>
  );
}
