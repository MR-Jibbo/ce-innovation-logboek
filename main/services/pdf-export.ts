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
} from "docx";
import type { LogbookData } from "./logbook-store.js";

interface SkillDef {
  id: string;
  name: string;
  desc: string;
  ind: string[];
}

interface LukDef {
  id: string;
  name: string;
  desc: string;
  criteria: Array<{ id: string; title: string; desc: string }>;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Shared HTML body builder ─────────────────────────────────────────────

function skillsHtml(data: LogbookData, allSkills: SkillDef[], key: string): string {
  const psi = data.selectedSkillIds[key] || [];
  const chosen = allSkills.filter((s) => psi.includes(s.id));
  const pe = data.entries.filter((e) => e.periode === key);
  let h = `<h2>Skills</h2>`;
  chosen.forEach((sk) => {
    const se = pe.filter((e) => e.skillId === sk.id);
    const d = data.skillData[key]?.[sk.id] || {};
    h += `<h3>${escapeHtml(sk.name)}</h3>`;
    if (d.plan) h += `<p class="lbl">Ontwikkelplan</p><p>${escapeHtml(d.plan)}</p>`;
    if (!se.length) {
      h += `<p><em>Nog geen ontwikkelmomenten gedocumenteerd.</em></p>`;
    } else {
      se.forEach((e) => {
        h += `<h3>&rarr; ${escapeHtml(e.title)}</h3>`;
        if (e.date) h += `<p class="lbl">Datum</p><p>${escapeHtml(e.date)}</p>`;
        if (e.description) h += `<p class="lbl">Beschrijving</p><p>${escapeHtml(e.description)}</p>`;
        if (e.reflection) h += `<p class="lbl">Reflectie</p><p>${escapeHtml(e.reflection)}</p>`;
        if (e.actionItems?.length) {
          h += `<p class="lbl">Actiepunten</p>`;
          e.actionItems.forEach((a) => {
            h += `<p>&#9675; ${escapeHtml(a.text)}</p>`;
          });
        }
        h += `<hr/>`;
      });
    }
  });
  return h;
}

function lukHtml(data: LogbookData, lukDefs: LukDef[], key: string): string {
  const ls = data.lukSelections[key] || [];
  const al = lukDefs.filter((l) => ls.includes(l.id));
  let h = `<h2>Leeruitkomsten</h2>`;
  al.forEach((luk) => {
    h += `<h3>${escapeHtml(luk.name)}</h3><p>${escapeHtml(luk.desc)}</p>`;
    luk.criteria.forEach((c) => {
      const ces = data.lukEntries.filter(
        (e) => e.periode === key && e.lukId === luk.id && e.criterionId === c.id,
      );
      h += `<p class="lbl">${escapeHtml(c.title)}</p><p>${escapeHtml(c.desc)}</p>`;
      if (!ces.length) {
        h += `<p><em>Nog geen bewijsstukken.</em></p>`;
      } else {
        ces.forEach((e) => {
          if (e.text) h += `<p>${escapeHtml(e.text)}</p>`;
          if (e.files?.length) {
            e.files.forEach((f) => {
              h += `<p>&#128206; ${escapeHtml(f.name)}</p>`;
            });
          }
          h += `<hr/>`;
        });
      }
    });
  });
  return h;
}

function buildBody(data: LogbookData, allSkills: SkillDef[], lukDefs: LukDef[], projectKey: string): string {
  return `<h1>Logboek, ${escapeHtml(projectKey)}</h1>${skillsHtml(data, allSkills, projectKey)}${lukHtml(data, lukDefs, projectKey)}`;
}

function buildFullHtml(body: string, title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;color:#454545;margin:40px;}h1{color:#000;font-size:18pt;border-bottom:2px solid #E50056;padding-bottom:6px;margin-bottom:14pt;}h2{color:#E50056;font-size:14pt;margin-top:16pt;}h3{color:#f97316;font-size:12pt;}.lbl{font-size:9pt;font-weight:bold;color:#919191;text-transform:uppercase;letter-spacing:.05em;}p{margin:4pt 0;}hr{border:none;border-top:1px solid #E3E3E3;margin:10pt 0;}</style></head><body>${body}</body></html>`;
}

// ─── PDF export via printToPDF ─────────────────────────────────────────────

export async function exportLogbookPdf(
  data: LogbookData,
  allSkills: SkillDef[],
  lukDefs: LukDef[],
  projectKey: string,
): Promise<{ success: boolean; canceled: boolean; filePath?: string; error?: string }> {
  const title = `Logboek_${projectKey}`;
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
    const body = buildBody(data, allSkills, lukDefs, projectKey);
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

function buildWordDocument(
  data: LogbookData,
  allSkills: SkillDef[],
  lukDefs: LukDef[],
  projectKey: string,
): Document {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: `Logboek, ${projectKey}`, bold: true })],
      border: { bottom: { color: "E50056", space: 1, style: BorderStyle.SINGLE, size: 6 } },
    }),
  );

  // Skills section
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "Skills", color: "E50056", bold: true })],
    }),
  );

  const psi = data.selectedSkillIds[projectKey] || [];
  const chosen = allSkills.filter((s) => psi.includes(s.id));
  const pe = data.entries.filter((e) => e.periode === projectKey);

  chosen.forEach((sk) => {
    const se = pe.filter((e) => e.skillId === sk.id);
    const d = data.skillData[projectKey]?.[sk.id] || {};

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: sk.name, color: "f97316", bold: true })],
      }),
    );

    if (d.plan) {
      children.push(new Paragraph({ children: [new TextRun({ text: "Ontwikkelplan", bold: true, size: 18, color: "919191" })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: d.plan })] }));
    }

    if (!se.length) {
      children.push(new Paragraph({ children: [new TextRun({ text: "Nog geen ontwikkelmomenten gedocumenteerd.", italics: true })] }));
    } else {
      se.forEach((e) => {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: `→ ${e.title}`, color: "f97316", bold: true })],
          }),
        );
        if (e.date) {
          children.push(new Paragraph({ children: [new TextRun({ text: "Datum", bold: true, size: 18, color: "919191" })] }));
          children.push(new Paragraph({ children: [new TextRun({ text: e.date })] }));
        }
        if (e.description) {
          children.push(new Paragraph({ children: [new TextRun({ text: "Beschrijving", bold: true, size: 18, color: "919191" })] }));
          children.push(new Paragraph({ children: [new TextRun({ text: e.description })] }));
        }
        if (e.reflection) {
          children.push(new Paragraph({ children: [new TextRun({ text: "Reflectie", bold: true, size: 18, color: "919191" })] }));
          children.push(new Paragraph({ children: [new TextRun({ text: e.reflection })] }));
        }
        if (e.actionItems?.length) {
          children.push(new Paragraph({ children: [new TextRun({ text: "Actiepunten", bold: true, size: 18, color: "919191" })] }));
          e.actionItems.forEach((a) => {
            children.push(new Paragraph({ children: [new TextRun({ text: `○ ${a.text}` })] }));
          });
        }
        children.push(new Paragraph({ children: [new TextRun({ text: "" })], border: { bottom: { color: "E3E3E3", space: 1, style: BorderStyle.SINGLE, size: 6 } } }));
      });
    }
  });

  // LUK section
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "Leeruitkomsten", color: "E50056", bold: true })],
    }),
  );

  const ls = data.lukSelections[projectKey] || [];
  const al = lukDefs.filter((l) => ls.includes(l.id));

  al.forEach((luk) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: luk.name, color: "f97316", bold: true })],
      }),
    );
    if (luk.desc) {
      children.push(new Paragraph({ children: [new TextRun({ text: luk.desc })] }));
    }

    luk.criteria.forEach((c) => {
      const ces = data.lukEntries.filter(
        (e) => e.periode === projectKey && e.lukId === luk.id && e.criterionId === c.id,
      );

      children.push(new Paragraph({ children: [new TextRun({ text: c.title, bold: true, size: 18, color: "919191" })] }));
      if (c.desc) {
        children.push(new Paragraph({ children: [new TextRun({ text: c.desc })] }));
      }

      if (!ces.length) {
        children.push(new Paragraph({ children: [new TextRun({ text: "Nog geen bewijsstukken.", italics: true })] }));
      } else {
        ces.forEach((e) => {
          if (e.text) {
            children.push(new Paragraph({ children: [new TextRun({ text: e.text })] }));
          }
          if (e.files?.length) {
            e.files.forEach((f) => {
              children.push(new Paragraph({ children: [new TextRun({ text: `📎 ${f.name}` })] }));
            });
          }
          children.push(new Paragraph({ children: [new TextRun({ text: "" })], border: { bottom: { color: "E3E3E3", space: 1, style: BorderStyle.SINGLE, size: 6 } } }));
        });
      }
    });
  });

  return new Document({
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
  const title = `Logboek_${projectKey}`;
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
    const doc = buildWordDocument(data, allSkills, lukDefs, projectKey);
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
