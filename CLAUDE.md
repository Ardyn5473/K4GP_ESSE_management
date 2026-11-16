# エッセ予約点検アプリ 引き継ぎ書（HANDOVER）

> K4GP（ダイハツ・エッセによる軽耐久レース）のクラブ共用車を管理する、スマホ向けPWA。
> このファイルはリポジトリ直下に置く想定。`CLAUDE.md` にリネームすると Claude Code が自動で読み込む。
> 最終更新: 2026-11-16

---

## 0. まず読む（30秒サマリ）

- **これは何**: 共用車（エッセ1台）の「予約・点検記録・お金（振込/立替/割り勘）」をスマホで管理するPWA。部活メンバーが使う内部ツール。
- **技術**: React + Vite（PWA）/ Supabase（DB・認証・RPC・Storage・LINE通知）/ Cloudflare Pages（配信）/ GitHub（コード）。**全て無料枠で運用中**。
- **本番URL**: https://k4gp-esse-management.pages.dev/
- **デプロイ方法**: GitHubにpush → Cloudflare Pagesが自動ビルド＆公開。**DBの変更はSupabaseのSQL Editorで手動実行**（マイグレーションの自動化はしていない）。
- **コードの中心**: `src/App.jsx`（画面全部・約1,400行の単一ファイル）、`src/api.js`（Supabase呼び出し層）。
- **重要**: `App.jsx` と `api.js` は**必ずセットで**更新する（片方だけ古いと関数不整合で白画面になる）。

---

## 1. 本番環境・接続情報

| 項目 | 値 |
|---|---|
| 本番URL | https://k4gp-esse-management.pages.dev/ |
| GitHubリポジトリ | `Ardyn5473/DAC_Equipment-management`（オーナー: ardyn5473） |
| ホスティング | Cloudflare Pages（プロジェクト名 `dac-equipment-management`） |
| Supabase Project URL | `https://bsghospfskaznholnonf.supabase.co` |
| Supabase publishable key | `sb_publishable_-JuOG9TwBxgVRqOCfp1dLg_Bh63-9tf`（クライアント公開可。RLS前提の anon 相当キー） |

### 環境変数（Cloudflare Pages / ローカル `.env` 共通）
```
VITE_SUPABASE_URL=https://bsghospfskaznholnonf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_-JuOG9TwBxgVRqOCfp1dLg_Bh63-9tf
```
- URLは**ドメインのみ**（`/rest/v1/` を付けない）。
- `.env` はコミットしない。`.env.example` を雛形として同梱。

### 秘密情報の扱い
- **LINEのチャネルアクセストークン**は**リポジトリにもフロントにも置かない**。Supabaseの `app_settings` テーブルに保存し、アプリの「管理→LINE通知の設定」から登録する（DB側の関数だけが参照）。
- Supabaseの **secret key / service_role キー**、LINEの **Channel secret** はリポジトリに含めない。
- 引き継ぎ時、LINEトークンは一度**再発行**して差し替えることを推奨（過去にチャット上でやり取りした経緯があるため）。

---

## 2. 技術スタックと設計方針

- **フロント**: React 18 + Vite。状態管理はReactのhooksのみ（外部ステートライブラリなし）。UIは**インラインstyle**で実装（CSSファイルなし、`sx` オブジェクトに集約）。スマホ幅前提、下タブ＋ボトムシート構成。
- **PWA**: `public/manifest.webmanifest` ＋ アイコン。ホーム画面追加でアプリ風に動作。
- **バックエンド**: Supabase（PostgreSQL）。
  - **認証**: メール＋パスワード（`supabase.auth`）。新規登録時に `profiles` 行を自動生成するトリガ。
  - **RLS（行レベルセキュリティ）**: 全テーブルで有効。`is_admin()` 関数で管理者判定。
  - **重要処理はRPC（DB関数）**: 予約作成・返却・各種申請・ステータス変更など。同時操作の整合性（排他制御）と権限チェックをDB側で担保。
  - **リアルタイム**: `supabase.channel` で主要テーブルを購読し、変更を全端末に即反映。
  - **Storage**: バケット `car-photos`（点検写真・車両写真・領収書）。アップロード前にクライアントで最大1024pxに圧縮。
  - **LINE通知**: DB関数から `pg_net`（`net.http_post`）で LINE Messaging API の push を直接叩く。
- **配信**: Cloudflare Pages。GitHub連携でpush時に自動ビルド（CI/CD）。

---

## 3. リポジトリ構成

```
car-app/
├── .env.example
├── .github/workflows/keepalive.yml   # 毎日ping（停止防止）。GitHub ActionsのSecretsが必要
├── index.html                        # /src/main.jsx を読み込む。PWAメタ・アイコン参照
├── package.json / package-lock.json
├── vite.config.js
├── public/
│   ├── manifest.webmanifest
│   └── （アイコン各種 PNG：icon-192/512, maskable, apple-touch-icon）※アイコン一式.zip参照
├── src/
│   ├── main.jsx                      # エントリ
│   ├── App.jsx                       # 画面すべて（単一ファイル・約2,000行）
│   ├── api.js                        # Supabase呼び出し層（ここだけがDBに触る）
│   ├── supabaseClient.js             # createClient（env読み込み）
│   ├── xlsx.js                       # 最小のExcel(.xlsx)ライター（fflateのみ依存・DBに触らない）
│   └── checklist.js                  # 旧・点検テンプレ定義（現在はDB管理。残置。未使用でも無害）
└── *.sql                             # マイグレーション（Supabaseで手動実行。下記§5）
```

### `App.jsx` の主なコンポーネント
- 画面: `Login` / `Home`（タブ制御）/ `CalendarTab`（予約）/ `CheckHub`→`CheckTab`・`MaintenanceSummary`（点検）/ `MoneyTab`→`SplitTab`（お金：振込/立替/割勘）/ `HistoryTab`（履歴）/ `AdminTab`（管理）
- フルスクリーン: `CheckScreen`（点検チェック）/ `TemplateEditor`（点検項目編集）/ `CostScreen`（割り勘明細＋精算）
- シート類: `BookingSheet`・`BookingDetailSheet`・`PaymentSheet`・`PaymentDetailSheet`・`ReimburseSheet`・`ReimburseDetailSheet`・`CostEventSheet`・`CostItemSheet`・`CostPaymentSheet`・`EventSheet`・`CarSheet`・`LineSheet`・`MeSheet`・`AddItemSheet`
- 計算ロジック（純粋関数・テスト対象）: `splitAmount` / `splitByWeight` / `allocItem` / `itemTotal` / `computeSettlement`（割り勘・精算の中核）

---

## 4. 実装済み機能

### 予約（カレンダー方式）
- 月カレンダー表示。**期間予約**（開始日〜終了日）。連続予約可。
- **種別**: 実利用（赤）/ 予約=仮押さえ（緑）。**実利用と予約は同日に重ねられる**が、同種どうしの重複は不可（DBの排他制約 `exclude using gist`）。
- 予約に**メイン利用者・貸出担当・返却担当**（それぞれ別に選択）、**河津さん（ガレージ所有者）調整済みフラグ**。
- 予約（仮）→実利用への変更ボタン（同期間に実利用が無ければ可）。
- 予約・変更時にLINE通知。
- `RPC`: `create_booking` / `cancel_booking` / `set_booking_use`。

### 点検
- **点検テンプレートはDB管理**（`checklist_items`）。管理者がアプリ上で項目を追加/削除可（`TemplateEditor`）。
- テンプレート: `daily`（日常）/ `practice`（サーキット練習）/ `race`（レース）。
- 入力タイプ: `okng`（OK/NG）/ `number`（数値：走行距離・タイヤ溝mm等）/ `replace`（交換チェック）。
- 各項目に**複数画像**（`check_photos`）＋メモ（複数行）。点検イベント単位の備考（`check_events.note`）。
- **交換サイクル**: 点検記録から「オイル/ブレーキパッド/タイヤを前回いつ・何kmで交換したか」と現在距離からの経過kmを集計表示。
- **走行距離**: 「総距離（オドメーター）」と「サーキット走行距離（累積）」を点検で入力 → **一般道＝総−サーキット**で自動算出。点検間の増加量（一般道/サーキット別）も表示。

### お金
3つのサブタブ（振込 / 立替 / 割勘）。
- **振込**（`payments`）: 日付・用途・金額。申請でLINE通知。**着金確認**ステータス（管理者のみ切替、通知なし）。
- **立替**（`reimbursements`）: 日付・用途・金額・**領収書写真（拡大表示可）**。申請でLINE通知。**返金済み**ステータス（管理者のみ切替、通知なし）。**名前×状態（全て/未処理/返金済）で絞り込み**、合計も絞り込みに連動。
- **割り勘**（`cost_events` / `cost_items` / `cost_payments`）: 費用イベント（走行会/レース単位）に費用項目を追加。項目ごとに按分方式を選択:
  - `equal`（均等）/ `weight`（比例配分＝周回数など）/ `fixed`（固定額）。
  - 誰がいくら払ったかを登録し、**各人の割当−支払＝過不足**と**最小回数の送金案（誰→誰にいくら）**を自動計算。
  - 行き帰りのガソリンは「往路」「復路」を別項目にして乗った人だけ負担、で対応。

### 出納帳・分析（v11〜）
お金タブのサブタブは **振込 / 立替 / 割勘 / 出納帳 / 分析** の5つ。
- **科目分類**: 収入8科目（出資金・DAC補助金・スポンサ費・走行会参加費・レース参加費・整備費・共済費・預り金）、支出13科目（車両代・エントリ費・車両整備費・車両修理費・レース用雑費・工具・その他雑費・預り金返金・振込手数料・送料・共済費使用・出資金返金・利益分配金）、摘要7種（文具・イベント用備品・修理・改造・消耗品・車両用備品・管理備品）。**管理→科目・摘要の編集**で増減可。
- **出納帳**: 「振込=収入」「立替=支出」「直接記帳」の3つを `buildLedger()` が日付昇順の1本の帳簿に合流し、繰越＋残高を計算。車両代やスポンサ費など口座が直接動いたお金は「記帳」から入れる。
- **期間**: 年度（既定4月開始・`ledger_settings.fiscal_start_month`）か全期間。「確定分のみ」で未着金の振込・未返金の立替を除外した現金主義の残高も出せる。
- **分析**: 科目別（構成比バー）/ 月次推移 / 摘要別 / 年度サマリ。
- **Excel出力**: `src/xlsx.js` が fflate だけで .xlsx を直接生成（SheetJS不使用）。1ファイルに **出納帳・科目別集計・月次推移・摘要別・収支報告** の5シート。日付はExcelの日付型、金額は `#,##0` 書式なのでExcel側でそのまま集計できる。
- 計算は純粋関数 `fiscalRange` / `buildLedger` / `sumByKey` / `monthlySeries` / `sumSide`（App.jsx）に集約。

### その他
- 履歴（予約の予約中/利用中/終了）、管理（車情報＋走行距離、点検項目編集、**科目・摘要の編集**、**出納帳の設定**、LINE設定）。
- 管理者権限（`profiles.role='admin'`）。PWAアイコン（エッセのレース風）。

---

## 5. DBスキーマとマイグレーション履歴

**適用方法**: Supabase ダッシュボード → SQL Editor に各SQLを貼って Run。**番号順に適用**。自動マイグレーション基盤は無い。新規環境を一から作る場合は `schema.sql` → `keepalive.sql` → `storage_photos.sql`（※下記）→ `payments.sql` → `reimbursements.sql` → `v2`〜`v10` の順。

| ファイル | 内容 |
|---|---|
| `schema.sql` | 基盤。`profiles` / `cars` / `reservations`(旧・即時貸出) / `check_events` / `check_records` / `app_settings`、`is_admin()` / `notify_line()` / `reserve_car()` / `return_car()`、新規ユーザのprofile自動生成トリガ、RLS、Storageバケット `car-photos`、エッセ1台の初期投入。`pgcrypto`・`pg_net` 拡張。 |
| `keepalive.sql` | `ping()` 関数（匿名実行可）。停止防止用。 |
| `storage_photos.sql` | 写真用Storageの補助（※倉庫アプリ由来。car-appでは `schema.sql` 内のバケット定義が主）。 |
| `payments.sql` | 振込ログ `payments` ＋ `submit_payment()`（LINE通知）。 |
| `reimbursements.sql` | 立替 `reimbursements` ＋ `submit_reimbursement()`（領収書写真対応・LINE通知）。 |
| `v2_upgrade.sql` | 予約をカレンダー方式へ: `bookings`、`maintenance_records`、`cars.odometer` 追加、`profiles` 閲覧RLSを全認証ユーザに開放、`create_booking`/`cancel_booking`、`btree_gist` 排他制約。 |
| `v3_templates.sql` | 点検テンプレのDB化: `checklist_items`、`check_records.num` 追加＋status `'done'` 許可、既存＋数値/交換項目をseed（冪等）。 |
| `v4_updates.sql` | `bookings` に貸出/返却担当分割＋河津フラグ、`create_booking` 差し替え、タイヤ点検重複の集約、`practice` テンプレ追加、`check_events` のtemplate制約を撤廃。 |
| `v5_reimbursed.sql` | `reimbursements.reimbursed`＋`set_reimbursed()`（管理者のみ）。 |
| `v6_features.sql` | `bookings.kind`(use/tentative)＋種別ごとの排他制約、サーキット走行距離の点検項目seed、`check_photos`（複数画像）。 |
| `v7_convert.sql` | `set_booking_use()`（仮予約→実利用、同期間に実利用があれば不可）。 |
| `v8_confirmed.sql` | `payments.confirmed`＋`set_payment_confirmed()`（管理者のみ）。 |
| `v9_split.sql` | 割り勘: `cost_events` / `cost_items` / `cost_payments`。 |
| `v10_splitmethod.sql` | `cost_items.split_type`(equal/weight/fixed)＋`shares` jsonb。 |
| `v11_ledger.sql` | **出納帳**: `account_items`（収入8/支出13科目をseed）・`summary_items`（摘要7種をseed）・`ledger_entries`（部の入出金の直接記帳）・`ledger_settings`（期首残高/年度開始月）。`payments`/`reimbursements` に `account`・`summary` 列を追加。**`submit_payment`/`submit_reimbursement` を科目・摘要つきに差し替え（旧版はDROP）**。 |

**現在の最新は v11。** 次に機能追加する場合は `v11_*.sql` として新規追加し、既存テーブルは `alter table ... add column if not exists` で後方互換を保つ運用。

### 主要テーブル早見
- `profiles(id, name, department, role)` — `role`: admin/general。`id` は `auth.users.id`。
- `cars(id, name, plate, photo_url, note, status, odometer)` — 運用上は1台のみ。
- `bookings(car_id, start_date, end_date, main_user_id, lender_id, returner_id, kawazu_ok, kind, destination, note, status, created_by)`
- `check_events(car_id, occasion, phase, template, event_date, note, created_by)` / `check_records(event_id, item_id, status, num, note, photo_url, ...)` / `check_photos(event_id, item_id, url)`
- `checklist_items(template, section, label, hint, icon, input_type, unit, maint_kind, sort, active)`
- `maintenance_records(car_id, kind, done_on, odometer, note)` ※v2で追加。現在は点検記録からの集計が主。
- `payments(user_id, paid_on, purpose, amount, note, confirmed, confirmed_at, confirmed_by)`
- `reimbursements(user_id, spent_on, purpose, amount, photo_url, note, reimbursed, reimbursed_at, reimbursed_by)`
- `cost_events(car_id, title, event_date, note, created_by)` / `cost_items(cost_event_id, label, amount, payers uuid[], split_type, shares jsonb)` / `cost_payments(cost_event_id, user_id, amount, note)`
- `app_settings(id=true, line_token, line_target)` — 1行のみ。
- `account_items(side 'in'|'out', name, sort, active)` / `summary_items(name, sort, active)` — 科目・摘要マスタ（管理画面で編集可）。
- `ledger_entries(entry_date, side, account, summary, purpose, amount, counterparty, method, note, photo_url, created_by)` — 出納帳の直接記帳。
- `ledger_settings(id=true, opening_balance, opening_on, fiscal_start_month)` — 1行のみ。LINEトークンと分けるため `app_settings` とは別テーブル。

---

## 6. デプロイ・開発手順

### 本番デプロイ（通常の変更）
1. GitHubで対象ファイル（主に `src/App.jsx` / `src/api.js`）を更新しコミット。
2. Cloudflare Pagesが自動ビルド（`npm run build` → `dist`）して公開。
3. DB変更を伴う場合は、対応する `*.sql` を Supabase SQL Editor で手動実行。

### Cloudflare Pages 設定（再設定が必要な場合）
- 入口は Workers&Pages の「**Looking to deploy Pages? Get started**」リンクから（Workersの "Create application" ではない）。
- Framework preset: **Vite** / Build command: **`npm run build`** / Build output directory: **`dist`**。
- 環境変数に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY`。

### ローカル開発
```bash
npm install
# .env を作成（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）
npm run dev      # Vite dev server
npm run build    # 本番ビルド確認
```

### 管理者にする
Supabase SQL Editor:
```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = '対象のメール');
```

### メール認証をオフ（内部利用のため推奨）
Authentication → Sign In / Providers → Email → 「Confirm email」をオフ。

---

## 7. LINE通知の仕組み

- **LINE Messaging API**（Botのpush）。※LINE Notifyは2025年に終了のため非採用。
- 構成: LINE公式アカウント「K4GPグループ」に紐づく Messaging API チャネル（provider: `K4GP_ESSE`）。
- 送信経路: DB関数 `notify_line(text)` が `app_settings` の `line_token`/`line_target` を使い `pg_net` で `https://api.line.me/v2/bot/message/push` を叩く。各業務RPC（予約・振込・立替など）から呼ばれる。
- **設定方法**: アプリ「管理→LINE通知の設定」に、チャネルアクセストークン（長期）とグループID（`C` で始まる）を登録。
  - グループIDの取得: Botを対象グループに招待し、webhook.site 等にWebhookを一時的に向けてグループで発言→ `source.groupId` を取得。
  - Botがグループ参加後すぐ退出する場合: LINE公式アカウントの「応答設定」で**グループ・複数人トークへの参加を許可**をオン。
- **無料枠の上限に注意**: LINE公式アカウント無料プランは月間メッセージ数に上限。超過すると送信が止まる（`net._http_response` の `status_code=429`「You have reached your monthly limit」）。毎月1日リセット。
  - 送信結果の確認: `select status_code, error_msg, content, created from net._http_response order by created desc limit 5;`

---

## 8. キープアライブ（停止防止）

- Supabase無料プランは一定期間アクセスが無いとプロジェクトが一時停止するため、`.github/workflows/keepalive.yml` が毎日 `ping()` を叩く。
- **GitHub の Secrets が必須**: リポジトリ Settings → Secrets and variables → **Actions** に `SUPABASE_URL` と `SUPABASE_ANON_KEY`（このcar-appの値）。
  - 未設定だと `$SUPABASE_URL` が空になり exit code 3 で失敗する。
- Actionsタブで手動実行（Run workflow）も可。倉庫アプリ側リポジトリにも同様の設定が別途必要。

---

## 9. 既知の落とし穴（重要）

1. **GitHubへのフォルダD&Dで `src/` の中身が欠落** → ビルドが `Rollup failed to resolve import "/src/main.jsx"` で失敗。`src` 内5ファイル（`main.jsx`/`App.jsx`/`api.js`/`checklist.js`/`supabaseClient.js`）が揃っているか必ず確認。
2. **`App.jsx` の部分貼り付けで関数欠落 → 白画面**（例: `MoneyTab is not defined`）。コンソールの `ReferenceError: X is not defined` が出たら、その関数定義が本当に存在するか確認。ファイルは**全選択→全置換**で更新する。
3. **`App.jsx` と `api.js` のバージョン不一致 → 白画面 / `X is not a function`**（例: `setReimbursed is not a function`）。両者は必ずセットで更新。
4. **DB制約の更新漏れ**: テンプレ追加時に `check_events.template` のCHECK制約で弾かれた事例あり（v4で制約撤廃済み）。status系も同様に `check_records.status` は `pending/ok/ng/done`。
5. **PWAアイコン/画面がiOSで更新されない**: ホーム画面のアイコンを一度削除→Safariで開き直して再追加。デプロイ後はスーパーリロード（Ctrl/Cmd+Shift+R）。
6. **一覧が「消えた」ように見える**: Supabaseのデフォルト取得上限（1000行）や、立替タブの絞り込み（状態=未処理 等）による表示上の絞り込みが原因のことが多い。まず絞り込みを「全て/全て」に。
7. **v11はSQLを先に流す**: `v11_ledger.sql` は `submit_payment` / `submit_reimbursement` を**引数を増やして作り直す**ため、SQLを流す前に新しい `api.js` が本番に出ると、振込・立替の申請が「関数が見つからない」で失敗する。**必ず Supabase で SQL を実行してから git push** する（Pagesはpushで即デプロイされるため）。
8. **`btree_gist` 拡張**: 予約の期間重複防止に使用。Supabaseでは `create extension if not exists btree_gist;`（各マイグレーションSQL内で有効化済み）。ローカルのembedded Postgresには無いことがあり、その場合は関数側の `daterange && daterange` チェックで検証する。

---

## 10. テスト方針

- バックエンドのロジック（RPCの排他制御・権限・LINE本文、割り勘/精算の計算）は、ローカルの**embedded PostgreSQL**（Python `pgserver` + `psycopg2`）で検証してきた。
  - `auth.uid()` はGUC（`current_setting('app.uid')`）でスタブ、`net.http_post` は記録用テーブルに差し替えて通知内容を検証。
  - 割り勘の純粋関数（`splitAmount`/`splitByWeight`/`allocItem`/`computeSettlement`）は入出力の期待値でテスト。
- フロントは `npm run build`（Vite/Rollup）で構文・未定義参照を検出。大きめの変更後は全コンポーネント定義の存在を grep で照合すると白画面事故を防げる。

---

## 11. 今後のTODO・検討中（未実装）

- 精算（割り勘の送金案）のLINE一括通知 ※無料枠の月間上限に注意。
- 費用のカテゴリ別・年間集計（部の会計向け）。
- 車検・保険・オイル交換などの期限リマインド（LINE通知）。
- 消耗品（タイヤ・パッド・オイル）の在庫・発注アラート。
- 新規追加した交換チェック項目を交換サイクル集計に紐づけ可能にする（現状サマリ対象はオイル/パッド/タイヤの既定3種）。

---

## 12. 関連リソース

- 要件定義（倉庫アプリ）: `倉庫物品_貸出返却管理アプリ_要件定義書_v1.0.docx`
- 併設の別アプリ: **倉庫貸出返却アプリ**（同一スタック。`倉庫貸出返却アプリ_本番一式.zip`）。Supabase無料枠は1組織2プロジェクトまでのため、倉庫＋車で2プロジェクト構成。
- アイコン一式: `アイコン一式.zip`（`public/` に入れる6ファイル）。

---

### 付記（Claude Code向け）
- 画面は単一 `App.jsx` に集約。肥大化しているが、分割する場合は `sx`（スタイル定義）と純粋計算関数を別ファイルに切り出すと影響が小さい。
- DBに触るのは `api.js` のみ。新機能は「SQL（v11以降）＋ `api.js` にメソッド追加＋ `App.jsx` にUI」の3点セットで、後方互換（`add column if not exists`）を保って追加するのが既存の流儀。
