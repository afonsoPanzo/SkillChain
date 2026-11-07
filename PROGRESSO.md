# SkillChain: registo do trabalho feito

Estado em 7 de Novembro de 2026 · Solana Hackathon (MLH) · Rede: Devnet

Este documento resume o que foi feito até agora, as decisões tomadas e o que falta. A fonte de verdade da especificação continua a ser o [SDD.md](SDD.md).

## 1. Estado actual

| Fase | Descrição | Estado |
| --- | --- | --- |
| 1 | Base: carteira, ler perfil, criar perfil em `/learn/1` | Feita e validada na Devnet |
| 2 | Três níveis completos (lições, quiz, tarefas) | Feita e validada na Devnet |
| 3 | Loja, perfil com inventário, avatar em camadas | Feita, por validar na Devnet |
| 4 | Ranking e testes | Por fazer |
| 5 | Entrega (Vercel, README, vídeo, Devpost) | Por fazer |
| 6 | Certificado NFT (opcional) | Por fazer |

Verificação da Fase 1: `pnpm lint`, `pnpm build` e `tsc --noEmit` passam sem erros. As rotas `/`, `/learn`, `/learn/1`, `/learn/2`, `/shop`, `/profile` e `/leaderboard` respondem 200, e `/learn/9` responde 404. O fluxo com a Phantom ainda não foi testado no browser.

## 2. Ambiente e projecto

- O template `web3js-next-tailwind-counter` já não existe no repositório oficial `solana-foundation/templates`. Foi usado o `web3js-nextjs`: Next 16, Tailwind 4, `@solana/web3.js` v3 e Wallet Adapter v3. Não traz `@coral-xyz/anchor`.
- O pnpm foi instalado globalmente com `npm install -g pnpm`. No Windows, o atalho global ficou partido. Se `pnpm` não funcionar, usa `node "<pasta npm global>\node_modules\pnpm\bin\pnpm.mjs" ...`.
- O pnpm 12 ignorou o script de build do `esbuild`. Só afecta o `vitest`, que ainda não é usado.
- O export do Claude Design foi movido para `design/`. Os SVGs foram para `public/items/`. O `.zip` e a pasta duplicada foram apagados depois de confirmar, por hash, que eram cópias idênticas.

## 3. Estrutura

```
skillchain/
├─ anchor/programs/skillchain/src/lib.rs   # placeholder: substituir pelo código real (só referência)
├─ design/                                 # export do Claude Design (protótipo, screenshots)
├─ public/items/                           # SVGs do avatar, molduras, óculos
├─ src/
│  ├─ app/                                 # rotas: /, /learn, /learn/[level], /shop, /profile, /leaderboard
│  ├─ components/
│  │  ├─ providers.tsx, solana-provider.tsx   # Wallet Adapter, Devnet fixa
│  │  └─ skillchain/                          # componentes do jogo
│  ├─ content/lessons.json                 # título, tópicos e tarefa de cada nível
│  ├─ idl/README.md                        # aqui entra o skillchain.json exportado do Playground
│  └─ lib/skillchain/                      # constantes, tipos, erros, hooks e camada de dados
├─ SDD.md · skillchain-mvp.md · PROGRESSO.md
└─ .env.example
```

Alterações em relação ao template: `app/` passou para `src/app/` e o alias `@/*` aponta para `src/`. Foram removidos o SIWS, as rotas `/api/auth`, o selector de cluster, o tema claro/escuro e as ações de exemplo.

## 4. Camada de dados (`src/lib/skillchain/`)

| Ficheiro | Função |
| --- | --- |
| `constants.ts` | Espelho das constantes da secção 4.4 do SDD: pontos por nível, 0,01 SOL, `NONE = 255`, os 4 itens com preço, nível mínimo e asset |
| `types.ts` | `Profile`, `Note`, `TxState` e a interface `SkillChainBackend` |
| `errors.ts` | Mapa dos 9 erros do programa para mensagens em português, mais cancelamento, saldo e expiração |
| `backend.ts` | Escolhe a implementação: mock se `NEXT_PUBLIC_USE_MOCK=true` ou sem Program ID; senão o programa real |
| `program.ts` | Backend real sobre `@solana/web3.js` v3 (sem Anchor): PDAs, instruções, envio e confirmação |
| `codec.ts` | Borsh à mão: descodifica Profile (62 bytes) e Note, verifica o discriminator, serializa argumentos |
| `rpc.ts` | Endpoint Devnet e ligação partilhada |
| `mock-backend.ts` | Implementação em memória com as mesmas regras do programa. Os dados repõem-se ao recarregar a página |
| `hooks.ts` | `useProfile`, `useNote`, `useLeaderboard` e `useSkillChain` (mutações com os estados da transacção) |
| `store.ts` | Invalida os dados depois de uma transacção confirmada |
| `rewards.ts` | Calcula o cartão «próxima recompensa» a partir das constantes |
| `lessons.ts` | Tipos e acesso ao `lessons.json` |
| `format.ts` | Endereço abreviado, link do Explorer e formato de SOL |
| `use-balance.ts` | Saldo da Devnet em tempo real (vindo do template) |

Estados de uma transacção: inactivo, a aguardar assinatura, a confirmar, confirmado (com link do Explorer) ou erro com mensagem clara.

### Trocar o mock pelo programa real

1. Colocar o IDL em `src/idl/skillchain.json` e o Program ID em `NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID` no `.env`.
2. Implementar `SkillChainBackend` contra o programa (PDAs em `["profile", carteira]` e `["note", carteira]`).
3. Exportar essa implementação em `backend.ts`. Os componentes não mudam.

Em `@solana/web3.js` v3, `PublicKey.findProgramAddress` é assíncrono.

## 5. Ecrãs feitos (Fase 1)

- **Landing (`/`):** kicker, título, três passos, botão de ligar a carteira (ou «Começar» se já ligada) e link do faucet.
- **Cabeçalho:** marca, selo «Devnet», selo «Mock» enquanto os dados forem simulados, pontos e botão da carteira.
- **Navegação inferior:** Aprender, Loja, Perfil, Ranking. Fica escondida dentro de um nível.
- **Mapa (`/learn`):** três cartões de nível (bloqueado, disponível, concluído), progresso e cartão «próxima recompensa».
- **Nível 1 (`/learn/1`):** saldo da Devnet, aviso e link do faucet se for 0, botão «Criar perfil», progresso da transacção e ecrã de nível concluído com a prova on-chain.
- **Loja, Perfil, Ranking:** páginas vazias que indicam em que fase chegam.

## 6. Decisões e desvios

Regra seguida: lógica do SDD, visual do design.

**Mantido do design:** paleta, tipografia (Bricolage Grotesque e JetBrains Mono), coluna de 480px, botões «3D», cartão «próxima recompensa». O cartão de rival entra só na Fase 4, calculado a partir do ranking. O combo do quiz fica só como efeito visual.

**Cortado do design:** missões diárias, vidas, cronómetro, sons, vibração e alternância EN/PT. A interface é só em português.

**Outras decisões:**
- Sem airdrop dentro da app: só o link para https://faucet.solana.com, porque o `requestAirdrop` falha com frequência na Devnet.
- O título «Mestre das PDAs» é uma pílula de texto, como no protótipo.
- Os dados de ranking do mock vêm dos 7 jogadores do protótipo.
- No mock, a assinatura é aleatória e não existe no Explorer. O ecrã de conclusão avisa disso.
- O `lessons.json` tem para já só título, tópicos e tarefa. Passos e quiz entram na Fase 2.
- Os níveis 2 e 3 mostram «disponível na próxima fase».

## 7. Pendente

- Validar o programa real na Devnet (IDL escrito à mão a partir do `lib.rs`; discriminators verificados por SHA-256). Testes unitários do codec em `tests/codec.test.ts`.
- Substituir o placeholder de `anchor/programs/skillchain/src/lib.rs` pelo código final (só referência; não se corre `anchor build` nem `anchor deploy`).
- Fases 2 a 5, e Fase 6 se houver tempo.
- Testes do programa (secção 7 do SDD) e testes do front-end.
- Decidir se a ligação ao programa usa `@coral-xyz/anchor` (dependência nova, precisa de aprovação) ou o IDL à mão sobre o `web3.js` v3.

## 8. Como correr

```bash
pnpm install
cp .env.example .env     # preencher NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID quando existir
pnpm dev                 # http://localhost:3000
pnpm lint && pnpm build
```

Requer Node 24 ou superior e a Phantom em modo Devnet.
