import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { uid, nameById, namesByIds } from "../lib/derive";
import { Badge, Modal, Field, MultiSelect, Ic, icons } from "../ui";
import type { DB, Processo } from "../types";

export function FlowBuilder() {
  const { db, upd } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ operadora: "", tipoAtendimento: "", tipoConta: "", itemConta: "" });
  const [drag, setDrag] = useState<any>(null);
  const [editNode, setEditNode] = useState<any>(null);
  const [editAction, setEditAction] = useState<any>(null);
  const [edgeEdit, setEdgeEdit] = useState<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const saveEdge = () => { if (!edgeEdit) return; upd((d: DB) => { const e = d.conexoes.find((x) => x.id === edgeEdit.id); if (e) e.label = (edgeEdit.value || "").trim(); }); setEdgeEdit(null); };

  const actionsByProc = (pid: string) => db.acoes.filter((a) => a.processo === pid);
  const f = filters;
  const activeFilter = Object.values(f).some(Boolean);
  const nodeMatches = (p: Processo) => {
    const acts = actionsByProc(p.id);
    const anyMatch = acts.length ? acts.some((a) => (!f.operadora || a.operadoras.includes(f.operadora)) && (!f.tipoAtendimento || a.tiposAtendimento.includes(f.tipoAtendimento)) && (!f.tipoConta || a.tipoConta === f.tipoConta) && (!f.itemConta || a.itemConta === f.itemConta)) : true;
    const procMatch = (!f.operadora || p.operadoras.includes(f.operadora)) && (!f.tipoAtendimento || p.tiposAtendimento.includes(f.tipoAtendimento));
    return anyMatch && procMatch;
  };
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const onMouseDown = (e: any, node: Processo) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    setDrag({ id: node.id, offX: e.clientX - rect.left - node.x + canvasRef.current!.scrollLeft, offY: e.clientY - rect.top - node.y + canvasRef.current!.scrollTop });
    setSelected(node.id);
  };
  useEffect(() => {
    if (!drag) return;
    const move = (e: any) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - drag.offX + canvasRef.current!.scrollLeft);
      const y = Math.max(0, e.clientY - rect.top - drag.offY + canvasRef.current!.scrollTop);
      setDragPos({ id: drag.id, x, y });
    };
    const up = () => {
      setDragPos((pos) => {
        if (pos) upd((d: DB) => { const n = d.processos.find((p) => p.id === pos.id); if (n) { n.x = pos.x; n.y = pos.y; } });
        return null;
      });
      setDrag(null);
    };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [drag]);
  const posOf = (p: Processo) => (dragPos && dragPos.id === p.id ? dragPos : p);
  const nodeCenter = (p: Processo) => { const q = posOf(p); return { x: q.x + 95, y: q.y + 34 }; };
  const drawerNode = db.processos.find((p) => p.id === drawerId);

  const addNode = (tipo: "processo" | "decisao") => {
    const sl = canvasRef.current ? canvasRef.current.scrollLeft : 0, st = canvasRef.current ? canvasRef.current.scrollTop : 0;
    const n: Processo = { id: uid("p"), nome: tipo === "decisao" ? "Nova decisão" : "Novo processo", descricao: "", tipo, x: 120 + sl, y: 120 + st, tiposAtendimento: [], operadoras: [], sistema: "", setor: "", responsavel: "" };
    upd((d: DB) => { d.processos.push(n); }); setSelected(n.id); setEditNode(n);
  };
  const addChild = (parent: Processo) => {
    const childCount = db.conexoes.filter((c) => c.from === parent.id).length;
    const isDec = parent.tipo === "decisao";
    const n: Processo = { id: uid("p"), nome: isDec ? "Novo caminho" : "Novo processo", descricao: "", tipo: "processo", x: parent.x + 250, y: parent.y + childCount * 140, tiposAtendimento: [...parent.tiposAtendimento], operadoras: [...parent.operadoras], sistema: "", setor: "", responsavel: "" };
    const edgeId = uid("e");
    upd((d: DB) => { d.processos.push(n); d.conexoes.push({ id: edgeId, from: parent.id, to: n.id, label: "" }); });
    setSelected(n.id);
    if (isDec) setEdgeEdit({ id: edgeId, value: "" }); else setEditNode(n);
  };
  const maxX = Math.max(1200, ...db.processos.map((p) => p.x)) + 600;
  const maxY = Math.max(800, ...db.processos.map((p) => p.y)) + 400;

  return (
    <>
      <div className="flow-toolbar">
        <button className="btn primary sm" onClick={() => addNode("processo")}><Ic d={icons.plus} size={13} />Processo</button>
        <button className="btn sm" onClick={() => addNode("decisao")}><Ic d={icons.plus} size={13} />Decisão</button>
        <div style={{ width: 1, height: 22, background: "var(--border)" }} />
        <span className="dim" style={{ fontSize: 11 }}>Filtrar:</span>
        <select className="select-sm" value={f.operadora} onChange={(e) => setFilters({ ...f, operadora: e.target.value })}><option value="">Operadora</option>{db.operadoras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        <select className="select-sm" value={f.tipoAtendimento} onChange={(e) => setFilters({ ...f, tipoAtendimento: e.target.value })}><option value="">Atendimento</option>{db.tiposAtendimento.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        <select className="select-sm" value={f.tipoConta} onChange={(e) => setFilters({ ...f, tipoConta: e.target.value })}><option value="">Tipo de conta</option>{db.tiposConta.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        <select className="select-sm" value={f.itemConta} onChange={(e) => setFilters({ ...f, itemConta: e.target.value })}><option value="">Item da conta</option>{db.itensConta.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        {activeFilter && <button className="btn ghost sm" onClick={() => setFilters({ operadora: "", tipoAtendimento: "", tipoConta: "", itemConta: "" })}>Limpar</button>}
        <span className="dim" style={{ marginLeft: "auto", fontSize: 11 }}>Arraste para mover • <b>+</b> cria caixa conectada • <b>duplo clique</b> abre ações</span>
      </div>
      <div className="flow-canvas" ref={canvasRef} onMouseDown={(e: any) => { if (e.target === e.currentTarget || e.target.classList.contains("flow-inner")) setSelected(null); }}>
        <div className="flow-inner" style={{ width: maxX, height: maxY }}>
          <svg className="edges" width={maxX} height={maxY}>
            <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#b6bcc6" /></marker></defs>
            {db.conexoes.map((c) => { const a = db.processos.find((p) => p.id === c.from), b = db.processos.find((p) => p.id === c.to); if (!a || !b) return null;
              const s = nodeCenter(a), t = nodeCenter(b); const dx = Math.max(40, Math.abs(t.x - s.x) * 0.5);
              return <path key={c.id} className="edge-path" d={`M ${s.x} ${s.y} C ${s.x + dx} ${s.y}, ${t.x - dx} ${t.y}, ${t.x} ${t.y}`} />; })}
          </svg>
          {db.conexoes.map((c) => { const a = db.processos.find((p) => p.id === c.from), b = db.processos.find((p) => p.id === c.to); if (!a || !b) return null;
            const s = nodeCenter(a), t = nodeCenter(b); const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
            if (edgeEdit && edgeEdit.id === c.id) return <input key={c.id} className="edge-label-input" autoFocus value={edgeEdit.value} placeholder="condição…" style={{ left: mx, top: my }} onChange={(e) => setEdgeEdit({ ...edgeEdit, value: e.target.value })} onBlur={saveEdge} onKeyDown={(e) => { if (e.key === "Enter") saveEdge(); if (e.key === "Escape") setEdgeEdit(null); }} onMouseDown={(e) => e.stopPropagation()} />;
            return <div key={c.id} className={"edge-label" + (c.label ? "" : " empty")} style={{ left: mx, top: my }} title="Escrever condição na linha" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setEdgeEdit({ id: c.id, value: c.label || "" }); }}>{c.label || "＋"}</div>; })}
          {db.processos.map((p) => { const acts = actionsByProc(p.id); const dim = activeFilter && !nodeMatches(p); const pos = posOf(p);
            return (<div key={p.id} className={"node " + (p.tipo === "decisao" ? "decision " : "") + (selected === p.id ? "selected" : "")} style={{ left: pos.x, top: pos.y, opacity: dim ? 0.28 : 1 }} onMouseDown={(e) => e.stopPropagation()}>
              <span className="node-badge">{acts.length}</span>
              <button className="node-plus" title="Adicionar caixa conectada" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); addChild(p); }}>+</button>
              <div className="node-head" onMouseDown={(e) => onMouseDown(e, p)} onDoubleClick={() => setDrawerId(p.id)}>
                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: p.tipo === "decisao" ? "#f6d9a8" : "var(--brand-soft)", color: p.tipo === "decisao" ? "#b45309" : "var(--brand)" }}>{p.tipo === "decisao" ? "◆" : "▭"}</div>
                <div className="node-title">{p.nome}</div>
              </div>
              <div className="node-meta">{p.setor && <span className="chip">{nameById(db.setores, p.setor)}</span>}{p.sistema && <span className="chip">{nameById(db.sistemas, p.sistema)}</span>}</div>
            </div>); })}
          {!db.processos.length && <div style={{ position: "absolute", top: 140, left: 140 }} className="dim">Clique em <b>Processo</b> para começar a desenhar o fluxo AS IS.</div>}
        </div>
      </div>

      {drawerNode && (<div className="drawer-overlay" onClick={() => setDrawerId(null)}>
        <div className="drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-head">
            <div className="between"><Badge cls={drawerNode.tipo === "decisao" ? "b-amber" : "b-blue"}>{drawerNode.tipo === "decisao" ? "Decisão" : "Processo"}</Badge><button className="close-x" onClick={() => setDrawerId(null)}>×</button></div>
            <div className="h2" style={{ marginTop: 8 }}>{drawerNode.nome}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>{drawerNode.descricao || "Sem descrição."}</div>
            <div className="chips" style={{ marginTop: 10 }}>
              <span className="chip">Setor: {nameById(db.setores, drawerNode.setor)}</span>
              <span className="chip">Sistema: {nameById(db.sistemas, drawerNode.sistema)}</span>
              <span className="chip">Resp.: {nameById(db.funcionarios, drawerNode.responsavel)}</span></div>
            <div className="chips" style={{ marginTop: 6 }}>{namesByIds(db.tiposAtendimento, drawerNode.tiposAtendimento).map((n, i) => <span key={i} className="chip b-blue">{n}</span>)}</div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <button className="btn sm" onClick={() => setEditNode(drawerNode)}>Editar processo</button>
              <button className="btn sm danger" onClick={() => { if (confirm("Excluir este processo e suas ações?")) { upd((d: DB) => { d.processos = d.processos.filter((p) => p.id !== drawerNode.id); d.conexoes = d.conexoes.filter((c) => c.from !== drawerNode.id && c.to !== drawerNode.id); d.acoes = d.acoes.filter((a) => a.processo !== drawerNode.id); }); setDrawerId(null); } }}>Excluir</button></div>
          </div>
          <div className="drawer-body">
            <div className="between" style={{ marginBottom: 10 }}><div className="h2">Ações <span className="chip">{actionsByProc(drawerNode.id).length}</span></div>
              <button className="btn primary sm" onClick={() => setEditAction({ processo: drawerNode.id })}><Ic d={icons.plus} size={13} />Ação</button></div>
            {actionsByProc(drawerNode.id).map((a) => (<div className="act-item" key={a.id}>
              <div className="between"><div style={{ fontWeight: 650 }}>{a.nome}</div>
                <div className="row" style={{ gap: 4 }}><button className="btn ghost sm" onClick={() => setEditAction(a)}>Editar</button><button className="btn ghost sm danger" onClick={() => upd((d: DB) => { d.acoes = d.acoes.filter((x) => x.id !== a.id); delete d.tobe[a.id]; })}>×</button></div></div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>{a.descricao}</div>
              <div className="chips">{a.itemConta && <span className="chip b-purple">{nameById(db.itensConta, a.itemConta)}</span>}{a.tipoConta && <span className="chip">{nameById(db.tiposConta, a.tipoConta)}</span>}<span className="chip">{nameById(db.sistemas, a.sistema)}</span><span className="chip">{nameById(db.funcionarios, a.responsavel)}</span></div>
            </div>))}
            {!actionsByProc(drawerNode.id).length && <div className="empty">Nenhuma ação cadastrada.</div>}
          </div>
        </div>
      </div>)}

      {editNode && <NodeEditor node={editNode} onClose={() => setEditNode(null)} onSave={(data: any) => { upd((d: DB) => { const n = d.processos.find((p) => p.id === editNode.id); if (n) Object.assign(n, data); }); setEditNode(null); }} />}
      {editAction && <ActionEditor action={editAction} onClose={() => setEditAction(null)} onSave={(data: any) => { upd((d: DB) => { if (editAction.id) { const a = d.acoes.find((x) => x.id === editAction.id); if (a) Object.assign(a, data); } else { const na = { id: uid("a"), ...data }; d.acoes.push(na); d.tobe[na.id] = { statusFuturo: "Executada por ação humana", owner: "Hospital", uows: [], obs: "" }; } }); setEditAction(null); }} />}
    </>
  );
}

function NodeEditor({ node, onClose, onSave }: any) {
  const { db } = useStore();
  const [f, setF] = useState<any>({ ...node });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <Modal title="Editar processo" onClose={onClose} onSave={() => onSave(f)}>
      <Field label="Nome"><input type="text" value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Field>
      <Field label="Descrição"><textarea rows={2} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} /></Field>
      <Field label="Tipo"><select value={f.tipo} onChange={(e) => set("tipo", e.target.value)}><option value="processo">Processo</option><option value="decisao">Decisão</option></select></Field>
      <Field label="Tipo de atendimento"><MultiSelect options={db.tiposAtendimento} value={f.tiposAtendimento} onChange={(v) => set("tiposAtendimento", v)} /></Field>
      <Field label="Operadora"><MultiSelect options={db.operadoras} value={f.operadoras} onChange={(v) => set("operadoras", v)} /></Field>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Sistema"><select value={f.sistema} onChange={(e) => set("sistema", e.target.value)}><option value="">—</option>{db.sistemas.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
        <Field label="Setor"><select value={f.setor} onChange={(e) => set("setor", e.target.value)}><option value="">—</option>{db.setores.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
        <Field label="Responsável"><select value={f.responsavel} onChange={(e) => set("responsavel", e.target.value)}><option value="">—</option>{db.funcionarios.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
      </div>
    </Modal>
  );
}

function ActionEditor({ action, onClose, onSave }: any) {
  const { db } = useStore();
  const [f, setF] = useState<any>({ nome: "", descricao: "", sistema: "", responsavel: "", tiposAtendimento: [], operadoras: [], itemConta: "", tipoConta: "", ...action });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <Modal title={action.id ? "Editar ação" : "Nova ação"} onClose={onClose} onSave={() => { if (f.nome) onSave(f); }}>
      <Field label="Nome"><input type="text" value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Field>
      <Field label="Descrição"><textarea rows={2} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} /></Field>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Sistema"><select value={f.sistema} onChange={(e) => set("sistema", e.target.value)}><option value="">—</option>{db.sistemas.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
        <Field label="Responsável"><select value={f.responsavel} onChange={(e) => set("responsavel", e.target.value)}><option value="">—</option>{db.funcionarios.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Item da conta"><select value={f.itemConta} onChange={(e) => set("itemConta", e.target.value)}><option value="">—</option>{db.itensConta.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
        <Field label="Tipo de conta"><select value={f.tipoConta} onChange={(e) => set("tipoConta", e.target.value)}><option value="">—</option>{db.tiposConta.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
      </div>
      <Field label="Tipo de atendimento"><MultiSelect options={db.tiposAtendimento} value={f.tiposAtendimento} onChange={(v) => set("tiposAtendimento", v)} /></Field>
      <Field label="Operadora"><MultiSelect options={db.operadoras} value={f.operadoras} onChange={(v) => set("operadoras", v)} /></Field>
    </Modal>
  );
}
