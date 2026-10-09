// VeriFi AI — Track 03 submission deck (pitch 10 + architecture 3 + appendix 2)
// Build: node build_deck.js  → VeriFi-AI_Track03_Submission.pptx
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const lu = require("react-icons/lu");

// ───────────── EDIT THIS BLOCK: team details ─────────────
const TEAM = {
  name: "[Team name]",
  members: [
    ["[Member 1]", "Backend & security"],
    ["[Member 2]", "Graph & ingestion"],
    ["[Member 3]", "Frontend & approver app"],
    ["[Member 4]", "Evidence, demo & pitch"],
  ],
};
const OUT = process.argv[2] || "VeriFi-AI_Track03_Submission.pptx";
const SKILL = process.env.PPTX_SKILL_DIR;

// ───────────── Theme ─────────────
const HEX = {
  ink: "0E1B24", white: "FFFFFF", navy: "16293A", mist: "F2F5F6",
  teal: "00876F", amber: "E09A1A", crimson: "C2353F", muted: "5B6B75",
  amberText: "9A6400", line: "D5DEE2",
};
const THEME = {
  name: "VeriFi",
  headFontFace: "Bahnschrift SemiBold",
  bodyFontFace: "Segoe UI",
  colors: {
    dk1: HEX.ink, lt1: HEX.white, dk2: HEX.navy, lt2: HEX.mist,
    accent1: HEX.teal, accent2: HEX.amber, accent3: HEX.crimson, accent4: HEX.muted,
    accent5: HEX.amberText, accent6: HEX.line, hlink: HEX.teal, folHlink: HEX.muted,
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "VeriFi AI — Track 03 submission";
pres.author = "VeriFi AI team";
const C = pres.SchemeColor;
const S = pres.ShapeType;
const COL = {
  ink: C.text1, white: C.background1, navy: C.text2, mist: C.background2,
  teal: C.accent1, amber: C.accent2, crimson: C.accent3, muted: C.accent4,
  amberText: C.accent5, line: C.accent6,
};

// ───────────── Layouts ─────────────
pres.defineSlideMaster({
  title: "DARK",
  background: { color: COL.ink },
  objects: [],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: COL.white },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { text: { text: "VeriFi AI  ·  Track 03 submission  ·  All scenario names and data are synthetic",
      options: { x: 0.6, y: 7.02, w: 9, h: 0.3, fontSize: 10, color: COL.muted, margin: 0 } } },
    { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.36, w: 12.1, h: 0.3,
      fontSize: 11, bold: true, color: COL.amberText, charSpacing: 1.5, margin: 0, valign: "top" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.66, w: 12.1, h: 0.75,
      fontSize: 28, color: COL.ink, margin: 0, valign: "top", align: "left" }, text: "" } },
  ],
  slideNumber: { x: 12.1, y: 7.02, w: 0.6, h: 0.3, fontSize: 10, color: COL.muted, align: "right" },
});

// ───────────── Helpers ─────────────
const ICONS = {};
async function loadIcon(name, hex) {
  const key = name + hex;
  if (ICONS[key]) return ICONS[key];
  const Comp = lu[name];
  if (!Comp) throw new Error("Missing icon " + name);
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + hex, size: 256, strokeWidth: 2 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  ICONS[key] = "image/png;base64," + buf.toString("base64");
  return ICONS[key];
}
function txt(slide, text, o) {
  slide.addText(text, Object.assign({ isTextBox: true, margin: 0, fontSize: 14, color: COL.ink, valign: "top", fontFace: THEME.bodyFontFace }, o));
}
function head(slide, text, o) {
  txt(slide, text, Object.assign({ fontFace: THEME.headFontFace, fontSize: 18 }, o));
}
function card(slide, x, y, w, h, fill, extra) {
  slide.addShape(S.roundRect, Object.assign({ x, y, w, h, fill: { color: fill || COL.mist }, line: { color: fill || COL.mist }, rectRadius: 0.08 }, extra || {}));
}
function tint(slide, x, y, w, h, color, transparency) {
  slide.addShape(S.roundRect, { x, y, w, h, fill: { color, transparency: transparency ?? 88 }, line: { color, transparency: 100 }, rectRadius: 0.08 });
}
async function iconCircle(slide, name, x, y, d, fill, iconHex) {
  slide.addShape(S.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  const pad = d * 0.24;
  slide.addImage({ data: await loadIcon(name, iconHex), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
}
function pill(slide, text, x, y, w, h, fill, color, o) {
  slide.addShape(S.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: h / 2 });
  txt(slide, text, Object.assign({ x, y, w, h, align: "center", valign: "middle", fontSize: 12, bold: true, color }, o));
}
function arrowR(slide, x, y, w, h, color) {
  slide.addShape(S.rightArrow, { x, y, w, h, fill: { color: color || COL.muted }, line: { color: color || COL.muted } });
}
function arrowD(slide, x, y, w, h, color) {
  slide.addShape(S.downArrow, { x, y, w, h, fill: { color: color || COL.muted }, line: { color: color || COL.muted } });
}
function bullets(items, o) {
  return items.map((t, i) => ({
    text: t,
    options: Object.assign({ bullet: { indent: 14 }, paraSpaceAfter: 4, breakLine: i < items.length - 1 }, o || {}),
  }));
}
function content(section, kicker, title) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(kicker, { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  return s;
}
const SEC_PITCH = "Pitch deck", SEC_ARCH = "Architectural overview", SEC_APP = "Appendix";

(async () => {
  // ════════════════ PITCH 01 — Title / team / challenge ════════════════
  pres.addSection({ title: SEC_PITCH });
  {
    const s = pres.addSlide({ masterName: "DARK", sectionTitle: SEC_PITCH });
    txt(s, "PITCH DECK  ·  01 / 10  ·  TEAM, CHALLENGE & SOLUTION", { x: 0.7, y: 0.55, w: 7.5, h: 0.3, fontSize: 11, bold: true, color: COL.amber, charSpacing: 1.5 });
    await iconCircle(s, "LuShieldCheck", 0.7, 1.15, 0.85, COL.amber, HEX.ink);
    head(s, "VeriFi AI", { x: 1.75, y: 1.12, w: 6, h: 0.95, fontSize: 48, color: COL.white, valign: "middle" });
    txt(s, "VeriFi holds a risky payment until the person the instruction claims to come from confirms it on their own phone, with a passkey bound to that exact amount and account.",
      { x: 0.7, y: 2.4, w: 7.3, h: 1.65, fontSize: 21, color: COL.white });
    txt(s, "Detectors tell you a call might be fake. VeriFi makes sure money can't move because of it.",
      { x: 0.7, y: 4.15, w: 7.3, h: 0.75, fontSize: 16, italic: true, color: COL.amber });
    const steps = [["01  Trace", "where the account came from"], ["02  Decide", "explicit rules + bounded score"], ["03  Confirm", "real authority, own phone"], ["04  Respond", "signed evidence, 1930 pack"]];
    steps.forEach(([a, b], i) => {
      const x = 0.7 + i * 1.86;
      card(s, x, 5.55, 1.74, 1.15, COL.navy);
      txt(s, a, { x: x + 0.15, y: 5.68, w: 1.5, h: 0.3, fontSize: 13, bold: true, color: COL.amber });
      txt(s, b, { x: x + 0.15, y: 6.0, w: 1.5, h: 0.6, fontSize: 11, color: COL.line });
    });
    // challenge card
    card(s, 8.55, 0.55, 4.18, 2.85, COL.navy);
    txt(s, "SELECTED CHALLENGE STATEMENT", { x: 8.8, y: 0.78, w: 3.8, h: 0.3, fontSize: 11, bold: true, color: COL.amber, charSpacing: 1 });
    txt(s, "Track 03: Help people and institutions verify financial communications, detect manipulation, and create an actionable path for review, reporting, or response.",
      { x: 8.8, y: 1.15, w: 3.75, h: 2.1, fontSize: 15, color: COL.white });
    // team card
    card(s, 8.55, 3.6, 4.18, 3.1, COL.navy);
    txt(s, "TEAM", { x: 8.8, y: 3.82, w: 3.8, h: 0.3, fontSize: 11, bold: true, color: COL.amber, charSpacing: 1 });
    head(s, TEAM.name, { x: 8.8, y: 4.12, w: 3.8, h: 0.45, fontSize: 20, color: COL.white });
    TEAM.members.forEach(([n, r], i) => {
      const y = 4.72 + i * 0.47;
      txt(s, [{ text: n, options: { bold: true, color: COL.white } }, { text: "  ·  " + r, options: { color: COL.line } }],
        { x: 8.8, y, w: 3.8, h: 0.4, fontSize: 13, valign: "middle" });
    });
  }

  // ════════════════ PITCH 02 — User, threat, harm ════════════════
  {
    const s = content(SEC_PITCH, "PITCH DECK  ·  02 / 10  ·  USER, THREAT SCENARIO & HARM", "A deepfaked CFO can talk honest staff into wiring crores");
    const steps = [
      ["LuMail", "Lookalike email", "From kestrelinfra-group.co, not kestrelinfra.com. The attacker owns the domain, so SPF, DKIM and DMARC all pass."],
      ["LuVideo", "Deepfake call", "A Zoom call with a face- and voice-cloned \"CFO\": \"Confidential acquisition. Pay today, tell no one.\""],
      ["LuLandmark", "New account", "₹5 Cr to \"Meridian Advisory LLP\", an account the company has never paid before."],
      ["LuSend", "Money leaves", "The convinced AP maker releases it in net banking. Recovery depends on reporting within hours."],
    ];
    for (let i = 0; i < 4; i++) {
      const [ic, t, b] = steps[i];
      const x = 0.6 + i * 3.08;
      card(s, x, 1.65, 2.86, 2.15);
      await iconCircle(s, ic, x + 0.22, 1.85, 0.55, COL.crimson, HEX.white);
      txt(s, String(i + 1), { x: x + 2.35, y: 1.85, w: 0.3, h: 0.4, fontSize: 20, bold: true, color: COL.line, align: "right", fontFace: THEME.headFontFace });
      head(s, t, { x: x + 0.22, y: 2.5, w: 2.45, h: 0.35, fontSize: 16 });
      txt(s, b, { x: x + 0.22, y: 2.88, w: 2.45, h: 0.85, fontSize: 12, color: COL.ink });
      if (i < 3) arrowR(s, x + 2.9, 2.6, 0.14, 0.24, COL.crimson);
    }
    // users
    txt(s, "WHO WE PROTECT", { x: 0.6, y: 4.05, w: 6, h: 0.3, fontSize: 11, bold: true, color: COL.amberText, charSpacing: 1.5 });
    const users = [
      ["LuUser", "AP / treasury maker", "The deceived user. Releases payments and needs zero friction on normal days."],
      ["LuUserCheck", "CFO / authority", "The impersonated person. Needs to confirm or deny in seconds, from anywhere."],
      ["LuSearch", "Fraud analyst", "Investigates holds and must report to 1930 within the golden hour."],
    ];
    for (let i = 0; i < 3; i++) {
      const [ic, r, d] = users[i];
      const y = 4.45 + i * 0.8;
      await iconCircle(s, ic, 0.6, y, 0.55, COL.teal, HEX.white);
      txt(s, [{ text: r, options: { bold: true, fontSize: 14, breakLine: true } }, { text: d, options: { fontSize: 12, color: COL.muted } }],
        { x: 1.35, y: y - 0.04, w: 5.6, h: 0.72 });
    }
    // harm panel
    card(s, 7.45, 4.05, 5.25, 2.8, COL.ink);
    txt(s, "THE HARM, IN THE PUBLIC RECORD", { x: 7.7, y: 4.25, w: 4.8, h: 0.28, fontSize: 11, bold: true, color: COL.amber, charSpacing: 1 });
    head(s, "US$25.6M", { x: 7.7, y: 4.55, w: 4.8, h: 0.7, fontSize: 40, color: COL.white });
    txt(s, "Arup, Hong Kong office, Jan 2024: deepfake CFO video call", { x: 7.7, y: 5.25, w: 4.8, h: 0.3, fontSize: 13, color: COL.white });
    [["15", "transfers"], ["5", "accounts"], ["~1 week", "duration"]].forEach(([v, l], i) => {
      const x = 7.7 + i * 1.6;
      head(s, v, { x, y: 5.62, w: 1.5, h: 0.4, fontSize: 20, color: COL.amber });
      txt(s, l, { x, y: 6.0, w: 1.5, h: 0.25, fontSize: 11, color: COL.line });
    });
    txt(s, "Caught only when the employee checked with headquarters. Source: SCMP, May 2024.", { x: 7.7, y: 6.35, w: 4.85, h: 0.4, fontSize: 11, italic: true, color: COL.line });
  }

  // ════════════════ PITCH 03 — Journey, flow, differentiation ════════════════
  {
    const s = content(SEC_PITCH, "PITCH DECK  ·  03 / 10  ·  CURRENT JOURNEY, PRODUCT FLOW & DIFFERENTIATION", "VeriFi connects the conversation to the payment");
    const lanes = [
      { y: 1.6, label: "TODAY", sub: "Fraud succeeds", col: COL.crimson, steps: ["Lookalike email passes SPF / DKIM", "Deepfake \"CFO\" on Zoom", "AP releases ₹5 Cr in net banking", "Bank executes: no context", "Found days later, money gone"] },
      { y: 2.75, label: "WITH VERIFI", sub: "Fraud held", col: COL.teal, steps: ["Email + meeting ingested into lineage graph", "Release request hits the VeriFi gate", "Account traced to a new lookalike domain", "Real CFO's phone: Deny", "Held, evidence sealed, 1930 pack ready"] },
    ];
    lanes.forEach((ln) => {
      txt(s, [{ text: ln.label, options: { bold: true, color: ln.col, fontSize: 13, breakLine: true } }, { text: ln.sub, options: { color: COL.muted, fontSize: 11 } }],
        { x: 0.6, y: ln.y + 0.2, w: 1.55, h: 0.6 });
      ln.steps.forEach((t, i) => {
        const x = 2.25 + i * 2.08;
        const last = i === 4;
        s.addShape(S.roundRect, { x, y: ln.y, w: 1.9, h: 0.95, fill: { color: last ? ln.col : COL.mist }, line: { color: last ? ln.col : COL.mist }, rectRadius: 0.08 });
        txt(s, t, { x: x + 0.1, y: ln.y, w: 1.7, h: 0.95, fontSize: 12, align: "center", valign: "middle", color: last ? COL.white : COL.ink, bold: last });
        if (i < 4) arrowR(s, x + 1.93, ln.y + 0.36, 0.13, 0.22, ln.col);
      });
    });
    txt(s, "HOW THIS DIFFERS", { x: 0.6, y: 3.98, w: 6, h: 0.3, fontSize: 11, bold: true, color: COL.amberText, charSpacing: 1.5 });
    const H = (t) => ({ text: t, options: { bold: true, color: COL.ink, fill: { color: HEX.mist } } });
    const cell = (t) => {
      const c = t.startsWith("Yes") ? HEX.teal : t.startsWith("No") ? HEX.crimson : HEX.amberText;
      return { text: t, options: { color: c, bold: t.startsWith("Yes") } };
    };
    const rows = [
      [H("Approach"), H("Sees the instruction?"), H("Sees the payment?"), H("Holds a perfect deepfake?"), H("Proof from the real authority?")],
      ["Deepfake detectors (e.g. Reality Defender, Pindrop)", "Partial: media only", "No", "No", "No"],
      ["Email security / BEC filters", "Partial: email only", "No", "No", "No"],
      ["Payee verification (e.g. Eftsure)", "No", "Yes", "Partial: flags unknown payees", "No"],
      ["RBI name lookup (NEFT / RTGS, 2025)", "No", "Yes", "No: fraudster supplies the name", "No"],
    ].map((r, i) => (i === 0 ? r : [{ text: r[0], options: { color: COL.ink } }, ...r.slice(1).map(cell)]));
    const v = (t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.teal } } });
    rows.push([v("VeriFi AI"), v("Yes: lineage graph"), v("Yes: release gate"), v("Yes: provenance + passkey"), v("Yes: transaction-bound")]);
    s.addTable(rows, { x: 0.6, y: 4.32, w: 12.1, colW: [3.5, 2.15, 1.85, 2.4, 2.2], fontSize: 12, fontFace: THEME.bodyFontFace,
      border: { type: "solid", pt: 0.75, color: HEX.line }, rowH: 0.36, valign: "middle", margin: [0.03, 0.08, 0.03, 0.08] });
  }

  // ════════════════ PITCH 04 — Core decision approach ════════════════
  {
    const s = content(SEC_PITCH, "PITCH DECK  ·  04 / 10  ·  CORE DETECTION & DECISION APPROACH", "Every fraud ends in an account, so we trace the account");
    const cols = [
      { x: 0.6, n: "1", t: "Trace", ic: "LuNetwork", fill: COL.teal, q: "Where did this beneficiary account first enter the company?" },
      { x: 4.7, n: "2", t: "Decide", ic: "LuScale", fill: COL.amber, q: "Do explicit rules or the bounded score demand more assurance?" },
      { x: 8.8, n: "3", t: "Confirm", ic: "LuFingerprint", fill: COL.ink, q: "Who must confirm, and how strongly?" },
    ];
    for (const c of cols) {
      card(s, c.x, 1.6, 3.9, 5.25);
      await iconCircle(s, c.ic, c.x + 0.25, 1.82, 0.62, c.fill, c.fill === COL.amber ? HEX.ink : HEX.white);
      head(s, c.n + "  " + c.t, { x: c.x + 1.0, y: 1.84, w: 2.7, h: 0.55, fontSize: 24, valign: "middle" });
      txt(s, c.q, { x: c.x + 0.25, y: 2.58, w: 3.45, h: 0.55, fontSize: 13, bold: true });
    }
    // Trace
    const chain = ["kestrelinfra-group.co · 4 days old", "Email: \"confidential acquisition\"", "Zoom: external \"CFO\"", "A/c ••7812 first seen in that email", "₹5 Cr payment to A/c ••7812"];
    chain.forEach((t, i) => {
      const y = 3.2 + i * 0.42;
      const last = i === chain.length - 1;
      s.addShape(S.roundRect, { x: 0.85, y, w: 3.4, h: 0.32, fill: { color: last ? COL.teal : COL.white }, line: { color: last ? COL.teal : COL.line }, rectRadius: 0.16 });
      txt(s, t, { x: 0.95, y, w: 3.2, h: 0.32, fontSize: 11, valign: "middle", color: last ? COL.white : COL.ink, bold: last });
    });
    txt(s, bullets(["Parsers: mail headers, Indian account / IFSC recognizers", "Domain intel: lookalikes + registration age", "LLM (Claude on Bedrock) adds intent and claims: it raises risk, never lowers it"]),
      { x: 0.85, y: 5.35, w: 3.5, h: 1.45, fontSize: 12 });
    // Decide
    s.addShape(S.roundRect, { x: 4.95, y: 3.2, w: 3.4, h: 0.95, fill: { color: COL.ink }, line: { color: COL.ink }, rectRadius: 0.08 });
    txt(s, [{ text: "R = 100 × (1 − Π (1 − max wᵢ·sᵢ))", options: { fontSize: 14, bold: true, color: COL.white, breakLine: true } },
      { text: "noisy-OR over signal groups, always 0–100", options: { fontSize: 11, color: COL.line } }],
      { x: 5.1, y: 3.27, w: 3.15, h: 0.85, valign: "middle" });
    const rules = [["R1", "New beneficiary, ≥ ₹10 L"], ["R2", "Account first seen in an outside message"], ["R3", "Vendor bank details recently changed"], ["R4", "Outsider claims to be an executive"], ["R5", "Several young accounts paid in 7 days"], ["R6", "Asked to bypass normal process"], ["R7", "Dependency down: fail safe"]];
    txt(s, rules.flatMap(([r, d], i) => [{ text: r + "  ", options: { bold: true, color: COL.amberText } }, { text: d, options: { color: COL.ink, breakLine: true, paraSpaceAfter: 3 } }])
      .concat([{ text: "R4, R5 and R2 with a lookalike or new domain → T2; the rest → T1.", options: { color: COL.muted, fontSize: 11 } }]),
      { x: 4.95, y: 4.3, w: 3.45, h: 2.5, fontSize: 12 });
    // Confirm
    const tiers = [["T0", "Pass: released, no friction", COL.teal, COL.white], ["T1", "One authority approves", COL.amber, COL.ink], ["T2", "Two approve + cooling-off", COL.crimson, COL.white]];
    tiers.forEach(([t, d, f, c], i) => {
      const y = 3.2 + i * 0.5;
      pill(s, t, 9.05, y, 0.62, 0.36, f, c, { fontSize: 12 });
      txt(s, d, { x: 9.8, y, w: 2.75, h: 0.36, fontSize: 12, valign: "middle" });
    });
    txt(s, [{ text: "Confirmers = approval matrix ∪ claimed authority − requester", options: { bold: true, breakLine: true, paraSpaceAfter: 6 } },
      { text: "Any Deny or timeout → held for human review. The machine never auto-rejects.", options: { breakLine: true, paraSpaceAfter: 6 } },
      { text: "Rules decide, so every outcome is auditable; the score explains it.", options: { color: COL.muted } }],
      { x: 9.05, y: 4.85, w: 3.45, h: 1.95, fontSize: 12 });
  }

  // ════════════════ PITCH 05 — Product flow: confirmation ════════════════
  {
    const s = content(SEC_PITCH, "PITCH DECK  ·  05 / 10  ·  PRODUCT FLOW: AUTHORITY CONFIRMATION", "The real CFO confirms on their own phone");
    // phone
    s.addShape(S.roundRect, { x: 0.9, y: 1.6, w: 3.3, h: 5.25, fill: { color: COL.ink }, line: { color: COL.ink }, rectRadius: 0.3 });
    s.addShape(S.roundRect, { x: 1.05, y: 1.9, w: 3.0, h: 4.7, fill: { color: COL.white }, line: { color: COL.white }, rectRadius: 0.15 });
    const px = 1.22, pw = 2.66;
    txt(s, "VERIFI · CONFIRMATION REQUESTED", { x: px, y: 2.05, w: pw, h: 0.25, fontSize: 10, bold: true, color: COL.teal });
    head(s, "₹5,00,00,000", { x: px, y: 2.32, w: pw, h: 0.45, fontSize: 22 });
    txt(s, [{ text: "→ Meridian Advisory LLP", options: { bold: true, breakLine: true } }, { text: "A/c ••••7812 · HDFC0001234", options: { color: COL.muted, breakLine: true } }, { text: "Requested by Priya Sharma (AP)", options: { color: COL.muted } }],
      { x: px, y: 2.8, w: pw, h: 0.75, fontSize: 11 });
    tint(s, px - 0.05, 3.6, pw + 0.1, 1.45, COL.amber, 82);
    txt(s, [{ text: "Why you're being asked", options: { bold: true, breakLine: true } },
      { text: "Account first appeared 2 h ago in an email from kestrelinfra-group.co, a lookalike domain registered 4 days ago.", options: { bullet: { indent: 10 }, breakLine: true } },
      { text: "External Zoom participant shown as \"Rajesh Mehta (CFO)\".", options: { bullet: { indent: 10 } } }],
      { x: px + 0.05, y: 3.68, w: pw - 0.1, h: 1.38, fontSize: 10 });
    txt(s, "Did YOU instruct this payment?", { x: px, y: 5.2, w: pw, h: 0.3, fontSize: 11, bold: true });
    pill(s, "Deny", px, 5.58, 1.25, 0.42, COL.crimson, COL.white, { fontSize: 13 });
    pill(s, "Approve", px + 1.41, 5.58, 1.25, 0.42, COL.teal, COL.white, { fontSize: 13 });
    txt(s, "Code 7F3A-91C2 · matches the ERP screen", { x: px, y: 6.12, w: pw, h: 0.25, fontSize: 10, color: COL.muted, align: "center" });
    // properties
    const props = [
      ["LuRoute", "Routed to the authority", "Confirmers come from the customer's approval matrix plus whoever the message claims to be. The requester is always removed."],
      ["LuKeyRound", "Bound to this transaction", "challenge = SHA-256(transaction ‖ decision ‖ nonce). The signature covers amount, account and the Approve / Deny choice."],
      ["LuBadgeCheck", "What you see is what you sign", "The prompt is rendered from the exact object that was hashed. Cancel is never Approve."],
      ["LuSiren", "Deny becomes a case", "Payment held, incident opened, evidence signed, 1930 pack ready in under two minutes."],
    ];
    for (let i = 0; i < props.length; i++) {
      const [ic, h, b] = props[i];
      const y = 1.65 + i * 1.0;
      await iconCircle(s, ic, 4.85, y, 0.6, i === 3 ? COL.crimson : COL.teal, HEX.white);
      txt(s, [{ text: h, options: { bold: true, fontSize: 16, breakLine: true } }, { text: b, options: { fontSize: 13, color: COL.ink } }],
        { x: 5.65, y: y - 0.05, w: 7.05, h: 0.95 });
    }
    card(s, 4.85, 5.8, 7.85, 1.05, COL.ink);
    txt(s, "A fraudster can fake the CFO's face and voice. They can't produce the CFO's passkey signature.",
      { x: 5.1, y: 5.8, w: 7.4, h: 1.05, fontSize: 17, italic: true, color: COL.white, valign: "middle" });
  }

  // ════════════════ PITCH 06 — Worked example ════════════════
  {
    const s = content(SEC_PITCH, "PITCH DECK  ·  06 / 10  ·  DECISION IN ACTION (WORKED EXAMPLE)", "Detector fooled, payment still held");
    s.addChart(pres.ChartType.bar, [{
      name: "Contribution (w·s)",
      labels: ["Account provenance (seen in lookalike email)", "Sender identity (lookalike, 4-day-old domain)", "Meeting identity (external \"CFO\")", "Message pressure (urgency, secrecy)", "Deepfake detector (fooled: 0.12)"],
      values: [0.5, 0.45, 0.4, 0.24, 0.036],
    }], {
      x: 0.6, y: 1.6, w: 7.1, h: 3.55, barDir: "bar", catAxisOrientation: "maxMin",
      chartColors: [HEX.teal, HEX.teal, HEX.teal, HEX.teal, HEX.amber],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00#", dataLabelFontSize: 12, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt",
      catAxisLabelFontSize: 12, catAxisLabelColor: HEX.ink, catAxisLabelFontFace: "+mn-lt", catAxisLineShow: false,
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 0.6, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showLegend: false, showTitle: true, title: "Scenario S1: contribution of each signal group to the risk score", titleFontSize: 13, titleColor: HEX.ink, titleFontFace: "+mn-lt",
      barGapWidthPct: 55,
    });
    const head2 = (t) => ({ text: t, options: { bold: true, fill: { color: HEX.mist }, color: HEX.ink } });
    s.addTable([
      [head2("Other scenarios (same policy)"), head2("Score"), head2("Outcome")],
      ["S2 · Vendor bank-detail change from a real but compromised vendor mailbox, ₹18 L", "59.0", "T1 + vendor callback"],
      ["S3 · Routine payment to a known vendor account", "6.0", "T0, no prompt"],
      ["S4 · \"CEO on WhatsApp\", new account typed in, ₹40 L", "25.0", "T1 via rule R1"],
    ], { x: 0.6, y: 5.3, w: 7.1, colW: [4.6, 0.8, 1.7], fontSize: 11, fontFace: THEME.bodyFontFace, color: HEX.ink,
      border: { type: "solid", pt: 0.75, color: HEX.line }, rowH: 0.36, valign: "middle", margin: [0.03, 0.08, 0.03, 0.08] });
    card(s, 8.05, 1.6, 4.65, 3.15, COL.ink);
    txt(s, "SCENARIO S1 · ₹5 CR TO A NEW ACCOUNT", { x: 8.3, y: 1.8, w: 4.2, h: 0.28, fontSize: 11, bold: true, color: COL.amber, charSpacing: 1 });
    txt(s, [{ text: "87.5", options: { fontFace: THEME.headFontFace, fontSize: 60, color: COL.white } }, { text: "  / 100 risk", options: { fontSize: 16, color: COL.line } }],
      { x: 8.3, y: 2.1, w: 4.2, h: 1.0, valign: "middle" });
    pill(s, "Tier T2: two confirmations + cooling-off", 8.3, 3.2, 4.15, 0.42, COL.amber, COL.ink, { fontSize: 12 });
    txt(s, "Rules fired: R2 lookalike + young domain · R4 external \"CFO\" · R1 new beneficiary · R6 secrecy", { x: 8.3, y: 3.78, w: 4.2, h: 0.8, fontSize: 12, color: COL.line });
    card(s, 8.05, 4.95, 4.65, 1.9);
    txt(s, [{ text: "Even with no meeting data at all", options: { bold: true, fontSize: 14, breakLine: true, paraSpaceAfter: 4 } },
      { text: "Score 79.1, and rule R2 alone still requires T2. The detector is optional; the decision isn't.", options: { fontSize: 12, breakLine: true, paraSpaceAfter: 4 } },
      { text: "100 × (1 − 0.55 × 0.50 × 0.76 × 0.60) = 87.5. Weights are documented priors, calibrated in pilot shadow mode.", options: { fontSize: 11, color: COL.muted } }],
      { x: 8.3, y: 5.1, w: 4.2, h: 1.65 });
  }

  // ════════════════ PITCH 07 — Data, evidence, validation, assumptions ════════════════
  {
    const s = content(SEC_PITCH, "PITCH DECK  ·  07 / 10  ·  DATA, EVIDENCE, VALIDATION PLAN & KEY ASSUMPTIONS", "Synthetic data in, verifiable evidence out");
    const quads = [
      ["LuDatabase", "Data", COL.teal, ["Prototype: synthetic only. A fictional company (Kestrel Infra) with its people, vendors, emails, meetings and payments.", "Public: news reports of the Arup case. No bank, customer or platform data.", "Production: customer-authorised finance mailboxes, meeting metadata and ERP data under a DPA."]],
      ["LuFileCheck", "Evidence", COL.ink, ["Every decision, passkey signature and analyst action is a hash-chained, append-only record.", "Chain heads signed with AWS KMS, stored under S3 Object Lock; an independent verifier re-checks all of it.", "Output: 1930 / cybercrime.gov.in incident pack + bank recall draft."]],
      ["LuFlaskConical", "Validation plan", COL.amber, ["14 red-team regressions: forged or replayed passkeys, cross-payment release, prompt injection, fail-open, tenant leaks.", "7 end-to-end scenarios asserting exact scores (S1 87.5 · S2 59.0 · S3 6.0 · S4 25.0).", "LLM eval on 40 synthetic emails (≥ 90% field accuracy); load test: decision p95 ≤ 300 ms.", "Pilot: 60-day shadow mode measures step-ups and benign holds first."]],
      ["LuListChecks", "Key assumptions", COL.crimson, ["Payments pass a release step we can hook: an ERP API call or the bank-upload file.", "Each authority enrolls a passkey on their own phone.", "The destination account appears in a channel we ingest; if not, rule R1 still forces confirmation.", "Score weights are expert priors until calibrated on pilot data."]],
    ];
    for (let i = 0; i < 4; i++) {
      const [ic, h, f, items] = quads[i];
      const x = i % 2 === 0 ? 0.6 : 6.75, y = i < 2 ? 1.6 : 4.3;
      card(s, x, y, 5.95, 2.5);
      await iconCircle(s, ic, x + 0.25, y + 0.2, 0.5, f, f === COL.amber ? HEX.ink : HEX.white);
      head(s, h, { x: x + 0.9, y: y + 0.2, w: 4.8, h: 0.5, fontSize: 18, valign: "middle" });
      txt(s, bullets(items, { paraSpaceAfter: 3 }), { x: x + 0.25, y: y + 0.82, w: 5.5, h: 1.62, fontSize: 12 });
    }
  }

  // ════════════════ PITCH 08 — Privacy, security, safety, misuse ════════════════
  {
    const s = content(SEC_PITCH, "PITCH DECK  ·  08 / 10  ·  PRIVACY, SECURITY, SAFETY & MISUSE SAFEGUARDS", "Private, secure, safe, and hard to misuse");
    const colsP = [
      ["LuEyeOff", "Privacy", COL.teal, ["Account numbers, IFSC and phones tokenized (HMAC) before any LLM or graph", "Raw values only in an encrypted vault; analyst reads logged", "Aadhaar detected and dropped", "Finance mailboxes only; India region; built for the DPDP Act 2023"]],
      ["LuLock", "Security", COL.ink, ["FIDO2 passkeys for every human, no passwords", "Challenge bound to transaction + decision; single-use", "Signed ERP calls and webhooks; tenant isolation", "Dependency down → high-value payments step up"]],
      ["LuHand", "Safety", COL.amber, ["Never auto-rejects: people decide every hold", "Every decision explained: rules fired + signal contributions", "The LLM can add risk, never remove it", "Requesters can't confirm their own payment"]],
      ["LuBan", "Misuse", COL.crimson, ["Purpose-limited by contract: no HR or productivity monitoring", "Rogue enrollment blocked: one-time admin link, user alerted, two admins to replace", "Detailed signals go to confirmers, not requesters", "VeriFi prepares reports; humans file them"]],
    ];
    for (let i = 0; i < 4; i++) {
      const [ic, h, f, items] = colsP[i];
      const x = 0.6 + i * 3.07;
      card(s, x, 1.6, 2.9, 4.45);
      await iconCircle(s, ic, x + 0.25, 1.82, 0.6, f, f === COL.amber ? HEX.ink : HEX.white);
      head(s, h, { x: x + 0.25, y: 2.52, w: 2.5, h: 0.45, fontSize: 20 });
      txt(s, bullets(items, { paraSpaceAfter: 5 }), { x: x + 0.25, y: 3.05, w: 2.5, h: 2.9, fontSize: 12 });
    }
    card(s, 0.6, 6.2, 12.11, 0.65, COL.ink);
    txt(s, [{ text: "Design rule:  ", options: { bold: true, color: COL.amber } }, { text: "VeriFi can delay a payment. It can never move money, reject a payment, or accuse a person. People make every final call.", options: { color: COL.white } }],
      { x: 0.85, y: 6.2, w: 11.7, h: 0.65, fontSize: 14, valign: "middle" });
  }

  // ════════════════ PITCH 09 — Deployment pathway ════════════════
  {
    const s = content(SEC_PITCH, "PITCH DECK  ·  09 / 10  ·  DEPLOYMENT PATHWAY", "Sold to the CFO, installed where payments are released");
    txt(s, "INTEGRATION PATH", { x: 0.6, y: 1.6, w: 6, h: 0.3, fontSize: 11, bold: true, color: COL.amberText, charSpacing: 1.5 });
    const modes = [
      ["Prototype", COL.teal, COL.white, "Mode A · ERP pre-release API hook", "The ERP calls VeriFi before releasing a payment. T0 returns instantly; T1 / T2 return pending, then a signed callback."],
      ["Pilot", COL.amber, COL.ink, "Mode B · Bank-upload file gate", "VeriFi sits between the ERP's bank file and the bank (host-to-host / SFTP). No ERP code change."],
      ["Partnership", COL.ink, COL.white, "Mode C · Bank-side checker", "A bank offers VeriFi inside corporate net banking as the checker step for its business clients."],
    ];
    modes.forEach(([p, f, c, h, d], i) => {
      const x = 0.6 + i * 4.125;
      card(s, x, 1.95, 3.85, 1.7);
      pill(s, p, x + 0.22, 2.12, 1.3, 0.32, f, c, { fontSize: 11 });
      txt(s, h, { x: x + 0.22, y: 2.52, w: 3.45, h: 0.3, fontSize: 14, bold: true });
      txt(s, d, { x: x + 0.22, y: 2.85, w: 3.45, h: 0.75, fontSize: 12 });
      if (i < 2) arrowR(s, x + 3.9, 2.68, 0.18, 0.26, COL.muted);
    });
    txt(s, "ROLLOUT", { x: 0.6, y: 3.9, w: 6, h: 0.3, fontSize: 11, bold: true, color: COL.amberText, charSpacing: 1.5 });
    s.addShape(S.line, { x: 0.85, y: 4.45, w: 11.6, h: 0, line: { color: HEX.line, width: 2 } });
    const phases = [
      ["Hackathon · 48 h", "Prototype on synthetic data: the full S1 scenario end to end on a real phone over HTTPS."],
      ["Pilot · 60 days", "1–2 Indian enterprises. Shadow mode first (alert only), then hold mode; AWS Mumbai region."],
      ["Product", "Microsoft Graph / Gmail and Zoom / Teams connectors, Web Push, Secure Payment Confirmation, shared mule-account intelligence."],
    ];
    phases.forEach(([h, d], i) => {
      const x = 0.85 + i * 4.0;
      s.addShape(S.ellipse, { x: x - 0.12, y: 4.33, w: 0.24, h: 0.24, fill: { color: i === 0 ? COL.teal : i === 1 ? COL.amber : COL.ink }, line: { color: COL.white, width: 2 } });
      txt(s, [{ text: h, options: { bold: true, fontSize: 14, breakLine: true } }, { text: d, options: { fontSize: 12 } }], { x: x - 0.12, y: 4.68, w: 3.7, h: 0.95 });
    });
    const biz = [
      ["Customer", "Indian mid-to-large enterprises with central treasury / AP"],
      ["Buyer", "CFO buys; CISO approves; AP and authorities use it"],
      ["Pricing (hypothesis)", "Per legal entity + payment-volume tier"],
      ["Pilot targets", "< 3% step-up rate · < 60 s median confirmation · pack < 2 min"],
    ];
    biz.forEach(([h, d], i) => {
      const x = 0.6 + i * 3.07;
      card(s, x, 5.75, 2.9, 1.1, COL.ink);
      txt(s, [{ text: h.toUpperCase(), options: { bold: true, fontSize: 10, color: COL.amber, charSpacing: 1, breakLine: true } }, { text: d, options: { fontSize: 12, color: COL.white } }],
        { x: x + 0.2, y: 5.85, w: 2.55, h: 0.95 });
    });
  }

  // ════════════════ PITCH 10 — 48-hour plan ════════════════
  {
    const s = content(SEC_PITCH, "PITCH DECK  ·  10 / 10  ·  48-HOUR PROTOTYPE PLAN", "48 hours: build the confirmation spine first");
    const X0 = 2.45, X1 = 12.6, hr = (h) => X0 + (X1 - X0) * h / 48;
    for (let h = 0; h <= 48; h += 6) {
      txt(s, "H" + h, { x: hr(h) - 0.3, y: 1.55, w: 0.6, h: 0.25, fontSize: 11, color: COL.muted, align: "center" });
      s.addShape(S.line, { x: hr(h), y: 1.85, w: 0, h: 3.0, line: { color: HEX.line, width: 0.75 } });
    }
    const lanes = [
      ["A · Backend core", [[0, 6, "Foundations: DB, auth, CI", 0], [6, 18, "Passkey confirmation + state machine", 1], [18, 28, "Policy engine + evaluate API", 0], [28, 40, "Webhooks, fail-safe, tests", 2]]],
      ["B · Graph & ingest", [[0, 6, "Synthetic fixtures, parsers", 0], [6, 20, "Tokenizer, domain intel, graph, provenance", 0], [20, 30, "Bedrock extraction", 0], [30, 40, "Velocity rule, scenario tests", 2]]],
      ["C · Frontend", [[0, 8, "App shell + HTTPS on a real phone", 1], [8, 20, "Approver app (PWA)", 1], [20, 34, "ERP simulator, analyst console, lineage view", 0], [34, 40, "Polish", 2]]],
      ["D · Evidence & demo", [[0, 6, "Domain + HTTPS + tunnel", 1], [6, 18, "Pitch + demo script", 2], [18, 34, "Evidence chain, KMS / Object Lock, incident pack", 0], [34, 40, "Seed S1 / S3", 2]]],
    ];
    lanes.forEach(([label, blocks], li) => {
      const y = 1.95 + li * 0.72;
      txt(s, label, { x: 0.6, y, w: 1.8, h: 0.6, fontSize: 12, bold: true, valign: "middle" });
      blocks.forEach(([a, b, t, kind]) => {
        const fill = kind === 1 ? COL.teal : kind === 2 ? COL.mist : COL.ink;
        const col = kind === 2 ? COL.ink : COL.white;
        s.addShape(S.roundRect, { x: hr(a) + 0.03, y, w: hr(b) - hr(a) - 0.06, h: 0.6, fill: { color: fill }, line: { color: kind === 2 ? COL.line : fill }, rectRadius: 0.06 });
        txt(s, t, { x: hr(a) + 0.1, y, w: hr(b) - hr(a) - 0.2, h: 0.6, fontSize: 11, color: col, valign: "middle" });
      });
    });
    s.addShape(S.roundRect, { x: hr(40) + 0.03, y: 1.95, w: hr(48) - hr(40) - 0.06, h: 2.76, fill: { color: COL.amber }, line: { color: COL.amber }, rectRadius: 0.06 });
    txt(s, "All: integrate, 3 full rehearsals, backup video", { x: hr(40) + 0.12, y: 1.95, w: hr(48) - hr(40) - 0.24, h: 2.76, fontSize: 12, bold: true, color: COL.ink, valign: "middle", align: "center" });
    // milestones
    [[6, "H6"], [30, "H30"], [44, "H44"]].forEach(([h]) => {
      s.addShape(S.diamond, { x: hr(h) - 0.11, y: 4.78, w: 0.22, h: 0.22, fill: { color: COL.crimson }, line: { color: COL.white, width: 1 } });
    });
    txt(s, [{ text: "◆ ", options: { color: COL.crimson } }, { text: "H6 ", options: { bold: true } }, { text: "Passkey works on a phone over HTTPS    " },
      { text: "◆ ", options: { color: COL.crimson } }, { text: "H30 ", options: { bold: true } }, { text: "S1 runs end to end    " },
      { text: "◆ ", options: { color: COL.crimson } }, { text: "H44 ", options: { bold: true } }, { text: "Feature freeze" }],
      { x: 0.6, y: 5.1, w: 8.3, h: 0.3, fontSize: 12 });
    const legend = [["Critical path", COL.teal], ["Core build", COL.ink], ["Support", COL.mist]];
    legend.forEach(([t, f], i) => {
      const x = 9.0 + i * 1.25;
      s.addShape(S.roundRect, { x, y: 5.16, w: 0.22, h: 0.18, fill: { color: f }, line: { color: f === COL.mist ? COL.line : f }, rectRadius: 0.04 });
      txt(s, t, { x: x + 0.28, y: 5.1, w: 0.95, h: 0.3, fontSize: 11, color: COL.muted });
    });
    // bottom cards
    const bc = [
      ["BUILT FOR REAL", COL.teal, "Passkey protocol · lineage graph · policy engine · evidence chain · incident pack · ERP hook API"],
      ["SIMULATED, LABELLED IN THE UI", COL.amber, "ERP and bank · meeting feed · deepfake score (slider) · domain-age data for the demo domains"],
      ["DONE MEANS", COL.crimson, "The detector says \"authentic\", the CFO denies on their phone, the payment is held, the 1930 pack is generated."],
    ];
    bc.forEach(([h, f, d], i) => {
      const x = 0.6 + i * 4.1;
      tint(s, x, 5.55, 3.9, 1.3, f, 86);
      txt(s, [{ text: h, options: { bold: true, fontSize: 11, color: i === 1 ? COL.amberText : f, charSpacing: 1, breakLine: true, paraSpaceAfter: 4 } }, { text: d, options: { fontSize: 12 } }],
        { x: x + 0.2, y: 5.68, w: 3.5, h: 1.1 });
    });
  }

  // ════════════════ ARCH 1 — System diagram ════════════════
  pres.addSection({ title: SEC_ARCH });
  {
    const s = content(SEC_ARCH, "ARCHITECTURAL OVERVIEW  ·  1 / 3  ·  END-TO-END SYSTEM", "Two loops: slow ingestion, fast decision gate");
    const panels = [
      { x: 0.6, w: 2.35, h: "INPUTS", hc: COL.muted },
      { x: 3.2, w: 2.55, h: "WORKER · SLOW LOOP", hc: COL.teal },
      { x: 6.0, w: 2.1, h: "STORES", hc: COL.muted },
      { x: 8.35, w: 2.15, h: "DECISION · FAST LOOP", hc: COL.amberText },
      { x: 10.75, w: 1.95, h: "OUTPUTS & PEOPLE", hc: COL.muted },
    ];
    panels.forEach((p) => {
      card(s, p.x, 1.6, p.w, 4.2);
      txt(s, p.h, { x: p.x + 0.12, y: 1.68, w: p.w - 0.24, h: 0.32, fontSize: 10, bold: true, color: p.hc, charSpacing: 0.5 });
    });
    const box = (x, y, w, h, t, accent) => {
      s.addShape(S.roundRect, { x, y, w, h, fill: { color: COL.white }, line: { color: accent || COL.line, width: accent ? 1.5 : 0.75 }, rectRadius: 0.06 });
      txt(s, t, { x: x + 0.08, y, w: w - 0.16, h, fontSize: 11, valign: "middle" });
    };
    const rowsY = [2.05, 2.95, 3.85, 4.75], bh = 0.8;
    const P1 = [["Email · .eml / Microsoft Graph / Gmail API"], ["Meeting · metadata + transcript (Zoom / Teams)"], ["Vendor master · registered bank accounts (ERP)"], ["Payment release request · ERP hook", HEX.amber]];
    const P2 = ["Parse headers · SPF / DKIM / DMARC results", "Tokenize account, IFSC, phone (HMAC) → encrypted vault", "Domain intel · lookalikes (dnstwist) + age (RDAP)", "LLM extraction · Claude on Bedrock · additive only"];
    const P4 = ["Provenance query · where did this account come from?", "Policy engine · rules R1–R7 + bounded score", "State machine · pass / confirm / hold", "Evidence chain · hash-linked records"];
    const P5 = ["T0 · release webhook to ERP", "Approver app · authority's phone, passkey", "Analyst console · queue, lineage, actions", "Incident pack · 1930 / cybercrime.gov.in"];
    P1.forEach(([t, a], i) => box(0.72, rowsY[i], 2.11, bh, t, a ? COL.amber : null));
    P2.forEach((t, i) => box(3.32, rowsY[i], 2.31, bh, t));
    P4.forEach((t, i) => box(8.47, rowsY[i], 1.91, bh, t));
    P5.forEach((t, i) => box(10.87, rowsY[i], 1.71, bh, t, i === 1 ? COL.teal : null));
    [["Neo4j · Instruction Lineage Graph (tokens only)", 2.05], ["PostgreSQL · system of record, vault, job queue", 3.25], ["S3 Object Lock + AWS KMS · signed evidence checkpoints", 4.45]].forEach(([t, y]) => box(6.12, y, 1.86, 1.1, t));
    // arrows between panels
    arrowR(s, 2.98, 2.95, 0.19, 0.3, COL.teal);
    arrowR(s, 5.78, 2.95, 0.19, 0.3, COL.teal);
    s.addShape(S.line, { x: 8.1, y: 3.75, w: 0.25, h: 0, line: { color: HEX.amber, width: 2.5, beginArrowType: "triangle", endArrowType: "triangle" } });
    arrowR(s, 10.53, 3.6, 0.19, 0.3, COL.amber);
    // fast path line: payment request → decision API
    const amberLine = () => ({ color: HEX.amber, width: 2 });
    s.addShape(S.line, { x: 1.78, y: 5.55, w: 0, h: 0.5, line: amberLine() });
    s.addShape(S.line, { x: 1.78, y: 6.05, w: 7.65, h: 0, line: amberLine() });
    s.addShape(S.line, { x: 9.43, y: 5.55, w: 0, h: 0.5, line: { color: HEX.amber, width: 2, endArrowType: "triangle" }, flipV: true });
    txt(s, "Payment release request → decision in ≤ 300 ms (no LLM call on this path; the graph is precomputed)", { x: 2.0, y: 6.1, w: 10.7, h: 0.28, fontSize: 11, bold: true, color: COL.amberText });
    txt(s, [{ text: "Consent & provenance: ", options: { bold: true } }, { text: "only customer-authorised finance mailboxes and meetings are ingested, under a DPA (the prototype uses synthetic data). Every graph fact keeps its source message and time; raw identifiers never leave the vault." }],
      { x: 0.6, y: 6.45, w: 12.1, h: 0.5, fontSize: 11, color: COL.ink });
  }

  // ════════════════ ARCH 2 — Components & decision flow ════════════════
  {
    const s = content(SEC_ARCH, "ARCHITECTURAL OVERVIEW  ·  2 / 3  ·  COMPONENTS, MODELS & RULES, DECISION FLOW & ESCALATION", "Components, rules, and how a payment moves");
    const h = (t) => ({ text: t, options: { bold: true, fill: { color: HEX.ink }, color: HEX.white } });
    s.addTable([
      [h("Component"), h("Model / rules"), h("Storage"), h("Interface"), h("Output")],
      ["Ingestion worker", "Header parser, Presidio + Indian recognizers, dnstwist, RDAP", "S3 (raw, 90 days), vault", "Postgres job queue", "Graph facts"],
      ["LLM extractor", "Claude on Amazon Bedrock, JSON-schema output, additive only", "None", "Bedrock API", "Intent, urgency, authority claims"],
      ["Provenance service", "Cypher path queries (account → source)", "Neo4j", "Internal", "Facts per account"],
      ["Policy engine", "Rules R1–R7 + bounded score, versioned YAML", "Postgres", "Pure function", "Tier + reasons"],
      ["Confirmation service", "WebAuthn (py_webauthn), approval matrix", "Postgres", "REST + approver app", "Signed decision"],
      ["Evidence service", "SHA-256 chain, KMS ECDSA signatures", "Postgres + S3 Object Lock", "REST + CLI verifier", "Verifiable record, incident pack"],
    ], { x: 0.6, y: 1.6, w: 7.55, colW: [1.5, 2.35, 1.35, 1.15, 1.2], fontSize: 11, fontFace: THEME.bodyFontFace, color: HEX.ink,
      border: { type: "solid", pt: 0.75, color: HEX.line }, valign: "middle", margin: [0.04, 0.07, 0.04, 0.07] });
    card(s, 0.6, 5.1, 7.55, 1.75);
    const ifc = [["ERP", "POST /v1/payments/evaluate (HMAC-signed) · signed webhooks back"], ["Sources", "POST /v1/ingest/email · POST /v1/ingest/meeting"], ["People", "Approver app (passkey session) · analyst console"], ["Audit", "GET /v1/evidence/verify · CLI verifier"], ["Deploy", "API + worker container, Postgres, Neo4j AuraDB, S3 / KMS, Bedrock (AWS Mumbai)"]];
    txt(s, [{ text: "Interfaces & deployment", options: { bold: true, fontSize: 13, breakLine: true, paraSpaceAfter: 4 } }]
      .concat(ifc.flatMap(([a, b], i) => [{ text: a + "  ", options: { bold: true, color: COL.amberText } }, { text: b, options: { breakLine: i < ifc.length - 1 } }])),
      { x: 0.85, y: 5.2, w: 7.1, h: 1.6, fontSize: 11 });
    // flow
    const fx = 8.5, fw = 4.2;
    const fbox = (y, hgt, t, fill, color, bold) => {
      s.addShape(S.roundRect, { x: fx, y, w: fw, h: hgt, fill: { color: fill }, line: { color: fill }, rectRadius: 0.06 });
      txt(s, t, { x: fx + 0.15, y, w: fw - 0.3, h: hgt, fontSize: 12, color, bold, valign: "middle" });
    };
    fbox(1.6, 0.45, "Payment release request (ERP)", COL.ink, COL.white, true);
    arrowD(s, fx + 2.0, 2.08, 0.22, 0.18);
    fbox(2.3, 0.6, "Evaluate: provenance facts + rules R1–R7 + score", COL.mist, COL.ink, true);
    arrowD(s, fx + 0.9, 2.93, 0.22, 0.18);
    arrowD(s, fx + 3.1, 2.93, 0.22, 0.18);
    s.addShape(S.roundRect, { x: fx, y: 3.15, w: 1.95, h: 0.55, fill: { color: COL.teal }, line: { color: COL.teal }, rectRadius: 0.06 });
    txt(s, "T0 → RELEASED", { x: fx, y: 3.15, w: 1.95, h: 0.55, fontSize: 12, bold: true, color: COL.white, align: "center", valign: "middle" });
    s.addShape(S.roundRect, { x: fx + 2.1, y: 3.15, w: 2.1, h: 0.55, fill: { color: COL.amber }, line: { color: COL.amber }, rectRadius: 0.06 });
    txt(s, "T1 / T2 → PENDING CONFIRMATION", { x: fx + 2.15, y: 3.15, w: 2.0, h: 0.55, fontSize: 11, bold: true, color: COL.ink, align: "center", valign: "middle" });
    arrowD(s, fx + 3.04, 3.73, 0.22, 0.18);
    tint(s, fx, 3.95, fw, 0.6, COL.teal, 85);
    txt(s, [{ text: "Approved → RELEASED ", options: { bold: true, color: COL.teal } }, { text: "(T2: two confirmers + cooling-off)" }], { x: fx + 0.15, y: 3.95, w: fw - 0.3, h: 0.6, fontSize: 12, valign: "middle" });
    tint(s, fx, 4.65, fw, 0.6, COL.crimson, 85);
    txt(s, [{ text: "Denied or expired → HELD FOR REVIEW", options: { bold: true, color: COL.crimson } }], { x: fx + 0.15, y: 4.65, w: fw - 0.3, h: 0.6, fontSize: 12, valign: "middle" });
    arrowD(s, fx + 2.0, 5.28, 0.22, 0.18);
    fbox(5.5, 0.6, "Analyst: reject → incident + 1930 pack. Release after a Deny needs the denier's re-approval.", COL.mist, COL.ink, false);
    txt(s, [{ text: "Escalation: ", options: { bold: true } }, { text: "requests expire after 30 min (T1) or 60 min (T2), then go to the next authority or a registered delegate. Analysts are alerted on every T2 and hold." }],
      { x: fx, y: 6.2, w: fw, h: 0.65, fontSize: 11, color: COL.ink });
  }

  // ════════════════ ARCH 3 — Review, evidence, security, performance ════════════════
  {
    const s = content(SEC_ARCH, "ARCHITECTURAL OVERVIEW  ·  3 / 3  ·  HUMAN REVIEW, EVIDENCE, SECURITY & PERFORMANCE", "Humans decide, every step is signed, failures are safe");
    const Q = [[0.6, 1.6], [6.75, 1.6], [0.6, 4.3], [6.75, 4.3]];
    const hdr = async (i, ic, t, f) => {
      const [x, y] = Q[i];
      card(s, x, y, 5.95, 2.5);
      await iconCircle(s, ic, x + 0.25, y + 0.2, 0.5, f, f === COL.amber ? HEX.ink : HEX.white);
      head(s, t, { x: x + 0.9, y: y + 0.2, w: 4.9, h: 0.5, fontSize: 17, valign: "middle" });
    };
    await hdr(0, "LuBell", "Human review, notifications & reporting", COL.teal);
    txt(s, bullets(["Approver app shows pending requests (prototype: polling; pilot: Web Push; SMS carries only a link)", "Analyst queue sorted by tier, amount and age; release / reject with a written reason", "Signed webhooks tell the ERP: released, held, rejected", "Playbook: call 1930 if money left, file at cybercrime.gov.in, block the domain, alert the impersonated executive"], { paraSpaceAfter: 3 }),
      { x: 0.85, y: 2.42, w: 5.5, h: 1.62, fontSize: 12 });
    await hdr(1, "LuFileCheck", "Evidence path", COL.ink);
    const chips = ["Event", "Chained record (prev_hash)", "KMS-signed checkpoint", "S3 Object Lock", "Verifier + incident pack"];
    chips.forEach((t, i) => {
      const x = 7.0 + i * 1.1;
      s.addShape(S.roundRect, { x, y: 2.45, w: 0.98, h: 0.78, fill: { color: i === 4 ? COL.teal : COL.white }, line: { color: i === 4 ? COL.teal : COL.line }, rectRadius: 0.06 });
      txt(s, t, { x: x + 0.04, y: 2.45, w: 0.9, h: 0.78, fontSize: 10, align: "center", valign: "middle", color: i === 4 ? COL.white : COL.ink, bold: i === 4 });
      if (i < 4) arrowR(s, x + 0.99, 2.75, 0.1, 0.16, COL.muted);
    });
    txt(s, bullets(["Checkpoints at least every 15 min and on every hold", "Verifier recomputes the chain and re-verifies each passkey signature"], { paraSpaceAfter: 3 }),
      { x: 7.0, y: 3.38, w: 5.5, h: 0.8, fontSize: 12 });
    await hdr(2, "LuShieldAlert", "Security, privacy & adversarial risks", COL.crimson);
    const sec = [["Forged / replayed passkey", "py_webauthn checks; single-use challenge"], ["Rogue enrollment", "One-time admin link; user alerted; 2 admins"], ["Prompt injection", "LLM off the decision path; additive only"], ["Lookalike passes SPF/DKIM", "dnstwist variants + domain age"], ["Alert flooding", "Signals tied to the paid account"], ["Outage / data leak", "Fail-safe step-up; tokens; tenant isolation"]];
    s.addTable(sec.map(([a, b]) => [{ text: a, options: { bold: true } }, b]), { x: 0.85, y: 4.98, w: 5.55, colW: [2.15, 3.4], fontSize: 11, fontFace: THEME.bodyFontFace, color: HEX.ink,
      border: { type: "none" }, rowH: 0.27, valign: "middle", margin: [0.01, 0.04, 0.01, 0.0] });
    await hdr(3, "LuClock", "Performance assumptions & validation", COL.amber);
    const stats = [["≤ 300 ms", "decision p95"], ["< 60 s", "ingestion lag"], ["< 60 s", "median confirm"], ["< 3%", "step-up rate"]];
    stats.forEach(([v, l], i) => {
      const x = 7.0 + i * 1.38;
      head(s, v, { x, y: 5.05, w: 1.33, h: 0.45, fontSize: 20, color: COL.ink });
      txt(s, l, { x, y: 5.5, w: 1.33, h: 0.25, fontSize: 11, color: COL.muted });
    });
    txt(s, "Validated by a load test, 14 red-team regressions, 7 scenarios with exact expected scores, an LLM eval set, and a 60-day shadow-mode pilot.",
      { x: 7.0, y: 5.95, w: 5.5, h: 0.7, fontSize: 12 });
  }

  // ════════════════ APPENDIX A — Map + glossary ════════════════
  pres.addSection({ title: SEC_APP });
  {
    const s = content(SEC_APP, "APPENDIX A  ·  WHERE EACH REQUIREMENT IS ANSWERED, AND KEY TERMS", "Submission map and key terms");
    const h = (t) => ({ text: t, options: { bold: true, fill: { color: HEX.ink }, color: HEX.white } });
    s.addTable([
      [h("Requirement"), h("Page")],
      ["Team, challenge statement, one-sentence solution", "1"],
      ["User, threat scenario, harm", "2"],
      ["Current journey, product flow, differentiation", "3, 5"],
      ["Core detection / decision approach", "4, 6"],
      ["Data, evidence, validation plan, key assumptions", "7"],
      ["Privacy, security, safety, misuse safeguards", "8"],
      ["Deployment pathway; 48-hour prototype plan", "9; 10"],
      ["System diagram; inputs, data sources, consent, provenance", "11"],
      ["Components, models / rules, storage, interfaces, outputs; decision flow, alerts, escalation", "12"],
      ["Human review, notifications, reporting, evidence; security; performance & validation", "13"],
      ["Disclosure of AI-generated content, data, models, third-party assets", "15"],
    ], { x: 0.6, y: 1.6, w: 6.6, colW: [5.8, 0.8], fontSize: 11, fontFace: THEME.bodyFontFace, color: HEX.ink,
      border: { type: "solid", pt: 0.75, color: HEX.line }, valign: "middle", margin: [0.04, 0.08, 0.04, 0.08] });
    const terms = [
      ["Provenance", "Where and how a beneficiary account first entered the company"],
      ["Lookalike domain", "A domain imitating a real one, e.g. kestrelinfra-group.co"],
      ["Passkey (FIDO2 / WebAuthn)", "A private key on the user's phone, unlocked by biometrics"],
      ["T0 / T1 / T2", "Pass / one confirmation / two confirmations + cooling-off"],
      ["Authority", "Person entitled to approve a class of payment (e.g. CFO)"],
      ["Shadow mode", "VeriFi alerts but does not hold; used to start pilots"],
      ["1930", "India's national cyber-fraud helpline (with cybercrime.gov.in)"],
      ["IFSC", "Bank-branch code used with account numbers on NEFT / RTGS / IMPS"],
    ];
    card(s, 7.5, 1.6, 5.2, 5.25);
    head(s, "Key terms", { x: 7.75, y: 1.78, w: 4.7, h: 0.4, fontSize: 17 });
    txt(s, terms.flatMap(([a, b], i) => [{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: { color: COL.muted, breakLine: i < terms.length - 1, paraSpaceAfter: 6 } }]),
      { x: 7.75, y: 2.3, w: 4.75, h: 4.45, fontSize: 11 });
  }

  // ════════════════ APPENDIX B — Disclosures ════════════════
  {
    const s = content(SEC_APP, "APPENDIX B  ·  DISCLOSURES & SOURCES", "Disclosures: AI use, data, models, third-party assets");
    const d = [
      ["LuSparkles", "AI-generated content", "This deck, its diagrams and our design documents were drafted with AI assistance (Anthropic Claude, via Claude Code) and reviewed and edited by the team. The worked-example scores were computed, not estimated."],
      ["LuDatabase", "Datasets", "Synthetic only: the company (Kestrel Infra Ltd), people, vendors, emails, meetings and payments are fictional. Public: news reporting on the Arup case. No confidential bank, customer or platform data is used."],
      ["LuCpu", "Models", "Claude on Amazon Bedrock (anthropic.claude-opus-5-5) for text extraction; no model is trained or fine-tuned. The deepfake score is a labelled simulated input in the prototype; any detector can plug in as one weak signal."],
      ["LuPackage", "Third-party assets", "Open source: FastAPI, Next.js, Neo4j, PostgreSQL, py_webauthn, SimpleWebAuthn, Microsoft Presidio, dnstwist, Cytoscape.js. Cloud: AWS Bedrock, S3, KMS. Icons: Lucide (ISC licence) via react-icons. Fonts: Bahnschrift, Segoe UI."],
    ];
    for (let i = 0; i < 4; i++) {
      const [ic, h, b] = d[i];
      const x = i % 2 === 0 ? 0.6 : 6.75, y = i < 2 ? 1.6 : 3.7;
      card(s, x, y, 5.95, 1.9);
      await iconCircle(s, ic, x + 0.25, y + 0.22, 0.5, COL.ink, HEX.white);
      head(s, h, { x: x + 0.9, y: y + 0.22, w: 4.8, h: 0.5, fontSize: 16, valign: "middle" });
      txt(s, b, { x: x + 0.25, y: y + 0.85, w: 5.5, h: 1.0, fontSize: 11 });
    }
    txt(s, [{ text: "Sources  ", options: { bold: true } },
      { text: "Arup case: South China Morning Post (May 2024), Construction Briefing (2024). RBI beneficiary name lookup for NEFT / RTGS: RBI circular, 30 Dec 2024 (effective 1 Apr 2025). DPDP Rules 2025: notified Nov 2025 (Hogan Lovells; AZB & Partners summaries). Competitor descriptions are from public product positioning, as of Oct 2026." }],
      { x: 0.6, y: 5.85, w: 12.1, h: 0.95, fontSize: 11, color: COL.ink });
  }

  await pres.writeFile({ fileName: OUT });
  if (SKILL) {
    const { applyTheme } = require(path.join(SKILL, "scripts", "apply_theme.js"));
    await applyTheme(OUT, THEME);
  }
  console.log("wrote", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
