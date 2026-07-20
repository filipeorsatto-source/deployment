# Rivio · Plataforma de Implantação

Aplicação web para mapear a operação de um hospital (AS IS), desenhar o estado futuro (To Be),
analisar a cobertura do produto Rivio (Units of Work da base RCM 2.0), identificar gaps e
gerir as regras de auditoria e os testes.

Stack: **React + TypeScript + Vite**. Dados em tempo real no **Firebase Realtime Database**.
Login via **Google**, restrito a contas `@rivio.com.br`.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Build de produção

```bash
npm run build      # gera dist/
npm run preview    # serve o build localmente
```

## Deploy

O `base` do Vite está como `"./"` (caminhos relativos), então funciona em qualquer host estático:

- **Vercel / Netlify**: importe o repositório; build command `npm run build`, output `dist`.
- **GitHub Pages**: rode `npm run build` e publique a pasta `dist/` (ou use a Action `actions/deploy-pages`).

## Firebase

A configuração fica em `src/firebase.ts`. O objeto `firebaseConfig` é público por natureza
(client-side) — a segurança é garantida pelas **regras** do Realtime Database e pela
restrição de domínio no login. Os dados vivem sob o nó `frame` do banco.

Na primeira execução, se o nó `frame` estiver vazio, o app popula automaticamente as
**110 Units of Work** da base RCM 2.0. As demais coleções começam vazias e são preenchidas
pelo uso.

## Estrutura

```
src/
  main.tsx            Ponto de entrada
  App.tsx             Shell, navegação, busca, gate de login
  firebase.ts         Config do Firebase (RTDB + Auth Google)
  auth.tsx            Contexto de autenticação (@rivio.com.br)
  store.tsx           Estado global + sincronização com o RTDB
  types.ts            Tipos do modelo de dados
  styles.css          Estilos (tema claro)
  data/seed.ts        Base embutida (Units of Work RCM 2.0)
  lib/                constants.ts (listas/cores) · derive.ts (To Be, Gaps, helpers)
  ui.tsx              Componentes compartilhados (Badge, Modal, Tabela, MultiSelect…)
  views/              Uma tela por arquivo (Dashboards, Flow, ToBe, ChangeMgmt,
                      UoW, Regras, Gaps, Testes, Coverage, Cadastros)
```
