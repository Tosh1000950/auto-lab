# 本生成の結果ファイルから、アプリ用 data.js を一発で作る。
# 使い方: python3 make_data.py <elements.json> <results.jsonl> [<results2.jsonl> ...] <出力data.js>
# - elements.json は本番の elements_final.json（{name,emoji,cat,desc?} のリスト）を想定。
#   elements_v2.json（{name,emoji,cat}）でも可。
# - 内部で build_graph.build() を使い、BFS深さ付きグラフを作って window.GAME_DATA 形式で書き出す。
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_graph import build

# 絵文字の重複解消（2026-11-28 本人指摘：同じ絵文字ばかりで分かりづらい）。
# 最初の出現はそのまま残し、重複した要素には分類別の候補プールから未使用の絵文字を割り当てる。
EMOJI_POOLS = {
    "自然": ["🌋","🌊","🌲","🍃","🪨","💧","🔥","🌪️","☀️","🌙","⭐","🌈","❄️","🌸","🏔️","🏝️","🌵","🍄","🌾","🪵"],
    "素材": ["🧱","🔩","🧶","🪡","🧵","🪙","💎","🔮","🧊","🪞","🕯️","🫙","📦","🪣","🪟","🔗","🪢","🧲","🪔","🛢️"],
    "生物": ["🐛","🐝","🐞","🦋","🐌","🐜","🦗","🐙","🦀","🐠","🐸","🦎","🦉","🦇","🐚","🪸","🦔","🦢","🦩","🐳"],
    "食べ物": ["🍎","🍇","🍞","🧀","🍖","🍰","🍩","🍪","🍯","🍚","🍜","🍣","🍙","🍵","☕","🥛","🍺","🍕","🍔","🥗"],
    "発見": ["🔍","💡","🗺️","🧭","🎁","🏆","👑","🚪","🗝️","⏳","🔔","📜","🎈","🪄","🔭","🧿","🪆","🎲","🧩","🛎️"],
    "概念": ["💭","🕊️","⚖️","🎭","🎵","🌀","🔯","☯️","♾️","✝️","🛐","💠","🔱","🎯","🧠","👁️","🗣️","🤝","📿","🌌"],
    "乗り物": ["🚗","🚢","✈️","🚲","🚃","🚀","🛵","🚁","🛶","🏍️","🚕","🚌","🚜","🛴","🚂","⛵","🛸","🚠","🛻","🚑"],
    "場所": ["🏠","🏯","🏥","🏫","🏪","🌉","⛩️","🏭","🏦","🏨","🎡","🎢","🏟️","🗼","🏛️","⛲","🏖️","🏕️","🛖","🏘️"],
    "季節": ["🍂","🌷","🏖️","🍁","⛄","🎃","🎍","🌕","🌡️","☔","🌦️","🌤️","⛈️","🌩️","🌨️","🌤️","🍃","🌼","🌻","🦋"],
    "感情": ["😊","😢","😠","😲","🥰","😴","🤔","😆","😨","😌","🥺","😤","🤗","😍","😭","😅","🙂","😳","😇","🥹"],
    "技術": ["⚙️","🔌","💻","📱","📷","📺","🔋","💾","🖨️","⌚","📡","🛰️","🤖","🦾","🔬","🧪","⚗️","🔭","📐","🧮"],
    "職業": ["🧑‍🏭","🧑‍⚕️","🧑‍🏫","🧑‍🍳","🧑‍🚒","🧑‍✈️","🧑‍🎨","🧑‍🔬","🧑‍💻","🧑‍🌾","🕵️","💂","👷","🧙","🥷","🦸","🧑‍🚀","🧑‍⚖️","💇","🕺"],
    "色": ["🎨","🔴","🔵","🟡","🟢","🟣","🟠","⚫","⚪","🟤","🩷","🩵","💛","💜","🧡","🤎","🖤","🤍","🌈","✨"],
    "道具": ["🔧","🔨","🪓","🔑","🧰","🪜","🧹","🪣","✂️","🪚","🔩","🗡️","🛡️","🏹","🎣","🧲","🔦","🕯️","🧯","🪤"],
}
GENERIC_POOL = ["✨","💫","🌟","🔹","🔸","🫧","🍥","🎐","🪷","🦚","🪶","🐾","🍀","🌺","🪴","🧸","🎀","🪅","🎑","🏮"]

# よく出る要素名の意味的に正しい絵文字（プールより優先）
EMOJI_OVERRIDES = {
    "村": "🏘️", "泥": "🟤", "温泉": "♨️", "虹": "🌈", "溶岩": "🌋", "蒸気": "💨",
    "嵐": "🌩️", "石": "🗿", "煙": "🌫️", "霧": "🌁", "雷": "⚡", "雪": "❄️",
    "氷": "🧊", "雲": "☁️", "雨": "🌧️", "星": "⭐", "月": "🌙", "太陽": "☀️",
    "山": "⛰️", "島": "🏝️", "砂漠": "🏜️", "森": "🌳", "木": "🌲", "海": "🌊", "川": "🏞️",
    "泡": "🫧", "光": "✨", "影": "🌑", "音": "🎵", "炎": "🔥", "砂": "🏖️",
    "人間": "🧑", "子供": "🧒", "老人": "🧓", "王": "🤴", "騎士": "⚔️", "魔法使い": "🧙",
}

def dedup_emojis(elements):
    used = {}
    changed = []
    for e in elements:
        em = (e.get("emoji") or "").strip()
        ov = EMOJI_OVERRIDES.get(e["name"])
        if ov and ov not in used:
            if em != ov:
                changed.append((e["name"], em or "(なし)", ov))
            used[ov] = e["name"]
            e["emoji"] = ov
            continue
        if em and em not in used:
            used[em] = e["name"]
            e["emoji"] = em
            continue
        pool = EMOJI_POOLS.get(e.get("cat", ""), []) + GENERIC_POOL
        repl = next((p for p in pool if p not in used), None)
        if repl is None:
            repl = em or "✨"  # プール枯渇時は重複を許容（ほぼ起きない）
        else:
            changed.append((e["name"], em or "(なし)", repl))
            used[repl] = e["name"]
            e["emoji"] = repl
    return changed

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
    changed = dedup_emojis(elements)
    if changed:
        print("emoji dedup: %d 件を差し替え" % len(changed))
        for name, old, new in changed:
            print("  %s: %s -> %s" % (name, old, new))
    data = {"elements": elements, "recipes": g["recipes"], "starters": g["starters"]}
    with open(out_js, "w") as f:
        f.write("window.GAME_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n")
    os.remove(tmp)
    print("stats:", stats)
    print("data.js written:", out_js)

if __name__ == "__main__":
    main()
