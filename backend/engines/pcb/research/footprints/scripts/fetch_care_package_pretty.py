import urllib.request
import json
import os

def get_repo_contents(repo, path=""):
    url = f"https://api.github.com/repos/{repo}/contents/{path}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

os.makedirs("footprints_care_package", exist_ok=True)

contents = get_repo_contents("matthewychen/hackpadsubmission", "extras/kicad_care_package/footprints.pretty")
print("footprints.pretty files:")
for item in contents:
    print(" ", item['name'])
    if item['download_url']:
        req = urllib.request.Request(item['download_url'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            with open(os.path.join("footprints_care_package", item['name']), 'w') as f:
                f.write(content)

