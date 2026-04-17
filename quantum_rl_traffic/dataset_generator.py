import pandas as pd
import numpy as np

def generate_simulated_dataset(output_path="traffic_data.csv", num_samples=150):
    np.random.seed(42)
    zones = ['highway', 'residential', 'commercial', 'school_zone']
    data = {
        'traffic_density': np.random.randint(10, 300, num_samples),
        'is_peak_hour': np.random.choice([0, 1], num_samples, p=[0.7, 0.3]),
        'zone_type': np.random.choice(zones, num_samples),
        'base_green_time': np.random.randint(20, 60, num_samples),
        'pedestrian_count': np.random.randint(0, 50, num_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Range calculation logic
    target_ranges = []
    for _, row in df.iterrows():
        calc = row['base_green_time']
        if row['is_peak_hour'] == 1 and row['traffic_density'] > 150:
            calc += 45
        elif row['is_peak_hour'] == 0 and row['traffic_density'] < 50:
            calc -= 15
            
        if row['pedestrian_count'] > 20:
            calc += 10
            
        target_ranges.append(max(10, min(150, calc)))
        
    df['optimal_green_duration'] = target_ranges
    df.to_csv(output_path, index=False)
    print(f"[Dataset] Generated {num_samples} simulated traffic records at {output_path}")

if __name__ == "__main__":
    generate_simulated_dataset()
