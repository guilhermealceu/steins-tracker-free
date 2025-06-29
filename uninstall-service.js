import { Service } from 'node-windows';
import path from 'path';

// Mesmo nome do serviço criado no outro script
const scriptPath = path.join(process.cwd(), 'monitor.js');

const svc = new Service({
  name: 'StatusGamerMonitor',
  script: scriptPath
});

svc.on('uninstall', () => {
  console.log('🗑️ Serviço removido com sucesso!');
});

svc.on('error', err => {
  console.error('❌ Erro ao remover o serviço:', err);
});

svc.uninstall();
