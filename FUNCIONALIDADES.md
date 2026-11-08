# SkillChain: funcionalidades e como funcionam

Estado em 8 de Novembro de 2026 · Solana Hackathon (MLH) · Rede: Devnet · Branch `main` do repositório `afonsoPanzo/SkillChain`

Este documento explica tudo o que foi construído, como funciona por dentro, o que é preciso configurar, o que foi confirmado manualmente e as limitações conhecidas. A especificação continua a ser o [SDD.md](SDD.md) e o histórico das primeiras fases está em [PROGRESSO.md](PROGRESSO.md).

## 1. Em resumo

SkillChain ensina Solana a jogar. São três níveis (carteira, transacções, contas e PDAs) e cada um termina com uma transacção real na Devnet, que é a prova de que o nível foi concluído. Os pontos compram itens para o avatar e o ranking é lido das contas on-chain.

Por cima desse núcleo foram juntadas oito funcionalidades, cada uma desenvolvida num branch próprio e juntada ao `main` só depois de testada:

| # | Funcionalidade | Para quê |
| --- | --- | --- |
| 1 | Inglês e português | A app abre em inglês e tem um botão EN/PT |
| 2 | Modo demo | Um jurado sem carteira nem SOL experimenta tudo |
| 3 | Perfil público `/u/[endereço]` | Qualquer pessoa verifica as conquistas de um jogador na blockchain |
| 4 | Tutor de IA | Explica a transacção real do jogador em linguagem simples |
| 5 | Chat com o tutor | Perguntas de seguimento, com limites |
| 6 | Blink «Challenge a friend» | Um cartão interactivo que cria o perfil sem abrir o site |
| 7 | Nome no desafio | Nome opcional no link do desafio |
| 8 | Speedrun e duelos | Quem completa os 3 níveis mais depressa, verificado on-chain |

O programa on-chain (`anchor/programs/skillchain/src/lib.rs`), o Program ID, o IDL e as contas nunca foram alterados. Tudo o que está abaixo é front-end e rotas de servidor.

## 2. Funcionalidades

### 2.1 Inglês e português

- O inglês é a língua por defeito. O botão EN/PT está no cabeçalho de todos os ecrãs, a escolha fica em `localStorage` e o `<html lang>` acompanha-a.
- Os textos vivem em `src/i18n/en.ts` e `pt.ts`. O TypeScript obriga a que as duas línguas tenham as mesmas chaves, e um teste confirma que usam os mesmos marcadores `{n}`. As lições estão em `src/content/lessons.en.json` e `lessons.pt.json`, com a mesma estrutura.
- Os números seguem a língua (`0.5 SOL` em inglês, `0,5 SOL` em português).
- Limitação: o texto do botão e do modal da carteira vem da biblioteca do Wallet Adapter e fica sempre em inglês.

### 2.2 Modo demo

- Na landing, o botão «Try without a wallet» activa o backend simulado com um jogador novo no nível 0 e o ranking simulado.
- Uma faixa vermelha no topo avisa «Demo mode — simulated data, nothing is on-chain». O botão «Use a real wallet» sai do modo e apaga os dados simulados.
- O estado fica em `sessionStorage`, por isso sobrevive a recarregamentos mas não a uma nova sessão. Ligar uma carteira real durante a demo sai automaticamente do modo demo, e os dois modos nunca se misturam.
- Onde haveria um link do Explorer, aparece uma nota a dizer que com uma carteira real ali aparece a transacção verdadeira.
- Por dentro: um `backend` que escolhe, a cada chamada, entre o mock e o programa real (`switching-backend.ts`), e um hook `useAccount` que devolve a carteira real ou o jogador simulado. `NEXT_PUBLIC_USE_MOCK=true` continua a forçar o mock para desenvolvimento.

### 2.3 Perfil público `/u/[endereço]`

- Lê da Devnet o perfil (PDA `["profile", carteira]`) e a nota (PDA `["note", carteira]`) sem precisar de carteira ligada.
- Mostra o avatar com os itens equipados, o endereço com botão de copiar, o nível, os pontos totais ganhos, os itens, a nota do nível 3 e a posição no ranking.
- A secção «Verified on Solana» liga ao Explorer para a conta do perfil, a da nota e o programa, e explica que estes dados vivem na blockchain e não num servidor do SkillChain.
- Estados: endereço inválido, carteira sem perfil (com botão para começar) e erro de RPC (com botão para tentar de novo).
- No `/profile` há «Share my profile» (copia o link) e «Share on X». Cada linha do ranking liga ao perfil desse jogador. As páginas têm metadados Open Graph e uma imagem de pré-visualização gerada (`opengraph-image.tsx`).

### 2.4 Tutor de IA

- Depois de concluir um nível, «Explain my transaction» pede a `POST /api/tutor` uma explicação de 4 a 6 frases.
- O servidor vai buscar a transacção à Devnet, confirma que chama o programa SkillChain e reduz-na a factos verificados: sucesso, taxa, assinante, contas com o papel de cada uma, variações de saldo, a instrução (identificada pelo discriminator do IDL), o evento `LevelCompleted` e as linhas de log relevantes. Só esses factos vão ao Gemini (`@google/genai`, modelo por defeito `gemini-3.5-flash-lite`).
- Se a IA falhar, demorar mais de 10 segundos ou a quota esgotar, a resposta é uma explicação por template feita com os mesmos factos, marcada como tal no ecrã. Sem `GEMINI_API_KEY`, o tutor responde sempre com o template.
- A nota que o jogador escreve no nível 3 é texto livre. O sistema diz ao modelo para a tratar só como dado a citar, nunca como instrução.
- Protecções: cache por assinatura e língua, 10 pedidos por IP em 5 minutos, corpo máximo de 1 KB, e a chave só existe no servidor.
- Funciona também nos níveis já concluídos: `POST /api/tutor/find` procura na Devnet a transacção que completou o nível (conta do perfil nos níveis 1 e 2, conta da nota no nível 3) e só devolve uma que o programa reconheça e que o jogador tenha assinado.
- No modo demo mostra um exemplo fixo, sem chamar o servidor.

### 2.5 Chat com o tutor

- Por baixo da explicação há o campo «Ask the tutor», com 3 perguntas sugeridas por nível, em EN e PT.
- `POST /api/tutor/ask` responde em 2 a 4 frases, só sobre Solana, blockchain e a transacção. Recebe os factos da transacção, a lição do nível e no máximo as 2 perguntas e respostas anteriores. Recusa com educação o que não for do tema.
- Limites: 3 perguntas por transacção (contadas no cliente e no servidor), 300 caracteres por pergunta e o mesmo limite por IP.
- Se a IA falhar aparece «The tutor is unavailable right now» e as perguntas sugeridas passam a ter respostas pré-escritas. No modo demo as sugeridas têm respostas fixas e o campo livre fica desactivado.

### 2.6 Blink «Challenge a friend»

- É uma Solana Action na Devnet (`X-Blockchain-Ids: solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1`). O `GET /api/actions/challenge` devolve o cartão, o `POST` devolve a transacção `init_profile` sem assinar (fee payer = a conta da pessoa, blockhash recente) ou um erro amigável se a conta já tem perfil, e `OPTIONS` e `/actions.json` levam os headers CORS da especificação.
- O cartão usa o texto do desafio, por exemplo «Maria (GSyT…1uY6) finished SkillChain in 6m 42s — can you beat it?». Depois de aceitar, um passo seguinte («Open the challenge») leva a pessoa à página do desafio.
- O `actions.json` mapeia `/challenge/*` para `/api/actions/challenge/*`. O código está em `src/lib/blink/`.
- Os botões «Challenge a friend» estão no `/profile`, no ecrã final do nível 3 e no `/u/[endereço]`.

### 2.7 Nome no desafio

- Um campo opcional no botão «Challenge a friend» (até 20 caracteres, lembrado no `localStorage`). O nome viaja no link (`?name=`) e aparece junto ao endereço abreviado no cartão do Blink, na página do desafio e no texto de partilha.
- O nome vive só no link, sem base de dados. Como qualquer pessoa pode fabricar um link, o servidor limpa-o (só letras, números, espaços, `_`, `'` e `-`, sem pontos nem barras) e mostra sempre o endereço ao lado.

### 2.8 Speedrun e duelos

- «Challenge a friend» partilha `/challenge/<endereço>`. O tempo de uma carteira vem só da blockchain:
  - início = `blockTime` da transacção `InitProfile` mais antiga na conta do perfil, confirmada pelos logs do programa (uma transferência avulsa para o PDA não conta);
  - fim = `created_at` da conta Note;
  - tempo = fim − início. Sem nota, o jogador está «in progress» e mostra-se o nível.
- `/challenge/[from]` mostra o tempo de quem desafia e deixa aceitar: liga a carteira, ou vai para o nível 1 se não houver perfil, ou mostra logo o duelo.
- `/challenge/[from]/[to]` põe os dois jogadores lado a lado, mostra o vencedor quando os dois terminam e liga ao Explorer para as transacções de início e de fim de cada um.
- No ranking há um separador «Speedrun» com os 10 tempos mais rápidos de quem terminou os 3 níveis.
- O formato do tempo é «6m 42s» ou «1h 03m». O cálculo está isolado em `src/lib/speedrun/run.ts`. No modo demo há tempos simulados.

## 3. Rotas

| Rota | O que é |
| --- | --- |
| `/`, `/learn`, `/learn/[nível]`, `/shop`, `/profile`, `/leaderboard` | O jogo |
| `/u/[endereço]` | Perfil público |
| `/challenge`, `/challenge/[from]`, `/challenge/[from]/[to]` | Desafio, aceitar e duelo |
| `POST /api/tutor`, `/api/tutor/ask`, `/api/tutor/find` | Tutor de IA |
| `/api/actions/challenge`, `/api/actions/challenge/[from]`, `/api/actions/challenge/open` | Blink |
| `/actions.json` | Regras das Solana Actions |

## 4. Configuração

Variáveis de ambiente (o `.env.example` tem a lista, sem valores):

| Variável | Para quê | Onde |
| --- | --- | --- |
| `NEXT_PUBLIC_SOLANA_RPC` | RPC da Devnet | Browser e servidor |
| `NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID` | Program ID do programa na Devnet | Browser e servidor |
| `NEXT_PUBLIC_USE_MOCK` | `true` força os dados simulados (desenvolvimento) | Browser |
| `GEMINI_API_KEY` | Chave do Gemini | **Só servidor**, nunca com `NEXT_PUBLIC_` |
| `GEMINI_MODEL` | Modelo (opcional) | Só servidor |
| `NEXT_PUBLIC_SITE_URL` | URL de produção para os metadados Open Graph | Só em Production |

Na Vercel, `GEMINI_API_KEY` e `GEMINI_MODEL` têm de estar nos ambientes Preview e Production. Sem a chave nada parte: o tutor passa a responder com o template.

Comandos: `pnpm dev`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm exec vitest run`, `pnpm build`.

## 5. Qualidade

- Cada funcionalidade passou por `pnpm lint`, `tsc --noEmit`, os testes e `pnpm build` antes de ser juntada.
- Há 119 testes em 11 ficheiros (`tests/`). Cobrem o codec Borsh, a paridade EN/PT, o modo demo, a validação de endereços, a extracção de factos de transacções reais da Devnet guardadas como fixtures, o fallback do tutor, os limites do chat, as respostas do Blink, o cálculo do tempo, o vencedor do duelo e a ordenação do speedrun.
- As rotas de servidor foram também corridas contra a Devnet real. Por exemplo, o cartão do Blink calculou o tempo da carteira de teste e a transacção do Blink foi simulada na Devnet até ao ponto de criar a conta.
- Nenhum commit leva `Co-Authored-By`.

## 6. O que foi confirmado manualmente

Estes pontos não podem ser provados por testes automáticos, porque dependem de serviços externos e da interface. Foram verificados à mão pelo autor do projecto na pré-visualização da Vercel, com a chave do Gemini configurada. Os testes automáticos simulam o modelo e o cliente de Blinks, por isso a confirmação abaixo é o que os completa.

| Verificação | Resultado |
| --- | --- |
| Abrir o Blink em `dial.to/devnet`, aceitar com uma carteira nova e ver o perfil criado | Correu bem. O cartão carregou, a transacção `init_profile` foi assinada e o perfil apareceu criado |
| Perguntar ao tutor algo fora do tema (por exemplo, futebol) | O tutor recusou |
| Ver a página do duelo no telemóvel | Correu bem |

Isto confirma na prática o link de teste do botão `https://dial.to/devnet?action=solana-action:<URL da action>` e os headers da action (`X-Blockchain-Ids: solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1`, `X-Action-Version: 2.4`).

Não ficou registado neste documento se o Blink foi também testado no X ou se a action foi registada na Dialect. O inspector `dial.to/devnet` é o caminho confirmado para a demonstração.

## 7. Limitações conhecidas

- Os limites por IP, a cache do tutor e o contador de 3 perguntas vivem na memória de cada instância do servidor. Na Vercel isto chega para o hackathon, mas não é um limite global.
- O separador Speedrun mede no máximo 30 jogadores e lê várias contas da Devnet, pelo que a primeira visita pode demorar uns segundos.
- Os nomes do desafio não são guardados em lado nenhum nem verificados: servem para dar cara ao link e vêm sempre acompanhados do endereço.
- O repositório do Mauro (`Jakendry11/SkillChain`) não foi actualizado com estas funcionalidades.

## 8. Mapa do código

```
src/
  app/                 páginas e rotas (App Router)
    api/tutor/         tutor de IA (explicar, perguntar, procurar assinatura)
    api/actions/       Blink (cartão, transacção, passo seguinte)
    challenge/         desafio, aceitar e duelo
    u/[address]/       perfil público
  components/skillchain/  ecrãs e componentes
  i18n/                dicionários EN e PT, hook useT
  lib/
    skillchain/        backend real e simulado, codec Borsh, hooks, modo demo
    tutor/             factos, template, Gemini, limites, cache
    blink/             cabeçalhos, handlers e transacção do Blink
    speedrun/          cálculo do tempo e leitura on-chain do início e do fim
  content/             lições em EN e PT
tests/                 testes e fixtures de transacções reais
```
