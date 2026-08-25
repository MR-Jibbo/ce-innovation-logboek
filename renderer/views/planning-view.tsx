import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { pk } from "../lib/use-logbook";
import { AppIcon } from "../components/AppIcon";
import type { Deadline } from "../lib/types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PlanningView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [projectKey, setProjectKey] = useState("");
  const [titleError, setTitleError] = useState(false);

  const vp = state.visibleProjects || { jaar1: [], jaar2: [] };
  const projectOptions = [...(vp.jaar1 || []), ...(vp.jaar2 || [])].map((i) => pk(state.projNames, i));

  const handleAdd = () => {
    if (!title.trim()) { setTitleError(true); return; }
    ctx.addDeadline({ title: title.trim(), date, projectKey: projectKey || undefined });
    setTitle("");
    setTitleError(false);
  };

  const today = todayISO();
  const deadlines = state.deadlines || [];
  const upcoming = deadlines.filter((d: Deadline) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = deadlines.filter((d: Deadline) => d.date < today).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Planning</h1>
      <p className="page-subtitle">Houd hier je deadlines bij — ze verschijnen ook op je dashboard.</p>

      <div className="card" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "12px" }}>
          Nieuwe deadline
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <input
            type="text"
            className={`input${titleError ? " error" : ""}`}
            placeholder="Waar is de deadline voor?"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex-center" style={{ gap: "10px" }}>
          <select
            className="input"
            style={{ flex: 1 }}
            value={projectKey}
            onChange={(e) => setProjectKey(e.target.value)}
          >
            <option value="">Geen specifiek project</option>
            {projectOptions.map((nm) => (
              <option key={nm} value={nm}>{nm}</option>
            ))}
          </select>
          <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={handleAdd}>
            <AppIcon name="plus" size="xs" strokeWidth={2.5} /> Toevoegen
          </button>
        </div>
      </div>

      <h2 className="section-title">Aankomend ({upcoming.length})</h2>
      {upcoming.length === 0 ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "24px", marginBottom: "24px" }}>
          Geen aankomende deadlines. Je bent helemaal bij! 🎉
        </div>
      ) : (
        <div style={{ marginBottom: "24px" }}>
          {upcoming.map((d: Deadline) => (
            <DeadlineRow key={d.id} deadline={d} onDelete={() => ctx.deleteDeadline(d.id)} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="section-title">Verlopen ({past.length})</h2>
          {past.map((d: Deadline) => (
            <DeadlineRow key={d.id} deadline={d} onDelete={() => ctx.deleteDeadline(d.id)} muted />
          ))}
        </>
      )}
    </div>
  );
}

function DeadlineRow({ deadline, onDelete, muted }: { deadline: Deadline; onDelete: () => void; muted?: boolean }) {
  return (
    <div
      className="card-sm"
      style={{
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        opacity: muted ? 0.6 : 1,
      }}
    >
      <div className="dot-row" style={{ gap: "10px", minWidth: 0 }}>
        <AppIcon name="planning" size="sm" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-base)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {deadline.title}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
            {deadline.date}{deadline.projectKey ? ` · ${deadline.projectKey}` : ""}
          </div>
        </div>
      </div>
      <button className="btn-icon" style={{ flexShrink: 0, color: "var(--danger)" }} onClick={onDelete}>
        <AppIcon name="trash" size="sm" />
      </button>
    </div>
  );
}
