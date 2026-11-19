# Auto Lab — Muse 自動制作テスト置き場

Muse が「自動でどこまで作れるか」のテストで制作した Web ゲーム・ツールを、1つのリポジトリにまとめた実験場です。
今後のテスト作成も、原則としてこのリポジトリにフォルダを追加していく運用にします（作品ごとにリポジトリを作らない）。

## 作品
| フォルダ | 作品 | 内容 |
|---|---|---|
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
