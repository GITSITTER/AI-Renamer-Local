# AI Renamer - Desktop Application

A beautiful, modern desktop application for intelligently renaming files using local AI models (Ollama, LM Studio) or cloud APIs (OpenAI). Rename images, documents, and videos based on their content using AI vision and language models.

![AI Renamer](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

## ✨ Features

- 🎨 **Modern UI** - Clean, intuitive interface with dark mode support
- 📁 **Drag & Drop** - Simply drag files or folders into the app
- 📂 **Folder Support** - Recursively rename all files in a folder
- 🤖 **Local AI Processing** - Works with Ollama or LM Studio (no cloud required)
- ☁️ **Cloud Support** - Optional OpenAI API integration
- 🎯 **Multiple Case Styles** - Kebab, camel, pascal, snake, and more
- 🌐 **Multi-language** - Generate filenames in any language
- 📊 **History Tracking** - View all renamed files with status
- ⚙️ **Customizable** - Custom instructions, character limits, and more
- 🔒 **Privacy First** - All processing happens locally (unless using cloud mode)

## 📋 Requirements

### Required
- **Windows 10/11** (64-bit)
- **Ollama** - Download from [ollama.com](https://ollama.com/download)
- **Vision Model** - Install a vision-capable model:
  ```bash
  ollama pull llava:13b
  ```

### Optional
- **ffmpeg** - Required only for video file renaming ([Download](https://ffmpeg.org/download.html))
- **LM Studio** - Alternative to Ollama ([Download](https://lmstudio.ai/))

## 🚀 Installation

### Option 1: Installer (Recommended)

1. Download `AI Renamer-Setup-1.0.0.exe` from the [Releases](../../releases) page
2. Run the installer
3. Choose your installation directory
4. The installer will create desktop and Start Menu shortcuts automatically

### Option 2: Portable Version

1. Download and extract `win-unpacked.zip` from the [Releases](../../releases) page
2. Run `AI Renamer.exe` directly (no installation needed)

### Option 3: Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-renamer.git
cd ai-renamer/gui

# Install dependencies
npm install

# Run in development mode
npm start

# Build installer
npm run build:win
```

## 🎯 Quick Start

1. **Install Ollama** (if not already installed)
   - Download from [ollama.com](https://ollama.com/download)
   - Run `ollama pull llava:13b` to install a vision model

2. **Launch AI Renamer**
   - Double-click the desktop shortcut or find it in Start Menu

3. **Configure Settings** (First Time)
   - Click the ⚙️ settings icon
   - Select "Local" mode
   - Choose "Ollama" as provider
   - Set model to `llava:13b` (or your preferred model)
   - Configure output settings (case style, language, etc.)
   - Click "Save Changes"

4. **Rename Files**
   - Drag and drop files or folders onto the app
   - Or click "Select Files" / "Select Folder"
   - Click "Rename All" to process

## 📖 Usage Guide

### Renaming Files

#### Single Files
- Drag files onto the drop zone, or
- Click "Select Files" to browse

#### Folders
- Click "Select Folder" to choose a directory
- The app will recursively find all supported files
- All files will be added to the queue

#### Supported File Types

**Images:**
- JPG, JPEG, PNG, BMP, TIFF

**Documents:**
- PDF, TXT, MD, JSON

**Videos:**
- MP4, AVI, MOV, MKV, WEBM (requires ffmpeg)

**Code Files:**
- JS, TS, PY, HTML, CSS, XML, YAML, and more

### Settings Configuration

#### Local Mode (Recommended)
- **Provider**: Ollama or LM Studio
- **Model**: Your installed model (e.g., `llava:13b`)
- **Base URL**: Default is `http://127.0.0.1:11434` for Ollama

#### Cloud Mode
- **Image Model**: GPT-4o, Llama 4 Scout, etc.
- **Text Model**: GPT-3.5 Turbo, GPT-4o, etc.
- Requires API key

#### Output Settings
- **Case Style**: Choose from 10+ formats (kebab-case, camelCase, etc.)
- **Language**: Select output language (English, Spanish, French, etc.)
- **Max Characters**: Limit filename length (default: 25)
- **Custom Instructions**: Add specific requirements for AI

### History

- Click the 🕐 history icon to view all renamed files
- See original names, new names, dates, and status
- Navigate through pages if you have many entries

## 🔧 Configuration

Settings are stored in:
- **Windows**: `C:\Users\<YourUsername>\ai-renamer-gui.json`
- **History**: `C:\Users\<YourUsername>\ai-renamer-history.json`

You can edit these files directly or use the Settings UI.

## 🛠️ Troubleshooting

### "Ollama is not running"
- Make sure Ollama is installed and running
- Check if it's accessible at `http://127.0.0.1:11434`
- Start Ollama: `ollama serve`

### "Model not found"
- Install a vision model: `ollama pull llava:13b`
- Or use a text-only model for documents: `ollama pull llama3`

### "EPERM: operation not permitted"
- Close the file if it's open in another program
- Close File Explorer if previewing the folder
- The app will retry automatically with a copy-delete fallback

### Videos not processing
- Install ffmpeg and add it to your PATH
- Restart the app after installing ffmpeg

### App won't start
- Make sure you have Windows 10/11 (64-bit)
- Try running as Administrator
- Check Windows Event Viewer for error details

## 🏗️ Building from Source

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

### Build Steps

```bash
# Navigate to gui directory
cd gui

# Install dependencies
npm install

# Development mode
npm start

# Build Windows installer
npm run build:win

# Build portable version
npm run build:portable
```

The installer will be in `gui/dist/` directory.

## 📝 Case Styles

The app supports multiple case styles:

| Style | Example | Output |
|-------|---------|--------|
| Kebab case | `two-words` | `my-file-name` |
| Camel case | `twoWords` | `myFileName` |
| Pascal case | `TwoWords` | `MyFileName` |
| Snake case | `two_words` | `my_file_name` |
| Capital case | `Two Words` | `My File Name` |
| Constant case | `TWO_WORDS` | `MY_FILE_NAME` |
| Dot case | `two.words` | `my.file.name` |
| No case | `two words` | `my file name` |
| Sentence case | `Two words` | `My file name` |
| Train case | `Two-Words` | `My-File-Name` |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- AI models powered by [Ollama](https://ollama.com/) and [LM Studio](https://lmstudio.ai/)
- Uses [change-case](https://github.com/blakeembrey/change-case) for case conversion

## 📞 Support

- 🐛 **Bug Reports**: [Open an Issue](../../issues)
- 💡 **Feature Requests**: [Open an Issue](../../issues)
- 📧 **Questions**: Check existing issues or open a new one

## 🗺️ Roadmap

- [ ] macOS support
- [ ] Linux support
- [ ] Batch processing improvements
- [ ] Preview before renaming
- [ ] Undo functionality
- [ ] Custom icon support
- [ ] More AI providers

---

**Made with ❤️ for efficient file management**
