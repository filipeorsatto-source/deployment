export interface Named { id: string; nome: string; }
export interface ItemConta extends Named { grupo?: string; }
export interface Funcionario extends Named { setor: string; cargo: string; }

export interface UnitOfWork {
  id: string; etapa: string; nome: string; descricao: string;
  modo: string; cobertura: string; automacao: number;
  plataforma: string; quemExecuta: string; responsavel: string;
}

export interface Processo {
  id: string; nome: string; descricao: string; tipo: "processo" | "decisao";
  x: number; y: number; tiposAtendimento: string[]; operadoras: string[];
  sistema: string; setor: string; responsavel: string;
}
export interface Conexao { id: string; from: string; to: string; label: string; }
export interface Acao {
  id: string; processo: string; nome: string; descricao: string;
  sistema: string; responsavel: string; tiposAtendimento: string[];
  operadoras: string[]; itemConta: string; tipoConta: string;
}
export interface TobeEntry { statusFuturo: string; owner: string; uows: string[]; obs: string; }
export interface Problema {
  id: string; tipo: string; nome: string; descricao: string;
  operadoras: string[]; itensConta: string[]; tiposAtendimento: string[];
  prioridade: string; esforco: number;
}
export interface Regra {
  id: string; nome: string; descricao: string; itensConta: string[];
  operadoras: string[]; tiposAtendimento: string[]; problemas: string[];
  status: string; obs: string;
}
export interface GapManual {
  id: string; tipo: string; origem: string; processo: string; acao: string;
  operadora: string; prioridade: string; responsavel: string; status: string; obs: string;
}
export interface Teste {
  id: string; data: string; tipoConta: string; tipoTeste: string;
  ambiente: string; dono: string; descricao: string; nota: number;
}

export interface DB {
  operadoras: Named[];
  tiposAtendimento: Named[];
  tiposConta: Named[];
  itensConta: ItemConta[];
  setores: Named[];
  funcionarios: Funcionario[];
  sistemas: Named[];
  plataformas: Named[];
  produtosRivio: Named[];
  unitsOfWork: UnitOfWork[];
  processos: Processo[];
  conexoes: Conexao[];
  acoes: Acao[];
  tobe: Record<string, TobeEntry>;
  problemas: Problema[];
  regras: Regra[];
  gapsManuais: GapManual[];
  testes: Teste[];
}

export type DBKey = keyof DB;
