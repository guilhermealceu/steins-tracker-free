class MusicPlayer {
    constructor() {
        this.musicList = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.audioPlayer = null;
        this.nowPlaying = null;
    }

    async init() {
        // Buscar automaticamente as músicas
        await this.fetchMusicList();
        
        // Criar elementos do player
        const playerContainer = document.createElement('div');
        playerContainer.className = 'music-player';
        
        playerContainer.innerHTML = `
            <audio id="audio-player" preload="auto"></audio>
            <span id="now-playing">${this.musicList.length ? 'Pronto para tocar' : 'Nenhuma música encontrada'}</span>
            <button class="music-btn" id="btn-play" title="Tocar/Pausar">
                <i class="fas fa-play"></i>
            </button>
            <button class="music-btn" id="btn-next" title="Próxima música">
                <i class="fas fa-forward"></i>
            </button>
        `;

        // Inserir o player na página
        const controls = document.querySelector('.controls');
        if (controls) {
            controls.appendChild(playerContainer);
        } else {
            document.body.insertAdjacentElement('afterbegin', playerContainer);
        }

        // Inicializar elementos
        this.audioPlayer = document.getElementById('audio-player');
        this.nowPlaying = document.getElementById('now-playing');
        this.playBtn = document.getElementById('btn-play');
        this.nextBtn = document.getElementById('btn-next');

        // Configurar eventos
        this.setupEvents();
    }

    async fetchMusicList() {
    try {
        const response = await fetch('/api/musicas');
        if (!response.ok) throw new Error('Falha ao buscar músicas');
        this.musicList = await response.json();
        
        if (this.musicList.length === 0) {
            console.warn('Nenhuma música encontrada na pasta /assets/sounds/');
        }
    } catch (error) {
        console.error('Erro ao carregar músicas:', error);
        // Fallback para desenvolvimento
        this.musicList = [
            'musica1.mp3',
            'musica2.mp3',
            'musica3.mp3'
        ].filter(Boolean);
    }
}

    loadRandomTrack() {
        if (!this.musicList.length) return;
        
        // Se for a primeira música ou acabou a lista, começa aleatório
        if (this.currentTrackIndex === -1 || this.currentTrackIndex >= this.musicList.length - 1) {
            this.currentTrackIndex = Math.floor(Math.random() * this.musicList.length);
        } else {
            this.currentTrackIndex++;
        }
        
        this.audioPlayer.src = `/assets/sounds/${this.musicList[this.currentTrackIndex]}`;
        this.nowPlaying.textContent = this.musicList[this.currentTrackIndex].replace('.mp3', '');
        this.playTrack();
    }

    playTrack() {
        this.audioPlayer.play()
            .then(() => {
                this.isPlaying = true;
                this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            })
            .catch(error => {
                console.error('Erro ao reproduzir música:', error);
            });
    }

    pauseTrack() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

    setupEvents() {
        this.playBtn.addEventListener('click', () => {
            if (!this.musicList.length) return;
            
            if (this.currentTrackIndex === -1) {
                this.loadRandomTrack();
            } else if (this.isPlaying) {
                this.pauseTrack();
            } else {
                this.playTrack();
            }
        });

        this.nextBtn.addEventListener('click', () => {
            if (!this.musicList.length) return;
            this.loadRandomTrack();
        });

        this.audioPlayer.addEventListener('ended', () => {
            this.loadRandomTrack();
        });
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const player = new MusicPlayer();
    player.init();
});