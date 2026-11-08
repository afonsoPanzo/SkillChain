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

## Modo demo

Na landing, "Try without a wallet" / "Experimentar sem carteira" abre a app inteira sem Phantom nem SOL, com um jogador simulado novo (nível 0) e o ranking simulado. Usa o backend mock. O estado fica em `sessionStorage` (sobrevive a recarregamentos, não a uma nova sessão do browser). Uma faixa no topo avisa que nada vai para a blockchain; "Use a real wallet" sai do modo e apaga os dados simulados. Ligar uma carteira real durante a demo também sai do modo demo. `NEXT_PUBLIC_USE_MOCK=true` continua a forçar o mock para desenvolvimento.

## Tutor de IA

Depois de concluir um nível, "Explain my transaction" chama `POST /api/tutor`. O servidor lê a transacção da Devnet, extrai só factos (taxa, contas e papéis, variações de saldo, instrução identificada pelo discriminator do IDL, evento `LevelCompleted`) e pede ao Gemini (`@google/genai`, modelo por defeito `gemini-3.5-flash-lite`) uma explicação de 4 a 6 frases. Se a IA falhar, demorar mais de 10 s ou esgotar a quota, devolve uma explicação por template e o UI marca-a como tal. Há cache por assinatura e língua, limite de 10 pedidos por IP em 5 minutos e corpo máximo de 1 KB. A chave `GEMINI_API_KEY` e o modelo `GEMINI_MODEL` ficam só no servidor (sem prefixo `NEXT_PUBLIC_`); sem chave, o tutor usa sempre o template. No modo demo mostra um exemplo fixo sem chamar o servidor.

## Limitação conhecida

O quiz é verificado só no front-end. A prova de cada nível é a tarefa on-chain.
