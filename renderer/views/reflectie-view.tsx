import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { AppIcon } from "../components/AppIcon";
import type { Reflection } from "../lib/types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReflectieView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  const [date, setDate] = useState(todayISO());
  const [text, setText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const reflections = [...(state.reflections || [])].sort((a: Reflection, b: Reflection) => b.date.localeCompare(a.date));

  const handleSave = () => {
    if (!text.trim()) return;
    if (editId) {
      ctx.updateReflection(editId, { date, text: text.trim() });
    } else {
      ctx.addReflection({ date, text: text.trim() });
    }
    setText("");
    setDate(todayISO());
    setEditId(null);
  };

  const startEdit = (r: Reflection) => {
    setEditId(r.id);
    setDate(r.date);
    setText(r.text);
  };

  const cancelEdit = () => {
    setEditId(null);
    setText("");
    setDate(todayISO());
  };

  return (
    <div className="animate-fade-in">
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="flex-between" style={{ marginBottom: "10px" }}>
          <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)" }}>
            {editId ? "Reflectie bewerken" : "Nieuwe reflectie"}
          </h2>
          <input
            type="date"
            className="input"
            style={{ width: "160px" }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <textarea
          className="input"
          rows={4}
          placeholder="Hoe ging het deze week? Wat viel je op, en wat neem je hiervan mee?"
          style={{ resize: "vertical", marginBottom: "10px" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex-center" style={{ gap: "8px" }}>
          <button className="btn btn-primary" onClick={handleSave}>
            {editId ? "Opslaan" : "Toevoegen"}
          </button>
          {editId && (
            <button className="btn-ghost" onClick={cancelEdit}>Annuleren</button>
          )}
        </div>
      </div>

      {reflections.length === 0 ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          Nog geen reflecties geschreven.
        </div>
      ) : (
        reflections.map((r: Reflection) => (
          <div key={r.id} className="card-sm" style={{ marginBottom: "10px" }}>
            <div className="flex-between" style={{ marginBottom: "6px" }}>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", fontWeight: "var(--fw-semibold)" }}>{r.date}</span>
              <div className="flex-center" style={{ gap: "2px" }}>
                <button className="btn-icon" onClick={() => startEdit(r)}>
                  <AppIcon name="pencil" size="xs" />
                </button>
                <button
                  className="btn-icon"
                  style={{ color: "var(--danger)" }}
                  onClick={() => ctx.setModal({
                    type: "confirm",
                    msg: "Weet je zeker dat je deze reflectie wilt verwijderen?",
                    onOk: () => { ctx.deleteReflection(r.id); ctx.setModal(null); },
                  })}
                >
                  <AppIcon name="trash" size="xs" />
                </button>
              </div>
            </div>
            <p style={{ fontSize: "var(--fs-base)", color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
              {r.text}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
