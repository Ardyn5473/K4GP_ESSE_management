-- ============================================================
--  エッセ 予約・点検記録アプリ  —  Supabase スキーマ
--  SQL Editor に貼り付けて実行してください。
-- ============================================================

create extension if not exists pgcrypto;
-- LINE通知の送信に使用（SupabaseでHTTPを送る拡張）
create extension if not exists pg_net;

do $$ begin
  create type user_role as enum ('admin', 'general');
exception when duplicate_object then null; end $$;

-- ---------- プロフィール ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '', department text default '',
  role user_role not null default 'general', created_at timestamptz not null default now()
);

-- ---------- 車（今回は1台だが汎用化） ----------
create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  name text not null, plate text default '', photo_url text, note text default '',
  status text not null default 'available' check (status in ('available','out')),
  created_at timestamptz not null default now()
);

-- ---------- 予約（出庫/返却） ----------
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete restrict,
  destination text default '',
  due_at timestamptz,
  status text not null default 'active' check (status in ('active','returned')),
  started_at timestamptz not null default now(),
  returned_at timestamptz, note text default ''
);
create index if not exists idx_res_car on reservations(car_id);
create index if not exists idx_res_open on reservations(car_id) where status = 'active';

-- ---------- 点検イベント（節目：走行会前/後・レース前/後など） ----------
create table if not exists check_events (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  occasion text not null default '走行会',   -- 走行会 / レース / その他
  phase text not null default '前',          -- 前 / 後
  template text not null default 'daily' check (template in ('daily','race')),
  event_date date not null default current_date,
  note text default '',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- 点検記録（項目ごと） ----------
create table if not exists check_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references check_events(id) on delete cascade,
  item_id text not null,
  status text not null default 'pending' check (status in ('pending','ok','ng')),
  note text default '', photo_url text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique (event_id, item_id)
);

-- ---------- LINE設定（1行） ----------
create table if not exists app_settings (
  id boolean primary key default true check (id),
  line_token text, line_target text
);
insert into app_settings (id) values (true) on conflict (id) do nothing;

-- ---------- 管理者判定 ----------
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ============================================================
--  LINE通知（push）
-- ============================================================
create or replace function notify_line(p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare s app_settings;
begin
  select * into s from app_settings where id = true;
  if s.line_token is null or s.line_target is null then return; end if;  -- 未設定なら何もしない
  perform net.http_post(
    url := 'https://api.line.me/v2/bot/message/push',
    body := jsonb_build_object('to', s.line_target,
              'messages', jsonb_build_array(jsonb_build_object('type','text','text',p_text))),
    headers := jsonb_build_object('Content-Type','application/json',
              'Authorization','Bearer ' || s.line_token)
  );
end $$;

-- ============================================================
--  出庫（借りる）：1台を奪い合っても1人だけ成立
-- ============================================================
create or replace function reserve_car(p_car_id uuid, p_destination text, p_due_at timestamptz, p_note text default '')
returns reservations language plpgsql security definer set search_path = public as $$
declare v_res reservations; v_updated int; v_car cars; v_user text;
begin
  if auth.uid() is null then raise exception 'ログインが必要です' using errcode='28000'; end if;
  update cars set status='out' where id=p_car_id and status='available';
  get diagnostics v_updated = row_count;
  if v_updated = 0 then raise exception 'この車は現在貸出中です' using errcode='23514'; end if;
  insert into reservations(car_id,user_id,destination,due_at,note,status)
  values(p_car_id, auth.uid(), coalesce(p_destination,''), p_due_at, coalesce(p_note,''),'active')
  returning * into v_res;
  select * into v_car from cars where id=p_car_id;
  select name into v_user from profiles where id=auth.uid();
  perform notify_line('🚗 出庫' || E'\n' ||
    '車: ' || v_car.name || E'\n' ||
    '借用者: ' || coalesce(v_user,'?') || E'\n' ||
    '行先: ' || coalesce(nullif(p_destination,''),'未記入') || E'\n' ||
    '返却予定: ' || coalesce(to_char(p_due_at at time zone 'Asia/Tokyo','MM/DD HH24:MI'),'未定'));
  return v_res;
end $$;

-- ============================================================
--  返却
-- ============================================================
create or replace function return_car(p_reservation_id uuid)
returns reservations language plpgsql security definer set search_path = public as $$
declare v_res reservations; v_car cars; v_user text;
begin
  if auth.uid() is null then raise exception 'ログインが必要です' using errcode='28000'; end if;
  select * into v_res from reservations where id=p_reservation_id for update;
  if not found then raise exception '予約が見つかりません' using errcode='P0002'; end if;
  if v_res.status='returned' then raise exception '既に返却済みです' using errcode='23514'; end if;
  if v_res.user_id<>auth.uid() and not is_admin() then raise exception '権限がありません' using errcode='42501'; end if;
  update reservations set status='returned', returned_at=now() where id=p_reservation_id returning * into v_res;
  update cars set status='available' where id=v_res.car_id;
  select * into v_car from cars where id=v_res.car_id;
  select name into v_user from profiles where id=v_res.user_id;
  perform notify_line('🅿️ 返却' || E'\n' ||
    '車: ' || v_car.name || E'\n' ||
    '返却者: ' || coalesce(v_user,'?') || E'\n' ||
    '行先: ' || coalesce(nullif(v_res.destination,''),'未記入'));
  return v_res;
end $$;

-- ---------- 新規ユーザのprofile自動作成 ----------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
--  RLS
-- ============================================================
alter table profiles enable row level security;
alter table cars enable row level security;
alter table reservations enable row level security;
alter table check_events enable row level security;
alter table check_records enable row level security;
alter table app_settings enable row level security;

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (auth.uid() = id or is_admin());
drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update using (auth.uid() = id);
drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

-- 車：閲覧は全員、編集は管理者
drop policy if exists cars_select on cars;
create policy cars_select on cars for select using (auth.uid() is not null);
drop policy if exists cars_admin on cars;
create policy cars_admin on cars for all using (is_admin()) with check (is_admin());

-- 予約：閲覧は全員（誰が乗ってるか分かる）。書込はRPC経由のみ（直接は管理者）
drop policy if exists res_select on reservations;
create policy res_select on reservations for select using (auth.uid() is not null);
drop policy if exists res_admin on reservations;
create policy res_admin on reservations for all using (is_admin()) with check (is_admin());

-- 点検イベント・記録：ログインユーザは誰でも作成・更新（みんなで点検する）
drop policy if exists ev_all on check_events;
create policy ev_all on check_events for all using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists rec_all on check_records;
create policy rec_all on check_records for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- LINE設定：管理者のみ
drop policy if exists settings_admin on app_settings;
create policy settings_admin on app_settings for all using (is_admin()) with check (is_admin());

grant usage on schema public to anon, authenticated;
grant select on cars, reservations, check_events, check_records, profiles to authenticated;
grant insert, update, delete on check_events, check_records to authenticated;
grant execute on function reserve_car(uuid,text,timestamptz,text) to authenticated;
grant execute on function return_car(uuid) to authenticated;
grant execute on function is_admin() to authenticated;

-- ============================================================
--  ストレージ（点検・車の写真）
-- ============================================================
insert into storage.buckets (id, name, public) values ('car-photos','car-photos',true)
on conflict (id) do nothing;
drop policy if exists "car photos read" on storage.objects;
create policy "car photos read" on storage.objects for select using (bucket_id='car-photos');
drop policy if exists "car photos write" on storage.objects;
create policy "car photos write" on storage.objects for all to authenticated
  using (bucket_id='car-photos') with check (bucket_id='car-photos');

-- ============================================================
--  初期データ：エッセ1台
-- ============================================================
insert into cars (name, plate, note) values ('ダイハツ エッセ (K4GP)', '', 'T-class L235S')
on conflict do nothing;

-- ============================================================
--  LINE設定の入れ方（取得後に実行。README参照）
--   update app_settings set
--     line_token = 'チャネルアクセストークン',
--     line_target = 'グループID' where id = true;
-- ============================================================
