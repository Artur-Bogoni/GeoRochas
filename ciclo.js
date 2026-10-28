/* ==========================================================================
   Ciclo das rochas
   O diagrama é desenhado a partir de duas listas de dados:
   - "nos": materiais e rochas (os círculos)
   - "processos": o que transforma um nó em outro (as setas)
   Para mudar um texto, uma posição ou criar um novo item, basta editar as listas.
   ========================================================================== */

/* ---------- 1. Dados ---------- */

const nos = [
  {
    id: 'magma', titulo: 'Magma', x: 450, y: 95, cor: '#e5481c',
    texto: 'Magma é rocha derretida que fica no interior da Terra. Quando chega à superfície, recebe o nome de lava.',
    exemplo: 'O resfriamento do magma dá origem às rochas ígneas.'
  },
  {
    id: 'igneas', titulo: 'Rochas ígneas', rotulo: 'Ígneas', x: 150, y: 290, cor: '#c0583d',
    imagem: 'assets/rocha-igneas.png',
    texto: 'Formam-se quando o magma ou a lava esfria e endurece. O resfriamento lento, em profundidade, forma cristais maiores.',
    exemplo: 'Granito, basalto, gabro e riolito.'
  },
  {
    id: 'metamorficas', titulo: 'Rochas metamórficas', rotulo: 'Metamórficas', x: 750, y: 290, cor: '#6f93b3',
    imagem: 'assets/rocha-metamorficas.png',
    texto: 'Calor e pressão transformam uma rocha sem derretê-la. Os minerais mudam e se reorganizam enquanto a rocha continua sólida.',
    exemplo: 'Gnaisse, mármore, quartzito e ardósia.'
  },
  {
    id: 'sedimentos', titulo: 'Sedimentos', x: 250, y: 545, cor: '#d8c394',
    texto: 'São fragmentos de rochas desgastadas e materiais que se depositam em camadas. Água, vento, gelo e gravidade podem transportá-los.',
    exemplo: 'Areia, argila e cascalho.'
  },
  {
    id: 'sedimentares', titulo: 'Rochas sedimentares', rotulo: 'Sedimentares', x: 650, y: 545, cor: '#c8924a',
    imagem: 'assets/rocha-sedimentares.webp',
    texto: 'Sedimentos acumulados são compactados e unidos por minerais. Com o tempo, esse processo forma uma rocha.',
    exemplo: 'Arenito, calcário, folhelho e carvão.'
  }
];

/* motor: 'interno' (calor e pressão) ou 'superficie' (clima, água, vento e gravidade)
   curva: quanto a seta se afasta da linha reta (negativo curva para o outro lado)
   atalho: true para caminhos menos comuns, escondidos até o botão "Mostrar atalhos" */
const processos = [
  {
    id: 'e1', de: 'magma', para: 'igneas', rotulo: 'Resfriamento', motor: 'interno', curva: 0.16,
    titulo: 'Resfriamento e cristalização',
    texto: 'O magma esfria e os minerais formam cristais. O resfriamento lento forma cristais maiores; o rápido forma cristais pequenos.'
  },
  {
    id: 'e2', de: 'igneas', para: 'sedimentos', rotulo: 'Erosão', motor: 'superficie', curva: 0.16,
    titulo: 'Intemperismo e erosão',
    texto: 'Chuva, vento e mudanças de temperatura desgastam as rochas. A água, o vento, o gelo e a gravidade transportam os fragmentos.'
  },
  {
    id: 'e3', de: 'sedimentos', para: 'sedimentares', rotulo: 'Litificação', motor: 'superficie', curva: 0.12,
    titulo: 'Compactação e cimentação',
    texto: 'O peso das camadas comprime os sedimentos. Minerais nos espaços entre os grãos os unem e formam uma rocha.'
  },
  {
    id: 'e4', de: 'sedimentares', para: 'metamorficas', rotulo: 'Metamorfismo', motor: 'interno', curva: 0.16,
    titulo: 'Metamorfismo de rochas sedimentares',
    texto: 'Calor e pressão transformam a rocha sedimentar sem derretê-la.'
  },
  {
    id: 'e5', de: 'igneas', para: 'metamorficas', rotulo: 'Metamorfismo', motor: 'interno', curva: 0.22,
    titulo: 'Metamorfismo de rochas ígneas',
    texto: 'Calor e pressão também podem transformar uma rocha ígnea sem que ela derreta.'
  },
  {
    id: 'e6', de: 'metamorficas', para: 'magma', rotulo: 'Fusão', motor: 'interno', curva: 0.16,
    titulo: 'Fusão de rochas metamórficas',
    texto: 'Em temperaturas muito altas, uma rocha pode derreter e formar magma. Assim, o ciclo recomeça.'
  },
  {
    id: 'e7', de: 'sedimentares', para: 'magma', rotulo: 'Fusão', motor: 'interno', curva: 0.14, atalho: true,
    titulo: 'Fusão de rochas sedimentares',
    texto: 'Uma rocha sedimentar soterrada em grande profundidade pode derreter sem passar pelo metamorfismo.'
  },
  {
    id: 'e8', de: 'metamorficas', para: 'sedimentos', rotulo: 'Erosão', motor: 'superficie', curva: -0.12, atalho: true,
    titulo: 'Intemperismo de rochas metamórficas',
    texto: 'Quando uma rocha metamórfica chega à superfície, ela também é desgastada e seus fragmentos viram sedimentos.'
  }
];

const motores = {
  interno: 'Processo interno: movido pelo calor da Terra',
  superficie: 'Processo de superfície: movido por clima, água, vento e gravidade'
};

// Ordem usada pelo botão "Percorrer o ciclo".
const percurso = ['e1', 'e2', 'e3', 'e4', 'e6'];

/* ---------- 2. Estado e elementos da página ---------- */

const RAIO = 66; // raio dos círculos no desenho
const NS = 'http://www.w3.org/2000/svg';
const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const nosPorId = {};
nos.forEach(function (no) { nosPorId[no.id] = no; });
const itens = nos.concat(processos);

const diagrama = document.querySelector('#ciclo-svg');
const painel = document.querySelector('#painel');
const botoes = document.querySelector('#chips');
const botaoPercorrer = document.querySelector('#play');
const caixaAtalhos = document.querySelector('#atalhos');

/* ---------- 3. Funções auxiliares ---------- */

// Cria um elemento SVG com atributos.
function criarSvg(tag, atributos, pai) {
  const el = document.createElementNS(NS, tag);
  Object.keys(atributos || {}).forEach(function (nome) {
    el.setAttribute(nome, atributos[nome]);
  });
  if (pai) pai.appendChild(el);
  return el;
}

// Cria um elemento HTML comum.
function criarHtml(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto) el.textContent = texto;
  return el;
}

function nomeCurto(no) {
  return no.rotulo || no.titulo;
}

// Ponto a "distancia" pixels do centro de um nó, na direção de (alvoX, alvoY).
function pontoNaBorda(no, alvoX, alvoY, distancia) {
  const dx = alvoX - no.x;
  const dy = alvoY - no.y;
  const tamanho = Math.hypot(dx, dy);
  return { x: no.x + (dx / tamanho) * distancia, y: no.y + (dy / tamanho) * distancia };
}

// Calcula a curva da seta (início, ponto de controle, fim) e onde fica o rótulo.
function calcularCurva(processo) {
  const a = nosPorId[processo.de];
  const b = nosPorId[processo.para];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const tamanho = Math.hypot(dx, dy);
  const nx = -dy / tamanho; // vetor perpendicular à linha reta
  const ny = dx / tamanho;

  const controle = {
    x: (a.x + b.x) / 2 + nx * processo.curva * tamanho,
    y: (a.y + b.y) / 2 + ny * processo.curva * tamanho
  };
  const inicio = pontoNaBorda(a, controle.x, controle.y, RAIO + 8);
  const fim = pontoNaBorda(b, controle.x, controle.y, RAIO + 14);

  // O rótulo fica no meio da curva, um pouco para o lado em que ela se curva.
  const lado = Math.sign(processo.curva);
  const meio = {
    x: 0.25 * inicio.x + 0.5 * controle.x + 0.25 * fim.x,
    y: 0.25 * inicio.y + 0.5 * controle.y + 0.25 * fim.y
  };
  const afastamento = 16;
  const rotulo = {
    x: meio.x + nx * lado * afastamento,
    y: meio.y + ny * lado * afastamento,
    ancora: 'middle'
  };
  // Em setas quase verticais, o texto sai de lado para não cobrir a linha.
  if (Math.abs(nx) > 0.5) {
    rotulo.ancora = nx * lado > 0 ? 'start' : 'end';
  } else {
    rotulo.y += ny * lado * 10;
  }
  rotulo.y += 6; // alinha o centro do texto

  return {
    caminho: 'M ' + inicio.x + ' ' + inicio.y + ' Q ' + controle.x + ' ' + controle.y + ' ' + fim.x + ' ' + fim.y,
    rotulo: rotulo
  };
}

/* ---------- 4. Desenho do diagrama ---------- */

function desenharDefinicoes() {
  const defs = criarSvg('defs', {}, diagrama);

  // Pontas de seta, uma para cada cor.
  ['interno', 'superficie', 'ativa'].forEach(function (tipo) {
    const marcador = criarSvg('marker', {
      id: 'seta-' + tipo, viewBox: '0 0 14 14', refX: 11, refY: 7,
      markerWidth: 14, markerHeight: 14, markerUnits: 'userSpaceOnUse', orient: 'auto'
    }, defs);
    criarSvg('path', { d: 'M 0 1 L 12 7 L 0 13 z', class: 'seta-' + tipo }, marcador);
  });

  // Um recorte circular por nó, usado para encaixar a foto da rocha.
  nos.forEach(function (no) {
    const recorte = criarSvg('clipPath', { id: 'recorte-' + no.id }, defs);
    criarSvg('circle', { cx: no.x, cy: no.y, r: RAIO - 4 }, recorte);
  });

  // Brilho do magma.
  const brilho = criarSvg('radialGradient', { id: 'gradiente-magma' }, defs);
  criarSvg('stop', { offset: '0%', 'stop-color': '#ffd27a' }, brilho);
  criarSvg('stop', { offset: '45%', 'stop-color': '#f0822a' }, brilho);
  criarSvg('stop', { offset: '100%', 'stop-color': '#b3300f' }, brilho);
}

function desenharProcesso(processo) {
  const geometria = calcularCurva(processo);
  const grupo = criarSvg('g', {
    class: 'process ' + processo.motor + (processo.atalho ? ' atalho' : ''),
    'data-id': processo.id,
    tabindex: processo.atalho ? '-1' : '0',
    role: 'button',
    'aria-label': processo.titulo + ': ' + nomeCurto(nosPorId[processo.de]) + ' para ' + nomeCurto(nosPorId[processo.para])
  }, diagrama);

  // Área invisível mais larga para facilitar o clique.
  criarSvg('path', { d: geometria.caminho, class: 'area-clique' }, grupo);
  criarSvg('path', { d: geometria.caminho, class: 'linha', id: 'caminho-' + processo.id }, grupo);

  const texto = criarSvg('text', {
    x: geometria.rotulo.x, y: geometria.rotulo.y,
    'text-anchor': geometria.rotulo.ancora, class: 'rotulo-processo'
  }, grupo);
  texto.textContent = processo.rotulo;
}

// Desenha pequenos grãos dentro do círculo de sedimentos.
function desenharGraos(grupo, no) {
  const tons = ['#b79a63', '#e6d3a6', '#9c7f4a', '#cdb482'];
  let semente = 7;
  function aleatorio() { // sequência fixa, para o desenho ser sempre igual
    semente = (semente * 9301 + 49297) % 233280;
    return semente / 233280;
  }
  for (let i = 0; i < 46; i++) {
    const angulo = aleatorio() * Math.PI * 2;
    const distancia = Math.sqrt(aleatorio()) * (RAIO - 12);
    criarSvg('circle', {
      cx: no.x + Math.cos(angulo) * distancia,
      cy: no.y + Math.sin(angulo) * distancia,
      r: 3 + aleatorio() * 5,
      fill: tons[Math.floor(aleatorio() * tons.length)],
      opacity: 0.9
    }, grupo);
  }
}

function desenharNo(no) {
  const grupo = criarSvg('g', {
    class: 'node no-' + no.id,
    'data-id': no.id,
    tabindex: '0',
    role: 'button',
    'aria-label': no.titulo
  }, diagrama);
  grupo.style.setProperty('--cor-no', no.cor);

  criarSvg('circle', { cx: no.x, cy: no.y, r: RAIO, class: 'disco' }, grupo);

  if (no.id === 'magma') {
    criarSvg('circle', { cx: no.x, cy: no.y, r: RAIO - 4, fill: 'url(#gradiente-magma)', class: 'miolo-magma' }, grupo);
  } else if (no.imagem) {
    criarSvg('image', {
      href: no.imagem, x: no.x - RAIO + 2, y: no.y - RAIO + 2,
      width: (RAIO - 2) * 2, height: (RAIO - 2) * 2,
      preserveAspectRatio: 'xMidYMid meet', 'clip-path': 'url(#recorte-' + no.id + ')'
    }, grupo);
  } else {
    const graos = criarSvg('g', { 'clip-path': 'url(#recorte-' + no.id + ')' }, grupo);
    desenharGraos(graos, no);
  }

  // Etiqueta com o nome, sobre a borda inferior do círculo.
  const nome = nomeCurto(no);
  const largura = nome.length * 15.5 + 30;
  criarSvg('rect', {
    x: no.x - largura / 2, y: no.y + RAIO - 18, width: largura, height: 40, rx: 20, class: 'etiqueta'
  }, grupo);
  const texto = criarSvg('text', { x: no.x, y: no.y + RAIO + 8, 'text-anchor': 'middle', class: 'nome-no' }, grupo);
  texto.textContent = nome;
}

function desenharDiagrama() {
  desenharDefinicoes();
  processos.forEach(desenharProcesso); // setas primeiro, para os círculos ficarem por cima
  nos.forEach(desenharNo);
}

/* ---------- 5. Painel de informações ---------- */

// Botão pequeno que leva a outro item do ciclo.
function criarLink(rotulo, id) {
  const botao = criarHtml('button', 'mini', rotulo);
  botao.type = 'button';
  botao.addEventListener('click', function () { selecionarItem(id); });
  return botao;
}

function criarLinhaDeLinks(titulo, links) {
  const linha = criarHtml('div', 'linha-links');
  linha.appendChild(criarHtml('span', 'linha-titulo', titulo));
  links.forEach(function (link) { linha.appendChild(link); });
  return linha;
}

function preencherPainel(item, textoEtapa) {
  painel.replaceChildren();
  painel.classList.remove('troca');
  void painel.offsetWidth; // reinicia a animação de entrada
  painel.classList.add('troca');

  if (textoEtapa) painel.appendChild(criarHtml('p', 'etapa', textoEtapa));

  const ehProcesso = Boolean(item.de);
  if (ehProcesso) {
    painel.appendChild(criarHtml('span', 'selo ' + item.motor, motores[item.motor]));
  }
  painel.appendChild(criarHtml('h3', '', item.titulo));
  painel.appendChild(criarHtml('p', '', item.texto));

  if (ehProcesso) {
    const caminho = criarHtml('div', 'caminho');
    caminho.append(
      criarLink(nomeCurto(nosPorId[item.de]), item.de),
      criarHtml('i', '', '→'),
      criarLink(nomeCurto(nosPorId[item.para]), item.para)
    );
    painel.appendChild(caminho);
    if (item.atalho) painel.appendChild(criarHtml('p', 'ex', 'Este é um atalho: acontece, mas é menos comum.'));
    return;
  }

  painel.appendChild(criarHtml('p', 'ex', item.exemplo));

  // Para um material, mostra de onde ele vem e para onde pode ir.
  const entradas = processos.filter(function (p) { return p.para === item.id; });
  const saidas = processos.filter(function (p) { return p.de === item.id; });
  function links(lista, lado) {
    return lista.map(function (p) {
      return criarLink(p.rotulo + ' (' + nomeCurto(nosPorId[p[lado]]) + ')', p.id);
    });
  }
  painel.appendChild(criarLinhaDeLinks('Vem de', links(entradas, 'de')));
  painel.appendChild(criarLinhaDeLinks('Pode virar', links(saidas, 'para')));
}

/* ---------- 6. Seleção ---------- */

let selecionado = null;
let pontoMovel = null;

function ligarAtalhos(ligado) {
  diagrama.classList.toggle('mostrar-atalhos', ligado);
  caixaAtalhos.checked = ligado;
  diagrama.querySelectorAll('.atalho').forEach(function (el) {
    el.setAttribute('tabindex', ligado ? '0' : '-1');
  });
}

// Uma bolinha percorre a seta selecionada, mostrando o sentido do processo.
function moverPonto(idProcesso) {
  if (pontoMovel) {
    pontoMovel.remove();
    pontoMovel = null;
  }
  if (!idProcesso || reduzMovimento) return;

  const grupo = diagrama.querySelector('.process[data-id="' + idProcesso + '"]');
  pontoMovel = criarSvg('circle', { r: 7, class: 'ponto-movel' }, grupo);
  const animacao = criarSvg('animateMotion', { dur: '2.6s', repeatCount: 'indefinite' }, pontoMovel);
  criarSvg('mpath', { href: '#caminho-' + idProcesso }, animacao);
}

function mostrarItem(id, textoEtapa) {
  const item = itens.find(function (opcao) { return opcao.id === id; });
  if (!item) return;
  selecionado = id;

  if (item.atalho) ligarAtalhos(true);

  diagrama.classList.toggle('tem-selecao', Boolean(item.de));
  diagrama.querySelectorAll('[data-id]').forEach(function (el) {
    const ativo = el.dataset.id === id
      || (item.de && (el.dataset.id === item.de || el.dataset.id === item.para));
    el.classList.toggle('selected', el.dataset.id === id);
    el.classList.toggle('relacionado', Boolean(ativo) && el.dataset.id !== id);
  });
  botoes.querySelectorAll('button').forEach(function (botao) {
    botao.classList.toggle('selected', botao.dataset.id === id);
  });

  moverPonto(item.de ? id : null);
  preencherPainel(item, textoEtapa);
}

/* ---------- 7. Percurso automático ---------- */

let intervalo = null;
let etapa = 0;

function pararPercurso() {
  if (!intervalo) return;
  clearInterval(intervalo);
  intervalo = null;
  botaoPercorrer.textContent = '▶ Percorrer o ciclo';
  botaoPercorrer.setAttribute('aria-pressed', 'false');
}

function mostrarEtapa() {
  mostrarItem(percurso[etapa], 'Etapa ' + (etapa + 1) + ' de ' + percurso.length);
}

function alternarPercurso() {
  if (intervalo) {
    pararPercurso();
    return;
  }
  etapa = 0;
  botaoPercorrer.textContent = '⏸ Pausar';
  botaoPercorrer.setAttribute('aria-pressed', 'true');
  mostrarEtapa();
  intervalo = setInterval(function () {
    etapa = (etapa + 1) % percurso.length;
    mostrarEtapa();
  }, 4500);
}

// Qualquer escolha feita pela pessoa interrompe o percurso automático.
function selecionarItem(id) {
  pararPercurso();
  mostrarItem(id);
}

/* ---------- 8. Botões de apoio (úteis em telas pequenas) ---------- */

function criarBotoes() {
  itens.forEach(function (item) {
    const botao = criarHtml('button', 'chip');
    botao.type = 'button';
    botao.dataset.id = item.id;
    botao.textContent = item.de
      ? item.rotulo + ': ' + nomeCurto(nosPorId[item.de]) + ' → ' + nomeCurto(nosPorId[item.para]) + (item.atalho ? ' (atalho)' : '')
      : item.titulo;
    botao.addEventListener('click', function () { selecionarItem(item.id); });
    botoes.appendChild(botao);
  });
}

/* ---------- 9. Início ---------- */

if (diagrama && painel && botoes && botaoPercorrer && caixaAtalhos) {
  desenharDiagrama();
  criarBotoes();

  diagrama.addEventListener('click', function (evento) {
    const alvo = evento.target.closest('[data-id]');
    if (alvo) selecionarItem(alvo.dataset.id);
  });

  diagrama.addEventListener('keydown', function (evento) {
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    const alvo = evento.target.closest('[data-id]');
    if (alvo) {
      evento.preventDefault();
      selecionarItem(alvo.dataset.id);
    }
  });

  caixaAtalhos.addEventListener('change', function () {
    ligarAtalhos(caixaAtalhos.checked);
    // Se o item aberto é um atalho que acabou de sumir, volta ao início.
    const aberto = itens.find(function (i) { return i.id === selecionado; });
    if (!caixaAtalhos.checked && aberto && aberto.atalho) selecionarItem('magma');
  });

  botaoPercorrer.addEventListener('click', alternarPercurso);

  ligarAtalhos(false);
  mostrarItem('magma');
}
