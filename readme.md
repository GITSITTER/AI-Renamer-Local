# ai-renamer

A Node.js CLI that uses Ollama and LM Studio models (Llava, Gemma, Llama etc.) to intelligently rename files by their contents

[![npm](https://img.shields.io/npm/v/ai-renamer.svg?style=flat-square)](https://www.npmjs.com/package/ai-renamer)
[![license](https://img.shields.io/npm/l/ai-renamer?style=flat-square)](https://github.com/ozgrozer/ai-renamer/blob/main/license)

## Desktop Application

### GUI Version (Windows)

A beautiful desktop application with drag-and-drop support, settings panel, and history tracking.

**Download**: Get the installer from the [Releases](../../releases) page or build from source:

```bash
cd gui
npm install
npm run build:win
```

**Features**:
- 🎨 Modern UI with dark mode
- 📁 Drag & drop files or folders
- 📂 Recursive folder processing
- ⚙️ Visual settings panel
- 📊 Rename history tracking
- 🔒 Local AI processing (Ollama/LM Studio)

See [gui/README.md](gui/README.md) for detailed documentation.

## Preview


## Usage

You need to have [Ollama](https://ollama.com/download) or [LM Studio](https://lmstudio.ai/) and at least one LLM (Llava, Gemma, Llama etc.) installed on your system. You need to have [ffmpeg](https://www.ffmpeg.org/download.html) to rename videos.

## Ollama Usage

Ollama is the default provider so you don't have to do anything. You can just run `npx ai-renamer /images`. At the first launch it will try to auto-select the Llava model but if it couldn't do that you can specify the model.

## LM Studio Usage

You need to set the provider as `lm-studio` and it will auto-select the loaded model in LM Studio.

## OpenAI Usage

You need to set the provider as `openai` and the api-key with your API key and it will auto-select the gpt-4o model. But you can assign any model with `--model` flag.

## License

[GPL-3.0](https://github.com/ozgrozer/ai-renamer/blob/main/license)
