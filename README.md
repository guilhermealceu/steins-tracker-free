# 🎮 Steins;Tracker

**Steins;Tracker** é uma ferramenta de monitoramento local que registra automaticamente o tempo de jogo no seu PC. Ideal para jogadores que desejam acompanhar sua rotina gamer de forma simples mas bonita e funcional.

---

## ⚙️ Funcionalidades

- ⏱️ **Monitoramento automático** de jogos em execução
- 🔍 Detecta executáveis de jogos (.exe) e atualiza sessões em tempo real
- 🌐 Interface web amigável e intuitiva
- 📊 **Dashboard com gráficos interativos** de estatísticas
- 📁 Procura nas pastas por meio de exe e informando o caminho
- 💾 Armazena os dados localmente em `jogos_log.json` nos seus documentos
- 🔔 Notificações no sistema ao iniciar ou encerrar um jogo
- 🖼️ Personalização com ícones e wallpapers de fundo
- ✅ Botão para procurar atualizações e instalar diretamente no app
- 🌐 Qr code nas configurações gerado apartir do 

---

## 🖥️ Interface Visual

### 🎯 Dashboard de Jogos
> Veja rapidamente o tempo total, sessões e frequência de jogatina.

![Dashboard](https://github.com/guilhermealceu/Steins-Tracker/blob/main/public/imgs/Dashboard-v2.png?raw=true)

---

### 🧠 Seletor de Jogos
> Escolha os executáveis que devem ser monitorados.

![Seletor de Jogos](https://github.com/guilhermealceu/Steins-Tracker/blob/main/public/imgs/Seletor%20de%20Jogos%20v2.png?raw=true)

---

### 📡 Monitor de Status
> Ative ou oculte jogos que devem aparecer na tela principal.

![Monitor de Jogos](https://github.com/guilhermealceu/Steins-Tracker/blob/main/public/imgs/Monitor%20de%20Jogos.png?raw=true)

---

### 🎨 Gerenciador de Ícones
> Personalize os ícones dos jogos exibidos no dashboard.

![Ícones](https://github.com/guilhermealceu/Steins-Tracker/blob/main/public/imgs/Icons%20Save.png?raw=true)

---

### 🌌 Gerenciador de Wallpapers
> Selecione planos de fundo que combinam com seu estilo de jogo.

![Wallpapers](https://github.com/guilhermealceu/Steins-Tracker/blob/main/public/imgs/Wallpapers.png?raw=true)

---

## 🚀 Como Executar

1. Clone o repositório:
```bash
git clone https://github.com/guilhermealceu/Steins-Tracker.git
```

2. Instale as dependências:
```bash
cd Steins-Tracker
npm install
```

3. Execute o monitor de jogos:
```bash
node monitor.js
```

4. Em outro terminal, inicie o servidor web:
```bash
node server.js
```

5. Acesse via navegador:
```
http://localhost:3000
```

---

## 🧪 Tecnologias Usadas

- Node.js
- Express.js
- HTML5/CSS3
- JavaScript
- JSON para persistência local
- Bootstrap (customizado) e ícones SVG

---

## 📌 Observações

- O projeto não requer instalação de serviços externos.
- Todos os dados ficam salvos localmente.
- Suporte planejado para exportação de logs e sincronização futura via nuvem.

---

## 💡 Ideias Futuras

- Estatísticas semanais/mensais
- Backup automático na nuvem
- Integração com plataformas (Steam API, Epic Games)
- Gamificação do progresso

---

## ❗ATENÇÃO

Todos os prints e dados foram aleatorizados com jogos, horas e outros para gerar dashboards para você ver como é, caso queira começar do zero remova os dados dos jsons no data, nos logs, icones, backgrounds etc.
