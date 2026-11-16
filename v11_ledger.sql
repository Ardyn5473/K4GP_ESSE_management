-- ============================================================
--  v11_ledger.sql : 出納帳（科目分類・Excel出力・分析）
--  適用方法: Supabase ダッシュボード → SQL Editor に貼って Run
--  前提    : schema.sql 〜 v10_splitmethod.sql が適用済みであること
--  冪等    : 何度流しても安全（既存データは消えません）
--
--  ■ このSQLがやること
--   1. 科目マスタ(account_items) / 摘要マスタ(summary_items) を作成＆初期投入
--   2. 出納帳(ledger_entries) を作成（部の口座の入出金すべてを記帳）
--   3. 既存の payments / reimbursements に account・summary 列を追加
--   4. ledger_settings（期首残高・年度開始月）を作成
--   5. submit_payment / submit_reimbursement を科目・摘要対応版に差し替え
--
--  ※ 5 のみ「作り直し」です。旧版は引数が4〜5個で科目を受け取れないため、
--     同名関数が二重に残ると PostgREST が「関数が一意でない」エラーを出します。
--     そのため DO ブロックで旧版を全て削除してから作り直します。
-- ============================================================

-- 全体を1つのトランザクションにする。
-- 途中で失敗したら全部なかったことになる（RPCだけ消えて壊れる事故を防ぐ）。
begin;

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. 科目マスタ（収入8科目 / 支出13科目）
-- ------------------------------------------------------------
create table if not exists account_items (
  id         uuid primary key default gen_random_uuid(),
  side       text not null check (side in ('in','out')),   -- in=収入 / out=支出
  name       text not null,
  sort       int  not null default 100,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists account_items_side_name_key on account_items (side, name);

insert into account_items (side, name, sort)
select 'in', v.name, v.ord * 10
from (values
  ('出資金',1),('DAC補助金',2),('スポンサ費',3),('走行会参加費',4),
  ('レース参加費',5),('整備費',6),('共済費',7),('預り金',8)
) as v(name, ord)
on conflict (side, name) do nothing;

insert into account_items (side, name, sort)
select 'out', v.name, v.ord * 10
from (values
  ('車両代',1),('エントリ費',2),('車両整備費',3),('車両修理費',4),
  ('レース用雑費',5),('工具',6),('その他雑費',7),('預り金返金',8),
  ('振込手数料',9),('送料',10),('共済費使用',11),('出資金返金',12),('利益分配金',13)
) as v(name, ord)
on conflict (side, name) do nothing;

-- ------------------------------------------------------------
-- 2. 摘要マスタ（中身をさらに分類するタグ）
-- ------------------------------------------------------------
create table if not exists summary_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort       int  not null default 100,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists summary_items_name_key on summary_items (name);

insert into summary_items (name, sort)
select v.name, v.ord * 10
from (values
  ('文具',1),('イベント用備品',2),('修理',3),('改造',4),
  ('消耗品',5),('車両用備品',6),('管理備品',7)
) as v(name, ord)
on conflict (name) do nothing;

-- ------------------------------------------------------------
-- 3. 出納帳本体
--    振込(payments)=収入 / 立替(reimbursements)=支出 はアプリ側で合流表示するので、
--    ここに記帳するのは「それ以外の、部の口座が直接動いたお金」。
--    （車両代・スポンサ費・DAC補助金・振込手数料・利益分配金 など）
-- ------------------------------------------------------------
create table if not exists ledger_entries (
  id           uuid primary key default gen_random_uuid(),
  entry_date   date not null default current_date,
  side         text not null check (side in ('in','out')),
  account      text not null default '',          -- 科目（account_items.name）
  summary      text not null default '',          -- 摘要（summary_items.name）
  purpose      text not null default '',          -- 内容・品名
  amount       numeric not null default 0 check (amount >= 0),
  counterparty text not null default '',          -- 相手先（業者名・メンバー名など）
  method       text not null default 'transfer' check (method in ('transfer','cash','card','other')),
  note         text not null default '',
  photo_url    text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists ledger_entries_date_idx on ledger_entries (entry_date desc);
create index if not exists ledger_entries_account_idx on ledger_entries (side, account);

-- ------------------------------------------------------------
-- 4. 既存テーブルへの科目・摘要の追加（後方互換）
-- ------------------------------------------------------------
alter table payments       add column if not exists account text not null default '';
alter table payments       add column if not exists summary text not null default '';
alter table reimbursements add column if not exists account text not null default '';
alter table reimbursements add column if not exists summary text not null default '';

-- ------------------------------------------------------------
-- 5. 出納帳の設定（期首残高・年度開始月）
--    LINEトークンの入った app_settings とは分ける（全員が読めてよい値のため）
-- ------------------------------------------------------------
create table if not exists ledger_settings (
  id                 boolean primary key default true check (id),
  opening_balance    numeric not null default 0,   -- 期首（記帳開始時点）の残高
  opening_on         date,                         -- その残高の基準日
  fiscal_start_month int not null default 4 check (fiscal_start_month between 1 and 12),
  updated_at         timestamptz not null default now()
);
insert into ledger_settings (id) values (true) on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------
alter table account_items   enable row level security;
alter table summary_items   enable row level security;
alter table ledger_entries  enable row level security;
alter table ledger_settings enable row level security;

drop policy if exists account_items_read   on account_items;
drop policy if exists account_items_write  on account_items;
create policy account_items_read  on account_items for select to authenticated using (true);
create policy account_items_write on account_items for all    to authenticated using (is_admin()) with check (is_admin());

drop policy if exists summary_items_read   on summary_items;
drop policy if exists summary_items_write  on summary_items;
create policy summary_items_read  on summary_items for select to authenticated using (true);
create policy summary_items_write on summary_items for all    to authenticated using (is_admin()) with check (is_admin());

drop policy if exists ledger_entries_read   on ledger_entries;
drop policy if exists ledger_entries_insert on ledger_entries;
drop policy if exists ledger_entries_update on ledger_entries;
drop policy if exists ledger_entries_delete on ledger_entries;
create policy ledger_entries_read   on ledger_entries for select to authenticated using (true);
create policy ledger_entries_insert on ledger_entries for insert to authenticated with check (created_by = auth.uid());
create policy ledger_entries_update on ledger_entries for update to authenticated using (created_by = auth.uid() or is_admin());
create policy ledger_entries_delete on ledger_entries for delete to authenticated using (created_by = auth.uid() or is_admin());

drop policy if exists ledger_settings_read  on ledger_settings;
drop policy if exists ledger_settings_write on ledger_settings;
create policy ledger_settings_read  on ledger_settings for select to authenticated using (true);
create policy ledger_settings_write on ledger_settings for update to authenticated using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- 7. リアルタイム購読（supabase_realtime パブリケーションへ追加）
-- ------------------------------------------------------------
do $pub$
declare t text;
begin
  foreach t in array array['account_items','summary_items','ledger_entries','ledger_settings'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception when others then
        -- publication が無い／FOR ALL TABLES で個別追加できない等。
        -- リアルタイム更新が効かないだけで機能に影響はないのでスキップする。
        raise notice 'realtime への % の追加をスキップしました（%）', t, sqlerrm;
      end;
    end if;
  end loop;
end $pub$;

-- ------------------------------------------------------------
-- 8. 振込・立替のRPCを「科目・摘要つき」に差し替え
--    旧版（引数4〜5個）は削除してから作り直す
-- ------------------------------------------------------------
-- 8-0. 事前チェック：差し替え後の関数が insert する列が実在するか確認する
--      （列名が違う環境でうっかり関数だけ壊すのを防ぐ）
do $check$
declare missing text;
begin
  select string_agg(x.col, ', ') into missing from (
    select 'payments.' || c as col from unnest(array['user_id','paid_on','purpose','amount','note']) c
    where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='payments' and column_name=c)
    union all
    select 'reimbursements.' || c from unnest(array['user_id','spent_on','purpose','amount','photo_url','note']) c
    where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='reimbursements' and column_name=c)
  ) x;
  if missing is not null then
    raise exception '想定している列が見つかりません: %。payments.sql / reimbursements.sql が未適用か、列名が異なります。このSQLの第8節を実際の列名に合わせてから実行してください。', missing;
  end if;
end $check$;

do $drop$
declare r record;
begin
  for r in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('submit_payment','submit_reimbursement')
  loop
    -- search_path に依存しないよう、スキーマ修飾して明示的に組み立てる
    execute format('drop function if exists public.%I(%s)', r.proname, r.args);
  end loop;
end $drop$;

create or replace function submit_payment(
  p_paid_on date,
  p_purpose text,
  p_amount  numeric,
  p_note    text default '',
  p_account text default '',
  p_summary text default ''
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare v_id uuid; v_name text; v_on date;
begin
  if auth.uid() is null then raise exception 'ログインしてください'; end if;
  if coalesce(p_amount, 0) <= 0 then raise exception '金額を入力してください'; end if;

  v_on := coalesce(p_paid_on, current_date);
  insert into payments (user_id, paid_on, purpose, amount, note, account, summary)
  values (auth.uid(), v_on, coalesce(p_purpose,''), p_amount, coalesce(p_note,''),
          coalesce(p_account,''), coalesce(p_summary,''))
  returning id into v_id;

  select name into v_name from profiles where id = auth.uid();

  perform notify_line(
    '[振込] ' || coalesce(v_name, 'メンバー') || ' さん' || chr(10) ||
    '用途: ' || coalesce(nullif(p_purpose,''), '（未記入）') || chr(10) ||
    case when coalesce(p_account,'') <> '' then '科目: ' || p_account || chr(10) else '' end ||
    '金額: ' || to_char(p_amount, 'FM999,999,999') || '円' || chr(10) ||
    '振込日: ' || to_char(v_on, 'YYYY/MM/DD') ||
    case when coalesce(p_note,'') <> '' then chr(10) || '備考: ' || p_note else '' end
  );
  return v_id;
end $fn$;

create or replace function submit_reimbursement(
  p_spent_on  date,
  p_purpose   text,
  p_amount    numeric,
  p_photo_url text default null,
  p_note      text default '',
  p_account   text default '',
  p_summary   text default ''
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare v_id uuid; v_name text; v_on date;
begin
  if auth.uid() is null then raise exception 'ログインしてください'; end if;
  if coalesce(p_amount, 0) <= 0 then raise exception '金額を入力してください'; end if;

  v_on := coalesce(p_spent_on, current_date);
  insert into reimbursements (user_id, spent_on, purpose, amount, photo_url, note, account, summary)
  values (auth.uid(), v_on, coalesce(p_purpose,''), p_amount, p_photo_url, coalesce(p_note,''),
          coalesce(p_account,''), coalesce(p_summary,''))
  returning id into v_id;

  select name into v_name from profiles where id = auth.uid();

  perform notify_line(
    '[立替] ' || coalesce(v_name, 'メンバー') || ' さん' || chr(10) ||
    '用途: ' || coalesce(nullif(p_purpose,''), '（未記入）') || chr(10) ||
    case when coalesce(p_account,'') <> '' then '科目: ' || p_account || chr(10) else '' end ||
    '金額: ' || to_char(p_amount, 'FM999,999,999') || '円' || chr(10) ||
    '立替日: ' || to_char(v_on, 'YYYY/MM/DD') ||
    case when p_photo_url is not null then chr(10) || '領収書あり' else '' end ||
    case when coalesce(p_note,'') <> '' then chr(10) || '備考: ' || p_note else '' end
  );
  return v_id;
end $fn$;

grant execute on function submit_payment(date,text,numeric,text,text,text) to authenticated;
grant execute on function submit_reimbursement(date,text,numeric,text,text,text,text) to authenticated;

commit;

-- ------------------------------------------------------------
-- 9. 確認用（上が成功したら、これを別途 Run して結果を見る）
-- ------------------------------------------------------------
-- select side, count(*) from account_items group by side;          -- in:8 / out:13
-- select count(*) from summary_items;                              -- 7
-- select * from ledger_settings;                                   -- 1行
-- select proname, pg_get_function_identity_arguments(oid)
--   from pg_proc where proname in ('submit_payment','submit_reimbursement');
--   -- submit_payment: date, text, numeric, text, text, text
--   -- submit_reimbursement: date, text, numeric, text, text, text, text
