import { useState } from "react";
import { useStore } from "../store";
import { uid, nameById } from "../lib/derive";
import { CrudTable, Modal, Field } from "../ui";
import type { DB, DBKey } from "../types";

const defs = [
  { key: "operadoras", label: "Operadoras", fields: [{ k: "nome", l: "Nome" }] },
  { key: "tiposAtendimento", label: "Tipos de atendimento", fields: [{ k: "nome", l: "Nome" }] },
  { key: "tiposConta", label: "Tipos de conta", fields: [{ k: "nome", l: "Nome" }] },
  { key: "itensConta", label: "Itens da conta", fields: [{ k: "nome", l: "Nome" }, { k: "grupo", l: "Grupo" }] },
  { key: "setores", label: "Setores", fields: [{ k: "nome", l: "Nome" }] },
  { key: "funcionarios", label: "Funcionários", fields: [{ k: "nome", l: "Nome" }, { k: "cargo", l: "Cargo" }, { k: "setor", l: "Setor", ref: "setores" }] },
  { key: "sistemas", label: "Sistemas", fields: [{ k: "nome", l: "Nome" }] },
  { key: "plataformas", label: "Plataformas", fields: [{ k: "nome", l: "Nome" }] },
  { key: "produtosRivio", label: "Produtos Rivio", fields: [{ k: "nome", l: "Nome" }] },
] as const;

export function Cadastros() {
  const { db, upd } = useStore();
  const [tab, setTab] = useState<string>("operadoras");
  const [edit, setEdit] = useState<any>(null);
  const def = defs.find((d) => d.key === tab)!;
  const columns = def.fields.map((fl: any) => ({ key: fl.k, label: fl.l, render: fl.ref ? (it: any) => nameById((db as any)[fl.ref], it[fl.k]) : undefined }));
  return (
    <div>
      <div className="page-head"><div className="h1">Cadastros</div><p>Entidades base do sistema. CRUD simples reutilizável.</p></div>
      <div className="chips" style={{ marginBottom: 16 }}>{defs.map((d) => <button key={d.key} className={"ce-pill " + (tab === d.key ? "active" : "")} onClick={() => setTab(d.key)}>{d.label} <span style={{ opacity: 0.6 }}>{(db as any)[d.key].length}</span></button>)}</div>
      <CrudTable title={def.label} items={(db as any)[tab]} columns={columns} onAdd={() => setEdit({})} onEdit={(it: any) => setEdit(it)} onDelete={(it: any) => upd((d: DB) => { (d as any)[tab] = (d as any)[tab].filter((x: any) => x.id !== it.id); })} />
      {edit && <CadEditor def={def} item={edit} onClose={() => setEdit(null)} onSave={(data: any) => { upd((d: DB) => { const arr = (d as any)[tab as DBKey]; if (edit.id) Object.assign(arr.find((x: any) => x.id === edit.id), data); else arr.push({ id: uid(tab), ...data }); }); setEdit(null); }} />}
    </div>
  );
}

function CadEditor({ def, item, onClose, onSave }: any) {
  const { db } = useStore();
  const [f, setF] = useState<any>({ ...item });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <Modal title={item.id ? "Editar " + def.label : "Novo em " + def.label} onClose={onClose} onSave={() => { if (f.nome) onSave(f); }}>
      {def.fields.map((fl: any) => (<Field key={fl.k} label={fl.l}>{fl.ref ? <select value={f[fl.k] || ""} onChange={(e) => set(fl.k, e.target.value)}><option value="">—</option>{(db as any)[fl.ref].map((o: any) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select> : <input type="text" value={f[fl.k] || ""} onChange={(e) => set(fl.k, e.target.value)} />}</Field>))}
    </Modal>
  );
}
