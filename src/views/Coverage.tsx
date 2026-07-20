import { useState } from "react";
import { useStore } from "../store";
import { deriveTobe, deriveGaps, nameById } from "../lib/derive";

export function CoverageExplorer() {
  const { db } = useStore();
  const kinds = [
    { k: "itemConta", label: "Item da conta", list: db.itensConta },
    { k: "uow", label: "Unit of Work", list: db.unitsOfWork },
    { k: "operadora", label: "Operadora", list: db.operadoras },
    { k: "processo", label: "Processo", list: db.processos },
    { k: "sistema", label: "Sistema", list: db.sistemas },
  ];
  const [kind, setKind] = useState("uow");
  const first = (kinds.find((x) => x.k === "uow")!.list[0] || {}).id || "";
  const [sel, setSel] = useState(first);
  const cur = kinds.find((x) => x.k === kind)!;
  const rows = deriveTobe(db);
  const gaps = deriveGaps(db);
  const actItem = (a: any) => ({ label: a.nome, tag: nameById(db.sistemas, a.sistema) });

  const relFor = (): any[] => {
    if (kind === "itemConta") {
      const acoes = db.acoes.filter((a) => a.itemConta === sel);
      const procIds = [...new Set(acoes.map((a) => a.processo))];
      const uows = [...new Set(rows.filter((r) => acoes.some((a) => a.id === r.id)).flatMap((r) => r.uows))];
      const regras = db.regras.filter((r) => (r.itensConta || []).includes(sel));
      const gp = gaps.filter((g) => g.acao && acoes.some((a) => a.id === g.acao));
      const tas = [...new Set(acoes.flatMap((a) => a.tiposAtendimento))];
      return [
        { t: "Processos onde aparece", items: procIds.map((id) => nameById(db.processos, id)) },
        { t: "Tipos de atendimento", items: tas.map((id) => nameById(db.tiposAtendimento, id)) },
        { t: "Ações", items: acoes.map(actItem) },
        { t: "Units of Work que cobrem", items: uows.map((id) => nameById(db.unitsOfWork, id)), green: true },
        { t: "Regras existentes", items: regras.map((r) => r.nome) },
        { t: "Gaps", items: gp.map((g) => g.tipo), red: true },
      ];
    }
    if (kind === "uow") {
      const acoes = rows.filter((r) => r.uows.includes(sel));
      const u: any = db.unitsOfWork.find((x) => x.id === sel) || {};
      return [
        { t: "Ações que cobre", items: acoes.map(actItem), green: true },
        { t: "Processos impactados", items: [...new Set(acoes.map((a) => (a.proc ? a.proc.nome : "—")))] },
        { t: "Etapa RCM", items: [u.etapa] },
        { t: "Cobertura / automação", items: [u.cobertura + " · " + Math.round((u.automacao || 0) * 100) + "% autom."] },
        { t: "Modo / plataforma", items: [u.modo + " · " + u.plataforma] },
      ];
    }
    if (kind === "operadora") {
      const acoes = db.acoes.filter((a) => a.operadoras.includes(sel));
      const procIds = [...new Set(acoes.map((a) => a.processo))];
      const regras = db.regras.filter((r) => (r.operadoras || []).includes(sel));
      const probs = db.problemas.filter((p) => (p.operadoras || []).includes(sel));
      const gp = gaps.filter((g) => g.operadora === sel);
      return [
        { t: "Processos", items: procIds.map((id) => nameById(db.processos, id)) },
        { t: "Ações", items: acoes.map(actItem) },
        { t: "Problemas / dores", items: probs.map((p) => p.nome) },
        { t: "Regras", items: regras.map((r) => r.nome), green: true },
        { t: "Gaps", items: gp.map((g) => g.tipo), red: true },
      ];
    }
    if (kind === "processo") {
      const acoes = rows.filter((r) => r.processo === sel);
      const uows = [...new Set(acoes.flatMap((a) => a.uows))];
      const gp = acoes.filter((a) => a.isGap);
      return [
        { t: "Ações", items: acoes.map(actItem) },
        { t: "Units of Work", items: uows.map((id) => nameById(db.unitsOfWork, id)), green: true },
        { t: "Ações cobertas", items: acoes.filter((a) => a.cobre).map(actItem), green: true },
        { t: "Gaps neste processo", items: gp.map((a) => a.nome), red: true },
      ];
    }
    if (kind === "sistema") {
      const acoes = db.acoes.filter((a) => a.sistema === sel);
      const procIds = [...new Set(db.processos.filter((p) => p.sistema === sel).map((p) => p.id))];
      const itens = [...new Set(acoes.map((a) => a.itemConta).filter(Boolean))];
      return [
        { t: "Ações neste sistema", items: acoes.map(actItem) },
        { t: "Processos neste sistema", items: procIds.map((id) => nameById(db.processos, id)) },
        { t: "Itens da conta tratados", items: itens.map((id) => nameById(db.itensConta, id)) },
      ];
    }
    return [];
  };
  const rel = relFor();
  const renderItem = (it: any, c: any, j: number) => {
    const label = typeof it === "string" ? it : it.label;
    const tag = typeof it === "object" ? it.tag : null;
    return (<div className="rel-item" key={j}><span className="row" style={{ gap: 6 }}>{c.green && <span className="dot" style={{ background: "#16a34a" }} />}{c.red && <span className="dot" style={{ background: "#dc2626" }} />}{label}</span>{tag && <span className="chip">{tag}</span>}</div>);
  };

  return (
    <div>
      <div className="page-head"><div className="h1">Coverage Explorer</div><p>Escolha qualquer entidade e navegue pelas relações — onde aparece, o que a cobre, regras e gaps. As ações mostram o sistema como etiqueta.</p></div>
      <div className="chips" style={{ marginBottom: 16 }}>{kinds.map((k) => <button key={k.k} className={"ce-pill " + (kind === k.k ? "active" : "")} onClick={() => { setKind(k.k); setSel((k.list[0] || ({} as any)).id || ""); }}>{k.label}</button>)}</div>
      <div className="grid" style={{ gridTemplateColumns: "240px 1fr", alignItems: "start" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="rel-col-h">{cur.label}s <span className="chip">{cur.list.length}</span></div>
          <div style={{ maxHeight: 520, overflow: "auto" }}>{cur.list.map((it: any) => (<div key={it.id} className="rel-item clickable" style={{ ...(sel === it.id ? { background: "var(--brand-soft)", color: "var(--brand)", fontWeight: 600 } : {}), justifyContent: "flex-start" }} onClick={() => setSel(it.id)}>{it.nome}</div>))}
            {!cur.list.length && <div className="rel-item dim">Nada cadastrado</div>}</div>
        </div>
        <div>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 700 }}>{cur.label} selecionado</div>
            <div className="h1" style={{ fontSize: 18, marginTop: 4 }}>{nameById(cur.list, sel)}</div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {rel.map((c, i) => (<div className="rel-col" key={i}>
              <div className="rel-col-h">{c.t}<span className="chip">{c.items.length}</span></div>
              {c.items.length ? c.items.map((it: any, j: number) => renderItem(it, c, j)) : <div className="rel-item dim">Nenhum</div>}
            </div>))}
          </div>
        </div>
      </div>
    </div>
  );
}
