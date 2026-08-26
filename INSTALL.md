# ELVIORA BEAST MODE - Complete Installation Guide

This guide covers setting up the full "Elviora" voice-assistant stack: speech recognition, wake-word detection, text-to-speech, an optional offline LLM via Ollama, and optional face recognition.

> Note: this file captures the installation steps as provided. Steps 2-3 and a few list items were not included in the source material and are left out rather than invented — fill them in as they become available.

## ⚡ Step 1: Install Python Packages

Install everything at once:

```bash
pip install anthropic requests langchain langchain-groq SpeechRecognition openai-whisper pyaudio openwakeword edge-tts
```

On Windows, `pyaudio` often fails to build from source — use `pipwin` instead:

```powershell
pip install pipwin
pipwin install pyaudio
```

## 🤖 Step 4: Install Ollama (Offline AI - Optional but Recommended)

1. Install Ollama

- ✅ Works offline (with Ollama installed)
- → Add your Groq API key to `.env` OR install Ollama
- → Run: `pip install edge-tts pygame` then restart

```
├── INSTALL.md          ← This guide
```

## Additional / Optional Components

Speech processing and browser automation:

```bash
pip install speechbrain torchaudio
pip install playwright beautifulsoup4
playwright install
pip install kokoro-onnx
```

**Custom "Elviora" wake word:**

```powershell
pip install openwakeword
```

**Face recognition (knows who you are):**

```bash
pip install face-recognition
```

2. Install it
3. Already has `pytesseract` installed
