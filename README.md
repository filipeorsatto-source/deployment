# Rivio · Plataforma de Implantação

App web para mapear a operação de um hospital (AS IS), desenhar o To Be, analisar a cobertura
do produto Rivio (Units of Work da base RCM 2.0), identificar gaps e gerir regras de auditoria e testes.

Stack: **React + TypeScript + Vite**. Dados em tempo real no **Firebase Realtime Database**.
Login **Google** restrito a contas `@rivio.com.br`.

## Rodar localmente
```bash
npm install
npm run dev      # http://localhost:5173
```

## Publicar no GitHub Pages (sem build no servidor)
A pasta **`docs/`** já contém a versão compilada (pronta para servir).

1. Suba todos os arquivos deste projeto no repositório.
2. No GitHub: **Settings → Pages → Build and deployment**.
3. Em **Source**, escolha **Deploy from a branch**.
4. Em **Branch**, selecione `main` e a pasta **`/docs`**, e clique **Save**.
5. Aguarde ~1 min e abra a URL do Pages.

> Sempre que mudar o código, rode `npm run build` de novo e copie o conteúdo de `dist/`
> para `docs/` antes de subir (ou use o workflow do GitHub Actions — ver abaixo).

## Regenerar o build de produção
```bash
npm run build            # gera dist/
# copie dist/ para docs/ (Windows PowerShell):
#   Remove-Item docs -Recurse -Force; Copy-Item dist docs -Recurse
```

## Firebase
Config em `src/firebase.ts` (client-side; a segurança vem das regras do Realtime Database e da
restrição de domínio no login). Os dados vivem no nó `frame`. Na 1ª execução, se o nó estiver
vazio, o app popula as 110 Units of Work da base RCM 2.0. As demais coleções começam vazias.

Lembre de adicionar o domínio do Pages em **Firebase → Authentication → Settings → Authorized domains**.

## Estrutura
```
docs/                versão compilada (servida pelo GitHub Pages)
src/
  App.tsx            shell, navegação, busca, gate de login
  firebase.ts        Firebase (RTDB + Auth Google)
  auth.tsx           contexto de autenticação (@rivio.com.br)
  store.tsx          estado global + sync com o RTDB
  types.ts           tipos do modelo
  styles.css         estilos
  data/seed.ts       base embutida (Units of Work RCM 2.0)
  lib/               constants.ts · derive.ts (To Be, Gaps, helpers)
  ui.tsx             componentes compartilhados
  views/             uma tela por arquivo
```
