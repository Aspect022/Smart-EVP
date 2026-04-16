import logging
import json
import time
from twilio.twiml.voice_response import VoiceResponse
from twilio.rest import Client
from flask import Blueprint, request, url_for
import paho.mqtt.publish as publish

from config import Config

logger = logging.getLogger("SmartEVP.Intake")
intake_bp = Blueprint('intake', __name__)

def dispatch_ambulance(severity, location, complaint):
    """Assigns the nearest available ambulance and sends an SMS."""
    # Dummy logic to pick first ambulance
    amb_id = list(Config.AMBULANCES.keys())[0]
    amb_details = Config.AMBULANCES[amb_id]
    
    # 1. Fire Dispatch MQTT Topic
    case_data = {
        "id": f"C{int(time.time() % 10000):04d}",
        "severity": severity or "UNKNOWN",
        "location": location or "Unknown Location",
        "complaint": complaint or "Emergency",
        "ambulanceId": amb_id,
        "driver": amb_details["driver"],
        "timestamp": int(time.time() * 1000)
    }
    
    publish.single("smartevp/dispatch/case", payload=json.dumps(case_data), 
                   hostname=Config.MQTT_BROKER, port=Config.MQTT_PORT)
    
    # 2. Trigger Audio Processing (to transcribe the emergency call later if needed)
    publish.single("smartevp/command/process_audio", payload=json.dumps({"action": "start"}),
                   hostname=Config.MQTT_BROKER, port=Config.MQTT_PORT)
                   
    # 3. Send SMS via Twilio if configured
    if Config.TWILIO_ACCOUNT_SID and Config.TWILIO_AUTH_TOKEN and Config.TWILIO_FROM_NUMBER and Config.DRIVER_PHONE:
        try:
            client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=f"SmartEVP+ DISPATCH:\nCase: {case_data['id']}\nPriority: {severity}\nLoc: {location}\nDesc: {complaint}",
                from_=Config.TWILIO_FROM_NUMBER,
                to=Config.DRIVER_PHONE
            )
            logger.info(f"SMS Sent to {Config.DRIVER_PHONE}: SID {message.sid}")
            
            publish.single("smartevp/dispatch/sms_sent", payload=json.dumps({"ambulance": amb_id, "success": True}),
                           hostname=Config.MQTT_BROKER, port=Config.MQTT_PORT)
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
    else:
        logger.warning("Twilio credentials missing. Skipping SMS dispatch.")

@intake_bp.route('/incoming', methods=['GET', 'POST'])
def incoming_call():
    """Handles incoming Twilio calls"""
    resp = VoiceResponse()
    resp.say("Smart E V P Emergency Intake. Please state the nature and location of your emergency.")
    # Use url_for to build the correct absolute URL for the speech handler
    speech_url = url_for('intake.handle_speech', _external=True)
    resp.gather(input='speech', action=speech_url, timeout=5, speechTimeout='auto')
    return str(resp)

@intake_bp.route('/speech', methods=['GET', 'POST'])
def handle_speech():
    """Processes the caller's speech from Twilio"""
    speech_result = request.values.get('SpeechResult', '')
    logger.info(f"Caller said: {speech_result}")
    
    resp = VoiceResponse()
    
    if not speech_result:
        resp.say("We did not receive any input. Dispatching nearest unit immediately as precaution.")
        dispatch_ambulance("CRITICAL", "Unknown", "No voice input received")
        return str(resp)
        
    speech_lower = speech_result.lower()
    
    # Simple NLP logic
    severity = "STANDARD"
    if any(word in speech_lower for word in ["heart", "breath", "unconscious", "blood", "chest"]):
        severity = "CRITICAL"
        
    location = "Unknown"
    if "btm layout" in speech_lower: location = "BTM Layout, Bengaluru"
    elif "koramangala" in speech_lower: location = "Koramangala, Bengaluru"
    elif "madiwala" in speech_lower: location = "Madiwala, Bengaluru"
    elif "jayanagar" in speech_lower: location = "Jayanagar, Bengaluru"
    else: location = "Bengaluru City"
    
    resp.say("Emergency recorded. An ambulance has been dispatched.")
    dispatch_ambulance(severity, location, speech_result)
    
    return str(resp)
