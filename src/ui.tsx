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
  qasis: <><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" /><path d="M9 13l2 2 4-4" /></>,
  pend: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
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
            {onDelete && <button className="btn ghost sm danger" onClick={() => { if (confirm("Excluir \"" + (it.nome || it.id) + "\"? Isso pode deixar referências quebradas em outras telas que apontam para este item.")) onDelete(it); }}>×</button>}</div></td></tr>))}
          {!filtered.length && <tr><td colSpan={columns.length + 1}><div className="empty">Nada encontrado.</div></td></tr>}
        </tbody></table></div></div>
    </div>
  );
}

// Navegador de pastas Hospital > Operadora, reutilizado em AS IS, To Be, Change Management,
// Regras e Testes. Pastas são livres (criadas na hora, não precisam de cadastro prévio).
// SEM_HOSPITAL agrupa registros criados ANTES de existir esse conceito de pasta — eles nunca
// ficam escondidos, sempre aparecem aqui como "Dados antigos (sem pasta)". GERAL_OPERADORA
// representa "sem operadora específica" dentro de um hospital.
export const SEM_HOSPITAL = "__sem_pasta__";
export const GERAL_OPERADORA = "__geral__";
export const pastaMatch = (hospital: string, operadora: string, itemH?: string, itemO?: string) =>
  (hospital === SEM_HOSPITAL ? !itemH : itemH === hospital) && (operadora === GERAL_OPERADORA ? !itemO : itemO === operadora);
export const pastaStamp = (hospital: string, operadora: string) => ({
  pastaHospital: hospital === SEM_HOSPITAL ? "" : hospital,
  pastaOperadora: operadora === GERAL_OPERADORA ? "" : operadora,
});

export function PastaBar({ items, hospital, operadora, onChange, operadoraLabel = "Operadora" }: {
  items: { pastaHospital?: string; pastaOperadora?: string }[];
  hospital: string | null; operadora: string | null;
  onChange: (hospital: string | null, operadora: string | null) => void;
  operadoraLabel?: string;
}) {
  const [novo, setNovo] = useState("");
  const hospitais = Array.from(new Set(items.map((i) => i.pastaHospital).filter(Boolean))) as string[];
  const temSemPasta = items.some((i) => !i.pastaHospital);
  const operadoras = Array.from(new Set(items.filter((i) => (i.pastaHospital || "") === (hospital === SEM_HOSPITAL ? "" : hospital)).map((i) => i.pastaOperadora).filter(Boolean))) as string[];

  const addNovo = () => {
    const v = novo.trim(); if (!v) return;
    if (hospital === null) onChange(v, null); else onChange(hospital, v);
    setNovo("");
  };

  if (hospital === null) {
    return (
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="h2" style={{ marginBottom: 10 }}>Escolha o hospital</div>
        <div className="chips" style={{ marginBottom: 10 }}>
          {hospitais.map((h) => <button key={h} className="ce-pill" onClick={() => onChange(h, null)}>{h}</button>)}
          {temSemPasta && <button className="ce-pill" onClick={() => onChange(SEM_HOSPITAL, null)}>📦 Dados antigos (sem pasta)</button>}
          {!hospitais.length && !temSemPasta && <span className="dim" style={{ fontSize: 12 }}>Nenhum hospital ainda — crie o primeiro abaixo.</span>}
        </div>
        <div className="row" style={{ gap: 6 }}>
          <input type="text" placeholder="Novo hospital…" value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNovo()} style={{ width: 220 }} />
          <button className="btn sm" onClick={addNovo}>+ Criar</button>
        </div>
      </div>
    );
  }
  if (operadora === null) {
    return (
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div className="h2">{hospital === SEM_HOSPITAL ? "📦 Dados antigos (sem pasta)" : hospital} <span className="dim" style={{ fontWeight: 400, fontSize: 13 }}>· escolha a {operadoraLabel.toLowerCase()}</span></div>
          <button className="btn ghost sm" onClick={() => onChange(null, null)}>← Trocar hospital</button>
        </div>
        <div className="chips" style={{ marginBottom: 10 }}>
          {operadoras.map((o) => <button key={o} className="ce-pill" onClick={() => onChange(hospital, o)}>{o}</button>)}
          <button className="ce-pill" onClick={() => onChange(hospital, GERAL_OPERADORA)}>Geral (sem {operadoraLabel.toLowerCase()})</button>
        </div>
        {hospital !== SEM_HOSPITAL && <div className="row" style={{ gap: 6 }}>
          <input type="text" placeholder={"Nova " + operadoraLabel.toLowerCase() + "…"} value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNovo()} style={{ width: 220 }} />
          <button className="btn sm" onClick={addNovo}>+ Criar</button>
        </div>}
      </div>
    );
  }
  return (
    <div className="row" style={{ marginBottom: 14, gap: 8, alignItems: "center" }}>
      <Badge cls="b-blue">{hospital === SEM_HOSPITAL ? "📦 Dados antigos" : hospital}</Badge>
      {operadora !== GERAL_OPERADORA && <Badge cls="b-purple">{operadora}</Badge>}
      <button className="btn ghost sm" onClick={() => onChange(hospital, null)}>Trocar {operadoraLabel.toLowerCase()}</button>
      <button className="btn ghost sm" onClick={() => onChange(null, null)}>Trocar hospital</button>
    </div>
  );
}
