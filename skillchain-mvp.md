# SkillChain — MVP executável

Versão 2.0 · Solana Hackathon (MLH), 6 a 8 de Novembro de 2026 · Rede: Solana Devnet

## 1. A ideia numa frase

SkillChain é um jogo de aprendizagem onde o jogador aprende Solana a jogar: cada nível termina com uma tarefa real na blockchain, e é essa transacção que prova que o nível foi concluído.

Ao concluir níveis, o jogador ganha pontos. Com os pontos compra itens para personalizar o avatar. O nível nunca se perde, mesmo depois de gastar todos os pontos.

## 2. Porque a Solana é essencial, e não decoração

- A conclusão de cada nível é verificada pelo programa on-chain. Não há servidor a decidir se o jogador passou.
- Nível, pontos e inventário vivem na conta on-chain do jogador. Os pontos são intransferíveis por natureza, porque são um campo do perfil e não um token.
- O ranking é lido directamente dos perfis on-chain: é público, transparente e verificável.
- O jogador usa a própria carteira para tudo e assina cada acção.

## 3. O que entra no MVP

**Login:** só a carteira (Phantom em Devnet). Não há registo nem e-mail.

**Um percurso, três níveis — "Aprende Solana":**
- Nível 1 · Carteira: o que é uma carteira, chaves e SOL. Tarefa: obter SOL de teste no faucet e criar o perfil on-chain (criar a conta exige SOL, por isso a transacção prova o nível). Recompensa: 100 pontos.
- Nível 2 · Transacções: o que é uma transacção, taxas e assinatura. Tarefa: enviar 0,01 SOL. A transferência é feita pela própria instrução do programa, que conclui o nível. Recompensa: 150 pontos.
- Nível 3 · Contas: contas, PDAs e rent. Tarefa: criar uma "nota" on-chain com uma mensagem à escolha. Recompensa: 200 pontos.

Cada nível tem 3 a 5 ecrãs curtos e interactivos e um mini-quiz. O quiz é pedagógico e corre no front-end; o que desbloqueia o nível é a tarefa on-chain.

**Loja e avatar:**
- 4 itens: 2 molduras, 1 acessório e 1 título, com preços entre 100 e 250 pontos.
- Comprar um item desconta os pontos e regista-o no inventário on-chain.
- O jogador equipa um item, e o avatar é montado em camadas no front-end.

**Ranking:** uma lista de jogadores ordenada por nível e, depois, por pontos totais ganhos.

**Certificado NFT (só se houver tempo):** ao concluir o nível 3, o jogador recebe um NFT de certificado intransferível na carteira. Fica isolado do resto: se não ficar pronto, o demo funciona na mesma.

## 4. O que fica fora (visão futura, só para o pitch)

Outras disciplinas, temporadas, torneios, duelos, missões diárias, raridades, marketplace e trocas, amigos e comunidade, registo por e-mail e base de dados.

## 5. Stack

- **Programa on-chain:** Anchor v1 (Rust), desenvolvido e publicado no Solana Playground (beta.solpg.io), na Devnet.
- **Front-end:** Next.js + React + Tailwind, a partir do template oficial `web3js-next-tailwind-counter` (create-solana-dapp), com Wallet Adapter e @solana/web3.js. Deploy na Vercel.
- **Backend:** nenhum no núcleo. Só um script Node para o certificado NFT, se entrar.
- **Base de dados:** nenhuma. O estado está na blockchain e o conteúdo das lições em ficheiros JSON no repositório.
- **Código:** GitHub.

## 6. O programa on-chain

Conta de perfil (PDA por jogador, seeds `["profile", carteira]`):
- owner — carteira do jogador
- level — último nível concluído (0 a 3)
- points — pontos disponíveis
- total_earned — pontos ganhos no total, para o ranking
- items — itens comprados (bitmask)
- equipped — item equipado

Instruções:
- `init_profile` — cria o perfil e conclui o nível 1
- `complete_level_2` — transfere 0,01 SOL via CPI e atribui os pontos
- `complete_level_3(mensagem)` — cria a PDA da nota e atribui os pontos
- `buy_item(id)` — verifica o nível e os pontos, desconta e regista o item
- `equip_item(id)` — só para itens que o jogador tem

Regras: cada nível exige o anterior e só pode ser concluído uma vez.

## 7. Divisão de tarefas

**Freddy — programa on-chain e integração**
- Escrever e publicar o programa Anchor na Devnet
- Ligar o front-end ao programa através do IDL
- Rever o código e decidir o que entra e o que sai

**Mauro da Silva — testes, dados e certificado**
- Testes em TypeScript de cada instrução do programa
- Conteúdo das lições e quizzes em JSON
- Script Node do certificado NFT (fase final)
- README e texto do Devpost

**Claude — front-end**
- Ecrãs das lições, quizzes e tarefas
- Perfil com nível e pontos, loja, avatar em camadas e ranking
- Ligação da carteira e mensagens de transacção claras

## 8. Calendário

- **Sexta à noite:** template a correr localmente; programa com `init_profile` publicado na Devnet; primeira chamada feita a partir do front.
- **Sábado de manhã:** os três níveis de ponta a ponta.
- **Sábado à tarde:** loja, avatar e ranking.
- **Sábado à noite:** certificado NFT, se tudo o resto estiver estável.
- **Domingo:** polimento, deploy na Vercel, vídeo do demo, README e submissão no Devpost.

Regra de ouro: não se começa uma funcionalidade nova antes de a anterior funcionar na Devnet.

## 9. Demo (2 minutos)

Ligar a carteira, concluir o nível 2 com uma transferência real e mostrá-la no Solana Explorer. Depois comprar e equipar uma moldura, e terminar no ranking. Fecho: o slide da visão futura.
