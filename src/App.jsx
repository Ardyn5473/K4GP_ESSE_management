import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Car, ClipboardCheck, History, Settings, Plus, Minus, X, AlertTriangle, Check,
  User, Shield, LogOut, Loader2, Camera, Trash2, ChevronLeft, ChevronRight, MapPin, Clock, MessageSquare, Wallet, Receipt,
  CalendarDays, Wrench, Gauge, Users,
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
const yen = (n) => "¥" + Number(n || 0).toLocaleString("ja-JP");

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
  const [bookings, setBookings] = useState([]);
  const [items, setItems] = useState([]);
  const [carRecs, setCarRecs] = useState([]);
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("res");
  const [sheet, setSheet] = useState(null);
  const [openEvent, setOpenEvent] = useState(null);
  const [openTemplates, setOpenTemplates] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [toast, setToast] = useState(null);
  const [bump, setBump] = useState(0);
  const flash = useCallback((m, kind = "ok") => { setToast({ m, kind }); setTimeout(() => setToast(null), 2400); }, []);

  const car = cars[0] || null;

  const reload = useCallback(async () => {
    try {
      const [pf, cs, bk, ps, rb, pfs, ci] = await Promise.all([api.myProfile(), api.cars(), api.bookings(), api.payments(), api.reimbursements(), api.profiles(), api.checklistItems()]);
      setMe(pf); setCars(cs); setBookings(bk); setPayments(ps); setReimbursements(rb); setProfiles(pfs); setItems(ci);
      if (cs[0]) { setEvents(await api.events(cs[0].id)); setCarRecs(await api.allCarRecords(cs[0].id)); }
    } catch (e) { flash(e.message, "err"); } finally { setLoading(false); }
  }, [flash]);
  useEffect(() => { reload(); const off = api.subscribe(() => { setBump((b) => b + 1); reload(); }); return off; }, [reload]);

  const isAdmin = me?.role === "admin";
  const nameOf = (id) => profiles.find((p) => p.id === id)?.name || (id === me?.id ? me?.name : "メンバー");

  async function doBooking({ start, end, mainId, lenderId, returnerId, kawazu, kind, destination, note }) {
    try { await api.createBooking(car.id, start, end, mainId, lenderId, returnerId, kawazu, kind, destination, note); setSheet(null); flash("予約しました（LINE通知）"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function doCancelBooking(id) {
    try { await api.cancelBooking(id); setSheet(null); flash("予約をキャンセルしました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function doConvertUse(id) {
    try { await api.setBookingUse(id); setSheet(null); flash("実利用に変更しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function addItem(it) {
    try { await api.addChecklistItem(it); setSheet(null); flash("項目を追加しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function delItem(id) {
    try { await api.deleteChecklistItem(id); flash("項目を削除しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function delEvent(id) {
    try { await api.deleteEvent(id); flash("点検記録を削除しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function doPayment({ paidOn, purpose, amount, note }) {
    try { await api.submitPayment(paidOn, purpose, Number(amount), note); setSheet(null); flash("振込を申請しました（LINE通知）"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function delPayment(id) {
    try { await api.deletePayment(id); flash("削除しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function doReimburse({ spentOn, purpose, amount, photoUrl, note }) {
    try { await api.submitReimbursement(spentOn, purpose, Number(amount), photoUrl, note); setSheet(null); flash("立替を申請しました（LINE通知）"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function delReimb(id) {
    try { await api.deleteReimbursement(id); flash("削除しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function doReimbursed(id, value) {
    try { await api.setReimbursed(id, value); flash(value ? "返金済みにしました" : "未返金に戻しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function doConfirmed(id, value) {
    try { await api.setPaymentConfirmed(id, value); flash(value ? "着金確認済みにしました" : "未確認に戻しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }

  if (loading) return <Splash />;
  if (openEvent) return <CheckScreen event={openEvent} items={items} me={me} bump={bump} onBack={() => { setOpenEvent(null); reload(); }} flash={flash} />;
  if (openTemplates) return <TemplateEditor items={items} onBack={() => { setOpenTemplates(false); reload(); }} onAdd={addItem} onDelete={delItem} />;

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
        {tab === "res" && <CalendarTab {...{ car, bookings, nameOf, me, isAdmin, setSheet, doCancelBooking }} />}
        {tab === "check" && <CheckHub {...{ events, items, carRecs, car, nameOf, me, isAdmin, setOpenEvent, setSheet, delEvent }} />}
        {tab === "pay" && <MoneyTab {...{ payments, reimbursements, profiles, nameOf, me, isAdmin, setSheet, delPayment, delReimb }} />}
        {tab === "hist" && <HistoryTab {...{ bookings, nameOf }} />}
        {tab === "admin" && isAdmin && <AdminTab {...{ car, setSheet, setOpenTemplates }} />}
        {tab === "admin" && !isAdmin && <Empty icon={<Shield size={30} />} title="管理者専用" body="この画面は管理者のみ利用できます。" />}
      </main>

      <nav style={sx.nav}>
        <NavBtn active={tab === "res"} onClick={() => setTab("res")} icon={<Car size={19} />} label="予約" />
        <NavBtn active={tab === "check"} onClick={() => setTab("check")} icon={<ClipboardCheck size={19} />} label="点検" />
        <NavBtn active={tab === "pay"} onClick={() => setTab("pay")} icon={<Wallet size={19} />} label="お金" />
        <NavBtn active={tab === "hist"} onClick={() => setTab("hist")} icon={<History size={19} />} label="履歴" />
        <NavBtn active={tab === "admin"} onClick={() => setTab("admin")} icon={<Settings size={19} />} label="管理" />
      </nav>

      {sheet?.type === "booking" && <BookingSheet car={car} profiles={profiles} me={me} bookings={bookings} preStart={sheet.start} onClose={() => setSheet(null)} onSubmit={doBooking} />}
      {sheet?.type === "bookingDetail" && <BookingDetailSheet booking={sheet.booking} nameOf={nameOf} me={me} isAdmin={isAdmin} onClose={() => setSheet(null)} onCancel={doCancelBooking} onConvert={doConvertUse} />}
      {sheet?.type === "payment" && <PaymentSheet onClose={() => setSheet(null)} onSubmit={doPayment} />}
      {sheet?.type === "reimburse" && <ReimburseSheet onClose={() => setSheet(null)} onSubmit={doReimburse} flash={flash} />}
      {sheet?.type === "reimburseDetail" && <ReimburseDetailSheet item={sheet.item} nameOf={nameOf} me={me} isAdmin={isAdmin} onClose={() => setSheet(null)} onToggle={doReimbursed} onDelete={(id) => { setSheet(null); delReimb(id); }} onZoom={setPhoto} />}
      {sheet?.type === "paymentDetail" && <PaymentDetailSheet item={sheet.item} nameOf={nameOf} me={me} isAdmin={isAdmin} onClose={() => setSheet(null)} onToggle={doConfirmed} onDelete={(id) => { setSheet(null); delPayment(id); }} />}
      {sheet?.type === "event" && <EventSheet car={car} onClose={() => setSheet(null)} onCreated={(ev) => { setSheet(null); setOpenEvent(ev); }} flash={flash} />}
      {sheet?.type === "car" && <CarSheet car={car} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); reload(); flash("車を保存しました"); }} flash={flash} />}
      {sheet?.type === "line" && <LineSheet onClose={() => setSheet(null)} flash={flash} />}
      {sheet?.type === "me" && <MeSheet me={me} onClose={() => setSheet(null)} onSignOut={() => api.signOut()} />}

      {toast && <div style={{ ...sx.toast, background: toast.kind === "err" ? C.accent : "#14181F" }}>
        {toast.kind === "err" ? <AlertTriangle size={15} /> : <Check size={15} />} {toast.m}</div>}
      {photo && <PhotoViewer url={photo} onClose={() => setPhoto(null)} />}
    </div>
  );
}

/* ===== 予約カレンダータブ ===== */
const USE_COLOR = "#D72638", TENT_COLOR = "#15803D";
const kindColor = (b) => (b.kind === "tentative" ? TENT_COLOR : USE_COLOR);
function CalendarTab({ car, bookings, nameOf, me, isAdmin, setSheet }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  if (!car) return <Empty icon={<Car size={30} />} title="車が未登録" body={isAdmin ? "管理タブから車を登録してください。" : "管理者に車の登録を依頼してください。"} />;
  const startWeekday = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const ymd = (day) => `${cursor.y}-${pad(cursor.m + 1)}-${pad(day)}`;
  const bookingsOn = (dayStr) => bookings.filter((b) => b.start_date <= dayStr && b.end_date >= dayStr);
  const prevMonth = () => setCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
  const nextMonth = () => setCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 });
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const upcoming = [...bookings].filter((b) => b.end_date >= todayStr).sort((a, b) => a.start_date.localeCompare(b.start_date) || (a.kind > b.kind ? 1 : -1));
  const wk = ["日", "月", "火", "水", "木", "金", "土"];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button onClick={prevMonth} style={sx.iconBtn}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{cursor.y}年 {cursor.m + 1}月</div>
        <button onClick={nextMonth} style={sx.iconBtn}><ChevronRight size={20} /></button>
      </div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 10, fontSize: 11.5, color: C.sub }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: USE_COLOR }} /> 実利用</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: TENT_COLOR }} /> 予約</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 3 }}>
        {wk.map((w, i) => <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? C.accent : i === 6 ? C.blue : C.sub, padding: "2px 0" }}>{w}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = ymd(d); const bs = bookingsOn(ds); const isToday = ds === todayStr;
          return (
            <div key={i} onClick={() => bs.length ? setSheet({ type: "bookingDetail", booking: bs[0] }) : setSheet({ type: "booking", start: ds })}
              style={{ minHeight: 54, borderRadius: 8, border: `1px solid ${isToday ? C.accent : C.line}`, background: "#fff", padding: 3, cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, opacity: 0.8, paddingLeft: 2 }}>{d}</div>
              {bs.slice(0, 2).map((b) => (
                <div key={b.id} onClick={(e) => { e.stopPropagation(); setSheet({ type: "bookingDetail", booking: b }); }}
                  style={{ background: kindColor(b), color: "#fff", borderRadius: 4, fontSize: 9, fontWeight: 700, lineHeight: 1.25, padding: "1px 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {nameOf(b.main_user_id || b.created_by)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <button style={{ ...sx.primary, width: "100%", marginTop: 14, padding: 13, justifyContent: "center", display: "flex", alignItems: "center", gap: 7, fontSize: 15 }} onClick={() => setSheet({ type: "booking" })}>
        <Plus size={17} /> 予約する</button>
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: C.sub, margin: "0 2px 8px" }}>今後の予約</div>
        {upcoming.length === 0 && <div style={{ fontSize: 12.5, color: C.sub, textAlign: "center", padding: "16px 0" }}>予約はありません</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {upcoming.map((b) => (
            <div key={b.id} style={sx.card} onClick={() => setSheet({ type: "bookingDetail", booking: b })}>
              <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: kindColor(b) }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14.5 }}>{nameOf(b.main_user_id || b.created_by)}</span>
                  <span style={{ ...sx.chipTag, fontSize: 10, background: b.kind === "tentative" ? C.okBg : C.ngBg, color: b.kind === "tentative" ? C.ok : C.ng }}>{b.kind === "tentative" ? "予約" : "実利用"}</span>
                </div>
                <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{fmtDate(b.start_date)}〜{fmtDate(b.end_date)}{b.destination ? `・${b.destination}` : ""}</div>
              </div>
              <ChevronRight size={18} color={C.sub} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.sub, textAlign: "center", marginTop: 14, lineHeight: 1.7 }}>
        日付をタップで予約。実利用（赤）と予約（緑）は同じ日に重ねられます。
      </div>
    </div>
  );
}
function BookingSheet({ car, profiles, me, preStart, onClose, onSubmit }) {
  const t = new Date().toISOString().slice(0, 10);
  const [kind, setKind] = useState("use");
  const [start, setStart] = useState(preStart || t);
  const [end, setEnd] = useState(preStart || t);
  const [mainId, setMainId] = useState(me?.id || "");
  const [lenderId, setLenderId] = useState("");
  const [returnerId, setReturnerId] = useState("");
  const [kawazu, setKawazu] = useState(false);
  const [destination, setDestination] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const valid = start && end && end >= start;
  return (<Sheet title="予約する" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 14, fontSize: 15, background: kind === "tentative" ? TENT_COLOR : C.accent, ...(valid ? {} : sx.disabled) }} disabled={busy || !valid}
      onClick={async () => { setBusy(true); await onSubmit({ start, end, mainId, lenderId, returnerId, kawazu, kind, destination, note }); setBusy(false); }}>{busy ? <Loader2 className="spin" size={16} /> : <CalendarDays size={17} />} {kind === "tentative" ? "予約" : "実利用"}でLINE通知</button>}>
    <label style={sx.label}>種別</label>
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => setKind("use")} style={{ ...sx.segBtn, flex: 1, ...(kind === "use" ? { background: USE_COLOR, color: "#fff", borderColor: USE_COLOR } : {}) }}>実利用（使う）</button>
      <button onClick={() => setKind("tentative")} style={{ ...sx.segBtn, flex: 1, ...(kind === "tentative" ? { background: TENT_COLOR, color: "#fff", borderColor: TENT_COLOR } : {}) }}>予約（押さえ）</button>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ flex: 1 }}><label style={sx.label}>開始日（借りる）</label><input type="date" value={start} onChange={(e) => { setStart(e.target.value); if (end < e.target.value) setEnd(e.target.value); }} style={sx.input} /></div>
      <div style={{ flex: 1 }}><label style={sx.label}>終了日（返す）</label><input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} style={sx.input} /></div>
    </div>
    <label style={sx.label}>メイン利用者</label>
    <select value={mainId} onChange={(e) => setMainId(e.target.value)} style={sx.input}>
      {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ flex: 1 }}><label style={sx.label}>貸出担当</label>
        <select value={lenderId} onChange={(e) => setLenderId(e.target.value)} style={sx.input}>
          <option value="">未定</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></div>
      <div style={{ flex: 1 }}><label style={sx.label}>返却担当</label>
        <select value={returnerId} onChange={(e) => setReturnerId(e.target.value)} style={sx.input}>
          <option value="">未定</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></div>
    </div>
    <label style={sx.label}>ガレージ</label>
    <button onClick={() => setKawazu((v) => !v)} style={{ ...sx.outline, width: "100%", justifyContent: "flex-start", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderColor: kawazu ? C.ok : C.line }}>
      <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${kawazu ? C.ok : C.line}`, background: kawazu ? C.ok : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{kawazu && <Check size={15} color="#fff" />}</span>
      河津さんと調整済み
    </button>
    <label style={sx.label}>行先（任意）</label>
    <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="例：鈴鹿サーキット" style={sx.input} />
    <label style={sx.label}>備考（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} style={sx.input} />
  </Sheet>);
}
function BookingDetailSheet({ booking, nameOf, me, isAdmin, onClose, onCancel, onConvert }) {
  const mine = booking.created_by === me?.id || booking.main_user_id === me?.id || isAdmin;
  const isTent = booking.kind === "tentative";
  return (<Sheet title="予約の詳細" onClose={onClose}
    foot={<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {mine && isTent && <button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 14, fontSize: 15 }}
        onClick={() => onConvert(booking.id)}><Check size={17} /> 実利用に変更</button>}
      {mine && <button style={{ ...sx.outline, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 13, color: C.accent, borderColor: C.accent }}
        onClick={() => { if (confirm("この予約をキャンセルしますか？")) onCancel(booking.id); }}><Trash2 size={16} /> 予約をキャンセル</button>}
    </div>}>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "6px 0" }}>
      <Row icon={<CalendarDays size={15} />} label="種別" value={isTent ? "予約（押さえ）" : "実利用"} />
      <Row icon={<CalendarDays size={15} />} label="期間" value={`${fmtDate(booking.start_date)}〜${fmtDate(booking.end_date)}`} />
      <Row icon={<User size={15} />} label="メイン" value={nameOf(booking.main_user_id || booking.created_by)} />
      <Row icon={<Users size={15} />} label="貸出担当" value={booking.lender_id ? nameOf(booking.lender_id) : "未定"} />
      <Row icon={<Users size={15} />} label="返却担当" value={booking.returner_id ? nameOf(booking.returner_id) : "未定"} />
      <Row icon={<Check size={15} />} label="河津さん" value={booking.kawazu_ok ? "調整済み" : "未調整"} danger={!booking.kawazu_ok} />
      <Row icon={<MapPin size={15} />} label="行先" value={booking.destination || "未記入"} />
      {booking.note && <Row icon={<MessageSquare size={15} />} label="備考" value={booking.note} />}
    </div>
  </Sheet>);
}
function Row({ icon, label, value, danger }) {
  return (<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ color: C.sub, display: "flex" }}>{icon}</span>
    <span style={{ fontSize: 12.5, color: C.sub, width: 64 }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 700, color: danger ? C.accent : C.ink }}>{value}</span></div>);
}

/* ===== お金タブ（振込ログ / 立替申請） ===== */
function MoneyTab({ payments, reimbursements, profiles, nameOf, me, isAdmin, setSheet, delPayment, delReimb }) {
  const [sub, setSub] = useState("pay");
  const [who, setWho] = useState("");            // 立替の名前フィルタ（""=全て）
  const [status, setStatus] = useState("all");   // all / unsettled / settled
  const isPay = sub === "pay";

  // 立替：絞り込み
  const reimbUsers = [...new Set(reimbursements.map((r) => r.user_id))];
  const reimbFiltered = reimbursements.filter((r) =>
    (!who || r.user_id === who) &&
    (status === "all" || (status === "unsettled" ? !r.reimbursed : r.reimbursed)));
  const list = isPay ? payments : reimbFiltered;
  const total = list.reduce((s, x) => s + (x.amount || 0), 0);
  const del = isPay ? delPayment : delReimb;

  return (
    <div>
      <div style={sx.rowHead}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setSub("pay")} style={{ ...sx.segBtn, ...(isPay ? sx.segOn : {}) }}>振込</button>
          <button onClick={() => setSub("reimb")} style={{ ...sx.segBtn, ...(!isPay ? sx.segOn : {}) }}>立替</button>
        </div>
        <button style={{ ...sx.primary, padding: "8px 13px", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }} onClick={() => setSheet({ type: isPay ? "payment" : "reimburse" })}><Plus size={15} /> 申請</button>
      </div>
      <div style={{ ...sx.card, justifyContent: "space-between", background: C.chrome, border: "none", marginBottom: 12 }}>
        <span style={{ color: "#B7C0CC", fontSize: 13, fontWeight: 600 }}>{isPay ? "振込 累計" : "立替 合計"}</span>
        <span style={{ color: "#fff", fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{yen(total)}</span>
      </div>
      {!isPay && (
        <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, minWidth: 34 }}>名前</span>
            <select value={who} onChange={(e) => setWho(e.target.value)} style={{ ...sx.input, flex: 1 }}>
              <option value="">全て</option>
              {(reimbUsers.length ? reimbUsers.map((id) => ({ id, name: nameOf(id) })) : profiles).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, minWidth: 34 }}>状態</span>
            <div style={{ display: "flex", gap: 6, flex: 1 }}>
              {[{ v: "all", l: "全て" }, { v: "unsettled", l: "未処理" }, { v: "settled", l: "返金済" }].map((o) =>
                <button key={o.v} onClick={() => setStatus(o.v)} style={{ ...sx.segBtn, flex: 1, padding: "8px 0", ...(status === o.v ? sx.segOn : {}) }}>{o.l}</button>)}
            </div>
          </div>
        </div>
      )}
      {list.length === 0 && <Empty icon={isPay ? <Wallet size={30} /> : <Receipt size={30} />} title={isPay ? "記録なし" : "該当なし"}
        body={isPay ? "「申請」から、いつ・何の用途で・いくら振り込んだかを記録できます。押すとLINEに通知されます。"
                    : "条件に一致する立替がありません。絞り込みを変えるか「申請」から記録できます。"} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((p) => {
          const date = isPay ? p.paid_on : p.spent_on;
          if (!isPay) {
            return (<div key={p.id} style={{ ...sx.card, padding: "12px 14px", cursor: "pointer" }} onClick={() => setSheet({ type: "reimburseDetail", item: p })}>
              {p.photo_url
                ? <img src={p.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.line}` }} />
                : <div style={{ width: 40, height: 40, borderRadius: 8, background: "#F1F3F6", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Receipt size={16} color="#B8BFC9" /></div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.purpose || "用途未記入"}</div>
                <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{nameOf(p.user_id)}・{fmtDate(date)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 15.5, fontVariantNumeric: "tabular-nums" }}>{yen(p.amount)}</div>
                <span style={{ ...sx.statusTag, fontSize: 10.5, padding: "2px 8px", background: p.reimbursed ? C.okBg : C.warnBg, color: p.reimbursed ? C.ok : C.warn }}>{p.reimbursed ? "返金済" : "未返金"}</span>
              </div>
              <ChevronRight size={18} color={C.sub} />
            </div>);
          }
          return (<div key={p.id} style={{ ...sx.card, padding: "12px 14px", cursor: "pointer" }} onClick={() => setSheet({ type: "paymentDetail", item: p })}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.purpose || "用途未記入"}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{nameOf(p.user_id)}・{fmtDate(date)}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 15.5, fontVariantNumeric: "tabular-nums" }}>{yen(p.amount)}</div>
              <span style={{ ...sx.statusTag, fontSize: 10.5, padding: "2px 8px", background: p.confirmed ? C.okBg : C.warnBg, color: p.confirmed ? C.ok : C.warn }}>{p.confirmed ? "着金済" : "未確認"}</span>
            </div>
            <ChevronRight size={18} color={C.sub} />
          </div>);
        })}
      </div>
    </div>
  );
}

/* ===== 点検ハブ（点検記録 / 交換サイクル） ===== */
const MAINT_KINDS = [
  { v: "oil", l: "オイル交換", icon: "🛢️" },
  { v: "brake_pad", l: "ブレーキパッド", icon: "🔴" },
  { v: "tire", l: "タイヤ交換/ローテ", icon: "🔵" },
];
// 点検項目をテンプレート・セクションごとにまとめる
function groupItems(items, template) {
  const list = items.filter((it) => it.template === template).sort((a, b) => a.sort - b.sort);
  const secs = [];
  for (const it of list) {
    let s = secs.find((x) => x.section === it.section);
    if (!s) { s = { section: it.section || "その他", items: [] }; secs.push(s); }
    s.items.push(it);
  }
  return secs;
}
function CheckHub({ events, items, carRecs, car, nameOf, me, isAdmin, setOpenEvent, setSheet, delEvent }) {
  const [sub, setSub] = useState("check");
  const isCheck = sub === "check";
  return (
    <div>
      <div style={sx.rowHead}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setSub("check")} style={{ ...sx.segBtn, ...(isCheck ? sx.segOn : {}) }}>点検記録</button>
          <button onClick={() => setSub("maint")} style={{ ...sx.segBtn, ...(!isCheck ? sx.segOn : {}) }}>交換サイクル</button>
        </div>
        {isCheck && <button style={{ ...sx.primary, padding: "8px 13px", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }} onClick={() => setSheet({ type: "event" })}><Plus size={15} /> 記録</button>}
      </div>
      {isCheck ? <CheckTab {...{ events, setOpenEvent, me, isAdmin, delEvent }} /> : <MaintenanceSummary {...{ items, carRecs, car }} />}
    </div>
  );
}
function CheckTab({ events, setOpenEvent, me, isAdmin, delEvent }) {
  const tplLabel = (t) => t === "race" ? "レース項目" : t === "practice" ? "サーキット練習" : t === "handover" ? "貸出返却項目" : "日常項目";
  const isRed = (o) => o === "レース" || o === "返却";
  return (
    <div>
      {events.length === 0 && <Empty icon={<ClipboardCheck size={30} />} title="記録なし" body="右上の『記録』から、走行会・レース・貸出・返却などの点検を残せます。" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((ev) => {
          const canDel = ev.created_by === me?.id || isAdmin;
          return (
          <div key={ev.id} style={sx.card}>
            <div style={{ flex: 1, minWidth: 0 }} onClick={() => setOpenEvent(ev)}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ ...sx.chipTag, background: isRed(ev.occasion) ? C.ngBg : C.blueBg, color: isRed(ev.occasion) ? C.ng : C.blue }}>{ev.occasion}{ev.phase}</span>
                <span style={{ fontSize: 11.5, color: C.sub }}>{tplLabel(ev.template)}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 5 }}>{fmtDate(ev.event_date)} の点検</div>
              {ev.note && <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{ev.note}</div>}
            </div>
            {canDel && <Trash2 size={17} color={C.sub} style={{ cursor: "pointer" }} onClick={() => { if (confirm("この点検記録を削除しますか？")) delEvent(ev.id); }} />}
            <ChevronRight size={20} color={C.sub} onClick={() => setOpenEvent(ev)} style={{ cursor: "pointer" }} />
          </div>
          );
        })}
      </div>
    </div>
  );
}
// 交換サイクルのサマリ（点検記録から「前回いつ・何km」を集計）
function MaintenanceSummary({ items, carRecs, car }) {
  const byId = {}; items.forEach((it) => (byId[it.id] = it));
  const odoByEvent = {}, circuitByEvent = {}, dateByEvent = {};
  carRecs.forEach((r) => {
    const it = byId[r.item_id]; if (!it || r.num == null) return;
    dateByEvent[r.event_id] = r.check_events?.event_date;
    if (it.maint_kind === "odometer") odoByEvent[r.event_id] = Number(r.num);
    if (it.maint_kind === "circuit") circuitByEvent[r.event_id] = Number(r.num);
  });
  // 走行距離を持つイベントを日付順に
  const evs = [...new Set([...Object.keys(odoByEvent), ...Object.keys(circuitByEvent)])]
    .map((id) => ({ id, date: dateByEvent[id], total: odoByEvent[id] ?? null, circuit: circuitByEvent[id] ?? null }))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const latest = evs[evs.length - 1] || null;
  const currentTotal = latest?.total ?? car?.odometer ?? null;
  const currentCircuit = latest?.circuit ?? null;
  const street = (currentTotal != null && currentCircuit != null) ? currentTotal - currentCircuit : currentTotal;
  const summary = MAINT_KINDS.map((k) => {
    let best = null;
    carRecs.forEach((r) => {
      const it = byId[r.item_id];
      if (it && it.maint_kind === k.v && r.status === "done") {
        const d = r.check_events?.event_date;
        if (!best || d > best.date) best = { date: d, ev: r.event_id };
      }
    });
    const lastKm = best ? odoByEvent[best.ev] : null;
    const since = (currentTotal != null && lastKm != null) ? currentTotal - lastKm : null;
    return { ...k, last: best?.date || null, lastKm, since };
  });
  // 直近2点検の増加量
  const recentDeltas = [];
  for (let i = evs.length - 1; i >= 1 && recentDeltas.length < 3; i--) {
    const cur = evs[i], prev = evs[i - 1];
    const dTotal = (cur.total != null && prev.total != null) ? cur.total - prev.total : null;
    const dCircuit = (cur.circuit != null && prev.circuit != null) ? cur.circuit - prev.circuit : null;
    const dStreet = (dTotal != null && dCircuit != null) ? dTotal - dCircuit : dTotal;
    recentDeltas.push({ from: prev.date, to: cur.date, dStreet, dCircuit });
  }
  const Stat = ({ label, value, color }) => (
    <div style={{ flex: 1, textAlign: "center", padding: "10px 4px" }}>
      <div style={{ fontSize: 10.5, color: C.sub }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color: color || C.ink, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
  const km = (v) => v != null ? `${v.toLocaleString()}km` : "—";
  return (
    <div>
      <div style={{ ...sx.card, padding: 0, marginBottom: 12 }}>
        <Stat label="総距離" value={km(currentTotal)} />
        <div style={{ width: 1, background: C.line, alignSelf: "stretch", margin: "8px 0" }} />
        <Stat label="サーキット" value={km(currentCircuit)} color={TENT_COLOR} />
        <div style={{ width: 1, background: C.line, alignSelf: "stretch", margin: "8px 0" }} />
        <Stat label="一般道" value={km(street)} color={C.blue} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {summary.map((k) => (
          <div key={k.v} style={{ ...sx.card, padding: "12px 14px" }}>
            <span style={{ fontSize: 20 }}>{k.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{k.l}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{k.last ? `前回 ${fmtDate(k.last)}${k.lastKm != null ? `・${k.lastKm.toLocaleString()}km` : ""}` : "記録なし"}</div>
            </div>
            {k.since != null && <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10.5, color: C.sub }}>経過</div>
              <div style={{ fontWeight: 800, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{k.since.toLocaleString()}km</div>
            </div>}
          </div>
        ))}
      </div>
      {recentDeltas.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.sub, margin: "0 2px 8px" }}>点検間の走行（新しい順）</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentDeltas.map((d, i) => (
              <div key={i} style={{ ...sx.card, padding: "10px 14px" }}>
                <div style={{ flex: 1, fontSize: 12, color: C.sub }}>{fmtDate(d.from)} → {fmtDate(d.to)}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.blue }}>一般道 +{d.dStreet != null ? d.dStreet.toLocaleString() : "—"}km</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: TENT_COLOR, marginLeft: 10 }}>ｻｰｷｯﾄ +{d.dCircuit != null ? d.dCircuit.toLocaleString() : "—"}km</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ fontSize: 11, color: C.sub, textAlign: "center", marginTop: 14, lineHeight: 1.7 }}>
        点検で「走行距離（総）」と「サーキット走行距離」を入れると、一般道＝総−サーキットで自動計算されます。
      </div>
    </div>
  );
}
// 点検項目の編集（管理者）
function TemplateEditor({ items, onBack, onAdd, onDelete }) {
  const [tpl, setTpl] = useState("race");
  const [adding, setAdding] = useState(false);
  const TPL = [{ v: "daily", l: "日常" }, { v: "practice", l: "サーキット練習" }, { v: "race", l: "レース" }];
  const secs = groupItems(items, tpl);
  return (
    <div style={sx.app}>
      <style>{css}</style>
      <header style={{ ...sx.top, gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", display: "flex", alignItems: "center", cursor: "pointer", padding: 0 }}><ChevronLeft size={24} /></button>
        <div style={{ fontWeight: 800, fontSize: 15 }}>点検項目の編集</div>
      </header>
      <main style={sx.main}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {TPL.map((t) => <button key={t.v} onClick={() => setTpl(t.v)} style={{ ...sx.segBtn, ...(tpl === t.v ? sx.segOn : {}) }}>{t.l}</button>)}
        </div>
        <button style={{ ...sx.primary, width: "100%", padding: 12, justifyContent: "center", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={() => setAdding(true)}><Plus size={16} /> 項目を追加</button>
        {secs.length === 0 && <div style={{ fontSize: 12.5, color: C.sub, textAlign: "center", padding: "12px 0" }}>このテンプレートには項目がありません</div>}
        {secs.map((sec) => (
          <div key={sec.section} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.sub, margin: "4px 2px 8px" }}>{sec.section}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sec.items.map((it) => (
                <div key={it.id} style={{ ...sx.card, padding: "10px 14px" }}>
                  <span style={{ fontSize: 18 }}>{it.icon || "•"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{it.label}</div>
                    <div style={{ fontSize: 11, color: C.sub }}>{it.input_type === "number" ? `数値(${it.unit})` : it.input_type === "replace" ? "交換チェック" : "OK/NG"}{it.hint ? `・${it.hint}` : ""}</div>
                  </div>
                  <Trash2 size={16} color={C.sub} style={{ cursor: "pointer" }} onClick={() => { if (confirm(`「${it.label}」を削除しますか？`)) onDelete(it.id); }} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ height: 20 }} />
      </main>
      {adding && <AddItemSheet template={tpl} onClose={() => setAdding(false)} onSubmit={async (it) => { await onAdd(it); setAdding(false); }} />}
    </div>
  );
}
function AddItemSheet({ template, onClose, onSubmit }) {
  const [label, setLabel] = useState(""); const [section, setSection] = useState(""); const [hint, setHint] = useState("");
  const [inputType, setInputType] = useState("okng"); const [unit, setUnit] = useState(""); const [busy, setBusy] = useState(false);
  const valid = label.trim();
  return (<Sheet title="項目を追加" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", padding: 14, fontSize: 15, ...(valid ? {} : sx.disabled) }} disabled={busy || !valid}
      onClick={async () => { setBusy(true); await onSubmit({ template, section: section || "その他", label, hint, icon: "", input_type: inputType, unit: inputType === "number" ? unit : "", maint_kind: null, sort: 500 }); setBusy(false); }}>追加</button>}>
    <label style={sx.label}>項目名</label>
    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例：燃圧チェック" style={sx.input} />
    <label style={sx.label}>セクション（任意）</label>
    <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="例：エンジン" style={sx.input} />
    <label style={sx.label}>入力タイプ</label>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {[{ v: "okng", l: "OK/NG" }, { v: "number", l: "数値" }, { v: "replace", l: "交換チェック" }].map((o) =>
        <button key={o.v} onClick={() => setInputType(o.v)} style={{ ...sx.segBtn, ...(inputType === o.v ? sx.segOn : {}) }}>{o.l}</button>)}
    </div>
    {inputType === "number" && <><label style={sx.label}>単位</label><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="例：mm / km / kPa" style={sx.input} /></>}
    <label style={sx.label}>ヒント（任意）</label>
    <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="補足説明" style={sx.input} />
  </Sheet>);
}

/* ===== 点検チェック画面 ===== */
function CheckScreen({ event, items, me, bump, onBack, flash }) {
  const sections = groupItems(items, event.template);
  const all = sections.flatMap((s) => s.items);
  const [recs, setRecs] = useState({});
  const [photos, setPhotos] = useState({});
  const [zoom, setZoom] = useState(null);
  const load = useCallback(async () => {
    const [rows, phs] = await Promise.all([api.records(event.id), api.eventPhotos(event.id)]);
    const map = {}; rows.forEach((r) => (map[r.item_id] = r)); setRecs(map);
    const pm = {}; phs.forEach((p) => { (pm[p.item_id] = pm[p.item_id] || []).push(p); }); setPhotos(pm);
  }, [event.id]);
  useEffect(() => { load(); }, [load, bump]);
  const answered = (it) => { const r = recs[it.id]; if (!r) return false; if (it.input_type === "number") return r.num != null; return ["ok", "ng", "done"].includes(r.status); };
  const done = all.filter(answered).length;
  const ngCount = all.filter((i) => recs[i.id]?.status === "ng").length;
  const pct = all.length ? Math.round(done / all.length * 100) : 0;
  async function patch(itemId, p) {
    setRecs((s) => ({ ...s, [itemId]: { ...(s[itemId] || { item_id: itemId, status: "pending" }), ...p } }));
    try { await api.upsertRecord(event.id, itemId, p); } catch (e) { flash(e.message, "err"); load(); }
  }
  async function addPhoto(itemId, url) { try { await api.addPhoto(event.id, itemId, url); load(); } catch (e) { flash(e.message, "err"); } }
  async function delPhoto(id) { try { await api.deletePhoto(id); load(); } catch (e) { flash(e.message, "err"); } }
  const [note, setNote] = useState(event.note || "");
  const saveNote = async () => { try { await api.updateEventNote(event.id, note); } catch (e) { flash(e.message, "err"); } };
  return (
    <div style={sx.app}>
      <style>{css}</style>
      <header style={{ ...sx.top, gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", display: "flex", alignItems: "center", cursor: "pointer", padding: 0 }}><ChevronLeft size={24} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{event.occasion}{event.phase}・{fmtDate(event.event_date)}</div>
          <div style={{ fontSize: 10.5, color: "#9AA3B0" }}>{done}/{all.length} 入力{ngCount > 0 ? `・要注意 ${ngCount}` : ""}</div>
        </div>
      </header>
      <div style={{ height: 5, background: "#E4E7EB" }}><div style={{ height: "100%", width: `${pct}%`, background: ngCount > 0 ? C.accent : C.ok, transition: "width .4s" }} /></div>
      <main style={sx.main}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.sub, margin: "4px 2px 8px" }}>備考（この点検のメモ）</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={saveNote} rows={2}
            placeholder="例：ML鈴鹿走行後、タイヤ前後ローテーション" style={{ ...sx.input, resize: "vertical", fontFamily: "inherit" }} />
        </div>
        {all.length === 0 && <Empty icon={<ClipboardCheck size={30} />} title="項目がありません" body="管理タブの「点検項目の編集」から、このテンプレートに項目を追加してください。" />}
        {sections.map((sec) => (
          <div key={sec.section} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.sub, margin: "4px 2px 8px" }}>{sec.section}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sec.items.map((it) => <ItemRow key={it.id} item={it} rec={recs[it.id]} photos={photos[it.id] || []} onPatch={(p) => patch(it.id, p)} onAddPhoto={(url) => addPhoto(it.id, url)} onDelPhoto={delPhoto} onZoom={setZoom} flash={flash} />)}
            </div>
          </div>
        ))}
        <div style={{ height: 20 }} />
      </main>
      {zoom && <PhotoViewer url={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}
function ItemRow({ item, rec, photos = [], onPatch, onAddPhoto, onDelPhoto, onZoom, flash }) {
  const status = rec?.status || "pending";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  // 旧データの単一写真も1枚目として扱う
  const legacy = rec?.photo_url ? [{ id: "legacy", url: rec.photo_url, legacy: true }] : [];
  const allPhotos = [...legacy, ...photos];
  async function onPhoto(e) {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setBusy(true);
    try { for (const f of files) { const small = await compressImage(f); const url = await api.uploadPhoto(small); await onAddPhoto(url); } }
    catch (err) { flash(err.message, "err"); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  const type = item.input_type || "okng";
  const ng = status === "ng", ok = status === "ok", doneR = status === "done";
  const hasNum = rec?.num != null;
  const bar = ng ? C.accent : (ok || doneR || (type === "number" && hasNum)) ? C.ok : C.line;
  return (
    <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 0, padding: 0, borderLeft: `4px solid ${bar}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <span style={{ fontSize: 20 }}>{item.icon || "•"}</span>
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setOpen((o) => !o)}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{item.label}</div>
          {item.hint && <div style={{ fontSize: 11.5, color: C.sub }}>{item.hint}</div>}
        </div>
        {type === "okng" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onPatch({ status: ok ? "pending" : "ok" })} style={{ ...sx.miniBtn, ...(ok ? { background: C.ok, color: "#fff", borderColor: C.ok } : {}) }}>OK</button>
            <button onClick={() => onPatch({ status: ng ? "pending" : "ng" })} style={{ ...sx.miniBtn, ...(ng ? { background: C.accent, color: "#fff", borderColor: C.accent } : {}) }}>NG</button>
          </div>
        )}
        {type === "number" && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <input type="number" inputMode="decimal" value={rec?.num ?? ""} onChange={(e) => onPatch({ num: e.target.value === "" ? null : Number(e.target.value) })}
              placeholder="—" style={{ width: 74, textAlign: "right", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 9px", fontSize: 15, fontWeight: 700, outline: "none", color: C.ink }} />
            {item.unit && <span style={{ fontSize: 12, color: C.sub, minWidth: 20 }}>{item.unit}</span>}
          </div>
        )}
        {type === "replace" && (
          <button onClick={() => onPatch({ status: doneR ? "pending" : "done" })} style={{ ...sx.miniBtn, minWidth: 72, ...(doneR ? { background: C.ok, color: "#fff", borderColor: C.ok } : {}) }}>{doneR ? "交換済" : "交換した"}</button>
        )}
      </div>
      {(open || rec?.note || allPhotos.length || ng) && (
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {allPhotos.map((ph) => (
              <div key={ph.id} style={{ position: "relative" }}>
                <img src={ph.url} alt="" onClick={() => onZoom(ph.url)} style={{ width: 54, height: 54, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.line}`, cursor: "zoom-in" }} />
                <span onClick={() => ph.legacy ? onPatch({ photo_url: null }) : onDelPhoto(ph.id)}
                  style={{ position: "absolute", top: -6, right: -6, background: C.accent, borderRadius: 999, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={11} color="#fff" /></span>
              </div>
            ))}
            <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ width: 54, height: 54, borderRadius: 8, background: "#F1F3F6", border: `1px dashed ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {busy ? <Loader2 className="spin" size={16} color={C.sub} /> : <Camera size={18} color="#8A93A0" />}</button>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPhoto} style={{ display: "none" }} />
          </div>
          <input value={rec?.note || ""} onChange={(e) => onPatch({ note: e.target.value })} placeholder="メモ（銘柄・気づき・数値など）" style={{ ...sx.input, fontSize: 13, padding: "9px 11px" }} />
        </div>
      )}
    </div>
  );
}

/* ===== 履歴タブ ===== */
function HistoryTab({ bookings, nameOf }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const sorted = [...bookings].sort((a, b) => b.start_date.localeCompare(a.start_date));
  return (
    <div>
      <div style={sx.rowHead}><h2 style={sx.h2}>利用履歴</h2></div>
      {sorted.length === 0 && <Empty icon={<History size={30} />} title="履歴なし" body="予約の記録がここに表示されます。" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((b) => {
          const past = b.end_date < todayStr;
          const now = b.start_date <= todayStr && b.end_date >= todayStr;
          const label = now ? "利用中" : past ? "終了" : "予約中";
          const [bg, col] = now ? [C.warnBg, C.warn] : past ? [C.okBg, C.ok] : [C.blueBg, C.blue];
          return (<div key={b.id} style={{ ...sx.card, padding: "12px 14px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{nameOf(b.main_user_id || b.created_by)}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{fmtDate(b.start_date)}〜{fmtDate(b.end_date)}{b.destination ? `・${b.destination}` : ""}{b.handler_id ? `・担当 ${nameOf(b.handler_id)}` : ""}</div>
            </div>
            <span style={{ ...sx.statusTag, background: bg, color: col }}>{label}</span>
          </div>);
        })}
      </div>
    </div>
  );
}

/* ===== 管理タブ ===== */
function AdminTab({ car, setSheet, setOpenTemplates }) {
  return (
    <div>
      <div style={sx.rowHead}><h2 style={sx.h2}>管理</h2></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={sx.card} onClick={() => setSheet({ type: "car" })}>
          <Car size={22} color={C.accent} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>車の情報</div>
            <div style={{ fontSize: 11.5, color: C.sub }}>{car ? car.name : "未登録（タップで登録）"}・写真/名称/走行距離</div></div>
          <ChevronRight size={20} color={C.sub} />
        </div>
        <div style={sx.card} onClick={() => setOpenTemplates(true)}>
          <ClipboardCheck size={22} color={C.blue} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>点検項目の編集</div>
            <div style={{ fontSize: 11.5, color: C.sub }}>テンプレートの項目を追加・削除</div></div>
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
function PaymentSheet({ onClose, onSubmit }) {
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState(""); const [amount, setAmount] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const valid = purpose.trim() && Number(amount) > 0;
  return (<Sheet title="振込を申請" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 14, fontSize: 15, ...(valid ? {} : sx.disabled) }} disabled={busy || !valid}
      onClick={async () => { setBusy(true); await onSubmit({ paidOn, purpose, amount, note }); setBusy(false); }}>{busy ? <Loader2 className="spin" size={16} /> : <Wallet size={17} />} 申請してLINE通知</button>}>
    <label style={sx.label}>振込日（いつ）</label>
    <input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} style={sx.input} />
    <label style={sx.label}>用途（何のため）</label>
    <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="例：K4GPエントリー費" style={sx.input} />
    <label style={sx.label}>金額（円）</label>
    <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例：12500" style={sx.input} />
    <label style={sx.label}>備考（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="振込先・分担など" style={sx.input} />
  </Sheet>);
}
function ReimburseSheet({ onClose, onSubmit, flash }) {
  const [spentOn, setSpentOn] = useState(new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState(""); const [amount, setAmount] = useState(""); const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null); const [photoBusy, setPhotoBusy] = useState(false); const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const valid = purpose.trim() && Number(amount) > 0;
  async function onPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return; setPhotoBusy(true);
    try { const small = await compressImage(file); const url = await api.uploadPhoto(small); setPhotoUrl(url); }
    catch (err) { flash(err.message, "err"); } finally { setPhotoBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  return (<Sheet title="立替を申請" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 14, fontSize: 15, ...(valid ? {} : sx.disabled) }} disabled={busy || !valid}
      onClick={async () => { setBusy(true); await onSubmit({ spentOn, purpose, amount, photoUrl, note }); setBusy(false); }}>{busy ? <Loader2 className="spin" size={16} /> : <Receipt size={17} />} 申請してLINE通知</button>}>
    <label style={sx.label}>立替日（いつ）</label>
    <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} style={sx.input} />
    <label style={sx.label}>用途（何のため）</label>
    <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="例：ブレーキパッド代" style={sx.input} />
    <label style={sx.label}>金額（円）</label>
    <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例：8800" style={sx.input} />
    <label style={sx.label}>領収書の写真（任意）</label>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {photoUrl ? <img src={photoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.line}` }} />
        : <div style={{ width: 64, height: 64, borderRadius: 10, background: "#F1F3F6", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Receipt size={22} color="#B8BFC9" /></div>}
      <button onClick={() => fileRef.current?.click()} disabled={photoBusy} style={{ ...sx.outline, flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: 7 }}>
        {photoBusy ? <Loader2 className="spin" size={15} /> : <Camera size={15} />}{photoBusy ? "アップロード中…" : "領収書を撮る / 選ぶ"}</button>
      {photoUrl && <Trash2 size={18} color={C.sub} style={{ cursor: "pointer" }} onClick={() => setPhotoUrl(null)} />}
      <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
    </div>
    <label style={sx.label}>備考（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="精算方法など" style={sx.input} />
  </Sheet>);
}
function ReimburseDetailSheet({ item, nameOf, me, isAdmin, onClose, onToggle, onDelete, onZoom }) {
  const canDel = item.user_id === me?.id || isAdmin;
  return (<Sheet title="立替の詳細" onClose={onClose}
    foot={canDel ? <button style={{ ...sx.outline, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 13, color: C.accent, borderColor: C.accent }}
      onClick={() => { if (confirm("この立替記録を削除しますか？")) onDelete(item.id); }}><Trash2 size={16} /> 削除</button> : null}>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "6px 0 4px" }}>
      <Row icon={<Receipt size={15} />} label="用途" value={item.purpose || "未記入"} />
      <Row icon={<User size={15} />} label="申請者" value={nameOf(item.user_id)} />
      <Row icon={<CalendarDays size={15} />} label="立替日" value={fmtDate(item.spent_on)} />
      <Row icon={<Wallet size={15} />} label="金額" value={yen(item.amount)} />
      {item.note && <Row icon={<MessageSquare size={15} />} label="備考" value={item.note} />}
    </div>
    <label style={sx.label}>領収書</label>
    {item.photo_url
      ? <img src={item.photo_url} alt="領収書" onClick={() => onZoom(item.photo_url)} style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 10, border: `1px solid ${C.line}`, background: "#F1F3F6", cursor: "zoom-in" }} />
      : <div style={{ fontSize: 12.5, color: C.sub, padding: "8px 0" }}>写真なし</div>}
    {item.photo_url && <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>タップで拡大</div>}

    <label style={sx.label}>返金状況</label>
    {isAdmin ? (
      <button onClick={() => onToggle(item.id, !item.reimbursed)} style={{ ...sx.outline, width: "100%", justifyContent: "flex-start", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderColor: item.reimbursed ? C.ok : C.line }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.reimbursed ? C.ok : C.line}`, background: item.reimbursed ? C.ok : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.reimbursed && <Check size={15} color="#fff" />}</span>
        返金済みにする
      </button>
    ) : (
      <span style={{ ...sx.statusTag, display: "inline-block", background: item.reimbursed ? C.okBg : C.warnBg, color: item.reimbursed ? C.ok : C.warn }}>{item.reimbursed ? "返金済み" : "未返金"}</span>
    )}
  </Sheet>);
}
function PaymentDetailSheet({ item, nameOf, me, isAdmin, onClose, onToggle, onDelete }) {
  const canDel = item.user_id === me?.id || isAdmin;
  return (<Sheet title="振込の詳細" onClose={onClose}
    foot={canDel ? <button style={{ ...sx.outline, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 13, color: C.accent, borderColor: C.accent }}
      onClick={() => { if (confirm("この振込記録を削除しますか？")) onDelete(item.id); }}><Trash2 size={16} /> 削除</button> : null}>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "6px 0 4px" }}>
      <Row icon={<Wallet size={15} />} label="用途" value={item.purpose || "未記入"} />
      <Row icon={<User size={15} />} label="振込者" value={nameOf(item.user_id)} />
      <Row icon={<CalendarDays size={15} />} label="振込日" value={fmtDate(item.paid_on)} />
      <Row icon={<Wallet size={15} />} label="金額" value={yen(item.amount)} />
      {item.note && <Row icon={<MessageSquare size={15} />} label="備考" value={item.note} />}
    </div>
    <label style={sx.label}>着金確認</label>
    {isAdmin ? (
      <button onClick={() => onToggle(item.id, !item.confirmed)} style={{ ...sx.outline, width: "100%", justifyContent: "flex-start", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderColor: item.confirmed ? C.ok : C.line }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.confirmed ? C.ok : C.line}`, background: item.confirmed ? C.ok : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.confirmed && <Check size={15} color="#fff" />}</span>
        口座に着金を確認した
      </button>
    ) : (
      <span style={{ ...sx.statusTag, display: "inline-block", background: item.confirmed ? C.okBg : C.warnBg, color: item.confirmed ? C.ok : C.warn }}>{item.confirmed ? "着金確認済み" : "未確認"}</span>
    )}
  </Sheet>);
}
function PhotoViewer({ url, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <button onClick={onClose} style={{ position: "absolute", top: "max(14px, env(safe-area-inset-top))", right: 16, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 999, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={22} color="#fff" /></button>
      <img src={url} alt="領収書" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
    </div>
  );
}
function EventSheet({ car, onClose, onCreated, flash }) {
  const [occasion, setOccasion] = useState("走行会"); const [phase, setPhase] = useState("前");
  const [template, setTemplate] = useState("daily"); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  // 機会に応じて点検項目を自動提案（貸出/返却→貸出返却、レース→レース、他→日常）
  function pickOccasion(o) {
    setOccasion(o);
    if (o === "レース") setTemplate("race");
    else if (o === "走行会") setTemplate("practice");
    else setTemplate("daily");
    if (o === "貸出") setPhase("前"); else if (o === "返却") setPhase("後");
  }
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
    <Seg val={occasion} set={pickOccasion} options={[{ v: "走行会", l: "走行会" }, { v: "レース", l: "レース" }, { v: "貸出", l: "貸出" }, { v: "返却", l: "返却" }, { v: "その他", l: "その他" }]} />
    <label style={sx.label}>タイミング</label>
    <Seg val={phase} set={setPhase} options={[{ v: "前", l: "前" }, { v: "後", l: "後" }]} />
    <label style={sx.label}>点検項目</label>
    <Seg val={template} set={setTemplate} options={[{ v: "daily", l: "日常" }, { v: "practice", l: "サーキット練習" }, { v: "race", l: "レース" }]} />
    <label style={sx.label}>日付</label>
    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={sx.input} />
    <label style={sx.label}>メモ（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="例：6/5 鈴鹿サーキット走行会" style={sx.input} />
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
    <label style={sx.label}>現在の走行距離（km・任意）</label><input type="number" inputMode="numeric" value={f.odometer ?? ""} onChange={(e) => setF({ ...f, odometer: e.target.value })} placeholder="例：55000" style={sx.input} />
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
    <div>{icon}</div><span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span></button>);
}
function Empty({ icon, title, body }) {
  return (<div style={{ textAlign: "center", padding: "48px 24px", color: C.sub }}>
    <div style={{ opacity: .35, display: "flex", justifyContent: "center", marginBottom: 12 }}>{icon}</div>
    <div style={{ fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 13, lineHeight: 1.6 }}>{body}</div></div>);
}

const sx = {
  app: { maxWidth: 460, margin: "0 auto", minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif', color: C.ink, position: "relative" },
  top: { position: "sticky", top: 0, zIndex: 20, background: C.chrome, color: "#fff", padding: "max(12px, env(safe-area-inset-top)) 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" },
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
  disabled: { background: "#E5E7EB", color: "#9CA3AF", cursor: "not-allowed" },
  iconBtn: { width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.ink },
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
