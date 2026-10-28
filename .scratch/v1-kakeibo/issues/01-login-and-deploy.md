# 01: 土台：ログインできる空のアプリを公開する

**What to build:** 本人がiPhoneのホーム画面に追加したアプリを開き、Googleアカウントでログインすると、空のホームが表示される。許可したメールアドレス以外のアカウントは締め出される。以降のチケットが乗る土台（Next.js＋TypeScript、Supabase、Vercelへの公開、家計簿コアとそのテストを回す環境、全テーブル共通の持ち主とRow Level Securityの型）をここで用意する。仕様は `.scratch/v1-kakeibo/spec.md` を参照。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Vercelに公開されたURLをiPhoneのSafariで開き、ホーム画面に追加できる（マニフェストとアイコンがある）
- [ ] Googleアカウントでログインでき、ログインしたままにできる
- [ ] 環境変数で許可したメールアドレス以外でログインすると、すぐに締め出され、何も表示されない
- [x] Supabaseのキーと許可するメールアドレスは環境変数にだけあり、リポジトリに入っていない
- [ ] 持ち主（SupabaseのユーザーID）とRow Level Securityで本人の行しか読み書きできない、というテーブルの作り方が決まっていて、以降のテーブルが同じ形で作れる
- [x] 家計簿コア（DBも画面も知らない純粋なTypeScriptのモジュール）の置き場所があり、そのテストが1コマンドで回り、データベースやネットワークを使わない
- [x] SupabaseとVercelのアカウント作成・キーの設定など、本人にしかできない手順がまとまっている

## Comments

- 2026-10-28 実装：コードと手順書（docs/setup.md）は揃った。残りの4つは本人が docs/setup.md の手順でSupabase・Google・Vercelを用意してから確かめる。Row Level Securityの型（private.protect_by_owner）は、手元のDockerの空き容量が足りずローカルのSupabaseで実行できていないため、`supabase db push` のときに確かめる。
