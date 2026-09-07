import urllib.request

urls = [
    "https://raw.githubusercontent.com/perigoso/keyswitch-kicad-library/master/Footprints/SW_Hotswap_Kailh_MX_1.00u.kicad_mod",
    "https://raw.githubusercontent.com/foostan/kbd/main/kicad/footprints/SW_Hotswap_Kailh_MX_1.00u.kicad_mod",
    "https://raw.githubusercontent.com/mThinker/SW_Hotswap_Kailh_MX/master/SW_Hotswap_Kailh_MX_1.00u.kicad_mod",
    "https://raw.githubusercontent.com/marquant/kicad-footprints/master/Button_Switch_Keyboard.pretty/SW_Hotswap_Kailh_MX_1.00u.kicad_mod"
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            print(f"SUCCESS: {url}")
            with open("footprints_raw/kailh_hotswap_perigoso.kicad_mod", "w") as f:
                f.write(content)
            break
    except Exception as e:
        print(f"Failed {url}: {e}")

