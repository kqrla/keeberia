import urllib.request
import json

def get_repo_contents(repo, path=""):
    url = f"https://api.github.com/repos/{repo}/contents/{path}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

contents = get_repo_contents("matthewychen/hackpadsubmission", "extras/kicad_care_package")
print("matthewychen contents:")
for item in contents:
    print(" ", item['name'], item['download_url'])

contents2 = get_repo_contents("AfshinJamseed/My-Hackpad", "kicad_care_package")
print("AfshinJamseed contents:")
for item in contents2:
    print(" ", item['name'], item['download_url'])

