# エッセ 予約・点検記録アプリ

車（エッセ）の予約管理＋点検記録アプリ。iPhone/Android対応のPWA。
バックエンドは Supabase、配信は Cloudflare Pages。**すべて無料枠で運用できます。**

## できること
- **予約**：借りる／返すボタン。誰が・いつまで・どこに、を記録。押すと**LINEグループに自動通知**。
- **点検記録**：走行会前後・レース前後などの節目ごとに、チェックリスト（日常／レース詳細）で
  OK/NG・写真・メモを記録。複数人でリアルタイムに同時編集可。
- メール認証つき。1台の車を複数人で奪い合っても、出庫できるのは1人だけ（売り越し防止）。

---

## A. Supabase（無料）

> 無料枠は1組織あたり2プロジェクトまで。倉庫アプリと別に、このアプリ用の新規プロジェクトを作ります（合計2つでギリOK）。

1. https://supabase.com → 「New project」→ Region は Tokyo
2. 「SQL Editor」で **`schema.sql`** を貼って Run（テーブル・予約/返却関数・LINE通知・点検・初期の車1台が入る）
3. 続けて **`keepalive.sql`** も Run（停止防止用）
4. 「Authentication」→ Email を有効化。テスト中は「Confirm email」をオフにすると楽
5. 「Project Settings」→「API」で **Project URL** と **publishable key** を控える

## B. デプロイ（Cloudflare Pages・無料）

1. このフォルダを GitHub の**新しいリポジトリ**に push（`.env`/`node_modules`/`dist` は上げない）
2. Cloudflare → Workers & Pages →「Get started」(Pages) → Connect to Git
3. Framework: `Vite` / Build: `npm run build` / Output: `dist`
4. 環境変数：
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = publishable key
5. Save and Deploy → `https://xxx.pages.dev` 発行
6. アプリで新規登録 → SQLで自分を管理者に：
   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'あなたのメール');
   ```

---

## C. LINE通知の設定（ここが要・少し手間）

LINE Notify は2025年に終了したため、**LINE Messaging API**（Bot）を使います。

### C-1. Botを作る
1. https://developers.line.biz/ にLINEアカウントでログイン
2. 「プロバイダー」を新規作成（名前は任意、例：DAC）
3. 「Messaging API」チャネルを作成（チャネル名＝LINEに表示されるBot名）
4. 作成後、チャネルの「Messaging API設定」タブを開く
5. 一番下の「**チャネルアクセストークン（長期）**」を発行してコピー → これが**トークン**

### C-2. Botをグループに入れる
1. 通知したいLINEグループを開く
2. メンバー追加で、作成したBot（公式アカウント）を検索して**グループに招待**
   - Botが検索で出ない場合：「Messaging API設定」のQRコードからまず自分が友だち追加し、その後グループに追加
3. チャネルの「応答設定」で「あいさつメッセージ」「応答メッセージ」はオフ、「Webhook」はオンにしておくと邪魔になりません

### C-3. グループIDを取得する（一番の難所）
グループに送るには「グループID」が必要です。無料・コード不要の方法：

1. https://webhook.site を開く（あなた専用のURLが自動発行される。コピー）
2. LINEチャネルの「Messaging API設定」→ Webhook URL にその webhook.site のURLを貼り、Webhookを「オン」
3. **Botを入れたグループで何かメッセージを送信**（「テスト」など）
4. webhook.site の画面に届いたデータの中から `"source": { "type": "group", "groupId": "Cxxxxxxxxxxxx" }` を探す
5. この `Cxxxx...` が**グループID**

### C-4. アプリに登録
1. アプリで「管理」タブ →「LINE通知の設定」
2. **トークン**（C-1）と**グループID**（C-3）を貼って保存
3. 予約タブで「借りる」→ LINEグループに通知が来れば成功

> 補足：LINE公式アカウントの無料プランには月あたりの無料メッセージ数の上限があります（数百通程度）。部活の車1台の出庫/返却通知なら十分収まりますが、最新の上限は LINE Official Account の料金ページで確認してください。

---

## D. 停止防止（キープアライブ）
倉庫アプリと同じく、GitHub Actions か cron-job.org で毎日 `ping()` を叩いて
1週間放置による一時停止を防ぎます（`.github/workflows/keepalive.yml` を流用、Secretsに URL とキーを登録）。

## ファイル
```
schema.sql        … DB定義（予約/点検/LINE通知）。SQL Editorで実行
keepalive.sql     … 停止防止関数
src/checklist.js  … 点検項目（日常/レース）
src/api.js        … Supabase 呼び出し
src/App.jsx       … 画面
```
