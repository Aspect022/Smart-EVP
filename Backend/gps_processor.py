"""
gps_processor.py — SmartEVP+ GPS Processing & Adaptive Preemption
==================================================================
Reads ambulance GPS from MQTT, computes distance to intersection,
and commands signal preemption using the RL engine decision (or
fixed-rule fallback if rl_inference.py is not running).

Aerospace-inspired fail-safe: if GPS updates stop for 15 seconds
while the signal is green, the watchdog automatically resets to RED.
"""

import json
import logging
import math
import threading
import time
import paho.mqtt.client as mqtt

from config import Config
from audit_log import log_event

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("SmartEVP.GPS")

# ── State ─────────────────────────────────────────────────────────────────
current_distance = None
signal_is_green  = False
last_gps_ts      = None          # timestamp of last GPS message received

# RL decision from rl_inference.py — updated via MQTT
rl_decision = None               # None = RL service not running → use fallback

# Failsafe constants
GPS_TIMEOUT_SECONDS = 15        # seconds without GPS before auto-reset


# ── Haversine ─────────────────────────────────────────────────────────────
def haversine_distance(lat1, lon1, lat2, lon2) -> int:
    """Great-circle distance in metres between two GPS coordinates."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi       = math.radians(lat2 - lat1)
    dlambda    = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return int(2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


# ── Adaptive Thresholds ───────────────────────────────────────────────────
def get_preemption_threshold() -> float:
    """Return trigger distance from RL model, or Config fallback."""
    if rl_decision and "trigger_distance_m" in rl_decision:
        return rl_decision["trigger_distance_m"]
    return Config.PREEMPTION_RADIUS_M

def get_reset_threshold() -> float:
    """Reset to RED when ambulance is this far past the intersection."""
    if rl_decision and "trigger_distance_m" in rl_decision:
        return rl_decision["trigger_distance_m"] * 1.2  # 20% hysteresis
    return Config.RESET_RADIUS_M

def get_green_duration() -> float:
    """Return green hold duration from RL model, or sensible default."""
    if rl_decision and "green_duration_s" in rl_decision:
        return rl_decision["green_duration_s"]
    return 10.0  # default fallback


# ── GPS Watchdog (Aerospace Fail-Safe) ───────────────────────────────────
def gps_watchdog_thread(client: mqtt.Client):
    """
    Monitors GPS update frequency. If the signal is GREEN but no GPS
    update has been received for GPS_TIMEOUT_SECONDS, automatically
    resets the signal to RED.

    This prevents a stuck-green state if the ambulance WiFi drops,
    the ESP32 loses power, or the GPS track ends.
    """
    global signal_is_green

    logger.info(f"GPS Watchdog started (timeout={GPS_TIMEOUT_SECONDS}s)")
    while True:
        time.sleep(2)  # check every 2 seconds
        if signal_is_green and last_gps_ts is not None:
            elapsed = time.time() - last_gps_ts
            if elapsed > GPS_TIMEOUT_SECONDS:
                logger.warning(
                    f"[WATCHDOG] GPS timeout! {elapsed:.0f}s without update. "
                    f"Fail-safe: resetting signal to RED."
                )
                client.publish(
                    "smartevp/signal/reset",
                    json.dumps({"action": "RESET_RED", "reason": "gps_timeout_failsafe"}),
                    qos=1
                )
                log_event("FAILSAFE_TRIGGERED", f"GPS silent for {elapsed:.0f}s — signal reset to RED")
                signal_is_green = False


# ── MQTT Callbacks ────────────────────────────────────────────────────────
def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        logger.info("GPS Processor connected to MQTT Broker")
        client.subscribe("smartevp/ambulance/gps")
        client.subscribe("smartevp/signal/rl_decision")  # subscribe to RL outputs
    else:
        logger.error(f"GPS Processor MQTT connection failed (rc={reason_code})")


def on_message(client, userdata, msg):
    global current_distance, signal_is_green, last_gps_ts, rl_decision

    try:
        payload = json.loads(msg.payload.decode())

        # ── RL Decision Update ──────────────────────────────────────
        if msg.topic == "smartevp/signal/rl_decision":
            rl_decision = payload
            trigger = payload.get("trigger_distance_m", Config.PREEMPTION_RADIUS_M)
            mode    = payload.get("mode", "UNKNOWN")
            logger.debug(f"[GPS] RL decision updated → trigger={trigger}m, mode={mode}")
            return

        # ── GPS Update ─────────────────────────────────────────────
        if msg.topic != "smartevp/ambulance/gps":
            return

        lat    = payload.get("lat")
        lng    = payload.get("lng")
        amb_id = payload.get("id", "UNKNOWN")

        if lat is None or lng is None:
            return

        last_gps_ts = time.time()  # update watchdog timestamp
        dist = haversine_distance(lat, lng, Config.TARGET_LAT, Config.TARGET_LNG)
        current_distance = dist

        trigger_m = get_preemption_threshold()
        reset_m   = get_reset_threshold()
        green_s   = get_green_duration()

        # Publish distance update (always)
        client.publish(
            "smartevp/ambulance/distance",
            json.dumps({
                "ambulance": amb_id,
                "distance_m": dist,
                "trigger_distance_m": trigger_m,
                "target_lat": Config.TARGET_LAT,
                "target_lng": Config.TARGET_LNG,
                "ts": int(time.time() * 1000),
            }),
            qos=0
        )

        logger.debug(
            f"{amb_id} | dist={dist}m | trigger={trigger_m:.0f}m "
            f"({'RL' if rl_decision else 'fixed'}) | green={signal_is_green}"
        )

        # ── Preemption Logic ────────────────────────────────────────
        if dist <= trigger_m and not signal_is_green:
            logger.warning(
                f"PREEMPTION TRIGGERED! {amb_id} at {dist}m "
                f"(threshold={trigger_m:.0f}m, green_hold={green_s:.1f}s)"
            )
            client.publish(
                "smartevp/signal/preempt",
                json.dumps({
                    "action": "FORCE_GREEN",
                    "ambulance": amb_id,
                    "distance": dist,
                    "green_duration_s": green_s,
                    "trigger_distance_m": trigger_m,
                    "rl_driven": rl_decision is not None,
                }),
                qos=1
            )
            mode = rl_decision.get("mode", "FIXED") if rl_decision else "FIXED"
            log_event("PREEMPTION_TRIGGERED", f"{amb_id} at {dist}m | mode={mode}")
            signal_is_green = True

        elif dist > reset_m and signal_is_green:
            logger.info(f"{amb_id} cleared intersection ({dist}m). Resetting signal to RED.")
            client.publish(
                "smartevp/signal/reset",
                json.dumps({"action": "RESET_RED", "reason": "distance_cleared"}),
                qos=1
            )
            log_event("SIGNAL_RESET", f"{amb_id} cleared intersection ({dist}m)")
            signal_is_green = False

    except Exception as e:
        logger.error(f"GPS on_message error: {e}", exc_info=True)


if __name__ == "__main__":
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message

    logger.info("Starting GPS Processor...")
    logger.info(f"  Intersection: {Config.TARGET_LAT}, {Config.TARGET_LNG}")
    logger.info(f"  Fallback threshold: {Config.PREEMPTION_RADIUS_M}m (overridden by RL)")
    logger.info(f"  GPS Watchdog timeout: {GPS_TIMEOUT_SECONDS}s")

    client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)

    # Start fail-safe watchdog in background
    watchdog = threading.Thread(
        target=gps_watchdog_thread, args=(client,), daemon=True
    )
    watchdog.start()

    client.loop_forever()
