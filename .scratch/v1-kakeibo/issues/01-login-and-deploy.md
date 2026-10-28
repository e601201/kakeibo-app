# 01: 土台：ログインできる空のアプリを公開する

**What to build:** 本人がiPhoneのホーム画面に追加したアプリを開き、Googleアカウントでログインすると、空のホームが表示される。許可したメールアドレス以外のアカウントは締め出される。以降のチケットが乗る土台（Next.js＋TypeScript、Supabase、Vercelへの公開、家計簿コアとそのテストを回す環境、全テーブル共通の持ち主とRow Level Securityの型）をここで用意する。仕様は `.scratch/v1-kakeibo/spec.md` を参照。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Vercelに公開されたURLをiPhoneのSafariで開き、ホーム画面に追加できる（マニフェストとアイコンがある）
- [ ] Googleアカウントでログインでき、ログインしたままにできる
- [ ] 環境変数で許可したメールアドレス以外でログインすると、すぐに締め出され、何も表示されない
- [ ] Supabaseのキーと許可するメールアドレスは環境変数にだけあり、リポジトリに入っていない
- [ ] 持ち主（SupabaseのユーザーID）とRow Level Securityで本人の行しか読み書きできない、というテーブルの作り方が決まっていて、以降のテーブルが同じ形で作れる
- [ ] 家計簿コア（DBも画面も知らない純粋なTypeScriptのモジュール）の置き場所があり、そのテストが1コマンドで回り、データベースやネットワークを使わない
- [ ] SupabaseとVercelのアカウント作成・キーの設定など、本人にしかできない手順がまとまっている
