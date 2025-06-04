function processarMensagem(mensagem) {
  if (mensagem.tipo === 'id') {
    return mensagem.id;
  }
  if (mensagem.tipo === 'players-update') {
    return mensagem.lista;
  }
  if (mensagem.tipo === 'game-started') {
    return 'jogo_iniciado';
  }
  return null;
}

function podePassarBatata(meuId, idComBatata, jogoAtivo) {
  return jogoAtivo && meuId === idComBatata;
}

function criarMensagem(tipo, dados = {}) {
  return { tipo, ...dados };
}

describe('Testes do Script.js', () => {
  test('Deve processar mensagem de ID', () => {
    const mensagem = { tipo: 'id', id: 'player-123' };
    const resultado = processarMensagem(mensagem);
    
    expect(resultado).toBe('player-123');
  });

  test('Deve verificar se pode passar batata', () => {
   
    expect(podePassarBatata('player1', 'player1', true)).toBe(true);
    
    expect(podePassarBatata('player1', 'player2', true)).toBe(false);

    expect(podePassarBatata('player1', 'player1', false)).toBe(false);
  });

  test('Deve criar mensagem corretamente', () => {
    const mensagem = criarMensagem('player-ready');
    
    expect(mensagem).toEqual({ tipo: 'player-ready' });
  });
});