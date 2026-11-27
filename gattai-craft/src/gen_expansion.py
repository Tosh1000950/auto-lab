import json, re, time, random, itertools, collections

BASE = [["水", "💧", "自然"], ["火", "🔥", "自然"], ["土", "🪨", "自然"], ["風", "🌪️", "自然"], ["海", "🌊", "自然"], ["山", "⛰️", "自然"], ["森", "🌲", "自然"], ["雨", "🌧️", "自然"], ["雪", "❄️", "自然"], ["雷", "⚡", "自然"], ["太陽", "☀️", "自然"], ["月", "🌙", "自然"], ["星", "⭐", "自然"], ["川", "🏞️", "自然"], ["砂", "🏜️", "自然"], ["島", "🏝️", "自然"], ["雲", "☁️", "自然"], ["猫", "🐱", "生物"], ["犬", "🐶", "生物"], ["鳥", "🐦", "生物"], ["魚", "🐟", "生物"], ["虫", "🐛", "生物"], ["花", "🌸", "生物"], ["木", "🌳", "生物"], ["草", "🌿", "生物"], ["キノコ", "🍄", "生物"], ["人間", "🧑", "生物"], ["卵", "🥚", "生物"], ["米", "🍚", "食べ物"], ["パン", "🍞", "食べ物"], ["塩", "🧂", "食べ物"], ["砂糖", "🍬", "食べ物"], ["牛乳", "🥛", "食べ物"], ["お茶", "🍵", "食べ物"], ["酒", "🍶", "食べ物"], ["石", "🪨", "素材"], ["木材", "🪵", "素材"], ["鉄", "🔩", "素材"], ["ガラス", "🔮", "素材"], ["紙", "📄", "素材"], ["火薬", "🧨", "素材"], ["電気", "🔌", "概念"], ["時計", "⏰", "概念"], ["本", "📖", "概念"], ["音", "🎵", "概念"], ["夢", "💭", "概念"], ["愛", "❤️", "概念"], ["蒸気", "♨️", "自然"], ["煙", "💨", "自然"], ["氷", "🧊", "自然"], ["泡", "🫧", "自然"], ["光", "✨", "概念"], ["影", "🌑", "概念"], ["炎", "🔥", "自然"], ["泥", "🟤", "自然"], ["学校", "🏫", "場所"], ["病院", "🏥", "場所"], ["駅", "🚉", "場所"], ["港", "⚓", "場所"], ["城", "🏯", "場所"], ["橋", "🌉", "場所"], ["店", "🏪", "場所"], ["畑", "🌾", "場所"], ["医者", "🩺", "職業"], ["先生", "🧑‍🏫", "職業"], ["漁師", "🎣", "職業"], ["大工", "🔨", "職業"], ["魔法使い", "🧙", "職業"], ["勇者", "🦸", "職業"], ["王様", "👑", "職業"], ["赤ちゃん", "👶", "生物"], ["お年寄り", "🧓", "生物"], ["ロボット", "🤖", "概念"], ["幽霊", "👻", "概念"], ["ドラゴン", "🐉", "生物"], ["剣", "⚔️", "道具"], ["盾", "🛡️", "道具"], ["鍵", "🔑", "道具"], ["車", "🚗", "乗り物"], ["船", "🚢", "乗り物"], ["飛行機", "✈️", "乗り物"], ["自転車", "🚲", "乗り物"], ["電車", "🚃", "乗り物"], ["赤", "🔴", "色"], ["青", "🔵", "色"], ["金色", "🥇", "色"], ["春", "🌷", "季節"], ["夏", "🏖️", "季節"], ["秋", "🍂", "季節"], ["冬", "⛄", "季節"], ["朝", "🌅", "概念"], ["夜", "🌃", "概念"], ["笑顔", "😊", "感情"], ["涙", "😢", "感情"], ["勇気", "🦁", "感情"]]
STARTERS = ["水","火","土","風"]
NEW40 = ["学校","病院","駅","港","城","橋","店","畑","医者","先生","漁師","大工","魔法使い","勇者","王様","赤ちゃん","お年寄り","ロボット","幽霊","ドラゴン","剣","盾","鍵","車","船","飛行機","自転車","電車","赤","青","金色","春","夏","秋","冬","朝","夜","笑顔","涙","勇気"]
OUT = "/kaggle/working/results_expansion.jsonl"
CANDOUT = "/kaggle/working/results_expansion_candidates.jsonl"
TIME_LIMIT = 6 * 3600
RATE = 2.7  # sec per pair (best-of-3 + judge), measured in pilot
TOTAL_PAIR_BUDGET = 3200

SYSTEM2 = ("あなたは「合体クラフト」というゲームの合体結果を考える係です。2つの要素を合体させた結果を、次の形式の1行だけで答えてください。\n"
"結果の名前｜絵文字1つ｜20文字以内の一言\n"
"例：\n水と火 → 蒸気｜♨️｜熱せられて気体になった\n木と火 → 炭｜⬛｜燃え残った黒いかたまり\n雨と太陽 → 虹｜🌈｜雨上がりの空にかかる橋\n人間と木材 → 家具｜🪑｜暮らしを支える道具\n"
"ルール：結果は名詞ひとつ。2つの名前をそのままくっつけただけの答え（山と花で山花、のようなもの）は避けてください。ただし台風や水星のように実在の言葉として意味が通る場合は構いません。誰でも意味が分かり「なるほど」と思えるものを選んでください。形式の1行以外は一切書かないでください。")
JUDGE_SYS = ("あなたは審査員です。合体結果の候補から、最も「なるほど！」と思えるもの、または最も面白いものを1つ選び、その番号だけを半角数字で答えてください。他の文字は書かないでください。")

def clean_name(s, a, b):
    s = s.strip()
    s = re.sub(r"^.*?→", "", s) if "→" in s[:14] else s
    s = s.strip().strip("「」『』\"' 　")
    s = re.sub(r"[。．・]+$", "", s)
    return s.strip()

def parse_line(text, a, b):
    for line in text.splitlines():
        line = line.strip()
        if "｜" in line:
            parts = [p.strip() for p in line.split("｜")]
            if parts and parts[0]:
                name = clean_name(parts[0], a, b)
                if name and len(name) <= 20:
                    return {"result": name, "emoji": (parts[1] if len(parts) > 1 else "✨")[:4], "reason": (parts[2] if len(parts) > 2 else "")[:40]}
    strs = re.findall(r'"([^"]*)"', text)
    if strs:
        try: i = strs.index("result")
        except ValueError: i = -1
        rest = strs[i+1:] if i >= 0 else strs
        if rest and rest[0]:
            name = clean_name(rest[0], a, b)
            if name and len(name) <= 20:
                emoji, reason = "✨", ""
                for s in rest[1:]:
                    if any(ord(c) > 0x2000 for c in s) and len(s) <= 4 and emoji == "✨": emoji = s
                    elif len(s) > len(reason): reason = s
                return {"result": name, "emoji": emoji, "reason": reason}
    return None

def gen_batch(model, tok, prompts, max_new, temp):
    import torch
    outs, B = [], 24
    for i in range(0, len(prompts), B):
        chunk = prompts[i:i+B]
        enc = tok(chunk, return_tensors="pt", padding=True).to(model.device)
        with torch.no_grad():
            out = model.generate(**enc, max_new_tokens=max_new, do_sample=temp > 0, temperature=temp if temp > 0 else None, top_p=0.95 if temp > 0 else None, pad_token_id=tok.pad_token_id)
        for o in out:
            outs.append(tok.decode(o[enc["input_ids"].shape[1]:], skip_special_tokens=True))
    return outs

def run_pairs(model, tok, pairs, fout, fcand, t0):
    prompts = []
    for a, b in pairs:
        msgs = [{"role":"system","content":SYSTEM2},{"role":"user","content":f"「{a}」と「{b}」を合体させると何になりますか？"}]
        p = tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
        prompts.extend([p, p, p])
    texts = gen_batch(model, tok, prompts, 60, 0.9)
    cand = {}
    for idx, (a, b) in enumerate(pairs):
        seen, lst = set(), []
        for t in texts[idx*3:idx*3+3]:
            p = parse_line(t, a, b)
            if p and p["result"] not in seen and p["result"] not in (a, b):
                seen.add(p["result"]); lst.append(p)
        cand[(a, b)] = lst
        fcand.write(json.dumps({"a": a, "b": b, "cands": lst}, ensure_ascii=False) + "\n")
    fcand.flush()
    multi = {k: v for k, v in cand.items() if len(v) >= 2}
    jprompts, jkeys = [], []
    for (a, b), lst in multi.items():
        opts = "\n".join(f"{i+1}. {c['result']}（{c['reason']}）" for i, c in enumerate(lst))
        msgs = [{"role":"system","content":JUDGE_SYS},{"role":"user","content":f"「{a}」と「{b}」の合体結果の候補です。\n{opts}"}]
        jprompts.append(tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)); jkeys.append((a, b))
    jtexts = gen_batch(model, tok, jprompts, 4, 0) if jprompts else []
    picks = {}
    for (a, b), t in zip(jkeys, jtexts):
        m = re.search(r"[123]", t)
        picks[(a, b)] = int(m.group(0)) - 1 if m else 0
    done = 0
    for (a, b), lst in cand.items():
        if not lst: continue
        c = lst[min(picks.get((a, b), 0), len(lst) - 1)] if len(lst) >= 2 else lst[0]
        fout.write(json.dumps({"a": a, "b": b, **c}, ensure_ascii=False) + "\n")
        done += 1
    fout.flush()
    return done

def main():
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    t0 = time.time()
    tok = AutoTokenizer.from_pretrained("elyza/Llama-3-ELYZA-JP-8B")
    tok.padding_side = "left"
    if tok.pad_token is None: tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained("elyza/Llama-3-ELYZA-JP-8B", dtype="float16", device_map="auto")
    model.eval()
    elements = {n: {"name": n, "emoji": e, "cat": c} for n, e, c in BASE}
    fout = open(OUT, "w"); fcand = open(CANDOUT, "w")
    total = 0
    # Phase 1: all pairs among base elements (incl. self pairs)
    names = [n for n, _, _ in BASE]
    pairs = [(a, b) for i, a in enumerate(names) for b in names[i:] if a in NEW40 or b in NEW40]
    total += run_pairs(model, tok, pairs, fout, fcand, t0)
    print(f"phase1 done: {total} recipes, {time.time()-t0:.0f}s", flush=True)
    # Phase 2+: BFS rounds over discovered elements
    while total < TOTAL_PAIR_BUDGET and time.time() - t0 < TIME_LIMIT:
        recipes = {}
        for line in open(OUT):
            r = json.loads(line)
            recipes["|".join(sorted([r["a"], r["b"]]))] = r["result"]
            if r["result"] not in elements:
                elements[r["result"]] = {"name": r["result"], "emoji": r.get("emoji", "✨"), "cat": "発見", "desc": r.get("reason", "")}
        depth = {s: 0 for s in STARTERS}
        dq = collections.deque(STARTERS)
        adj = collections.defaultdict(set)
        for key, res in recipes.items():
            a, b = key.split("|")
            adj[a].add(res); adj[b].add(res)
        while dq:
            cur = dq.popleft()
            for res in adj[cur]:
                if res not in depth:
                    depth[res] = depth[cur] + 1; dq.append(res)
        reach = sorted(depth.keys(), key=lambda n: (depth[n], n))
        todo = []
        for i, a in enumerate(reach):
            for b in reach[i:]:
                if "|".join(sorted([a, b])) not in recipes:
                    todo.append((depth[a] + depth[b], a, b))
        todo.sort()
        room = TOTAL_PAIR_BUDGET - total
        batch = [(a, b) for _, a, b in todo[:room]]
        if not batch: break
        total += run_pairs(model, tok, batch, fout, fcand, t0)
        print(f"phase round done: {total} recipes total, elements {len(elements)}, {time.time()-t0:.0f}s", flush=True)
    json.dump(list(elements.values()), open("/kaggle/working/elements_final.json", "w"), ensure_ascii=False)
    print(f"=== PROD SUMMARY: recipes {total}, elements {len(elements)}, {time.time()-t0:.0f}s ===")

main()
