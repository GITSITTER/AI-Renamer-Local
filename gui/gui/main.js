const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const os = require('os')
const axios = require('axios')

// Ollama API call
async function ollamaApi({ model, prompt, images, baseURL }) {
  const url = `${baseURL}/api/generate`
  const data = {
    model,
    prompt,
    stream: false
  }

  if (images && images.length > 0) {
    data.images = await Promise.all(images.map(async imagePath => {
      const imageData = await fs.readFile(imagePath)
      return imageData.toString('base64')
    }))
  }

  const apiResult = await axios({
    url,
    data,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    timeout: 120000
  })

  return apiResult.data.response
}

// OpenAI-compatible API call (OpenAI, LM Studio)
async function openaiApi({ model, prompt, images, apiKey, baseURL }) {
  const url = `${baseURL}/v1/chat/completions`
  const data = {
    model,
    stream: false
  }

  const messages = [{
    role: 'user',
    content: [
      { type: 'text', text: prompt }
    ]
  }]

  if (images && images.length > 0) {
    for (const imagePath of images) {
      const imageData = await fs.readFile(imagePath)
      messages[0].content.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${imageData.toString('base64')}` }
      })
    }
  }

  data.messages = messages

  const apiResult = await axios({
    url,
    data,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { Authorization: `Bearer ${apiKey}` })
    },
    timeout: 120000
  })

  return apiResult.data.choices[0].message.content
}

// Get model response based on provider
async function getModelResponse(options) {
  const { provider } = options

  if (provider === 'ollama') {
    return ollamaApi(options)
  } else if (provider === 'openai' || provider === 'lm-studio') {
    return openaiApi(options)
  } else {
    throw new Error('No supported provider found')
  }
}

// Change case function
async function changeCase({ text, _case }) {
  const changeCaseModule = await import('change-case')
  
  try {
    if (changeCaseModule[_case]) {
      return changeCaseModule[_case](text)
    }
    return changeCaseModule.kebabCase(text)
  } catch (err) {
    return changeCaseModule.kebabCase(text)
  }
}

// Safe rename with retry and copy-delete fallback for Windows
async function safeRename(oldPath, newPath, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Try standard rename first
      await fs.rename(oldPath, newPath)
      return
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EBUSY') {
        // Wait a bit for file locks to release
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (i === retries - 1) {
          // Last attempt: try copy + delete
          try {
            await fs.copyFile(oldPath, newPath)
            // Wait a moment then delete original
            await new Promise(resolve => setTimeout(resolve, 200))
            try {
              await fs.unlink(oldPath)
            } catch (unlinkErr) {
              // If we can't delete original, delete the copy and throw
              await fs.unlink(newPath)
              throw err
            }
            return
          } catch (copyErr) {
            throw err
          }
        }
      } else {
        throw err
      }
    }
  }
}

const CONFIG_FILE = path.join(os.homedir(), 'ai-renamer-gui.json')
const HISTORY_FILE = path.join(os.homedir(), 'ai-renamer-history.json')

let mainWindow

// Load configuration
async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    return {
      mode: 'local',
      provider: 'ollama',
      model: 'llava:13b',
      baseUrl: 'http://127.0.0.1:11434',
      apiKey: '',
      caseStyle: 'kebabCase',
      language: 'English',
      maxChars: 25,
      customInstructions: ''
    }
  }
}

// Save configuration
async function saveConfig(config) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
}

// Load history
async function loadHistory() {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    return []
  }
}

// Save history
async function saveHistory(history) {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2))
}

// Add to history
async function addToHistory(entry) {
  const history = await loadHistory()
  history.unshift({
    ...entry,
    date: new Date().toISOString(),
    id: Date.now()
  })
  // Keep only last 100 entries
  if (history.length > 100) {
    history.pop()
  }
  await saveHistory(history)
  return history
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? true : true,
    backgroundColor: '#ffffff',
    show: false
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('get-config', async () => {
  return await loadConfig()
})

ipcMain.handle('save-config', async (event, config) => {
  await saveConfig(config)
  return { success: true }
})

ipcMain.handle('get-history', async (event, { page = 1, limit = 10 }) => {
  const history = await loadHistory()
  const start = (page - 1) * limit
  const end = start + limit
  return {
    items: history.slice(start, end),
    total: history.length,
    page,
    totalPages: Math.ceil(history.length / limit)
  }
})

ipcMain.handle('clear-history', async () => {
  await saveHistory([])
  return { success: true }
})

// Supported file extensions
const SUPPORTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff',
  '.pdf', '.txt', '.md', '.json',
  '.mp4', '.avi', '.mov', '.mkv', '.webm',
  '.js', '.ts', '.py', '.html', '.css', '.xml', '.yaml', '.yml'
]

// Recursively get all files in a directory
async function getFilesRecursively(dirPath) {
  const files = []
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    
    if (entry.isDirectory()) {
      // Skip hidden directories and node_modules
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subFiles = await getFilesRecursively(fullPath)
        files.push(...subFiles)
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (SUPPORTED_EXTENSIONS.includes(ext) && !entry.name.startsWith('.')) {
        files.push({
          path: fullPath,
          name: entry.name,
          ext: ext
        })
      }
    }
  }
  
  return files
}

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Supported Files', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tif', 'tiff', 'pdf', 'txt', 'md', 'json', 'mp4', 'avi', 'mov', 'mkv', 'webm'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tif', 'tiff'] },
      { name: 'Documents', extensions: ['pdf', 'txt', 'md', 'json'] },
      { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm'] }
    ]
  })
  
  if (result.canceled) {
    return []
  }
  
  return result.filePaths.map(filePath => ({
    path: filePath,
    name: path.basename(filePath),
    ext: path.extname(filePath).toLowerCase()
  }))
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return []
  }
  
  try {
    const files = await getFilesRecursively(result.filePaths[0])
    return files
  } catch (err) {
    console.error('Error reading folder:', err)
    return []
  }
})

ipcMain.handle('get-available-models', async (event, { provider, baseUrl }) => {
  try {
    if (provider === 'ollama') {
      const response = await axios.get(`${baseUrl}/api/tags`)
      return response.data.models.map(m => m.name)
    } else if (provider === 'lm-studio') {
      const response = await axios.get(`${baseUrl}/v1/models`)
      return response.data.data.map(m => m.id)
    } else if (provider === 'openai') {
      return ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo']
    }
    
    return []
  } catch (err) {
    console.error('Error fetching models:', err.message)
    return []
  }
})

ipcMain.handle('rename-file', async (event, { filePath, config }) => {
  try {
    const fileName = path.basename(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const dirPath = path.dirname(filePath)
    
    // Determine content type and read content
    const imageExts = ['.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff']
    const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm']
    
    let images = []
    let content = null
    
    if (imageExts.includes(ext)) {
      images = [filePath]
    } else if (videoExts.includes(ext)) {
      // For videos, we'd need ffmpeg - for now, treat as unsupported
      return { 
        success: false, 
        error: 'Video processing requires ffmpeg. Please install ffmpeg to rename videos.',
        originalName: fileName
      }
    } else {
      // Text-based files
      if (ext === '.pdf') {
        const pdfParse = require('pdf-parse')
        const dataBuffer = await fs.readFile(filePath)
        const data = await pdfParse(dataBuffer)
        content = data.text.slice(0, 5000)
      } else {
        content = await fs.readFile(filePath, 'utf8')
        content = content.slice(0, 5000)
      }
      
      if (!content || content.trim().length === 0) {
        return { 
          success: false, 
          error: 'No text content found in file',
          originalName: fileName
        }
      }
    }
    
    // Build prompt
    const promptLines = [
      'Generate filename:',
      '',
      `Use ${config.caseStyle}`,
      `Max ${config.maxChars} characters`,
      `${config.language} only`,
      'No file extension',
      'No special chars',
      'Only key elements',
      'One word if possible',
      'Noun-verb format',
      '',
      'Respond ONLY with filename.'
    ]
    
    if (content) {
      promptLines.push('', 'Content:', content)
    }
    
    if (config.customInstructions) {
      promptLines.push('', 'Custom instructions:', config.customInstructions)
    }
    
    const prompt = promptLines.join('\n')
    
    // Get model response
    let baseURL = config.baseUrl
    if (config.provider === 'ollama' && !baseURL) {
      baseURL = 'http://127.0.0.1:11434'
    } else if (config.provider === 'lm-studio' && !baseURL) {
      baseURL = 'http://127.0.0.1:1234'
    } else if (config.provider === 'openai' && !baseURL) {
      baseURL = 'https://api.openai.com'
    }
    
    const modelResult = await getModelResponse({
      provider: config.provider,
      model: config.model,
      prompt,
      images,
      apiKey: config.apiKey,
      baseURL
    })
    
    // Process the result
    const maxChars = config.maxChars + 10
    const text = modelResult.trim().slice(-maxChars)
    const newBaseName = await changeCase({ text, _case: config.caseStyle })
    const newFileName = newBaseName + ext
    const newFilePath = path.join(dirPath, newFileName)
    
    // Check if file already exists
    let finalFileName = newFileName
    let finalFilePath = newFilePath
    
    try {
      await fs.access(newFilePath)
      // File exists, add a suffix
      const timestamp = Date.now()
      finalFileName = `${newBaseName}-${timestamp}${ext}`
      finalFilePath = path.join(dirPath, finalFileName)
    } catch (err) {
      // File doesn't exist, use original new name
    }
    
    // Perform the rename with retry logic
    await safeRename(filePath, finalFilePath)
    
    // Add to history
    await addToHistory({
      originalName: fileName,
      newName: finalFileName,
      status: 'success'
    })
    
    return {
      success: true,
      originalName: fileName,
      newName: finalFileName,
      newPath: finalFilePath
    }
  } catch (err) {
    console.error('Rename error:', err)
    
    // Add to history as failed
    await addToHistory({
      originalName: path.basename(filePath),
      newName: '-',
      status: 'failed',
      error: err.message
    })
    
    return {
      success: false,
      error: err.message,
      originalName: path.basename(filePath)
    }
  }
})

ipcMain.handle('check-ollama-status', async () => {
  try {
    await axios.get('http://127.0.0.1:11434/api/tags', { timeout: 3000 })
    return { running: true }
  } catch (err) {
    return { running: false }
  }
})

