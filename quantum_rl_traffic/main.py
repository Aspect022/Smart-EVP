from dataset_generator import generate_simulated_dataset
from rl_agent import TrafficRLAgent
import pandas as pd
import os

def run_traffic_system():
    print("=== SmartEVP+ Quantum ML Traffic Controller ===")
    
    # 1. Generate / Load Data
    data_path = 'traffic_data.csv'
    if not os.path.exists(data_path):
        generate_simulated_dataset(data_path, 150)
    
    df = pd.read_csv(data_path)
    print(f"Loaded dataset with {len(df)} samples.")
    
    # 2. Initialize and Train RL Agent
    agent = TrafficRLAgent()
    agent.fit_environment(df)
    
    # 3. Test Inferences
    print("\n--- Running Traffic Signal Range Predictions ---")
    
    # Test Case 1: High traffic, Peak Hour
    state_high = [250, 1, 0, 30] # high traffic, peak, highway, 30 pedestrians
    dur_high = agent.get_action(state_high)
    print(f"Scenario 1 (High Traffic, Peak Hour)   -> Green Light Duration: {dur_high:.2f} sec")
    
    # Test Case 2: Low traffic, Off Peak
    state_low = [30, 0, 1, 2] # low traffic, off-peak, residential, 2 pedestrians
    dur_low = agent.get_action(state_low)
    print(f"Scenario 2 (Low Traffic, Off-Peak)     -> Green Light Duration: {dur_low:.2f} sec")
    
    print("===============================================")

if __name__ == "__main__":
    run_traffic_system()
