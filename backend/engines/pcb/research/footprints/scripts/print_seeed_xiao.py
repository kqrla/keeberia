with open("footprints_hackpad/XIAO-SAMD21-RP2040.kicad_mod") as f:
    text = f.read()
    pads = [line for line in text.split('\n') if '(pad' in line]
    for p in pads:
        print(p)
