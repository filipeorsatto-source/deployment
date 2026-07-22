import { useMemo, useState } from "react";
import { AuthProvider, useAuth } from "./auth";
import { StoreProvider, useStore } from "./store";
import { Ic, icons } from "./ui";
import { deriveGaps } from "./lib/derive";
import type { DB } from "./types";
import { DashProcesso, DashRegras } from "./views/Dashboards";
import { FlowBuilder } from "./views/Flow";
import { ToBe } from "./views/ToBe";
import { ChangeMgmt } from "./views/ChangeMgmt";
import { CoverageExplorer } from "./views/Coverage";
import { UoWView } from "./views/UoW";
import { Regras } from "./views/Regras";
import { Gaps } from "./views/Gaps";
import { Testes } from "./views/Testes";
import { Cadastros } from "./views/Cadastros";

const NAV = [
  { group: "Dashboards", items: [{ k: "dashProc", label: "Dashboard Processo", icon: "dash" }, { k: "dashReg", label: "Dashboard Regras", icon: "dashR" }] },
  { group: "Diagnóstico", items: [{ k: "flow", label: "AS IS · Fluxo", icon: "flow" }, { k: "tobe", label: "To Be", icon: "tobe" }, { k: "change", label: "Change Management", icon: "change" }, { k: "explorer", label: "Coverage Explorer", icon: "explorer" }] },
  { group: "Produto & Regras", items: [{ k: "uow", label: "Units of Work", icon: "uow" }, { k: "regras", label: "Regras", icon: "rules" }, { k: "gaps", label: "Gaps", icon: "gaps" }, { k: "testes", label: "Testes", icon: "tests" }] },
  { group: "Base", items: [{ k: "cadastros", label: "Cadastros", icon: "cad" }] },
];
const TITLES: Record<string, [string, string]> = {
  dashProc: ["Dashboard", "Processo"], dashReg: ["Dashboard", "Regras"], flow: ["AS IS", "Mapeamento do processo atual"],
  tobe: ["To Be", "Estado futuro por ação"], change: ["Change Management", "Plano de transição"], explorer: ["Coverage Explorer", "Inteligência operacional"],
  uow: ["Units of Work", "Base RCM 2.0"], regras: ["Regras", "Auditoria e problemas"], gaps: ["Gaps", "Lacunas de cobertura"],
  testes: ["Testes", "Validação de regras e features"], cadastros: ["Cadastros", "Entidades base"],
};

function globalSearch(db: DB, q: string) {
  if (!q || q.length < 2) return [] as any[];
  const t = q.toLowerCase(); const out: any[] = []; const push = (kind: string, name: string, go: string) => out.push({ kind, name, go });
  db.processos.forEach((p) => { if (p.nome.toLowerCase().includes(t)) push("Processo", p.nome, "flow"); });
  db.acoes.forEach((a) => { if (a.nome.toLowerCase().includes(t)) push("Ação", a.nome, "tobe"); });
  db.unitsOfWork.forEach((u) => { if (u.nome.toLowerCase().includes(t)) push("Unit of Work", u.nome, "uow"); });
  db.regras.forEach((r) => { if (r.nome.toLowerCase().includes(t)) push("Regra", r.nome, "regras"); });
  db.problemas.forEach((p) => { if (p.nome.toLowerCase().includes(t)) push("Problema", p.nome, "regras"); });
  db.itensConta.forEach((i) => { if (i.nome.toLowerCase().includes(t)) push("Item da conta", i.nome, "explorer"); });
  db.operadoras.forEach((o) => { if (o.nome.toLowerCase().includes(t)) push("Operadora", o.nome, "cadastros"); });
  return out.slice(0, 12);
}

function Shell() {
  const { db } = useStore();
  const { user, logout } = useAuth();
  const [view, setView] = useState("uow");
  const [q, setQ] = useState(""); const [showSr, setShowSr] = useState(false);
  const results = useMemo(() => globalSearch(db, q), [db, q]);
  const go = (v: string) => { setView(v); setQ(""); setShowSr(false); };
  const counts: Record<string, number> = { flow: db.processos.length, tobe: db.acoes.length, uow: db.unitsOfWork.length, regras: db.regras.length, gaps: deriveGaps(db).length, testes: db.testes.length };
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo"><div className="logo-mark">R</div><div><div className="logo-txt">Rivio</div><div className="logo-sub">Implantação · Hospital</div></div></div>
        {NAV.map((g) => (<div key={g.group}><div className="nav-group-label">{g.group}</div>
          {g.items.map((it) => (<button key={it.k} className={"nav-item " + (view === it.k ? "active" : "")} onClick={() => go(it.k)}><Ic d={icons[it.icon]} />{it.label}{counts[it.k] != null && <span className="nav-badge">{counts[it.k]}</span>}</button>))}
        </div>))}
        <div style={{ marginTop: "auto", padding: "10px 8px", fontSize: 11 }} className="dim">{user?.email}<br /><span className="link" onClick={logout}>Sair</span></div>
      </aside>
      <div className="main">
        <div className="topbar">
          <div><span className="crumb">{TITLES[view][0]}</span> <span className="crumb-sub">· {TITLES[view][1]}</span></div>
          <div className="search">
            <Ic d={icons.search} size={15} />
            <input type="text" placeholder="Busca global…" value={q} onChange={(e) => { setQ(e.target.value); setShowSr(true); }} onFocus={() => setShowSr(true)} onBlur={() => setTimeout(() => setShowSr(false), 180)} />
            {showSr && q.length >= 2 && (<div className="search-results">{results.length ? results.map((r, i) => (<div key={i} className="sr-item clickable" onMouseDown={() => go(r.go)}><span className="sr-kind">{r.kind}</span><span>{r.name}</span></div>)) : <div className="empty" style={{ padding: 18 }}>Nada encontrado</div>}</div>)}
          </div>
        </div>
        <div className={"content" + (view === "flow" ? " no-pad" : "")}>
          {view === "dashProc" && <DashProcesso go={go} />}
          {view === "dashReg" && <DashRegras />}
          {view === "flow" && <FlowBuilder />}
          {view === "tobe" && <ToBe />}
          {view === "change" && <ChangeMgmt />}
          {view === "explorer" && <CoverageExplorer />}
          {view === "uow" && <UoWView />}
          {view === "regras" && <Regras />}
          {view === "gaps" && <Gaps />}
          {view === "testes" && <Testes />}
          {view === "cadastros" && <Cadastros />}
        </div>
      </div>
    </div>
  );
}

function Login() {
  const { login, error } = useAuth();
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="logo-mark">R</div>
        <div className="h1" style={{ fontSize: 20 }}>Rivio · Implantação</div>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>Plataforma de diagnóstico de implantação. Acesso restrito a contas <b>@rivio.com.br</b>.</p>
        <button className="g-btn" onClick={login}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
          Entrar com Google
        </button>
        {error && <div className="badge b-red" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="login-wrap"><div className="dim">Verificando acesso…</div></div>;
  if (!user) return <Login />;
  return <StoreProvider><Shell /></StoreProvider>;
}

export default function App() {
  return <AuthProvider><Gate /></AuthProvider>;
}
