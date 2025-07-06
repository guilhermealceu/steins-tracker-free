//monitor.js
import { app } from 'electron';
const psList = (await import('ps-list')).default;
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import notifier from 'node-notifier';


// 1. Diretório Documentos para armazenar dados
const docsPath = app.getPath('documents');
const baseDir = path.join(docsPath, 'SteinsTracker', 'data');
const monitorLog = path.join(docsPath, 'SteinsTracker', 'monitor.log');
let monitorando = true;

export function setMonitorando(ativo) {
  monitorando = ativo;
  log(`🔁 Monitoramento ${ativo ? 'ativado' : 'pausado'}`);
}


// 2. Garante que pastas existam
fs.mkdirSync(baseDir, { recursive: true });
fs.mkdirSync(path.dirname(monitorLog), { recursive: true });

// 3. Definição de caminhos de arquivos
const logPath = path.join(baseDir, 'jogos_log.json');
const selPath = path.join(baseDir, 'jogos_selecionados.json');

// 4. Servidor de status com CORS
const statusApp = express();
statusApp.use(cors());
statusApp.get('/status/monitor', (_, res) => res.json({ status: 'ok', app: 'monitor' }));
statusApp.listen(3001, () => console.log('🔎 Status monitor disponível em http://localhost:3001/status/monitor'));

// 5. Função de log interno para debugging
function log(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(monitorLog, `[${timestamp}] ${message}\n`);
}

// 6. Carregamento genérico de JSON
function loadJson(file, defaultValue) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return defaultValue; }
}

// 7. Salvar tempo de sessão
async function saveTime(game, start, end) {
  const data = loadJson(logPath, []);
  data.push({ jogo: game, inicio: start, fim: end, tempoTotalMin: Math.round((new Date(end) - new Date(start)) / 60000) });
  fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
}

// 8. Loop de verificação de processos
const INTERVAL = 10000;
const sessions = {};

async function checkGames(psList) {
  if (!monitorando) {
    log('⏸️ Verificação pausada.');
    return;
  }

  try {
    log('checkGames() iniciado');
    const processes = await psList();
    const selected = loadJson(selPath, []);

    const activeProcessNames = processes.map(p => p.name.toLowerCase());
    log('Selecionados: ' + JSON.stringify(selected));
    log('Processos ativos: ' + activeProcessNames.join(', '));

    for (const game of selected) {
      const gameName = game.toLowerCase();
      const running = activeProcessNames.includes(gameName);
      log(`Verificando ${game} → em execução: ${running}`);

      const session = sessions[game];
      if (running && !session) {
        sessions[game] = { start: new Date() };
        log(`Início de ${game}`);
        const iconPath = path.join(app.getPath('documents'), 'SteinsTracker', 'icon.ico');

        if (!fs.existsSync(iconPath)) {
          log('⚠️ Ícone não encontrado: ' + iconPath);
        }

        notifier.notify({
          title: 'Jogo iniciado',
          message: game,
          icon: iconPath,         // 🔧 ícone personalizado
          appID: 'SteinsTracker', // ✅ nome que aparece no cabeçalho
          timeout: 5              // opcional: tempo da notificação (em segundos)
        });

      } else if (!running && session) {
        const end = new Date();
        await saveTime(game, session.start.toISOString(), end.toISOString());
        log(`Fim de ${game}`);
        delete sessions[game];
      }
    }
  } catch (err) {
    log(`Erro em checkGames(): ${err.message}`);
  }
}

// 9. Iniciar monitoramento
export async function initializeMonitoring() {
  log('💚Monitor iniciado');

  // Importa ps-list dinamicamente aqui
  const psList = (await import('ps-list')).default;

  setInterval(async () => {
    await checkGames(psList);
  }, INTERVAL);
}
