from sklearn.tree import DecisionTreeRegressor
import numpy as np

class SmallNeuronTree:
    def __init__(self, max_depth=5):
        self.tree = DecisionTreeRegressor(max_depth=max_depth)
        # Simulated tiny neural layers
        self.small_neurons = np.random.randn(4, 3) 
        print("[NeuralTree] Initialized hybrid Decision Tree + Small Neurons.")
        
    def train(self, X, y):
        # Simulate neural forward pass
        X_neural = np.dot(X, self.small_neurons)
        # Concatenate classical features with neuron activations
        X_hybrid = np.hstack((X, X_neural))
        self.tree.fit(X_hybrid, y)
        print("[NeuralTree] Training completed on Hybrid architecture.")
        
    def predict(self, X):
        X_neural = np.dot(X, self.small_neurons)
        X_hybrid = np.hstack((X, X_neural))
        return self.tree.predict(X_hybrid)
