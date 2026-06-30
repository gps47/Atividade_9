# Atividade_9

# 🦖 DINO STRIKE

Nome: Gabriel Pereira Soares 3º periodo

Jogo de "Acerte a Toupeira" com tema de contenção de dinossauros (Jurassic Park + Dino Crisis).

## Mecânica e Tema

**Mecânica:** Acerte a Toupeira. **Tema:** dinossauros escapando de cercados — em vez de toupeiras em buracos, são dinos em cercados que o jogador precisa "tranquilizar" (clicar) antes que fujam.

## Briefing do Cliente

**Público-alvo:** gamers. Por isso: velocidade alta, punição real por erro, dificuldade crescente e um evento de pico (Ataque de T-Rex) para testar reflexo.

## Regras do Jogo

- Jogador digita o nome e aperta "Iniciar Protocolo".
- Dinossauros aparecem aleatoriamente numa grade 4×4; clicar a tempo dá pontos, deixar fugir custa vidas.
- 3 vidas ("contenções"). Partida também termina aos 60 segundos.
- 3 fases de dificuldade crescente (Controlado → Alerta Laranja → Contenção Crítica).

**Restrições desta versão:** grid 4×4, 3 tipos de dino com risco/pontuação diferentes, combo multiplicador, partida de 60s em 3 fases, evento especial de pico de dificuldade.

| Espécime         | Velocidade | Pontos | Fugas que custa |
| 🦕 Braquiossauro | Lento      | +10    | 1              |
| 🦖 Raptor        | Rápido     | +20    | 1              |
| 🐊 T-Rex         | Perigoso   | +50    | 2              |

## Meu Diferencial

**Ataque de T-Rex:** evento que acontece nos segundos finais das fases 1 e 2. O spawn normal pausa, aparece um aviso na tela e depois só T-Rexes aparecem, em ritmo acelerado e sem limite de quantidade na tela.

No código: `verificarAtaqueRex()` é chamada a cada segundo e calcula quanto falta para a fase acabar. Faltando 5 segundos, chama `iniciarAtaqueRex()`, que pausa o spawn normal, mostra o aviso e passa a chamar `aparecerDinoTipo('trex')` repetidamente — uma versão do spawn que força o tipo em vez de sortear.

## Como Jogar

1. Digite seu nome e aperte "▶ Iniciar Protocolo".
2. Aguarde a contagem regressiva.
3. Clique nos dinos antes que fujam.
4. Sobreviva até o tempo acabar ou até perder as 3 vidas.
5. No fim: jogar novamente ou voltar ao menu. Durante a partida dá pra abandonar pelo botão "✕ ABANDONAR".

## Como Executar

Sem instalação. Abra o `index.html` em qualquer navegador, ou acesse: https://atividade-9-five-zeta.vercel.app/

## Minhas Decisões

1. Grid 4×4 — exige atenção distribuída sem ficar impossível, e cabe bem no celular.
2. 3 tipos de dino, cada um com cor própria além da imagem, reforçando a diferenciação.
3. Pontuação: cada dino vale pontos diferentes (10/20/50), multiplicados pelo combo atual (1x a 3x). Errar zera o combo — recompensa consistência, valorizada por gamers.
4. Tempo: 60s totais, em 3 fases de 20s, cada uma com seu ritmo de spawn.
5. Dificuldade: progressiva nas 3 fases + evento de Ataque de T-Rex como pico extra antes da transição.
6. Término: vidas zeradas ou tempo esgotado, o que vier primeiro.

## Reflexão

1. Bug mais chato: conflito entre o spawn normal e o Ataque de T-Rex — os dois rodavam juntos e apareciam dinos comuns no meio do ataque. Resolvi separando os fluxos: o spawn normal é cancelado antes do ataque começar e só retoma depois que ele termina, com uma flag (`ataqueRexAtivo`) garantindo que nunca rodem ao mesmo tempo.

2. Por que essa fórmula de pontuação: porque gamers valorizam consistência, não sorte. Pontos variam pelo risco do dino e o combo multiplica quem mantém sequência de acertos — cria tensão entre jogar seguro ou arriscar continuar.

3. Como o briefing mudou as decisões: quase tudo veio da lente "gamer" — tempo curto de exposição, punição dura, dificuldade crescente rápida e o Ataque de T-Rex, que não estava nas instruções originais e foi criado para dar um desafio extra que um público casual não pediria.

4. Com mais uma semana: adicionaria mais tipos de dinossauro e mais fases, criando uma progressão mais longa em vez de mostrar tudo desde o início.

5. Função que ficou boa: `aparecerDino()` — verifica o limite de dinos simultâneos da fase, sorteia cercado e tipo, cria a imagem do dino e agenda o `setTimeout` que registra a fuga automática. Pequena, mas reúne sorteio, DOM e tempo de um jeito fácil de entender.

## Declaração de uso de IA

Usei IA (Claude, Anthropic) para estruturar o código em funções com responsabilidade única, criar os estilos CSS a partir de uma imagem que escolhi, implementar o Ataque de T-Rex a partir da ideia que descrevi, e resolver o bug de conflito entre spawns.

Aprendi a organizar o jogo em estados e funções separadas, a usar `localStorage` para persistir dados, e a lidar com múltiplos timers rodando ao mesmo tempo sem conflito. Entendo e sei explicar todas as partes do código entregue.

## Créditos

- Imagens dos dinossauros: banco de imagens de uso livre, ajustadas para o jogo.
- Wallpaper de fundo: imagem encontrada na internet.
- Fontes: Orbitron e Share Tech Mono (Google Fonts).
- Estrutura, estilos e mecânica do Ataque de T-Rex desenvolvidos com apoio de IA, conforme declarado acima.

## Bônus

1. Mecânica original: Ataque de T-Rex (ver "Meu Diferencial").
2. Ranking: top 10 salvo no `localStorage`, por maior pontuação. Tela inicial mostra o top 5 (`salvarRanking`, `carregarRanking`, `renderizarRanking` no `script.js`).
3. Responsivo: uso de `clamp()`, `grid` para jogar no celular.

## Links

- Repositório: https://github.com/gps47/Atividade_9
- Projeto publicado: https://vercel.com/gps35-4703s-projects/atividade-9


Link do site: 
https://atividade-9-five-zeta.vercel.app/
