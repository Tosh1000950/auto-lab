# 生成結果(jsonl)＋要素リストから、ゲーム用データ(graph.json)を組み立てる。
# - 結果として現れた新語は要素として取り込む（絵文字・一言は生成結果から採用）
# - 開始要素(水・火・土・風)からの到達可能性(BFS深さ)を付け、未到達の要素は「未解禁」として数える
# - レシピのないペアは uncovered として数え、本制作の追加生成対象にする
import json, sys, collections

def build(elements_path, results_paths, out_path):
    elements = {e["name"]: e for e in json.load(open(elements_path))}
    recipes = {}
    for rp in results_paths:
        for line in open(rp):
            r = json.loads(line)
            if not r.get("ok"): continue
            key = "|".join(sorted([r["a"], r["b"]]))
            if key in recipes: continue
            recipes[key] = r["result"]
            if r["result"] not in elements:
                elements[r["result"]] = {"name": r["result"], "emoji": r.get("emoji","✨"),
                                          "cat": "発見", "desc": r.get("reason","")}
            elif "desc" not in elements[r["result"]] and r.get("reason"):
                elements[r["result"]]["desc"] = r["reason"]
    starters = ["水","火","土","風"]
    depth = {s: 0 for s in starters}
    dq = collections.deque(starters)
    adj = collections.defaultdict(set)
    for key, res in recipes.items():
        a, b = key.split("|")
        adj[a].add((key, res)); adj[b].add((key, res))
    while dq:
        cur = dq.popleft()
        for key, res in adj[cur]:
            if res not in depth:
                depth[res] = depth[cur] + 1
                dq.append(res)
    for name, e in elements.items():
        e["depth"] = depth.get(name)
    reachable = [n for n, d in depth.items()]
    uncovered = []
    names = sorted(reachable)
    for i, a in enumerate(names):
        for b in names[i:]:
            if "|".join(sorted([a,b])) not in recipes:
                uncovered.append([a,b])
    data = {"elements": sorted(elements.values(), key=lambda e: (e["depth"] is None, e["depth"] or 0, e["name"])),
            "recipes": recipes, "starters": starters,
            "stats": {"elements": len(elements), "reachable": len(reachable),
                      "recipes": len(recipes), "uncovered_reachable_pairs": len(uncovered)}}
    json.dump(data, open(out_path, "w"), ensure_ascii=False)
    json.dump(uncovered, open(out_path + ".uncovered.json", "w"), ensure_ascii=False)
    return data["stats"]

if __name__ == "__main__":
    print(build(sys.argv[1], sys.argv[2:-1], sys.argv[-1]))
