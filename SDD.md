# SkillChain — Software Design Document (SDD)

Versão 1.0 · 6 de Novembro de 2026 · Solana Hackathon (MLH)
Documento base para implementação com o Claude Code. Este documento é a fonte de verdade: se algo aqui contradizer o documento de MVP, vale o SDD.

---

## 0. Instruções para o Claude Code

- Implementa **fase a fase** (secção 10). Não passes à fase seguinte sem cumprir os critérios de aceitação da actual.
- **Não acrescentes dependências** além das listadas na secção 2 sem perguntar.
- Código, nomes de ficheiros e identificadores em **inglês**; textos da interface em **português**.
- Rede: **Devnet sempre**. Nunca uses mainnet nem chaves privadas no código.
- O utilizador assina todas as transacções na própria carteira. Nunca guardes nem peças chaves privadas.
- Constantes partilhadas entre programa e front-end (IDs de itens, preços, pontos) têm de ter **os mesmos valores** nos dois lados (secção 4.4).
- Depois de cada fase: `anchor build` (ou build no Playground), `pnpm build` e `pnpm lint` sem erros.
- Mantém o escopo. Se uma funcionalidade não estiver neste documento, não a cries.

---

## 1. Visão do sistema

SkillChain é um jogo de aprendizagem onde o jogador aprende Solana em três níveis. Cada nível termina com uma tarefa real na Devnet, executada pela instrução do programa que conclui o nível: **a própria transacção é a prova**. Concluir níveis dá pontos. Com os pontos, o jogador compra itens de avatar. O ranking é lido directamente das contas on-chain.

Componentes:

```
[Browser: Next.js + Wallet Adapter]
        │  lê contas (RPC)          │  envia transacções assinadas pela carteira
        ▼                           ▼
[Solana Devnet] ── Programa Anchor "skillchain"
                    ├─ Profile PDA (um por jogador)
                    └─ Note PDA (nível 3)
```

Não há backend nem base de dados no núcleo. O conteúdo das lições está em JSON no repositório.

---

## 2. Stack e dependências

- **Programa:** Rust + Anchor v1 (versão estável actual; não usar v2 alpha).
- **Front-end:** template oficial `web3js-next-tailwind-counter`:
  `pnpm create solana-dapp@latest -t gh:solana-foundation/templates/web3js/web3js-next-tailwind-counter`
  Inclui Next.js, React, Tailwind, @solana/web3.js, Wallet Adapter e @coral-xyz/anchor.
- **Carteira:** Phantom (modo Devnet).
- **Deploy:** Vercel (front-end), Devnet (programa).
- **Opcional, só na fase 6:** Metaplex (Umi + Core) para o certificado NFT.

### Fluxo de build do programa
- **Preferido:** Anchor local, dentro da pasta `anchor/` do template (`anchor build`, `anchor deploy --provider.cluster devnet`).
- **Alternativa, se o ambiente local falhar:** compilar e publicar no Solana Playground (beta.solpg.io). Depois copiar o código final para `anchor/programs/skillchain/src/lib.rs`, exportar o IDL para `src/idl/skillchain.json` e pôr o Program ID em `.env`.

---

## 3. Estrutura do repositório

Adapta à estrutura real do template; os nomes abaixo são a referência.

```
skillchain/
├─ anchor/
│  ├─ programs/skillchain/src/lib.rs     # programa
│  └─ tests/skillchain.test.ts           # testes do programa
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                        # landing + ligar carteira
│  │  ├─ learn/page.tsx                  # mapa dos níveis
│  │  ├─ learn/[level]/page.tsx          # leitor de lição + quiz + tarefa
│  │  ├─ profile/page.tsx                # avatar, nível, pontos, inventário
│  │  ├─ shop/page.tsx                   # loja
│  │  └─ leaderboard/page.tsx            # ranking
│  ├─ components/skillchain/
│  │  ├─ avatar.tsx                      # avatar em camadas
│  │  ├─ lesson-player.tsx               # passos + quiz
│  │  ├─ task-panel.tsx                  # tarefa on-chain do nível
│  │  ├─ tx-status.tsx                   # estado da transacção + link Explorer
│  │  └─ item-card.tsx
│  ├─ lib/skillchain/
│  │  ├─ program.ts                      # cliente Anchor, PDAs
│  │  ├─ hooks.ts                        # useProfile, useLeaderboard, mutations
│  │  ├─ constants.ts                    # espelho das constantes do programa
│  │  └─ errors.ts                       # mapa de erros → mensagens PT
│  ├─ content/
│  │  ├─ lessons.json                    # conteúdo dos 3 níveis
│  │  └─ items.json                      # catálogo visual dos itens
│  └─ idl/skillchain.json                # só no fluxo Playground
├─ public/items/                         # SVGs das molduras e acessórios
├─ .env.example
├─ README.md
└─ SDD.md
```

---

## 4. Programa on-chain (`skillchain`)

### 4.1 Contas

**Profile** — PDA, seeds `[b"profile", player.key()]`

- `owner: Pubkey` — carteira do jogador
- `level: u8` — último nível concluído (1 a 3)
- `points: u64` — pontos disponíveis
- `total_earned: u64` — pontos ganhos no total (ranking)
- `items: u8` — bitmask dos itens comprados (bit `id`)
- `equipped_frame: u8` — id da moldura equipada, `255` = nenhuma
- `equipped_accessory: u8` — id do acessório equipado, `255` = nenhum
- `equipped_title: u8` — id do título equipado, `255` = nenhum
- `bump: u8` — bump da PDA

Usar `#[derive(InitSpace)]`.

**Note** — PDA, seeds `[b"note", player.key()]`

- `owner: Pubkey` — autor
- `message: String` — mensagem do jogador, máx. 100 bytes (`#[max_len(100)]`)
- `created_at: i64` — `Clock::get()?.unix_timestamp`
- `bump: u8`

### 4.2 Instruções

**`init_profile()` — conclui o Nível 1**
- Contas: `player` (Signer, mut), `profile` (init, payer = player, PDA), `system_program`.
- Efeito: cria o perfil com `level = 1`, `points = 100`, `total_earned = 100`, `items = 0`, equipados = 255.
- Justificação pedagógica: criar uma conta exige SOL para o rent, por isso a transacção prova que o jogador obteve SOL de teste e sabe assinar.
- Só pode ser chamada uma vez (garantido pelo `init`).

**`complete_level_2()` — Transacções**
- Contas: `player` (Signer, mut), `profile` (mut, seeds, `has_one = owner` com owner = player), `recipient` (SystemAccount, mut), `system_program`.
- Pré-condições: `profile.level == 1`; `recipient != player`.
- Efeito: CPI `system_program::transfer` de `TRANSFER_LAMPORTS` (0,01 SOL = 10 000 000 lamports) do player para o recipient; `level = 2`; `points += 150`; `total_earned += 150`.

**`complete_level_3(message: String)` — Contas e PDAs**
- Contas: `player` (Signer, mut), `profile` (mut), `note` (init, payer = player, PDA), `system_program`.
- Pré-condições: `profile.level == 2`; `1 <= message.len() <= 100`.
- Efeito: cria a Note; `level = 3`; `points += 200`; `total_earned += 200`.

**`buy_item(item_id: u8)`**
- Contas: `player` (Signer), `profile` (mut).
- Pré-condições: `item_id` existe; item ainda não comprado; `profile.level >= required_level`; `profile.points >= price`.
- Efeito: `points -= price`; activa o bit `item_id` em `items`.

**`equip_item(item_id: u8)`**
- Contas: `player` (Signer), `profile` (mut).
- Pré-condições: o item existe e foi comprado.
- Efeito: escreve `item_id` no slot da categoria do item (frame, accessory ou title).
- Para desequipar: `unequip_item(slot: u8)` com slot 0 = frame, 1 = accessory, 2 = title; escreve `255`.

Todas as instruções que alteram o perfil verificam que `profile.owner == player`.

### 4.3 Erros

```
#[error_code]
pub enum SkillChainError {
    WrongLevel,          // "O nível anterior ainda não foi concluído."
    InvalidRecipient,    // "O destinatário não pode ser a tua própria carteira."
    MessageTooLong,      // "A mensagem tem de ter entre 1 e 100 caracteres."
    UnknownItem,         // "Este item não existe."
    AlreadyOwned,        // "Já tens este item."
    LevelTooLow,         // "Precisas de um nível mais alto para este item."
    NotEnoughPoints,     // "Não tens pontos suficientes."
    NotOwned,            // "Ainda não tens este item."
    Unauthorized,        // "Este perfil não te pertence."
}
```

O front-end mapeia cada código para a mensagem em português (`lib/skillchain/errors.ts`).

### 4.4 Constantes (iguais no programa e em `constants.ts`)

```
POINTS_LEVEL_1 = 100
POINTS_LEVEL_2 = 150
POINTS_LEVEL_3 = 200
TRANSFER_LAMPORTS = 10_000_000
NONE = 255

ITEMS (id, categoria, preço, nível mínimo):
0  frame      "Moldura Devnet"     100  1
1  frame      "Moldura Validador"  250  3
2  accessory  "Óculos Turbo"       150  2
3  title      "Mestre das PDAs"    200  3
```

Categorias: 0 = frame, 1 = accessory, 2 = title.
Total ganho possível: 450 pontos; o preço total dos itens é 700. O jogador tem de escolher, e isso é intencional.

### 4.5 Eventos (opcional, barato)

`LevelCompleted { player, level, points }` e `ItemBought { player, item_id }`, emitidos com `emit!`.

---

## 5. Front-end

### 5.1 Configuração

`.env.example`:
```
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID=<program id>
```

Cluster fixo em Devnet. Mostrar no cabeçalho um aviso "Devnet".

### 5.2 Camada de dados (`lib/skillchain`)

- `getProfilePda(player)`, `getNotePda(player)`.
- `useProfile()` — lê a conta Profile da carteira ligada; devolve `null` se não existir (jogador no nível 0). Revalida depois de cada transacção.
- `useLeaderboard()` — `program.account.profile.all()`; ordenar por `level` desc, depois `total_earned` desc; mostrar top 20.
- Mutations: `initProfile`, `completeLevel2(recipient)`, `completeLevel3(message)`, `buyItem(id)`, `equipItem(id)`, `unequipItem(slot)`.
- Cada mutation devolve a assinatura; o UI mostra o link `https://explorer.solana.com/tx/<sig>?cluster=devnet`.

### 5.3 Páginas

**`/` Landing:** título, frase de valor, botão de ligar carteira. Se o jogador não tem SOL de Devnet, mostrar um link para o faucet (`https://faucet.solana.com`). Botão "Começar" → `/learn`.

**`/learn` Mapa:** três cartões de nível com estado: bloqueado, disponível ou concluído (derivado de `profile.level`). Os pontos de cada nível aparecem no cartão.

**`/learn/[level]` Lição:**
1. `LessonPlayer` mostra os passos do `lessons.json`, um de cada vez, com botão "Seguinte".
2. O quiz final tem de ser respondido correctamente para desbloquear a tarefa. É só pedagógico e não é verificado on-chain.
3. `TaskPanel` mostra a tarefa do nível:
   - Nível 1: verificar saldo (aviso + link para o faucet se for 0), botão "Criar perfil" → `initProfile`.
   - Nível 2: campo de endereço do destinatário (validar com `new PublicKey()` e garantir que é diferente da carteira), resumo "Vais enviar 0,01 SOL para …", botão → `completeLevel2`.
   - Nível 3: campo de mensagem (contador até 100), botão → `completeLevel3`.
4. Depois do sucesso: ecrã de nível concluído, com pontos ganhos, link do Explorer e botão para o próximo nível.

**`/profile`:** avatar grande, nível, pontos disponíveis, total ganho, inventário (itens comprados) com botões equipar/desequipar, e a nota do nível 3 se existir.

**`/shop`:** grelha com os 4 itens: preço, nível mínimo e estado (comprado, disponível, bloqueado por nível, pontos insuficientes). Botão "Comprar" → `buyItem`.

**`/leaderboard`:** tabela com posição, carteira abreviada (`AbCd…WxYz`), nível, total ganho e avatar pequeno. A carteira ligada aparece destacada.

### 5.4 Avatar

Componente SVG em camadas, por esta ordem: base (personagem genérico original, gerado a partir da carteira com uma cor de fundo derivada do endereço) → acessório → moldura. O título aparece em texto por baixo do avatar. As imagens dos itens são SVGs simples e originais em `public/items/`.

### 5.5 Conteúdo — `lessons.json`

```json
[
  {
    "level": 1,
    "title": "Carteira",
    "steps": [
      { "type": "text", "title": "O que é uma carteira?", "body": "..." },
      { "type": "text", "title": "Chave pública e privada", "body": "..." },
      { "type": "text", "title": "SOL de teste na Devnet", "body": "..." }
    ],
    "quiz": [
      {
        "question": "Qual destas nunca deves partilhar?",
        "options": ["Chave pública", "Chave privada", "Endereço"],
        "answer": 1,
        "explanation": "..."
      }
    ],
    "task": { "type": "init_profile", "description": "Cria o teu perfil on-chain." }
  }
]
```

Conteúdo mínimo: 3 a 5 passos e 2 perguntas por nível. Temas:
- Nível 1: carteiras, chaves, SOL, Devnet e faucet.
- Nível 2: transacções, assinaturas, taxas, lamports e o Explorer.
- Nível 3: contas, rent, programas e PDAs.

### 5.6 UX de transacções

Estados: inactivo → a aguardar assinatura → a confirmar → confirmado / erro. Desactivar os botões durante o envio. Erros da carteira ("User rejected") mostram "Transacção cancelada". Os erros do programa usam o mapa da secção 4.3.

### 5.7 Estilo

Interface limpa e escura, mobile-first, com Tailwind. Nenhum logótipo, personagem ou marca de terceiros nos gráficos.

---

## 6. Fluxo completo (caminho feliz)

1. Ligar a Phantom em Devnet e obter SOL no faucet.
2. Nível 1: ler, responder ao quiz, "Criar perfil" → perfil criado com 100 pontos.
3. Nível 2: enviar 0,01 SOL para um endereço → 250 pontos.
4. Nível 3: criar a nota → 450 pontos.
5. Loja: comprar a Moldura Devnet (100) e o título Mestre das PDAs (200) → 150 pontos restantes.
6. Perfil: equipar os dois itens; o avatar actualiza-se.
7. Ranking: o jogador aparece com nível 3.

---

## 7. Testes do programa (`anchor/tests/skillchain.test.ts`)

Casos obrigatórios:
- `init_profile` cria o perfil com os valores certos; uma segunda chamada falha.
- `complete_level_2` falha antes do nível 1, falha com recipient = player, e transfere exactamente 0,01 SOL no caso válido.
- `complete_level_3` falha com nível errado, falha com mensagem vazia ou com mais de 100 bytes, e cria a Note no caso válido.
- `buy_item` falha com item desconhecido, nível baixo, pontos insuficientes ou item já comprado; no caso válido desconta os pontos e activa o bit.
- `equip_item` falha com item não comprado e escreve no slot certo no caso válido.
- Outra carteira não consegue alterar um perfil que não é seu.

---

## 8. Segurança

- Todas as instruções exigem `Signer` e validam a PDA com `seeds` + `bump`.
- Aritmética com `checked_add` / `checked_sub`.
- Sem autoridade administrativa no MVP: ninguém pode atribuir pontos fora das instruções.
- Limitação conhecida, a declarar no README: o quiz é verificado só no front-end. A prova de cada nível é a tarefa on-chain.

---

## 9. Fora do escopo

Backend, base de dados, registo por e-mail, temporadas, torneios, duelos, missões, raridades, marketplace, trocas e outras disciplinas.

---

## 10. Plano de implementação

**Fase 1 — Base (sexta à noite)**
- Criar o projecto a partir do template; remover o exemplo counter.
- Programa com `Profile` + `init_profile`, publicado na Devnet.
- Página `/learn/1` mínima que cria o perfil e mostra os pontos.
- Aceitação: perfil criado a partir do browser e visível no Explorer.

**Fase 2 — Os três níveis (sábado de manhã)**
- `complete_level_2`, `complete_level_3`, erros e constantes.
- `lessons.json` completo, `LessonPlayer`, `TaskPanel`, `TxStatus`, `/learn`.
- Aceitação: o caminho feliz dos passos 1 a 4 funciona na Devnet.

**Fase 3 — Loja e avatar (sábado à tarde)**
- `buy_item`, `equip_item`, `unequip_item`.
- `/shop`, `/profile`, componente `Avatar`, SVGs dos itens.
- Aceitação: os passos 5 e 6 funcionam.

**Fase 4 — Ranking e testes (sábado à tarde e noite)**
- `/leaderboard`.
- Testes da secção 7 a passar.
- Aceitação: ranking com pelo menos 2 carteiras de teste; testes verdes.

**Fase 5 — Entrega (domingo)**
- Deploy na Vercel, README (instalação, arquitectura, Program ID, limitações), vídeo de 2 minutos, submissão no Devpost.

**Fase 6 — Opcional: certificado NFT**
- Script Node em `scripts/mint-certificate.ts` (Metaplex Umi + Core): lê o perfil, confirma `level == 3` e emite um NFT de certificado intransferível para a carteira. Confirmar na documentação do Metaplex Core o plugin que impede a transferência.
- Só começar se as fases 1 a 5 estiverem estáveis.

---

## 11. Responsáveis

- **Freddy:** programa Anchor (secção 4), deploy na Devnet, integração e revisão.
- **Mauro da Silva:** testes (secção 7), `lessons.json` (secção 5.5), README e Devpost, fase 6.
- **Claude Code:** front-end (secção 5), sob revisão do Freddy.
