import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Car, ClipboardCheck, History, Settings, Plus, Minus, X, AlertTriangle, Check,
  User, Shield, LogOut, Loader2, Camera, Trash2, ChevronLeft, ChevronRight, MapPin, Clock, MessageSquare,
} from "lucide-react";
import { api } from "./api";
import { TEMPLATES, flatItems } from "./checklist";

const C = {
  bg: "#EEF0F3", chrome: "#14181F", chrome2: "#1E242E", card: "#FFFFFF",
  ink: "#161A20", sub: "#6B7280", line: "#E3E6EB", accent: "#D72638", accentDk: "#A81B29",
  ok: "#15803D", okBg: "#E7F4EC", warn: "#B45309", warnBg: "#FBEFDC", ng: "#B91C1C", ngBg: "#FBE7E7", blue: "#0F62D6", blueBg: "#E6EEFC",
};
const pad = (n) => String(n).padStart(2, "0");
const nowLocal = (addDays = 0) => { const d = new Date(Date.now() + addDays * 86400000); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDT = (iso) => { if (!iso) return "未定"; const d = new Date(iso); return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDate = (s) => (s ? String(s).replaceAll("-", "/").slice(5) : "—");

function compressImage(file, maxSize = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url); let { width, height } = img;
      if (width >= height && width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
      else if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
      const cv = document.createElement("canvas"); cv.width = width; cv.height = height;
      cv.getContext("2d").drawImage(img, 0, 0, width, height);
      cv.toBlob((b) => b ? resolve(new File([b], "p.jpg", { type: "image/jpeg" })) : reject(new Error("変換失敗")), "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("画像を読み込めません")); };
    img.src = url;
  });
}

export default function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    api.session().then((s) => { setSession(s); setBooting(false); });
    const { data } = api.onAuth((s) => setSession(s));
    return () => data?.subscription?.unsubscribe?.();
  }, []);
  if (booting) return <Splash />;
  if (!session) return <Login />;
  return <Home key={session.user.id} />;
}
function Splash() { return <div style={{ ...sx.app, alignItems: "center", justifyContent: "center", color: C.sub }}><style>{css}</style><Loader2 className="spin" size={26} /></div>; }

function Login() {
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [name, setName] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  async function submit() {
    setErr(""); setBusy(true);
    try { if (mode === "in") await api.signIn(email, pw); else { await api.signUp(email, pw, name); setDone(true); } }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  return (
    <div style={{ ...sx.app, justifyContent: "center", padding: "0 22px" }}>
      <style>{css}</style>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <Car size={40} color={C.accent} />
        <div style={{ fontWeight: 800, fontSize: 22, marginTop: 10 }}>エッセ 予約・点検</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 4, letterSpacing: ".08em" }}>K4GP CAR MANAGER</div>
      </div>
      {done ? (
        <div style={{ ...sx.card, display: "block", textAlign: "center", lineHeight: 1.7 }}>
          確認メールを送信しました。メール内のリンクで認証してからログインしてください。
          <button style={{ ...sx.outline, marginTop: 14, width: "100%", justifyContent: "center" }} onClick={() => { setMode("in"); setDone(false); }}>ログインへ</button>
        </div>
      ) : (
        <div style={{ ...sx.card, display: "block" }}>
          {mode === "up" && (<><label style={sx.label}>氏名</label><input style={sx.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="中田 明人" /></>)}
          <label style={sx.label}>メールアドレス</label>
          <input style={sx.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <label style={sx.label}>パスワード</label>
          <input style={sx.input} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="6文字以上" />
          {err && <div style={{ color: C.accent, fontSize: 12.5, marginTop: 10 }}>{err}</div>}
          <button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 7, marginTop: 16, padding: 13 }} onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="spin" size={16} /> : null}{mode === "in" ? "ログイン" : "アカウント作成"}</button>
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: C.sub }}>
            {mode === "in" ? "アカウントが無い方は" : "アカウントをお持ちの方は"}{" "}
            <span style={{ color: C.accent, fontWeight: 700, cursor: "pointer" }} onClick={() => { setErr(""); setMode(mode === "in" ? "up" : "in"); }}>{mode === "in" ? "新規作成" : "ログイン"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Home() {
  const [me, setMe] = useState(null);
  const [cars, setCars] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("res");
  const [sheet, setSheet] = useState(null);
  const [openEvent, setOpenEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const [bump, setBump] = useState(0);
  const flash = useCallback((m, kind = "ok") => { setToast({ m, kind }); setTimeout(() => setToast(null), 2400); }, []);

  const car = cars[0] || null;

  const reload = useCallback(async () => {
    try {
      const [pf, cs, rs] = await Promise.all([api.myProfile(), api.cars(), api.reservations()]);
      setMe(pf); setCars(cs); setReservations(rs);
      if (pf?.role === "admin") setProfiles(await api.profiles());
      if (cs[0]) setEvents(await api.events(cs[0].id));
    } catch (e) { flash(e.message, "err"); } finally { setLoading(false); }
  }, [flash]);
  useEffect(() => { reload(); const off = api.subscribe(() => { setBump((b) => b + 1); reload(); }); return off; }, [reload]);

  const isAdmin = me?.role === "admin";
  const nameOf = (id) => profiles.find((p) => p.id === id)?.name || (id === me?.id ? me?.name : "メンバー");
  const activeRes = useMemo(() => reservations.find((r) => r.car_id === car?.id && r.status === "active"), [reservations, car]);

  async function doReserve({ destination, dueAt, note }) {
    try { await api.reserve(car.id, destination, dueAt ? new Date(dueAt).toISOString() : null, note); setSheet(null); flash("出庫しました（LINE通知）"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function doReturn() {
    try { await api.giveBack(activeRes.id); flash("返却しました（LINE通知）"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }

  if (loading) return <Splash />;

  // 点検チェック画面（フルスクリーン）
  if (openEvent) return <CheckScreen event={openEvent} me={me} bump={bump} onBack={() => { setOpenEvent(null); reload(); }} flash={flash} />;

  return (
    <div style={sx.app}>
      <style>{css}</style>
      <header style={sx.top}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Car size={20} color={C.accent} />
          <div><div style={{ fontWeight: 800, fontSize: 15 }}>エッセ 予約・点検</div>
            <div style={{ fontSize: 10.5, color: "#9AA3B0", marginTop: 1 }}>K4GP CAR MANAGER</div></div>
        </div>
        <button style={sx.meBtn} onClick={() => setSheet({ type: "me" })}>
          {isAdmin ? <Shield size={13} color="#FFD7DC" /> : <User size={13} color="#C7CDD6" />}
          <span style={{ maxWidth: 92, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me?.name || "ユーザー"}</span>
        </button>
      </header>

      <main style={sx.main}>
        {tab === "res" && <ReservationTab {...{ car, activeRes, nameOf, isAdmin, setSheet, doReturn }} />}
        {tab === "check" && <CheckTab {...{ events, setOpenEvent, setSheet }} />}
        {tab === "hist" && <HistoryTab {...{ reservations, nameOf }} />}
        {tab === "admin" && isAdmin && <AdminTab {...{ car, setSheet }} />}
        {tab === "admin" && !isAdmin && <Empty icon={<Shield size={30} />} title="管理者専用" body="この画面は管理者のみ利用できます。" />}
      </main>

      <nav style={sx.nav}>
        <NavBtn active={tab === "res"} onClick={() => setTab("res")} icon={<Car size={20} />} label="予約" />
        <NavBtn active={tab === "check"} onClick={() => setTab("check")} icon={<ClipboardCheck size={20} />} label="点検記録" />
        <NavBtn active={tab === "hist"} onClick={() => setTab("hist")} icon={<History size={20} />} label="履歴" />
        <NavBtn active={tab === "admin"} onClick={() => setTab("admin")} icon={<Settings size={20} />} label="管理" />
      </nav>

      {sheet?.type === "reserve" && <ReserveSheet onClose={() => setSheet(null)} onSubmit={doReserve} />}
      {sheet?.type === "event" && <EventSheet car={car} onClose={() => setSheet(null)} onCreated={(ev) => { setSheet(null); setOpenEvent(ev); }} flash={flash} />}
      {sheet?.type === "car" && <CarSheet car={car} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); reload(); flash("車を保存しました"); }} flash={flash} />}
      {sheet?.type === "line" && <LineSheet onClose={() => setSheet(null)} flash={flash} />}
      {sheet?.type === "me" && <MeSheet me={me} onClose={() => setSheet(null)} onSignOut={() => api.signOut()} />}

      {toast && <div style={{ ...sx.toast, background: toast.kind === "err" ? C.accent : "#14181F" }}>
        {toast.kind === "err" ? <AlertTriangle size={15} /> : <Check size={15} />} {toast.m}</div>}
    </div>
  );
}

/* ===== 予約タブ ===== */
function ReservationTab({ car, activeRes, nameOf, isAdmin, setSheet, doReturn }) {
  if (!car) return <Empty icon={<Car size={30} />} title="車が未登録" body={isAdmin ? "管理タブから車を登録してください。" : "管理者に車の登録を依頼してください。"} />;
  const out = car.status === "out";
  const overdue = activeRes?.due_at && new Date(activeRes.due_at) < new Date();
  return (
    <div>
      <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 0, padding: 0, overflow: "hidden" }}>
        {car.photo_url
          ? <img src={car.photo_url} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} />
          : <div style={{ height: 120, background: "#F1F3F6", display: "flex", alignItems: "center", justifyContent: "center" }}><Car size={48} color="#B8BFC9" /></div>}
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{car.name}</div>
            <span style={{ ...sx.statusTag, background: out ? C.ngBg : C.okBg, color: out ? C.ng : C.ok }}>{out ? "貸出中" : "空き"}</span>
          </div>
          {car.plate && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>{car.plate}</div>}

          {out && activeRes ? (
            <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <Row icon={<User size={15} />} label="借用者" value={nameOf(activeRes.user_id)} />
              <Row icon={<MapPin size={15} />} label="行先" value={activeRes.destination || "未記入"} />
              <Row icon={<Clock size={15} />} label="返却予定" value={fmtDT(activeRes.due_at)} danger={overdue} />
              <button style={{ ...sx.primary, marginTop: 8, padding: 14, justifyContent: "center", display: "flex", alignItems: "center", gap: 7, fontSize: 15 }} onClick={doReturn}>
                <Check size={18} /> 返却する</button>
            </div>
          ) : (
            <button style={{ ...sx.primary, marginTop: 14, width: "100%", padding: 14, justifyContent: "center", display: "flex", alignItems: "center", gap: 7, fontSize: 15 }} onClick={() => setSheet({ type: "reserve" })}>
              <Car size={18} /> 借りる（出庫）</button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: C.sub, textAlign: "center", marginTop: 14, lineHeight: 1.7 }}>
        借りる／返すを押すと、登録済みのLINEグループに自動で通知が送られます。
      </div>
    </div>
  );
}
function Row({ icon, label, value, danger }) {
  return (<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ color: C.sub, display: "flex" }}>{icon}</span>
    <span style={{ fontSize: 12.5, color: C.sub, width: 64 }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 700, color: danger ? C.accent : C.ink }}>{value}</span></div>);
}

/* ===== 点検記録タブ ===== */
function CheckTab({ events, setOpenEvent, setSheet }) {
  return (
    <div>
      <div style={sx.rowHead}><h2 style={sx.h2}>点検記録</h2>
        <button style={{ ...sx.primary, padding: "8px 13px", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }} onClick={() => setSheet({ type: "event" })}><Plus size={15} /> 記録</button></div>
      {events.length === 0 && <Empty icon={<ClipboardCheck size={30} />} title="記録なし" body="「記録」から、走行会前後・レース前後などの点検を残せます。" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((ev) => (
          <div key={ev.id} style={sx.card} onClick={() => setOpenEvent(ev)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ ...sx.chipTag, background: ev.occasion === "レース" ? C.ngBg : C.blueBg, color: ev.occasion === "レース" ? C.ng : C.blue }}>{ev.occasion}{ev.phase}</span>
                <span style={{ fontSize: 11.5, color: C.sub }}>{ev.template === "race" ? "レース項目" : "日常項目"}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 5 }}>{fmtDate(ev.event_date)} の点検</div>
              {ev.note && <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{ev.note}</div>}
            </div>
            <ChevronRight size={20} color={C.sub} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== 点検チェック画面（フルスクリーン） ===== */
function CheckScreen({ event, me, bump, onBack, flash }) {
  const sections = TEMPLATES[event.template] || [];
  const all = flatItems(event.template);
  const [recs, setRecs] = useState({});
  const load = useCallback(async () => {
    const rows = await api.records(event.id);
    const map = {}; rows.forEach((r) => (map[r.item_id] = r)); setRecs(map);
  }, [event.id]);
  useEffect(() => { load(); }, [load, bump]);

  const done = all.filter((i) => ["ok", "ng"].includes(recs[i.id]?.status)).length;
  const ngCount = all.filter((i) => recs[i.id]?.status === "ng").length;
  const pct = all.length ? Math.round(done / all.length * 100) : 0;

  async function patch(itemId, p) {
    setRecs((s) => ({ ...s, [itemId]: { ...(s[itemId] || { item_id: itemId, status: "pending" }), ...p } }));
    try { await api.upsertRecord(event.id, itemId, p); } catch (e) { flash(e.message, "err"); load(); }
  }

  return (
    <div style={sx.app}>
      <style>{css}</style>
      <header style={{ ...sx.top, gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", display: "flex", alignItems: "center", cursor: "pointer", padding: 0 }}><ChevronLeft size={24} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{event.occasion}{event.phase}・{fmtDate(event.event_date)}</div>
          <div style={{ fontSize: 10.5, color: "#9AA3B0" }}>{done}/{all.length} 完了{ngCount > 0 ? `・要注意 ${ngCount}` : ""}</div>
        </div>
      </header>
      <div style={{ height: 5, background: "#E4E7EB" }}><div style={{ height: "100%", width: `${pct}%`, background: ngCount > 0 ? C.accent : C.ok, transition: "width .4s" }} /></div>

      <main style={sx.main}>
        {sections.map((sec) => (
          <div key={sec.section} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.sub, margin: "4px 2px 8px" }}>{sec.section}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sec.items.map((it) => <ItemRow key={it.id} item={it} rec={recs[it.id]} onPatch={(p) => patch(it.id, p)} flash={flash} />)}
            </div>
          </div>
        ))}
        <div style={{ height: 20 }} />
      </main>
    </div>
  );
}

function ItemRow({ item, rec, onPatch, flash }) {
  const status = rec?.status || "pending";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  async function onPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try { const small = await compressImage(file); const url = await api.uploadPhoto(small); onPatch({ photo_url: url }); }
    catch (err) { flash(err.message, "err"); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  const ng = status === "ng", ok = status === "ok";
  return (
    <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 0, padding: 0, borderLeft: `4px solid ${ng ? C.accent : ok ? C.ok : C.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <span style={{ fontSize: 20 }}>{item.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setOpen((o) => !o)}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{item.name}</div>
          <div style={{ fontSize: 11.5, color: C.sub }}>{item.hint}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onPatch({ status: ok ? "pending" : "ok" })} style={{ ...sx.miniBtn, ...(ok ? { background: C.ok, color: "#fff", borderColor: C.ok } : {}) }}>OK</button>
          <button onClick={() => onPatch({ status: ng ? "pending" : "ng" })} style={{ ...sx.miniBtn, ...(ng ? { background: C.accent, color: "#fff", borderColor: C.accent } : {}) }}>NG</button>
        </div>
      </div>
      {(open || rec?.note || rec?.photo_url || ng) && (
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {rec?.photo_url
              ? <img src={rec.photo_url} alt="" style={{ width: 54, height: 54, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.line}` }} />
              : <div style={{ width: 54, height: 54, borderRadius: 8, background: "#F1F3F6", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={18} color="#B8BFC9" /></div>}
            <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ ...sx.outline, padding: "8px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
              {busy ? <Loader2 className="spin" size={13} /> : <Camera size={13} />}{rec?.photo_url ? "写真を変更" : "写真を撮る/選ぶ"}</button>
            {rec?.photo_url && <Trash2 size={16} color={C.sub} style={{ cursor: "pointer" }} onClick={() => onPatch({ photo_url: null })} />}
            <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          </div>
          <input value={rec?.note || ""} onChange={(e) => onPatch({ note: e.target.value })} placeholder="メモ（状態・数値・気づき）" style={{ ...sx.input, fontSize: 13, padding: "9px 11px" }} />
        </div>
      )}
    </div>
  );
}

/* ===== 履歴タブ ===== */
function HistoryTab({ reservations, nameOf }) {
  return (
    <div>
      <div style={sx.rowHead}><h2 style={sx.h2}>利用履歴</h2></div>
      {reservations.length === 0 && <Empty icon={<History size={30} />} title="履歴なし" body="出庫・返却の記録がここに表示されます。" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {reservations.map((r) => {
          const active = r.status === "active";
          return (<div key={r.id} style={{ ...sx.card, padding: "12px 14px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{nameOf(r.user_id)}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{r.destination || "行先未記入"}・{fmtDT(r.started_at)}{r.returned_at ? ` → ${fmtDT(r.returned_at)}` : ""}</div>
            </div>
            <span style={{ ...sx.statusTag, background: active ? C.warnBg : C.okBg, color: active ? C.warn : C.ok }}>{active ? "貸出中" : "返却済"}</span>
          </div>);
        })}
      </div>
    </div>
  );
}

/* ===== 管理タブ ===== */
function AdminTab({ car, setSheet }) {
  return (
    <div>
      <div style={sx.rowHead}><h2 style={sx.h2}>管理</h2></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={sx.card} onClick={() => setSheet({ type: "car" })}>
          <Car size={22} color={C.accent} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>車の情報</div>
            <div style={{ fontSize: 11.5, color: C.sub }}>{car ? car.name : "未登録（タップで登録）"}・写真/名称の編集</div></div>
          <ChevronRight size={20} color={C.sub} />
        </div>
        <div style={sx.card} onClick={() => setSheet({ type: "line" })}>
          <MessageSquare size={22} color={C.ok} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>LINE通知の設定</div>
            <div style={{ fontSize: 11.5, color: C.sub }}>トークン・グループIDの登録</div></div>
          <ChevronRight size={20} color={C.sub} />
        </div>
      </div>
    </div>
  );
}

/* ===== シート群 ===== */
function Sheet({ title, onClose, children, foot }) {
  return (<div style={sx.overlay} onClick={onClose}>
    <div className="sheet" style={sx.sheet} onClick={(e) => e.stopPropagation()}>
      <div style={sx.sheetHead}><span>{title}</span><X size={20} color={C.sub} onClick={onClose} style={{ cursor: "pointer" }} /></div>
      <div style={{ padding: "4px 18px 6px" }}>{children}</div>
      {foot && <div style={sx.sheetFoot}>{foot}</div>}
    </div></div>);
}
function ReserveSheet({ onClose, onSubmit }) {
  const [destination, setDestination] = useState(""); const [dueAt, setDueAt] = useState(nowLocal(1)); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  return (<Sheet title="借りる（出庫）" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 14, fontSize: 15 }} disabled={busy}
      onClick={async () => { setBusy(true); await onSubmit({ destination, dueAt, note }); setBusy(false); }}>{busy ? <Loader2 className="spin" size={16} /> : <Car size={17} />} 出庫してLINE通知</button>}>
    <label style={sx.label}>行先（どこに持っていく）</label>
    <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="例：鈴鹿サーキット" style={sx.input} />
    <label style={sx.label}>返却予定（いつまで）</label>
    <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} style={sx.input} />
    <label style={sx.label}>備考（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="用途など" style={sx.input} />
  </Sheet>);
}
function EventSheet({ car, onClose, onCreated, flash }) {
  const [occasion, setOccasion] = useState("走行会"); const [phase, setPhase] = useState("前");
  const [template, setTemplate] = useState("daily"); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    try { const ev = await api.createEvent({ car_id: car.id, occasion, phase, template, event_date: date, note }); onCreated(ev); }
    catch (e) { flash(e.message, "err"); setBusy(false); }
  }
  const Seg = ({ val, set, options }) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => <button key={o.v} onClick={() => set(o.v)} style={{ ...sx.segBtn, ...(val === o.v ? sx.segOn : {}) }}>{o.l}</button>)}</div>
  );
  return (<Sheet title="点検を記録" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 14, fontSize: 15 }} disabled={busy} onClick={create}>
      {busy ? <Loader2 className="spin" size={16} /> : <ClipboardCheck size={17} />} 点検をはじめる</button>}>
    <label style={sx.label}>機会</label>
    <Seg val={occasion} set={setOccasion} options={[{ v: "走行会", l: "走行会" }, { v: "レース", l: "レース" }, { v: "その他", l: "その他" }]} />
    <label style={sx.label}>タイミング</label>
    <Seg val={phase} set={setPhase} options={[{ v: "前", l: "前" }, { v: "後", l: "後" }]} />
    <label style={sx.label}>点検項目</label>
    <Seg val={template} set={setTemplate} options={[{ v: "daily", l: "日常点検" }, { v: "race", l: "レース点検（詳細）" }]} />
    <label style={sx.label}>日付</label>
    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={sx.input} />
    <label style={sx.label}>メモ（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="例：6/5 コンダサーキット走行会" style={sx.input} />
  </Sheet>);
}
function CarSheet({ car, onClose, onSaved, flash }) {
  const [f, setF] = useState(car || { name: "", plate: "", note: "" });
  const [busy, setBusy] = useState(false); const fileRef = useRef(null);
  async function onPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return; setBusy(true);
    try { const small = await compressImage(file); const url = await api.uploadPhoto(small); setF((s) => ({ ...s, photo_url: url })); }
    catch (err) { flash(err.message, "err"); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  async function save() { try { await api.saveCar(f); onSaved(); } catch (e) { flash(e.message, "err"); } }
  return (<Sheet title="車の情報" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", padding: 14, fontSize: 15 }} onClick={save}>保存</button>}>
    <label style={sx.label}>写真</label>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {f.photo_url ? <img src={f.photo_url} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.line}` }} />
        : <div style={{ width: 72, height: 72, borderRadius: 10, background: "#F1F3F6", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Car size={28} color="#B8BFC9" /></div>}
      <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ ...sx.outline, flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: 7 }}>
        {busy ? <Loader2 className="spin" size={15} /> : <Camera size={15} />}{busy ? "アップロード中…" : "写真を撮る / 選ぶ"}</button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
    </div>
    <label style={sx.label}>名称</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={sx.input} />
    <label style={sx.label}>ナンバー（任意）</label><input value={f.plate || ""} onChange={(e) => setF({ ...f, plate: e.target.value })} style={sx.input} />
    <label style={sx.label}>メモ（任意）</label><input value={f.note || ""} onChange={(e) => setF({ ...f, note: e.target.value })} style={sx.input} />
  </Sheet>);
}
function LineSheet({ onClose, flash }) {
  const [token, setToken] = useState(""); const [target, setTarget] = useState(""); const [busy, setBusy] = useState(false); const [loaded, setLoaded] = useState(false);
  useEffect(() => { api.getSettings().then((s) => { if (s) { setToken(s.line_token || ""); setTarget(s.line_target || ""); } setLoaded(true); }).catch(() => setLoaded(true)); }, []);
  async function save() { setBusy(true); try { await api.saveSettings(token, target); flash("LINE設定を保存しました"); onClose(); } catch (e) { flash(e.message, "err"); } finally { setBusy(false); } }
  return (<Sheet title="LINE通知の設定" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", padding: 14, fontSize: 15 }} disabled={busy || !loaded} onClick={save}>保存</button>}>
    <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7, marginBottom: 6 }}>
      LINE Messaging API の「チャネルアクセストークン」と、通知を送るグループの「グループID」を登録します（取得方法はREADME参照）。
    </div>
    <label style={sx.label}>チャネルアクセストークン</label>
    <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="長い文字列" style={{ ...sx.input, fontFamily: "ui-monospace, monospace", fontSize: 12 }} />
    <label style={sx.label}>グループID</label>
    <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Cxxxxxxxx... または Uxxxx..." style={{ ...sx.input, fontFamily: "ui-monospace, monospace", fontSize: 12 }} />
  </Sheet>);
}
function MeSheet({ me, onClose, onSignOut }) {
  return (<Sheet title="アカウント" onClose={onClose}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0 16px" }}>
      {me?.role === "admin" ? <Shield size={26} color={C.accent} /> : <User size={26} color={C.sub} />}
      <div><div style={{ fontWeight: 800, fontSize: 16 }}>{me?.name}</div>
        <div style={{ fontSize: 12.5, color: C.sub }}>{me?.department || "—"}・{me?.role === "admin" ? "管理者" : "一般ユーザー"}</div></div></div>
    <button style={{ ...sx.outline, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 7, color: C.accent, borderColor: C.accent }} onClick={onSignOut}><LogOut size={16} /> ログアウト</button>
  </Sheet>);
}

function NavBtn({ active, onClick, icon, label }) {
  return (<button onClick={onClick} style={{ ...sx.navBtn, color: active ? C.accent : "#8A93A0" }}>
    <div>{icon}</div><span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span></button>);
}
function Empty({ icon, title, body }) {
  return (<div style={{ textAlign: "center", padding: "48px 24px", color: C.sub }}>
    <div style={{ opacity: .35, display: "flex", justifyContent: "center", marginBottom: 12 }}>{icon}</div>
    <div style={{ fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 13, lineHeight: 1.6 }}>{body}</div></div>);
}

const sx = {
  app: { maxWidth: 460, margin: "0 auto", minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif', color: C.ink, position: "relative" },
  top: { position: "sticky", top: 0, zIndex: 20, background: C.chrome, color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  meBtn: { display: "flex", alignItems: "center", gap: 6, background: C.chrome2, color: "#E6E9EE", border: "1px solid #2C333E", borderRadius: 999, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  main: { flex: 1, padding: "16px 16px 92px", overflowY: "auto" },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 460, background: "#fff", borderTop: `1px solid ${C.line}`, display: "flex", padding: "8px 0 max(8px, env(safe-area-inset-bottom))", zIndex: 20 },
  navBtn: { flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" },
  card: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 15px", display: "flex", alignItems: "center", gap: 12, cursor: "default" },
  primary: { background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  outline: { background: "#fff", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  miniBtn: { background: "#fff", color: C.sub, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer", minWidth: 44 },
  segBtn: { background: "#fff", color: C.sub, border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  segOn: { background: C.chrome, color: "#fff", borderColor: C.chrome },
  h2: { fontSize: 17, fontWeight: 800, margin: 0 },
  rowHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  statusTag: { fontSize: 11.5, fontWeight: 700, borderRadius: 7, padding: "4px 10px", whiteSpace: "nowrap" },
  chipTag: { fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 9px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,18,23,.45)", zIndex: 40, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { width: "100%", maxWidth: 460, background: "#fff", borderRadius: "20px 20px 0 0", paddingBottom: "max(16px, env(safe-area-inset-bottom))", maxHeight: "90vh", overflowY: "auto" },
  sheetHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px", fontWeight: 800, fontSize: 16, position: "sticky", top: 0, background: "#fff" },
  sheetFoot: { padding: "10px 18px 6px", position: "sticky", bottom: 0, background: "#fff" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: C.sub, margin: "12px 0 5px" },
  input: { width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 12px", fontSize: 15, outline: "none", color: C.ink, background: "#fff" },
  toast: { position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "11px 18px", borderRadius: 12, fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, zIndex: 60, boxShadow: "0 6px 20px rgba(0,0,0,.25)", maxWidth: "90%" },
};
const css = `
* { -webkit-tap-highlight-color: transparent; }
.sheet { animation: slideUp .22s ease-out; }
@keyframes slideUp { from { transform: translateY(100%);} to { transform: translateY(0);} }
.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg);} }
button:active:not(:disabled) { transform: scale(.97); }
button:focus-visible, input:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 1px; }
@media (prefers-reduced-motion: reduce){ .sheet,.spin{animation:none} button:active{transform:none} }
input[type=date],input[type=datetime-local]{ -webkit-appearance:none; }
`;
