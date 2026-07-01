
import { supabase } from "./supabaseClient";
const msg = (e) => e?.message || "エラーが発生しました";
 
export const api = {
  async session() { const { data } = await supabase.auth.getSession(); return data.session; },
  onAuth(cb) { return supabase.auth.onAuthStateChange((_e, s) => cb(s)); },
  async signIn(email, password) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw new Error(msg(error)); },
  async signUp(email, password, name) { const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } }); if (error) throw new Error(msg(error)); },
  async signOut() { await supabase.auth.signOut(); },
 
  async myProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) throw new Error(msg(error)); return data;
  },
  async profiles() { const { data } = await supabase.from("profiles").select("id,name,department,role"); return data || []; },
 
  async cars() { const { data, error } = await supabase.from("cars").select("*").order("created_at"); if (error) throw new Error(msg(error)); return data || []; },
  async reservations() {
    const { data, error } = await supabase.from("reservations").select("*").order("started_at", { ascending: false });
    if (error) throw new Error(msg(error)); return data || [];
  },
  async reserve(carId, destination, dueAt, note) {
    const { data, error } = await supabase.rpc("reserve_car", { p_car_id: carId, p_destination: destination || "", p_due_at: dueAt || null, p_note: note || "" });
    if (error) throw new Error(msg(error)); return data;
  },
  async giveBack(reservationId) {
    const { data, error } = await supabase.rpc("return_car", { p_reservation_id: reservationId });
    if (error) throw new Error(msg(error)); return data;
  },
 
  async events(carId) {
    const { data, error } = await supabase.from("check_events").select("*").eq("car_id", carId).order("event_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw new Error(msg(error)); return data || [];
  },
  async createEvent(ev) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("check_events").insert({ ...ev, created_by: user?.id }).select().single();
    if (error) throw new Error(msg(error)); return data;
  },
  async deleteEvent(id) { const { error } = await supabase.from("check_events").delete().eq("id", id); if (error) throw new Error(msg(error)); },
 
  async records(eventId) {
    const { data, error } = await supabase.from("check_records").select("*").eq("event_id", eventId);
    if (error) throw new Error(msg(error)); return data || [];
  },
  async upsertRecord(eventId, itemId, patch) {
    const { data: { user } } = await supabase.auth.getUser();
    const row = { event_id: eventId, item_id: itemId, updated_by: user?.id, updated_at: new Date().toISOString(), ...patch };
    const { error } = await supabase.from("check_records").upsert(row, { onConflict: "event_id,item_id" });
    if (error) throw new Error(msg(error));
  },
 
  // 振込ログ
  async payments() {
    const { data, error } = await supabase.from("payments").select("*").order("paid_on", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw new Error(msg(error)); return data || [];
  },
  async submitPayment(paidOn, purpose, amount, note) {
    const { data, error } = await supabase.rpc("submit_payment", { p_paid_on: paidOn || null, p_purpose: purpose || "", p_amount: amount, p_note: note || "" });
    if (error) throw new Error(msg(error)); return data;
  },
  async deletePayment(id) { const { error } = await supabase.from("payments").delete().eq("id", id); if (error) throw new Error(msg(error)); },
 
  async uploadPhoto(file) {
    const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("car-photos").upload(path, file, { contentType: file.type });
    if (error) throw new Error(msg(error));
    return supabase.storage.from("car-photos").getPublicUrl(path).data.publicUrl;
  },
 
  async saveCar(car) {
    const row = { name: car.name, plate: car.plate || "", note: car.note || "", photo_url: car.photo_url ?? null };
    if (car.id) { const { error } = await supabase.from("cars").update(row).eq("id", car.id); if (error) throw new Error(msg(error)); }
    else { const { error } = await supabase.from("cars").insert(row); if (error) throw new Error(msg(error)); }
  },
  async getSettings() { const { data } = await supabase.from("app_settings").select("*").eq("id", true).single(); return data; },
  async saveSettings(token, target) {
    const { error } = await supabase.from("app_settings").update({ line_token: token || null, line_target: target || null }).eq("id", true);
    if (error) throw new Error(msg(error));
  },
 
  subscribe(onChange) {
    const ch = supabase.channel("car")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "cars" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "check_records" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "check_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, onChange)
      .subscribe();
    return () => supabase.removeChannel(ch);
  },
};
