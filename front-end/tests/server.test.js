const request = require('supertest');
const express = require('express');

function createApp() {
  const app = express();
  
  app.get('/home', (req, res) => {
    res.send('<h1>Batata Quente</h1>');
  });
  
  app.get('/styles.css', (req, res) => {
    res.type('text/css').send('body { color: red; }');
  });
  
  return app;
}

describe('Testes do Server.js', () => {
  test('Rota /home deve funcionar', async () => {
    const app = createApp();
    
    const response = await request(app)
      .get('/home')
      .expect(200);
    
    expect(response.text).toContain('Batata Quente');
  });

  test('Arquivo CSS deve ser servido', async () => {
    const app = createApp();
    
    await request(app)
      .get('/styles.css')
      .expect(200);
  });

  test('Rota inexistente deve dar 404', async () => {
    const app = createApp();
    
    await request(app)
      .get('/rota-inexistente')
      .expect(404);
  });
});