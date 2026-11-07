# SkillChain

Uma plataforma de aprendizado para a Solana Blockchain.

SkillChain é um jogo onde se aprende Solana em três níveis. Cada nível termina com uma tarefa real na Devnet, e é essa transacção que prova que o nível foi concluído. Os pontos ganhos compram itens para personalizar o avatar, e o ranking é lido directamente das contas on-chain.

Solana Hackathon (MLH), 6 a 8 de Novembro de 2026 · Rede: Devnet.

## Documentação

- [SDD.md](SDD.md): especificação completa (fonte de verdade).
- [skillchain-mvp.md](skillchain-mvp.md): visão geral do MVP.
- [PROGRESSO.md](PROGRESSO.md): o que já foi feito, decisões e pendentes.
- [design/](design/): protótipo visual e screenshots.

## Stack

Next.js 16 · React 19 · Tailwind 4 · `@solana/web3.js` v3 · Wallet Adapter v3 · programa Anchor na Devnet (publicado pelo Solana Playground).

## Como correr

```bash
pnpm install
cp .env.example .env
pnpm dev        # http://localhost:3000
pnpm lint && pnpm build
```

Requer Node 24 ou superior e a Phantom em modo Devnet. Enquanto `NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID` estiver vazio, a app usa dados simulados em memória (selo «Mock» no cabeçalho).

## Idiomas

Inglês por defeito e português como opção (botão EN/PT no cabeçalho). Dicionários em `src/i18n/` e lições em `src/content/lessons.en.json` e `lessons.pt.json`.

## Limitação conhecida

O quiz é verificado só no front-end. A prova de cada nível é a tarefa on-chain.
