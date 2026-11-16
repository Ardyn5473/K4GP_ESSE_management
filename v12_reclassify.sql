-- ============================================================
--  v12_reclassify.sql : 既存の振込・立替に、あとから科目／摘要を付ける
--  適用方法: Supabase ダッシュボード → SQL Editor に貼って Run
--  前提    : v11_ledger.sql 適用済み
--  冪等    : 何度流しても安全
--
--  v11より前に申請された振込・立替は account が空（＝未分類）のまま。
--  アプリの明細画面から後付けできるよう、更新用のRPCを2本追加する。
--  変更できるのは「申請者本人」か「管理者」だけ。
--  金額・日付・用途は触らせない（帳簿の改ざんを防ぐため科目と摘要だけ）。
--  LINE通知もしない（無料枠の月間上限を消費しないため）。
-- ============================================================

begin;

-- 前提チェック：v11 が入っているか
do $check$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='payments' and column_name='account') then
    raise exception 'payments.account がありません。先に v11_ledger.sql を実行してください。';
  end if;
end $check$;

-- 振込の科目を付け替える
create or replace function set_payment_account(
  p_id uuid,
  p_account text,
  p_summary text default ''
) returns void
language plpgsql security definer set search_path = public as $fn$
declare v_owner uuid;
begin
  if auth.uid() is null then raise exception 'ログインしてください'; end if;

  select user_id into v_owner from payments where id = p_id;
  if not found then raise exception '対象の振込が見つかりません'; end if;

  if not (is_admin() or v_owner = auth.uid()) then
    raise exception '科目を変更できるのは、申請した本人か管理者だけです';
  end if;

  update payments
     set account = coalesce(p_account, ''),
         summary = coalesce(p_summary, '')
   where id = p_id;
end $fn$;

-- 立替の科目を付け替える
create or replace function set_reimbursement_account(
  p_id uuid,
  p_account text,
  p_summary text default ''
) returns void
language plpgsql security definer set search_path = public as $fn$
declare v_owner uuid;
begin
  if auth.uid() is null then raise exception 'ログインしてください'; end if;

  select user_id into v_owner from reimbursements where id = p_id;
  if not found then raise exception '対象の立替が見つかりません'; end if;

  if not (is_admin() or v_owner = auth.uid()) then
    raise exception '科目を変更できるのは、申請した本人か管理者だけです';
  end if;

  update reimbursements
     set account = coalesce(p_account, ''),
         summary = coalesce(p_summary, '')
   where id = p_id;
end $fn$;

grant execute on function set_payment_account(uuid, text, text) to authenticated;
grant execute on function set_reimbursement_account(uuid, text, text) to authenticated;

commit;

-- ------------------------------------------------------------
-- 確認用（別途 Run する）
-- ------------------------------------------------------------
-- 未分類が何件あるか
-- select 'payments' as t, count(*) from payments where coalesce(account,'') = ''
-- union all
-- select 'reimbursements', count(*) from reimbursements where coalesce(account,'') = '';
--
-- まとめて付けたい場合（用途名でざっくり分類する例）
-- update payments set account = 'エントリ費'
--  where coalesce(account,'') = '' and purpose like '%エントリ%';
