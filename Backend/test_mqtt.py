"""
SmartEVP+ — MQTT Connection Test
Run with: .venv\Scripts\python test_mqtt.py
"""
import paho.mqtt.client as mqtt
import time

BROKER = "localhost"
PORT = 1883
TEST_TOPIC = "smartevp/test"
received = []

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("[OK] Connected to Mosquitto MQTT broker on localhost:1883")
        client.subscribe(TEST_TOPIC)
    else:
        print(f"[FAIL] Connection refused — reason code: {reason_code}")
        print("  → Is Mosquitto installed and running?")
        print("  → Run: Get-Service mosquitto (in PowerShell)")

def on_message(client, userdata, msg):
    received.append(msg.payload.decode())
    print(f"[OK] Received: '{msg.payload.decode()}' on topic '{msg.topic}'")

def on_subscribe(client, userdata, mid, reason_code_list, properties):
    print(f"[OK] Subscribed to '{TEST_TOPIC}'")

def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_subscribe = on_subscribe

    try:
        client.connect(BROKER, PORT, 60)
    except ConnectionRefusedError:
        print("[FAIL] Could not connect to localhost:1883")
        print("  → Mosquitto is not running.")
        print("  → Install from: https://mosquitto.org/download/")
        print("  → Then run as Admin: Restart-Service mosquitto")
        return

    client.loop_start()
    time.sleep(1)  # Wait for subscription

    # Publish test message
    print("[...] Publishing test message...")
    client.publish(TEST_TOPIC, "SmartEVP+ MQTT OK", qos=1)
    time.sleep(1)  # Wait for round-trip

    client.loop_stop()
    client.disconnect()

    if received:
        print("\n✅ MQTT broker is working correctly!")
        print("   Ready for SmartEVP+ backend.")
    else:
        print("\n❌ No message received — something went wrong.")

if __name__ == "__main__":
    main()
