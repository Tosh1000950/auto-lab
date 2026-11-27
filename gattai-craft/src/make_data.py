# 本生成の結果ファイルから、アプリ用 data.js を一発で作る。
# 使い方: python3 make_data.py <elements.json> <results.jsonl> [<results2.jsonl> ...] <出力data.js>
# - elements.json は本番の elements_final.json（{name,emoji,cat,desc?} のリスト）を想定。
#   elements_v2.json（{name,emoji,cat}）でも可。
# - 内部で build_graph.build() を使い、BFS深さ付きグラフを作って window.GAME_DATA 形式で書き出す。
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_graph import build

def main():
    *inputs, out_js = sys.argv[1:]
    elements_path, results_paths = inputs[0], inputs[1:]
    assert results_paths, "results jsonl が必要"
    tmp = out_js + ".graph.json"
    stats = build(elements_path, results_paths, tmp)
    g = json.load(open(tmp))
    elements = []
    for e in g["elements"]:
        elements.append({"name": e["name"], "emoji": e.get("emoji", "✨"),
                         "cat": e.get("cat", "発見"), "desc": e.get("desc", ""),
                         "depth": e.get("depth")})
    data = {"elements": elements, "recipes": g["recipes"], "starters": g["starters"]}
    with open(out_js, "w") as f:
        f.write("window.GAME_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n")
    os.remove(tmp)
    print("stats:", stats)
    print("data.js written:", out_js)

if __name__ == "__main__":
    main()
