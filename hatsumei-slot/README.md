# 発明スロット研究所 (Hatsumei Slot)

モノ × 機能 × ただし書き の3リールで、架空の発明品を「商品」として量産するWeb玩具。
全6,400通り。図鑑コレクション、発明コードでの交換、日替わりお題、商品カード画像の書き出しつき。

## 遊び方
1. 「発明する！」でスロットを回す
2. 商品名・型番・価格・レア度・発明者コメント付きで発明が完成し、図鑑に登録される
3. 発明コード（INV-XXXX）を友達に渡すと、相手の画面で同じ発明が再現できる
4. 「今日のお題」モードでは、その日全員モノが固定

## ファイル
- `index.html` — 本体（単一ファイル、外部依存ゼロ）
- `PROGRESS.md` — 制作経過ログ（企画と新規性確認を含む）

## 公開手順（GitHub Pages、公開手前まで準備済み）
1. GitHub で空の公開リポジトリ `hatsumei-slot` を作成
2. fine-grained PAT「muse-sync」の Repository access に `hatsumei-slot` を追加
3. Muse がヘルパー経由で同期:
   `python3 ~/workspace/custom-connectors/custom.github-api/bin/github_api.py sync Tosh1000950/hatsumei-slot --dir ~/workspace/hatsumei-slot --files index.html,README.md,PROGRESS.md --message "発明スロット研究所 初版"`
4. Settings → Pages → main / root で公開
