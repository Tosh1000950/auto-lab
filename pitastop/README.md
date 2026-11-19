# ピタスト！ (PitaStop)

日替わり目標秒数にストップウォッチをピタッと止めるデイリーゲーム。
目標の2秒前から表示が消える「ブラインド方式」が核。1日3回、全員その日は同じ目標。
結果は誤差msとランク入りでそのままSNSにシェアできます。

## 遊び方
1. スタートを押す（ボタン／タップ／スペースキー）
2. 目標の2秒前から数字が「??.??」に隠れる
3. 自分のカウントでピタッと止める。誤差でランク判定（神ピタSSS〜D）

## ファイル
- `index.html` — 本体（単一ファイル、外部依存ゼロ）
- `SPEC.md` — 仕様
- `PROGRESS.md` — 制作経過ログ

## ローカルで開く
`index.html` をブラウザで開くだけで動きます。記録は localStorage に保存されます。

## 公開手順（GitHub Pages、公開手前まで準備済み）
Muse 側の連携トークン（muse-sync）は既存リポジトリ専用のため、新規リポジトリ作成と対象追加だけ本人の操作が必要です。

1. GitHub で空の公開リポジトリ `pitastop` を作成（README 等は付けない）
2. fine-grained PAT「muse-sync」の Repository access に `pitastop` を追加
3. Muse がヘルパー経由で同期:
   `python3 ~/workspace/custom-connectors/custom.github-api/bin/github_api.py sync Tosh1000950/pitastop --dir ~/workspace/pitastop --files index.html,README.md,SPEC.md,PROGRESS.md --message "ピタスト！ 初版"`
4. リポジトリ Settings → Pages → Branch を main / root に設定すると公開URLが発行される

## ライセンス
MIT（予定。公開時に LICENSE を追加）
