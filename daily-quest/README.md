# 日替わりクエスト手帳 (Daily Quest)

毎朝、その日専用の小さな冒険クエストが3つ届く生活ゲーム化ツール。
クエストは日付から決定的に選ばれるため、誰が開いてもその日は同じ3つです。

## 遊び方
1. 今日のクエスト3つを確認（道具なし・5〜15分・失敗しても損しないものだけ、全48種）
2. 達成したらチェック → EXP獲得、レベルと称号が上がる
3. 気に入らないクエストは1日1回だけ「運命の書き換え」で引き直せる
4. 連続達成日数と過去7日の記録が残る

## ファイル
- `index.html` — 本体（単一ファイル、外部依存ゼロ）
- `PROGRESS.md` — 制作経過ログ

## 公開手順（GitHub Pages、公開手前まで準備済み）
1. GitHub で空の公開リポジトリ `daily-quest` を作成
2. fine-grained PAT「muse-sync」の Repository access に `daily-quest` を追加
3. Muse がヘルパー経由で同期:
   `python3 ~/workspace/custom-connectors/custom.github-api/bin/github_api.py sync Tosh1000950/daily-quest --dir ~/workspace/daily-quest --files index.html,README.md,PROGRESS.md --message "日替わりクエスト手帳 初版"`
4. Settings → Pages → main / root で公開
