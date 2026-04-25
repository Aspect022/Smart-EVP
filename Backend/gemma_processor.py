import copy
import json
import logging
import re
import time

import requests

from config import Config

logger = logging.getLogger("SmartEVP.Gemma")

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
        "gcs": "--",
    },
    "resources": ["Emergency Room"],
    "medications": "Unknown",
    "allergies": "Unknown",
    "notes": "No LLM provider was reachable. This is an auto-generated fallback brief.",
    "eta": 300,
}

SYSTEM_PROMPT = """
You are an expert emergency triage AI. Extract clinical details from the paramedic transcript.
You MUST reply ONLY with valid JSON. Do not include markdown formatting like ```json.
Your output must strictly match this exact JSON structure:
{
  "age": 0,
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


def parse_json_response(response_text: str):
    cleaned = re.sub(r"^```json\s*", "", response_text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    parsed = json.loads(cleaned)
    parsed["eta"] = parsed.get("eta", 300)
    return parsed


def brief_with_note(note: str):
    fallback = copy.deepcopy(FALLBACK_BRIEF)
    fallback["notes"] = note
    return fallback


def call_ollama(transcript: str):
    if not Config.OLLAMA_BASE_URL:
        return None

    url = f"{Config.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
    payload = {
        "model": Config.OLLAMA_MODEL,
        "prompt": f"{SYSTEM_PROMPT}\n\nParamedic Transcript: {transcript}",
        "stream": False,
    }

    logger.info("Trying Ollama (%s) for medical brief", Config.OLLAMA_MODEL)
    try:
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        response_text = resp.json().get("response", "").strip()
        if not response_text:
            logger.warning("Ollama returned empty response")
            return None
        return parse_json_response(response_text)
    except requests.exceptions.ConnectionError:
        logger.warning("Ollama unreachable at %s — falling back to Gemini", Config.OLLAMA_BASE_URL)
        return None
    except requests.exceptions.Timeout:
        logger.warning("Ollama timed out — falling back to Gemini")
        return None


def call_gemini(transcript: str):
    if not Config.GEMINI_API_KEY:
        return None

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{Config.GEMINI_MODEL}:generateContent"
    )
    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}],
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"Paramedic Transcript: {transcript}"}],
            }
        ],
    }
    headers = {
        "x-goog-api-key": Config.GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    max_retries = 3
    backoff = 2  # seconds

    for attempt in range(1, max_retries + 1):
        logger.info(
            "Gemini brief generation via %s (attempt %d/%d)",
            Config.GEMINI_MODEL, attempt, max_retries,
        )
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=25)

            # Retry on rate-limit or server overload
            if resp.status_code in (429, 503):
                wait = backoff * (2 ** (attempt - 1))
                logger.warning(
                    "Gemini %s — backing off %ds before retry",
                    resp.status_code, wait,
                )
                time.sleep(wait)
                continue

            resp.raise_for_status()
            body = resp.json()
            candidates = body.get("candidates", [])
            if not candidates:
                raise ValueError(f"Gemini returned no candidates: {body}")

            parts = candidates[0].get("content", {}).get("parts", [])
            response_text = "".join(part.get("text", "") for part in parts).strip()
            if not response_text:
                raise ValueError(f"Gemini returned empty text: {body}")

            return parse_json_response(response_text)

        except json.JSONDecodeError as exc:
            raise exc  # re-raise so generate_medical_brief can log it

    raise RuntimeError(
        f"Gemini {Config.GEMINI_MODEL} still rate-limited after {max_retries} retries"
    )


def generate_medical_brief(transcript):
    """Try Ollama first (gpt-oss:120b-cloud), then Gemini, then hardcoded fallback."""
    last_error = None

    # Primary: Ollama cloud model — fast, no external rate limits
    for provider_name, provider in (("Ollama", call_ollama), ("Gemini", call_gemini)):
        try:
            result = provider(transcript)
            if result is not None:
                logger.info("Medical brief generated via %s", provider_name)
                return result
        except json.JSONDecodeError as error:
            logger.error("%s returned invalid JSON: %s", provider_name, error)
            last_error = f"{provider_name} returned invalid JSON"
        except Exception as error:
            logger.error("%s request failed: %s", provider_name, error)
            last_error = f"{provider_name} unavailable: {error}"

    logger.warning("All AI providers failed — using hardcoded fallback brief. Last error: %s", last_error)
    return brief_with_note(last_error or "No AI provider returned a valid brief.")
