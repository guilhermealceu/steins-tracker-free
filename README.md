# 🎮 tracKerGG

**tracKerGG** é uma ferramenta de monitoramento local que registra o tempo de jogo em seu PC de forma automática e visual, através de gráficos interativos. Ideal para jogadores que desejam acompanhar sua rotina gamer ou até mesmo pais que queiram visualizar o tempo de uso.

---

## 🧠 Funcionalidades

- ⏱️ **Monitoramento automático** dos jogos em execução
- 📁 Suporte a jogos da **Steam, Epic, Origin ou instalação manual**
- ✅ Interface Web para **selecionar quais jogos monitorar**
- 📊 Página principal com **gráficos interativos** de tempo total por jogo
- 💾 Armazena os logs localmente em `jogos_log.json`
- 🔔 Notificações na área de trabalho ao iniciar/encerrar um jogo

---

## 🖼️ Interface

### 📍 Página principal – Dashboard de Jogos
> Exibe tempo total jogado por título

![Dashboard](https://github.com/guilhermealceu/tracKerGG/blob/main/public/imgs/Dashboard.png?raw=true)

### 🎯 Seletor de Jogos
> Escolha os jogos que você quer monitorar

![Seletor de Jogos](https://github.com/guilhermealceu/tracKerGG/blob/main/public/imgs/Seletor%20de%20Jogos.png?raw=true)

> 📝 Você também pode adicionar jogos manualmente usando o botão "➕ Adicionar jogo via EXE".

---

## 🛠️ Como executar

```bash
git clone https://github.com/seu-usuario/tracKerGG.git
cd tracKerGG
npm install
node monitor.js   # para iniciar o monitoramento dos jogos
node server.js    # para iniciar o servidor web (http://localhost:3000)
