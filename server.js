import express from 'express';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Middleware para parsing JSON
app.use(express.json());

// Caminho para pasta de dados
const dataPath = path.join(__dirname, 'public', 'data');

// Caminhos dos arquivos
const jogosSelecionadosPath = path.join(dataPath, 'jogos_selecionados.json');
const logPath = path.join(dataPath, 'jogos_log.json');
const nomesAmigaveisPath = path.join(dataPath, 'nomes_amigaveis.json');
const backgroundPath = path.join(dataPath, 'background.json');
const iconsPath = path.join(dataPath, 'icons.json');

// Verifica e cria a pasta de dados se não existir
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Verifica e cria arquivos JSON se não existirem
const requiredFiles = [
  { path: jogosSelecionadosPath, default: [] },
  { path: logPath, default: [] },
  { path: nomesAmigaveisPath, default: {} },
  { path: backgroundPath, default: { current: 0, wallpapers: [] } },
  { path: iconsPath, default: {} }
];

// Verifica e cria pastas necessárias
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Verifica e cria pasta de sons
const soundsPath = path.join(__dirname, 'public', 'assets', 'sounds');
if (!fs.existsSync(soundsPath)) {
  fs.mkdirSync(soundsPath, { recursive: true });
}

requiredFiles.forEach(file => {
  if (!fs.existsSync(file.path)) {
    fs.writeFileSync(file.path, JSON.stringify(file.default, null, 2));
  }
});

app.post('/api/scan-games', async (req, res) => {
  try {
    const { path: folderPath, recursive = true } = req.body;

    if (!fs.existsSync(folderPath)) {
      return res.status(400).json({ error: 'Caminho não encontrado' });
    }

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
      // Adicione aqui qualquer lógica adicional para filtrar executáveis de jogos
      fileList.push(file);
    }
  });

  return fileList;
}

// Rotas da API para ícones
app.get('/api/icons', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(iconsPath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Erro ao ler ícones:', error);
    res.status(500).json({ error: 'Erro ao carregar ícones' });
  }
});

app.post('/api/icons', (req, res) => {
  try {
    if (typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    fs.writeFileSync(iconsPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar ícones:', error);
    res.status(500).json({ error: 'Erro ao salvar ícones' });
  }
});

app.delete('/api/icons/:gameName', (req, res) => {
  try {
    const gameName = req.params.gameName;
    const data = JSON.parse(fs.readFileSync(iconsPath, 'utf-8'));
    delete data[gameName];
    fs.writeFileSync(iconsPath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover ícone:', error);
    res.status(500).json({ error: 'Erro ao remover ícone' });
  }
});

// Nova rota para listar músicas
app.get('/api/musicas', (req, res) => {
  fs.readdir(soundsPath, (err, files) => {
    if (err) {
      console.error('Erro ao ler diretório de sons:', err);
      return res.status(500).json({ error: 'Erro ao carregar músicas' });
    }

    const mp3Files = files.filter(file => file.endsWith('.mp3'));
    res.json(mp3Files);
  });
});

// Rotas da API existentes
app.get('/api/jogos-selecionados', (req, res) => {
  readJsonFile(jogosSelecionadosPath, [], res);
});

app.post('/api/jogos-selecionados', (req, res) => {
  writeJsonFile(jogosSelecionadosPath, req.body, res);
});

app.get('/api/logs', (req, res) => {
  readJsonFile(logPath, [], res, data => data.sort((a, b) => new Date(b.inicio) - new Date(a.inicio)));
});

app.post('/api/limpar-logs', (req, res) => {
  writeJsonFile(logPath, req.body, res);
});

app.get('/api/nomes-amigaveis', (req, res) => {
  readJsonFile(nomesAmigaveisPath, {}, res);
});

app.post('/api/nomes-amigaveis', (req, res) => {
  updateKeyValueFile(nomesAmigaveisPath, req.body.exeName, req.body.friendlyName, res);
});

app.delete('/api/nomes-amigaveis', (req, res) => {
  deleteKeyFromFile(nomesAmigaveisPath, req.body.exeName, res);
});

app.post('/api/update-background', (req, res) => {
  updateBackgroundIndex(req.body.current, res);
});

app.post('/api/save-wallpapers', (req, res) => {
  writeJsonFile(backgroundPath, req.body, res);
});

// Middleware para arquivos estáticos (DEVE VIR DEPOIS DAS ROTAS DA API)
app.use(express.static(path.join(__dirname, 'public')));

// Rota 404 (DEVE SER A ÚLTIMA ROTA)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Funções auxiliares
function readJsonFile(filePath, defaultValue, res, transform = data => data) {
  try {
    const data = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : defaultValue;
    res.json(transform(data));
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error);
    res.status(500).json({ error: 'Erro ao ler arquivo' });
  }
}

function writeJsonFile(filePath, data, res) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error(`Erro ao salvar arquivo ${filePath}:`, error);
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
    console.error(`Erro ao atualizar arquivo ${filePath}:`, error);
    res.status(500).json({ error: 'Erro ao atualizar arquivo' });
  }
}

function deleteKeyFromFile(filePath, key, res) {
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ success: true });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    delete data[key];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error(`Erro ao remover item de ${filePath}:`, error);
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
    console.error('Erro ao atualizar background:', error);
    res.status(500).json({ error: 'Erro ao atualizar background' });
  }
}

app.listen(PORT, () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);
  console.log(`Arquivos estáticos servidos de: ${path.join(__dirname, 'public')}`);
  console.log(`Arquivos de dados em: ${dataPath}`);
});
