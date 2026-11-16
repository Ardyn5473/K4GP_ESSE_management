/* ============================================================
 * xlsx.js — 最小のExcel(.xlsx)ライター
 *   依存は fflate（zip圧縮）だけ。SheetJS は使わない。
 *   ・1ファイルに複数シート
 *   ・日付はExcelの日付型、金額は #,##0 書式（Excel側で集計・並べ替えができる）
 *   ・ヘッダ行の固定、列幅、罫線つき
 *   DBには触らない純粋なユーティリティ。
 * ============================================================ */
import { zipSync, strToU8 } from "fflate";

/* ---------- XMLエスケープ ---------- */
const MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const esc = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[&<>"']/g, (c) => MAP[c]);

/* ---------- 列番号(0始まり) → A, B, ... AA ---------- */
export function colName(i) {
  let s = "", n = i + 1;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* ---------- "YYYY-MM-DD" → Excelのシリアル値 ---------- */
function dateSerial(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ""));
  if (!m) return null;
  return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000) + 25569;
}

/* ---------- セルスタイル（styles.xml の cellXfs の並び順と一致させる） ---------- */
export const S = {
  plain: 0,   // 素のまま
  title: 1,   // 大きい太字（見出し行）
  head: 2,    // 表ヘッダ（白文字・濃紺背景・中央）
  text: 3,    // 文字＋罫線
  num: 4,     // 金額＋罫線（#,##0・マイナスは赤）
  date: 5,    // 日付＋罫線（yyyy/mm/dd・中央）
  bText: 6,   // 太字文字＋薄い背景（合計行）
  bNum: 7,    // 太字金額＋薄い背景（合計行）
  center: 8,  // 中央寄せ＋罫線
  note: 9,    // 注記（罫線なし・グレー）
};

/* ---------- セル生成ヘルパ ---------- */
export const T = (v, s = S.text) => ({ t: "s", v, s });           // 文字
export const N = (v, s = S.num) => ({ t: "n", v: Number(v) || 0, s }); // 数値
export const D = (v, s = S.date) => ({ t: "d", v, s });           // 日付

/* ---------- シート名の正規化（Excelの制約） ---------- */
function safeName(name, i) {
  const s = String(name || `Sheet${i + 1}`).replace(/[\\/?*[\]:]/g, "_").slice(0, 31);
  return s || `Sheet${i + 1}`;
}

/* ---------- 1シートぶんのXML ---------- */
function sheetXml(sheet) {
  const rows = sheet.rows || [];
  const cols = (sheet.cols || [])
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("");

  const body = rows.map((cells, r) => {
    const rn = r + 1;
    const xml = (cells || []).map((c, i) => {
      if (c === null || c === undefined || c === "") return "";
      const ref = colName(i) + rn;
      const cell = typeof c === "object" && c !== null && "t" in c
        ? c
        : { t: typeof c === "number" ? "n" : "s", v: c, s: typeof c === "number" ? S.num : S.text };
      if (cell.t === "n") return `<c r="${ref}" s="${cell.s}"><v>${Number(cell.v) || 0}</v></c>`;
      if (cell.t === "d") {
        const sv = dateSerial(cell.v);
        if (sv === null) return `<c r="${ref}" s="${cell.s}" t="inlineStr"><is><t>${esc(cell.v)}</t></is></c>`;
        return `<c r="${ref}" s="${cell.s}"><v>${sv}</v></c>`;
      }
      return `<c r="${ref}" s="${cell.s}" t="inlineStr"><is><t xml:space="preserve">${esc(cell.v)}</t></is></c>`;
    }).join("");
    return `<row r="${rn}">${xml}</row>`;
  }).join("");

  const freeze = sheet.freeze
    ? `<pane ySplit="${sheet.freeze}" topLeftCell="A${sheet.freeze + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/>`
    : "";
  const merges = (sheet.merges || []).length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="0">${freeze}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="19"/>${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${body}</sheetData>${merges}</worksheet>`;
}

/* ---------- styles.xml ---------- */
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy/mm/dd"/><numFmt numFmtId="165" formatCode="#,##0;[Red]\\-#,##0"/></numFmts>
<fonts count="5">
<font><sz val="11"/><color rgb="FF161A20"/><name val="Yu Gothic"/></font>
<font><b/><sz val="11"/><color rgb="FF161A20"/><name val="Yu Gothic"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Yu Gothic"/></font>
<font><b/><sz val="14"/><color rgb="FF161A20"/><name val="Yu Gothic"/></font>
<font><sz val="10"/><color rgb="FF6B7280"/><name val="Yu Gothic"/></font>
</fonts>
<fills count="4">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF14181F"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEEF0F3"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD4D8DE"/></left><right style="thin"><color rgb="FFD4D8DE"/></right><top style="thin"><color rgb="FFD4D8DE"/></top><bottom style="thin"><color rgb="FFD4D8DE"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="165" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/* ---------- ブック全体を組み立てて Uint8Array を返す ---------- */
export function buildXlsx(sheets) {
  const list = (sheets || []).filter(Boolean);
  if (!list.length) throw new Error("出力するシートがありません");

  const files = {
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${
        list.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")
      }<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${
        list.map((s, i) => `<sheet name="${esc(safeName(s.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")
      }</sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${
        list.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")
      }<Relationship Id="rId${list.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/styles.xml": strToU8(STYLES),
  };
  list.forEach((s, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s)); });

  return zipSync(files, { level: 6, mtime: new Date() });
}

/* ---------- ブラウザでダウンロードさせる ---------- */
export function downloadXlsx(filename, sheets) {
  const bytes = buildXlsx(sheets);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = /\.xlsx$/i.test(filename) ? filename : `${filename}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
