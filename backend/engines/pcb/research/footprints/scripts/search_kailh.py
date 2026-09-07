import urllib.request
import json

url = "https://api.github.com/search/code?q=filename:SW_Hotswap_Kailh_MX_1.00u.kicad_mod"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Found items:", len(data.get('items', [])))
        for item in data.get('items', [])[:5]:
            print(item['name'], item['html_url'])
            raw_url = item['html_url'].replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
            print("  Raw:", raw_url)
except Exception as e:
    print("Error:", e)

