let backgrounds = [];
let currentBackgroundIndex = 0;

async function loadBackgrounds() {
  try {
    const response = await fetch('/data/background.json');
    if (!response.ok) throw new Error('Falha ao carregar backgrounds');

    const data = await response.json();
    backgrounds = data.backgrounds;
    currentBackgroundIndex = data.current || 0;

    document.documentElement.style.setProperty('--bg-brightness', data.darken || 1);
    document.documentElement.style.setProperty('--bg-blur', `${data.blur || 0}px`);

    createBackgroundSelector();

    const bgEnabled = localStorage.getItem('bgEnabled') !== 'false';
    document.getElementById('bgEnableToggle').checked = bgEnabled;

    if (bgEnabled) {
      applyBackground(currentBackgroundIndex);
    } else {
      setDefaultBackground();
    }

  } catch (error) {
    console.error('Erro ao carregar backgrounds:', error);
    setDefaultBackground();
  }
}

function applyBackground(index) {
  if (!backgrounds[index]) {
    setDefaultBackground();
    return;
  }

  const bg = backgrounds[index];

  document.body.style.backgroundImage = `url('${bg.image}')`;
  document.body.classList.add('has-custom-bg');

  if (bg.color) {
    document.documentElement.style.setProperty('--primary', bg.color);
    document.documentElement.style.setProperty('--primary-dark', darkenColor(bg.color, 20));
  }

  updateCurrentBackground(index);
}

function setDefaultBackground() {
  document.body.style.backgroundImage = 'none';
  document.body.classList.remove('has-custom-bg');
  document.documentElement.style.setProperty('--primary', '#00ff88');
  document.documentElement.style.setProperty('--primary-dark', '#00cc6a');
}

function updateCurrentBackground(index) {
  currentBackgroundIndex = index;

  fetch('/api/update-background', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ current: index })
  }).catch(console.error);
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return `#${(
    0x1000000 +
    (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 +
    (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 +
    (B < 0 ? 0 : B > 255 ? 255 : B)
  ).toString(16).slice(1)}`;
}

function createBackgroundSelector() {
  const selector = document.createElement('div');
  selector.className = 'background-selector';

  selector.innerHTML = `
    <div class="background-btn" id="bgToggleBtn" title="Selecionar Plano de Fundo">
      <i class="fas fa-image"></i>
      <span class="bg-current-name">${backgrounds[currentBackgroundIndex]?.name || 'Fundo'}</span>
    </div>

    <div class="background-options" id="bgOptions">
      <div class="bg-options-header">
  <h4>Selecionar Plano de Fundo</h4>
  <div class="bg-options-actions">
    <button class="bg-close-btn" id="bgCloseBtn" title="Fechar">&times;</button>
    <button class="bg-close-btn" id="goToBackgroundsBtn" title="Ir para Backgrounds">&#8594;</button>
  </div>
</div>
<div class="bg-toggle-wrapper">
  <label class="bg-toggle-container">
    <input type="checkbox" id="bgEnableToggle" checked />
    <span>Ativar plano de fundo</span>
  </label>
</div>

      <div class="bg-options-grid">
        ${backgrounds.map((bg, index) => `
          <div class="bg-option ${index === currentBackgroundIndex ? 'active' : ''}" 
               data-index="${index}"
               style="${bg.color ? `border-color: ${bg.color}` : ''}">
            <div class="bg-thumbnail" 
                 style="background-image: url('${bg.thumbnail || bg.image}')"></div>
            <div class="bg-info">
              <div class="bg-name">${bg.name}</div>
              <div class="bg-author">por ${bg.author}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(selector);

  // Eventos
  document.getElementById('bgToggleBtn').addEventListener('click', toggleBgMenu);
  document.getElementById('bgCloseBtn').addEventListener('click', toggleBgMenu);
  document.getElementById('goToBackgroundsBtn').addEventListener('click', () => {
    window.location.href = 'http://localhost:3000/backgrounds.html';
  });

  document.querySelectorAll('.bg-option').forEach(option => {
    option.addEventListener('click', function () {
      const index = parseInt(this.dataset.index);
      selectBackground(index);
    });
  });

  document.getElementById('bgEnableToggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem('bgEnabled', enabled);
    if (enabled) {
      applyBackground(currentBackgroundIndex);
    } else {
      setDefaultBackground();
    }
  });
}

function toggleBgMenu() {
  const options = document.getElementById('bgOptions');
  options.style.display = options.style.display === 'block' ? 'none' : 'block';
}

function selectBackground(index) {
  applyBackground(index);

  document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('active'));
  document.querySelector(`.bg-option[data-index="${index}"]`).classList.add('active');

  document.querySelector('.bg-current-name').textContent = backgrounds[index].name;

  toggleBgMenu();
}

window.addEventListener('DOMContentLoaded', loadBackgrounds);
