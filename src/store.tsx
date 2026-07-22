import { createContext, useContext, useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db as rtdb } from "./firebase";
import { seed } from "./data/seed";
import type { DB } from "./types";

const DB_PATH = "frame";

const toArr = (v: any) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []);
// Registros antigos/incompletos no Firebase podem não ter certos campos de array
// (ex.: "operadoras" ausente numa ação) — isso derrubava o app inteiro (tela branca)
// em qualquer lugar que fizesse .forEach ou [0] nesses campos. Preenchemos os padrões aqui,
// uma única vez, pra todo o resto do app poder confiar que esses campos sempre existem.
const sanitizeAcao = (a: any) => ({ operadoras: [], tiposAtendimento: [], itemConta: "", tipoConta: "", ...a });
const sanitizeProcesso = (p: any) => ({ operadoras: [], tiposAtendimento: [], ...p });
const sanitizeProblema = (pb: any) => ({ operadoras: [], itensConta: [], tiposAtendimento: [], ...pb });
const sanitizeRegra = (r: any) => ({ itensConta: [], operadoras: [], tiposAtendimento: [], problemas: [], ...r });
function normalize(val: any): DB {
  return {
    operadoras: toArr(val?.operadoras), tiposAtendimento: toArr(val?.tiposAtendimento),
    tiposConta: toArr(val?.tiposConta), itensConta: toArr(val?.itensConta),
    setores: toArr(val?.setores), funcionarios: toArr(val?.funcionarios),
    sistemas: toArr(val?.sistemas), plataformas: toArr(val?.plataformas),
    produtosRivio: toArr(val?.produtosRivio), unitsOfWork: toArr(val?.unitsOfWork),
    processos: toArr(val?.processos).map(sanitizeProcesso), conexoes: toArr(val?.conexoes), acoes: toArr(val?.acoes).map(sanitizeAcao),
    tobe: val?.tobe && typeof val.tobe === "object" && !Array.isArray(val.tobe) ? val.tobe : {},
    problemas: toArr(val?.problemas).map(sanitizeProblema), regras: toArr(val?.regras).map(sanitizeRegra),
    gapsManuais: toArr(val?.gapsManuais), testes: toArr(val?.testes),
  };
}

interface StoreCtx { db: DB; upd: (fn: (d: DB) => void) => void; ready: boolean; }
const Ctx = createContext<StoreCtx>(null as any);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }: { children: any }) {
  const [db, setDb] = useState<DB | null>(null);

  useEffect(() => {
    const r = ref(rtdb, DB_PATH);
    const unsub = onValue(r, (snap) => {
      const val = snap.val();
      if (!val) { set(r, seed); setDb(seed); }
      else setDb(normalize(val));
    });
    return () => unsub();
  }, []);

  const upd = (fn: (d: DB) => void) => {
    setDb((prev) => {
      if (!prev) return prev;
      const n: DB = JSON.parse(JSON.stringify(prev));
      fn(n);
      set(ref(rtdb, DB_PATH), n);
      return n;
    });
  };

  if (!db)
    return <div className="login-wrap"><div className="dim">Carregando dados…</div></div>;

  return <Ctx.Provider value={{ db, upd, ready: true }}>{children}</Ctx.Provider>;
}
