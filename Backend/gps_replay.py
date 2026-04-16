import json
import time
import requests
import argparse

from config import Config

def replay_route(route_file="gps_route.json", url=f"http://localhost:{Config.FLASK_PORT}/gps", hz=1.0):
    try:
        with open(route_file, 'r') as f:
            points = json.load(f)
            
        print(f"Loaded {len(points)} points from {route_file}")
        print(f"Replaying to {url} at {hz} Hz...\n")
        
        for i, pt in enumerate(points):
            payload = {
                "lat": pt["lat"],
                "lng": pt["lng"],
                "speed": pt.get("speed", 35),
                "id": pt.get("id", "AMB-001")
            }
            try:
                r = requests.post(url, json=payload, timeout=2)
                print(f"[{i+1}/{len(points)}] POST {payload['lat']}, {payload['lng']} -> {r.status_code}")
            except Exception as e:
                print(f"[{i+1}/{len(points)}] Failed to POST: {e}")
                
            time.sleep(1.0 / hz)
            
        print("\nReplay finished.")
        
    except FileNotFoundError:
        print(f"Error: {route_file} not found.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Replay GPS route to SmartEVP+ Backend")
    parser.add_argument("--file", default="gps_route.json", help="Path to JSON route file")
    parser.add_argument("--url", default=f"http://localhost:{Config.FLASK_PORT}/gps", help="Target URL")
    parser.add_argument("--hz", type=float, default=1.0, help="Updates per second")
    args = parser.parse_args()
    
    replay_route(args.file, args.url, args.hz)
