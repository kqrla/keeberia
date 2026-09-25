import urllib.request
import urllib.parse
import os

base_raw = "https://raw.githubusercontent.com/hackclub/hackpad/main/"

files_to_download = [
    # Care package
    ("extras/kicad_care_package/footprints.pretty/MX-Solderable-1U.kicad_mod", "MX-Solderable-1U.kicad_mod"),
    ("extras/kicad_care_package/footprints.pretty/XIAO-Generic-Hybrid-14P-2.54-21X17.8MM.kicad_mod", "XIAO-Generic-Hybrid-14P.kicad_mod"),
    # Hotswap
    ("hackboards/dari_awesomesauce_board/pcb/libs/MX_Hotswap.pretty/MX-Hotswap-1U.kicad_mod", "MX-Hotswap-1U.kicad_mod"),
    # XIAO RP2040
    ("hackpads/3XAY_Hackpad/pcb/libraries/Seeed Studio XIAO Series Library/XIAO-SAMD21-RP2040-14P-2.54-21X17.8MM (Seeeduino XIAO).kicad_mod", "XIAO-SAMD21-RP2040.kicad_mod"),
    ("hackpads/Anson's HackPad/PCB/footprints/XIAO-RP2040-SMD.kicad_mod", "XIAO-RP2040-SMD.kicad_mod"),
    # SK6812 MINI-E
    ("hackpads/3XAY_Hackpad/pcb/libraries/kbd.pretty/YS-SK6812MINI-E.kicad_mod", "YS-SK6812MINI-E.kicad_mod"),
    ("hackpads/Anson's HackPad/PCB/footprints/SK6812MINI-E.kicad_mod", "SK6812MINI-E.kicad_mod"),
    # OLED
    ("hackpads/3XAY_Hackpad/pcb/libraries/KiCad-SSD1306-0.91-OLED-4pin-128x32.pretty-master/KiCad-SSD1306-0.91-OLED-4pin-128x32.pretty-master/SSD1306-0.91-OLED-4pin-128x32.kicad_mod", "SSD1306-0.91-OLED.kicad_mod"),
    ("hackpads/Anson's HackPad/PCB/footprints/SSD1306-0.91-OLED-4pin-128x32.kicad_mod", "SSD1306-Anson.kicad_mod"),
]

os.makedirs("footprints_hackpad", exist_ok=True)

for remote_path, local_name in files_to_download:
    encoded_path = urllib.parse.quote(remote_path)
    url = base_raw + encoded_path
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            with open(os.path.join("footprints_hackpad", local_name), 'w') as f:
                f.write(content)
            print(f"SUCCESS: {local_name}")
    except Exception as e:
        print(f"FAILED {local_name} ({url}): {e}")

