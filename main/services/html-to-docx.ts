/**
 * Converts the simplified HTML that mammoth produces from an uploaded .docx
 * bewijsstuk into a list of `docx` Paragraphs, so the original file's text
 * — with its basic formatting (bold/italic/underline, headings, lists) —
 * can be embedded directly into the exported logboek Word document.
 *
 * This is deliberately not a general-purpose HTML-to-docx converter: it
 * only needs to understand the small, well-formed tag set mammoth emits
 * (p, h1-h6, strong/b, em/i, u, ul/ol/li, br, img, a, table/tr/td/th).
 * Anything unrecognized is flattened to plain text rather than dropped, so
 * content is never silently lost.
 */

import { Parser } from "htmlparser2";
import { Paragraph, TextRun, ImageRun } from "docx";
import { imageSize } from "image-size";

interface TextStyle {
  bold?: boolean;
  italics?: boolean;
  underline?: { type: "single" } | undefined;
}

interface DomNode {
  tag: string;
  attribs: Record<string, string>;
  children: Array<DomNode | string>;
}

/** Parses mammoth's HTML into a tiny DOM tree (no browser DOM available in Node). */
function parseHtml(html: string): DomNode {
  const root: DomNode = { tag: "root", attribs: {}, children: [] };
  const stack: DomNode[] = [root];
  const voidTags = new Set(["br", "img", "hr"]);

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const node: DomNode = { tag: name, attribs: attribs as Record<string, string>, children: [] };
        stack[stack.length - 1].children.push(node);
        if (!voidTags.has(name)) stack.push(node);
      },
      ontext(text) {
        stack[stack.length - 1].children.push(text);
      },
      onclosetag(name) {
        if (voidTags.has(name)) return;
        // Pop back to (and including) the matching open tag, tolerating any
        // mismatched/unclosed tags mammoth's output is unlikely to have.
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === name) {
            stack.length = i;
            return;
          }
        }
      },
    },
    { decodeEntities: true, xmlMode: false },
  );
  parser.write(html);
  parser.end();
  return root;
}

/** Plain-text extraction (no styling) — used only for the flattened-table fallback. */
function extractPlainText(node: DomNode | string): string {
  if (typeof node === "string") return node;
  if (node.tag === "br") return " ";
  return node.children.map(extractPlainText).join("");
}

const MAX_IMAGE_WIDTH_PX = 420;

/** Splits a `data:<mime>;base64,<data>` URI into its MIME type and raw bytes. */
export function parseDataUri(src: string): { mime: string; buffer: Buffer } | null {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(src);
  if (!m) return null;
  return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
}

function docxImageType(mime: string): "jpg" | "png" | "gif" | "bmp" | null {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/gif") return "gif";
  if (mime === "image/bmp") return "bmp";
  return null;
}

/** Builds a single-image Paragraph from a `data:` URI, scaled down to fit the page. Returns null if the type/data is unsupported. */
export function imageParagraphFromDataUrl(src: string): Paragraph | null {
  return imageParagraph(src);
}

function imageParagraph(src: string): Paragraph | null {
  const parsed = parseDataUri(src);
  if (!parsed) return null;
  const type = docxImageType(parsed.mime);
  if (!type) return null;
  try {
    const dims = imageSize(parsed.buffer);
    if (!dims.width || !dims.height) return null;
    let width = dims.width;
    let height = dims.height;
    if (width > MAX_IMAGE_WIDTH_PX) {
      height = Math.round(height * (MAX_IMAGE_WIDTH_PX / width));
      width = MAX_IMAGE_WIDTH_PX;
    }
    return new Paragraph({
      children: [new ImageRun({ type, data: parsed.buffer, transformation: { width, height } })],
    });
  } catch {
    return null;
  }
}

/** Collects the plain runs (with inline bold/italic/underline) inside an inline node. */
function collectRuns(node: DomNode | string, style: TextStyle, runs: TextRun[]): void {
  if (typeof node === "string") {
    if (node.length === 0) return;
    runs.push(new TextRun({ text: node, ...style }));
    return;
  }
  switch (node.tag) {
    case "strong":
    case "b":
      node.children.forEach((c) => collectRuns(c, { ...style, bold: true }, runs));
      return;
    case "em":
    case "i":
      node.children.forEach((c) => collectRuns(c, { ...style, italics: true }, runs));
      return;
    case "u":
      node.children.forEach((c) => collectRuns(c, { ...style, underline: { type: "single" } }, runs));
      return;
    case "br":
      runs.push(new TextRun({ text: "", break: 1 }));
      return;
    case "a":
      node.children.forEach((c) => collectRuns(c, style, runs));
      return;
    default:
      node.children.forEach((c) => collectRuns(c, style, runs));
  }
}

/** Walks the block-level tree, producing one or more Paragraphs per block. */
function blockToParagraphs(node: DomNode, listPrefix: string | null, out: Paragraph[]): void {
  switch (node.tag) {
    case "p": {
      const runs: TextRun[] = [];
      node.children.forEach((c) => collectRuns(c, {}, runs));
      if (runs.length === 0) return; // mammoth emits empty <p></p> for blank lines
      out.push(new Paragraph({ children: listPrefix ? [new TextRun(listPrefix), ...runs] : runs }));
      return;
    }
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const runs: TextRun[] = [];
      node.children.forEach((c) => collectRuns(c, { bold: true }, runs));
      if (runs.length === 0) return;
      out.push(new Paragraph({ children: runs, spacing: { before: 120, after: 60 } }));
      return;
    }
    case "ul":
      node.children.forEach((c) => {
        if (typeof c !== "string" && c.tag === "li") blockToParagraphs(c, "•  ", out);
      });
      return;
    case "ol": {
      let i = 1;
      node.children.forEach((c) => {
        if (typeof c !== "string" && c.tag === "li") {
          blockToParagraphs(c, `${i}.  `, out);
          i += 1;
        }
      });
      return;
    }
    case "li": {
      // A <li> can contain inline text directly, or a nested block (rare in
      // mammoth's output) — handle both.
      const hasBlockChild = node.children.some((c) => typeof c !== "string" && ["p", "ul", "ol"].includes(c.tag));
      if (!hasBlockChild) {
        const runs: TextRun[] = [];
        node.children.forEach((c) => collectRuns(c, {}, runs));
        if (runs.length) out.push(new Paragraph({ children: listPrefix ? [new TextRun(listPrefix), ...runs] : runs }));
        return;
      }
      node.children.forEach((c) => {
        if (typeof c !== "string") blockToParagraphs(c, listPrefix, out);
      });
      return;
    }
    case "img": {
      const src = node.attribs.src;
      if (src) {
        const p = imageParagraph(src);
        if (p) out.push(p);
      }
      return;
    }
    case "table":
      // No real table layout — flatten rows to "cell | cell" lines so the
      // content is at least fully preserved and readable.
      node.children.forEach((row) => {
        if (typeof row === "string" || row.tag !== "tr") return;
        const cells: string[] = [];
        row.children.forEach((cell) => {
          if (typeof cell === "string" || (cell.tag !== "td" && cell.tag !== "th")) return;
          cells.push(extractPlainText(cell).trim());
        });
        if (cells.length) out.push(new Paragraph({ children: [new TextRun(cells.join("  |  "))] }));
      });
      return;
    default:
      // Unknown block-level wrapper — recurse into children so nothing is lost.
      node.children.forEach((c) => {
        if (typeof c !== "string") blockToParagraphs(c, listPrefix, out);
      });
  }
}

/**
 * Converts mammoth-simplified HTML into docx Paragraphs. Never throws —
 * malformed/unexpected input just yields fewer paragraphs, since this runs
 * on arbitrary user-uploaded files.
 */
export function htmlToDocxParagraphs(html: string): Paragraph[] {
  try {
    const root = parseHtml(html);
    const out: Paragraph[] = [];
    root.children.forEach((c) => {
      if (typeof c !== "string") blockToParagraphs(c, null, out);
    });
    return out;
  } catch {
    return [];
  }
}
