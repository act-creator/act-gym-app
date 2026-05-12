# パーソナルジムAct. 会員アプリ

## セットアップ

### 1. 環境変数の設定
`.env.local` に以下を設定（すでに入力済み）:
```
NEXT_PUBLIC_SUPABASE_URL=https://tynaidnldftytpaxhiex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_2qnwXj2YL_61YyWCin84wQ_vorF3U-n
ANTHROPIC_API_KEY=（あとで設定）
```

### 2. Vercelへのデプロイ
1. GitHubにこのフォルダをアップロード
2. Vercelでインポート
3. 環境変数を設定（Vercelの管理画面から）

### 3. 管理者アカウントの設定
会員登録後、Supabaseのテーブルエディタでprofilesテーブルのroleを「admin」に変更する

## 機能
- 会員登録・ログイン
- 予約申請・管理
- 体重・体脂肪ログ
- AI食事分析（写真アップロード）
- トレーニングメニュー閲覧（動画付き）
- 管理者画面（予約管理・会員管理・メニュー管理）
