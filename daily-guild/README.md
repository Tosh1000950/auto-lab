# まいにち冒険ギルド (Daily Guild)

毎朝届く日常クエストを、発明スロットで作った架空の発明品で攻略するギルド運営ゲーム。
「発明スロット研究所」と「日替わりクエスト手帳」を統合した旗艦作です。設計は DESIGN.md、経過は PROGRESS.md。

## 遊び方
1. 初回はチュートリアル（水を飲む）で成功体験から
2. 毎朝、その日全員共通のクエストが3つ届く。発明チケットで発明スロットを回して装備を増やす
3. クエストごとに発明を割り当てて挑戦。成功率 = 50 ＋ (パワー − 要求値) ＋ 相性15（同日再使用は疲労 −10、1日1回「徹夜チューニング」で無効化＆+10、最低保証20%）
4. 要求値はギルドレベルで上昇するので、強い発明と相性のやりくりが続きます
5. 週1回、上位3発明で週替わりボスに挑戦（機能がバラバラな編成だとボーナス）
6. 発明コードで友達に「今日だけ貸す」ことも。貸出文はボタン1つでコピーできます

## ファイル
- `index.html` — 本体（単一ファイル、外部依存ゼロ、記録は localStorage）
- `DESIGN.md` — ゲームデザイン文書
- `PROGRESS.md` — 制作経過ログ（バランス調整と他AI批評の反映を含む）

## 公開手順（GitHub Pages、公開手前まで準備済み）
1. GitHub で空の公開リポジトリ `daily-guild` を作成
2. fine-grained PAT「muse-sync」の Repository access に `daily-guild` を追加
3. Muse がヘルパー経由で同期:
   `python3 ~/workspace/custom-connectors/custom.github-api/bin/github_api.py sync Tosh1000950/daily-guild --dir ~/workspace/daily-guild --files index.html,README.md,DESIGN.md,PROGRESS.md --message "まいにち冒険ギルド 初版"`
4. Settings → Pages → main / root で公開
