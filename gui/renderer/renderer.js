// State management
let config = {
  mode: 'local',
  provider: 'ollama',
  model: 'llava:13b',
  baseUrl: 'http://127.0.0.1:11434',
  apiKey: '',
  caseStyle: 'kebabCase',
  language: 'English',
  maxChars: 25,
  customInstructions: ''
};

let fileQueue = [];
let currentPage = 1;
let historyData = { items: [], total: 0, totalPages: 0 };

// DOM Elements
const pages = {
  home: document.getElementById('homePage'),
  settings: document.getElementById('settingsPage'),
  history: document.getElementById('historyPage')
};

const elements = {
  // Header
  backBtn: document.getElementById('backBtn'),
  pageTitle: document.getElementById('pageTitle'),
  historyBtn: document.getElementById('historyBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  
  // Home page
  dropZone: document.getElementById('dropZone'),
  selectFilesBtn: document.getElementById('selectFilesBtn'),
  selectFolderBtn: document.getElementById('selectFolderBtn'),
  fileQueue: document.getElementById('fileQueue'),
  queueList: document.getElementById('queueList'),
  clearQueueBtn: document.getElementById('clearQueueBtn'),
  addMoreBtn: document.getElementById('addMoreBtn'),
  renameAllBtn: document.getElementById('renameAllBtn'),
  
  // Settings page
  cloudModeBtn: document.getElementById('cloudModeBtn'),
  localModeBtn: document.getElementById('localModeBtn'),
  modeDescription: document.getElementById('modeDescription'),
  cloudSettings: document.getElementById('cloudSettings'),
  localSettings: document.getElementById('localSettings'),
  provider: document.getElementById('provider'),
  model: document.getElementById('model'),
  modelSuggestions: document.getElementById('modelSuggestions'),
  apiKey: document.getElementById('apiKey'),
  apiKeyGroup: document.getElementById('apiKeyGroup'),
  baseUrl: document.getElementById('baseUrl'),
  imageModel: document.getElementById('imageModel'),
  textModel: document.getElementById('textModel'),
  caseStyle: document.getElementById('caseStyle'),
  language: document.getElementById('language'),
  maxChars: document.getElementById('maxChars'),
  customInstructions: document.getElementById('customInstructions'),
  signOutBtn: document.getElementById('signOutBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  
  // History page
  historyBody: document.getElementById('historyBody'),
  emptyHistory: document.getElementById('emptyHistory'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageInfo: document.getElementById('pageInfo'),
  
  // Modals
  processingModal: document.getElementById('processingModal'),
  processingStatus: document.getElementById('processingStatus'),
  progressFill: document.getElementById('progressFill'),
  
  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// Initialize app
async function init() {
  await loadConfig();
  setupEventListeners();
  setupDragAndDrop();
  updateUI();
}

// Load configuration
async function loadConfig() {
  try {
    const savedConfig = await window.electronAPI.getConfig();
    config = { ...config, ...savedConfig };
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  elements.settingsBtn.addEventListener('click', () => navigateTo('settings'));
  elements.historyBtn.addEventListener('click', () => {
    navigateTo('history');
    loadHistory();
  });
  elements.backBtn.addEventListener('click', () => navigateTo('home'));
  
  // File selection
  elements.selectFilesBtn.addEventListener('click', selectFiles);
  elements.selectFolderBtn.addEventListener('click', selectFolder);
  elements.addMoreBtn.addEventListener('click', selectFiles);
  elements.clearQueueBtn.addEventListener('click', clearQueue);
  elements.renameAllBtn.addEventListener('click', renameAllFiles);
  
  // Settings - Mode toggle
  elements.cloudModeBtn.addEventListener('click', () => setMode('cloud'));
  elements.localModeBtn.addEventListener('click', () => setMode('local'));
  
  // Settings - Provider change
  elements.provider.addEventListener('change', onProviderChange);
  
  // Settings - Model input with suggestions
  elements.model.addEventListener('focus', fetchModelSuggestions);
  elements.model.addEventListener('input', () => {
    elements.modelSuggestions.classList.remove('hidden');
  });
  
  // Settings - Save
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Settings - Sign out (reset to defaults)
  elements.signOutBtn.addEventListener('click', resetSettings);
  
  // History pagination
  elements.prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadHistory();
    }
  });
  elements.nextPageBtn.addEventListener('click', () => {
    if (currentPage < historyData.totalPages) {
      currentPage++;
      loadHistory();
    }
  });
  
  // Click outside model suggestions to close
  document.addEventListener('click', (e) => {
    if (!elements.model.contains(e.target) && !elements.modelSuggestions.contains(e.target)) {
      elements.modelSuggestions.classList.add('hidden');
    }
  });
}

// Setup drag and drop
function setupDragAndDrop() {
  const dropZone = elements.dropZone;
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('drag-over');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('drag-over');
    }, false);
  });
  
  dropZone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e) {
  const files = [];
  for (const file of e.dataTransfer.files) {
    files.push({
      path: file.path,
      name: file.name,
      ext: file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    });
  }
  addFilesToQueue(files);
}

// Navigation
function navigateTo(page) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  pages[page].classList.add('active');
  
  if (page === 'home') {
    elements.backBtn.classList.add('hidden');
    elements.pageTitle.textContent = 'AI Renamer';
  } else {
    elements.backBtn.classList.remove('hidden');
    elements.pageTitle.textContent = page === 'settings' ? 'Settings' : 'History';
  }
}

// File operations
async function selectFiles() {
  try {
    const files = await window.electronAPI.selectFiles();
    if (files.length > 0) {
      addFilesToQueue(files);
    }
  } catch (err) {
    showToast('Failed to select files', 'error');
  }
}

async function selectFolder() {
  try {
    const files = await window.electronAPI.selectFolder();
    if (files.length > 0) {
      addFilesToQueue(files);
      showToast(`Found ${files.length} file(s) in folder`, 'info');
    }
  } catch (err) {
    showToast('Failed to select folder', 'error');
  }
}

function addFilesToQueue(files) {
  const newFiles = files.filter(file => 
    !fileQueue.some(f => f.path === file.path)
  );
  
  fileQueue.push(...newFiles.map(file => ({
    ...file,
    status: 'pending',
    newName: null
  })));
  
  updateQueueUI();
  
  if (fileQueue.length > 0) {
    elements.fileQueue.classList.remove('hidden');
    elements.dropZone.style.minHeight = '200px';
  }
}

function removeFromQueue(index) {
  fileQueue.splice(index, 1);
  updateQueueUI();
  
  if (fileQueue.length === 0) {
    elements.fileQueue.classList.add('hidden');
    elements.dropZone.style.minHeight = '400px';
  }
}

function clearQueue() {
  fileQueue = [];
  updateQueueUI();
  elements.fileQueue.classList.add('hidden');
  elements.dropZone.style.minHeight = '400px';
}

function updateQueueUI() {
  elements.queueList.innerHTML = '';
  
  fileQueue.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'queue-item';
    
    const iconSvg = getFileIcon(file.ext);
    
    let statusHtml = '';
    if (file.status === 'success') {
      statusHtml = `<span class="queue-item-status success">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        ${file.newName || 'Renamed'}
      </span>`;
    } else if (file.status === 'error') {
      statusHtml = `<span class="queue-item-status error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        Failed
      </span>`;
    } else if (file.status === 'processing') {
      statusHtml = `<span class="queue-item-status">Processing...</span>`;
    }
    
    item.innerHTML = `
      <div class="queue-item-icon">${iconSvg}</div>
      <div class="queue-item-info">
        <div class="queue-item-name">${file.name}</div>
        <div class="queue-item-ext">${file.ext.replace('.', '')}</div>
      </div>
      ${statusHtml}
      <button class="queue-item-remove" data-index="${index}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    
    elements.queueList.appendChild(item);
  });
  
  // Add remove button listeners
  document.querySelectorAll('.queue-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      removeFromQueue(index);
    });
  });
}

function getFileIcon(ext) {
  const imageExts = ['.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff', '.gif', '.webp'];
  const videoExts = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
  const docExts = ['.pdf', '.doc', '.docx'];
  
  if (imageExts.includes(ext)) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`;
  } else if (videoExts.includes(ext)) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>`;
  } else if (docExts.includes(ext)) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>`;
  } else {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>`;
  }
}

// Rename files
async function renameAllFiles() {
  const pendingFiles = fileQueue.filter(f => f.status === 'pending');
  if (pendingFiles.length === 0) {
    showToast('No files to rename', 'info');
    return;
  }
  
  // Check if Ollama is running for local mode
  if (config.mode === 'local' && config.provider === 'ollama') {
    const status = await window.electronAPI.checkOllamaStatus();
    if (!status.running) {
      showToast('Ollama is not running. Please start Ollama first.', 'error');
      return;
    }
  }
  
  elements.processingModal.classList.remove('hidden');
  elements.renameAllBtn.disabled = true;
  
  let completed = 0;
  const total = pendingFiles.length;
  
  for (const file of pendingFiles) {
    const index = fileQueue.findIndex(f => f.path === file.path);
    if (index === -1) continue;
    
    fileQueue[index].status = 'processing';
    updateQueueUI();
    
    elements.processingStatus.textContent = `Renaming file ${completed + 1} of ${total}...`;
    elements.progressFill.style.width = `${(completed / total) * 100}%`;
    
    try {
      const result = await window.electronAPI.renameFile({
        filePath: file.path,
        config: config
      });
      
      if (result.success) {
        fileQueue[index].status = 'success';
        fileQueue[index].newName = result.newName;
        fileQueue[index].path = result.newPath;
      } else {
        fileQueue[index].status = 'error';
        fileQueue[index].error = result.error;
        showToast(`Failed to rename ${file.name}: ${result.error}`, 'error');
      }
    } catch (err) {
      fileQueue[index].status = 'error';
      fileQueue[index].error = err.message;
      showToast(`Error renaming ${file.name}`, 'error');
    }
    
    completed++;
    updateQueueUI();
  }
  
  elements.progressFill.style.width = '100%';
  
  setTimeout(() => {
    elements.processingModal.classList.add('hidden');
    elements.renameAllBtn.disabled = false;
    
    const successCount = fileQueue.filter(f => f.status === 'success').length;
    if (successCount > 0) {
      showToast(`Successfully renamed ${successCount} file(s)`, 'success');
    }
  }, 500);
}

// Settings
function setMode(mode) {
  config.mode = mode;
  
  elements.cloudModeBtn.classList.toggle('active', mode === 'cloud');
  elements.localModeBtn.classList.toggle('active', mode === 'local');
  
  elements.cloudSettings.classList.toggle('hidden', mode !== 'cloud');
  elements.localSettings.classList.toggle('hidden', mode !== 'local');
  
  elements.modeDescription.textContent = mode === 'cloud' 
    ? 'Files are processed privately in the cloud.'
    : 'Files are processed privately on your computer.';
}

function onProviderChange() {
  const provider = elements.provider.value;
  config.provider = provider;
  
  // Show/hide API key field
  elements.apiKeyGroup.style.display = provider === 'openai' ? 'block' : 'none';
  
  // Update base URL placeholder
  const baseUrlPlaceholders = {
    ollama: 'http://127.0.0.1:11434',
    'lm-studio': 'http://127.0.0.1:1234',
    openai: 'https://api.openai.com'
  };
  elements.baseUrl.placeholder = baseUrlPlaceholders[provider] || '';
  
  // Clear model suggestions when provider changes
  elements.modelSuggestions.classList.add('hidden');
  elements.modelSuggestions.innerHTML = '';
}

async function fetchModelSuggestions() {
  const provider = elements.provider.value;
  const baseUrl = elements.baseUrl.value || getDefaultBaseUrl(provider);
  
  try {
    const models = await window.electronAPI.getAvailableModels({ provider, baseUrl });
    
    elements.modelSuggestions.innerHTML = '';
    
    if (models.length === 0) {
      elements.modelSuggestions.innerHTML = '<div class="model-suggestion">No models found</div>';
    } else {
      models.forEach(model => {
        const div = document.createElement('div');
        div.className = 'model-suggestion';
        div.textContent = model;
        div.addEventListener('click', () => {
          elements.model.value = model;
          elements.modelSuggestions.classList.add('hidden');
        });
        elements.modelSuggestions.appendChild(div);
      });
    }
    
    elements.modelSuggestions.classList.remove('hidden');
  } catch (err) {
    elements.modelSuggestions.innerHTML = '<div class="model-suggestion">Failed to fetch models</div>';
    elements.modelSuggestions.classList.remove('hidden');
  }
}

function getDefaultBaseUrl(provider) {
  const defaults = {
    ollama: 'http://127.0.0.1:11434',
    'lm-studio': 'http://127.0.0.1:1234',
    openai: 'https://api.openai.com'
  };
  return defaults[provider] || '';
}

async function saveSettings() {
  config.mode = elements.cloudModeBtn.classList.contains('active') ? 'cloud' : 'local';
  config.provider = elements.provider.value;
  config.model = elements.model.value;
  config.apiKey = elements.apiKey.value;
  config.baseUrl = elements.baseUrl.value || getDefaultBaseUrl(config.provider);
  config.caseStyle = elements.caseStyle.value;
  config.language = elements.language.value;
  config.maxChars = parseInt(elements.maxChars.value) || 25;
  config.customInstructions = elements.customInstructions.value;
  
  // Cloud mode settings
  if (config.mode === 'cloud') {
    config.imageModel = elements.imageModel.value;
    config.textModel = elements.textModel.value;
  }
  
  try {
    await window.electronAPI.saveConfig(config);
    showToast('Settings saved successfully', 'success');
    navigateTo('home');
  } catch (err) {
    showToast('Failed to save settings', 'error');
  }
}

async function resetSettings() {
  config = {
    mode: 'local',
    provider: 'ollama',
    model: 'llava:13b',
    baseUrl: 'http://127.0.0.1:11434',
    apiKey: '',
    caseStyle: 'kebabCase',
    language: 'English',
    maxChars: 25,
    customInstructions: ''
  };
  
  await window.electronAPI.saveConfig(config);
  updateUI();
  showToast('Settings reset to defaults', 'info');
}

// History
async function loadHistory() {
  try {
    historyData = await window.electronAPI.getHistory({ page: currentPage, limit: 10 });
    updateHistoryUI();
  } catch (err) {
    showToast('Failed to load history', 'error');
  }
}

function updateHistoryUI() {
  elements.historyBody.innerHTML = '';
  
  if (historyData.items.length === 0) {
    elements.emptyHistory.classList.add('visible');
    elements.prevPageBtn.disabled = true;
    elements.nextPageBtn.disabled = true;
    elements.pageInfo.textContent = 'Page 1 of 0';
    return;
  }
  
  elements.emptyHistory.classList.remove('visible');
  
  historyData.items.forEach(item => {
    const row = document.createElement('tr');
    const date = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const statusClass = item.status === 'success' ? 'success' : 'failed';
    const statusText = item.status === 'success' ? 'Success' : 'Failed';
    
    row.innerHTML = `
      <td>${escapeHtml(item.originalName)}</td>
      <td>${escapeHtml(item.newName)}</td>
      <td>${date}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
    `;
    
    elements.historyBody.appendChild(row);
  });
  
  // Update pagination
  elements.prevPageBtn.disabled = currentPage <= 1;
  elements.nextPageBtn.disabled = currentPage >= historyData.totalPages;
  elements.pageInfo.textContent = `Page ${currentPage} of ${historyData.totalPages || 1}`;
}

// Update UI from config
function updateUI() {
  // Mode
  setMode(config.mode);
  
  // Provider and model
  elements.provider.value = config.provider;
  elements.model.value = config.model;
  elements.apiKey.value = config.apiKey;
  elements.baseUrl.value = config.baseUrl;
  
  // Show API key field if OpenAI
  elements.apiKeyGroup.style.display = config.provider === 'openai' ? 'block' : 'none';
  
  // Output settings
  elements.caseStyle.value = config.caseStyle;
  elements.language.value = config.language;
  elements.maxChars.value = config.maxChars;
  elements.customInstructions.value = config.customInstructions || '';
  
  // Cloud settings
  if (config.imageModel) elements.imageModel.value = config.imageModel;
  if (config.textModel) elements.textModel.value = config.textModel;
}

// Toast notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`;
  }
  
  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-message">${escapeHtml(message)}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

