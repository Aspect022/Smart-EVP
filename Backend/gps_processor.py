import json
import logging
import math
import time
import paho.mqtt.client as mqtt

from config import Config
from audit_log import log_event

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SmartEVP.GPS")

# State tracking
current_distance = None
signal_is_green = False

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance in meters between two points"""
    R = 6371000  # Radius of earth in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return int(R * c)

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        logger.info("Connected to MQTT Broker. Subscribing to gps data.")
        client.subscribe("smartevp/ambulance/gps")
    else:
        logger.error(f"Failed to connect, rc={reason_code}")

def on_message(client, userdata, msg):
    global current_distance, signal_is_green
    try:
        payload = json.loads(msg.payload.decode())
        
        if msg.topic == "smartevp/ambulance/gps":
            lat = payload.get("lat")
            lng = payload.get("lng")
            amb_id = payload.get("id", "UNKNOWN")
            
            if lat is None or lng is None:
                return
                
            dist = haversine_distance(lat, lng, Config.TARGET_LAT, Config.TARGET_LNG)
            current_distance = dist
            
            # Publish distance update
            client.publish("smartevp/ambulance/distance", json.dumps({
                "ambulance": amb_id,
                "distance_m": dist,
                "target_lat": Config.TARGET_LAT,
                "target_lng": Config.TARGET_LNG,
                "ts": int(time.time() * 1000)
            }))
            
            logger.debug(f"{amb_id} at {lat}, {lng}. Distance to intersection: {dist}m")
            
            # Logic: If distance <= Preemption Radius, turn signal GREEN
            if dist <= Config.PREEMPTION_RADIUS_M and not signal_is_green:
                logger.warning(f"PREEMPTION TRIGGERED! Ambulance {amb_id} is {dist}m away.")
                client.publish("smartevp/signal/preempt", json.dumps({
                    "action": "FORCE_GREEN",
                    "ambulance": amb_id,
                    "distance": dist
                }))
                log_event("PREEMPTION_TRIGGERED", f"Ambulance {amb_id} at {dist}m")
                signal_is_green = True
                
            # Logic: If distance > Reset Radius (hysteresis) and it was green, reset to RED
            elif dist > Config.RESET_RADIUS_M and signal_is_green:
                logger.info(f"Ambulance {amb_id} passed intersection ({dist}m away). Resetting signal.")
                client.publish("smartevp/signal/reset", json.dumps({
                    "action": "RESET_RED",
                    "reason": "distance_cleared"
                }))
                log_event("SIGNAL_RESET", "Ambulance cleared intersection")
                signal_is_green = False

    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)

if __name__ == "__main__":
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    
    logger.info("Starting GPS Processor...")
    client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)
    client.loop_forever()
