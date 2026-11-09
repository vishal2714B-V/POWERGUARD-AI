# POWERGUARD AI
### AI-Powered Smart Energy Management System for Institutions

[![Python 3.11](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3+-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.5+-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Tests Passing](https://img.shields.io/badge/Tests-10%2F10%20Passing-10B981)](#testing)

---

## 📖 Abstract

PowerGuard AI is an AI-powered smart energy management system designed to detect, predict, and reduce unnecessary electricity wastage in colleges, hostels, offices, and multi-room institutional buildings. It collects real-time telemetry such as electricity consumption, occupancy, temperature, and appliance status through IoT sensors or realistic telemetry simulators.

Machine Learning algorithms analyze the data to predict energy consumption and identify unusual usage patterns. When wastage is detected, the system provides instant alerts and recommends actionable energy-saving measures. A smart dashboard displays real-time consumption, predicted usage, wastage risk, estimated cost, and potential savings. The "What-If" simulation helps users understand possible energy, cost, and carbon-emission reductions.

The system also introduces the **Smart Wastage Charge** concept, where avoidable excess consumption generates a simulated behavioural charge to encourage responsible energy usage across campus departments.

---

## ⚡ Non-Negotiable Core Features

1. **Real-Time Energy Monitoring**: Tracks voltage, current, power (kW), cumulative energy (kWh), temperature, occupancy, and appliance states across 8 monitored campus zones.
2. **AI Energy Prediction**: Genuine Random Forest Regressor trained on 11,520 records across 60 days, delivering next-hour and 24-hour ahead horizons with holdout evaluation metrics (**MAE: 0.0331 kW, RMSE: 0.0664 kW, R²: 0.9987**).
3. **Isolation Forest Wastage Detection**: Statistical anomaly detection combined with domain rules explaining *why* an event is flagged (e.g., zero occupancy with active air conditioning).
4. **Wastage Risk Scoring (0–100)**: Multi-factor calculated risk score decomposed into contributing factors (Occupancy Mismatch, Power Level, Baseline Divergence, Duration).
5. **AI Recommendation Engine**: Actionable suggestions calculating specific energy (kWh), cost (₹), and carbon emission (kg CO₂) savings.
6. **Smart Dashboard**: Executive SaaS dashboard featuring live KPIs, Recharts hourly/daily/room-wise/appliance charts, and instant demo controls.
7. **Live Monitoring Matrix**: Color-coded room grid (NORMAL 🟢, WARNING 🟡, WASTAGE 🔴, CRITICAL 🔴).
8. **Room Detail Inspection**: In-depth telemetry drilldown with one-click remote automated shut-off actions.
9. **What-If Simulation Engine**: Interactive sliders for AC runtimes, lighting schedules, occupancy counts, and cooling setpoints displaying before vs after 24-hour comparative profiles.
10. **Simulated Smart Wastage Charge**: Algorithmic behavioural penalty (`Avoidable Excess kWh × Penalty Rate`) with clear statutory educational disclaimers.
11. **Incident & Alert Feed**: Filterable alerts (CRITICAL, WARNING, INFO, OPTIMIZATION) with acknowledgment controls.
12. **Configurable Parameters**: Admin portal for electricity tariffs (₹/kWh), carbon emission factors (kg CO₂/kWh), penalty rates, and alarm thresholds.
13. **IoT Simulator & ESP32 Support**: Built-in background multi-room simulator and complete Arduino firmware (`iot/esp32/esp32_firmware.ino`) with MQTT wiring specs.
14. **Authentication & Role-Based Access Control**: Secure bcrypt password hashing and JWT authorization for ADMIN and USER roles.

---

## 📂 Project Structure

```
PowerGuardAI/
├── backend/
│   └── app/
│       ├── api/               # REST API Routers (auth, energy, rooms, predictions, etc.)
│       ├── database/          # SQLAlchemy engine, models, and session maker
│       ├── schemas/           # Pydantic validation schemas
│       ├── services/          # Business logic, auth, recommendations, simulations
│       ├── config.py          # Configurable parameters & environment variables
│       └── main.py            # FastAPI master application
├── frontend/
│   ├── src/
│   │   ├── components/        # KPICard, StatusBadge, Sidebar, Navbar, DemoBar
│   │   ├── pages/             # 12 complete functional application pages
│   │   ├── services/          # Centralized API service client
│   │   ├── context/           # AuthContext & state hydration
│   │   ├── types/             # TypeScript interfaces
│   │   ├── index.css          # Design system & dark mode aesthetics
│   │   └── App.tsx            # Master router
│   ├── package.json
│   └── vite.config.ts
├── ml/
│   ├── datasets/              # Dataset generation (powerguard_dataset.csv)
│   ├── training/              # Train Random Forest & Isolation Forest pipelines
│   ├── prediction/            # Energy predictor inference wrapper
│   ├── anomaly_detection/     # Anomaly detector & risk scorer
│   ├── evaluation/            # Saved test metrics JSON
│   └── models/                # Serialized .joblib models
├── iot/
│   ├── simulator/             # Realistic multi-room sensor simulator
│   └── esp32/                 # Production-ready Arduino C++ firmware & wiring
├── simulation/
│   ├── what_if/               # Thermodynamic What-If simulation engine
│   └── wastage_charge/        # Simulated Smart Wastage Charge engine
├── scripts/
│   └── seed_db.py             # Database table recreation & 60-day historical seeder
├── tests/
│   └── test_suite.py          # Automated test suite covering TEST 1 to TEST 10
├── docs/
│   └── architecture.md        # Architecture, ER, and sequence diagrams
├── start_demo.py              # Single-command Python orchestrator
├── start_demo.bat             # Windows 1-click batch launcher
├── .env.example
└── README.md
```

---

## 🚀 Installation & Quick Start

### Prerequisites
- Python 3.10+ (tested on Python 3.11)
- Node.js 18+ and npm (tested on Node v22)

### Option A: One-Command Presentation Launch (Recommended)

On Windows:
```powershell
# Double-click start_demo.bat OR run:
python start_demo.py
```

### Option B: Step-by-Step Manual Setup

#### 1. Setup Backend & Virtual Environment
```powershell
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install backend & ML dependencies
pip install -r requirements.txt
# (or: pip install fastapi uvicorn[standard] sqlalchemy pydantic scikit-learn pandas numpy joblib email-validator python-jose passlib bcrypt==4.0.1 requests)

# Train ML models & generate dataset
python -m ml.training.train_models

# Seed the database
python scripts/seed_db.py

# Start FastAPI backend
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

#### 2. Setup Frontend
In a new terminal window:
```powershell
cd frontend
npm install
npm run dev
```

The application will be live at:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`

---

## 🔑 Demo Credentials

| Role | Username | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full Campus Facility Access, System Settings & What-If |
| **Faculty / User** | `user` | `user123` | Assigned to Room 204 Custodian Portal |

*(Quick-login buttons are also provided directly on the Login screen for 1-click demonstration!)*

---

## 🎓 College Presentation Demonstration Story (Section 43)

Follow this sequence during your project evaluation:

| Step | Action | What to Point Out to Evaluator |
| :---: | :--- | :--- |
| **1** | Open `http://localhost:5173` | Present clean modern SaaS UI with dark theme and glassmorphism. |
| **2** | Sign in as **Admin** (`admin` / `admin123`) | Emphasize real JWT authentication and password hashing. |
| **3** | View **Dashboard** | Show live KPIs (Today's 428 kWh, Power 13.7 kW, Cost ₹3,250, Risk CRITICAL). |
| **4** | Open **Live Monitoring** | Point out the room status matrix: Room 101 (NORMAL 🟢), Room 103 (WARNING 🟡), Room 204 (WASTAGE 🔴). |
| **5** | Click **Room 204** | Show: Occupancy = 0, Temperature = 29°C, AC = ON, Power = 2.4 kW. |
| **6** | Highlight **Wastage Diagnosis** | Emphasize the AI explanation: *"High AC consumption detected while room is unoccupied."* Risk Score: **82 / 100 (CRITICAL)**. |
| **7** | Review **AI Recommendation** | Suggested action: *Turn OFF AC*. Point out quantified savings: 4.2 kWh/day, ₹35/day, 3.44 kg CO₂/day. Click **Execute Action: Turn OFF AC** to see live state normalize! |
| **8** | Open **AI Prediction** | Show actual vs predicted curves, next-hour (18.7 kWh) & next-day (512 kWh) forecasts, and holdout test metrics (**R²: 0.9987, MAE: 0.0331 kW**). |
| **9** | Open **What-If Simulation** | Adjust AC hours from 8h ➔ 5h. Point out dynamic calculation: 90 kWh saved, ₹720 saved, 73.8 kg CO₂ abated. Show BEFORE vs AFTER comparative curve. |
| **10** | Open **Smart Wastage Charge** | Explain the abstract's behavioural concept: Expected (400 kWh) vs Actual (450 kWh) = 50 kWh avoidable excess × ₹10/kWh = **₹500 simulated charge**. Point out mandatory disclaimer. |
| **11** | Return to **Dashboard** | Verify that live telemetry reflects executed savings and updated risk levels. |

---

## 🧪 Automated Test Suite (Section 28)

Run the 10 automated test scenarios:
```powershell
.\venv\Scripts\python.exe -m unittest tests/test_suite.py
```

### Test Case Verification Matrix

| Test Case | Scenario | Expected | Result |
| :---: | :--- | :--- | :---: |
| **TEST 1** | Occupied room + normal usage | NORMAL, Risk < 30 | ✅ PASSED |
| **TEST 2** | Unoccupied room + AC ON | WASTAGE / CRITICAL, Risk ≥ 70 | ✅ PASSED |
| **TEST 3** | Unexpected high consumption | ANOMALY / WARNING | ✅ PASSED |
| **TEST 4** | Consumption above predicted value | WARNING (Baseline Divergence) | ✅ PASSED |
| **TEST 5** | Reduce AC hours in What-If | Energy & cost decrease dynamically | ✅ PASSED |
| **TEST 6** | Actual > expected | Smart Wastage Charge generated | ✅ PASSED |
| **TEST 7** | Admin login | Admin token & role granted | ✅ PASSED |
| **TEST 8** | User login | User token & role granted | ✅ PASSED |
| **TEST 9** | Invalid login credentials | 401 Unauthorized returned | ✅ PASSED |
| **TEST 10** | IoT sensor ingest | Ingests data & triggers AI analysis | ✅ PASSED |

---

## 🛠️ Technology Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn, Python-Jose (JWT), Passlib (Bcrypt)
- **Machine Learning**: Scikit-Learn (Random Forest Regressor, Isolation Forest), NumPy, Pandas, Joblib
- **Frontend**: React 18, TypeScript, Vite, Recharts, Lucide-React
- **Database**: SQLite (Zero-config local demonstration; PostgreSQL ready)
- **IoT / Edge**: Multi-zone realistic simulator loop + ESP32 C++ firmware (CT clamp, ZMPT101B, DHT22, PIR)

---

## 📄 License & Academic Attribution
Developed for college capstone presentation. All calculation formulas, ML pipelines, and behavioral mechanisms strictly align with the PowerGuard AI specification.
