import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';

const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'front-end')));

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let jogadores = [];
let jogoAtivo = false;
let idComBatata = null;
let batataTimeout = null;
let tempoInicioBatata = null;

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

function atualizarJogadores() {
  broadcast({ tipo: 'players-update', lista: jogadores });
}

function iniciarContagemParaExplosao() {
  
  if (batataTimeout) {
    clearTimeout(batataTimeout);
    batataTimeout = null;
  }
  

  const tempoAleatorio = Math.floor(Math.random() * 2000) + 5000; 
  tempoInicioBatata = Date.now();
  
  
  batataTimeout = setTimeout(() => {
    if (jogoAtivo && idComBatata) {
      queimar(idComBatata);
    }
  }, tempoAleatorio);
}

function iniciarJogo() {
  if (jogadores.length < 2) return;

  jogoAtivo = true;
  broadcast({ tipo: 'game-started' });

  const idx = Math.floor(Math.random() * jogadores.length);
  idComBatata = jogadores[idx].id;

  broadcast({ tipo: 'potato', holderId: idComBatata });
  iniciarContagemParaExplosao(); 
}

function passarBatata(novoId) {
  idComBatata = novoId;
  broadcast({ tipo: 'potato', holderId: novoId });
  
}

function queimar(id) {
  broadcast({ tipo: 'burned', id });

  jogoAtivo = false;
  idComBatata = null;
  jogadores.forEach(j => j.ready = false);

  broadcast({ tipo: 'game-stopped' });
  atualizarJogadores();

  if (batataTimeout) {
    clearTimeout(batataTimeout);
    batataTimeout = null;
  }
}

wss.on('connection', (ws) => {
  const id = crypto.randomUUID();
  const jogador = { id, number: jogadores.length + 1, ready: false };
  jogadores.push(jogador);

  ws.send(JSON.stringify({ tipo: 'id', id }));
  atualizarJogadores();

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.tipo === 'player-ready') {
      const j = jogadores.find(j => j.id === id);
      if (j) j.ready = true;
      atualizarJogadores();

      const todosProntos = jogadores.every(j => j.ready);
      if (todosProntos && jogadores.length >= 2 && !jogoAtivo) {
        iniciarJogo();
      }
    }

    if (data.tipo === 'pass-potato-to' && jogoAtivo && id === idComBatata) {
      passarBatata(data.alvoId);
    }
  });

  ws.on('close', () => {
    jogadores = jogadores.filter(j => j.id !== id);
    if (id === idComBatata) {
      queimar(id);
    } else {
      atualizarJogadores();
    }
  });
});

server.listen(port, () => {
  console.log(`Servidor http://localhost:${port}`);
});