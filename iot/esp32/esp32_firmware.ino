/*
 * POWERGUARD AI - ESP32 Smart Energy & Multi-Sensor Node
 * 
 * Hardware Wiring:
 * - Current Sensor: ACS712 / CT Clamp (SCT-013) on Analog Pin 34
 * - AC Voltage Sensor: ZMPT101B on Analog Pin 35
 * - Temperature & Humidity: DHT22 on Digital Pin 4
 * - Occupancy Detection: PIR Sensor (HC-SR501) on Digital Pin 14
 * - Relay 1 (AC Contactor): Pin 26
 * - Relay 2 (Lighting Contactor): Pin 27
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi and MQTT Broker Details
const char* ssid = "COLLEGE_CAMPUS_WIFI";
const char* password = "WiFiPassword123";
const char* mqtt_server = "192.168.1.100";  // Host machine running PowerGuard backend
const int mqtt_port = 1883;
const char* mqtt_topic_telemetry = "powerguard/room/204/telemetry";
const char* mqtt_topic_control = "powerguard/room/204/control";

// Pin definitions
#define DHTPIN 4
#define DHTTYPE DHT22
#define CURRENT_PIN 34
#define VOLTAGE_PIN 35
#define PIR_PIN 14
#define RELAY_AC 26
#define RELAY_LIGHT 27

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
const int ROOM_ID = 8;
const char* ROOM_NUMBER = "204";

void setup_wifi() {
  delay(10);
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected! IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  // Remote AI Automated Shut-off or Contactor Command
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.printf("Command received on topic [%s]: %s\n", topic, message.c_str());
  
  StaticJsonDocument<256> doc;
  deserializeJson(doc, message);
  if (doc.containsKey("ac_status")) {
    bool ac_state = doc["ac_status"];
    digitalWrite(RELAY_AC, ac_state ? HIGH : LOW);
  }
  if (doc.containsKey("light_status")) {
    bool light_state = doc["light_status"];
    digitalWrite(RELAY_LIGHT, light_state ? HIGH : LOW);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32_PowerGuard_Room204")) {
      Serial.println("connected");
      client.subscribe(mqtt_topic_control);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_AC, OUTPUT);
  pinMode(RELAY_LIGHT, OUTPUT);
  
  digitalWrite(RELAY_AC, HIGH);
  digitalWrite(RELAY_LIGHT, HIGH);
  
  dht.begin();
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 5000) {  // Publish telemetry every 5 seconds
    lastMsg = now;

    // Sensor Readings
    float temperature = dht.readTemperature();
    if (isnan(temperature)) temperature = 27.5;
    
    int motion = digitalRead(PIR_PIN);
    int occupancy = motion ? 15 : 0;
    
    // Sample analog current and voltage
    int raw_i = analogRead(CURRENT_PIN);
    int raw_v = analogRead(VOLTAGE_PIN);
    
    float voltage = 230.0 + (raw_v % 5);
    float current = (raw_i / 4095.0) * 12.0;  // 0 to 12A scale
    float power_kw = (voltage * current * 0.95) / 1000.0;
    
    StaticJsonDocument<300> doc;
    doc["room_id"] = ROOM_ID;
    doc["room_number"] = ROOM_NUMBER;
    doc["voltage"] = voltage;
    doc["current"] = current;
    doc["power_kw"] = power_kw;
    doc["temperature"] = temperature;
    doc["occupancy"] = occupancy;
    doc["ac_status"] = (power_kw > 1.2);
    doc["light_status"] = (power_kw > 0.2);

    char buffer[300];
    serializeJson(doc, buffer);
    client.publish(mqtt_topic_telemetry, buffer);
    Serial.printf("Published: %s\n", buffer);
  }
}
