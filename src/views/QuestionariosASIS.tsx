import { useMemo, useState } from "react";
import { useStore } from "../store";
import { Badge, Modal, Field, Ic, icons } from "../ui";
import type { DB, RespostaEntry } from "../types";

// Enums locais (mantidos aqui para não alterar lib/constants.ts).
const CRITICIDADES = ["Fundamental", "Importante", "Complementar"];
const RESP_STATUS = ["Pendente", "Respondido", "Respondido (parcial)", "Aplicado no fluxo"];
const TIPOS_ACAO = ["Criar processo", "Criar decisão", "Ligar nós", "Adicionar ação", "Preencher atributo", "Marcar candidato TO BE", "Nenhuma"];
const OPERADORAS_FALLBACK = ["Hapvida", "Sul América", "Bradesco", "Porto Seguro", "Amil", "Unimed"];

const critClass = (c: string) => (({ Fundamental: "b-red", Importante: "b-amber", Complementar: "b-gray" } as any)[c] || "b-gray");
const statusClass = (s: string) => (({ Pendente: "b-gray", Respondido: "b-green", "Respondido (parcial)": "b-amber", "Aplicado no fluxo": "b-blue" } as any)[s] || "b-gray");

const EMPTY: RespostaEntry = { resposta: "", evidencia: "", tipoAcao: "", acao: "", fonte: "", noVinculado: "", status: "Pendente", obs: "" };
const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const rkey = (op: string, pid: string) => op + "::" + pid;

export function QuestionariosASIS() {
  const { db, upd } = useStore();
  const operadoras = useMemo(() => Array.from(new Set([...db.operadoras.map((o) => o.nome), ...OPERADORAS_FALLBACK])), [db.operadoras]);
  const [op, setOp] = useState(operadoras[0] || "Hapvida");
  const [fSetor, setFSetor] = useState("");
  const [fCrit, setFCrit] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const [tri, setTri] = useState(false);

  const aplica = (p: any) => !p.operadorasAplicaveis?.length || p.operadorasAplicaveis.includes(op);
  const setores = useMemo(() => Array.from(new Set(db.perguntas.map((p) => p.setor))), [db.perguntas]);

  const rows = db.perguntas.filter(aplica).map((p) => ({ p, r: db.respostas[rkey(op, p.id)] || EMPTY })).filter(({ p, r }) =>
    (!fSetor || p.setor === fSetor) && (!fCrit || p.criticidade === fCrit) &&
    (!fStatus || (r.status || "Pendente") === fStatus) &&
    (!q || norm(p.questionamento + " " + p.id + " " + p.setor).includes(norm(q))));

  const counts = useMemo(() => {
    const c: any = { total: 0 };
    db.perguntas.filter(aplica).forEach((p) => { const st = db.respostas[rkey(op, p.id)]?.status || "Pendente"; c.total++; c[st] = (c[st] || 0) + 1; });
    return c;
  }, [db.perguntas, db.respostas, op]);
  const pct = counts.total ? Math.round((((counts["Respondido"] || 0) + (counts["Aplicado no fluxo"] || 0)) / counts.total) * 100) : 0;

  const saveResp = (pid: string, data: RespostaEntry) => upd((d: DB) => { d.respostas[rkey(op, pid)] = data; });

  return (
    <div>
      <div className="page-head">
        <div className="h1">Questionários AS IS</div>
        <p>Banco de perguntas por setor, respondido operadora a operadora. As respostas alimentam o desenho do fluxo AS IS e a análise de gaps do To Be.</p>
      </div>

      <div className="filters">
        <select className="select-sm" value={op} onChange={(e) => setOp(e.target.value)}>{operadoras.map((o) => <option key={o}>{o}</option>)}</select>
        <input type="text" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 190 }} />
        <select className="select-sm" value={fSetor} onChange={(e) => setFSetor(e.target.value)}><option value="">Setor</option>{setores.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="select-sm" value={fCrit} onChange={(e) => setFCrit(e.target.value)}><option value="">Criticidade</option>{CRITICIDADES.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="select-sm" value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">Status</option>{RESP_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
        <span className="chip">{rows.length}</span>
        <button className="btn primary sm" style={{ marginLeft: "auto" }} onClick={() => setTri(true)}><Ic d={icons.search} size={13} />Analisar transcrição</button>
      </div>

      <div className="row" style={{ gap: 8, margin: "0 0 12px", flexWrap: "wrap" }}>
        <Badge cls="b-gray">{op} · {counts.total} perguntas</Badge>
        <Badge cls="b-green">{counts["Respondido"] || 0} respondidas</Badge>
        <Badge cls="b-amber">{counts["Respondido (parcial)"] || 0} parciais</Badge>
        <Badge cls="b-blue">{counts["Aplicado no fluxo"] || 0} aplicadas</Badge>
        <Badge cls="b-gray">{counts["Pendente"] || 0} pendentes</Badge>
        <span className="dim" style={{ fontSize: 12 }}>· {pct}% concluído</span>
      </div>

      <div className="tbl-wrap"><div className="tbl-scroll" style={{ maxHeight: "calc(100vh - 300px)" }}><table>
        <thead><tr><th>Setor</th><th>Questionamento</th><th>Crit.</th><th>Resposta</th><th>Ação no fluxo</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map(({ p, r }) => (<tr key={p.id}>
          <td className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{p.setor}</td>
          <td style={{ fontWeight: 600, minWidth: 240 }}>{p.questionamento}<div className="dim" style={{ fontSize: 10.5, fontWeight: 400 }}>{p.id}</div></td>
          <td><Badge cls={critClass(p.criticidade)}>{p.criticidade || "—"}</Badge></td>
          <td className="muted" style={{ fontSize: 12, minWidth: 200 }}>{r.resposta || <span className="dim">—</span>}</td>
          <td className="muted" style={{ fontSize: 11.5, minWidth: 160 }}>{r.tipoAcao ? <><Badge cls="b-purple">{r.tipoAcao}</Badge> <span>{r.acao}</span></> : <span className="dim">—</span>}</td>
          <td><Badge cls={statusClass(r.status || "Pendente")}>{r.status || "Pendente"}</Badge></td>
          <td><button className="btn ghost sm" onClick={() => setEdit({ p, r })}>Responder</button></td>
        </tr>))}
        {!rows.length && <tr><td colSpan={7}><div className="empty">Nenhuma pergunta para este filtro. Importe o banco de perguntas no Firebase (nó frame/perguntas).</div></td></tr>}
        </tbody></table></div></div>

      {edit && <RespEditor op={op} p={edit.p} r={edit.r} onClose={() => setEdit(null)} onSave={(data: RespostaEntry) => { saveResp(edit.p.id, data); setEdit(null); }} />}
      {tri && <Triagem db={db} op={op} onClose={() => setTri(false)} onOpen={(p: any) => { setTri(false); setEdit({ p, r: db.respostas[rkey(op, p.id)] || EMPTY }); }} />}
    </div>
  );
}

function RespEditor({ op, p, r, onClose, onSave }: any) {
  const [f, setF] = useState<RespostaEntry>({ ...EMPTY, ...r });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <Modal title={p.questionamento} onClose={onClose} onSave={() => onSave(f)} width={640}>
      <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>{op} · {p.setor} · {p.id} · criticidade {p.criticidade || "—"}</div>
      {p.keywords?.length ? <div className="chips" style={{ marginBottom: 10 }}>{p.keywords.map((k: string, i: number) => <span className="chip" key={i}>{k}</span>)}</div> : null}
      <Field label="Resposta"><textarea rows={3} value={f.resposta} onChange={(e) => set("resposta", e.target.value)} /></Field>
      <Field label="Trecho da transcrição (evidência)"><textarea rows={2} value={f.evidencia} onChange={(e) => set("evidencia", e.target.value)} /></Field>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Tipo de ação no fluxo"><select value={f.tipoAcao} onChange={(e) => set("tipoAcao", e.target.value)}><option value="">—</option>{TIPOS_ACAO.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Status"><select value={f.status} onChange={(e) => set("status", e.target.value)}>{RESP_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <Field label="Ação aplicada no fluxo"><textarea rows={2} value={f.acao} onChange={(e) => set("acao", e.target.value)} /></Field>
      <div className="row" style={{ gap: 10 }}>
        <Field label="Fonte (reunião / ata / data)"><input type="text" value={f.fonte} onChange={(e) => set("fonte", e.target.value)} /></Field>
        <Field label="Nó vinculado (id)"><input type="text" value={f.noVinculado} onChange={(e) => set("noVinculado", e.target.value)} /></Field>
      </div>
      <Field label="Observações / confiança"><textarea rows={2} value={f.obs} onChange={(e) => set("obs", e.target.value)} /></Field>
    </Modal>
  );
}

// Pré-triagem por palavra-chave: sem IA, roda 100% local. Sinaliza quais perguntas
// pendentes provavelmente foram respondidas (>=1 keyword na transcrição) e quais
// lacunas fundamentais continuaram sem menção.
function Triagem({ db, op, onClose, onOpen }: any) {
  const [txt, setTxt] = useState("");
  const [done, setDone] = useState(false);
  const analise = useMemo(() => {
    if (!done) return null;
    const n = norm(txt);
    const aplica = (p: any) => !p.operadorasAplicaveis?.length || p.operadorasAplicaveis.includes(op);
    const pend = db.perguntas.filter((p: any) => aplica(p) && (db.respostas[op + "::" + p.id]?.status || "Pendente") === "Pendente");
    const achou: any[] = []; const lacunas: any[] = [];
    pend.forEach((p: any) => {
      const kws = (p.keywords || []).map((k: string) => norm(k)).filter(Boolean);
      const hits = kws.filter((k: string) => n.includes(k));
      if (hits.length) achou.push({ p, hits });
      else if (p.criticidade === "Fundamental") lacunas.push(p);
    });
    achou.sort((a, b) => b.hits.length - a.hits.length);
    return { achou, lacunas, totalPend: pend.length };
  }, [done, txt, db, op]);

  return (
    <Modal title={"Analisar transcrição · " + op} onClose={onClose} width={720}>
      <p className="dim" style={{ fontSize: 12, marginTop: 0 }}>Pré-triagem por palavra-chave (sem IA, roda local). Cole a transcrição do Fathom ou Granola e sinalizo quais perguntas <b>pendentes</b> provavelmente foram respondidas e quais lacunas <b>fundamentais</b> continuaram sem menção.</p>
      <textarea rows={7} placeholder="Cole aqui a transcrição…" value={txt} onChange={(e) => { setTxt(e.target.value); setDone(false); }} />
      <div className="row" style={{ marginTop: 10 }}><button className="btn primary sm" onClick={() => setDone(true)} disabled={!txt.trim()}>Analisar</button></div>
      {analise && (<div style={{ marginTop: 14 }}>
        <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <Badge cls="b-green">{analise.achou.length} prováveis respostas</Badge>
          <Badge cls="b-red">{analise.lacunas.length} lacunas fundamentais</Badge>
          <span className="dim" style={{ fontSize: 12 }}>de {analise.totalPend} pendentes</span>
        </div>
        {analise.achou.length > 0 && <div className="h2" style={{ fontSize: 13, margin: "8px 0" }}>Provavelmente respondidas</div>}
        {analise.achou.map(({ p, hits }: any) => (
          <div key={p.id} className="rel-item" style={{ justifyContent: "space-between" }}>
            <div><b>{p.questionamento}</b><div className="dim" style={{ fontSize: 11 }}>{p.setor} · termos: {hits.join(", ")}</div></div>
            <button className="btn ghost sm" onClick={() => onOpen(p)}>Responder</button>
          </div>))}
        {analise.lacunas.length > 0 && <div className="h2" style={{ fontSize: 13, margin: "12px 0 8px" }}>Lacunas fundamentais (sem menção)</div>}
        {analise.lacunas.map((p: any) => (
          <div key={p.id} className="rel-item" style={{ justifyContent: "space-between" }}>
            <div><b>{p.questionamento}</b><div className="dim" style={{ fontSize: 11 }}>{p.setor}</div></div>
            <Badge cls="b-red">Fundamental</Badge>
          </div>))}
        {!analise.achou.length && !analise.lacunas.length && <div className="empty">Nenhuma correspondência. Verifique se o banco de perguntas foi importado e se há palavras-chave cadastradas.</div>}
      </div>)}
    </Modal>
  );
}
