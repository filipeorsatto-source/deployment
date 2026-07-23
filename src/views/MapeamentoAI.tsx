import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useStore } from "../store";
import { uid, nameById } from "../lib/derive";
import { Badge, Ic, icons } from "../ui";
import type { DB, Processo, Acao, Conexao, GapManual } from "../types";

// Aceita os mesmos rótulos de coluna usados no questionarios-as-is.xlsx, tolerando
// acentos/maiúsculas diferentes e pequenas variações de nome.
const norm = (s: string) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const HEADER_ALIASES: Record<string, string> = {
  operadora: "operadora",
  perguntaid: "perguntaId", "pergunta id": "perguntaId", id: "perguntaId",
  setor: "setor",
  questionamento: "questionamento", pergunta: "questionamento",
  criticidade: "criticidade",
  resposta: "resposta",
  "trecho da transcricao (evidencia)": "evidencia", evidencia: "evidencia",
  "tipo de acao aplicada": "tipoAcao", "tipo de acao": "tipoAcao", tipoacao: "tipoAcao",
  "acao aplicada no fluxo": "acao", acao: "acao",
  fonte: "fonte",
  "no vinculado": "noVinculado", "no vinculado (id)": "noVinculado", novinculado: "noVinculado",
  status: "status",
  obs: "obs", observacoes: "obs", "obs / confianca": "obs",
};

const TIPOS_GERADORES = ["Criar processo", "Criar decisão", "Adicionar ação", "Marcar candidato TO BE"];

interface ParsedRow {
  operadora: string; perguntaId: string; setor: string; questionamento: string;
  criticidade: string; resposta: string; evidencia: string; tipoAcao: string;
  acao: string; fonte: string; noVinculado: string; status: string; obs: string;
  _accept: boolean;
}

function parseWorkbook(buf: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames.find((n) => /resposta/i.test(n)) || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return json.map((raw) => {
    const row: any = {};
    Object.keys(raw).forEach((k) => { const canon = HEADER_ALIASES[norm(k)]; if (canon) row[canon] = String(raw[k] ?? "").trim(); });
    const hasContent = !!(row.resposta || row.acao);
    return {
      operadora: row.operadora || "", perguntaId: row.perguntaId || "", setor: row.setor || "Sem setor",
      questionamento: row.questionamento || "", criticidade: row.criticidade || "", resposta: row.resposta || "",
      evidencia: row.evidencia || "", tipoAcao: row.tipoAcao || "", acao: row.acao || "",
      fonte: row.fonte || "", noVinculado: row.noVinculado || "", status: row.status || "", obs: row.obs || "",
      _accept: TIPOS_GERADORES.includes(row.tipoAcao) && hasContent,
    };
  });
}

export function MapeamentoAI({ go }: { go?: (v: string) => void }) {
  const { db, upd } = useStore();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ processos: number; acoes: number; conexoes: number; candidatos: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    setError(""); setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseWorkbook(buf);
      if (!parsed.length) { setError("Nenhuma linha reconhecida. Confira se a planilha tem as colunas Setor, Questionamento, Resposta e Tipo de ação aplicada."); return; }
      setRows(parsed); setFileName(file.name);
    } catch (e: any) {
      setError("Não consegui ler o arquivo: " + (e?.message || "formato inválido"));
    }
  };

  const toggle = (i: number) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, _accept: !r._accept } : r)));
  const toggleAll = (v: boolean) => setRows((rs) => rs.map((r) => (TIPOS_GERADORES.includes(r.tipoAcao) ? { ...r, _accept: v } : r)));

  const bySetor = rows.reduce((acc: Record<string, ParsedRow[]>, r) => { (acc[r.setor] = acc[r.setor] || []).push(r); return acc; }, {});
  const accepted = rows.filter((r) => r._accept);

  const gerar = () => {
    const counts = { processos: 0, acoes: 0, conexoes: 0, candidatos: 0 };
    upd((d: DB) => {
      const laneLast: Record<string, string> = {};
      const laneCount: Record<string, number> = {};
      const setores = Object.keys(bySetor);
      const setorIndex: Record<string, number> = {}; setores.forEach((s, i) => (setorIndex[s] = i));

      const ensureLane = (setor: string): string => {
        if (laneLast[setor]) return laneLast[setor];
        const n: Processo = {
          id: uid("p"), nome: setor, descricao: "Gerado automaticamente pelo Mapeamento AI a partir do questionário AS IS.",
          tipo: "processo", x: 120 + (setorIndex[setor] || 0) * 40, y: 120 + (setorIndex[setor] || 0) * 160,
          tiposAtendimento: [], operadoras: [], sistema: "", setor: "", responsavel: "",
        };
        d.processos.push(n); counts.processos++;
        laneLast[setor] = n.id; laneCount[setor] = 1;
        return n.id;
      };

      accepted.forEach((r) => {
        if (r.tipoAcao === "Criar processo" || r.tipoAcao === "Criar decisão") {
          const prevId = laneLast[r.setor];
          const idx = (laneCount[r.setor] = (laneCount[r.setor] || 0) + 1);
          const n: Processo = {
            id: uid("p"), nome: r.acao || r.questionamento.slice(0, 60), descricao: r.resposta,
            tipo: r.tipoAcao === "Criar decisão" ? "decisao" : "processo",
            x: 120 + idx * 250, y: 120 + (setorIndex[r.setor] || 0) * 160,
            tiposAtendimento: [], operadoras: r.operadora ? [r.operadora] : [], sistema: "", setor: "", responsavel: "",
          };
          d.processos.push(n); counts.processos++;
          if (prevId) { const c: Conexao = { id: uid("e"), from: prevId, to: n.id, label: "" }; d.conexoes.push(c); counts.conexoes++; }
          laneLast[r.setor] = n.id;
        } else if (r.tipoAcao === "Adicionar ação") {
          const targetId = ensureLane(r.setor);
          const a: Acao = {
            id: uid("a"), processo: targetId, nome: r.questionamento.slice(0, 80) || r.acao.slice(0, 80),
            descricao: r.acao || r.resposta, sistema: "", responsavel: "",
            tiposAtendimento: [], operadoras: r.operadora ? [r.operadora] : [], itemConta: "", tipoConta: "",
          };
          d.acoes.push(a); counts.acoes++;
          d.tobe[a.id] = { statusFuturo: "Executada por ação humana", owner: "Hospital", uows: [], obs: r.obs || "" };
        } else if (r.tipoAcao === "Marcar candidato TO BE") {
          const g: GapManual = {
            id: uid("gap"), tipo: "Candidato TO BE", origem: "Questionário AS IS · " + (r.operadora || "—"),
            processo: "", acao: "", operadora: "", prioridade: r.criticidade === "Fundamental" ? "Alta" : r.criticidade === "Importante" ? "Média" : "Baixa",
            responsavel: "", status: "Aberto", obs: (r.acao || r.resposta) + (r.fonte ? " · Fonte: " + r.fonte : ""),
          };
          d.gapsManuais.push(g); counts.candidatos++;
        }
      });
    });
    setResult(counts);
  };

  return (
    <div>
      <div className="page-head">
        <div className="h1">Mapeamento AS IS · AI RIVIO</div>
        <p>Importe a planilha de respostas do Questionário AS IS (mesmo formato do questionarios-as-is.xlsx). Cada linha é traduzida automaticamente em processo, decisão, ação ou candidato TO BE no fluxo AS IS, de acordo com o "Tipo de ação aplicada".</p>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="between" style={{ marginBottom: rows.length ? 10 : 0 }}>
          <div>
            <div className="h2">1. Importar planilha</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{fileName ? <>Arquivo: <b>{fileName}</b> · {rows.length} linhas lidas</> : "Aceita .xlsx, .xls ou .csv"}</div>
          </div>
          <div className="row">
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            <button className="btn primary sm" onClick={() => inputRef.current?.click()}><Ic d={icons.plus} size={13} />Escolher arquivo</button>
          </div>
        </div>
        {error && <div className="badge b-red" style={{ marginTop: 10 }}>{error}</div>}
      </div>

      {rows.length > 0 && (
        <>
          <div className="between" style={{ marginBottom: 10 }}>
            <div className="h2">2. Revisar o que será gerado <span className="chip">{accepted.length}/{rows.length} selecionadas</span></div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn ghost sm" onClick={() => toggleAll(true)}>Marcar geradoras</button>
              <button className="btn ghost sm" onClick={() => toggleAll(false)}>Desmarcar tudo</button>
            </div>
          </div>

          {Object.entries(bySetor).map(([setor, list]) => (
            <div key={setor} className="card" style={{ marginBottom: 12, overflow: "hidden" }}>
              <div className="rel-col-h">{setor} <span className="chip">{list.length}</span></div>
              <div className="tbl-scroll"><table>
                <thead><tr><th style={{ width: 30 }} /><th>Questionamento</th><th>Tipo de ação</th><th>Vai gerar</th><th>Resposta / Obs</th></tr></thead>
                <tbody>{list.map((r) => {
                  const i = rows.indexOf(r);
                  const geraNode = TIPOS_GERADORES.includes(r.tipoAcao);
                  return (<tr key={i} style={{ opacity: geraNode ? 1 : 0.5 }}>
                    <td><input type="checkbox" checked={r._accept} disabled={!geraNode} onChange={() => toggle(i)} /></td>
                    <td style={{ fontWeight: 600, minWidth: 200 }}>{r.questionamento || <span className="dim">—</span>}</td>
                    <td>{r.tipoAcao ? <Badge cls={geraNode ? "b-purple" : "b-gray"}>{r.tipoAcao}</Badge> : <span className="dim">—</span>}</td>
                    <td className="muted" style={{ fontSize: 11.5 }}>
                      {r.tipoAcao === "Criar processo" && "Nova caixa de processo"}
                      {r.tipoAcao === "Criar decisão" && "Nova caixa de decisão"}
                      {r.tipoAcao === "Adicionar ação" && "Ação dentro do processo do setor"}
                      {r.tipoAcao === "Marcar candidato TO BE" && "Item em Gaps (candidato TO BE)"}
                      {!geraNode && "Nada (informativo)"}
                    </td>
                    <td className="muted" style={{ fontSize: 12, maxWidth: 280 }}>{r.acao || r.resposta || <span className="dim">—</span>}</td>
                  </tr>);
                })}</tbody>
              </table></div>
            </div>
          ))}

          <div className="row" style={{ marginTop: 6 }}>
            <button className="btn primary" disabled={!accepted.length} onClick={gerar}><Ic d={icons.plus} size={14} />Gerar mapeamento ({accepted.length})</button>
          </div>

          {result && (
            <div className="card card-pad" style={{ marginTop: 14 }}>
              <div className="h2" style={{ marginBottom: 8 }}>Mapeamento gerado</div>
              <div className="chips">
                <Badge cls="b-blue">{result.processos} processos/decisões</Badge>
                <Badge cls="b-green">{result.acoes} ações</Badge>
                <Badge cls="b-gray">{result.conexoes} conexões</Badge>
                <Badge cls="b-red">{result.candidatos} candidatos TO BE (em Gaps)</Badge>
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
                As caixas foram criadas por setor, uma ao lado da outra. Vá em <b>AS IS · Fluxo</b> para arrastar, ligar e ajustar o layout.
              </p>
              {go && <button className="btn sm" style={{ marginTop: 8 }} onClick={() => go("flow")}>Abrir AS IS · Fluxo</button>}
            </div>
          )}
        </>
      )}

      {!rows.length && !error && (
        <div className="empty">Nenhuma planilha importada ainda. Escolha o arquivo acima para começar.</div>
      )}
    </div>
  );
}
