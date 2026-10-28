// Define o tema usado em todas as páginas.
const temaSalvo = localStorage.getItem('georochas-tema');
const temaDoSistema = window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'escuro';
document.documentElement.dataset.tema = temaSalvo || temaDoSistema;

// Abre e fecha o menu em telas pequenas.
const botaoMenu = document.querySelector('.menu-btn');
const menu = document.querySelector('nav');

if (botaoMenu && menu) {
  botaoMenu.addEventListener('click', function () {
    const aberto = menu.classList.toggle('open');
    botaoMenu.setAttribute('aria-expanded', aberto);
  });

  menu.addEventListener('click', function (evento) {
    if (evento.target.tagName === 'A') {
      menu.classList.remove('open');
      botaoMenu.setAttribute('aria-expanded', 'false');
    }
  });
}

// Ao rolar a página: mostra o botão de voltar ao topo, dá sombra ao cabeçalho
// e atualiza a barra de progresso de leitura.
const botaoTopo = document.querySelector('.to-top');
const cabecalho = document.querySelector('header.site');

function aoRolar() {
  if (botaoTopo) {
    botaoTopo.classList.toggle('active', window.scrollY > 500);
  }
  if (cabecalho) {
    const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
    const progresso = alturaTotal > 0 ? window.scrollY / alturaTotal : 0;
    cabecalho.classList.toggle('rolado', window.scrollY > 10);
    cabecalho.style.setProperty('--progresso', progresso.toFixed(3));
  }
}

window.addEventListener('scroll', aoRolar, { passive: true });
aoRolar();

// Menu: um marcador desliza até o link que recebe o mouse ou o foco do teclado.
const listaMenu = document.querySelector('nav ul');
if (menu && listaMenu) {
  const telaGrande = window.matchMedia('(min-width: 901px)');
  const indicador = document.createElement('span');
  indicador.className = 'nav-indicador';
  indicador.setAttribute('aria-hidden', 'true');
  listaMenu.prepend(indicador);

  const linksMenu = Array.from(listaMenu.querySelectorAll('a'));
  const linkAtual = listaMenu.querySelector('a[aria-current="page"]');

  function moverIndicador(link) {
    if (!telaGrande.matches) return;
    if (!link) {
      indicador.style.opacity = '0';
      return;
    }
    indicador.style.width = link.offsetWidth + 'px';
    indicador.style.height = link.offsetHeight + 'px';
    indicador.style.transform = 'translate(' + link.offsetLeft + 'px, ' + link.offsetTop + 'px)';
    indicador.style.opacity = '1';
    linksMenu.forEach(function (item) {
      item.classList.toggle('sob-indicador', item === link);
    });
  }

  function ajustarMenu() {
    menu.classList.toggle('com-indicador', telaGrande.matches);
    moverIndicador(linkAtual);
  }

  linksMenu.forEach(function (link) {
    link.addEventListener('mouseenter', function () { moverIndicador(link); });
    link.addEventListener('focus', function () { moverIndicador(link); });
  });
  listaMenu.addEventListener('mouseleave', function () { moverIndicador(linkAtual); });
  listaMenu.addEventListener('focusout', function (evento) {
    if (!listaMenu.contains(evento.relatedTarget)) moverIndicador(linkAtual);
  });

  window.addEventListener('resize', ajustarMenu);
  if (document.fonts) document.fonts.ready.then(ajustarMenu); // a fonte muda a largura dos links
  ajustarMenu();
}

// Revela os blocos quando eles entram na tela.
const blocos = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('in');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.12 });

  blocos.forEach(function (bloco) {
    observador.observe(bloco);
  });
} else {
  blocos.forEach(function (bloco) {
    bloco.classList.add('in');
  });
}

// O botão de tema aparece na página inicial.
const botaoTema = document.querySelector('#theme-toggle');
if (botaoTema) {
  function atualizarBotaoTema() {
    const temaEscuro = document.documentElement.dataset.tema === 'escuro';
    botaoTema.textContent = temaEscuro ? '☀️ Tema claro' : '🌙 Tema escuro';
    botaoTema.setAttribute('aria-label', temaEscuro ? 'Ativar tema claro' : 'Ativar tema escuro');
  }

  atualizarBotaoTema();
  botaoTema.addEventListener('click', function () {
    const temaAtual = document.documentElement.dataset.tema;
    const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
    document.documentElement.dataset.tema = novoTema;
    localStorage.setItem('georochas-tema', novoTema);
    atualizarBotaoTema();
  });
}

// Cadastro da página inicial. Por enquanto é só visual: nada é enviado nem salvo.
const formCadastro = document.querySelector('#cadastro-form');
if (formCadastro) {
  formCadastro.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const nome = formCadastro.elements.nome.value.trim();
    document.querySelector('#cadastro-nome').textContent = nome;
    document.querySelector('.cadastro').classList.add('enviado');
  });
}
