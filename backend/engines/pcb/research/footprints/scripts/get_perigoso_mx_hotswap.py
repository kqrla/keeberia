import urllib.request
import json

url = "https://raw.githubusercontent.com/perigoso/keyswitch-kicad-library/main/library/footprints/Switch_Keyboard_Hotswap_Kailh.pretty/SW_Hotswap_Kailh_MX_1.00u.kicad_mod"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        print("Downloaded perigoso SW_Hotswap_Kailh_MX_1.00u.kicad_mod!")
        with open("footprints_raw/SW_Hotswap_Kailh_MX_1.00u_perigoso.kicad_mod", "w") as f:
            f.write(content)
except Exception as e:
    print("Error:", e)

