import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { pk, keyOfIndex, indexOfKey, yearOfIndex, yearSuffix, daysUntilLabel } from "../lib/use-logbook";
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
  const projectOptions = [...(vp.jaar1 || []), ...(vp.jaar2 || [])].map((i) => ({ idx: i, name: pk(state.projNames, i) }));

  const handleAdd = () => {
    if (!title.trim()) { setTitleError(true); return; }
    ctx.addDeadline({ title: title.trim(), date, projectKey: projectKey || undefined });
    setTitle("");
    setTitleError(false);
  };

  const today = todayISO();
  const deadlines = state.deadlines || [];
  const upcoming = deadlines.filter((d: Deadline) => !d.done && d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = deadlines.filter((d: Deadline) => !d.done && d.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const done = deadlines.filter((d: Deadline) => d.done).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="animate-fade-in">
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
            {projectOptions.map(({ idx, name }) => (
              <option key={idx} value={keyOfIndex(idx)}>{name} (Jaar {yearOfIndex(idx)})</option>
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
            <DeadlineRow
              key={d.id}
              deadline={d}
              projNames={state.projNames}
              onDelete={() => ctx.deleteDeadline(d.id)}
              onToggleDone={() => ctx.toggleDeadlineDone(d.id)}
            />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="section-title">Verlopen ({past.length})</h2>
          <div style={{ marginBottom: "24px" }}>
            {past.map((d: Deadline) => (
              <DeadlineRow
                key={d.id}
                deadline={d}
                projNames={state.projNames}
                onDelete={() => ctx.deleteDeadline(d.id)}
                onToggleDone={() => ctx.toggleDeadlineDone(d.id)}
                muted
              />
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <h2 className="section-title">Afgerond ({done.length})</h2>
          {done.map((d: Deadline) => (
            <DeadlineRow
              key={d.id}
              deadline={d}
              projNames={state.projNames}
              onDelete={() => ctx.deleteDeadline(d.id)}
              onToggleDone={() => ctx.toggleDeadlineDone(d.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function DeadlineRow({ deadline, projNames, onDelete, onToggleDone, muted }: {
  deadline: Deadline;
  projNames: string[];
  onDelete: () => void;
  onToggleDone: () => void;
  muted?: boolean;
}) {
  const isDone = !!deadline.done;
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
        <button
          className="btn-icon"
          style={{
            flexShrink: 0,
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            border: `2px solid ${isDone ? "var(--pink)" : "var(--border-strong)"}`,
            background: isDone ? "var(--pink)" : "none",
            color: "#fff",
            padding: "0",
          }}
          onClick={onToggleDone}
          title={isDone ? "Markeer als niet afgerond" : "Markeer als afgerond"}
        >
          {isDone && <AppIcon name="check" size="xs" strokeWidth={3} />}
        </button>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: "var(--fw-semibold)",
              fontSize: "var(--fs-base)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textDecoration: isDone ? "line-through" : "none",
              color: isDone ? "var(--text-tertiary)" : "var(--text-primary)",
            }}
          >
            {deadline.title}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
            {deadline.date}{deadline.projectKey ? ` · ${pk(projNames, indexOfKey(deadline.projectKey))}${yearSuffix(deadline.projectKey)}` : ""}
            {!isDone && (
              <>
                {" · "}
                <span style={{ color: "var(--pink)", fontWeight: "var(--fw-semibold)" }}>{daysUntilLabel(deadline.date)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <button className="btn-icon" style={{ flexShrink: 0, color: "var(--danger)" }} onClick={onDelete}>
        <AppIcon name="trash" size="sm" />
      </button>
    </div>
  );
}
