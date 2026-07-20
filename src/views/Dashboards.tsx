import { useStore } from "../store";
import { deriveTobe, deriveGaps } from "../lib/derive";
import { PRIORIDADES, REGRA_STATUS, STATUS_WEIGHT, regraStatusClass } from "../lib/constants";
import { Badge, StatusBadge, Chips } from "../ui";

const Stat = ({ label, val, color, sub }: any) => (
  <div className="stat"><div className="label">{label}</div><div className="val" style={color ? { color } : {}}>{val}</div>{sub && <div className="delta">{sub}</div>}</div>
);

export function DashProcesso({ go }: { go: (v: string) => void }) {
  const { db } = useStore();
  const rows = deriveTobe(db);
  const total = rows.length;
  const cobertas = rows.filter((r) => r.cobre).length;
  const humanas = rows.filter((r) => r.statusFuturo === "Executada por ação humana").length;
  const eliminadas = rows.filter((r) => r.statusFuturo === "Eliminada").length;
  const descobertas = rows.filter((r) => r.isGap).length;
  const pct = total ? Math.round((cobertas / total) * 100) : 0;
  const setores = db.setores.map((s) => {
    const rr = rows.filter((r) => r.proc && r.proc.setor === s.id);
    return { nome: s.nome, total: rr.length, cob: rr.filter((r) => r.cobre).length, hum: rr.filter((r) => r.statusFuturo === "Executada por ação humana").length, eli: rr.filter((r) => r.statusFuturo === "Eliminada").length, gap: rr.filter((r) => r.isGap).length };
  }).filter((s) => s.total > 0);
  const procs = db.processos.map((p) => { const rr = rows.filter((r) => r.processo === p.id); return { nome: p.nome, total: rr.length, cob: rr.filter((r) => r.cobre).length }; }).filter((p) => p.total > 0);

  return (
    <div>
      <div className="page-head"><div className="h1">Dashboard · Processo</div><p>Análise do fluxo AS IS: volume de ações, quanto já é coberto pelo produto e quebras por setor e processo.</p></div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
        <Stat label="Processos" val={db.processos.length} />
        <Stat label="Total de ações" val={total} />
        <Stat label="Cobertas por produto" val={cobertas} color="var(--green)" />
        <Stat label="Ação humana" val={humanas} color="var(--blue)" />
        <Stat label="Eliminadas" val={eliminadas} color="var(--text-2)" />
        <Stat label="% cobertura" val={pct + "%"} color="var(--brand)" />
      </div>
      {total === 0 && <div className="card card-pad" style={{ marginTop: 14 }} ><div className="dim">Nenhum processo/ação cadastrado ainda. Vá em <b>AS IS · Fluxo</b> para começar a mapear.</div></div>}
      {total > 0 && <div className="card card-pad" style={{ marginTop: 14 }}>
        <div className="between" style={{ marginBottom: 10 }}><div className="h2">Distribuição das ações (To Be)</div>
          <div className="tag-legend"><span><span className="dot" style={{ background: "#16a34a" }} /> Produto</span><span><span className="dot" style={{ background: "#2563eb" }} /> Humano</span><span><span className="dot" style={{ background: "#8b8f98" }} /> Eliminada</span><span><span className="dot" style={{ background: "#dc2626" }} /> Gap</span></div></div>
        <div className="progress" style={{ height: 14 }}>
          <span style={{ width: (cobertas / total) * 100 + "%", background: "#16a34a" }} />
          <span style={{ width: (humanas / total) * 100 + "%", background: "#2563eb" }} />
          <span style={{ width: (eliminadas / total) * 100 + "%", background: "#8b8f98" }} />
          <span style={{ width: (descobertas / total) * 100 + "%", background: "#dc2626" }} />
        </div>
        {descobertas > 0 && <div className="dim" style={{ fontSize: 11.5, marginTop: 8 }}>{descobertas} ação(ões) marcada(s) como produto sem UoW → <span className="link" onClick={() => go("gaps")}>ver gaps</span></div>}
      </div>}
      {total > 0 && <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginTop: 18, alignItems: "start" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="rel-col-h">Quebra por setor</div>
          <div className="tbl-scroll"><table><thead><tr><th>Setor</th><th>Ações</th><th>Produto</th><th>Humano</th><th>Elimin.</th><th>Gap</th><th>% cob.</th></tr></thead>
            <tbody>{setores.map((s) => (<tr key={s.nome}><td style={{ fontWeight: 600 }}>{s.nome}</td><td>{s.total}</td><td><span className="badge b-green">{s.cob}</span></td><td>{s.hum}</td><td>{s.eli}</td><td>{s.gap ? <span className="badge b-red">{s.gap}</span> : 0}</td><td>{s.total ? Math.round((s.cob / s.total) * 100) : 0}%</td></tr>))}</tbody></table></div>
        </div>
        <div className="card card-pad">
          <div className="h2" style={{ marginBottom: 12 }}>Cobertura por processo</div>
          {procs.map((p) => (<div className="bar-row" key={p.nome}><div className="bl" title={p.nome} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nome}</div><div className="bar-track"><div className="bar-fill" style={{ width: (p.total ? (p.cob / p.total) * 100 : 0) + "%", background: "#4f46e5" }}>{p.cob}/{p.total}</div></div></div>))}
        </div>
      </div>}
    </div>
  );
}

export function DashRegras() {
  const { db } = useStore();
  const dores = db.problemas;
  const esforcoTotal = dores.reduce((s, d) => s + (d.esforco || 0), 0);
  const rulesFor = (pid: string) => db.regras.filter((r) => (r.problemas || []).includes(pid));
  let cobVinculo = 0, cobEfetiva = 0;
  const lista = dores.map((d) => {
    const rs = rulesFor(d.id);
    const bestW = rs.length ? Math.max(...rs.map((r) => STATUS_WEIGHT[r.status] || 0)) : 0;
    if (rs.length) cobVinculo += d.esforco || 0;
    cobEfetiva += (d.esforco || 0) * bestW;
    return { ...d, rules: rs, bestW };
  });
  const pctVinc = esforcoTotal ? Math.round((cobVinculo / esforcoTotal) * 100) : 0;
  const pctEf = esforcoTotal ? Math.round((cobEfetiva / esforcoTotal) * 100) : 0;
  const totalDores = dores.filter((d) => d.tipo === "Dor operacional").length;
  const totalMotivos = dores.filter((d) => d.tipo === "Motivo de glosa").length;
  const byStatus = REGRA_STATUS.map((s) => ({ s, n: db.regras.filter((r) => r.status === s).length }));
  const STATUS_COLORS: Record<string, string> = { Ativa: "#16a34a", "Em teste": "#d97706", Inativa: "#8b8f98" };
  const byItem = db.itensConta.map((i) => {
    const rs = db.regras.filter((r) => (r.itensConta || []).includes(i.id));
    const counts: Record<string, number> = {}; REGRA_STATUS.forEach((st) => (counts[st] = rs.filter((r) => r.status === st).length));
    return { nome: i.nome, total: rs.length, counts };
  }).filter((x) => x.total > 0);
  const byItemMax = Math.max(1, ...byItem.map((x) => x.total));

  return (
    <div>
      <div className="page-head"><div className="h1">Dashboard · Regras</div><p>Cobertura das dores e motivos de glosa pelo motor de regras. A cobertura efetiva pondera pelo status da regra — só conta 100% quando a regra está Ativa (testada).</p></div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
        <Stat label="Dores mapeadas" val={totalDores} />
        <Stat label="Motivos de glosa" val={totalMotivos} />
        <Stat label="Regras criadas" val={db.regras.length} />
        <Stat label="Esforço total" val={esforcoTotal} sub="soma dos scores" />
        <Stat label="Cobertura efetiva" val={pctEf + "%"} color="var(--brand)" sub={Math.round(cobEfetiva) + "/" + esforcoTotal + " de esforço"} />
      </div>
      <div className="card card-pad" style={{ marginTop: 14 }}>
        <div className="h2" style={{ marginBottom: 10 }}>Cobertura por esforço</div>
        <div className="bar-row"><div className="bl">Por vínculo</div><div className="bar-track"><div className="bar-fill" style={{ width: pctVinc + "%", background: "#2563eb" }}>{cobVinculo}/{esforcoTotal} · {pctVinc}%</div></div></div>
        <div className="bar-row"><div className="bl">Efetiva (status)</div><div className="bar-track"><div className="bar-fill" style={{ width: pctEf + "%", background: "#16a34a" }}>{Math.round(cobEfetiva)}/{esforcoTotal} · {pctEf}%</div></div></div>
        <div className="dim" style={{ fontSize: 11.5, marginTop: 4 }}>Peso por status: Ativa = 100% · Em teste = 50% · Inativa = 0%.</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 16, alignItems: "start" }}>
        <div className="card card-pad"><div className="h2" style={{ marginBottom: 12 }}>Regras por status</div>
          {byStatus.map((x) => (<div className="bar-row" key={x.s}><div className="bl">{x.s}</div><div className="bar-track"><div className="bar-fill" style={{ width: (db.regras.length ? (x.n / db.regras.length) * 100 : 0) + "%", background: x.s === "Ativa" ? "#16a34a" : x.s === "Em teste" ? "#d97706" : "#8b8f98" }}>{x.n}</div></div></div>))}
        </div>
        <div className="card card-pad">
          <div className="between" style={{ marginBottom: 12 }}><div className="h2">Regras por item da conta</div>
            <div className="tag-legend">{REGRA_STATUS.map((st) => <span key={st}><span className="dot" style={{ background: STATUS_COLORS[st] }} /> {st}</span>)}</div></div>
          {byItem.length ? byItem.map((x) => (<div className="bar-row" key={x.nome}><div className="bl">{x.nome}</div>
            <div className="bar-track" style={{ display: "flex" }}>
              {REGRA_STATUS.map((st) => { const n = x.counts[st]; if (!n) return null; return <div key={st} className="bar-fill" style={{ width: (n / byItemMax) * 100 + "%", background: STATUS_COLORS[st], borderRadius: 0, minWidth: 22 }} title={st + ": " + n}>{n}</div>; })}
            </div></div>)) : <div className="dim">Sem regras.</div>}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="rel-col-h">Dores / motivos e regra de cobertura</div>
        <div className="tbl-scroll"><table><thead><tr><th>Problema</th><th>Tipo</th><th>Esforço</th><th>Regra que cobre</th><th>Status regra</th><th>Cobertura</th></tr></thead>
          <tbody>{lista.map((d) => (<tr key={d.id}>
            <td style={{ fontWeight: 600, minWidth: 200 }}>{d.nome}</td>
            <td><Badge cls={d.tipo === "Dor operacional" ? "b-blue" : "b-red"}>{d.tipo}</Badge></td>
            <td>{d.esforco}</td>
            <td>{d.rules.length ? <Chips items={d.rules.map((r) => r.nome)} /> : <span className="badge b-red">Sem regra</span>}</td>
            <td>{d.rules.length ? <div className="chips">{d.rules.map((r) => <StatusBadge key={r.id} s={r.status} fn={regraStatusClass} />)}</div> : "—"}</td>
            <td><Badge cls={d.bestW === 1 ? "b-green" : d.bestW > 0 ? "b-amber" : "b-red"}>{Math.round(d.bestW * 100)}%</Badge></td>
          </tr>))}
          {!lista.length && <tr><td colSpan={6}><div className="empty">Nenhum problema cadastrado.</div></td></tr>}</tbody>
        </table></div>
      </div>
    </div>
  );
}
