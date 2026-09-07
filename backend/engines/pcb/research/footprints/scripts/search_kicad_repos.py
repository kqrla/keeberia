import urllib.request
import json

def get_repo_tree(repo, path=""):
    url = f"https://api.github.com/repos/{repo}/contents/{path}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return [item['name'] for item in data]
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

print("Button_Switch_Keyboard.pretty contents:")
bsk = get_repo_tree("KiCad/kicad-footprints", "Button_Switch_Keyboard.pretty")
for f in bsk:
    if "Hotswap" in f or "Cherry" in f or "Kailh" in f or "MX" in f:
        print("  ", f)

print("\nLED_SMD.pretty contents matching SK6812 / WS2812 / 3535 / 5050:")
leds = get_repo_tree("KiCad/kicad-footprints", "LED_SMD.pretty")
for f in leds:
    if "SK68" in f or "WS28" in f or "3535" in f or "5050" in f:
        print("  ", f)

print("\nRotary_Encoder.pretty contents:")
re_files = get_repo_tree("KiCad/kicad-footprints", "Rotary_Encoder.pretty")
for f in re_files:
    if "EC11" in f:
        print("  ", f)

