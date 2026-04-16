import json
import logging
import requests
import re
from config import Config

logger = logging.getLogger("SmartEVP.Gemma")

# Hardcoded fallback brief for when Ollama is unavailable
FALLBACK_BRIEF = {
    "age": "UNKNOWN",
    "gender": "UNKNOWN",
    "priority": "P2",
    "chiefComplaint": "Unable to extract (Fallback Mode)",
    "suspectedDiagnosis": "Pending Assessment",
    "vitals": {
        "bp": "--",
        "hr": "--",
        "spo2": "--",
        "gcs": "--"
    },
    "resources": ["Emergency Room"],
    "medications": "Unknown",
    "allergies": "Unknown",
    "notes": "Ollama LLM was unreachable. This is an auto-generated fallback brief.",
    "eta": 300
}

def generate_medical_brief(transcript):
    """Calls Ollama/Gemma API to generate structured medical brief"""
    if not Config.OLLAMA_BASE_URL:
        logger.warning("OLLAMA_BASE_URL not set. Using fallback medical brief.")
        return FALLBACK_BRIEF

    system_prompt = """
You are an expert emergency triage AI. Extract clinical details from the paramedical transcript.
You MUST reply ONLY with valid JSON. Do not include markdown formatting like ```json.
Your output must strictly match this exact JSON structure:
{
  "age": 00,
  "gender": "Male" | "Female" | "Unknown",
  "priority": "P1" | "P2" | "P3",
  "chiefComplaint": "short string",
  "suspectedDiagnosis": "short string",
  "vitals": {
    "bp": "string",
    "hr": "string",
    "spo2": "string",
    "gcs": "number or string"
  },
  "resources": ["list", "of", "strings"],
  "medications": "string",
  "allergies": "string",
  "notes": "string"
}
If a value is missing or unknown, use "Unknown" or "--". Keep responses brief.
"""

    url = f"{Config.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
    payload = {
        "model": Config.OLLAMA_MODEL,
        "prompt": f"{system_prompt}\n\nMagnetic Transcript: {transcript}",
        "stream": False
    }

    try:
        logger.info(f"Sending transcript to Ollama ({Config.OLLAMA_MODEL}) at {url}")
        resp = requests.post(url, json=payload, timeout=20)
        resp.raise_for_status()
        
        response_text = resp.json().get("response", "").strip()
        
        # Clean up possible markdown fences
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        
        try:
            parsed_json = json.loads(response_text)
            parsed_json["eta"] = 300 # Baseline ETA for the hospital dashboard
            logger.info("Successfully generated medical brief")
            return parsed_json
        except json.JSONDecodeError as je:
            logger.error(f"Gemma returned invalid JSON: {response_text}\nError: {je}")
            FALLBACK_BRIEF["notes"] = f"Gemma API succeeded but returned invalid JSON. Original output: {response_text}"
            return FALLBACK_BRIEF
            
    except Exception as e:
        logger.error(f"Failed to communicate with Ollama: {e}")
        return FALLBACK_BRIEF
