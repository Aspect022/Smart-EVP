import json
import logging
import time
import paho.mqtt.client as mqtt

from config import Config
from arduino_controller import ArduinoController

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SmartEVP.LED")

arduino = ArduinoController()

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        logger.info("Connected to MQTT Broker. Subscribing to signal topics.")
        client.subscribe("smartevp/signal/preempt")
        client.subscribe("smartevp/signal/reset")
        
        # Publish initial state
        publish_status(client, "RED", 0)
    else:
        logger.error(f"Failed to connect, rc={reason_code}")

def publish_status(client, state, latency_ms):
    client.publish("smartevp/signal/status", json.dumps({
        "state": state,
        "latency_ms": latency_ms,
        "ts": int(time.time() * 1000)
    }))

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        
        if msg.topic == "smartevp/signal/preempt":
            start_time = time.time()
            arduino.send_command('G')
            latency = int((time.time() - start_time) * 1000)
            
            publish_status(client, "GREEN", latency)
            logger.info(f"Signal turned GREEN. Latency: {latency}ms")
            
        elif msg.topic == "smartevp/signal/reset":
            start_time = time.time()
            arduino.send_command('R')
            latency = int((time.time() - start_time) * 1000)
            
            publish_status(client, "RED", latency)
            logger.info("Signal reset to RED.")

    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)

if __name__ == "__main__":
    # Ensure LED starts RED
    arduino.send_command('R')
    
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    
    logger.info("Starting LED Controller...")
    client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)
    client.loop_forever()
