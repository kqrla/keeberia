import urllib.request
import json

def get_tree(repo):
    url = f"https://api.github.com/repos/{repo}/git/trees/master?recursive=1"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            tree = json.loads(resp.read().decode('utf-8'))['tree']
            for item in tree:
                if 'Hotswap' in item['path'] or 'hotswap' in item['path'] or 'CPG151101' in item['path']:
                    print(repo, ":", item['path'])
    except Exception as e:
        print(f"Error {repo}:", e)

get_tree("perigoso/keyswitch-kicad-library")
get_tree("foostan/kbd")
get_tree("ceoloide/ergogen-footprints")

