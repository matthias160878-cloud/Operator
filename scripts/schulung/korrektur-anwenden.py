# Setzt die Texte aus korrektur-texte.json (Schlüssel "<datei>.<pfad>") in messages/<sprache>/ ein.
# Aufruf: python3 scripts/schulung/korrektur-anwenden.py <sprache> [<sprache> ...]
# Für andere Sprachen als de/en: erst die Übersetzung in scripts/schulung/korrektur-<sprache>.json ablegen (gleiche Schlüssel).
import json, os, sys
root = os.path.join(os.path.dirname(__file__), "..", "..")
def setpath(d, parts, val):
    for p in parts[:-1]:
        d = d[int(p)] if isinstance(d, list) else d[p]
    last = parts[-1]
    if isinstance(d, list): d[int(last)] = val
    else: d[last] = val
for lang in sys.argv[1:]:
    src = os.path.join(os.path.dirname(__file__), f"korrektur-{lang}.json")
    data = json.load(open(src)) if os.path.exists(src) else json.load(open(os.path.join(os.path.dirname(__file__), "korrektur-texte.json")))[lang]
    files = {}
    for key, val in data.items():
        f, *parts = key.split(".")
        path = os.path.join(root, "messages", lang, f + ".json")
        files.setdefault(path, json.load(open(path)))
        setpath(files[path], parts, val)
    for path, obj in files.items():
        json.dump(obj, open(path, "w"), ensure_ascii=False, indent=2); open(path, "a").write("\n")
    print(lang, "ok")
