import { useState, type ChangeEvent, type ReactNode } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { projectName } from "../lib/use-logbook";
import { ALL_SKILLS, LUK_DEFS, STATUS, uid } from "../lib/constants";
import { HULPMIDDELEN } from "../data/hulpmiddelen";
import { HulpmiddelLightbox } from "./hulpmiddel-lightbox";
import type { LukFile, StatusKey, ActionItem } from "../lib/types";
import { AppIcon } from "../components/AppIcon";

export function ModalRenderer() {
  const ctx = useLogbookCtx();
  const modal = ctx.modal;
  if (!modal) return null;

  const close = () => ctx.setModal(null);

  let box: ReactNode = null;
  let size = "md";

  switch (modal.type) {
    case "skillDetail":
      size = "lg";
      box = <SkillDetailModal skillId={modal.skillId} onClose={close} />;
      break;
    case "entryDetail":
      size = "md";
      box = <EntryDetailModal entryId={modal.entryId} onClose={close} />;
      break;
    case "entryForm":
      size = "md";
      box = <EntryFormModal skillId={modal.skillId} periode={modal.periode} editId={modal.editId} onClose={close} />;
      break;
    case "lukCritDetail":
      size = "md";
      box = <LukCritDetailModal lukId={modal.lukId} criterionId={modal.criterionId} periode={modal.periode} onClose={close} />;
      break;
    case "lukDetail":
      size = "md";
      box = <LukDetailModal entryId={modal.entryId} onClose={close} />;
      break;
    case "lukEntryForm":
      size = "md";
      box = <LukEntryFormModal lukId={modal.lukId} criterionId={modal.criterionId} periode={modal.periode} editId={modal.editId} onClose={close} />;
      break;
    case "confirm":
      size = "sm";
      box = <ConfirmModal msg={modal.msg} onOk={modal.onOk} onClose={close} />;
      break;
    case "skillIndicators":
      size = "md";
      box = <SkillIndicatorsModal skillId={modal.skillId} onClose={close} />;
      break;
    case "completeProject":
      size = "sm";
      box = <CompleteProjectModal projectKey={modal.key} onClose={close} />;
      break;
    case "newProject":
      size = "md";
      box = <NewProjectModal onClose={close} />;
      break;
    case "hulpmiddelDetail":
      size = "sm";
      box = <HulpmiddelDetailModal hulpmiddelId={modal.hulpmiddelId} onClose={close} />;
      break;
    case "hulpmiddelLightbox":
      size = "xl";
      box = <HulpmiddelLightbox hulpmiddelId={modal.hulpmiddelId} onClose={close} />;
      break;
    default:
      return null;
  }

  return (
    <div className="modal-bg" onClick={close}>
      <div
        className={`modal-box modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {box}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function ModalHeader({ title, onClose, children }: { title?: string; onClose: () => void; children?: ReactNode }) {
  return (
    <div className="modal-header">
      {children ? children : <h2>{title}</h2>}
      <button className="modal-close" onClick={onClose}>
        <AppIcon name="x" size="md" />
      </button>
    </div>
  );
}

function FieldLabel({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

// ─── Skill Detail Modal ──────────────────────────────────────────────────────
function SkillDetailModal({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const ctx = useLogbookCtx();
  const key = ctx.cur();
  const skill = ALL_SKILLS.find((s) => s.id === skillId);
  if (!skill) return null;
  const data = ctx.state.skillData[key]?.[skill.id] || { plan: "", tips: [] };
  const pe = ctx.state.entries.filter((e) => e.periode === key && e.skillId === skill.id);

  return (
    <>
      <div className="flex-between" style={{ marginBottom: "18px" }}>
        <div className="dot-row" style={{ gap: "10px" }}>
          <h2 style={{ fontSize: "var(--fs-lg)", fontWeight: "var(--fw-bold)", margin: "0" }}>{skill.name}</h2>
        </div>
        <button className="modal-close" onClick={onClose}>
          <AppIcon name="x" size="md" />
        </button>
      </div>
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.6" }}>{skill.desc}</p>
      <p className="slabel">Indicatoren ({skill.ind.length})</p>
      <div className="subtle-box" style={{ marginBottom: "16px" }}>
        {skill.ind.map((ind, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid var(--border-faint)" }}>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)", lineHeight: "1.5" }}>{ind}</span>
          </div>
        ))}
      </div>
      <p className="slabel">Ontwikkelplan</p>
      <textarea
        className="input"
        rows={3}
        placeholder="Hoe wil je deze skill ontwikkelen dit project?"
        style={{ marginBottom: "10px", resize: "vertical" }}
        value={data.plan || ""}
        onChange={(e) => ctx.updateSkillPlan(key, skill.id, e.target.value)}
      />
      {data.tips?.length ? (
        <>
          <p className="slabel" style={{ marginTop: "14px" }}>Tips</p>
          {data.tips.map((tip, i) => (
            <div key={i} className="ai-tip">
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: "var(--fw-semibold)", color: "var(--pink)", flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)", lineHeight: "1.5" }}>{tip}</span>
            </div>
          ))}
        </>
      ) : null}
      <div className="flex-between" style={{ margin: "18px 0 10px" }}>
        <p className="slabel" style={{ margin: "0" }}>Ontwikkelmomenten ({pe.length})</p>
        <button
          className="btn btn-primary"
          style={{ fontSize: "var(--fs-sm)", padding: "6px 12px" }}
          onClick={() => ctx.setModal({ type: "entryForm", skillId: skill.id, periode: key })}
        >
          <AppIcon name="plus" size="xs" strokeWidth={2.5} /> Nieuw moment
        </button>
      </div>
      {pe.length === 0 ? (
        <p style={{ fontSize: "var(--fs-base)", color: "var(--text-tertiary)" }}>Nog geen ontwikkelmomenten gedocumenteerd.</p>
      ) : (
        pe.map((e) => {
          const st = STATUS.find((s) => s.key === e.status) || STATUS[0];
          return (
            <button
              key={e.id}
              className="entry-row"
              style={{ marginBottom: "8px" }}
              onClick={() => ctx.setModal({ type: "entryDetail", entryId: e.id })}
            >
              <div className="flex-between" style={{ gap: "10px" }}>
                <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-base)" }}>{e.title}</span>
                <button
                  className={`chip ${st.cls}`}
                  style={{ cursor: "pointer", fontSize: "var(--fs-xs)" }}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    const idx = STATUS.findIndex((s) => s.key === e.status);
                    const next = STATUS[(idx + 1) % STATUS.length];
                    ctx.updateEntry(e.id, { status: next.key });
                  }}
                >
                  {st.label}
                </button>
              </div>
              {e.description && <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", margin: "5px 0 0" }}>{e.description}</p>}
              {e.date && <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", margin: "4px 0 0" }}>{e.date}</p>}
            </button>
          );
        })
      )}
    </>
  );
}

// ─── Entry Detail Modal ──────────────────────────────────────────────────────
function EntryDetailModal({ entryId, onClose }: { entryId: string; onClose: () => void }) {
  const ctx = useLogbookCtx();
  const entry = ctx.state.entries.find((e) => e.id === entryId);
  if (!entry) return null;
  const skill = ALL_SKILLS.find((s) => s.id === entry.skillId);

  return (
    <>
      <div className="flex-between" style={{ marginBottom: "14px", gap: "10px" }}>
        <div>
          {skill && <span className="chip chip-pink" style={{ marginBottom: "8px", display: "inline-flex" }}>{skill.name}</span>}
          <h2 style={{ fontSize: "var(--fs-lg)", fontWeight: "var(--fw-bold)", margin: "0" }}>{entry.title}</h2>
          {entry.date && <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginTop: "4px" }}>{entry.date}</p>}
        </div>
        <button className="modal-close" onClick={onClose}>
          <AppIcon name="x" size="md" />
        </button>
      </div>
      <div className="flex-center" style={{ gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {STATUS.map((opt) => (
          <button
            key={opt.key}
            className={`chip ${opt.cls} status-toggle${entry.status === opt.key ? " selected" : ""}`}
            onClick={() => ctx.updateEntry(entryId, { status: opt.key as StatusKey })}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {entry.description && (
        <>
          <p className="slabel">Beschrijving</p>
          <p style={{ fontSize: "var(--fs-base)", marginBottom: "14px", lineHeight: "1.6" }}>{entry.description}</p>
        </>
      )}
      {entry.reflection && (
        <>
          <p className="slabel">Reflectie</p>
          <p style={{ fontSize: "var(--fs-base)", marginBottom: "14px", lineHeight: "1.6" }}>{entry.reflection}</p>
        </>
      )}
      {entry.actionItems?.length > 0 && (
        <>
          <p className="slabel">Actiepunten</p>
          <div style={{ marginBottom: "14px" }}>
            {entry.actionItems.map((item) => (
              <button
                key={item.id}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  gap: "8px",
                  padding: "5px 0",
                  alignItems: "flex-start",
                  fontFamily: "inherit",
                }}
                onClick={() => ctx.toggleActionItem(entryId, item.id)}
              >
                <span style={{ flexShrink: 0, color: item.done ? "#22c55e" : "var(--text-faint)" }}>
                  <AppIcon name="check" size="sm" strokeWidth={item.done ? 2.5 : 1.5} />
                </span>
                <span style={{
                  fontSize: "var(--fs-base)",
                  color: item.done ? "var(--text-tertiary)" : "var(--text-primary)",
                  textDecoration: item.done ? "line-through" : "none",
                }}>
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="flex-center" style={{ gap: "8px", paddingTop: "14px", borderTop: "1px solid var(--border-faint)" }}>
        <button className="btn-ghost" style={{ fontSize: "var(--fs-sm)", padding: "6px 12px" }} onClick={() => ctx.setModal({ type: "entryForm", editId: entryId })}>
          <AppIcon name="pencil" size="xs" /> Bewerken
        </button>
        <button
          className="btn-danger"
          style={{ fontSize: "var(--fs-sm)" }}
          onClick={() => ctx.setModal({
            type: "confirm",
            msg: `Weet je zeker dat je "${entry.title}" wilt verwijderen?`,
            onOk: () => { ctx.deleteEntry(entryId); ctx.setModal(null); },
          })}
        >
          <span className="flex-center" style={{ gap: "5px" }}>
            <AppIcon name="trash" size="xs" /> Verwijderen
          </span>
        </button>
      </div>
    </>
  );
}

// ─── Entry Form Modal ──────────────────────────────────────────────────────────
function EntryFormModal({ skillId, periode, editId, onClose }: {
  skillId?: string; periode?: string; editId?: string; onClose: () => void;
}) {
  const ctx = useLogbookCtx();
  const existing = editId ? ctx.state.entries.find((e) => e.id === editId) : null;
  const fixedP = periode || ctx.cur();
  const fixedPName = projectName(ctx.state.projects, fixedP);
  const skill = ALL_SKILLS.find((s) => s.id === (existing?.skillId || skillId));

  const [title, setTitle] = useState(existing?.title || "");
  // Datum wordt automatisch op vandaag gezet bij een nieuw moment (nog wel
  // aan te passen) — de student hoeft dit niet handmatig in te vullen.
  const [date, setDate] = useState(existing?.date || (editId ? "" : new Date().toISOString().slice(0, 10)));
  const [desc, setDesc] = useState(existing?.description || "");
  const [refl, setRefl] = useState(existing?.reflection || "");
  const [acts, setActs] = useState<ActionItem[]>(existing?.actionItems ? existing.actionItems.map((a) => ({ ...a })) : []);
  const [status, setStatus] = useState<StatusKey>(existing?.status || "not_started");
  const [actInput, setActInput] = useState("");
  const [titleError, setTitleError] = useState(false);

  const handleAddAct = () => {
    const trimmed = actInput.trim();
    if (!trimmed) return;
    setActs([...acts, { id: uid("ai"), text: trimmed, done: false }]);
    setActInput("");
  };

  const handleSave = () => {
    if (!title.trim()) { setTitleError(true); return; }
    if (existing) {
      ctx.updateEntry(editId!, { title: title.trim(), date, description: desc.trim(), reflection: refl.trim(), actionItems: acts, status });
    } else {
      ctx.addEntry({
        skillId: skill?.id || skillId || "",
        title: title.trim(),
        periode: fixedP,
        date,
        description: desc.trim(),
        reflection: refl.trim(),
        actionItems: acts,
        status,
      });
      ctx.triggerCelebration();
    }
    onClose();
  };

  return (
    <>
      <ModalHeader title={existing ? `Moment bewerken, ${skill?.name || ""}` : ` Nieuw ontwikkelmoment, ${skill?.name || ""}`} onClose={onClose} />
      {skill && (
        <div className="subtle-box" style={{ display: "inline-flex", alignItems: "center", gap: "7px", marginBottom: "14px", padding: "5px 11px" }}>
          <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-primary)" }}>{skill.name} · {fixedPName}</span>
        </div>
      )}
      {/* Status buttons */}
      <div className="flex-center" style={{ gap: "8px", marginBottom: "16px" }}>
        {STATUS.map((opt) => (
          <button
            key={opt.key}
            className={`chip ${opt.cls} status-toggle${status === opt.key ? " selected" : ""}`}
            onClick={() => setStatus(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <FieldLabel label="Titel">
        <input
          type="text"
          className={`input${titleError ? " error" : ""}`}
          placeholder="Wat heb je gedaan of meegemaakt?"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
        />
      </FieldLabel>
      <FieldLabel label="Datum">
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </FieldLabel>
      <FieldLabel label="Beschrijving">
        <textarea
          className="input"
          rows={3}
          placeholder="Wat gebeurde er? Wat merkte je bij jezelf?"
          style={{ resize: "vertical" }}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </FieldLabel>
      <FieldLabel label="Reflectie">
        <textarea
          className="input"
          rows={3}
          placeholder="Ging het goed of niet zo goed, en waarom? Wat heb je hiervan geleerd?"
          style={{ resize: "vertical" }}
          value={refl}
          onChange={(e) => setRefl(e.target.value)}
        />
      </FieldLabel>
      <p className="field-label">Actiepunten</p>
      <div style={{ marginBottom: "8px" }}>
        {acts.map((item) => (
          <div key={item.id} style={{ display: "flex", gap: "7px", marginBottom: "7px" }}>
            <input
              type="text"
              className="input"
              value={item.text}
              style={{ flex: 1 }}
              onChange={(e) => setActs(acts.map((a) => a.id === item.id ? { ...a, text: e.target.value } : a))}
            />
            <button className="btn-icon" onClick={() => setActs(acts.filter((a) => a.id !== item.id))}>
              <AppIcon name="x" size="sm" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex-center" style={{ gap: "7px", marginBottom: "16px" }}>
        <input
          type="text"
          className="input"
          placeholder="Voeg een actiepunt toe en druk op +"
          style={{ flex: 1 }}
          value={actInput}
          onChange={(e) => setActInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAct())}
        />
        <button className="btn btn-primary" style={{ padding: "0 14px" }} onClick={handleAddAct}>
          <AppIcon name="plus" size="sm" strokeWidth={2.5} />
        </button>
      </div>
      <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSave}>
        {existing ? "Opslaan" : "Toevoegen"}
      </button>
    </>
  );
}

// ─── LUK Criterion Detail Modal ──────────────────────────────────────────────
function LukCritDetailModal({ lukId, criterionId, periode, onClose }: {
  lukId: string; criterionId: string; periode: string; onClose: () => void;
}) {
  const ctx = useLogbookCtx();
  const luk = LUK_DEFS.find((l) => l.id === lukId);
  const crit = luk?.criteria.find((c) => c.id === criterionId);
  if (!crit) return null;
  const ces = ctx.state.lukEntries.filter((e) => e.periode === periode && e.lukId === lukId && e.criterionId === criterionId);

  return (
    <>
      <div className="flex-between" style={{ marginBottom: "16px", gap: "10px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "var(--fs-xs)", fontWeight: "var(--fw-bold)", color: "var(--pink)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", marginBottom: "4px" }}>
            {luk?.name}
          </p>
          <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", margin: "0" }}>{crit.title}</h2>
        </div>
        <button className="modal-close" onClick={onClose}>
          <AppIcon name="x" size="md" />
        </button>
      </div>
      <p className="subtle-box" style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "18px" }}>
        {crit.desc}
      </p>
      {ces.length > 0 ? (
        ces.map((entry) => (
          <button
            key={entry.id}
            className="entry-row"
            style={{ marginBottom: "8px" }}
            onClick={() => ctx.setModal({ type: "lukDetail", entryId: entry.id })}
          >
            <div className="flex-between" style={{ gap: "8px" }}>
              <div style={{ flex: 1 }}>
                {entry.title && (
                  <p style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-bold)", color: "var(--text-primary)", margin: "0 0 3px" }}>
                    {entry.title}
                  </p>
                )}
                {entry.text && (
                  <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)", margin: "0 0 5px", lineHeight: "1.4" }}>
                    {entry.text.substring(0, 80) + (entry.text.length > 80 ? "…" : "")}
                  </p>
                )}
                {entry.files?.length > 0 && (
                  <div className="flex-center" style={{ gap: "6px", flexWrap: "wrap", marginTop: "5px" }}>
                    {entry.files.map((f) => (
                      <span key={f.id} className="chip chip-gray" style={{ gap: "4px" }}>
                        <AppIcon name={f.type?.startsWith("image/") ? "image" : "paperclip"} size="xs" />
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-center" style={{ gap: "2px", flexShrink: 0 }}>
                <button
                  className="btn-icon"
                  onClick={(e) => { e.stopPropagation(); ctx.setModal({ type: "lukEntryForm", editId: entry.id, lukId, criterionId, periode }); }}
                >
                  <AppIcon name="pencil" size="xs" />
                </button>
                <button
                  className="btn-icon"
                  style={{ color: "var(--danger)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    ctx.setModal({
                      type: "confirm",
                      msg: "Weet je zeker dat je dit bewijsstuk wilt verwijderen?",
                      onOk: () => {
                        ctx.deleteLukEntry(entry.id);
                        ctx.setModal({ type: "lukCritDetail", lukId, criterionId, periode });
                      },
                    });
                  }}
                >
                  <AppIcon name="trash" size="xs" />
                </button>
              </div>
            </div>
          </button>
        ))
      ) : (
        <p style={{ fontSize: "var(--fs-base)", color: "var(--text-tertiary)", textAlign: "center", padding: "18px 0" }}>
          Nog geen bewijsstukken toegevoegd.
        </p>
      )}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginTop: "10px" }}
        onClick={() => ctx.setModal({ type: "lukEntryForm", lukId, criterionId, periode })}
      >
        <AppIcon name="plus" size="xs" strokeWidth={2.5} /> Nieuw bewijsstuk toevoegen
      </button>
    </>
  );
}

// ─── LUK Detail Modal ──────────────────────────────────────────────────────────
function LukDetailModal({ entryId, onClose }: { entryId: string; onClose: () => void }) {
  const ctx = useLogbookCtx();
  const entry = ctx.state.lukEntries.find((e) => e.id === entryId);
  if (!entry) return null;
  const luk = LUK_DEFS.find((l) => l.id === entry.lukId);
  const crit = luk?.criteria.find((c) => c.id === entry.criterionId);
  const files = entry.files || [];

  return (
    <>
      <ModalHeader title={entry.title || crit?.title || "Bewijsstuk"} onClose={onClose} />
      {crit && (
        <>
          {entry.title && (
            <p style={{ fontSize: "var(--fs-xs)", fontWeight: "var(--fw-bold)", color: "var(--pink)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", marginBottom: "4px" }}>
              {crit.title}
            </p>
          )}
          <p className="subtle-box" style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.6" }}>
            {crit.desc}
          </p>
        </>
      )}
      {entry.text && (
        <p style={{ fontSize: "var(--fs-base)", color: "var(--text-primary)", whiteSpace: "pre-wrap", marginBottom: "14px", lineHeight: "1.6" }}>
          {entry.text}
        </p>
      )}
      {files.length > 0 && (
        <>
          <p className="slabel">Bestanden</p>
          {files.map((f) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--surface-subtle)", borderRadius: "var(--r-sm)", padding: "10px 12px", marginBottom: "6px" }}>
              <span style={{ flexShrink: 0, color: "var(--text-tertiary)" }}>
                <AppIcon name={f.type?.startsWith("image/") ? "image" : "paperclip"} size="md" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {f.dataUrl ? (
                  <a href={f.dataUrl} download={f.name} style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-sm)", color: "var(--pink)", textDecoration: "none" }}>
                    {f.name}
                  </a>
                ) : (
                  <p style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-sm)", margin: "0" }}>{f.name}</p>
                )}
                {f.date && <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", margin: "0" }}>{f.date}</p>}
              </div>
              {f.type?.startsWith("image/") && f.dataUrl && (
                <img src={f.dataUrl} alt={f.name} style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "var(--r-xs)", border: "1px solid var(--border)", flexShrink: 0 }} />
              )}
            </div>
          ))}
        </>
      )}
      <div className="flex-center" style={{ gap: "8px", paddingTop: "14px", borderTop: "1px solid var(--border-faint)", marginTop: "14px" }}>
        <button className="btn-ghost" style={{ fontSize: "var(--fs-sm)", padding: "6px 12px" }} onClick={() => ctx.setModal({ type: "lukEntryForm", editId: entryId, lukId: entry.lukId, criterionId: entry.criterionId, periode: entry.periode })}>
          <AppIcon name="pencil" size="xs" /> Bewerken
        </button>
        <button
          className="btn-danger"
          style={{ fontSize: "var(--fs-sm)" }}
          onClick={() => ctx.setModal({
            type: "confirm",
            msg: "Weet je zeker dat je dit bewijsstuk wilt verwijderen?",
            onOk: () => { ctx.deleteLukEntry(entryId); ctx.setModal(null); },
          })}
        >
          <span className="flex-center" style={{ gap: "5px" }}>
            <AppIcon name="trash" size="xs" /> Verwijderen
          </span>
        </button>
      </div>
    </>
  );
}

// ─── LUK Entry Form Modal ──────────────────────────────────────────────────────
function LukEntryFormModal({ lukId, criterionId, periode, editId, onClose }: {
  lukId: string; criterionId: string; periode: string; editId?: string; onClose: () => void;
}) {
  const ctx = useLogbookCtx();
  const existing = editId ? ctx.state.lukEntries.find((e) => e.id === editId) : null;
  const luk = LUK_DEFS.find((l) => l.id === lukId);
  const crit = luk?.criteria.find((c) => c.id === criterionId);

  const [title, setTitle] = useState(existing?.title || "");
  const [text, setText] = useState(existing?.text || "");
  const [files, setFiles] = useState<LukFile[]>(existing?.files ? existing.files.map((f) => ({ ...f })) : []);

  // Bestanden (inclusief foto's) worden ongewijzigd opgeslagen — geen
  // kwaliteitsverlies door verkleinen/hercomprimeren. De data staat lokaal
  // op de computer van de student, dus bestandsgrootte is geen beperking
  // zoals bij bijvoorbeeld cloudopslag.
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const today = new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
    Array.from(e.target.files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFiles((prev) => [...prev, { id: uid("f"), name: file.name, type: file.type, dataUrl: ev.target?.result as string, date: today }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleSave = () => {
    if (existing) {
      ctx.updateLukEntry(editId!, { title: title.trim(), text: text.trim(), files });
    } else {
      ctx.addLukEntry({ lukId, criterionId, periode, title: title.trim(), text: text.trim(), files });
      ctx.triggerCelebration();
    }
    ctx.setModal({ type: "lukCritDetail", lukId, criterionId, periode });
  };

  return (
    <>
      <ModalHeader title={existing ? "Bewijsstuk bewerken" : "Nieuw bewijsstuk"} onClose={onClose} />
      {crit && (
        <>
          <p style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-sm)", color: "var(--pink)", marginBottom: "4px" }}>{crit.title}</p>
          <p className="subtle-box" style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.6" }}>{crit.desc}</p>
        </>
      )}
      <FieldLabel label="Titel" hint="Handig om dit bewijsstuk later terug te vinden, bijvoorbeeld in je exportbestand.">
        <input
          type="text"
          className="input"
          placeholder="Bijv. 'Interview met stakeholder X'"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FieldLabel>
      <FieldLabel label="Toelichting">
        <textarea
          className="input"
          rows={4}
          placeholder="Wat wil je hiermee aantonen? Wat is de context?"
          style={{ resize: "vertical" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </FieldLabel>
      <p className="field-label">Bestanden</p>
      <div style={{ marginBottom: "10px" }}>
        {files.map((f, i) => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--surface-subtle)", borderRadius: "var(--r-sm)", padding: "10px 12px", marginBottom: "6px" }}>
            <span style={{ flexShrink: 0, color: "var(--text-tertiary)" }}>
              <AppIcon name={f.type?.startsWith("image/") ? "image" : "paperclip"} size="md" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-sm)", margin: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", margin: "0" }}>{f.date || ""}</p>
            </div>
            {f.type?.startsWith("image/") && f.dataUrl && (
              <img src={f.dataUrl} alt={f.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "var(--r-xs)", border: "1px solid var(--border)", flexShrink: 0 }} />
            )}
            <button className="btn-icon" style={{ flexShrink: 0 }} onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
              <AppIcon name="x" size="sm" />
            </button>
          </div>
        ))}
      </div>
      <label className="dropzone" style={{ marginBottom: "6px" }}>
        <AppIcon name="folder" size="sm" />
        Bestanden toevoegen (alle typen)
        <input type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
      </label>
      <p className="field-hint" style={{ marginBottom: "16px" }}>
        Bestanden worden ongewijzigd opgeslagen als bijlage.
      </p>
      <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSave}>
        {existing ? "Opslaan" : "Toevoegen"}
      </button>
    </>
  );
}

// ─── Skill Indicators Modal (skills-overzicht — niet projectgebonden) ───────────
function SkillIndicatorsModal({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const skill = ALL_SKILLS.find((s) => s.id === skillId);
  if (!skill) return null;

  return (
    <>
      <div className="flex-between" style={{ marginBottom: "18px" }}>
        <div className="dot-row" style={{ gap: "10px" }}>
          <h2 style={{ fontSize: "var(--fs-lg)", fontWeight: "var(--fw-bold)", margin: "0" }}>{skill.name}</h2>
        </div>
        <button className="modal-close" onClick={onClose}>
          <AppIcon name="x" size="md" />
        </button>
      </div>
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.6" }}>{skill.desc}</p>
      <p className="slabel">Indicatoren ({skill.ind.length})</p>
      <div className="subtle-box">
        {skill.ind.map((ind, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid var(--border-faint)" }}>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)", lineHeight: "1.5" }}>{ind}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Complete Project Modal ──────────────────────────────────────────────────────
function CompleteProjectModal({ projectKey, onClose }: { projectKey: string; onClose: () => void }) {
  const ctx = useLogbookCtx();
  const displayName = projectName(ctx.state.projects, projectKey);

  const handleKeep = () => {
    ctx.completeProject(projectKey);
    onClose();
  };

  const handleReset = () => {
    ctx.setModal({
      type: "confirm",
      msg: `Weet je zeker dat je "${displayName}" wilt resetten? Alle ontwikkelmomenten, bewijsstukken en instellingen van dit project worden verwijderd en het project gaat terug naar "nog niet gestart".`,
      onOk: () => { ctx.resetProject(projectKey); ctx.setModal(null); },
    });
  };

  return (
    <>
      <ModalHeader title={`"${displayName}" afronden`} onClose={onClose} />
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "18px", lineHeight: "1.6" }}>
        Wat wil je doen met de gegevens van dit project?
      </p>
      <button
        className="btn btn-primary"
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "left",
          whiteSpace: "normal",
          marginBottom: "10px",
          padding: "12px 14px",
        }}
        onClick={handleKeep}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "var(--fw-bold)" }}>
          <AppIcon name="check" size="sm" strokeWidth={2.5} /> Alles laten staan
        </span>
        <span style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-regular)", opacity: 0.85, marginTop: "3px" }}>
          Het project verschijnt bij "Afgeronde projecten", alle gegevens blijven bewaard.
        </span>
      </button>
      <button
        className="btn-ghost"
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "left",
          padding: "12px 14px",
          color: "var(--danger)",
        }}
        onClick={handleReset}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "var(--fw-bold)" }}>
          <AppIcon name="trash" size="sm" /> Project resetten
        </span>
        <span style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-regular)", opacity: 0.85, marginTop: "3px" }}>
          Alle ontwikkelmomenten en bewijsstukken worden verwijderd, het project gaat terug naar "nog niet gestart".
        </span>
      </button>
    </>
  );
}

// ─── New Project Modal (vrije projectaanmaak) ───────────────────────────────────
function NewProjectModal({ onClose }: { onClose: () => void }) {
  const ctx = useLogbookCtx();
  const [naam, setNaam] = useState("");
  const [naamError, setNaamError] = useState(false);
  const [lukIds, setLukIds] = useState<string[]>([]);
  const [lukError, setLukError] = useState(false);
  const [skillsEnabled, setSkillsEnabled] = useState(false);
  const [skillIds, setSkillIds] = useState<string[]>([]);

  const toggleLuk = (id: string) => {
    setLukIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (next.length > 0) setLukError(false);
      return next;
    });
  };
  const toggleSkill = (id: string) => {
    setSkillIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    const trimmed = naam.trim();
    if (!trimmed) { setNaamError(true); return; }
    if (lukIds.length === 0) { setLukError(true); return; }
    ctx.createProject(trimmed, lukIds, skillsEnabled ? skillIds : []);
    onClose();
  };

  return (
    <>
      <ModalHeader title="Nieuw project" onClose={onClose} />
      <FieldLabel label="Naam van het project">
        <input
          type="text"
          className={`input${naamError ? " error" : ""}`}
          placeholder="Bijv. 'Duurzame verpakking herontwerpen'"
          value={naam}
          onChange={(e) => { setNaam(e.target.value); setNaamError(false); }}
        />
      </FieldLabel>

      <p className="field-label">Leeruitkomsten (verplicht, kies er minstens 1)</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "10px", marginBottom: "6px" }}>
        {LUK_DEFS.map((luk) => {
          const sel = lukIds.includes(luk.id);
          return (
            <div
              key={luk.id}
              className={`onboard-card${sel ? " sel" : ""}`}
              onClick={() => toggleLuk(luk.id)}
            >
              <div className="flex-between" style={{ marginBottom: "5px" }}>
                <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-sm)" }}>{luk.name}</span>
                {sel && <span style={{ color: "var(--pink)" }}><AppIcon name="check" size="sm" strokeWidth={2.5} /></span>}
              </div>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{luk.criteria.length} succescriteria</p>
            </div>
          );
        })}
      </div>
      {lukError && (
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--danger)", marginBottom: "10px" }}>
          Kies minstens één leeruitkomst.
        </p>
      )}

      <label className="flex-center" style={{ gap: "8px", marginTop: "16px", marginBottom: skillsEnabled ? "10px" : "18px", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={skillsEnabled}
          onChange={(e) => setSkillsEnabled(e.target.checked)}
        />
        <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)" }}>Skills toevoegen aan dit project</span>
      </label>
      {skillsEnabled && (
        <div className="grid-3" style={{ marginBottom: "18px" }}>
          {ALL_SKILLS.map((sk) => {
            const sel = skillIds.includes(sk.id);
            return (
              <div
                key={sk.id}
                className="onboard-card"
                style={sel ? { borderColor: sk.color, background: `${sk.color}08` } : {}}
                onClick={() => toggleSkill(sk.id)}
              >
                <div className="flex-between">
                  <div className="dot-row" style={{ gap: "6px" }}>
                    <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)" }}>{sk.name}</span>
                  </div>
                  {sel && <span style={{ color: sk.color }}><AppIcon name="check" size="sm" strokeWidth={2.5} /></span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleCreate}>
        Project aanmaken
      </button>
    </>
  );
}

// ─── Hulpmiddel Detail Modal ──────────────────────────────────────────────────
function HulpmiddelDetailModal({ hulpmiddelId, onClose }: { hulpmiddelId: string; onClose: () => void }) {
  const ctx = useLogbookCtx();
  const h = HULPMIDDELEN.find((x) => x.id === hulpmiddelId);
  const [status, setStatus] = useState<string | null>(null);
  if (!h) return null;

  const flashStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  const handleOpen = () => {
    ctx.setModal({ type: "hulpmiddelLightbox", hulpmiddelId: h.id });
  };

  const handleDownload = async () => {
    const res = await ctx.downloadHulpmiddel(h.bestandsnaam, h.bestandsnaam);
    if (res.success) flashStatus("Opgeslagen.");
    else if (!res.canceled) flashStatus(res.error || "Kon het bestand niet downloaden.");
  };

  return (
    <>
      <ModalHeader title={h.titel} onClose={onClose} />
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "18px", lineHeight: "1.6" }}>
        {h.beschrijving}
      </p>
      <div className="flex-center" style={{ gap: "8px" }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleOpen}>
          <AppIcon name="eye" size="xs" /> Bekijken
        </button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={handleDownload}>
          <span className="flex-center" style={{ gap: "5px", justifyContent: "center" }}>
            <AppIcon name="download" size="xs" /> Downloaden
          </span>
        </button>
      </div>
      {status && (
        <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", marginTop: "10px", textAlign: "center" }}>
          {status}
        </p>
      )}
    </>
  );
}

// ─── Confirm Modal ──────────────────────────────────────────────────────────────
function ConfirmModal({ msg, onOk, onClose }: { msg: string; onOk: () => void; onClose: () => void }) {
  return (
    <>
      <p style={{ fontSize: "var(--fs-base)", color: "var(--text-primary)", marginBottom: "20px", lineHeight: "1.6" }}>{msg}</p>
      <div className="flex-center" style={{ gap: "8px", justifyContent: "flex-end" }}>
        <button className="btn-ghost" onClick={onClose}>Annuleren</button>
        <button className="btn-destructive" onClick={onOk}>
          Verwijderen
        </button>
      </div>
    </>
  );
}
