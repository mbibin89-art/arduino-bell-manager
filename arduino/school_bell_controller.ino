#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// Hardware Setup
LiquidCrystal_I2C lcd(0x27, 16, 2);  // I2C LCD address 0x27
RTC_DS3231 rtc;
SoftwareSerial bluetooth(2, 3);  // RX, TX pins for HC-05

// Bell Control
#define BELL_PIN 4
#define BELL_DURATION 3000  // 3 seconds

// Schedule Storage
struct Schedule {
  uint8_t hour;
  uint8_t minute;
  uint8_t second;
  uint16_t year;
  uint8_t month;
  uint8_t day;
  bool isActive;
  bool isRecurring;  // true for daily, false for specific date
};

#define MAX_SCHEDULES 20
#define EEPROM_START_ADDR 0
Schedule schedules[MAX_SCHEDULES];
uint8_t scheduleCount = 0;

// Holiday Storage
struct Holiday {
  uint16_t year;
  uint8_t month;
  uint8_t day;
};

#define MAX_HOLIDAYS 50
Holiday holidays[MAX_HOLIDAYS];
uint8_t holidayCount = 0;

// Timing Variables
unsigned long lastDisplayUpdate = 0;
unsigned long bellStartTime = 0;
bool bellActive = false;
bool lastMinuteChecked = false;

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("School Bell Sys");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  
  // Initialize RTC
  if (!rtc.begin()) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("RTC ERROR!");
    while (1);
  }
  
  // Set RTC time if needed (uncomment and set once)
  // rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  
  // Initialize bell pin
  pinMode(BELL_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  
  // Load schedules from EEPROM
  loadSchedulesFromEEPROM();
  
  delay(2000);
  lcd.clear();
  
  Serial.println("School Bell Controller Ready");
  bluetooth.println("School Bell Controller Ready");
}

void loop() {
  // Handle Bluetooth communication
  if (bluetooth.available()) {
    handleBluetoothData();
  }
  
  // Update display every second
  if (millis() - lastDisplayUpdate >= 1000) {
    updateDisplay();
    lastDisplayUpdate = millis();
  }
  
  // Check schedules every minute
  DateTime now = rtc.now();
  if (now.second() == 0 && !lastMinuteChecked) {
    checkSchedules(now);
    lastMinuteChecked = true;
  } else if (now.second() != 0) {
    lastMinuteChecked = false;
  }
  
  // Handle bell timing
  if (bellActive && (millis() - bellStartTime >= BELL_DURATION)) {
    digitalWrite(BELL_PIN, LOW);
    bellActive = false;
    Serial.println("Bell stopped");
  }
}

void handleBluetoothData() {
  String jsonData = bluetooth.readString();
  jsonData.trim();
  
  if (jsonData.length() == 0) return;
  
  Serial.println("Received: " + jsonData);
  
  // Parse JSON
  StaticJsonDocument<2048> doc;
  DeserializationError error = deserializeJson(doc, jsonData);
  
  if (error) {
    Serial.println("JSON Parse Error: " + String(error.c_str()));
    bluetooth.println("ERROR: Invalid JSON");
    return;
  }
  
  // Handle different command types
  if (doc.containsKey("schedules")) {
    handleScheduleUpdate(doc["schedules"]);
  } else if (doc.containsKey("holidays")) {
    handleHolidayUpdate(doc["holidays"]);
  } else if (doc.containsKey("command")) {
    handleCommand(doc["command"]);
  }
}

void handleScheduleUpdate(JsonArray schedulesArray) {
  scheduleCount = 0;
  
  for (JsonObject schedule : schedulesArray) {
    if (scheduleCount >= MAX_SCHEDULES) break;
    
    String timeStr = schedule["time"];
    String dateStr = schedule["date"];
    bool active = schedule["active"];
    
    // Parse time (HH:MM:SS)
    int hour = timeStr.substring(0, 2).toInt();
    int minute = timeStr.substring(3, 5).toInt();
    int second = timeStr.substring(6, 8).toInt();
    
    schedules[scheduleCount].hour = hour;
    schedules[scheduleCount].minute = minute;
    schedules[scheduleCount].second = second;
    schedules[scheduleCount].isActive = active;
    
    // Parse date if provided
    if (dateStr.length() > 0) {
      schedules[scheduleCount].year = dateStr.substring(0, 4).toInt();
      schedules[scheduleCount].month = dateStr.substring(5, 7).toInt();
      schedules[scheduleCount].day = dateStr.substring(8, 10).toInt();
      schedules[scheduleCount].isRecurring = false;
    } else {
      schedules[scheduleCount].isRecurring = true;
    }
    
    scheduleCount++;
  }
  
  saveSchedulesToEEPROM();
  
  Serial.println("Schedules updated: " + String(scheduleCount));
  bluetooth.println("OK: " + String(scheduleCount) + " schedules saved");
  
  // Brief confirmation on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Schedules Saved");
  lcd.setCursor(0, 1);
  lcd.print("Count: " + String(scheduleCount));
  delay(2000);
}

void handleHolidayUpdate(JsonArray holidaysArray) {
  holidayCount = 0;
  
  for (JsonObject holiday : holidaysArray) {
    if (holidayCount >= MAX_HOLIDAYS) break;
    
    String dateStr = holiday["date"];
    
    holidays[holidayCount].year = dateStr.substring(0, 4).toInt();
    holidays[holidayCount].month = dateStr.substring(5, 7).toInt();
    holidays[holidayCount].day = dateStr.substring(8, 10).toInt();
    
    holidayCount++;
  }
  
  Serial.println("Holidays updated: " + String(holidayCount));
  bluetooth.println("OK: " + String(holidayCount) + " holidays saved");
}

void handleCommand(String command) {
  if (command == "ring_bell") {
    ringBell();
    bluetooth.println("OK: Bell triggered");
  } else if (command == "get_time") {
    DateTime now = rtc.now();
    bluetooth.println("TIME: " + formatDateTime(now));
  } else if (command == "get_status") {
    bluetooth.println("STATUS: " + String(scheduleCount) + " schedules, " + String(holidayCount) + " holidays");
  }
}

void checkSchedules(DateTime now) {
  // Check if today is a holiday
  if (isHoliday(now)) {
    return;
  }
  
  for (uint8_t i = 0; i < scheduleCount; i++) {
    if (!schedules[i].isActive) continue;
    
    bool timeMatch = (schedules[i].hour == now.hour() && 
                     schedules[i].minute == now.minute() && 
                     schedules[i].second == now.second());
    
    if (!timeMatch) continue;
    
    // Check date match for non-recurring schedules
    if (!schedules[i].isRecurring) {
      bool dateMatch = (schedules[i].year == now.year() && 
                       schedules[i].month == now.month() && 
                       schedules[i].day == now.day());
      if (!dateMatch) continue;
    }
    
    // Ring the bell
    ringBell();
    Serial.println("Scheduled bell at " + formatDateTime(now));
    break;
  }
}

bool isHoliday(DateTime date) {
  for (uint8_t i = 0; i < holidayCount; i++) {
    if (holidays[i].year == date.year() && 
        holidays[i].month == date.month() && 
        holidays[i].day == date.day()) {
      return true;
    }
  }
  return false;
}

void ringBell() {
  if (bellActive) return;  // Prevent overlapping bell rings
  
  digitalWrite(BELL_PIN, HIGH);
  bellActive = true;
  bellStartTime = millis();
  
  // Show bell status on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("*** BELL RING ***");
  lcd.setCursor(0, 1);
  DateTime now = rtc.now();
  lcd.print(formatTime(now));
}

void updateDisplay() {
  if (bellActive) return;  // Don't update display while bell is ringing
  
  DateTime now = rtc.now();
  
  lcd.setCursor(0, 0);
  lcd.print("Time: " + formatTime(now));
  
  lcd.setCursor(0, 1);
  if (isHoliday(now)) {
    lcd.print("HOLIDAY         ");
  } else {
    lcd.print("Schedules: " + String(scheduleCount) + "    ");
  }
}

String formatTime(DateTime dt) {
  char buffer[9];
  sprintf(buffer, "%02d:%02d:%02d", dt.hour(), dt.minute(), dt.second());
  return String(buffer);
}

String formatDateTime(DateTime dt) {
  char buffer[20];
  sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d", 
          dt.year(), dt.month(), dt.day(), 
          dt.hour(), dt.minute(), dt.second());
  return String(buffer);
}

void saveSchedulesToEEPROM() {
  EEPROM.put(EEPROM_START_ADDR, scheduleCount);
  for (uint8_t i = 0; i < scheduleCount; i++) {
    EEPROM.put(EEPROM_START_ADDR + 1 + (i * sizeof(Schedule)), schedules[i]);
  }
}

void loadSchedulesFromEEPROM() {
  EEPROM.get(EEPROM_START_ADDR, scheduleCount);
  
  if (scheduleCount > MAX_SCHEDULES) {
    scheduleCount = 0;  // Reset if corrupted
    return;
  }
  
  for (uint8_t i = 0; i < scheduleCount; i++) {
    EEPROM.get(EEPROM_START_ADDR + 1 + (i * sizeof(Schedule)), schedules[i]);
  }
  
  Serial.println("Loaded " + String(scheduleCount) + " schedules from EEPROM");
}