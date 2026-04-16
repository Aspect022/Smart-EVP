import os
import json
import time
import logging
import requests
import paho.mqtt.client as mqtt

from config import Config
from gemma_processor import generate_medical_brief

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SmartEVP.Audio")

# Hardcoded demo transcript snippet sequence for testing without API keys
DEMO_TRANSCRIPTS = [
    "Patient is a ",
    "58 year old male, ",
    "complaining of acute chest pain ",
    "radiating to left arm. ",
    "Diaphoretic. HR is 112 irregular, ",
    "BP 90 over 60, ",
    "SpO2 94 percent on room air. ",
    "Administered aspirin 325mg. ",
    "Suspecting STEMI. ",
    "ETA 4 minutes."
]

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        logger.info("Connected to MQTT Broker. Subscribing to audio commands.")
        client.subscribe("smartevp/command/process_audio")
    else:
        logger.error(f"Failed to connect, rc={reason_code}")

def on_message(client, userdata, msg):
    try:
        if msg.topic == "smartevp/command/process_audio":
            payload = json.loads(msg.payload.decode())
            action = payload.get("action")
            
            if action == "start":
                logger.info("Received request to process audio")
                process_pipeline(client)
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)

def transcribe_audio_hf(file_path):
    """Transcribes an audio file using HuggingFace Inference API"""
    if not Config.HF_API_KEY:
        logger.warning("No HuggingFace API key found. Using DEMO mode transcript.")
        return None
        
    if not os.path.exists(file_path):
        logger.error(f"Audio file not found: {file_path}")
        return None
        
    API_URL = "https://api-inference.huggingface.co/models/openai/whisper-small" # Fallback if vibe is down
    headers = {"Authorization": f"Bearer {Config.HF_API_KEY}"}
    
    try:
        with open(file_path, "rb") as f:
            data = f.read()
        
        logger.info(f"Sending audio ({len(data)} bytes) to HF API")
        response = requests.post(API_URL, headers=headers, data=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        if "text" in result:
            return result["text"]
        elif "error" in result:
            logger.error(f"HF API Error: {result['error']}")
            return None
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return None

def process_pipeline(mqtt_client):
    """Executes the full pipeline: ASR -> MQTT Transcript -> LLM Brief -> MQTT Brief"""
    
    # Check for an emergency.wav in the audio dir, otherwise fall back to demo
    test_file_path = os.path.join(Config.AUDIO_DIR, "emergency.wav")
    full_transcript = transcribe_audio_hf(test_file_path)
    
    if full_transcript is None:
        # DEMO MODE: Broadcast pieces sequentially
        logger.info("Executing AUDIO DEMO MODE")
        full_transcript = "".join(DEMO_TRANSCRIPTS)
        for fragment in DEMO_TRANSCRIPTS:
            mqtt_client.publish("smartevp/medical/transcript", json.dumps({"text": fragment}))
            time.sleep(1.0)
    else:
        # API MODE: Broadcast the real transcript verbatim
        mqtt_client.publish("smartevp/medical/transcript", json.dumps({"text": full_transcript}))

    logger.info(f"Final Transcript: '{full_transcript}'")
    
    # 2. Gemma AI Brief Generation
    logger.info("Requesting Gemma medical brief...")
    brief = generate_medical_brief(full_transcript)
    
    # 3. Publish Brief Let Hospital know
    mqtt_client.publish("smartevp/medical/brief", json.dumps(brief))
    logger.info("Brief generated and published.")

if __name__ == "__main__":
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    
    logger.info("Starting Audio Processor...")
    client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)
    client.loop_forever()
