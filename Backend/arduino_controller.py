import serial
import serial.tools.list_ports
import threading
import logging
import time

logger = logging.getLogger("SmartEVP.Arduino")

class ArduinoController:
    """Manages the serial connection to the Arduino LED controller."""
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ArduinoController, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.ser = None
        self.sim_mode = False
        self.baudrate = 9600
        self.port = self._find_arduino_port()
        
        if self.port:
            try:
                self.ser = serial.Serial(self.port, self.baudrate, timeout=1)
                time.sleep(2)  # Wait for arduino to reset
                logger.info(f"Connected to Arduino on {self.port}")
                self._initialized = True
            except Exception as e:
                logger.error(f"Failed to open serial port {self.port}: {e}")
                logger.warning("Falling back to SIMULATION MODE")
                self.sim_mode = True
                self._initialized = True
        else:
            logger.warning("No Arduino found. Running in SIMULATION MODE")
            self.sim_mode = True
            self._initialized = True

    def _find_arduino_port(self):
        ports = serial.tools.list_ports.comports()
        for p in ports:
            # Look for common Arduino USB-Serial chips
            if "CH340" in p.description or "Arduino" in p.description or "USB Serial" in p.description:
                return p.device
        return None

    def send_command(self, cmd):
        """Send a single character command to the Arduino"""
        if self.sim_mode:
            logger.debug(f"[SIM] Sent command '{cmd}' to LEDs")
            return
            
        with self._lock:
            if self.ser and self.ser.is_open:
                try:
                    self.ser.write(cmd.encode(encoding='ascii'))
                    # Read ack
                    resp = self.ser.readline().decode('ascii').strip()
                    logger.debug(f"Serial sent '{cmd}', got '{resp}'")
                except Exception as e:
                    logger.error(f"Serial write error: {e}")

    def test(self):
        self.send_command('R')
        time.sleep(1)
        self.send_command('Y')
        time.sleep(1)
        self.send_command('G')
        
    def close(self):
        if self.ser and self.ser.is_open:
            self.send_command('R')  # Reset to red
            self.ser.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    ac = ArduinoController()
    ac.test()
