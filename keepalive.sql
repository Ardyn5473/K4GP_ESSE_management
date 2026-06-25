-- キープアライブ：匿名でも叩ける軽量関数（1回だけ実行）
create or replace function ping() returns text
language sql security definer set search_path = public as $$ select 'ok'::text; $$;
grant execute on function ping() to anon, authenticated;
