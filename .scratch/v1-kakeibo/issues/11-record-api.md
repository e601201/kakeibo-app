# 11: 画面を開かずに記録するAPI

**What to build:** 本人が Claude Code などから curl で、支出・振替と収入を記録できる。費目・支払方法は名前で指定でき、選べる名前の一覧も取れる。中身の確かめは画面と同じ家計簿コアの決まりを通す。本人かどうかは自分用のAPIトークンで確かめ、データは Row Level Security で守ったまま書き込む（`docs/adr/0002-record-api-with-token.md`）。

**Blocked by:** 03, 04

**Status:** in-progress

- [x] `GET /api/options` で、使える費目（非表示を除く）・支払方法・収入の種類の名前が取れる
- [x] `POST /api/expenses` に費目名・金額などのJSONを送ると、支出・振替として記録される。日付を省くと日本時間の今日になる
- [x] `POST /api/incomes` に収入の種類・金額などのJSONを送ると、収入として記録される
- [x] 間違いがあれば 400 で欄ごとの理由を返し、何も記録しない。トークンがない・違うときは 401 を返す
- [x] 費目名・支払方法名からの読み替えのテストが家計簿コアにある（見つからない名前、非表示の費目、支払方法の「名前（カード名）」の書き方）
- [x] 使い方と、Vercel に入れる環境変数を `docs/api.md` と `docs/setup.md` に書く

## Comments

- 2026-10-31 実装：家計簿コア（`src/core/record-requests.ts`：名前の読み替えと確かめ `expenseFromRequest`・`incomeFromRequest`、名前の一覧 `recordOptions`）とそのテスト、道 `/api/options`・`/api/expenses`・`/api/incomes`、本人のセッションを作る `src/lib/supabase/owner.ts` を追加した。proxy は `/api/` を cookie の確かめなしで通す。マイグレーションはない。
  - 記録の登録元は手入力（`manual`）のまま。本人が入れる記録なので、画面からの入力と分けていない。
  - 手元で確かめたこと：トークンなしは 401、収入・支出の間違いは 400、画面の道はこれまでどおりログインへ飛ぶ。本物の鍵で `GET /api/options` が一覧を返し、`POST /api/expenses` で1円の試しの記録ができた（Email のログインの設定は変えずに動いた）。
