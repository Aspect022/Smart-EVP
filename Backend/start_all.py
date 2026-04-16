import subprocess
import time
import sys
import os
import socket as _socket

# Always resolve paths relative to THIS script's directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_PYTHON = sys.executable

def check_mosquitto():
    """Checks if Mosquitto is listening on port 1883"""
    sock = _socket.socket(_socket.AF_INET, _socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', 1883))
    sock.close()
    return result == 0

def start_process(name, script):
    script_path = os.path.join(SCRIPT_DIR, script)
    print(f"[*] Starting {name}: {script_path}")
    p = subprocess.Popen(
        [VENV_PYTHON, script_path],
        stdout=sys.stdout,
        stderr=sys.stderr,
        cwd=SCRIPT_DIR,   # Always run from Backend/ so relative imports work
    )
    return p

if __name__ == "__main__":
    print("="*50)
    print("      SmartEVP+ Backend Orchestrator      ")
    print("="*50)
    
    if not check_mosquitto():
        print("[!] ERROR: Mosquitto MQTT broker is NOT running on port 1883")
        print("    Please start it manually or install it.")
        sys.exit(1)
        
    print("[OK] MQTT Broker is running.\n")
    
    processes = []
    try:
        # Start the individual microservices
        processes.append(start_process("LED Controller", "led_controller.py"))
        processes.append(start_process("GPS Processor", "gps_processor.py"))
        processes.append(start_process("Audio Processor", "audio_processor.py"))
        
        # Give them a second to connect to MQTT
        time.sleep(1)
        
        # Start the main Flask app
        processes.append(start_process("Flask Server", "app.py"))
        
        print("\n[SUCCESS] All services started. Press Ctrl+C to stop.")
        print(f"  Backend API  : http://localhost:8080")
        print(f"  Health check : http://localhost:8080/api/health")
        print(f"  Demo trigger : POST http://localhost:8080/demo/trigger")
        print(f"  GPS inject   : POST http://localhost:8080/gps\n")
        
        # Keep main thread alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n[!!!] Shutting down all services...")
        for p in processes:
            p.terminate()
        print("Done.")
        sys.exit(0)
