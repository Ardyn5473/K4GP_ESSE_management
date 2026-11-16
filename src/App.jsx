import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Car, ClipboardCheck, History, Settings, Plus, Minus, X, AlertTriangle, Check,
  User, Shield, LogOut, Loader2, Camera, Trash2, ChevronLeft, ChevronRight, MapPin, Clock, MessageSquare, Wallet, Receipt,
  CalendarDays, Wrench, Gauge, Users, BookOpen, BarChart3, Download, ArrowDownLeft, ArrowUpRight, Tag,
} from "lucide-react";
import { api } from "./api";
import { TEMPLATES, flatItems } from "./checklist";
import { downloadXlsx, S, T, N, D } from "./xlsx";

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
  const [openCost, setOpenCost] = useState(null);
  const [costEvents, setCostEvents] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [ledgerSettings, setLedgerSettings] = useState({ opening_balance: 0, opening_on: null, fiscal_start_month: 4 });
  const [openAccounts, setOpenAccounts] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [toast, setToast] = useState(null);
  const [bump, setBump] = useState(0);
  const flash = useCallback((m, kind = "ok") => { setToast({ m, kind }); setTimeout(() => setToast(null), 2400); }, []);

  const car = cars[0] || null;

  const reload = useCallback(async () => {
    try {
      const [pf, cs, bk, ps, rb, pfs, ci] = await Promise.all([api.myProfile(), api.cars(), api.bookings(), api.payments(), api.reimbursements(), api.profiles(), api.checklistItems()]);
      setMe(pf); setCars(cs); setBookings(bk); setPayments(ps); setReimbursements(rb); setProfiles(pfs); setItems(ci);
      setCostEvents(await api.costEvents());
      // 出納帳まわり（v11未適用の環境でも他機能が落ちないよう個別にガード）
      try {
        const [lg, ac, sm, ls] = await Promise.all([api.ledgerEntries(), api.accountItems(), api.summaryItems(), api.ledgerSettings()]);
        setLedger(lg); setAccounts(ac); setSummaries(sm); setLedgerSettings(ls);
      } catch { setLedger([]); setAccounts([]); setSummaries([]); }
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
  async function doPayment({ paidOn, purpose, amount, note, account, summary }) {
    try { await api.submitPayment(paidOn, purpose, Number(amount), note, account, summary); setSheet(null); flash("振込を申請しました（LINE通知）"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function delPayment(id) {
    try { await api.deletePayment(id); flash("削除しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function doReimburse({ spentOn, purpose, amount, photoUrl, note, account, summary }) {
    try { await api.submitReimbursement(spentOn, purpose, Number(amount), photoUrl, note, account, summary); setSheet(null); flash("立替を申請しました（LINE通知）"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  // 出納帳（直接記帳）
  async function doLedger(entry) {
    try { await api.addLedgerEntry(entry); setSheet(null); flash("出納帳に記帳しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function delLedger(id) {
    try { await api.deleteLedgerEntry(id); flash("記帳を削除しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function addAccount(it) {
    try { await api.addAccountItem(it); setSheet(null); flash("科目を追加しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function delAccount(id) {
    try { await api.deleteAccountItem(id); flash("科目を削除しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function addSummaryTag(it) {
    try { await api.addSummaryItem(it); setSheet(null); flash("摘要を追加しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function delSummaryTag(id) {
    try { await api.deleteSummaryItem(id); flash("摘要を削除しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function saveLedgerSettings(patch) {
    try { await api.saveLedgerSettings(patch); setSheet(null); flash("出納帳の設定を保存しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function delReimb(id) {
    try { await api.deleteReimbursement(id); flash("削除しました"); reload(); } catch (e) { flash(e.message, "err"); }
  }
  async function doReimbursed(id, value) {
    try { await api.setReimbursed(id, value); flash(value ? "返金済みにしました" : "未返金に戻しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  // 既存の振込・立替への科目の後付け
  // 保存したらシートを閉じる（sheet.item は開いた時点のコピーなので、
  // 開いたままだと保存後も古い科目を表示してしまうため）
  async function doPaymentAccount(id, account, summary) {
    try { await api.setPaymentAccount(id, account, summary); setSheet(null); flash(account ? `科目を「${account}」にしました` : "科目を未分類に戻しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function doReimbAccount(id, account, summary) {
    try { await api.setReimbursementAccount(id, account, summary); setSheet(null); flash(account ? `科目を「${account}」にしました` : "科目を未分類に戻しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }
  async function doConfirmed(id, value) {
    try { await api.setPaymentConfirmed(id, value); flash(value ? "着金確認済みにしました" : "未確認に戻しました"); reload(); }
    catch (e) { flash(e.message, "err"); }
  }

  if (loading) return <Splash />;
  if (openEvent) return <CheckScreen event={openEvent} items={items} me={me} bump={bump} onBack={() => { setOpenEvent(null); reload(); }} flash={flash} />;
  if (openTemplates) return <TemplateEditor items={items} onBack={() => { setOpenTemplates(false); reload(); }} onAdd={addItem} onDelete={delItem} />;
  if (openCost) return <CostScreen event={openCost} profiles={profiles} nameOf={nameOf} me={me} isAdmin={isAdmin} onBack={() => { setOpenCost(null); reload(); }} flash={flash} />;
  if (openAccounts) return <AccountEditor accounts={accounts} summaries={summaries} onBack={() => { setOpenAccounts(false); reload(); }} setSheet={setSheet} onDelAccount={delAccount} onDelSummary={delSummaryTag} />;

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
        {tab === "pay" && <MoneyTab {...{ payments, reimbursements, costEvents, ledger, accounts, summaries, ledgerSettings, profiles, nameOf, me, isAdmin, setSheet, setOpenCost, delPayment, delReimb, delLedger, flash }} />}
        {tab === "hist" && <HistoryTab {...{ bookings, nameOf }} />}
        {tab === "admin" && isAdmin && <AdminTab {...{ car, setSheet, setOpenTemplates, setOpenAccounts }} />}
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
      {sheet?.type === "payment" && <PaymentSheet accounts={accounts} summaries={summaries} onClose={() => setSheet(null)} onSubmit={doPayment} />}
      {sheet?.type === "reimburse" && <ReimburseSheet accounts={accounts} summaries={summaries} onClose={() => setSheet(null)} onSubmit={doReimburse} flash={flash} />}
      {sheet?.type === "reimburseDetail" && <ReimburseDetailSheet item={sheet.item} nameOf={nameOf} me={me} isAdmin={isAdmin} accounts={accounts} summaries={summaries} onSaveAccount={doReimbAccount} onClose={() => setSheet(null)} onToggle={doReimbursed} onDelete={(id) => { setSheet(null); delReimb(id); }} onZoom={setPhoto} />}
      {sheet?.type === "paymentDetail" && <PaymentDetailSheet item={sheet.item} nameOf={nameOf} me={me} isAdmin={isAdmin} accounts={accounts} summaries={summaries} onSaveAccount={doPaymentAccount} onClose={() => setSheet(null)} onToggle={doConfirmed} onDelete={(id) => { setSheet(null); delPayment(id); }} />}
      {sheet?.type === "costEvent" && <CostEventSheet car={car} onClose={() => setSheet(null)} onCreated={(ev) => { setSheet(null); setOpenCost(ev); }} flash={flash} />}
      {sheet?.type === "event" && <EventSheet car={car} onClose={() => setSheet(null)} onCreated={(ev) => { setSheet(null); setOpenEvent(ev); }} flash={flash} />}
      {sheet?.type === "car" && <CarSheet car={car} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); reload(); flash("車を保存しました"); }} flash={flash} />}
      {sheet?.type === "ledger" && <LedgerSheet accounts={accounts} summaries={summaries} preSide={sheet.side} onClose={() => setSheet(null)} onSubmit={doLedger} flash={flash} />}
      {sheet?.type === "ledgerDetail" && <LedgerDetailSheet row={sheet.row} me={me} isAdmin={isAdmin} onClose={() => setSheet(null)} onDelete={(id) => { setSheet(null); delLedger(id); }} onZoom={setPhoto} />}
      {sheet?.type === "account" && <AccountItemSheet accounts={accounts} preSide={sheet.side} onClose={() => setSheet(null)} onSubmit={addAccount} />}
      {sheet?.type === "summaryTag" && <SummaryItemSheet onClose={() => setSheet(null)} onSubmit={addSummaryTag} />}
      {sheet?.type === "ledgerSettings" && <LedgerSettingsSheet settings={ledgerSettings} onClose={() => setSheet(null)} onSubmit={saveLedgerSettings} />}
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
function MoneyTab({ payments, reimbursements, costEvents, ledger, accounts, summaries, ledgerSettings,
                   profiles, nameOf, me, isAdmin, setSheet, setOpenCost, delPayment, delReimb, delLedger, flash }) {
  const [sub, setSub] = useState("pay");
  const [who, setWho] = useState("");            // 立替の名前フィルタ（""=全て）
  const [status, setStatus] = useState("all");   // all / unsettled / settled
  const [onlyUnclass, setOnlyUnclass] = useState(false);  // 科目が未分類のものだけ表示
  const isPay = sub === "pay";

  /* ---- 出納帳・分析で共有する期間と集計（1か所で計算して両方に渡す） ---- */
  const startMonth = Number(ledgerSettings?.fiscal_start_month) || 4;
  const base = Number(ledgerSettings?.opening_balance) || 0;
  const now = new Date();
  const thisFy = now.getMonth() + 1 >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
  const [fy, setFy] = useState(thisFy);
  const [whole, setWhole] = useState(false);
  const [cashOnly, setCashOnly] = useState(false);

  const range = whole ? { from: "", to: "" } : fiscalRange(fy, startMonth);
  // 全期間ぶん（繰越の計算に使う）
  const allRows = useMemo(
    () => buildLedger({ entries: ledger, payments, reimbursements, nameOf, from: "", to: "", confirmedOnly: cashOnly, opening: base }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ledger, payments, reimbursements, profiles, cashOnly, base]);
  // 期間の開始時点に繰り越されている残高
  const carried = useMemo(
    () => (range.from ? allRows.filter((r) => r.date < range.from).reduce((s, r) => s + (r.side === "in" ? r.amount : -r.amount), base) : base),
    [allRows, range.from, base]);
  // 期間内の行（残高つき）
  const rows = useMemo(
    () => buildLedger({ entries: ledger, payments, reimbursements, nameOf, from: range.from, to: range.to, confirmedOnly: cashOnly, opening: carried }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ledger, payments, reimbursements, profiles, range.from, range.to, cashOnly, carried]);
  // 年度の選択肢（記録のある年度＋今年度）
  const years = useMemo(() => {
    const s = new Set([thisFy]);
    for (const r of allRows) {
      const y = Number(String(r.date).slice(0, 4)), m = Number(String(r.date).slice(5, 7));
      if (y) s.add(m >= startMonth ? y : y - 1);
    }
    return [...s].sort((a, b) => b - a);
  }, [allRows, thisFy, startMonth]);
  const periodLabel = whole ? "全期間" : `${fy}年度`;

  const periodBar = (
    <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 9, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, minWidth: 34 }}>期間</span>
        <select value={whole ? "all" : String(fy)}
          onChange={(e) => { const v = e.target.value; if (v === "all") setWhole(true); else { setWhole(false); setFy(Number(v)); } }}
          style={{ ...sx.input, flex: 1 }}>
          {years.map((y) => <option key={y} value={y}>{y}年度（{y}/{startMonth}〜）</option>)}
          <option value="all">全期間</option>
        </select>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.sub, fontWeight: 600, cursor: "pointer" }}>
        <input type="checkbox" checked={cashOnly} onChange={(e) => setCashOnly(e.target.checked)} style={{ width: 16, height: 16 }} />
        確定分のみで集計（着金済の振込・返金済の立替だけ）
      </label>
    </div>
  );

  // 立替：絞り込み
  const reimbUsers = [...new Set(reimbursements.map((r) => r.user_id))];
  const reimbFiltered = reimbursements.filter((r) =>
    (!who || r.user_id === who) &&
    (status === "all" || (status === "unsettled" ? !r.reimbursed : r.reimbursed)));
  const baseList = isPay ? payments : reimbFiltered;
  const unclassified = baseList.filter((x) => !x.account);
  const list = onlyUnclass ? unclassified : baseList;
  const total = list.reduce((s, x) => s + (x.amount || 0), 0);

  const nav = (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, marginBottom: 12 }}>
      {[{ v: "pay", l: "振込" }, { v: "reimb", l: "立替" }, { v: "split", l: "割勘" }, { v: "ledger", l: "出納帳" }, { v: "ana", l: "分析" }].map((o) => (
        <button key={o.v} onClick={() => setSub(o.v)} style={{ ...sx.segBtn, flex: "0 0 auto", padding: "9px 14px", ...(sub === o.v ? sx.segOn : {}) }}>{o.l}</button>
      ))}
    </div>
  );

  if (sub === "split") return (<div>{nav}<SplitTab {...{ costEvents, setSheet, setOpenCost }} /></div>);
  if (sub === "ledger") return (<div>{nav}<LedgerTab {...{ rows, carried, periodLabel, periodBar, setSheet, delLedger, me, isAdmin, flash }} /></div>);
  if (sub === "ana") return (<div>{nav}<AnalysisTab {...{ rows, carried, periodLabel, periodBar, flash }} /></div>);

  return (
    <div>
      {nav}
      <div style={sx.rowHead}>
        <h2 style={sx.h2}>{isPay ? "振込（部への入金）" : "立替（メンバーの支出）"}</h2>
        <button style={{ ...sx.primary, padding: "8px 13px", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }} onClick={() => setSheet({ type: isPay ? "payment" : "reimburse" })}><Plus size={15} /> 申請</button>
      </div>
      <div style={{ ...sx.card, justifyContent: "space-between", background: C.chrome, border: "none", marginBottom: 12 }}>
        <span style={{ color: "#B7C0CC", fontSize: 13, fontWeight: 600 }}>{isPay ? "振込 累計" : "立替 合計"}</span>
        <span style={{ color: "#fff", fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{yen(total)}</span>
      </div>
      {(unclassified.length > 0 || onlyUnclass) && (
        <button onClick={() => setOnlyUnclass(!onlyUnclass)}
          style={{ ...sx.card, width: "100%", textAlign: "left", marginBottom: 12, cursor: "pointer",
                   borderColor: onlyUnclass ? C.warn : C.line, background: onlyUnclass ? C.warnBg : C.card }}>
          <Tag size={17} color={C.warn} />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.warn }}>
            科目が未分類：{unclassified.length}件
          </div>
          <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>{onlyUnclass ? "全て表示" : "絞り込む"}</span>
        </button>
      )}
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
                <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{nameOf(p.user_id)}・{fmtDate(date)}
                  {p.account ? `・${p.account}` : <span style={{ color: C.warn, fontWeight: 700 }}>・未分類</span>}</div>
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
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{nameOf(p.user_id)}・{fmtDate(date)}
                {p.account ? `・${p.account}` : <span style={{ color: C.warn, fontWeight: 700 }}>・未分類</span>}</div>
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

/* ===== 出納帳（科目分類・Excel出力・分析） =====
   振込(payments)=収入 / 立替(reimbursements)=支出 / 直接記帳(ledger_entries) の3つを
   1本の出納帳に合流させて、残高・科目別集計・月次推移・Excel出力を作る。
   ここの計算関数はすべて純粋関数（DBに触らない／テストしやすい）。            */
const UNCLASS = "未分類";
const METHOD_LABEL = { transfer: "振込", cash: "現金", card: "カード", other: "その他" };
const SRC_LABEL = { ledger: "記帳", payment: "振込申請", reimb: "立替" };

// 年度（既定は4月開始）の期間を返す
function fiscalRange(year, startMonth = 4) {
  const from = `${year}-${pad(startMonth)}-01`;
  const ey = startMonth === 1 ? year : year + 1;
  const em = startMonth === 1 ? 12 : startMonth - 1;
  const lastDay = new Date(Date.UTC(ey, em, 0)).getUTCDate();
  return { from, to: `${ey}-${pad(em)}-${pad(lastDay)}` };
}

// 3つの出どころを1本の出納帳にする（日付昇順・残高つき）
function buildLedger({ entries, payments, reimbursements, nameOf, from, to, confirmedOnly, opening }) {
  const all = [];
  for (const e of entries || []) all.push({
    id: `L${e.id}`, src: "ledger", rawId: e.id, date: e.entry_date, side: e.side,
    account: e.account || UNCLASS, summary: e.summary || "", purpose: e.purpose || "",
    amount: Number(e.amount) || 0, who: e.counterparty || "", method: e.method || "transfer",
    note: e.note || "", photo_url: e.photo_url || null, settled: true, ref: e,
  });
  for (const p of payments || []) all.push({
    id: `P${p.id}`, src: "payment", rawId: p.id, date: p.paid_on, side: "in",
    account: p.account || UNCLASS, summary: p.summary || "", purpose: p.purpose || "",
    amount: Number(p.amount) || 0, who: nameOf ? nameOf(p.user_id) : "", method: "transfer",
    note: p.note || "", photo_url: null, settled: !!p.confirmed, ref: p,
  });
  for (const r of reimbursements || []) all.push({
    id: `R${r.id}`, src: "reimb", rawId: r.id, date: r.spent_on, side: "out",
    account: r.account || UNCLASS, summary: r.summary || "", purpose: r.purpose || "",
    amount: Number(r.amount) || 0, who: nameOf ? nameOf(r.user_id) : "", method: "cash",
    note: r.note || "", photo_url: r.photo_url || null, settled: !!r.reimbursed, ref: r,
  });
  const rows = all.filter((x) => x.date && (!from || x.date >= from) && (!to || x.date <= to) && (!confirmedOnly || x.settled));
  rows.sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1));
  let bal = Number(opening) || 0;
  for (const x of rows) { bal += x.side === "in" ? x.amount : -x.amount; x.balance = bal; }
  return rows;
}
const sumSide = (rows, side) => (rows || []).reduce((s, r) => (r.side === side ? s + r.amount : s), 0);

// 科目別・摘要別の集計（金額降順・構成比つき）
function sumByKey(rows, side, key, fallback = UNCLASS) {
  const m = new Map();
  for (const r of rows || []) {
    if (r.side !== side) continue;
    const k = r[key] || fallback;
    const o = m.get(k) || { name: k, amount: 0, count: 0 };
    o.amount += r.amount; o.count += 1; m.set(k, o);
  }
  const list = [...m.values()].sort((a, b) => b.amount - a.amount);
  const total = list.reduce((s, x) => s + x.amount, 0);
  for (const x of list) x.pct = total ? x.amount / total : 0;
  return list;
}

// 月次の収支推移（残高つき）
function monthlySeries(rows, opening) {
  const m = new Map();
  for (const r of rows || []) {
    const ym = String(r.date).slice(0, 7);
    const o = m.get(ym) || { ym, inc: 0, out: 0 };
    if (r.side === "in") o.inc += r.amount; else o.out += r.amount;
    m.set(ym, o);
  }
  const list = [...m.values()].sort((a, b) => (a.ym < b.ym ? -1 : 1));
  let bal = Number(opening) || 0;
  for (const x of list) { x.net = x.inc - x.out; bal += x.net; x.balance = bal; }
  return list;
}

/* ---- Excel出力（出納帳＋分析シート、1ファイル） ---- */
function exportLedgerXlsx({ rows, carried, periodLabel, flash }) {
  try {
    const inc = sumSide(rows, "in"), out = sumSide(rows, "out"), end = carried + inc - out;
    const blank = (n, s = S.bText) => Array.from({ length: n }, () => T("", s));

    /* シート1：出納帳 */
    const HEAD = ["日付", "区分", "科目", "摘要", "内容", "相手先", "収入", "支出", "残高", "方法", "種別", "状態", "備考"];
    const led = [
      [T(`出納帳（${periodLabel}）`, S.title)],
      [T(`出力日 ${new Date().toLocaleDateString("ja-JP")}　／　件数 ${rows.length}`, S.note)],
      [],
      HEAD.map((h) => T(h, S.head)),
      [T("", S.bText), T("", S.bText), T("繰越", S.bText), T("", S.bText), T("前期からの繰越残高", S.bText), T("", S.bText),
       N(0, S.bNum), N(0, S.bNum), N(carried, S.bNum), ...blank(4)],
    ];
    for (const r of rows) led.push([
      D(r.date), T(r.side === "in" ? "収入" : "支出", S.center), T(r.account), T(r.summary), T(r.purpose), T(r.who),
      N(r.side === "in" ? r.amount : 0), N(r.side === "out" ? r.amount : 0), N(r.balance),
      T(METHOD_LABEL[r.method] || r.method, S.center), T(SRC_LABEL[r.src] || "", S.center),
      T(r.settled ? "確定" : "未確定", S.center), T(r.note),
    ]);
    led.push([...blank(2), T("合計", S.bText), ...blank(3), N(inc, S.bNum), N(out, S.bNum), N(end, S.bNum), ...blank(4)]);

    /* シート2：科目別集計 */
    const accIn = sumByKey(rows, "in", "account"), accOut = sumByKey(rows, "out", "account");
    const block = (title, list, total) => {
      const o = [[T(title, S.bText)], [T("科目", S.head), T("金額", S.head), T("構成比", S.head), T("件数", S.head)]];
      for (const x of list) o.push([T(x.name), N(x.amount), T(`${(x.pct * 100).toFixed(1)}%`, S.center), N(x.count)]);
      o.push([T("合計", S.bText), N(total, S.bNum), T("100.0%", S.bText), N(list.reduce((s, x) => s + x.count, 0), S.bNum)]);
      o.push([]);
      return o;
    };
    const agg = [[T(`科目別集計（${periodLabel}）`, S.title)], []]
      .concat(block("【収入】", accIn, inc)).concat(block("【支出】", accOut, out));

    /* シート3：月次推移 */
    const ms = monthlySeries(rows, carried);
    const mon = [[T(`月次の収支推移（${periodLabel}）`, S.title)], [],
      [T("年月", S.head), T("収入", S.head), T("支出", S.head), T("差引", S.head), T("月末残高", S.head)]];
    for (const x of ms) mon.push([T(x.ym.replace("-", "/"), S.center), N(x.inc), N(x.out), N(x.net), N(x.balance)]);
    mon.push([T("合計", S.bText), N(inc, S.bNum), N(out, S.bNum), N(inc - out, S.bNum), N(end, S.bNum)]);

    /* シート4：摘要別 */
    const sIn = sumByKey(rows, "in", "summary", "（未設定）"), sOut = sumByKey(rows, "out", "summary", "（未設定）");
    const tag = [[T(`摘要別の内訳（${periodLabel}）`, S.title)], []]
      .concat(block("【収入】", sIn, inc)).concat(block("【支出】", sOut, out));

    /* シート5：年度サマリ */
    const sum = [
      [T(`収支報告（${periodLabel}）`, S.title)], [],
      [T("項目", S.head), T("金額", S.head)],
      [T("期首繰越", S.text), N(carried)],
      [T("収入合計", S.text), N(inc)],
      [T("支出合計", S.text), N(out)],
      [T("当期収支（収入−支出）", S.bText), N(inc - out, S.bNum)],
      [T("期末残高", S.bText), N(end, S.bNum)],
      [],
      [T("収入の内訳", S.head), T("金額", S.head)],
      ...accIn.map((x) => [T(x.name), N(x.amount)]),
      [],
      [T("支出の内訳", S.head), T("金額", S.head)],
      ...accOut.map((x) => [T(x.name), N(x.amount)]),
    ];

    const d = new Date();
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    downloadXlsx(`出納帳_${periodLabel}_${stamp}.xlsx`, [
      { name: "出納帳", rows: led, freeze: 4, cols: [12, 7, 14, 14, 26, 14, 12, 12, 13, 8, 10, 8, 24] },
      { name: "科目別集計", rows: agg, cols: [22, 14, 10, 8] },
      { name: "月次推移", rows: mon, freeze: 3, cols: [12, 14, 14, 14, 15] },
      { name: "摘要別", rows: tag, cols: [22, 14, 10, 8] },
      { name: "収支報告", rows: sum, cols: [26, 16] },
    ]);
    flash?.("Excelを書き出しました");
  } catch (e) {
    flash?.(`Excel出力に失敗しました：${e.message}`, "err");
  }
}

/* ---- 小物 ---- */
function MiniStat({ label, value, color }) {
  return (<div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 10.5, color: "#8A93A0", fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
  </div>);
}
function Bar({ ratio, color }) {
  return (<div style={{ height: 6, borderRadius: 999, background: "#EDEFF3", overflow: "hidden" }}>
    <div style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, height: "100%", background: color, borderRadius: 999 }} />
  </div>);
}
function LedgerRow({ r, onClick }) {
  const isIn = r.side === "in";
  return (<div style={{ ...sx.card, padding: "11px 14px", alignItems: "flex-start", cursor: "pointer" }} onClick={onClick}>
    <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isIn ? C.okBg : C.ngBg }}>
      {isIn ? <ArrowDownLeft size={16} color={C.ok} /> : <ArrowUpRight size={16} color={C.ng} />}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ ...sx.chipTag, background: isIn ? C.okBg : C.ngBg, color: isIn ? C.ok : C.ng }}>{r.account}</span>
        {r.summary && <span style={{ ...sx.chipTag, background: "#F1F3F6", color: C.sub }}>{r.summary}</span>}
        {!r.settled && <span style={{ ...sx.chipTag, background: C.warnBg, color: C.warn }}>未確定</span>}
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.purpose || "（内容未記入）"}</div>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
        {fmtDate(r.date)}・{SRC_LABEL[r.src]}{r.who ? `・${r.who}` : ""}
      </div>
    </div>
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{ fontWeight: 800, fontSize: 15, fontVariantNumeric: "tabular-nums", color: isIn ? C.ok : C.ink }}>
        {isIn ? "+" : "−"}{yen(r.amount)}
      </div>
      <div style={{ fontSize: 10.5, color: C.sub, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>残 {yen(r.balance)}</div>
    </div>
  </div>);
}

/* ---- 出納帳タブ ---- */
function LedgerTab({ rows, carried, periodLabel, periodBar, setSheet, delLedger, me, isAdmin, flash }) {
  const inc = sumSide(rows, "in"), out = sumSide(rows, "out"), end = carried + inc - out;
  const desc = [...rows].reverse();   // 画面は新しい順
  return (
    <div>
      <div style={sx.rowHead}>
        <h2 style={sx.h2}>出納帳</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ ...sx.outline, padding: "8px 11px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}
            onClick={() => exportLedgerXlsx({ rows, carried, periodLabel, flash })}><Download size={15} /> Excel</button>
          <button style={{ ...sx.primary, padding: "8px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}
            onClick={() => setSheet({ type: "ledger" })}><Plus size={15} /> 記帳</button>
        </div>
      </div>
      {periodBar}
      <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 9, background: C.chrome, border: "none", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ color: "#B7C0CC", fontSize: 13, fontWeight: 600 }}>{periodLabel}の残高</span>
          <span style={{ color: "#fff", fontSize: 24, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{yen(end)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, borderTop: "1px solid #2C333E", paddingTop: 9 }}>
          <MiniStat label="繰越" value={yen(carried)} color="#D7DDE5" />
          <MiniStat label="収入" value={`+${yen(inc)}`} color="#8FE3AC" />
          <MiniStat label="支出" value={`−${yen(out)}`} color="#FFA8B0" />
        </div>
      </div>
      {rows.length === 0
        ? <Empty icon={<BookOpen size={30} />} title="この期間の記帳はありません"
            body="「記帳」から、部の口座が動いたお金（車両代・スポンサ費・DAC補助金・振込手数料など）を科目つきで記録します。振込と立替は自動でここに合流します。" />
        : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {desc.map((r) => <LedgerRow key={r.id} r={r} onClick={() => setSheet({ type: "ledgerDetail", row: r })} />)}
          </div>}
    </div>
  );
}

/* ---- 分析タブ ---- */
function AnalysisTab({ rows, carried, periodLabel, periodBar, flash }) {
  const [view, setView] = useState("acc");
  const inc = sumSide(rows, "in"), out = sumSide(rows, "out"), end = carried + inc - out;
  const accIn = sumByKey(rows, "in", "account"), accOut = sumByKey(rows, "out", "account");
  const tagIn = sumByKey(rows, "in", "summary", "（未設定）"), tagOut = sumByKey(rows, "out", "summary", "（未設定）");
  const ms = monthlySeries(rows, carried);
  const msMax = Math.max(1, ...ms.map((x) => Math.max(x.inc, x.out)));

  const RankList = ({ list, color }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {list.length === 0 && <div style={{ fontSize: 12.5, color: C.sub }}>データがありません。</div>}
      {list.map((x) => (
        <div key={x.name}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.name}</span>
            <span style={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
              {yen(x.amount)}<span style={{ fontSize: 10.5, color: C.sub, fontWeight: 600, marginLeft: 5 }}>{(x.pct * 100).toFixed(1)}%・{x.count}件</span>
            </span>
          </div>
          <Bar ratio={x.pct} color={color} />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={sx.rowHead}>
        <h2 style={sx.h2}>分析</h2>
        <button style={{ ...sx.outline, padding: "8px 11px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}
          onClick={() => exportLedgerXlsx({ rows, carried, periodLabel, flash })}><Download size={15} /> Excel</button>
      </div>
      {periodBar}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, marginBottom: 12 }}>
        {[{ v: "acc", l: "科目別" }, { v: "mon", l: "月次推移" }, { v: "tag", l: "摘要別" }, { v: "sum", l: "年度サマリ" }].map((o) => (
          <button key={o.v} onClick={() => setView(o.v)} style={{ ...sx.segBtn, flex: "0 0 auto", padding: "8px 13px", fontSize: 12.5, ...(view === o.v ? sx.segOn : {}) }}>{o.l}</button>
        ))}
      </div>

      {rows.length === 0 && <Empty icon={<BarChart3 size={30} />} title="集計するデータがありません" body="出納帳に記帳するか、振込・立替に科目を付けて申請すると、ここで使い道を分析できます。" />}

      {rows.length > 0 && view === "acc" && (<>
        <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 13, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><ArrowUpRight size={17} color={C.ng} />
            <span style={{ fontWeight: 800, fontSize: 14.5 }}>支出 {yen(out)}</span></div>
          <RankList list={accOut} color={C.accent} />
        </div>
        <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><ArrowDownLeft size={17} color={C.ok} />
            <span style={{ fontWeight: 800, fontSize: 14.5 }}>収入 {yen(inc)}</span></div>
          <RankList list={accIn} color={C.ok} />
        </div>
      </>)}

      {rows.length > 0 && view === "mon" && (
        <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 14 }}>
          {ms.map((x) => (
            <div key={x.ym}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{x.ym.replace("-", "/")}</span>
                <span style={{ fontSize: 12, color: C.sub, fontVariantNumeric: "tabular-nums" }}>
                  差引 <b style={{ color: x.net >= 0 ? C.ok : C.ng }}>{x.net >= 0 ? "+" : "−"}{yen(Math.abs(x.net))}</b>・残 {yen(x.balance)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                <span style={{ fontSize: 10.5, color: C.sub, width: 26 }}>収入</span>
                <div style={{ flex: 1 }}><Bar ratio={x.inc / msMax} color={C.ok} /></div>
                <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums", width: 74, textAlign: "right" }}>{yen(x.inc)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 10.5, color: C.sub, width: 26 }}>支出</span>
                <div style={{ flex: 1 }}><Bar ratio={x.out / msMax} color={C.accent} /></div>
                <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums", width: 74, textAlign: "right" }}>{yen(x.out)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && view === "tag" && (<>
        <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 13, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Tag size={16} color={C.ng} />
            <span style={{ fontWeight: 800, fontSize: 14.5 }}>支出の摘要</span></div>
          <RankList list={tagOut} color={C.accent} />
        </div>
        <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Tag size={16} color={C.ok} />
            <span style={{ fontWeight: 800, fontSize: 14.5 }}>収入の摘要</span></div>
          <RankList list={tagIn} color={C.ok} />
        </div>
      </>)}

      {rows.length > 0 && view === "sum" && (
        <div style={{ ...sx.card, flexDirection: "column", alignItems: "stretch", gap: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>{periodLabel} 収支報告</div>
          {[["期首繰越", carried, C.ink], ["収入合計", inc, C.ok], ["支出合計", out, C.ng],
            ["当期収支", inc - out, inc - out >= 0 ? C.ok : C.ng], ["期末残高", end, C.ink]].map(([l, v, col], i, arr) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`, fontWeight: i >= arr.length - 2 ? 800 : 600 }}>
              <span style={{ fontSize: 13.5, color: i >= arr.length - 2 ? C.ink : C.sub }}>{l}</span>
              <span style={{ fontSize: i >= arr.length - 2 ? 17 : 15, color: col, fontVariantNumeric: "tabular-nums" }}>
                {l === "当期収支" && v >= 0 ? "+" : ""}{yen(v)}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 10, lineHeight: 1.6 }}>
            「Excel」を押すと、この収支報告・出納帳・科目別集計・月次推移・摘要別を1つのExcelファイルに書き出します。
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- 科目セレクタ（マスタ未投入でも壊れない） ---- */
function AccountSelect({ accounts, side, value, onChange, label = "科目" }) {
  const opts = (accounts || []).filter((a) => a.side === side);
  return (<>
    <label style={sx.label}>{label}{opts.length === 0 ? "（v11_ledger.sql を適用すると選べます）" : ""}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={sx.input}>
      <option value="">未分類</option>
      {opts.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
    </select>
  </>);
}
function SummarySelect({ summaries, value, onChange }) {
  return (<>
    <label style={sx.label}>摘要（任意）</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={sx.input}>
      <option value="">なし</option>
      {(summaries || []).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
    </select>
  </>);
}

/* ---- 記帳シート ---- */
function LedgerSheet({ accounts, summaries, preSide, onClose, onSubmit, flash }) {
  const [side, setSide] = useState(preSide || "out");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState("");
  const [summary, setSummary] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [who, setWho] = useState("");
  const [method, setMethod] = useState("transfer");
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const valid = Number(amount) > 0 && purpose.trim();

  async function onPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return; setPhotoBusy(true);
    try { const small = await compressImage(file); setPhotoUrl(await api.uploadPhoto(small)); }
    catch (err) { flash?.(err.message, "err"); } finally { setPhotoBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return (<Sheet title="出納帳に記帳" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 14, fontSize: 15, ...(valid ? {} : sx.disabled) }}
      disabled={busy || !valid}
      onClick={async () => {
        setBusy(true);
        await onSubmit({ entry_date: date, side, account, summary, purpose: purpose.trim(), amount: Number(amount), counterparty: who.trim(), method, note, photo_url: photoUrl });
        setBusy(false);
      }}>{busy ? <Loader2 className="spin" size={16} /> : <BookOpen size={17} />} 記帳する</button>}>
    <label style={sx.label}>区分</label>
    <div style={{ display: "flex", gap: 7 }}>
      {[{ v: "in", l: "収入（入ってきた）" }, { v: "out", l: "支出（出ていった）" }].map((o) => (
        <button key={o.v} onClick={() => { setSide(o.v); setAccount(""); }}
          style={{ ...sx.segBtn, flex: 1, padding: "10px 0", fontSize: 12.5, ...(side === o.v ? sx.segOn : {}) }}>{o.l}</button>
      ))}
    </div>
    <label style={sx.label}>日付</label>
    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={sx.input} />
    <AccountSelect accounts={accounts} side={side} value={account} onChange={setAccount} />
    <SummarySelect summaries={summaries} value={summary} onChange={setSummary} />
    <label style={sx.label}>内容（何に使った／何で入った）</label>
    <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={side === "out" ? "例：フロントブレーキパッド" : "例：◯◯商事 スポンサー料"} style={sx.input} />
    <label style={sx.label}>金額（円）</label>
    <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例：18000" style={sx.input} />
    <label style={sx.label}>相手先（任意）</label>
    <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="例：オートバックス／DAC" style={sx.input} />
    <label style={sx.label}>支払方法</label>
    <div style={{ display: "flex", gap: 6 }}>
      {Object.entries(METHOD_LABEL).map(([v, l]) => (
        <button key={v} onClick={() => setMethod(v)} style={{ ...sx.segBtn, flex: 1, padding: "9px 0", fontSize: 12.5, ...(method === v ? sx.segOn : {}) }}>{l}</button>
      ))}
    </div>
    <label style={sx.label}>領収書の写真（任意）</label>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {photoUrl ? <img src={photoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.line}` }} />
        : <div style={{ width: 64, height: 64, borderRadius: 10, background: "#F1F3F6", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Receipt size={22} color="#B8BFC9" /></div>}
      <button onClick={() => fileRef.current?.click()} disabled={photoBusy} style={{ ...sx.outline, flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: 7 }}>
        {photoBusy ? <Loader2 className="spin" size={15} /> : <Camera size={15} />}{photoBusy ? "アップロード中…" : "撮る / 選ぶ"}</button>
      {photoUrl && <Trash2 size={18} color={C.sub} style={{ cursor: "pointer" }} onClick={() => setPhotoUrl(null)} />}
      <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
    </div>
    <label style={sx.label}>備考（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="補足" style={sx.input} />
  </Sheet>);
}

function LedgerDetailSheet({ row, me, isAdmin, onClose, onDelete, onZoom }) {
  const isIn = row.side === "in";
  const canDelete = row.src === "ledger" && (isAdmin || row.ref?.created_by === me?.id);
  return (<Sheet title={isIn ? "収入の明細" : "支出の明細"} onClose={onClose}
    foot={canDelete
      ? <button style={{ ...sx.outline, width: "100%", color: C.ng, borderColor: "#F0C9C9", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 13 }}
          onClick={() => { if (confirm("この記帳を削除しますか？")) onDelete(row.rawId); }}><Trash2 size={16} /> 削除する</button>
      : <div style={{ fontSize: 12, color: C.sub, textAlign: "center", padding: "6px 0 10px", lineHeight: 1.6 }}>
          {row.src === "ledger" ? "記帳した本人か管理者だけが削除できます。" : `これは「${SRC_LABEL[row.src]}」からの自動反映です。${row.src === "payment" ? "振込" : "立替"}タブで編集・削除してください。`}
        </div>}>
    <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: isIn ? C.ok : C.ink, margin: "6px 0 14px" }}>
      {isIn ? "+" : "−"}{yen(row.amount)}
    </div>
    <Row icon={<CalendarDays size={16} color={C.sub} />} label="日付" value={String(row.date).replaceAll("-", "/")} />
    <Row icon={<Wallet size={16} color={C.sub} />} label="科目" value={row.account} />
    {row.summary && <Row icon={<Tag size={16} color={C.sub} />} label="摘要" value={row.summary} />}
    <Row icon={<MessageSquare size={16} color={C.sub} />} label="内容" value={row.purpose || "—"} />
    {row.who && <Row icon={<User size={16} color={C.sub} />} label="相手先" value={row.who} />}
    <Row icon={<Receipt size={16} color={C.sub} />} label="方法" value={METHOD_LABEL[row.method] || row.method} />
    <Row icon={<BookOpen size={16} color={C.sub} />} label="種別" value={SRC_LABEL[row.src]} />
    <Row icon={<Check size={16} color={C.sub} />} label="状態" value={row.settled ? "確定" : "未確定（着金・返金待ち）"} danger={!row.settled} />
    <Row icon={<Gauge size={16} color={C.sub} />} label="この時点の残高" value={yen(row.balance)} />
    {row.note && <Row icon={<MessageSquare size={16} color={C.sub} />} label="備考" value={row.note} />}
    {row.photo_url && <img src={row.photo_url} alt="" onClick={() => onZoom?.(row.photo_url)}
      style={{ width: "100%", borderRadius: 12, marginTop: 12, border: `1px solid ${C.line}`, cursor: "zoom-in" }} />}
  </Sheet>);
}

/* ---- 科目・摘要の編集（管理） ---- */
function AccountEditor({ accounts, summaries, onBack, setSheet, onDelAccount, onDelSummary }) {
  const [tab, setTab] = useState("out");
  const list = tab === "sum" ? (summaries || []) : (accounts || []).filter((a) => a.side === tab);
  return (
    <div style={sx.app}>
      <style>{css}</style>
      <header style={sx.top}>
        <button onClick={onBack} style={{ ...sx.meBtn, padding: "7px 10px" }}><ChevronLeft size={15} /> 戻る</button>
        <div style={{ fontWeight: 800, fontSize: 14 }}>科目・摘要の編集</div>
        <div style={{ width: 62 }} />
      </header>
      <main style={sx.main}>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[{ v: "out", l: "支出科目" }, { v: "in", l: "収入科目" }, { v: "sum", l: "摘要" }].map((o) => (
            <button key={o.v} onClick={() => setTab(o.v)} style={{ ...sx.segBtn, flex: 1, ...(tab === o.v ? sx.segOn : {}) }}>{o.l}</button>
          ))}
        </div>
        <button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 12, marginBottom: 12 }}
          onClick={() => setSheet(tab === "sum" ? { type: "summaryTag" } : { type: "account", side: tab })}>
          <Plus size={16} /> {tab === "sum" ? "摘要を追加" : "科目を追加"}
        </button>
        {list.length === 0 && <Empty icon={<Tag size={28} />} title="項目がありません" body="v11_ledger.sql を適用すると、画像の科目一覧が初期投入されます。" />}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((x) => (
            <div key={x.id} style={{ ...sx.card, padding: "11px 14px" }}>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{x.name}</div>
              <Trash2 size={17} color={C.sub} style={{ cursor: "pointer" }}
                onClick={() => { if (confirm(`「${x.name}」を削除しますか？\n※過去の記録に入っている文字列はそのまま残ります`)) (tab === "sum" ? onDelSummary : onDelAccount)(x.id); }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
function AccountItemSheet({ accounts, preSide, onClose, onSubmit }) {
  const [side, setSide] = useState(preSide === "in" ? "in" : "out");
  const [name, setName] = useState("");
  const maxSort = Math.max(0, ...(accounts || []).filter((a) => a.side === side).map((a) => a.sort || 0));
  const valid = name.trim().length > 0;
  return (<Sheet title="科目を追加" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", padding: 13, ...(valid ? {} : sx.disabled) }} disabled={!valid}
      onClick={() => onSubmit({ side, name: name.trim(), sort: maxSort + 10 })}>追加する</button>}>
    <label style={sx.label}>区分</label>
    <div style={{ display: "flex", gap: 7 }}>
      {[{ v: "in", l: "収入" }, { v: "out", l: "支出" }].map((o) => (
        <button key={o.v} onClick={() => setSide(o.v)} style={{ ...sx.segBtn, flex: 1, padding: "10px 0", ...(side === o.v ? sx.segOn : {}) }}>{o.l}</button>
      ))}
    </div>
    <label style={sx.label}>科目名</label>
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：タイヤ代" style={sx.input} />
  </Sheet>);
}
function SummaryItemSheet({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const valid = name.trim().length > 0;
  return (<Sheet title="摘要を追加" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", padding: 13, ...(valid ? {} : sx.disabled) }} disabled={!valid}
      onClick={() => onSubmit({ name: name.trim(), sort: 999 })}>追加する</button>}>
    <label style={sx.label}>摘要名</label>
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：安全装備" style={sx.input} />
  </Sheet>);
}
function LedgerSettingsSheet({ settings, onClose, onSubmit }) {
  const [opening, setOpening] = useState(String(settings?.opening_balance ?? 0));
  const [on, setOn] = useState(settings?.opening_on || "");
  const [month, setMonth] = useState(String(settings?.fiscal_start_month || 4));
  return (<Sheet title="出納帳の設定" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", padding: 13 }}
      onClick={() => onSubmit({ opening_balance: Number(opening) || 0, opening_on: on || null, fiscal_start_month: Number(month) || 4 })}>保存する</button>}>
    <label style={sx.label}>期首残高（アプリで記帳を始めた時点の口座残高）</label>
    <input type="number" inputMode="numeric" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="例：350000" style={sx.input} />
    <label style={sx.label}>その残高の基準日（任意）</label>
    <input type="date" value={on} onChange={(e) => setOn(e.target.value)} style={sx.input} />
    <label style={sx.label}>年度の開始月</label>
    <select value={month} onChange={(e) => setMonth(e.target.value)} style={sx.input}>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
    </select>
    <div style={{ fontSize: 11.5, color: C.sub, marginTop: 12, lineHeight: 1.6 }}>
      期首残高は、出納帳の「繰越」として残高の起点になります。過去の入出金をすべて記帳する場合は0のままで構いません。
    </div>
  </Sheet>);
}

/* ===== 割り勘（費用イベント一覧） ===== */
// n人で均等割り（端数は先頭から1円ずつ）
function splitAmount(amount, n) {
  if (!n) return [];
  const base = Math.floor(amount / n), rem = amount - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}
// 比例配分（ウェイトの比で割る。端数は小数部が大きい順に1円ずつ）
function splitByWeight(amount, shares) {
  const keys = Object.keys(shares).filter((k) => Number(shares[k]) > 0);
  const tot = keys.reduce((s, k) => s + Number(shares[k]), 0);
  if (tot <= 0) return {};
  const raw = {}, floor = {}; keys.forEach((k) => { raw[k] = amount * Number(shares[k]) / tot; floor[k] = Math.floor(raw[k]); });
  let rem = amount - keys.reduce((s, k) => s + floor[k], 0);
  keys.sort((a, b) => (raw[b] - floor[b]) - (raw[a] - floor[a]));
  for (let i = 0; i < rem; i++) floor[keys[i]] += 1;
  return floor;
}
// 1つの費用項目の割当（方式別）。{user_id: 円} を返す
function allocItem(it) {
  const type = it.split_type || "equal";
  if (type === "fixed") {
    const o = {}; Object.keys(it.shares || {}).forEach((k) => { if (Number(it.shares[k]) > 0) o[k] = Math.round(Number(it.shares[k])); }); return o;
  }
  if (type === "weight") return splitByWeight(it.amount || 0, it.shares || {});
  const payers = it.payers || [];
  if (!payers.length) return {};
  const arr = splitAmount(it.amount || 0, payers.length);
  const o = {}; payers.forEach((p, i) => (o[p] = arr[i])); return o;
}
// 費用項目の実効金額（固定額は入力の合計）
function itemTotal(it) {
  if ((it.split_type || "equal") === "fixed") return Object.values(it.shares || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  return it.amount || 0;
}
// 費用項目と支払いから、各人の割当/支払/過不足と最小送金案を計算
function computeSettlement(names, items, payments) {
  const alloc = {}, paid = {};
  names.forEach((p) => { alloc[p] = 0; paid[p] = 0; });
  items.forEach((it) => {
    const d = allocItem(it);
    Object.keys(d).forEach((p) => { if (alloc[p] != null) alloc[p] += d[p]; });
  });
  payments.forEach((pm) => { if (paid[pm.user_id] != null) paid[pm.user_id] += pm.amount || 0; });
  const net = {}; names.forEach((p) => (net[p] = paid[p] - alloc[p]));
  const creditors = names.filter((p) => net[p] > 0).map((p) => ({ p, v: net[p] })).sort((a, b) => b.v - a.v);
  const debtors = names.filter((p) => net[p] < 0).map((p) => ({ p, v: -net[p] })).sort((a, b) => b.v - a.v);
  const transfers = []; let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const m = Math.min(debtors[i].v, creditors[j].v);
    transfers.push({ from: debtors[i].p, to: creditors[j].p, amount: m });
    debtors[i].v -= m; creditors[j].v -= m;
    if (debtors[i].v === 0) i++; if (creditors[j].v === 0) j++;
  }
  return { alloc, paid, net, transfers };
}
function SplitTab({ costEvents, setSheet, setOpenCost }) {
  return (
    <div>
      <div style={sx.rowHead}>
        <h2 style={sx.h2}>割り勘</h2>
        <button style={{ ...sx.primary, padding: "8px 13px", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }} onClick={() => setSheet({ type: "costEvent" })}><Plus size={15} /> イベント</button>
      </div>
      {costEvents.length === 0 && <Empty icon={<Wallet size={30} />} title="費用イベントなし" body="「イベント」から走行会・レースを作り、費用項目と支払いを登録すると、各人の割り勘と精算（誰が誰にいくら）を計算します。" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {costEvents.map((ev) => (
          <div key={ev.id} style={sx.card} onClick={() => setOpenCost(ev)}>
            <Wallet size={20} color={C.accent} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{ev.title || "無題のイベント"}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{fmtDate(ev.event_date)}{ev.note ? `・${ev.note}` : ""}</div>
            </div>
            <ChevronRight size={20} color={C.sub} />
          </div>
        ))}
      </div>
    </div>
  );
}
function CostEventSheet({ car, onClose, onCreated, flash }) {
  const [title, setTitle] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const valid = title.trim();
  async function create() {
    setBusy(true);
    try { const ev = await api.createCostEvent({ car_id: car?.id ?? null, title, event_date: date, note }); onCreated(ev); }
    catch (e) { flash(e.message, "err"); setBusy(false); }
  }
  return (<Sheet title="費用イベントを作成" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", padding: 14, fontSize: 15, ...(valid ? {} : sx.disabled) }} disabled={busy || !valid} onClick={create}>作成して費用を登録</button>}>
    <label style={sx.label}>タイトル</label>
    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：9/5 鈴鹿走行会" style={sx.input} />
    <label style={sx.label}>日付</label>
    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={sx.input} />
    <label style={sx.label}>メモ（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} style={sx.input} />
  </Sheet>);
}

/* ===== 割り勘 明細＋精算（フルスクリーン） ===== */
function CostScreen({ event, profiles, nameOf, me, isAdmin, onBack, flash }) {
  const [items, setItems] = useState([]);
  const [pays, setPays] = useState([]);
  const [sheet, setSheet] = useState(null);
  const load = useCallback(async () => {
    const [it, py] = await Promise.all([api.costItems(event.id), api.costPayments(event.id)]);
    setItems(it); setPays(py);
  }, [event.id]);
  useEffect(() => { load(); }, [load]);

  // 関係者＝費用の負担者 ∪ 支払者
  const people = [...new Set([...items.flatMap((i) => Object.keys(allocItem(i))), ...pays.map((p) => p.user_id)])];
  const { alloc, paid, net, transfers } = computeSettlement(people, items, pays);
  const totalCost = items.reduce((s, i) => s + itemTotal(i), 0);
  const totalPaid = pays.reduce((s, p) => s + (p.amount || 0), 0);

  async function addItem(it) { try { await api.addCostItem({ ...it, cost_event_id: event.id }); setSheet(null); load(); } catch (e) { flash(e.message, "err"); } }
  async function delItem(id) { try { await api.deleteCostItem(id); load(); } catch (e) { flash(e.message, "err"); } }
  async function addPay(pm) { try { await api.addCostPayment({ ...pm, cost_event_id: event.id }); setSheet(null); load(); } catch (e) { flash(e.message, "err"); } }
  async function delPay(id) { try { await api.deleteCostPayment(id); load(); } catch (e) { flash(e.message, "err"); } }

  return (
    <div style={sx.app}>
      <style>{css}</style>
      <header style={{ ...sx.top, gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", display: "flex", alignItems: "center", cursor: "pointer", padding: 0 }}><ChevronLeft size={24} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{event.title || "費用イベント"}</div>
          <div style={{ fontSize: 10.5, color: "#9AA3B0" }}>{fmtDate(event.event_date)}</div>
        </div>
      </header>
      <main style={sx.main}>
        {/* 合計 */}
        <div style={{ ...sx.card, padding: 0, marginBottom: 14 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "12px 4px" }}>
            <div style={{ fontSize: 10.5, color: C.sub }}>費用合計</div>
            <div style={{ fontWeight: 800, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>{yen(totalCost)}</div>
          </div>
          <div style={{ width: 1, background: C.line, alignSelf: "stretch", margin: "8px 0" }} />
          <div style={{ flex: 1, textAlign: "center", padding: "12px 4px" }}>
            <div style={{ fontSize: 10.5, color: C.sub }}>支払合計</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: totalPaid === totalCost ? C.ok : C.warn, fontVariantNumeric: "tabular-nums" }}>{yen(totalPaid)}</div>
          </div>
        </div>

        {/* 費用項目 */}
        <div style={{ ...sx.rowHead, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>費用項目</div>
          <button style={{ ...sx.primary, padding: "6px 11px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }} onClick={() => setSheet({ type: "item" })}><Plus size={14} /> 追加</button>
        </div>
        {items.length === 0 && <div style={{ fontSize: 12, color: C.sub, textAlign: "center", padding: "8px 0 14px" }}>走行料・ガソリン代などを追加</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {items.map((it) => {
            const type = it.split_type || "equal";
            const typeLabel = type === "weight" ? "比例" : type === "fixed" ? "固定" : "均等";
            const parts = type === "equal"
              ? (it.payers || []).map((p) => nameOf(p))
              : Object.keys(it.shares || {}).filter((k) => Number(it.shares[k]) > 0).map((k) => `${nameOf(k)}${type === "weight" ? `(${it.shares[k]})` : `:${yen(it.shares[k])}`}`);
            return (
            <div key={it.id} style={{ ...sx.card, padding: "11px 14px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{it.label || "項目"}</span>
                  <span style={{ ...sx.chipTag, fontSize: 10, background: C.blueBg, color: C.blue }}>{typeLabel}</span>
                </div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{parts.join("・") || "負担者なし"}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14.5, fontVariantNumeric: "tabular-nums" }}>{yen(itemTotal(it))}</div>
              <Trash2 size={15} color={C.sub} style={{ cursor: "pointer" }} onClick={() => { if (confirm("削除しますか？")) delItem(it.id); }} />
            </div>
            );
          })}
        </div>

        {/* 支払い */}
        <div style={{ ...sx.rowHead, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>支払い（誰が払ったか）</div>
          <button style={{ ...sx.primary, padding: "6px 11px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }} onClick={() => setSheet({ type: "pay" })}><Plus size={14} /> 追加</button>
        </div>
        {pays.length === 0 && <div style={{ fontSize: 12, color: C.sub, textAlign: "center", padding: "8px 0 14px" }}>立て替えて払った人と金額を追加</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {pays.map((p) => (
            <div key={p.id} style={{ ...sx.card, padding: "11px 14px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{nameOf(p.user_id)}</div>
                {p.note && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{p.note}</div>}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14.5, fontVariantNumeric: "tabular-nums" }}>{yen(p.amount)}</div>
              <Trash2 size={15} color={C.sub} style={{ cursor: "pointer" }} onClick={() => { if (confirm("削除しますか？")) delPay(p.id); }} />
            </div>
          ))}
        </div>

        {/* 精算 */}
        {people.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, margin: "0 2px 8px" }}>精算</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {people.map((p) => (
                <div key={p} style={{ ...sx.card, padding: "10px 14px" }}>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{nameOf(p)}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginRight: 10 }}>割当 {yen(alloc[p])}／支払 {yen(paid[p])}</div>
                  <div style={{ fontWeight: 800, fontSize: 14, fontVariantNumeric: "tabular-nums", color: net[p] > 0 ? C.ok : net[p] < 0 ? C.accent : C.sub }}>
                    {net[p] > 0 ? `+${yen(net[p])}` : net[p] < 0 ? `−${yen(-net[p])}` : "±0"}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, margin: "0 2px 6px" }}>＋は受け取り／−は支払い</div>
            {transfers.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, margin: "6px 2px 8px" }}>送金案（最小回数）</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {transfers.map((t, i) => (
                    <div key={i} style={{ ...sx.card, padding: "11px 14px", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{nameOf(t.from)}</span>
                      <ChevronRight size={16} color={C.sub} />
                      <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{nameOf(t.to)}</span>
                      <span style={{ fontWeight: 800, fontSize: 14.5, color: C.accent, fontVariantNumeric: "tabular-nums" }}>{yen(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        <div style={{ height: 24 }} />
      </main>
      {sheet?.type === "item" && <CostItemSheet profiles={profiles} onClose={() => setSheet(null)} onSubmit={addItem} />}
      {sheet?.type === "pay" && <CostPaymentSheet profiles={profiles} people={people} nameOf={nameOf} onClose={() => setSheet(null)} onSubmit={addPay} />}
    </div>
  );
}
function CostItemSheet({ profiles, onClose, onSubmit }) {
  const [label, setLabel] = useState(""); const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("equal");     // equal / weight / fixed
  const [payers, setPayers] = useState([]);           // 均等用
  const [shares, setShares] = useState({});           // 比例=ウェイト / 固定=金額
  const [busy, setBusy] = useState(false);
  const togglePayer = (id) => setPayers((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const setShare = (id, v) => setShares((s) => { const o = { ...s }; if (v === "" || Number(v) <= 0) delete o[id]; else o[id] = Number(v); return o; });
  const shareKeys = Object.keys(shares);
  const weightTotal = shareKeys.reduce((s, k) => s + Number(shares[k]), 0);
  const fixedTotal = shareKeys.reduce((s, k) => s + Number(shares[k]), 0);
  const valid = method === "equal" ? (label.trim() && Number(amount) > 0 && payers.length > 0)
    : method === "weight" ? (label.trim() && Number(amount) > 0 && weightTotal > 0)
    : (label.trim() && fixedTotal > 0);
  async function submit() {
    setBusy(true);
    const base = { label, split_type: method };
    if (method === "equal") await onSubmit({ ...base, amount: Number(amount), payers, shares: {} });
    else if (method === "weight") await onSubmit({ ...base, amount: Number(amount), payers: [], shares });
    else await onSubmit({ ...base, amount: fixedTotal, payers: [], shares });
    setBusy(false);
  }
  return (<Sheet title="費用項目を追加" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", padding: 14, fontSize: 15, ...(valid ? {} : sx.disabled) }} disabled={busy || !valid} onClick={submit}>追加</button>}>
    <label style={sx.label}>項目名</label>
    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例：ガソリン代（往路）/ 走行料 / エントリー費" style={sx.input} />
    <label style={sx.label}>割り方</label>
    <div style={{ display: "flex", gap: 6 }}>
      {[{ v: "equal", l: "均等" }, { v: "weight", l: "比例配分" }, { v: "fixed", l: "固定額" }].map((o) =>
        <button key={o.v} onClick={() => setMethod(o.v)} style={{ ...sx.segBtn, flex: 1, ...(method === o.v ? sx.segOn : {}) }}>{o.l}</button>)}
    </div>
    {method !== "fixed" && (<>
      <label style={sx.label}>金額（円）</label>
      <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例：6000" style={sx.input} />
    </>)}
    {method === "equal" && (<>
      <label style={sx.label}>負担する人（この人数で均等割り）</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {profiles.map((p) => <button key={p.id} onClick={() => togglePayer(p.id)} style={{ ...sx.segBtn, ...(payers.includes(p.id) ? sx.segOn : {}) }}>{p.name}</button>)}
      </div>
      {payers.length > 0 && Number(amount) > 0 && <div style={{ fontSize: 12, color: C.sub, marginTop: 8 }}>1人あたり 約 {yen(Math.floor(Number(amount) / payers.length))}</div>}
    </>)}
    {method === "weight" && (<>
      <label style={sx.label}>比率（周回数・時間など。入れた人だけで配分）</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {profiles.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
            <input type="number" inputMode="numeric" value={shares[p.id] ?? ""} onChange={(e) => setShare(p.id, e.target.value)} placeholder="例：20" style={{ ...sx.input, width: 90, textAlign: "right" }} />
            {weightTotal > 0 && shares[p.id] > 0 && Number(amount) > 0 && <span style={{ fontSize: 11, color: C.sub, width: 72, textAlign: "right" }}>{yen(Math.round(Number(amount) * shares[p.id] / weightTotal))}</span>}
          </div>
        ))}
      </div>
    </>)}
    {method === "fixed" && (<>
      <label style={sx.label}>各自の金額（円）を直接入力</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {profiles.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
            <input type="number" inputMode="numeric" value={shares[p.id] ?? ""} onChange={(e) => setShare(p.id, e.target.value)} placeholder="0" style={{ ...sx.input, width: 110, textAlign: "right" }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: C.sub, marginTop: 8, textAlign: "right" }}>合計 {yen(fixedTotal)}</div>
    </>)}
  </Sheet>);
}
function CostPaymentSheet({ profiles, people, nameOf, onClose, onSubmit }) {
  const [userId, setUserId] = useState(people[0] || profiles[0]?.id || "");
  const [amount, setAmount] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const valid = userId && Number(amount) > 0;
  return (<Sheet title="支払いを追加" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", padding: 14, fontSize: 15, ...(valid ? {} : sx.disabled) }} disabled={busy || !valid}
      onClick={async () => { setBusy(true); await onSubmit({ user_id: userId, amount: Number(amount), note }); setBusy(false); }}>追加</button>}>
    <label style={sx.label}>払った人</label>
    <select value={userId} onChange={(e) => setUserId(e.target.value)} style={sx.input}>
      {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
    <label style={sx.label}>払った金額（円）</label>
    <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例：15000" style={sx.input} />
    <label style={sx.label}>メモ（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="まとめて精算 など" style={sx.input} />
  </Sheet>);
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
          <textarea value={rec?.note || ""} onChange={(e) => onPatch({ note: e.target.value })} rows={2} placeholder="メモ（銘柄・気づき・数値など）" style={{ ...sx.input, fontSize: 13, padding: "9px 11px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, minHeight: 40 }} />
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
function AdminTab({ car, setSheet, setOpenTemplates, setOpenAccounts }) {
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
        <div style={sx.card} onClick={() => setOpenAccounts(true)}>
          <Tag size={22} color={C.warn} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>科目・摘要の編集</div>
            <div style={{ fontSize: 11.5, color: C.sub }}>出納帳の収入科目・支出科目・摘要を追加／削除</div></div>
          <ChevronRight size={20} color={C.sub} />
        </div>
        <div style={sx.card} onClick={() => setSheet({ type: "ledgerSettings" })}>
          <BookOpen size={22} color={C.ink} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>出納帳の設定</div>
            <div style={{ fontSize: 11.5, color: C.sub }}>期首残高・年度の開始月</div></div>
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
function PaymentSheet({ accounts, summaries, onClose, onSubmit }) {
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState(""); const [amount, setAmount] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState(""); const [summary, setSummary] = useState("");
  const valid = purpose.trim() && Number(amount) > 0;
  return (<Sheet title="振込を申請" onClose={onClose}
    foot={<button style={{ ...sx.primary, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 14, fontSize: 15, ...(valid ? {} : sx.disabled) }} disabled={busy || !valid}
      onClick={async () => { setBusy(true); await onSubmit({ paidOn, purpose, amount, note, account, summary }); setBusy(false); }}>{busy ? <Loader2 className="spin" size={16} /> : <Wallet size={17} />} 申請してLINE通知</button>}>
    <label style={sx.label}>振込日（いつ）</label>
    <input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} style={sx.input} />
    <AccountSelect accounts={accounts} side="in" value={account} onChange={setAccount} label="科目（収入）" />
    <SummarySelect summaries={summaries} value={summary} onChange={setSummary} />
    <label style={sx.label}>用途（何のため）</label>
    <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="例：K4GPエントリー費" style={sx.input} />
    <label style={sx.label}>金額（円）</label>
    <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例：12500" style={sx.input} />
    <label style={sx.label}>備考（任意）</label>
    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="振込先・分担など" style={sx.input} />
  </Sheet>);
}
function ReimburseSheet({ accounts, summaries, onClose, onSubmit, flash }) {
  const [spentOn, setSpentOn] = useState(new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState(""); const [amount, setAmount] = useState(""); const [note, setNote] = useState("");
  const [account, setAccount] = useState(""); const [summary, setSummary] = useState("");
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
      onClick={async () => { setBusy(true); await onSubmit({ spentOn, purpose, amount, photoUrl, note, account, summary }); setBusy(false); }}>{busy ? <Loader2 className="spin" size={16} /> : <Receipt size={17} />} 申請してLINE通知</button>}>
    <label style={sx.label}>立替日（いつ）</label>
    <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} style={sx.input} />
    <AccountSelect accounts={accounts} side="out" value={account} onChange={setAccount} label="科目（支出）" />
    <SummarySelect summaries={summaries} value={summary} onChange={setSummary} />
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
/* 既存の振込・立替に、あとから科目／摘要を付けるための共通ブロック。
   変更できるのは申請者本人か管理者（DB側の set_*_account でも同じ判定をする）。 */
function AccountEditBlock({ item, side, accounts, summaries, canEdit, onSave }) {
  const [account, setAccount] = useState(item.account || "");
  const [summary, setSummary] = useState(item.summary || "");
  const [busy, setBusy] = useState(false);
  const dirty = (item.account || "") !== account || (item.summary || "") !== summary;

  if (!canEdit) {
    return (<>
      <label style={sx.label}>科目</label>
      <span style={{ ...sx.statusTag, display: "inline-block", background: item.account ? C.blueBg : C.warnBg, color: item.account ? C.blue : C.warn }}>
        {item.account || "未分類"}{item.summary ? `／${item.summary}` : ""}
      </span>
    </>);
  }
  return (<>
    <label style={sx.label}>科目{!item.account && <span style={{ color: C.warn }}>（未分類です）</span>}</label>
    <select value={account} onChange={(e) => setAccount(e.target.value)} style={sx.input}>
      <option value="">未分類</option>
      {(accounts || []).filter((a) => a.side === side).map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
    </select>
    <label style={sx.label}>摘要</label>
    <select value={summary} onChange={(e) => setSummary(e.target.value)} style={sx.input}>
      <option value="">なし</option>
      {(summaries || []).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
    </select>
    <button disabled={!dirty || busy}
      onClick={async () => { setBusy(true); await onSave(item.id, account, summary); setBusy(false); }}
      style={{ ...sx.outline, width: "100%", marginTop: 10, justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: 12, ...(dirty && !busy ? { borderColor: C.blue, color: C.blue } : sx.disabled) }}>
      {busy ? <Loader2 className="spin" size={15} /> : <Tag size={15} />} 科目を保存
    </button>
  </>);
}

function ReimburseDetailSheet({ item, nameOf, me, isAdmin, accounts, summaries, onSaveAccount, onClose, onToggle, onDelete, onZoom }) {
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

    <AccountEditBlock item={item} side="out" accounts={accounts} summaries={summaries}
      canEdit={item.user_id === me?.id || isAdmin} onSave={onSaveAccount} />

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
function PaymentDetailSheet({ item, nameOf, me, isAdmin, accounts, summaries, onSaveAccount, onClose, onToggle, onDelete }) {
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

    <AccountEditBlock item={item} side="in" accounts={accounts} summaries={summaries}
      canEdit={item.user_id === me?.id || isAdmin} onSave={onSaveAccount} />

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
