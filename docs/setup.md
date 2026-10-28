# はじめの準備（本人がする作業）

アプリを公開して使い始めるまでに、本人にしかできない作業の手順。上から順に進める。
キーやメールアドレスは `.env.local` とVercelの環境変数にだけ入れ、リポジトリには入れない。

## 1. Supabaseのプロジェクトを作る

1. https://supabase.com/dashboard で新しいプロジェクトを作る（Free プラン、リージョンは Tokyo）
2. Project Settings > API Keys から次の2つを控える
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 2. Googleログインを用意する

1. https://console.cloud.google.com でプロジェクトを作り、「APIとサービス > OAuth同意画面」を設定する（ユーザーの種類は「外部」、テストユーザーに本人のGmailを追加）
2. 「認証情報 > OAuthクライアントID」を作る（種類は「ウェブアプリケーション」）
   - 承認済みのリダイレクトURI：`https://<SupabaseのプロジェクトID>.supabase.co/auth/v1/callback`
3. 表示されたクライアントIDとシークレットを、Supabaseの Authentication > Sign In / Providers > Google に入れて有効にする

## 3. データベースを用意する

Supabase CLI を入れ（`brew install supabase/tap/supabase`）、リポジトリの直下で次を実行して、`supabase/migrations/` のマイグレーションを本番に当てる。

```sh
supabase login
supabase link --project-ref <SupabaseのプロジェクトID>
supabase db push
```

## 4. 手元で動かす

```sh
cp .env.example .env.local   # 値を入れる。ALLOWED_EMAIL は本人のGmail
npm install
npm run dev
```

Supabaseの Authentication > URL Configuration の Redirect URLs に `http://localhost:3000/auth/callback` を加えておく。

## 5. Vercelに公開する

1. このリポジトリをGitHubに上げる
2. https://vercel.com/new でリポジトリを取り込む（Hobby プラン）
3. Environment Variables に `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`ALLOWED_EMAIL` を入れてデプロイする
4. 公開されたURL（`https://<名前>.vercel.app`）を、Supabaseの Authentication > URL Configuration に入れる
   - Site URL：`https://<名前>.vercel.app`
   - Redirect URLs：`https://<名前>.vercel.app/auth/callback`

## 6. 本人だけにする

1. Googleの OAuth同意画面のテストユーザーに、確かめ用の別のGoogleアカウントを一時的に加える
2. 公開されたURLを開き、本人のGoogleアカウントでログインする。空のホームが出ることを確かめる
3. ログアウトして、別のGoogleアカウントでログインする。「このアカウントでは使えません」と出て、何も見えないことを確かめる（`ALLOWED_EMAIL` による締め出し）
4. 後片付け
   - Supabaseの Authentication > Users から、別のアカウントのユーザーを消す
   - Googleのテストユーザーから、別のアカウントを外す
5. Supabaseの Authentication > Sign In / Providers で「Allow new users to sign up」をオフにする。これで本人以外のアカウントはSupabaseに登録されなくなる（この後は別のアカウントでログインすると「ログインに失敗しました」と出る）

## 7. iPhoneのホーム画面に追加する

1. SafariでURLを開き、共有ボタン > 「ホーム画面に追加」
2. ホーム画面のアイコンから開き、もう一度Googleでログインする（ホーム画面から開いたアプリとSafariはログイン状態を共有しない）。以後はログインしたまま使える
