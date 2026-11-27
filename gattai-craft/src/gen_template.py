# ===== 合体クラフト：ペア結果生成スクリプト（Kaggle GPU用） =====
# 使い方：Kaggleノートブック（GPU T4 x2、Internet on）で全セルを1つのセルに貼って実行。
# 出力：/kaggle/working/pilot_results.jsonl と、統計＋サンプルの表示。
import json, re, time, random

PAIRS = __PAIRS_JSON__
MODEL_ID = "elyza/Llama-3-ELYZA-JP-8B"   # ダメなら "Qwen/Qwen2.5-7B-Instruct" に切替
BATCH = 16
MAX_NEW = 80

SYSTEM = ("あなたは「合体クラフト」というゲームの合体結果を考える係です。"
  "2つの要素を合体させた結果を、必ず次のJSON形式だけで答えてください。"
  "{\"result\":\"結果の名前\",\"emoji\":\"絵文字1つ\",\"reason\":\"20文字以内の一言\"}"
  "ルール：結果は名詞ひとつ。実在の物でも想像上の物でもよいですが、誰でも意味が分かり、思わず頷いたり笑ったりできるものにしてください。"
  "JSON以外の文字は一切書かないでください。")

def parse_result(text):
    m = re.search(r"\{[\s\S]*?\}", text)
    if not m: return None
    try: d = json.loads(m.group(0))
    except Exception: return None
    r = str(d.get("result","")).strip()
    if not r or len(r) > 20: return None
    return {"result": r, "emoji": str(d.get("emoji","✨"))[:4], "reason": str(d.get("reason",""))[:40]}

def main():
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    tok = AutoTokenizer.from_pretrained(MODEL_ID)
    tok.padding_side = "left"
    if tok.pad_token is None: tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(MODEL_ID, load_in_8bit=True, device_map="auto")
    model.eval()
    prompts = []
    for a, b in PAIRS:
        msgs = [{"role":"system","content":SYSTEM},
                {"role":"user","content":f"「{a}」と「{b}」を合体させると何になりますか？"}]
        prompts.append(tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True))
    results, t0 = [], time.time()
    for i in range(0, len(prompts), BATCH):
        chunk = prompts[i:i+BATCH]
        enc = tok(chunk, return_tensors="pt", padding=True).to(model.device)
        with torch.no_grad():
            out = model.generate(**enc, max_new_tokens=MAX_NEW, do_sample=True, temperature=0.8, top_p=0.95, pad_token_id=tok.pad_token_id)
        for j, o in enumerate(out):
            text = tok.decode(o[enc["input_ids"].shape[1]:], skip_special_tokens=True)
            a, b = PAIRS[i+j]
            parsed = parse_result(text)
            results.append({"a": a, "b": b, "ok": parsed is not None, **(parsed or {"raw": text[:120]})})
        print(f"{min(i+BATCH,len(prompts))}/{len(prompts)} done, {time.time()-t0:.0f}s", flush=True)
    ok = [r for r in results if r["ok"]]
    with open("/kaggle/working/pilot_results.jsonl", "w") as f:
        for r in results: f.write(json.dumps(r, ensure_ascii=False) + "\n")
    el = time.time() - t0
    print(f"=== SUMMARY: {len(ok)}/{len(results)} parsed OK, {el:.0f}s total, {el/len(results):.2f}s/pair ===")
    random.seed(7)
    for r in random.sample(ok, min(50, len(ok))):
        print(f'{r["a"]}＋{r["b"]} → {r["result"]} {r["emoji"]}（{r["reason"]}）')
    bad = [r for r in results if not r["ok"]]
    for r in bad[:10]:
        print("PARSE_FAIL:", r["a"], r["b"], r.get("raw","")[:80])

main()
