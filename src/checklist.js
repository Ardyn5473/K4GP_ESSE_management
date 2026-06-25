// 添付「エッセチェックリスト」から移植した点検テンプレート
export const DAILY = [
  { section: "エンジン・オイル", items: [
    { id: "d_engine_oil", name: "エンジンオイル", hint: "量・汚れ確認", icon: "🛢️" },
    { id: "d_coolant", name: "冷却水（LLC）", hint: "リザーバー量確認", icon: "💧" },
  ]},
  { section: "ブレーキ", items: [
    { id: "d_brake_fluid", name: "ブレーキフルード", hint: "量確認", icon: "🔴" },
  ]},
  { section: "タイヤ・ホイール", items: [
    { id: "d_tire_pressure", name: "タイヤ空気圧", hint: "4輪確認", icon: "🔵" },
    { id: "d_tire_condition", name: "タイヤ溝・外傷", hint: "溝深さ・ひび確認", icon: "🔵" },
  ]},
  { section: "電装", items: [
    { id: "d_lights", name: "灯火類", hint: "ヘッド・テール・ウインカー確認", icon: "💡" },
    { id: "d_battery", name: "バッテリー", hint: "端子・電圧確認", icon: "🔋" },
  ]},
  { section: "その他", items: [
    { id: "d_washer", name: "ウォッシャー液", hint: "量確認", icon: "💧" },
    { id: "d_wiper", name: "ワイパー動作", hint: "拭き取り確認", icon: "🔧" },
    { id: "d_horn", name: "ホーン", hint: "動作確認", icon: "📢" },
    { id: "d_belt", name: "シートベルト", hint: "動作確認", icon: "🦺" },
  ]},
];

export const RACE = [
  { section: "エンジン・オイル", items: [
    { id: "engine_oil", name: "エンジンオイル", hint: "量・汚れ・滲み確認（JB-DET）", icon: "🛢️" },
    { id: "coolant", name: "冷却水（LLC）", hint: "リザーバー量・色確認", icon: "💧" },
    { id: "radiator_cap", name: "ラジエーターキャップ", hint: "加圧・パッキン劣化確認", icon: "🔩" },
    { id: "air_filter", name: "エアフィルター", hint: "詰まり・汚れ確認", icon: "🌀" },
    { id: "spark_plug", name: "スパークプラグ", hint: "焼け具合・ギャップ確認", icon: "⚡" },
  ]},
  { section: "ブレーキ", items: [
    { id: "brake_fluid", name: "ブレーキフルード", hint: "量・色・DOT規格確認", icon: "🔴" },
    { id: "brake_pad_f", name: "ブレーキパッド（前）", hint: "残量3mm以上確認", icon: "⬛" },
    { id: "brake_pad_r", name: "ブレーキパッド（後）", hint: "残量3mm以上確認", icon: "⬛" },
    { id: "brake_disc", name: "ブレーキディスク", hint: "ひび・偏摩耗・反り確認", icon: "⭕" },
    { id: "brake_hose", name: "ブレーキホース", hint: "ひび割れ・膨張・漏れ確認", icon: "〰️" },
  ]},
  { section: "タイヤ・ホイール", items: [
    { id: "tire_fl", name: "タイヤ 左前", hint: "空気圧・溝深さ・ひび確認", icon: "🔵" },
    { id: "tire_fr", name: "タイヤ 右前", hint: "空気圧・溝深さ・ひび確認", icon: "🔵" },
    { id: "tire_rl", name: "タイヤ 左後", hint: "空気圧・溝深さ・ひび確認", icon: "🔵" },
    { id: "tire_rr", name: "タイヤ 右後", hint: "空気圧・溝深さ・ひび確認", icon: "🔵" },
    { id: "wheel_nuts", name: "ホイールナット", hint: "規定トルク90N·m締め付け確認", icon: "🔩" },
    { id: "wheel_bearing", name: "ホイールベアリング", hint: "ガタ・異音確認", icon: "⚙️" },
  ]},
  { section: "サスペンション・ステアリング", items: [
    { id: "steering", name: "ステアリング", hint: "遊び・ガタ・センター確認", icon: "🎯" },
    { id: "toe", name: "トー調整", hint: "アライメント目視確認", icon: "📐" },
    { id: "damper_f", name: "ダンパー（前）", hint: "オイル漏れ・ストローク確認", icon: "🔧" },
    { id: "damper_r", name: "ダンパー（後）", hint: "オイル漏れ・ストローク確認", icon: "🔧" },
    { id: "tie_rod", name: "タイロッドエンド", hint: "ガタ・ブーツ破れ確認", icon: "🔗" },
  ]},
  { section: "電装・燃料", items: [
    { id: "battery", name: "バッテリー", hint: "電圧12.6V以上・端子確認", icon: "🔋" },
    { id: "fuel", name: "燃料量・燃料系統", hint: "残量・フィルター・ホース確認", icon: "⛽" },
    { id: "lights", name: "ライト類", hint: "ヘッド・テール・ウインカー確認", icon: "💡" },
  ]},
  { section: "安全装備・車体", items: [
    { id: "harness", name: "ハーネス（シートベルト）", hint: "4点or6点ロック・劣化確認", icon: "🦺" },
    { id: "helmet", name: "ヘルメット", hint: "破損・バイザー・Dリング確認", icon: "⛑️" },
    { id: "fire_ext", name: "消火器", hint: "搭載・有効期限・固定確認", icon: "🧯" },
    { id: "door_hinge", name: "ドア・ヒンジ", hint: "異音・ガタ・固定確認", icon: "🚪" },
    { id: "underbody", name: "アンダーボディ", hint: "擦り傷・変形・オイル漏れ確認", icon: "🔍" },
  ]},
];

export const TEMPLATES = { daily: DAILY, race: RACE };
export const flatItems = (tpl) => (TEMPLATES[tpl] || []).flatMap((s) => s.items);
