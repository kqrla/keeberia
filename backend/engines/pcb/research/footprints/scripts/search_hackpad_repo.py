import urllib.request
import json
import os

url = "https://api.github.com/repos/hackclub/hackpad/git/trees/main?recursive=1"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        tree = json.loads(resp.read().decode('utf-8'))['tree']
        for item in tree:
            if item['path'].endswith('.kicad_mod') or item['path'].endswith('kicad_care_package.zip'):
                print(item['path'])
except Exception as e:
    print("Error:", e)

