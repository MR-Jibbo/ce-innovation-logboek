import { BrowserWindow, dialog } from "electron";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  Document,
  Packer,
  HeadingLevel,
  Paragraph,
  TextRun,
  BorderStyle,
  PageBreak,
  AlignmentType,
  TableOfContents,
  Bookmark,
  InternalHyperlink,
} from "docx";
import type { LogbookData } from "./logbook-store.js";
import { htmlToDocxParagraphs, imageParagraphFromDataUrl, parseDataUri } from "./html-to-docx.js";

interface SkillDef {
  id: string;
  name: string;
  desc: string;
  ind: string[];
}

interface Criterion {
  id: string;
  title: string;
  desc: string;
}

interface LukDef {
  id: string;
  name: string;
  desc: string;
  criteria: Criterion[];
}

interface LukFile {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  date: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Word bookmark/anchor names must be alphanumeric + underscore, starting with a letter. */
function slug(id: string): string {
  return ("a_" + id).replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40);
}

function isWordDocFile(file: LukFile): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx$/i.test(file.name)
  );
}

function isPdfFile(file: LukFile): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

/** Plain-text-ish files we can just decode and show as-is (not images, Word, or PDF). */
function isPlainTextFile(file: LukFile): boolean {
  if (file.type?.startsWith("text/")) return true;
  if (file.type === "application/json") return true;
  return /\.(txt|csv|md|markdown|json|log)$/i.test(file.name);
}

const TEXT_ATTACHMENT_MAX_CHARS = 20000;

/** Caps very large text attachments so one bewijsstuk can't blow up the whole export. */
function truncateText(text: string): string {
  if (text.length <= TEXT_ATTACHMENT_MAX_CHARS) return text;
  return text.slice(0, TEXT_ATTACHMENT_MAX_CHARS) + "\n\n… (bestand ingekort, open het originele bestand voor de volledige inhoud)";
}

/** Decodes a plain-text data URI as UTF-8 text, or null if it isn't a valid data URI. */
function decodePlainText(dataUrl: string): string | null {
  const parsed = parseDataUri(dataUrl);
  if (!parsed) return null;
  return parsed.buffer.toString("utf-8");
}

/** Runs the uploaded .docx through mammoth, returning simplified HTML (with images inlined as data URIs), or null on any failure. */
async function extractDocxHtml(dataUrl: string): Promise<string | null> {
  const parsed = parseDataUri(dataUrl);
  if (!parsed) return null;
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ buffer: parsed.buffer }, { convertImage: mammoth.images.dataUri });
    return result.value || null;
  } catch (error) {
    console.error(`[pdf-export] Kon Word-bijlage niet uitlezen: ${error}`);
    return null;
  }
}

/**
 * Extracts the text content of an uploaded PDF, one entry per page, via
 * pdfjs-dist's pure-JS text layer (no native canvas / rasterization
 * dependency — layout/images inside the PDF are not reproduced, only text).
 * Returns null on any failure, or a page-less/scanned PDF still returns an
 * array of empty strings (caller decides how to treat "no text found").
 */
async function extractPdfText(dataUrl: string): Promise<string[] | null> {
  const parsed = parseDataUri(dataUrl);
  if (!parsed) return null;
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(parsed.buffer),
      disableFontFace: true,
      useSystemFonts: true,
    }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((it) => ("str" in it ? it.str : "")).join(" ").trim();
      pages.push(text);
    }
    return pages;
  } catch (error) {
    console.error(`[pdf-export] Kon PDF-bijlage niet uitlezen: ${error}`);
    return null;
  }
}

function formatExportDate(d: Date): string {
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

/** Resolves a project's display name from its stable index-based storage key ("0".."8"). */
function resolveProjectName(data: LogbookData, projectKey: string): string {
  const idx = Number(projectKey);
  return (Number.isInteger(idx) ? data.projNames[idx] : undefined) || projectKey;
}

// ─── Export data model ──────────────────────────────────────────────────────
// One shared shape built once from the raw logbook data, then rendered into
// either the PDF's HTML or the Word document — so the two formats can never
// drift apart in structure.

interface MomentInfo {
  id: string;
  title: string;
  date?: string;
  description?: string;
  reflection?: string;
  actionItems: Array<{ text: string; done: boolean }>;
}

interface SkillSection {
  skill: SkillDef;
  plan?: string;
  moments: MomentInfo[];
}

interface BewijsInfo {
  id: string;
  title: string;
  text?: string;
  files: LukFile[];
}

interface CriterionSection {
  criterion: Criterion;
  bewijsstukken: BewijsInfo[];
}

interface LukSection {
  luk: LukDef;
  criteria: CriterionSection[];
}

interface AttachmentInfo {
  file: LukFile;
  lukName: string;
  criterionTitle: string;
  bewijsTitle: string;
  anchorId: string;
}

interface ExportModel {
  /** Display name of the project (resolved from its stable index-based storage key). */
  projectName: string;
  studentName: string;
  exportDateLabel: string;
  skills: SkillSection[];
  luks: LukSection[];
  attachments: AttachmentInfo[];
}

/**
 * `projectKey` is the project's stable storage key ("0".."8", its index in
 * projNames — see keyOfIndex/indexOfKey in renderer/lib/use-logbook.ts),
 * used to filter entries/lukEntries/selections. The display name shown on
 * the cover page etc. is resolved separately via projNames.
 */
function buildExportModel(data: LogbookData, allSkills: SkillDef[], lukDefs: LukDef[], projectKey: string): ExportModel {
  const psi = data.selectedSkillIds[projectKey] || [];
  const chosenSkills = allSkills.filter((s) => psi.includes(s.id));
  const pe = data.entries.filter((e) => e.periode === projectKey);

  const skills: SkillSection[] = chosenSkills.map((sk) => {
    const se = pe.filter((e) => e.skillId === sk.id);
    const d = data.skillData[projectKey]?.[sk.id] || {};
    return {
      skill: sk,
      plan: d.plan,
      moments: se.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        description: e.description,
        reflection: e.reflection,
        actionItems: (e.actionItems || []).map((a) => ({ text: a.text, done: a.done })),
      })),
    };
  });

  const ls = data.lukSelections[projectKey] || [];
  const chosenLuks = lukDefs.filter((l) => ls.includes(l.id));
  const attachments: AttachmentInfo[] = [];

  const luks: LukSection[] = chosenLuks.map((luk) => {
    const criteria: CriterionSection[] = luk.criteria.map((c) => {
      const ces = data.lukEntries.filter((e) => e.periode === projectKey && e.lukId === luk.id && e.criterionId === c.id);
      const bewijsstukken: BewijsInfo[] = ces.map((e, idx) => {
        const customTitle = e.title?.trim();
        const bewijsTitle = customTitle || (ces.length > 1 ? `${c.title} — bewijsstuk ${idx + 1}` : c.title);
        const files = e.files || [];
        files.forEach((f) => {
          attachments.push({
            file: f,
            lukName: luk.name,
            criterionTitle: c.title,
            bewijsTitle,
            anchorId: slug(`bijlage_${f.id}`),
          });
        });
        return { id: e.id, title: bewijsTitle, text: e.text, files };
      });
      return { criterion: c, bewijsstukken };
    });
    return { luk, criteria };
  });

  attachments.sort((a, b) => a.file.name.localeCompare(b.file.name, "nl", { sensitivity: "base" }));

  return {
    projectName: resolveProjectName(data, projectKey),
    studentName: data.studentName || "-",
    exportDateLabel: formatExportDate(new Date()),
    skills,
    luks,
    attachments,
  };
}

// ─── HTML (PDF) rendering ───────────────────────────────────────────────────

function coverHtml(model: ExportModel): string {
  return `
    <div class="cover">
      <p class="cover-kicker">Logboek</p>
      <h1 class="cover-title">${escapeHtml(model.projectName)}</h1>
      <table class="cover-meta">
        <tr><td>Student</td><td>${escapeHtml(model.studentName)}</td></tr>
        <tr><td>Geëxporteerd op</td><td>${escapeHtml(model.exportDateLabel)}</td></tr>
      </table>
    </div>
    <div class="page-break"></div>`;
}

function tocHtml(model: ExportModel): string {
  let h = `<h1>Inhoudsopgave</h1><div class="toc">`;
  h += `<p class="toc-h1"><a href="#sec-skills">Skills</a></p>`;
  model.skills.forEach((s) => {
    h += `<p class="toc-h2"><a href="#skill-${slug(s.skill.id)}">${escapeHtml(s.skill.name)}</a></p>`;
    s.moments.forEach((m) => {
      h += `<p class="toc-h3"><a href="#moment-${slug(m.id)}">${escapeHtml(m.title)}</a></p>`;
    });
  });
  h += `<p class="toc-h1"><a href="#sec-luks">Leeruitkomsten</a></p>`;
  model.luks.forEach((l) => {
    h += `<p class="toc-h2"><a href="#luk-${slug(l.luk.id)}">${escapeHtml(l.luk.name)}</a></p>`;
    l.criteria.forEach((c) => {
      c.bewijsstukken.forEach((b) => {
        h += `<p class="toc-h3"><a href="#bewijs-${slug(b.id)}">${escapeHtml(b.title)}</a></p>`;
      });
    });
  });
  h += `<p class="toc-h1"><a href="#sec-bijlagen">Bijlagen</a></p>`;
  model.attachments.forEach((a) => {
    h += `<p class="toc-h2"><a href="#${a.anchorId}">${escapeHtml(a.file.name)}</a></p>`;
  });
  h += `</div><div class="page-break"></div>`;
  return h;
}

function actionItemsHtml(items: MomentInfo["actionItems"]): string {
  if (!items.length) return "";
  let h = `<p class="lbl">Actiepunten</p>`;
  items.forEach((a) => {
    h += `<p>${a.done ? "&#9745;" : "&#9744;"} ${escapeHtml(a.text)}</p>`;
  });
  return h;
}

function skillsSectionHtml(model: ExportModel): string {
  let h = `<h1 id="sec-skills">Skills</h1>`;
  if (!model.skills.length) {
    h += `<p><em>Geen skills geselecteerd voor dit project.</em></p>`;
  }
  model.skills.forEach((s) => {
    h += `<h2 id="skill-${slug(s.skill.id)}">${escapeHtml(s.skill.name)}</h2>`;
    if (s.plan) h += `<p class="lbl">Ontwikkelplan</p><p>${escapeHtml(s.plan)}</p>`;
    if (!s.moments.length) {
      h += `<p><em>Nog geen ontwikkelmomenten gedocumenteerd.</em></p>`;
    } else {
      s.moments.forEach((m) => {
        h += `<h3 id="moment-${slug(m.id)}">${escapeHtml(m.title)}</h3>`;
        if (m.date) h += `<p class="lbl">Datum</p><p>${escapeHtml(m.date)}</p>`;
        if (m.description) h += `<p class="lbl">Beschrijving</p><p>${escapeHtml(m.description)}</p>`;
        if (m.reflection) h += `<p class="lbl">Reflectie</p><p>${escapeHtml(m.reflection)}</p>`;
        h += actionItemsHtml(m.actionItems);
        h += `<hr/>`;
      });
    }
  });
  return h;
}

function lukSectionHtml(model: ExportModel): string {
  let h = `<h1 id="sec-luks">Leeruitkomsten</h1>`;
  if (!model.luks.length) {
    h += `<p><em>Geen leeruitkomsten geselecteerd voor dit project.</em></p>`;
  }
  model.luks.forEach((l) => {
    h += `<h2 id="luk-${slug(l.luk.id)}">${escapeHtml(l.luk.name)}</h2>`;
    if (l.luk.desc) h += `<p>${escapeHtml(l.luk.desc)}</p>`;
    l.criteria.forEach((c) => {
      h += `<p class="crit-label">${escapeHtml(c.criterion.title)}</p>`;
      if (c.criterion.desc) h += `<p>${escapeHtml(c.criterion.desc)}</p>`;
      if (!c.bewijsstukken.length) {
        h += `<p><em>Nog geen bewijsstukken.</em></p>`;
      } else {
        c.bewijsstukken.forEach((b) => {
          h += `<h3 id="bewijs-${slug(b.id)}">${escapeHtml(b.title)}</h3>`;
          if (b.text) h += `<p>${escapeHtml(b.text)}</p>`;
          b.files.forEach((f) => {
            const anchor = slug(`bijlage_${f.id}`);
            h += `<p>&#128206; <a href="#${anchor}">${escapeHtml(f.name)}</a> — zie Bijlagen</p>`;
          });
          h += `<hr/>`;
        });
      }
    });
  });
  return h;
}

/**
 * The uploaded Word document's own heading tags (h1-h6) must not leak into
 * the export's own H1/H2/H3 document outline — otherwise a bewijsstuk's
 * internal heading renders as a full section title identical to "Skills"
 * or "Bijlagen". Demoted to a plain styled paragraph instead.
 */
function demoteHeadings(html: string): string {
  return html.replace(/<h[1-6]([^>]*)>/gi, '<p class="attach-heading"$1>').replace(/<\/h[1-6]>/gi, "</p>");
}

async function attachmentContentHtml(file: LukFile): Promise<string> {
  if (file.type?.startsWith("image/")) {
    return `<img class="attachment-image" src="${file.dataUrl}" alt="${escapeHtml(file.name)}"/>`;
  }
  if (isWordDocFile(file)) {
    const html = await extractDocxHtml(file.dataUrl);
    if (html) return `<div class="attachment-doc">${demoteHeadings(html)}</div>`;
    return `<p><em>Kon de tekst van dit Word-bestand niet automatisch uitlezen. Open het originele bestand voor de inhoud.</em></p>`;
  }
  if (isPdfFile(file)) {
    const pages = await extractPdfText(file.dataUrl);
    if (pages && pages.some((p) => p)) {
      return `<div class="attachment-doc">${pages
        .map(
          (p, i) =>
            `<p class="lbl">Pagina ${i + 1}</p><p>${p ? escapeHtml(p) : "<em>(geen doorzoekbare tekst op deze pagina)</em>"}</p>`,
        )
        .join("")}</div>`;
    }
    return `<p><em>Kon de tekst van deze PDF niet automatisch uitlezen (mogelijk een scan zonder doorzoekbare tekst). Open het originele bestand voor de inhoud.</em></p>`;
  }
  if (isPlainTextFile(file)) {
    const text = decodePlainText(file.dataUrl);
    if (text != null) {
      return `<pre class="attachment-text">${escapeHtml(truncateText(text))}</pre>`;
    }
  }
  return `<p><em>Bestandstype: ${escapeHtml(file.type || "onbekend")}. Dit bestandstype wordt niet automatisch weergegeven — open het originele bestand voor de inhoud.</em></p>`;
}

async function attachmentsSectionHtml(model: ExportModel): Promise<string> {
  let h = `<h1 id="sec-bijlagen">Bijlagen</h1>`;
  if (!model.attachments.length) {
    h += `<p><em>Geen bijlagen geüpload.</em></p>`;
    return h;
  }
  for (const a of model.attachments) {
    h += `<h2 id="${a.anchorId}">${escapeHtml(a.file.name)}</h2>`;
    h += `<p class="lbl">Hoort bij</p><p>${escapeHtml(a.lukName)} &rarr; ${escapeHtml(a.criterionTitle)} &rarr; ${escapeHtml(a.bewijsTitle)}</p>`;
    if (a.file.date) h += `<p class="lbl">Datum toegevoegd</p><p>${escapeHtml(a.file.date)}</p>`;
    h += await attachmentContentHtml(a.file);
    h += `<hr/>`;
  }
  return h;
}

async function buildBody(data: LogbookData, allSkills: SkillDef[], lukDefs: LukDef[], projectKey: string): Promise<string> {
  const model = buildExportModel(data, allSkills, lukDefs, projectKey);
  const pageBreak = `<div class="page-break"></div>`;
  return (
    coverHtml(model) +
    tocHtml(model) +
    skillsSectionHtml(model) +
    pageBreak +
    lukSectionHtml(model) +
    pageBreak +
    (await attachmentsSectionHtml(model))
  );
}

function buildFullHtml(body: string, title: string): string {
  const style = `
    body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;color:#333;margin:40px;}
    h1{color:#111;font-size:19pt;border-bottom:1px solid #ccc;padding-bottom:6px;margin:22pt 0 12pt;}
    h2{color:#111;font-size:14pt;margin-top:18pt;}
    h3{color:#111;font-size:12pt;margin-top:12pt;}
    a{color:#333;}
    .lbl{font-size:9pt;font-weight:bold;color:#777;text-transform:uppercase;letter-spacing:.05em;margin-top:8pt;}
    .crit-label{font-weight:bold;color:#444;margin-top:10pt;}
    p{margin:4pt 0;}
    hr{border:none;border-top:1px solid #e3e3e3;margin:12pt 0;}
    .page-break{page-break-after:always;}
    .cover{display:flex;flex-direction:column;align-items:center;justify-content:center;height:90vh;text-align:center;}
    .cover-kicker{font-size:12pt;color:#777;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4pt;}
    .cover-title{font-size:28pt;color:#111;margin-bottom:28pt;border:none;}
    .cover-meta{font-size:11pt;color:#333;border-collapse:collapse;}
    .cover-meta td{padding:4pt 10pt;text-align:left;}
    .cover-meta td:first-child{color:#777;text-transform:uppercase;font-size:9pt;letter-spacing:.05em;}
    .toc-h1{font-weight:bold;font-size:12pt;margin-top:14pt;}
    .toc-h2{margin-left:18pt;font-size:11pt;}
    .toc-h3{margin-left:36pt;font-size:10pt;color:#555;}
    .toc a{text-decoration:none;color:#333;}
    .attachment-image{display:block;max-width:440px;max-height:600px;border:1px solid #ccc;border-radius:4px;margin:8pt 0;}
    .attachment-doc{border-left:3px solid #ddd;padding:2pt 14pt;margin:8pt 0;background:#fafafa;}
    .attachment-text{white-space:pre-wrap;word-wrap:break-word;font-family:"Courier New",monospace;font-size:9pt;border-left:3px solid #ddd;padding:6pt 14pt;margin:8pt 0;background:#fafafa;}
    .attach-heading{font-weight:bold;color:#333;margin:8pt 0 2pt;}
  `;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>${style}</style></head><body>${body}</body></html>`;
}

// ─── PDF export via printToPDF ─────────────────────────────────────────────

export async function exportLogbookPdf(
  data: LogbookData,
  allSkills: SkillDef[],
  lukDefs: LukDef[],
  projectKey: string,
): Promise<{ success: boolean; canceled: boolean; filePath?: string; error?: string }> {
  const title = `Logboek_${resolveProjectName(data, projectKey)}`;
  const safeName = title.replace(/\s+/g, "_") + ".pdf";

  const result = await dialog.showSaveDialog({
    title: "Exporteer als PDF",
    defaultPath: safeName,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    const body = await buildBody(data, allSkills, lukDefs, projectKey);
    const fullHtml = buildFullHtml(body, title);

    // Write HTML to a temp file for the hidden window to load
    const tmpDir = os.tmpdir();
    const tmpHtml = path.join(tmpDir, `logbook-export-${Date.now()}.html`);
    await fs.writeFile(tmpHtml, fullHtml, "utf-8");

    // Create a hidden BrowserWindow to render the HTML and print to PDF
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
    });

    try {
      await win.loadFile(tmpHtml);
      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      await fs.writeFile(result.filePath, pdfBuffer);
      console.info(`[pdf-export] PDF exported to ${result.filePath}`);
      return { success: true, canceled: false, filePath: result.filePath };
    } finally {
      win.destroy();
      await fs.unlink(tmpHtml).catch(() => {});
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[pdf-export] PDF export failed: ${msg}`);
    return { success: false, canceled: false, error: msg };
  }
}

// ─── Word export via docx ──────────────────────────────────────────────────

function labelParagraph(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, color: "777777" })], spacing: { before: 120 } });
}

function textParagraph(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text })] });
}

function italicParagraph(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, italics: true })] });
}

function dividerParagraph(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: "" })],
    border: { bottom: { color: "E3E3E3", space: 1, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { after: 120 },
  });
}

function actionItemsParagraphs(items: MomentInfo["actionItems"]): Paragraph[] {
  if (!items.length) return [];
  const out: Paragraph[] = [labelParagraph("Actiepunten")];
  items.forEach((a) => {
    out.push(textParagraph(`${a.done ? "☑" : "☐"} ${a.text}`));
  });
  return out;
}

async function attachmentContentParagraphs(file: LukFile): Promise<Paragraph[]> {
  if (file.type?.startsWith("image/")) {
    const p = imageParagraphFromDataUrl(file.dataUrl);
    return p ? [p] : [italicParagraph("Kon deze afbeelding niet laden.")];
  }
  if (isWordDocFile(file)) {
    const html = await extractDocxHtml(file.dataUrl);
    if (html) {
      const paragraphs = htmlToDocxParagraphs(html);
      if (paragraphs.length) return paragraphs;
    }
    return [italicParagraph("Kon de tekst van dit Word-bestand niet automatisch uitlezen. Open het originele bestand voor de inhoud.")];
  }
  if (isPdfFile(file)) {
    const pages = await extractPdfText(file.dataUrl);
    if (pages && pages.some((p) => p)) {
      const out: Paragraph[] = [];
      pages.forEach((p, i) => {
        out.push(labelParagraph(`Pagina ${i + 1}`));
        out.push(p ? textParagraph(p) : italicParagraph("(geen doorzoekbare tekst op deze pagina)"));
      });
      return out;
    }
    return [italicParagraph("Kon de tekst van deze PDF niet automatisch uitlezen (mogelijk een scan zonder doorzoekbare tekst). Open het originele bestand voor de inhoud.")];
  }
  if (isPlainTextFile(file)) {
    const text = decodePlainText(file.dataUrl);
    if (text != null) {
      const lines = truncateText(text).split(/\r?\n/);
      return lines.map((line) => textParagraph(line));
    }
  }
  return [italicParagraph(`Bestandstype: ${file.type || "onbekend"}. Dit bestandstype wordt niet automatisch weergegeven — open het originele bestand voor de inhoud.`)];
}

async function buildWordDocument(
  data: LogbookData,
  allSkills: SkillDef[],
  lukDefs: LukDef[],
  projectKey: string,
): Promise<Document> {
  const model = buildExportModel(data, allSkills, lukDefs, projectKey);
  const children: Array<Paragraph | TableOfContents> = [];

  // ── Voorblad ──
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 200 }, children: [new TextRun({ text: "LOGBOEK", bold: true, size: 30 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: model.projectName, size: 44, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Student: ${model.studentName}`, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Geëxporteerd op: ${model.exportDateLabel}`, size: 22 })] }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ── Inhoudsopgave ──
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Inhoudsopgave")] }),
    new TableOfContents("Inhoudsopgave", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ── Skills ──
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Skills")] }));
  if (!model.skills.length) children.push(italicParagraph("Geen skills geselecteerd voor dit project."));
  model.skills.forEach((s) => {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(s.skill.name)] }));
    if (s.plan) {
      children.push(labelParagraph("Ontwikkelplan"), textParagraph(s.plan));
    }
    if (!s.moments.length) {
      children.push(italicParagraph("Nog geen ontwikkelmomenten gedocumenteerd."));
    } else {
      s.moments.forEach((m) => {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(m.title)] }));
        if (m.date) children.push(labelParagraph("Datum"), textParagraph(m.date));
        if (m.description) children.push(labelParagraph("Beschrijving"), textParagraph(m.description));
        if (m.reflection) children.push(labelParagraph("Reflectie"), textParagraph(m.reflection));
        children.push(...actionItemsParagraphs(m.actionItems));
        children.push(dividerParagraph());
      });
    }
  });

  // ── Leeruitkomsten ── (eigen pagina)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Leeruitkomsten")] }));
  if (!model.luks.length) children.push(italicParagraph("Geen leeruitkomsten geselecteerd voor dit project."));
  model.luks.forEach((l) => {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(l.luk.name)] }));
    if (l.luk.desc) children.push(textParagraph(l.luk.desc));
    l.criteria.forEach((c) => {
      children.push(new Paragraph({ children: [new TextRun({ text: c.criterion.title, bold: true })], spacing: { before: 160 } }));
      if (c.criterion.desc) children.push(textParagraph(c.criterion.desc));
      if (!c.bewijsstukken.length) {
        children.push(italicParagraph("Nog geen bewijsstukken."));
      } else {
        c.bewijsstukken.forEach((b) => {
          children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(b.title)] }));
          if (b.text) children.push(textParagraph(b.text));
          b.files.forEach((f) => {
            const anchor = slug(`bijlage_${f.id}`);
            children.push(
              new Paragraph({
                children: [
                  new InternalHyperlink({
                    anchor,
                    children: [new TextRun({ text: `📎 ${f.name} (zie Bijlagen)`, style: "Hyperlink" })],
                  }),
                ],
              }),
            );
          });
          children.push(dividerParagraph());
        });
      }
    });
  });

  // ── Bijlagen ── (eigen pagina)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Bijlagen")] }));
  if (!model.attachments.length) {
    children.push(italicParagraph("Geen bijlagen geüpload."));
  } else {
    for (const a of model.attachments) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new Bookmark({ id: a.anchorId, children: [new TextRun(a.file.name)] })],
        }),
      );
      children.push(labelParagraph("Hoort bij"), textParagraph(`${a.lukName} → ${a.criterionTitle} → ${a.bewijsTitle}`));
      if (a.file.date) children.push(labelParagraph("Datum toegevoegd"), textParagraph(a.file.date));
      children.push(...(await attachmentContentParagraphs(a.file)));
      children.push(dividerParagraph());
    }
  }

  return new Document({
    features: { updateFields: true },
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export async function exportLogbookWord(
  data: LogbookData,
  allSkills: SkillDef[],
  lukDefs: LukDef[],
  projectKey: string,
): Promise<{ success: boolean; canceled: boolean; filePath?: string; error?: string }> {
  const title = `Logboek_${resolveProjectName(data, projectKey)}`;
  const safeName = title.replace(/\s+/g, "_") + ".docx";

  const result = await dialog.showSaveDialog({
    title: "Exporteer als Word",
    defaultPath: safeName,
    filters: [{ name: "Word", extensions: ["docx"] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    const doc = await buildWordDocument(data, allSkills, lukDefs, projectKey);
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(result.filePath, buffer);
    console.info(`[pdf-export] Word exported to ${result.filePath}`);
    return { success: true, canceled: false, filePath: result.filePath };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[pdf-export] Word export failed: ${msg}`);
    return { success: false, canceled: false, error: msg };
  }
}

// Skill/LUK definitions are shared with the frontend; we inline minimal copies here
// to avoid importing renderer modules in the backend.
export const SKILL_DEFS_BACKEND: SkillDef[] = [
  { id: "s01", name: "Samenwerken", desc: "", ind: [] },
  { id: "s02", name: "Initiatief", desc: "", ind: [] },
  { id: "s03", name: "Aanpassingsvermogen", desc: "", ind: [] },
  { id: "s04", name: "Creativiteit", desc: "", ind: [] },
  { id: "s05", name: "Persoonlijk leiderschap", desc: "", ind: [] },
  { id: "s06", name: "Commercieel bewustzijn", desc: "", ind: [] },
  { id: "s07", name: "Verantwoordelijkheidsbesef", desc: "", ind: [] },
  { id: "s08", name: "Kritisch denken", desc: "", ind: [] },
  { id: "s09", name: "Probleemoplossend vermogen", desc: "", ind: [] },
  { id: "s10", name: "Doorzettingsvermogen", desc: "", ind: [] },
  { id: "s11", name: "Nieuwsgierigheid", desc: "", ind: [] },
  { id: "s12", name: "Communicatie", desc: "", ind: [] },
];

export const LUK_DEFS_BACKEND: LukDef[] = [
  { id: "luk1", name: "Business Innovation Strategy", desc: "", criteria: [
    { id: "c1", title: "1A – Innovatiestrategie formuleren", desc: "" },
    { id: "c2", title: "1B – Vraagstuk in kaart brengen", desc: "" },
    { id: "c3", title: "1C – Procesmethoden selecteren", desc: "" },
  ]},
  { id: "luk2", name: "Value Proposition", desc: "", criteria: [
    { id: "c1", title: "2A – Doelgroep- en stakeholdersonderzoek", desc: "" },
    { id: "c2", title: "2B – Vertalen naar waardepropositie", desc: "" },
  ]},
  { id: "luk3", name: "Business Concept Validation", desc: "", criteria: [
    { id: "c1", title: "3A – Prototype(s) ontwikkelen, testen en evalueren", desc: "" },
    { id: "c2", title: "3B – Inzichten vertalen naar modellen", desc: "" },
    { id: "c3", title: "3C – Samenwerking met stakeholders", desc: "" },
  ]},
  { id: "luk4", name: "Implementation", desc: "", criteria: [
    { id: "c1", title: "4A – Projectmanagement & innovatieproces", desc: "" },
    { id: "c2", title: "4B – Organiseren, motiveren en activeren", desc: "" },
    { id: "c3", title: "4C – Monitoren en evalueren", desc: "" },
    { id: "c4", title: "4D – Doorzettingsvermogen en verantwoordelijkheid", desc: "" },
  ]},
];
