# Arduino School Bell Controller

## Hardware Setup

### Components Required:
- Arduino Uno
- HC-05 Bluetooth Module
- DS3231 RTC Module
- 16x2 I2C LCD Display
- Relay Module (for bell control)
- Electric Bell
- Jumper wires
- Breadboard/PCB

### Wiring Connections:

#### HC-05 Bluetooth Module:
- VCC → 5V
- GND → GND
- RX → Pin 3 (Arduino TX)
- TX → Pin 2 (Arduino RX)

#### DS3231 RTC Module:
- VCC → 5V
- GND → GND
- SDA → A4 (Arduino SDA)
- SCL → A5 (Arduino SCL)

#### 16x2 I2C LCD:
- VCC → 5V
- GND → GND
- SDA → A4 (Arduino SDA)
- SCL → A5 (Arduino SCL)

#### Bell Control (Relay):
- Signal → Pin 4
- VCC → 5V
- GND → GND

## Required Libraries

Install these libraries in Arduino IDE:

1. **RTClib** by Adafruit
2. **LiquidCrystal_I2C** by Frank de Brabander
3. **ArduinoJson** by Benoit Blanchon
4. **SoftwareSerial** (built-in)

### Installing Libraries:
1. Open Arduino IDE
2. Go to Tools → Manage Libraries
3. Search for each library and click Install

## Setup Instructions

1. **Upload the Code:**
   - Open `school_bell_controller.ino` in Arduino IDE
   - Select your Arduino board and port
   - Upload the code

2. **Set RTC Time (First time only):**
   - Uncomment this line in setup():
   ```cpp
   rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
   ```
   - Upload once, then comment it back and upload again

3. **Test Bluetooth Connection:**
   - Pair HC-05 with your phone (default PIN: 1234)
   - Use Serial Monitor to see connection status

## JSON Communication Protocol

### Send Schedules:
```json
{
  "schedules": [
    {
      "time": "08:30:00",
      "date": "2024-01-15",
      "active": true
    },
    {
      "time": "09:30:00",
      "date": "",
      "active": true
    }
  ]
}
```

### Send Holidays:
```json
{
  "holidays": [
    {
      "date": "2024-12-25"
    },
    {
      "date": "2024-01-01"
    }
  ]
}
```

### Commands:
```json
{"command": "ring_bell"}
{"command": "get_time"}
{"command": "get_status"}
```

## Features

- **Automatic Bell Ringing:** Based on scheduled times
- **Holiday Support:** No bells on configured holidays
- **Recurring Schedules:** Daily repeating schedules
- **One-time Schedules:** Specific date schedules
- **Manual Bell Control:** Ring bell via app command
- **Status Display:** Current time and schedule count on LCD
- **Persistent Storage:** Schedules saved in EEPROM
- **Bluetooth Control:** Full control via mobile app

## Troubleshooting

### Common Issues:

1. **RTC not working:**
   - Check wiring connections
   - Ensure RTC has backup battery
   - Verify I2C address

2. **LCD not displaying:**
   - Check I2C address (try 0x3F if 0x27 doesn't work)
   - Verify wiring connections
   - Test with I2C scanner

3. **Bluetooth not connecting:**
   - Check HC-05 wiring
   - Verify baud rate (9600)
   - Reset HC-05 module

4. **Bell not ringing:**
   - Check relay connections
   - Verify bell power supply
   - Test relay manually

### I2C Address Detection:
If LCD doesn't work, scan for I2C address:
```cpp
#include <Wire.h>
void setup() {
  Serial.begin(9600);
  Wire.begin();
  for(int i = 1; i < 127; i++) {
    Wire.beginTransmission(i);
    if(Wire.endTransmission() == 0) {
      Serial.println("Address: 0x" + String(i, HEX));
    }
  }
}
```

## Safety Notes

- Use appropriate relay for your bell's voltage/current
- Ensure proper grounding
- Use fuses for high-current applications
- Test thoroughly before deployment