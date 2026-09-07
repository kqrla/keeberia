import os
import re

def parse_kicad_mod(file_path):
    print("==================================================")
    print("FILE:", file_path)
    print("==================================================")
    with open(file_path, 'r') as f:
        content = f.read()

    # Extract footprint name
    fp_match = re.search(r'\(footprint\s+"?([^"\s\)]+)"?', content)
    if not fp_match:
        fp_match = re.search(r'\(module\s+"?([^"\s\)]+)"?', content)
    if fp_match:
        print("Footprint Name:", fp_match.group(1))

    # Extract pads
    # KiCad v5/v6/v7 pad format:
    # (pad "1" thru_hole circle (at -3.81 -2.54) (size 2.2 2.2) (drill 1.5) ...)
    # (pad "1" smd rect (at 0 0) (size 1.5 2.5) ...)
    
    pads = []
    # simple regex parser for pad expressions
    pad_blocks = re.findall(r'\(pad\s+.*?\)(?=\s*\(pad|\s*\(fp_|\s*\(model|\s*\))', content, re.DOTALL)
    for pb in pad_blocks:
        # clean single-line representation
        pb_clean = " ".join(pb.split())
        pads.append(pb_clean)

    print(f"Total pads found: {len(pads)}")
    for p in pads[:30]: # print first 30 pads
        print("  ", p)

parse_kicad_mod("footprints_raw/mx_pcb.kicad_mod")
parse_kicad_mod("footprints_care_package/MX-Solderable-1U.kicad_mod")
parse_kicad_mod("footprints_hackpad/MX-Hotswap-1U.kicad_mod")
parse_kicad_mod("footprints_hackpad/XIAO-Generic-Hybrid-14P.kicad_mod")
parse_kicad_mod("footprints_hackpad/XIAO-RP2040-SMD.kicad_mod")
parse_kicad_mod("footprints_hackpad/YS-SK6812MINI-E.kicad_mod")
parse_kicad_mod("footprints_hackpad/SSD1306-0.91-OLED.kicad_mod")
parse_kicad_mod("footprints_raw/ec11_switch.kicad_mod")
parse_kicad_mod("footprints_raw/d_sod123.kicad_mod")
parse_kicad_mod("footprints_raw/d_do35.kicad_mod")
parse_kicad_mod("footprints_raw/m2_hole_pad.kicad_mod")
