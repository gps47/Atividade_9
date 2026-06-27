// =============================================================
// DINO STRIKE — script.js
// Jogo: Acerte a Toupeira com tema Jurassic Park / Dino Crisis
// Público-alvo: gamers — velocidade alta, punição real, combo system
// =============================================================


// =============================================================
// SEÇÃO 1 — CONFIGURAÇÃO DO JOGO
// Centralizo todos os valores numéricos aqui para facilitar
// ajustes de balanceamento sem caçar números espalhados no código
// =============================================================

const CONFIG = {
  linhas: 4,
  colunas: 4,
  totalVidas: 3,
  duracaoPartida: 60,

  fases: [
    {
      nome: 'CONTROLADO',
      classe: 'controlado',
      duracaoFase: 20,
      intervaloSpawn: 1400,
      tempoDino: { raptor: 1600, braquio: 2400, trex: 1500 },
      chanceTrex: 0.08,
      maxSimultaneos: 2,
    },
    {
      nome: 'ALERTA LARANJA',
      classe: 'alerta',
      duracaoFase: 20,
      intervaloSpawn: 1000,
      tempoDino: { raptor: 1100, braquio: 1700, trex: 1700 },
      chanceTrex: 0.15,
      maxSimultaneos: 3,
    },
    {
      nome: 'CONTENÇÃO CRÍTICA',
      classe: 'critico',
      duracaoFase: 20,
      intervaloSpawn: 700,
      tempoDino: { raptor: 800, braquio: 1200, trex: 1300 },
      chanceTrex: 0.22,
      maxSimultaneos: 4,
    },
  ],

  pontos: {
    raptor:  20,
    braquio: 10,
    trex:    50,
  },

  nivelCombo: {
    2: 1.5,
    5: 2,
    10: 3,
  },

  // Imagens reais dos dinos — uso dataset no cercado para saber qual carregar
  imagens: {
    raptor:  'images/raptor.png',
    braquio: 'images/braquio.png',
    trex:    'images/rex.png',
  },

  // Emoji de fuga — mantém o emoji só para o estado de "fugiu"
  emojiFuga: '💨',

  fugasTrex: 2,
};

// Mensagens que aparecem na contagem regressiva — cada uma tem um clima diferente
// Uso um array para poder trocar facilmente se quiser variar o texto
const MENSAGENS_CONTAGEM = [
  'Os dinossauros estão atacando.\nNos proteja, operador.',
  'Brecha detectada no setor 4.\nPrepare-se para conter.',
  'Espécimes em fuga.\nSistema de tranquilização online.',
];


// =============================================================
// SEÇÃO 2 — ESTADO DO JOGO
// =============================================================

let estado = {
  nomeJogador: '',
  pontos: 0,
  vidas: CONFIG.totalVidas,
  acertos: 0,
  fugas: 0,
  comboAtual: 0,
  melhorCombo: 0,
  faseAtual: 0,
  tempoRestante: CONFIG.duracaoPartida,
  jogoRodando: false,
  intervaloClock: null,
  intervaloSpawn: null,
  ataqueRexAtivo: false,       // flag para saber se o evento especial está rolando
  timeoutAtaqueRex: null,      // guardo o timeout do evento para poder cancelar
};


// =============================================================
// SEÇÃO 3 — REFERÊNCIAS AO DOM
// =============================================================

const dom = {
  telaInicial:   document.getElementById('tela-inicial'),
  telaContagem:  document.getElementById('tela-contagem'),
  telaJogo:      document.getElementById('tela-jogo'),
  telaFim:       document.getElementById('tela-fim'),

  inputNome:    document.getElementById('input-nome'),
  btnJogar:     document.getElementById('btn-jogar'),
  listaRanking: document.getElementById('lista-ranking'),

  contagemAviso:  document.getElementById('contagem-aviso'),
  contagemNumero: document.getElementById('contagem-numero'),

  hudNome:       document.getElementById('hud-nome'),
  hudFase:       document.getElementById('hud-fase'),
  hudPontos:     document.getElementById('hud-pontos'),
  hudCombo:      document.getElementById('hud-combo'),
  hudTempo:      document.getElementById('hud-tempo'),
  hudIconesVida: document.getElementById('hud-icones-vida'),
  notifCombo:    document.getElementById('notif-combo'),

  grid:       document.getElementById('grid-cercados'),
  barraTempo: document.getElementById('barra-tempo'),
  overlayTrex: document.getElementById('overlay-trex'),

  btnCancelar: document.getElementById('btn-cancelar'),

  finStatus:  document.getElementById('fim-status'),
  finNome:    document.getElementById('fim-nome'),
  finPontos:  document.getElementById('fim-pontos'),
  finAcertos: document.getElementById('fim-acertos'),
  finFugas:   document.getElementById('fim-fugas'),
  finCombo:   document.getElementById('fim-combo'),
  finPosicao: document.getElementById('fim-posicao-ranking'),

  btnJogarNovamente: document.getElementById('btn-jogar-novamente'),
  btnMenu:           document.getElementById('btn-menu'),
};


// =============================================================
// SEÇÃO 4 — CONTROLE DE TELAS
// =============================================================

function mostrarTela(tela) {
  [dom.telaInicial, dom.telaContagem, dom.telaJogo, dom.telaFim]
    .forEach(t => t.classList.remove('ativa'));
  tela.classList.add('ativa');
}


// =============================================================
// SEÇÃO 5 — CONTAGEM REGRESSIVA
// Mostro uma sequência: mensagem de aviso → 3 → 2 → 1 → VÁ!
// Uso Promise + setTimeout para encadear cada etapa de forma limpa
// =============================================================

function executarContagem() {
  return new Promise((resolver) => {
    mostrarTela(dom.telaContagem);

    // Escolho uma mensagem aleatória a cada partida
    const msgIndex = Math.floor(Math.random() * MENSAGENS_CONTAGEM.length);
    dom.contagemAviso.textContent = MENSAGENS_CONTAGEM[msgIndex];
    dom.contagemNumero.textContent = '';
    dom.contagemAviso.style.opacity = '1';

    // Sequência: mensagem por 1.2s, depois 3, 2, 1, VÁ!
    const passos = [
      { delay: 1200, numero: '3', classe: 'contagem-numero' },
      { delay: 1000, numero: '2', classe: 'contagem-numero' },
      { delay: 1000, numero: '1', classe: 'contagem-numero' },
      { delay: 800,  numero: 'VÁ!', classe: 'contagem-go' },
    ];

    let acumulado = 1200; // espera inicial para ler a mensagem

    passos.forEach((passo, index) => {
      setTimeout(() => {
        // Troco o número e reaplico a animação forçando reflow
        dom.contagemNumero.className = passo.classe;
        dom.contagemNumero.textContent = passo.numero;

        // No último passo resolvo a Promise para iniciar o jogo
        if (index === passos.length - 1) {
          setTimeout(resolver, 600);
        }
      }, acumulado);

      acumulado += passo.delay;
    });
  });
}


// =============================================================
// SEÇÃO 6 — GERAÇÃO DO GRID
// Crio os 16 cercados via DOM — sem innerHTML conforme exigido
// =============================================================

function gerarGrid() {
  dom.grid.innerHTML = '';
  const total = CONFIG.linhas * CONFIG.colunas;

  for (let i = 0; i < total; i++) {
    const cercado = document.createElement('div');
    cercado.classList.add('cercado', 'vazio');
    cercado.dataset.indice = i;
    cercado.dataset.estado = 'vazio';
    cercado.addEventListener('click', () => clicarCercado(cercado));
    dom.grid.appendChild(cercado);
  }
}

function obterCercados()       { return dom.grid.querySelectorAll('.cercado'); }
function obterCercadosVazios() { return Array.from(obterCercados()).filter(c => c.dataset.estado === 'vazio'); }
function obterCercadosAtivos() { return Array.from(obterCercados()).filter(c => c.dataset.estado === 'ativo'); }


// =============================================================
// SEÇÃO 7 — APARECIMENTO DOS DINOSSAUROS
// =============================================================

function sortearTipoDino() {
  const fase = CONFIG.fases[estado.faseAtual];
  const sorteio = Math.random();
  if (sorteio < fase.chanceTrex) return 'trex';
  if (sorteio < fase.chanceTrex + ((1 - fase.chanceTrex) / 2)) return 'raptor';
  return 'braquio';
}

function aparecerDino() {
  if (!estado.jogoRodando) return;

  const fase = CONFIG.fases[estado.faseAtual];
  if (obterCercadosAtivos().length >= fase.maxSimultaneos) return;

  const vazios = obterCercadosVazios();
  if (vazios.length === 0) return;

  const cercado = vazios[Math.floor(Math.random() * vazios.length)];
  const tipo = sortearTipoDino();
  const tempoVisivel = fase.tempoDino[tipo];

  cercado.dataset.tipo = tipo;
  cercado.dataset.estado = 'ativo';
  cercado.classList.remove('vazio', 'fugiu', 'acertado');
  cercado.classList.add('ativo', `tipo-${tipo}`);

  // Crio um elemento <img> em vez de usar textContent com emoji
  // Assim as imagens reais dos dinos aparecem dentro do cercado
  cercado.innerHTML = '';
  const img = document.createElement('img');
  img.src = CONFIG.imagens[tipo];
  img.alt = tipo;
  img.classList.add('dino-img');
  cercado.appendChild(img);

  const timeoutFuga = setTimeout(() => {
    if (cercado.dataset.estado === 'ativo') registrarFuga(cercado);
  }, tempoVisivel);

  cercado.dataset.timeoutId = timeoutFuga;
}


// =============================================================
// SEÇÃO 8 — INTERAÇÃO
// =============================================================

function clicarCercado(cercado) {
  if (cercado.dataset.estado !== 'ativo') return;
  if (!estado.jogoRodando) return;
  clearTimeout(Number(cercado.dataset.timeoutId));
  registrarAcerto(cercado, cercado.dataset.tipo);
}

function registrarAcerto(cercado, tipo) {
  estado.acertos++;
  estado.comboAtual++;
  if (estado.comboAtual > estado.melhorCombo) estado.melhorCombo = estado.comboAtual;

  const multiplicador = calcularMultiplicador();
  const pontosGanhos = Math.round(CONFIG.pontos[tipo] * multiplicador);
  estado.pontos += pontosGanhos;

  cercado.dataset.estado = 'acertado';
  cercado.classList.remove('ativo', `tipo-${tipo}`);
  cercado.classList.add('acertado');
  mostrarPtsFixuante(cercado, `+${pontosGanhos}`);

  if (estado.comboAtual === 2 || estado.comboAtual === 5 || estado.comboAtual === 10) {
    mostrarNotifCombo(`COMBO x${multiplicador}!`);
  }

  setTimeout(() => limparCercado(cercado), 300);
  atualizarHUD();
}

function registrarFuga(cercado) {
  const tipo = cercado.dataset.tipo;
  const vidasPerdidas = (tipo === 'trex') ? CONFIG.fugasTrex : 1;

  estado.vidas = Math.max(0, estado.vidas - vidasPerdidas);
  estado.fugas++;
  estado.comboAtual = 0;

  cercado.dataset.estado = 'fugiu';
  cercado.classList.remove('ativo', `tipo-${tipo}`);
  cercado.classList.add('fugiu');
  cercado.innerHTML = '';
  cercado.textContent = CONFIG.emojiFuga;

  setTimeout(() => limparCercado(cercado), 400);
  atualizarHUD();
  atualizarIconesVida();

  if (estado.vidas <= 0) terminarJogo('falha');
}

function limparCercado(cercado) {
  cercado.dataset.estado = 'vazio';
  cercado.dataset.tipo = '';
  cercado.dataset.timeoutId = '';
  cercado.className = 'cercado vazio';
  cercado.textContent = '';
}


// =============================================================
// SEÇÃO 9 — SISTEMA DE COMBO
// =============================================================

function calcularMultiplicador() {
  const c = estado.comboAtual;
  if (c >= 10) return CONFIG.nivelCombo[10];
  if (c >= 5)  return CONFIG.nivelCombo[5];
  if (c >= 2)  return CONFIG.nivelCombo[2];
  return 1;
}

function mostrarNotifCombo(texto) {
  dom.notifCombo.textContent = texto;
  dom.notifCombo.classList.remove('visivel');
  void dom.notifCombo.offsetWidth;
  dom.notifCombo.classList.add('visivel');
  setTimeout(() => dom.notifCombo.classList.remove('visivel'), 900);
}

function mostrarPtsFixuante(cercado, texto) {
  const span = document.createElement('span');
  span.classList.add('pts-flutuante');
  span.textContent = texto;
  cercado.appendChild(span);
  setTimeout(() => span.remove(), 800);
}


// =============================================================
// SEÇÃO 10 — HUD
// =============================================================

function atualizarHUD() {
  dom.hudPontos.textContent = estado.pontos;
  const mult = calcularMultiplicador();
  dom.hudCombo.textContent = `x${mult}`;
  dom.hudCombo.style.fontSize = (estado.comboAtual >= 2) ? '1.2rem' : '0.95rem';
}

function atualizarNomeFase() {
  const fase = CONFIG.fases[estado.faseAtual];
  dom.hudFase.textContent = fase.nome;
  dom.hudFase.className = `hud-valor hud-fase ${fase.classe}`;
}

function atualizarIconesVida() {
  dom.hudIconesVida.innerHTML = '';
  for (let i = 0; i < CONFIG.totalVidas; i++) {
    const icone = document.createElement('span');
    icone.classList.add('icone-vida');
    icone.textContent = '🛡️';
    if (i >= estado.vidas) icone.classList.add('perdida');
    dom.hudIconesVida.appendChild(icone);
  }
}

function atualizarBarraTempo() {
  const pct = (estado.tempoRestante / CONFIG.duracaoPartida) * 100;
  dom.barraTempo.style.width = `${pct}%`;
  if (estado.tempoRestante <= 10) {
    dom.barraTempo.classList.add('urgente');
  } else {
    dom.barraTempo.classList.remove('urgente');
  }
}


// =============================================================
// SEÇÃO 11 — RELÓGIO E FASES
// =============================================================

function iniciarRelogio() {
  estado.intervaloClock = setInterval(() => {
    if (!estado.jogoRodando) return;
    estado.tempoRestante--;
    dom.hudTempo.textContent = estado.tempoRestante;
    atualizarBarraTempo();
    verificarMudancaDeFase();
    verificarAtaqueRex();   // checo a cada segundo se é hora do ataque T-Rex
    if (estado.tempoRestante <= 0) terminarJogo('sucesso');
  }, 1000);
}

function verificarMudancaDeFase() {
  const decorrido = CONFIG.duracaoPartida - estado.tempoRestante;
  let novaFase = CONFIG.fases.length - 1;
  let acumulado = 0;

  for (let i = 0; i < CONFIG.fases.length; i++) {
    acumulado += CONFIG.fases[i].duracaoFase;
    if (decorrido < acumulado) { novaFase = i; break; }
  }

  if (novaFase !== estado.faseAtual) {
    estado.faseAtual = novaFase;
    atualizarNomeFase();
    reiniciarIntervaloSpawn();
  }
}

function reiniciarIntervaloSpawn() {
  clearInterval(estado.intervaloSpawn);
  const fase = CONFIG.fases[estado.faseAtual];
  estado.intervaloSpawn = setInterval(() => {
    if (estado.jogoRodando) aparecerDino();
  }, fase.intervaloSpawn);
}


// =============================================================
// SEÇÃO 11b — EVENTO ESPECIAL: ATAQUE DE T-REX
// Acontece nos últimos segundos de cada fase (exceto a última).
// Pauso o spawn normal, mostro o overlay e depois lanço só T-Rexes
// por alguns segundos antes de retomar o jogo normalmente.
// =============================================================

// Segundos restantes na fase em que o ataque é acionado
const SEGUNDOS_ANTES_ATAQUE = 5;
// Duração em ms do overlay de aviso antes de soltar os T-Rexes
const DURACAO_OVERLAY_MS = 2500;
// Duração em ms do ataque propriamente dito
const DURACAO_ATAQUE_MS = 6000;
// Intervalo de spawn de T-Rex durante o ataque
const INTERVALO_SPAWN_REX = 600;

function verificarAtaqueRex() {
  // Só disparo na fase 0 e 1 — na fase 2 (CRÍTICO) o jogo já é difícil o suficiente
  if (estado.faseAtual >= CONFIG.fases.length - 1) return;
  if (estado.ataqueRexAtivo) return;

  // Calculo quanto tempo falta para a fase atual terminar
  const decorrido = CONFIG.duracaoPartida - estado.tempoRestante;
  let limiteAtualFase = 0;
  for (let i = 0; i <= estado.faseAtual; i++) {
    limiteAtualFase += CONFIG.fases[i].duracaoFase;
  }
  const tempoRestanteFase = limiteAtualFase - decorrido;

  // Disparo o ataque quando faltam SEGUNDOS_ANTES_ATAQUE para a fase terminar
  if (tempoRestanteFase === SEGUNDOS_ANTES_ATAQUE) {
    iniciarAtaqueRex();
  }
}

function iniciarAtaqueRex() {
  estado.ataqueRexAtivo = true;

  // Pausar spawns normais e limpar dinos ativos da tela
  clearInterval(estado.intervaloSpawn);
  obterCercadosAtivos().forEach(c => {
    clearTimeout(Number(c.dataset.timeoutId));
    limparCercado(c);
  });

  // Mostro o overlay de alerta
  dom.overlayTrex.classList.add('ativo');

  // Após a duração do overlay, começo a soltar T-Rexes
  const timeoutAtaque = setTimeout(() => {
    dom.overlayTrex.classList.remove('ativo');

    // Atualizo o HUD de fase para "ATAQUE T-REX"
    dom.hudFase.textContent = '⚠ ATAQUE T-REX';
    dom.hudFase.className = 'hud-valor hud-fase ataque-rex';

    // Spawn exclusivo de T-Rexes em ritmo acelerado
    const intervaloRex = setInterval(() => {
      if (!estado.jogoRodando || !estado.ataqueRexAtivo) {
        clearInterval(intervaloRex);
        return;
      }
      aparecerDinoTipo('trex');
    }, INTERVALO_SPAWN_REX);

    // Após a duração do ataque, encerro o evento e retomo o spawn normal
    const timeoutFim = setTimeout(() => {
      clearInterval(intervaloRex);
      estado.ataqueRexAtivo = false;

      // Limpo os T-Rexes que sobraram na tela
      obterCercadosAtivos().forEach(c => {
        clearTimeout(Number(c.dataset.timeoutId));
        limparCercado(c);
      });

      // Retomo o spawn normal da fase atual (que pode ter mudado durante o ataque)
      if (estado.jogoRodando) {
        atualizarNomeFase();
        reiniciarIntervaloSpawn();
      }
    }, DURACAO_ATAQUE_MS);

    estado.timeoutAtaqueRex = timeoutFim;
  }, DURACAO_OVERLAY_MS);

  estado.timeoutAtaqueRex = timeoutAtaque;
}

// Versão de aparecerDino que força um tipo específico — uso no ataque T-Rex
function aparecerDinoTipo(tipo) {
  if (!estado.jogoRodando) return;

  // Durante o ataque permito mais dinos simultâneos — é o caos
  const vazios = obterCercadosVazios();
  if (vazios.length === 0) return;

  const cercado = vazios[Math.floor(Math.random() * vazios.length)];
  const fase = CONFIG.fases[estado.faseAtual];
  const tempoVisivel = fase.tempoDino[tipo];

  cercado.dataset.tipo = tipo;
  cercado.dataset.estado = 'ativo';
  cercado.classList.remove('vazio', 'fugiu', 'acertado');
  cercado.classList.add('ativo', `tipo-${tipo}`);

  cercado.innerHTML = '';
  const img = document.createElement('img');
  img.src = CONFIG.imagens[tipo];
  img.alt = tipo;
  img.classList.add('dino-img');
  cercado.appendChild(img);

  const timeoutFuga = setTimeout(() => {
    if (cercado.dataset.estado === 'ativo') registrarFuga(cercado);
  }, tempoVisivel);

  cercado.dataset.timeoutId = timeoutFuga;
}


// =============================================================
// SEÇÃO 12 — INICIAR, CANCELAR E TERMINAR
// =============================================================

function prepararEstado(nome) {
  // Reseto tudo em uma função separada para reaproveitar no "jogar novamente"
  estado.nomeJogador = nome;
  estado.pontos = 0;
  estado.vidas = CONFIG.totalVidas;
  estado.acertos = 0;
  estado.fugas = 0;
  estado.comboAtual = 0;
  estado.melhorCombo = 0;
  estado.faseAtual = 0;
  estado.tempoRestante = CONFIG.duracaoPartida;
  estado.jogoRodando = false;
  estado.ataqueRexAtivo = false;
  estado.timeoutAtaqueRex = null;
}

async function iniciarJogo() {
  const nome = dom.inputNome.value.trim();

  if (!nome) {
    dom.inputNome.focus();
    dom.inputNome.style.borderColor = 'var(--laranja-brasa)';
    setTimeout(() => { dom.inputNome.style.borderColor = ''; }, 1000);
    return;
  }

  prepararEstado(nome);

  // Mostro a contagem regressiva e aguardo ela terminar antes de iniciar
  await executarContagem();

  // Preparo a tela de jogo
  dom.hudNome.textContent = nome.toUpperCase();
  gerarGrid();
  atualizarHUD();
  atualizarNomeFase();
  atualizarIconesVida();
  atualizarBarraTempo();

  estado.jogoRodando = true;
  mostrarTela(dom.telaJogo);

  iniciarRelogio();
  reiniciarIntervaloSpawn();
}

function cancelarJogo() {
  // Cancela a partida sem registrar no ranking e volta ao menu
  pararTimers();
  renderizarRanking();
  mostrarTela(dom.telaInicial);
}

function pararTimers() {
  // Centralizo a parada de todos os timers para usar tanto no cancel quanto no game over
  estado.jogoRodando = false;
  clearInterval(estado.intervaloClock);
  clearInterval(estado.intervaloSpawn);
  clearTimeout(estado.timeoutAtaqueRex);
  obterCercadosAtivos().forEach(c => clearTimeout(Number(c.dataset.timeoutId)));

  // Garanto que o overlay suma se o jogo terminar durante o evento
  dom.overlayTrex.classList.remove('ativo');
  estado.ataqueRexAtivo = false;
}

function terminarJogo(resultado) {
  pararTimers();
  const posicao = salvarRanking(estado.nomeJogador, estado.pontos);
  mostrarTelaFim(resultado, posicao);
}

function mostrarTelaFim(resultado, posicaoRanking) {
  const ehSucesso = resultado === 'sucesso';

  dom.finStatus.textContent = ehSucesso ? 'CONTENÇÃO BEM-SUCEDIDA' : 'CONTENÇÃO FALHOU';
  dom.finStatus.className = `fim-status ${ehSucesso ? 'sucesso' : 'falha'}`;
  dom.finNome.textContent = estado.nomeJogador.toUpperCase();
  dom.finPontos.textContent = estado.pontos;
  dom.finAcertos.textContent = estado.acertos;
  dom.finFugas.textContent = estado.fugas;
  dom.finCombo.textContent = `x${estado.melhorCombo}`;

  if (posicaoRanking !== null && posicaoRanking <= 5) {
    dom.finPosicao.textContent = `🏆 RANKING — ${posicaoRanking}º LUGAR`;
  } else if (posicaoRanking !== null) {
    dom.finPosicao.textContent = `${posicaoRanking}º LUGAR NO RANKING`;
  } else {
    dom.finPosicao.textContent = '';
  }

  mostrarTela(dom.telaFim);
}


// =============================================================
// SEÇÃO 13 — RANKING (localStorage)
// =============================================================

const CHAVE_RANKING = 'dinoStrike_ranking';

function carregarRanking() {
  try {
    const dados = localStorage.getItem(CHAVE_RANKING);
    return dados ? JSON.parse(dados) : [];
  } catch { return []; }
}

function salvarRanking(nome, pontos) {
  const ranking = carregarRanking();
  ranking.push({ nome, pontos });
  ranking.sort((a, b) => b.pontos - a.pontos);
  const top10 = ranking.slice(0, 10);
  localStorage.setItem(CHAVE_RANKING, JSON.stringify(top10));
  const posicao = top10.findIndex(e => e.nome === nome && e.pontos === pontos);
  return posicao + 1;
}

function renderizarRanking() {
  const ranking = carregarRanking();
  dom.listaRanking.innerHTML = '';

  if (ranking.length === 0) {
    const vazio = document.createElement('p');
    vazio.classList.add('ranking-vazio');
    vazio.textContent = 'Nenhum registro ainda. Seja o primeiro!';
    dom.listaRanking.appendChild(vazio);
    return;
  }

  ranking.slice(0, 5).forEach((entrada, index) => {
    const li = document.createElement('li');

    const pos = document.createElement('span');
    pos.classList.add('ranking-pos');
    pos.textContent = `${index + 1}º`;

    const nomeEl = document.createElement('span');
    nomeEl.classList.add('ranking-nome');
    nomeEl.textContent = entrada.nome;

    const ptsEl = document.createElement('span');
    ptsEl.classList.add('ranking-pts');
    ptsEl.textContent = entrada.pontos;

    li.appendChild(pos);
    li.appendChild(nomeEl);
    li.appendChild(ptsEl);
    dom.listaRanking.appendChild(li);
  });
}


// =============================================================
// SEÇÃO 14 — EVENT LISTENERS
// =============================================================

dom.btnJogar.addEventListener('click', iniciarJogo);

dom.inputNome.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') iniciarJogo();
});

dom.btnCancelar.addEventListener('click', () => {
  // Peço confirmação antes de abandonar para evitar clique acidental
  if (confirm('Abandonar a partida? O progresso atual não será salvo.')) {
    cancelarJogo();
  }
});

dom.btnJogarNovamente.addEventListener('click', () => {
  // Reutilizo o nome já digitado — não precisa redigitar
  iniciarJogo();
});

dom.btnMenu.addEventListener('click', () => {
  renderizarRanking();
  mostrarTela(dom.telaInicial);
});


// =============================================================
// SEÇÃO 15 — INICIALIZAÇÃO
// =============================================================

renderizarRanking();
