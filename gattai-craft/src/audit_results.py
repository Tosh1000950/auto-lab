# 生成結果(jsonl)の品質監査：件数・接合率・空理由・重複・到達可能性の集計。
# 使い方: python3 audit_results.py <results.jsonl> [<results2.jsonl> ...]
import json, sys, collections

def is_splice(a, b, r):
    # 2要素の名前をそのまま連結しただけの結果か（順序2通り）
    return r == a + b or r == b + a

def main():
    total = 0
    splices, empty_reason, same_as_input = [], 0, 0
    results = collections.Counter()
    pairs = set()
    for path in sys.argv[1:]:
        for line in open(path):
            r = json.loads(line)
            total += 1
            key = "|".join(sorted([r["a"], r["b"]]))
            pairs.add(key)
            results[r["result"]] += 1
            if is_splice(r["a"], r["b"], r["result"]):
                splices.append((r["a"], r["b"], r["result"]))
            if not r.get("reason"):
                empty_reason += 1
            if r["result"] in (r["a"], r["b"]):
                same_as_input += 1
    print(f"総レシピ行: {total}（ユニークペア {len(pairs)}）")
    print(f"ユニーク結果名: {len(results)}")
    print(f"単純接合（名前をくっつけただけ）: {len(splices)}件 = {len(splices)/max(total,1)*100:.1f}%")
    for s in splices[:15]:
        print("  接合例:", "＋".join(s[:2]), "→", s[2])
    print(f"理由が空: {empty_reason}件")
    print(f"入力と同じ結果: {same_as_input}件")
    print("頻出結果トップ10:", results.most_common(10))

if __name__ == "__main__":
    main()
