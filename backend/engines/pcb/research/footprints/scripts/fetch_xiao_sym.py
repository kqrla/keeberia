import urllib.request

url = "https://raw.githubusercontent.com/matthewychen/hackpadsubmission/main/extras/kicad_care_package/XIAO_RP2040.kicad_sym"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        print(content)
except Exception as e:
    print("Error:", e)
