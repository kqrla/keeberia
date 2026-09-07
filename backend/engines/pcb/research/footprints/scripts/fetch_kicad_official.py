import urllib.request
import os

base_url = "https://raw.githubusercontent.com/KiCad/kicad-footprints/master/"

files_to_fetch = [
    # Cherry MX
    ("Button_Switch_Keyboard.pretty/SW_Cherry_MX_1.00u_PCB.kicad_mod", "mx_pcb.kicad_mod"),
    ("Button_Switch_Keyboard.pretty/SW_Cherry_MX_1.00u_Plate.kicad_mod", "mx_plate.kicad_mod"),
    ("Button_Switch_Keyboard.pretty/SW_Hotswap_Kailh_MX_1.00u.kicad_mod", "kailh_hotswap.kicad_mod"),
    ("Button_Switch_Keyboard.pretty/SW_Kailh_Choc_V1_1.00u_Hotswap.kicad_mod", "choc_hotswap.kicad_mod"),
    # Rotary Encoder
    ("Rotary_Encoder.pretty/RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm.kicad_mod", "ec11_switch.kicad_mod"),
    ("Rotary_Encoder.pretty/RotaryEncoder_Alps_EC11E-Vertical_H20mm.kicad_mod", "ec11_no_switch.kicad_mod"),
    # Diodes
    ("Diode_SMD.pretty/D_SOD-123.kicad_mod", "d_sod123.kicad_mod"),
    ("Diode_THT.pretty/D_DO-35_SOD27_P7.62mm_Horizontal.kicad_mod", "d_do35.kicad_mod"),
    # Mounting Hole
    ("MountingHole.pretty/MountingHole_2.2mm_M2.kicad_mod", "m2_hole.kicad_mod"),
    ("MountingHole.pretty/MountingHole_2.2mm_M2_Pad.kicad_mod", "m2_hole_pad.kicad_mod"),
    ("MountingHole.pretty/MountingHole_2.2mm_M2_ISO7380_Pad.kicad_mod", "m2_hole_iso7380.kicad_mod"),
    # LED
    ("LED_SMD.pretty/LED_SK6812MINI-E.kicad_mod", "sk6812_minie.kicad_mod"),
    ("LED_SMD.pretty/LED_SK6812MINI.kicad_mod", "sk6812_mini.kicad_mod"),
    ("LED_SMD.pretty/LED_SK6812_PLCC4_5.0x5.0mm_P3.2mm.kicad_mod", "sk6812_5050.kicad_mod"),
]

os.makedirs("footprints_raw", exist_ok=True)

for remote_path, local_name in files_to_fetch:
    url = base_url + remote_path
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            with open(os.path.join("footprints_raw", local_name), 'w') as f:
                f.write(content)
            print(f"SUCCESS: {local_name}")
    except Exception as e:
        print(f"FAILED {local_name}: {e}")

