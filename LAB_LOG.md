# Auto Lab — Muse 自動制作テスト置き場

Muse が「自動でどこまで作れるか」のテストで制作した Web ゲーム・ツールを、1つのリポジトリにまとめた実験場です。
今後のテスト作成も、原則としてこのリポジトリにフォルダを追加していく運用にします（作品ごとにリポジトリを作らない）。

## 作品
| フォルダ | 作品 | 内容 |
|---|---|---|
| `evotope/` | エボトープ（開発中・大規模作） | 育てる進化シミュレーション。淘汰圧の設計が核 |
| `daily-guild/` | まいにち冒険ギルド（旗艦作） | 日常クエスト × 発明スロットのギルド運営ゲーム |
| `hatsumei-slot/` | 発明スロット研究所 | 架空発明ジェネレーター＋図鑑＋コード交換（全6,400通り） |
| `pitastop/` | ピタスト！ | 日替わり目標ストップウォッチ |
| `daily-quest/` | 日替わりクエスト手帳 | 毎日の小さな冒険クエスト（全48種） |

- ハブページ：`index.html`（GitHub Pages 公開時のトップ）
- テスト全体の経過：`LAB_LOG.md`、各作品の詳細経過は各フォルダの `PROGRESS.md`

## 公開手順（GitHub Pages）
前提：本人が空の公開リポジトリ `auto-lab` を作成し、fine-grained PAT「muse-sync」の対象に追加する（この1回だけ）。

同期（Muse 側、ヘルパー経由）:
```
python3 ~/workspace/custom-connectors/custom.github-api/bin/github_api.py sync Tosh1000950/auto-lab --dir ~/workspace/auto-lab --files index.html,README.md,LAB_LOG.md,pitastop/index.html,pitastop/README.md,pitastop/SPEC.md,pitastop/PROGRESS.md,hatsumei-slot/index.html,hatsumei-slot/README.md,hatsumei-slot/PROGRESS.md,daily-quest/index.html,daily-quest/README.md,daily-quest/PROGRESS.md,daily-guild/index.html,daily-guild/README.md,daily-guild/DESIGN.md,daily-guild/PROGRESS.md --message "Auto Lab 初版：自動制作テスト4作品"
```
その後 Settings → Pages → main / root を有効化すると、トップと各作品が
`https://tosh1000950.github.io/auto-lab/` 以下で公開されます。

## 運用メモ
- 作品の原本は各ワークスペース（~/workspace/pitastop 等）にも残っているが、公開用の正はこのフォルダとする。今後どちらかを直したら、もう一方へも反映すること。
- 21:14 エボトープ Stage 5 まで完了し auto-lab/evotope/ へ同期。段階計画は一巡。残るは実ブラウザ目視とバランス調整。
- 21:35 テスト第2作（非ゲーム）として「エニグマ工房」を自分の調査と判断で決定。候補は音響ラボ／エニグマ／天文デスクの3本、先行作調査とGrok批評を経て、検証可能性と日本語での差別化角度を理由にエニグマを選定。理由の全文は ~/workspace/enigma-koubou/RESEARCH.md。
- 21:38頃 エニグマ工房 全Stage完了（コア検証／盤面＋信号経路／設定共有／crib探索／説明書）。ハブ掲載済み。URL： https://tosh1000950.github.io/auto-lab/enigma-koubou/ 説明書は同フォルダの manual.html。
- 2026-11-20 01:13 第3作（前提訂正後のやり直し）開始。ツール・ゲームに限らず GitHub Pages で公開できるもの。前提文書 PREMISE.md に沿って進める。作業場は ~/workspace/third-work/。
- 01:16 第3作の選定を記録（third-work/CANDIDATES.md）。GrokとGeminiが独立に挙げた「確率の直感」の隙間を本命に、体験設計（予想→目撃→スコア）で差を作る。ボツ案も保持。
- 01:23 第3作『直感のズレラボ』v2まで完了・公開：https://tosh1000950.github.io/auto-lab/intuition-lab/ 。Grok批評を反映し実験5を差し替え、「最大のズレ」を追加、表示順も変更。残りの宿題は実ブラウザ目視（VM側では未実施）。
