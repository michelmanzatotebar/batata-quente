
const socket = new WebSocket(`ws://batata-quente-1.onrender.com/`);

const mesa = document.getElementById('mesa');
const aviso = document.getElementById('avisoQueimado');
const status = document.getElementById('status');
const botaoPronto = document.getElementById('botaoPronto');
const botaoCancelar = document.getElementById('botaoCancelar');
const instrucao = document.getElementById('instrucao');
const infoJogador = document.getElementById('infoJogador');
const numeroJogador = document.getElementById('numeroJogador');

let meuId = null;
let jogadores = [];
let idComBatata = null;
let jogoAtivo = false;
let selecionandoAlvo = false;
let mostrandoQueimado = false; 

const posicoes = [
  'pos-cima', 'pos-cima-dir', 'pos-direita', 'pos-baixo-dir',
  'pos-baixo', 'pos-baixo-esq', 'pos-esquerda', 'pos-cima-esq'
];

socket.addEventListener('open', () => {
  console.log('Conectado ao servidor WebSocket');
  status.textContent = 'Conectado! Aguardando jogadores...';
});

socket.addEventListener('message', (event) => {
  try {
    const mensagem = JSON.parse(event.data);
    processarMensagem(mensagem);
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
});

socket.addEventListener('close', () => {
  console.log('Conexão WebSocket fechada');
  status.textContent = 'Desconectado do servidor';
  status.style.color = 'red';
});

socket.addEventListener('error', (error) => {
  console.error('Erro no WebSocket:', error);
  status.textContent = 'Erro de conexão';
  status.style.color = 'red';
});

function processarMensagem(mensagem) {
  switch (mensagem.tipo) {
    case 'id':
      meuId = mensagem.id;
      console.log('Meu ID:', meuId);
      break;

    case 'players-update':
      jogadores = mensagem.lista;
      const eu = jogadores.find(j => j.id === meuId);
      
      if (eu) {
        numeroJogador.textContent = eu.number;
        infoJogador.style.display = 'block';
      }

      const prontos = jogadores.filter(j => j.ready).length;
      status.textContent = `Jogadores: ${jogadores.length} | Prontos: ${prontos}/${jogadores.length}`;
      status.style.color = '';
      renderizarJogadores();
      break;

    case 'potato':
      idComBatata = mensagem.holderId;
      selecionandoAlvo = false;
      instrucao.style.display = 'none';
      
      if (!mostrandoQueimado) {
        aviso.style.display = 'none';
      }

      if (idComBatata === meuId && jogoAtivo) {
        mostrarInstrucaoPassar();
      }
      renderizarJogadores();
      break;

    case 'burned':
      jogoAtivo = false; 
      idComBatata = null;
      selecionandoAlvo = false;
      instrucao.style.display = 'none';
      mostrandoQueimado = true;

      const queimado = jogadores.find(j => j.id === mensagem.id);
      const numero = queimado ? queimado.number : '?';
      
      aviso.textContent = mensagem.id === meuId ? 
        '🔥 VOCÊ FOI QUEIMADO!' : 
        `🔥 JOGADOR #${numero} FOI QUEIMADO!`;
      aviso.style.display = 'block';
      
      renderizarJogadores();

      setTimeout(() => {
        mostrandoQueimado = false;
        aviso.style.display = 'none';
      }, 3000);
      break;

    case 'game-started':
      jogoAtivo = true;
      mostrandoQueimado = false; 
      status.textContent = '🔥 Jogo iniciado! Batata quente rolando...';
      status.style.color = 'orange';
      botaoPronto.style.display = 'none';
      aviso.style.display = 'none';
      break;

    case 'game-stopped':
     
      if (mostrandoQueimado) {
        setTimeout(() => {
          processarGameStopped();
        }, 3500);
      } else {
        processarGameStopped();
      }
      break;
  }
}

function processarGameStopped() {
  jogoAtivo = false;
  selecionandoAlvo = false;
  idComBatata = null;
  mostrandoQueimado = false;
  
  botaoPronto.disabled = false;
  botaoPronto.textContent = 'Pronto!';
  botaoPronto.style.display = 'inline-block';
  
  status.textContent = 'Jogo parado. Clique em "Pronto!" para jogar novamente';
  status.style.color = '';
  
  instrucao.style.display = 'none';
  aviso.style.display = 'none';
  renderizarJogadores();
}

function mostrarInstrucaoPassar() {
  instrucao.textContent = '🥔 Você está com a BATATA QUENTE! Clique em outro jogador para passar!';
  instrucao.style.display = 'block';
  botaoCancelar.style.display = 'inline-block';
  
  setTimeout(() => {
    selecionandoAlvo = true;
    renderizarJogadores();
  }, 500);
}

botaoPronto.addEventListener('click', () => {
  if (socket.readyState === WebSocket.OPEN) {
    enviarMensagem({ tipo: 'player-ready' });
    botaoPronto.disabled = true;
    botaoPronto.textContent = 'Aguardando outros jogadores...';
  }
});

botaoCancelar.addEventListener('click', () => {
  selecionandoAlvo = false;
  instrucao.style.display = 'none';
  botaoCancelar.style.display = 'none';
  renderizarJogadores();
});

function clicarJogador(id) {
  if (!jogoAtivo || !selecionandoAlvo || id === meuId || idComBatata !== meuId) {
    return;
  }
  
  enviarMensagem({ tipo: 'pass-potato-to', alvoId: id });
  selecionandoAlvo = false;
  instrucao.style.display = 'none';
  botaoCancelar.style.display = 'none';
  renderizarJogadores();
}

function enviarMensagem(obj) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(obj));
  } else {
    console.error('WebSocket não está conectado');
  }
}

function renderizarJogadores() {
 
  mesa.querySelectorAll('.jogador').forEach(e => e.remove());

  jogadores.forEach((jogador, i) => {
    const div = document.createElement('div');
    div.className = 'jogador';
    
    if (i < posicoes.length) {
      div.classList.add(posicoes[i]);
    }
    
    if (jogador.id === meuId) div.classList.add('eu');
    if (jogador.ready) div.classList.add('pronto');
    if (jogador.id === idComBatata) div.classList.add('com-batata');
    if (selecionandoAlvo && jogador.id !== meuId && jogoAtivo) {
      div.classList.add('selecionavel');
    }

    const emoji = jogador.id === idComBatata ? '🥔' : '👤';
    div.innerHTML = `<div style="font-size: 20px">${emoji}</div><div style="font-size: 12px">#${jogador.number}</div>`;
    
    let tooltip = `Jogador #${jogador.number}`;
    if (jogador.id === meuId) tooltip += ' (Você)';
    if (jogador.ready) tooltip += ' ✓';
    if (jogador.id === idComBatata) tooltip += ' 🥔';
    div.title = tooltip;
    
    div.onclick = () => clicarJogador(jogador.id);

    mesa.appendChild(div);
  });
}

status.textContent = 'Conectando ao servidor...';
infoJogador.style.display = 'none';
instrucao.style.display = 'none';
aviso.style.display = 'none';
