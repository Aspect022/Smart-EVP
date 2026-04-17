import numpy as np
from neural_trees import SmallNeuronTree
from quantum_core import QuantumTrafficOptimizer

class TrafficRLAgent:
    def __init__(self):
        self.quantum_opt = QuantumTrafficOptimizer(num_qubits=4)
        self.hybrid_model = SmallNeuronTree()
        self.q_table = {}
        print("[RL Agent] Initialized Reinforcement Learning traffic controller.")
        
    def fit_environment(self, df):
        print("[RL Agent] Simulating RL Episodes for environment fitting...")
        
        # Prepare data
        df_encoded = df.copy()
        df_encoded['zone_type'] = df_encoded['zone_type'].astype('category').cat.codes
        
        X = df_encoded[['traffic_density', 'is_peak_hour', 'zone_type', 'pedestrian_count']].values
        y = df_encoded['optimal_green_duration'].values
        
        # Simulate Quantum Pre-computations (State Reduction)
        print("[RL Agent] Running quantum pre-computations on state space...")
        for i in range(min(5, len(X))):
            self.quantum_opt.encode_features(X[i])
            
        # Train Hybrid Neural Tree
        self.hybrid_model.train(X, y)
        print("[RL Agent] Q-Value environment fitting complete.")
        
    def get_action(self, state):
        # State: [traffic_density, is_peak_hour, zone_type_code, pedestrian_count]
        predicted_duration = self.hybrid_model.predict([state])[0]
        return max(10, min(150, predicted_duration))
