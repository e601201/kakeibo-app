@AGENTS.md

## Agent skills

### Issue tracker

課題と仕様書はローカルの markdown として `.scratch/<feature>/` に置く。See `docs/agents/issue-tracker.md`.

### Triage labels

デフォルトの5ラベル（needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix）をそのまま使う。See `docs/agents/triage-labels.md`.

### Domain docs

single-context（ルートの `GLOSSARY.md` と `docs/adr/`）。See `docs/agents/domain.md`.

## 開発

- 型チェック：`npm run typecheck`、テスト：`npm test`、lint：`npm run lint`
- お金の決まり（予算の適用・入力の検証・集計など）は家計簿コア `src/core/` にだけ書き、テストもそこで書く。データベースや画面のコードは家計簿コアを呼ぶだけにする
- 家計のデータを持つテーブルは `supabase/migrations/` の `private.protect_by_owner` を使って本人だけが読み書きできるようにする
- はじめの準備（Supabase・Google・Vercel）は `docs/setup.md`
