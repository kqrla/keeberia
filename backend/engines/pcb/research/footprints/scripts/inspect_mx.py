with open("footprints_raw/mx_pcb.kicad_mod") as f:
    print("--- KiCad Official SW_Cherry_MX_1.00u_PCB ---")
    print(f.read())

with open("footprints_care_package/MX-Solderable-1U.kicad_mod") as f:
    print("\n--- Hack Club Care Package MX-Solderable-1U ---")
    print(f.read())
