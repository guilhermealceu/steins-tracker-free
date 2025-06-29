import psList from 'ps-list';
import fs from 'fs';
import path from 'path';
import vdf from 'vdf-parser';
import { promisify } from 'util';
import regedit from 'regedit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import notifier from 'node-notifier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logPath = path.join(__dirname, 'jogos_log.json');
const selecionadosPath = path.join(__dirname, 'jogos_selecionados.json');
const nomesAmigaveisPath = path.join(__dirname, 'nomes_amigaveis.json');

const INTERVALO_SESSAO = 30 * 1000;
const estado = {};

// Nomes amigáveis padrão
const nomeAmigavelPadrao = {
  'VALORANT-Win64-Shipping.exe': 'Valorant',
  'GTA5.exe': 'GTA V',
  'cs2.exe': 'Counter-Strike 2',
  'MinecraftLauncher.exe': 'Minecraft Launcher',
  'Minecraft.exe': 'Minecraft',
  'BF2042.exe': 'Battlefield 2042',
  'BlackDesert64.exe': 'Black Desert',
  'ForzaHorizon5.exe': 'Forza Horizon 5',
  'RDR2.exe': 'Red Dead Redemption 2',
  'FallenDoll.exe': 'Fallen Doll',
  'BladeAndSorcery.exe': 'Blade and Sorcery',
  'Pavlov-Win64-Shipping.exe': 'Pavlov VR',
  'Pavlov.exe': 'Pavlov VR (alternativo)',
  'Beat Saber.exe': 'Beat Saber',
  'VRChat.exe': 'VRChat',
  'ChilloutVR.exe': 'Chillout VR',
  'Starfield.exe': 'Starfield',
  'LeagueClient.exe': 'League of Legends',
  'FortniteClient-Win64-Shipping.exe': 'Fortnite',
  'GenshinImpact.exe': 'Genshin Impact',
  'eldenring.exe': 'Elden Ring'
};

// Carrega nomes amigáveis personalizados do arquivo
function carregarNomesAmigaveis() {
  try {
    // Verifica se o arquivo existe e tem conteúdo
    if (fs.existsSync(nomesAmigaveisPath)) {
      const stats = fs.statSync(nomesAmigaveisPath);
      if (stats.size === 0) {
        // Arquivo vazio - cria com objeto vazio
        fs.writeFileSync(nomesAmigaveisPath, '{}');
        return {};
      }

      const dados = fs.readFileSync(nomesAmigaveisPath, 'utf-8');
      // Verifica se o conteúdo é um JSON válido
      if (dados.trim() === '') {
        fs.writeFileSync(nomesAmigaveisPath, '{}');
        return {};
      }

      return JSON.parse(dados);
    } else {
      // Arquivo não existe - cria com objeto vazio
      fs.writeFileSync(nomesAmigaveisPath, '{}');
      return {};
    }
  } catch (err) {
    console.warn('⚠️ Erro ao carregar nomes amigáveis. Criando novo arquivo...', err.message);
    // Tenta criar um novo arquivo válido
    try {
      fs.writeFileSync(nomesAmigaveisPath, '{}');
      return {};
    } catch (writeErr) {
      console.error('❌ Falha ao criar arquivo nomes_amigaveis.json:', writeErr.message);
      return {};
    }
  }
}

// Combina nomes padrão com personalizados
function getNomesAmigaveis() {
  const personalizados = carregarNomesAmigaveis();
  return { ...nomeAmigavelPadrao, ...personalizados };
}

// Restante do código permanece igual...
function carregarJogosSelecionados() {
  try {
    const dados = fs.readFileSync(selecionadosPath, 'utf-8');
    return JSON.parse(dados);
  } catch {
    console.warn('⚠️ Nenhum jogo selecionado em jogos_selecionados.json ou arquivo não encontrado.');
    return [];
  }
}

async function getSteamLibraries() {
  const regKey = 'HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam';
  const list = promisify(regedit.list);
  try {
    const res = await list(regKey);
    const installPath = res[regKey].values.InstallPath.value;
    const vdfPath = path.join(installPath, 'steamapps', 'libraryfolders.vdf');
    const text = fs.readFileSync(vdfPath, 'utf-8');
    const json = vdf.parse(text).libraryfolders;
    const libs = Object.values(json)
      .filter(v => v.path)
      .map(v => path.join(v.path, 'steamapps', 'common'));
    return libs;
  } catch (err) {
    console.warn("Erro ao localizar bibliotecas Steam:", err.message);
    return [];
  }
}

function getExecutablesExtra(pastasExtras) {
  const executaveis = new Set();

  for (const pasta of pastasExtras) {
    if (!fs.existsSync(pasta)) continue;

    try {
      fs.readdirSync(pasta, { withFileTypes: true }).forEach(d => {
        if (d.isDirectory()) {
          const dir = path.join(pasta, d.name);
          try {
            fs.readdirSync(dir).forEach(f => {
              if (f.toLowerCase().endsWith('.exe')) {
                executaveis.add(f);
              }
            });
          } catch { }
        }
      });
    } catch { }
  }

  return executaveis;
}

async function getExecutables() {
  const libsSteam = await getSteamLibraries();
  const executaveis = new Set();

  for (const lib of libsSteam) {
    if (!fs.existsSync(lib)) continue;

    try {
      fs.readdirSync(lib, { withFileTypes: true }).forEach(d => {
        if (d.isDirectory()) {
          const dir = path.join(lib, d.name);
          try {
            fs.readdirSync(dir).forEach(f => {
              if (f.toLowerCase().endsWith('.exe')) {
                executaveis.add(f);
              }
            });
          } catch { }
        }
      });
    } catch { }
  }

  const pastasExtras = [
    'E:\\Epic',
    'D:\\Games',
    'F:\\SteamLibrary\\steamapps\\common',
    'D:\\SteamLibrary\\steamapps\\common',
    'C:\\SteamLibrary\\steamapps\\common'
  ];

  const extras = getExecutablesExtra(pastasExtras);
  extras.forEach(e => executaveis.add(e));

  // Carregar apenas os selecionados
  const selecionados = carregarJogosSelecionados();
  selecionados.forEach(j => executaveis.add(j));

  return Array.from(executaveis);
}

async function salvarTempo(jogo, inicio, fim) {
  const nomesAmigaveis = getNomesAmigaveis();
  let dados = [];
  if (fs.existsSync(logPath)) {
    dados = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  }
  dados.push({
    jogo: nomesAmigaveis[jogo] || jogo,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    tempoTotalMin: Math.round((fim - inicio) / 60000),
    data: new Date().toISOString()
  });
  fs.writeFileSync(logPath, JSON.stringify(dados, null, 2));
}

async function verificar() {
  const nomesAmigaveis = getNomesAmigaveis();
  const selecionados = carregarJogosSelecionados(); // Carrega apenas os selecionados
  const processos = await psList();

  for (const nomeDoJogo of selecionados) {
    if (nomeDoJogo.toLowerCase().includes('crash') ||
      nomeDoJogo.toLowerCase().includes('handler') ||
      nomeDoJogo.toLowerCase().includes('launcher') ||
      nomeDoJogo.toLowerCase().includes('service')) {
      continue;
      }

      const emExecucao = processos.some(p => p.name === nomeDoJogo);
      const sessao = estado[nomeDoJogo];

      if (emExecucao) {
        if (!sessao) {
          const agora = new Date();
          estado[nomeDoJogo] = { inicio: agora, ultimoFim: null };
          console.log(`[${nomeDoJogo}] Iniciado às ${agora.toLocaleTimeString()}`);
          notifier.notify({
            title: 'Status Gamer',
            message: `Início de jogo: ${nomesAmigaveis[nomeDoJogo] || nomeDoJogo}`,
            sound: true,
            icon: path.join(__dirname, 'icon.png')
          });
        }
      } else if (sessao && !sessao.ultimoFim) {
        const fim = new Date();
        const tempoMin = Math.round((fim - sessao.inicio) / 60000);
        await salvarTempo(nomeDoJogo, sessao.inicio, fim);
        estado[nomeDoJogo].ultimoFim = fim;

        console.log(`[${nomeDoJogo}] Encerrado às ${fim.toLocaleTimeString()} - Tempo: ${tempoMin} min`);
        notifier.notify({
          title: 'Status Gamer',
          message: `Jogo encerrado: ${nomesAmigaveis[nomeDoJogo] || nomeDoJogo}\nTempo: ${tempoMin} min`,
          sound: true,
          icon: path.join(__dirname, 'icon.png')
        });
      }
    }

    for (const jogo in estado) {
      const fim = estado[jogo]?.ultimoFim;
      if (fim && Date.now() - fim.getTime() > INTERVALO_SESSAO) {
        delete estado[jogo];
      }
    }
  }

  // Verifica e cria o arquivo de nomes amigáveis se não existir
  function inicializarArquivos() {
    try {
      if (!fs.existsSync(nomesAmigaveisPath)) {
        fs.writeFileSync(nomesAmigaveisPath, '{}');
        console.log('Arquivo nomes_amigaveis.json criado com sucesso.');
      }

      if (!fs.existsSync(selecionadosPath)) {
        fs.writeFileSync(selecionadosPath, '[]');
        console.log('Arquivo jogos_selecionados.json criado com sucesso.');
      }

      if (!fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '[]');
        console.log('Arquivo jogos_log.json criado com sucesso.');
      }
    } catch (err) {
      console.error('Erro ao inicializar arquivos:', err.message);
    }
  }

  // Inicializa os arquivos necessários
  inicializarArquivos();

  console.log("⏳ Monitor de jogos iniciado...");
  setInterval(verificar, 10000);