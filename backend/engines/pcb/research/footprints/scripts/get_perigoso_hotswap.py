import urllib.request
import json

url = "https://api.github.com/repos/perigoso/keyswitch-kicad-library/contents/library/footprints/Switch_Keyboard_Hotswap_Kailh.pretty"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        for item in data:
            print(item['name'], item['download_url'])
except Exception as e:
    print("Error:", e)

