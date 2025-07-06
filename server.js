import express from 'express';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { app as electronApp } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// 📁 Diretórios: Documentos/SteinsTracker/data
const documentsPath = electronApp.getPath('documents');
const baseDir = path.join(documentsPath, 'SteinsTracker');
const dataPath = path.join(baseDir, 'data');
const soundsPath = path.join(baseDir, 'sounds');

// 🛡️ CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// JSON Middleware
app.use(express.json());

// Cria diretórios
for (const dir of [dataPath, soundsPath]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Caminhos de arquivos
const jogosSelecionadosPath = path.join(dataPath, 'jogos_selecionados.json');
const logPath = path.join(dataPath, 'jogos_log.json');
const nomesAmigaveisPath = path.join(dataPath, 'nomes_amigaveis.json');
const backgroundPath = path.join(dataPath, 'background.json');
const iconsPath = path.join(dataPath, 'icons.json');

// Garante arquivos padrões
const requiredFiles = [
  { path: jogosSelecionadosPath, default: [] },
  { path: logPath, default: [] },
  { path: nomesAmigaveisPath, default: {} },
  { path: backgroundPath, default: { current: 0, wallpapers: [] } },
  { path: iconsPath, default: {} }
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file.path)) {
    fs.writeFileSync(file.path, JSON.stringify(file.default, null, 2));
  }
});

// 📦 API
app.get('/status/server', (req, res) => res.json({ status: 'ok', app: 'server' }));

app.get('/api/jogos-selecionados', (_, res) => readJsonFile(jogosSelecionadosPath, [], res));
app.post('/api/jogos-selecionados', (req, res) => writeJsonFile(jogosSelecionadosPath, req.body, res));

app.get('/api/logs', (_, res) =>
  readJsonFile(logPath, [], res, data => data.sort((a, b) => new Date(b.inicio) - new Date(a.inicio)))
);
app.post('/api/limpar-logs', (req, res) => writeJsonFile(logPath, req.body, res));

app.get('/api/nomes-amigaveis', (_, res) => readJsonFile(nomesAmigaveisPath, {}, res));
app.post('/api/nomes-amigaveis', (req, res) =>
  updateKeyValueFile(nomesAmigaveisPath, req.body.exeName, req.body.friendlyName, res)
);
app.delete('/api/nomes-amigaveis', (req, res) =>
  deleteKeyFromFile(nomesAmigaveisPath, req.body.exeName, res)
);

app.get('/api/icons', (_, res) => readJsonFile(iconsPath, {}, res));
app.post('/api/icons', (req, res) => writeJsonFile(iconsPath, req.body, res));
app.delete('/api/icons/:gameName', (req, res) => {
  const gameName = req.params.gameName;
  const data = fs.existsSync(iconsPath) ? JSON.parse(fs.readFileSync(iconsPath, 'utf-8')) : {};
  delete data[gameName];
  fs.writeFileSync(iconsPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.get('/api/background', (_, res) => readJsonFile(backgroundPath, { current: 0, backgrounds: [] }, res));
app.post('/api/update-background', (req, res) => updateBackgroundIndex(req.body.current, res));
app.post('/api/save-wallpapers', (req, res) => writeJsonFile(backgroundPath, req.body, res));

// Listagem de músicas
app.get('/api/musicas', (_, res) => {
  fs.readdir(soundsPath, (err, files) => {
    if (err) return res.status(500).json({ error: 'Erro ao carregar músicas' });
    const mp3Files = files.filter(file => file.endsWith('.mp3'));
    res.json(mp3Files);
  });
});

// Scan de jogos
app.post('/api/scan-games', (req, res) => {
  try {
    const { path: folderPath, recursive = true } = req.body;
    if (!fs.existsSync(folderPath)) return res.status(400).json({ error: 'Caminho não encontrado' });
    const gameExes = findGameExecutables(folderPath, recursive);
    res.json({ games: gameExes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function findGameExecutables(dir, recursive, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && recursive) {
      findGameExecutables(filePath, recursive, fileList);
    } else if (path.extname(file).toLowerCase() === '.exe') {
      fileList.push(file);
    }
  });
  return fileList;
}

// Funções auxiliares
function readJsonFile(filePath, defaultValue, res, transform = data => data) {
  try {
    const data = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : defaultValue;
    res.json(transform(data));
  } catch (error) {
    console.error(`Erro ao ler ${filePath}:`, error);
    res.status(500).json({ error: 'Erro ao ler arquivo' });
  }
}

function writeJsonFile(filePath, data, res) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error(`Erro ao salvar ${filePath}:`, error);
    res.status(500).json({ error: 'Erro ao salvar arquivo' });
  }
}

function updateKeyValueFile(filePath, key, value, res) {
  try {
    const data = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : {};
    data[key] = value;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar arquivo' });
  }
}

function deleteKeyFromFile(filePath, key, res) {
  try {
    const data = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : {};
    delete data[key];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item' });
  }
}

function updateBackgroundIndex(index, res) {
  try {
    const data = JSON.parse(fs.readFileSync(backgroundPath, 'utf-8'));
    data.current = index;
    fs.writeFileSync(backgroundPath, JSON.stringify(data, null, 2));
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar background' });
  }
}

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando: http://localhost:${PORT}`);
  console.log(`📁 Dados em: ${dataPath}`);
});
