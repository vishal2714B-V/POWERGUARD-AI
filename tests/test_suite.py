import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app
from ml.anomaly_detection.detector import anomaly_detector
from simulation.what_if.engine import what_if_engine
from simulation.wastage_charge.calculator import wastage_charge_engine

class PowerGuardAITestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_occupied_room_normal_usage(self):
        """TEST 1: Occupied room + normal usage -> Expected: NORMAL"""
        analysis = anomaly_detector.analyze_reading(
            power_kw=1.4,
            occupancy=15,
            temperature=24.5,
            ac_status=True,
            light_status=True,
            hour=11,
            baseline_kw=0.25
        )
        self.assertEqual(analysis["severity"], "NORMAL")
        self.assertFalse(analysis["is_wastage"])
        self.assertLess(analysis["risk_score"], 30.0)

    def test_02_unoccupied_room_ac_on(self):
        """TEST 2: Unoccupied room + AC ON -> Expected: WASTAGE / CRITICAL"""
        analysis = anomaly_detector.analyze_reading(
            power_kw=2.4,
            occupancy=0,
            temperature=29.0,
            ac_status=True,
            light_status=True,
            hour=20,
            baseline_kw=0.20,
            duration_hours=2.0
        )
        self.assertIn(analysis["severity"], ["WASTAGE", "CRITICAL"])
        self.assertTrue(analysis["is_wastage"])
        self.assertGreaterEqual(analysis["risk_score"], 70.0)
        self.assertIn("High AC consumption detected while room is completely unoccupied", analysis["reason"])

    def test_03_unexpected_high_consumption(self):
        """TEST 3: Unexpected high consumption -> Expected: ANOMALY / WARNING"""
        analysis = anomaly_detector.analyze_reading(
            power_kw=4.5,
            occupancy=2,
            temperature=25.0,
            ac_status=True,
            light_status=True,
            hour=14,
            baseline_kw=0.3
        )
        self.assertIn(analysis["severity"], ["WARNING", "WASTAGE", "CRITICAL"])
        self.assertGreater(analysis["risk_score"], 35.0)

    def test_04_consumption_above_predicted_value(self):
        """TEST 4: Consumption above predicted value -> Expected: WARNING"""
        analysis = anomaly_detector.analyze_reading(
            power_kw=3.2,
            occupancy=20,
            temperature=26.0,
            ac_status=True,
            light_status=True,
            hour=15,
            baseline_kw=0.3,
            expected_kw=2.0  # 60% above expected
        )
        self.assertIn(analysis["severity"], ["WARNING", "WASTAGE", "CRITICAL"])
        self.assertIn("AI Baseline Divergence", [f["factor_name"] for f in analysis["factors"]])

    def test_05_what_if_reduce_ac_hours(self):
        """TEST 5: Reduce AC hours in What-If -> Expected: Energy and cost decrease according to calculation"""
        res_before = what_if_engine.simulate(ac_hours_current=8.0, ac_hours_target=8.0)
        res_after = what_if_engine.simulate(ac_hours_current=8.0, ac_hours_target=5.0)
        
        self.assertGreater(res_after["energy_saved_kwh"], 0.0)
        self.assertGreater(res_after["cost_saved_inr"], 0.0)
        self.assertGreater(res_after["co2_reduced_kg"], 0.0)
        self.assertLess(res_after["optimized_daily_kwh"], res_after["current_daily_kwh"])

    def test_06_smart_wastage_charge_generated(self):
        """TEST 6: Actual > expected -> Expected: Smart Wastage Charge generated"""
        charge = wastage_charge_engine.calculate_charge(
            expected_kwh=400.0,
            actual_kwh=450.0,
            penalty_rate=10.0
        )
        self.assertEqual(charge["avoidable_excess_kwh"], 50.0)
        self.assertEqual(charge["simulated_charge_inr"], 500.0)
        self.assertIn("SIMULATED SMART WASTAGE CHARGE", charge["disclaimer"])

    def test_07_admin_login(self):
        """TEST 7: Admin login -> Expected: Admin token and role"""
        response = self.client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "ADMIN")

    def test_08_user_login(self):
        """TEST 8: User login -> Expected: User token and role"""
        response = self.client.post("/api/auth/login", json={"username": "user", "password": "user123"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "USER")

    def test_09_invalid_login(self):
        """TEST 9: Invalid login -> Expected: Authentication error (401)"""
        response = self.client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
        self.assertEqual(response.status_code, 401)

    def test_10_iot_simulator_sensor_ingest(self):
        """TEST 10: IoT simulator sends new data -> Expected: Ingest and update status"""
        payload = {
            "room_id": 8,
            "voltage": 230.5,
            "current": 10.5,
            "power_kw": 2.4,
            "energy_kwh": 1865.0,
            "temperature": 29.2,
            "occupancy": 0,
            "ac_status": True,
            "light_status": True,
            "fan_status": False,
            "computer_status": False
        }
        response = self.client.post("/api/sensors/ingest", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["room_number"], "204")
        self.assertIn(data["analysis"]["severity"], ["WASTAGE", "CRITICAL"])

if __name__ == "__main__":
    unittest.main()
