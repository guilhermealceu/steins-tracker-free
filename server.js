import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

const jogosSelecionadosPath = path.join(__dirname, 'jogos_selecionados.json');
const logPath = path.join(__dirname, 'jogos_log.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET: jogos selecionados
app.get('/api/jogos-selecionados', (req, res) => {
  if (!fs.existsSync(jogosSelecionadosPath)) {
    return res.json([]);
  }
  const dados = JSON.parse(fs.readFileSync(jogosSelecionadosPath, 'utf-8'));
  res.json(dados);
});

// POST: salvar jogos selecionados
app.post('/api/jogos-selecionados', (req, res) => {
  const selecionados = req.body;
  if (!Array.isArray(selecionados)) {
    return res.status(400).json({ erro: 'Formato inválido. Envie um array.' });
  }

  fs.writeFileSync(jogosSelecionadosPath, JSON.stringify(selecionados, null, 2));
  res.json({ sucesso: true });
});

// GET: logs de jogos
app.get('/api/logs', (req, res) => {
  if (!fs.existsSync(logPath)) {
    return res.json([]);
  }
  const dados = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  // Ordenar do mais recente para o mais antigo
  dados.sort((a, b) => new Date(b.inicio) - new Date(a.inicio));
  res.json(dados);
});

// Adicione estas rotas ao server.js

const nomesAmigaveisPath = path.join(__dirname, 'nomes_amigaveis.json');

// GET: nomes amigáveis
app.get('/api/nomes-amigaveis', (req, res) => {
  if (!fs.existsSync(nomesAmigaveisPath)) {
    return res.json({});
  }
  const dados = JSON.parse(fs.readFileSync(nomesAmigaveisPath, 'utf-8'));
  res.json(dados);
});

// POST: salvar nome amigável
app.post('/api/nomes-amigaveis', (req, res) => {
  const { exeName, friendlyName } = req.body;

  let dados = {};
  if (fs.existsSync(nomesAmigaveisPath)) {
    dados = JSON.parse(fs.readFileSync(nomesAmigaveisPath, 'utf-8'));
  }

  dados[exeName] = friendlyName;
  fs.writeFileSync(nomesAmigaveisPath, JSON.stringify(dados, null, 2));

  res.json({ sucesso: true });
});

// DELETE: remover nome amigável
app.delete('/api/nomes-amigaveis', (req, res) => {
  const { exeName } = req.body;

  if (!fs.existsSync(nomesAmigaveisPath)) {
    return res.json({ sucesso: true });
  }

  const dados = JSON.parse(fs.readFileSync(nomesAmigaveisPath, 'utf-8'));
  delete dados[exeName];
  fs.writeFileSync(nomesAmigaveisPath, JSON.stringify(dados, null, 2));

  res.json({ sucesso: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);
});

// POST: Limpar logs
app.post('/api/limpar-logs', (req, res) => {
  fs.writeFileSync(logPath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});