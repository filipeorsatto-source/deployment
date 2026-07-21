import { useEffect, useState } from "react";
import type { Named } from "./types";

export const Ic = ({ d, size = 16 }: { d: any; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ic">{d}</svg>
);

export const icons: Record<string, any> = {
  dash: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>,
  dashR: <><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></>,
  flow: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M9 6h6a3 3 0 0 1 3 3v6" /></>,
  tobe: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  change: <><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" /></>,
  uow: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
  rules: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" /></>,
  gaps: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  tests: <><path d="M9 2v6l-5 9a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3l-5-9V2" /><path d="M7 2h10M8.5 13h7" /></>,
  explorer: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
  cad: <><path d="M12 2l9 4.9V17L12 22l-9-5V7z" /><path d="M12 22V12M21 7l-9 5-9-5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
};

export const Badge = ({ children, cls = "b-gray" }: any) => <span className={"badge " + cls}>{children}</span>;
export const StatusBadge = ({ s, fn }: any) => <span className={"badge " + fn(s)}><span className="dot" style={{ background: "currentColor", opacity: 0.7 }} />{s}</span>;
export const Chips = ({ items }: { items: string[] }) => <div className="chips">{items.length ? items.map((t, i) => <span className="chip" key={i}>{t}</span>) : <span className="dim">—</span>}</div>;
export const Field = ({ label, children }: any) => <div className="field"><label>{label}</label>{children}</div>;

export function Modal({ title, onClose, children, onSave, saveLabel = "Salvar", width }: any) {
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={width ? { width } : {}}>
        <div className="modal-head"><div className="h2">{title}</div><button className="close-x" onClick={onClose}>×</button></div>
        <div className="modal-body">{children}</div>
        {onSave && <div className="modal-foot"><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={onSave}>{saveLabel}</button></div>}
      </div>
    </div>
  );
}

export function MultiSelect({ options, value = [], onChange }: { options: Named[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="chips" style={{ gap: 6 }}>
      {options.length === 0 && <span className="dim" style={{ fontSize: 11 }}>Nenhuma opção cadastrada</span>}
      {options.map((o) => {
        const on = value.includes(o.id);
        return <button key={o.id} type="button" className={"ce-pill " + (on ? "active" : "")} style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])}>{o.nome}</button>;
      })}
    </div>
  );
}

export function MiniDropdown({ label, items, cls }: { label: string; items: string[]; cls?: string }) {
  const [o, setO] = useState(false);
  useEffect(() => { if (!o) return; const h = () => setO(false); window.addEventListener("click", h); return () => window.removeEventListener("click", h); }, [o]);
  return (
    <div className="mini-dd" onClick={(e) => e.stopPropagation()}>
      <button className={"btn ghost sm " + (cls || "")} onClick={() => setO(!o)}>{label} ▾</button>
      {o && <div className="mini-dd-menu">{items.length ? items.map((it, i) => <div key={i} className="rel-item" style={{ justifyContent: "flex-start" }}>{it}</div>) : <div className="rel-item dim">Nenhum</div>}</div>}
    </div>
  );
}

export function CrudTable({ title, items, columns, onAdd, onEdit, onDelete }: any) {
  const [q, setQ] = useState("");
  const filtered = items.filter((it: any) => JSON.stringify(it).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="between" style={{ marginBottom: 12 }}>
        <div className="row"><div className="h2">{title}</div><span className="chip">{items.length}</span></div>
        <div className="row"><input type="text" placeholder="Filtrar…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 180 }} />
          {onAdd && <button className="btn primary sm" onClick={onAdd}><Ic d={icons.plus} size={14} />Novo</button>}</div>
      </div>
      <div className="tbl-wrap"><div className="tbl-scroll"><table><thead><tr>{columns.map((c: any) => <th key={c.key}>{c.label}</th>)}<th style={{ width: 90 }} /></tr></thead>
        <tbody>{filtered.map((it: any) => (<tr key={it.id}>
          {columns.map((c: any) => <td key={c.key}>{c.render ? c.render(it) : it[c.key]}</td>)}
          <td><div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
            {onEdit && <button className="btn ghost sm" onClick={() => onEdit(it)}>Editar</button>}
            {onDelete && <button className="btn ghost sm danger" onClick={() => onDelete(it)}>×</button>}</div></td></tr>))}
          {!filtered.length && <tr><td colSpan={columns.length + 1}><div className="empty">Nada encontrado.</div></td></tr>}
        </tbody></table></div></div>
    </div>
  );
}
