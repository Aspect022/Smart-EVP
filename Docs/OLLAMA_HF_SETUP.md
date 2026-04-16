# SmartEVP+ Ollama and Hugging Face Setup Guide

This guide explains:

1. how to set up `OLLAMA_BASE_URL` for SmartEVP+
2. how to get a Hugging Face API key for `HF_API_KEY`
3. how both values connect to the backend `.env`

This project uses:

- `OLLAMA_BASE_URL` for medical brief generation with Gemma
- `HF_API_KEY` for ASR/transcription fallback or live transcription flow

## 1. Where These Values Go

Put both values in:

- [Backend/.env](/D:/Projects/SmartEVP+/Backend/.env)

Example:

```env
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OLLAMA_BASE_URL=http://10.1.16.183:11434
OLLAMA_MODEL=gemma2:2b
```

The example template already exists here:

- [Backend/.env.example](/D:/Projects/SmartEVP+/Backend/.env.example)

## 2. Ollama Setup

### What `OLLAMA_BASE_URL` Means

This is the HTTP address of the machine running Ollama.

For most local setups on the same laptop:

```env
OLLAMA_BASE_URL=http://10.1.16.183:11434
```

If Ollama is running on another machine in your local network:

```env
OLLAMA_BASE_URL=http://10.1.16.183:11434
```

### Install Ollama

Download Ollama from:

- `https://ollama.com/download`

Install it, then open a terminal and check it:

```powershell
ollama --version
```

### Start Ollama

In most cases, installing Ollama also starts the local service. If needed, run:

```powershell
ollama serve
```

Leave that terminal open if your setup requires it.

### Download the Model

This project expects:

```powershell
ollama pull gemma2:2b
```

### Test Ollama Locally

Run:

```powershell
ollama run gemma2:2b "Say READY"
```

If it responds, the model is working.

### Test the URL

To verify the URL itself:

Open this in your browser:

- `http://127.0.0.1:11434/api/tags`

Or test in PowerShell:

```powershell
Invoke-WebRequest http://10.1.16.183:11434/api/tags
```

If this works, then:

```env
OLLAMA_BASE_URL=http://10.1.16.183:11434
```

is correct.

### Common Ollama Cases

`Case 1: Ollama on same laptop`

Use:

```env
OLLAMA_BASE_URL=http://10.1.16.183:11434
```

`Case 2: Ollama on another laptop in the same Wi-Fi`

Use that laptop's LAN IP:

```env
OLLAMA_BASE_URL=http://192.168.x.x:11434
```

You may need firewall/network access enabled on that machine.

`Case 3: You do not want live Gemma right now`

Leave `OLLAMA_BASE_URL` blank and the backend falls back to a hardcoded brief.

## 3. Hugging Face API Key Setup

### What `HF_API_KEY` Does

This is used by the backend for ASR/transcription requests.

If it is missing, the backend falls back to demo transcript behavior.

### Create a Hugging Face Account

Go to:

- `https://huggingface.co/join`

Create an account and sign in.

### Create an Access Token

After signing in:

1. Open your Hugging Face account settings
2. Go to `Access Tokens`
3. Create a new token
4. Give it a name like `smartevp-backend`
5. Use a token with permission to call inference APIs

Copy the generated token.

It will look like:

```env
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Add It to Backend `.env`

Put it in:

```env
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 4. Final Backend `.env` Example

Example:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+15551234567
DRIVER_PHONE=+919999999999

HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

OLLAMA_BASE_URL=http://10.1.16.183:11434
OLLAMA_MODEL=gemma2:2b
```

## 5. How SmartEVP+ Uses These

### Ollama Flow

The backend reads:

- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

from:

- [Backend/config.py](/D:/Projects/SmartEVP+/Backend/config.py)

Then:

- [Backend/gemma_processor.py](/D:/Projects/SmartEVP+/Backend/gemma_processor.py)

uses them to call Ollama and generate the patient brief.

### Hugging Face Flow

The backend reads:

- `HF_API_KEY`

from:

- [Backend/config.py](/D:/Projects/SmartEVP+/Backend/config.py)

Then:

- [Backend/audio_processor.py](/D:/Projects/SmartEVP+/Backend/audio_processor.py)

uses it for transcription requests.

## 6. Quick Verification Checklist

Before starting the backend, verify:

- Ollama installed
- `ollama pull gemma2:2b` completed
- `OLLAMA_BASE_URL` reachable
- Hugging Face token copied into `.env`

Then start your backend and test.

## 7. Troubleshooting

### `OLLAMA_BASE_URL not set`

Set this in [Backend/.env](/D:/Projects/SmartEVP+/Backend/.env):

```env
OLLAMA_BASE_URL=http://10.1.16.183:11434
```

### Ollama installed but backend still cannot connect

Check:

```powershell
Invoke-WebRequest http://10.1.16.183:11434/api/tags
```

If this fails:

- Ollama service is not running
- firewall/network rules are blocking it
- the URL/IP is wrong

### `HF_API_KEY` missing

The backend will still run, but live transcription may fall back to demo text.

### You only want the demo to work

Minimum practical setup:

- set `OLLAMA_BASE_URL` if you want live brief generation
- set `HF_API_KEY` if you want live transcription
- otherwise the project can still run with fallback behavior

## 8. Security Note

Do not commit your real `.env` file to git.

Only commit:

- `.env.example`

Never share:

- `TWILIO_AUTH_TOKEN`
- `HF_API_KEY`
- any private production endpoint or secret token
