import { Service } from 'node-windows';
import path from 'path';

// Caminho absoluto para seu script de monitoramento
const scriptPath = path.join(process.cwd(), 'monitor.js');

// Cria o serviço
const svc = new Service({
  name: 'StatusGamerMonitor',
  description: 'Monitoramento automático de tempo de jogos',
  script: scriptPath,
  nodeOptions: [
    '--harmony',
    '--experimental-modules'
  ]
});

svc.on('install', () => {
  console.log('✅ Serviço instalado com sucesso!');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('⚠️ O serviço já está instalado.');
});

svc.on('start', () => {
  console.log('🚀 Serviço iniciado com sucesso!');
});

svc.on('error', err => {
  console.error('❌ Erro ao instalar o serviço:', err);
});

svc.install();
