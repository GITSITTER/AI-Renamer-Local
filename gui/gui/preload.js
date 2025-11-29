const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // File operations
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  renameFile: (data) => ipcRenderer.invoke('rename-file', data),
  
  // History
  getHistory: (params) => ipcRenderer.invoke('get-history', params),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  
  // Model operations
  getAvailableModels: (params) => ipcRenderer.invoke('get-available-models', params),
  checkOllamaStatus: () => ipcRenderer.invoke('check-ollama-status'),
  
  // Event listeners for drag and drop
  onFileDrop: (callback) => {
    document.addEventListener('drop', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const files = []
      for (const file of e.dataTransfer.files) {
        files.push({
          path: file.path,
          name: file.name,
          ext: file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
        })
      }
      callback(files)
    })
    
    document.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
  }
})

