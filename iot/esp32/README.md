# PowerGuard AI - ESP32 Hardware Integration Guide

This directory contains the firmware and wiring specifications for connecting physical hardware to the PowerGuard AI backend.

## Architecture

```
Physical Room (Sensors: CT Clamp / ZMPT101B / DHT22 / PIR)
       │
       ▼
ESP32 Microcontroller (ADC & Digital GPIO)
       │ (WiFi 802.11 b/g/n)
       ▼
MQTT Broker (Mosquitto / EMQX on Port 1883)
       │
       ▼
PowerGuard Ingestion Service (`/api/sensors/ingest`)
       │
       ▼
SQLite / PostgreSQL Database
       │
       ▼
ML Analysis & Real-Time Dashboard
```

## Hardware Components
1. **ESP32 NodeMCU Development Board**
2. **Current Sensor**: SCT-013 Non-invasive AC Current Sensor (0-30A) or ACS712 Hall Effect Sensor
3. **Voltage Sensor**: ZMPT101B Single-Phase AC Voltage Sensor Module
4. **Temperature & Humidity**: DHT22
5. **Occupancy Detection**: HC-SR501 Passive Infrared (PIR) Motion Sensor
6. **Dual Relay Module**: 250VAC/10A for automated load shedding / AC shut-off

## Software Requirements
- Arduino IDE or PlatformIO
- Libraries: `PubSubClient`, `DHT sensor library`, `ArduinoJson` (v6+)

*Note: Physical hardware is completely optional for demonstration. The system features a built-in realistic multi-room IoT simulator running concurrently.*
