import { useMemo, useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { LUK_DEFS } from "../lib/constants";
import { projectName } from "../lib/use-logbook";
import { AppIcon } from "../components/AppIcon";
import type { LukEntry } from "../lib/types";

type DatePeriod = "alle" | "7dagen" | "30dagen" | "ditjaar" | "specifiek";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function withinPeriod(dateStr: string | undefined, period: DatePeriod, specificDate: string): boolean {
  if (period === "alle") return true;
  if (!dateStr) return false;
  if (period === "specifiek") return specificDate ? dateStr === specificDate : true;
  const today = new Date(todayISO());
  const d = new Date(dateStr);
  if (period === "ditjaar") return d.getFullYear() === today.getFullYear();
  const days = period === "7dagen" ? 7 : 30;
  const diffMs = today.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export function BewijsstukkenView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [lukFilter, setLukFilter] = useState("");
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("alle");
  const [specificDate, setSpecificDate] = useState(todayISO());

  // No explicit date on every LukEntry — id is chronological-ish (uid includes
  // a random suffix, not sortable), so just keep insertion order reversed.
  const sorted = [...state.lukEntries].reverse();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((e: LukEntry) => {
      if (projectFilter && e.periode !== projectFilter) return false;
      if (lukFilter && e.lukId !== lukFilter) return false;
      if (!withinPeriod(e.date, datePeriod, specificDate)) return false;
      if (q) {
        const luk = LUK_DEFS.find((l) => l.id === e.lukId);
        const crit = luk?.criteria.find((c) => c.id === e.criterionId);
        const haystack = [e.title, crit?.title, e.text, luk?.name, projectName(state.projects, e.periode)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [sorted, search, projectFilter, lukFilter, datePeriod, specificDate, state.projects]);

  const filtersActive = !!search || !!projectFilter || !!lukFilter || datePeriod !== "alle";

  const resetFilters = () => {
    setSearch("");
    setProjectFilter("");
    setLukFilter("");
    setDatePeriod("alle");
  };

  return (
    <div className="animate-fade-in">
      {/* Zoeken en filteren */}
      <div className="card" style={{ marginBottom: "18px" }}>
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }}>
            <AppIcon name="search" size="sm" />
          </span>
          <input
            type="text"
            className="input"
            style={{ paddingLeft: "36px" }}
            placeholder="Zoek in bewijsstukken…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
          <select className="input" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">Alle projecten</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.naam}</option>
            ))}
          </select>

          <select className="input" value={lukFilter} onChange={(e) => setLukFilter(e.target.value)}>
            <option value="">Alle leeruitkomsten</option>
            {LUK_DEFS.map((luk) => (
              <option key={luk.id} value={luk.id}>{luk.name}</option>
            ))}
          </select>

          <select className="input" value={datePeriod} onChange={(e) => setDatePeriod(e.target.value as DatePeriod)}>
            <option value="alle">Alle datums</option>
            <option value="7dagen">Laatste 7 dagen</option>
            <option value="30dagen">Laatste 30 dagen</option>
            <option value="ditjaar">Dit jaar</option>
            <option value="specifiek">Specifieke datum…</option>
          </select>

          {datePeriod === "specifiek" && (
            <input
              type="date"
              className="input"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
            />
          )}
        </div>

        {filtersActive && (
          <div className="flex-between" style={{ marginTop: "10px" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
              {filtered.length} van {sorted.length} bewijsstuk{sorted.length !== 1 ? "ken" : ""}
            </span>
            <button className="btn-link" style={{ fontSize: "var(--fs-xs)" }} onClick={resetFilters}>
              Filters wissen
            </button>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          Nog geen bewijsstukken toegevoegd. Voeg er een toe vanuit een project.
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          <p style={{ marginBottom: "10px" }}>Geen bewijsstukken gevonden voor deze zoekopdracht of filters.</p>
          <button className="btn-link" onClick={resetFilters}>Filters wissen</button>
        </div>
      ) : (
        filtered.map((e: LukEntry) => {
          const luk = LUK_DEFS.find((l) => l.id === e.lukId);
          const crit = luk?.criteria.find((c) => c.id === e.criterionId);
          return (
            <button
              key={e.id}
              className="entry-row"
              style={{ marginBottom: "8px", width: "100%" }}
              onClick={() => ctx.setModal({ type: "lukDetail", entryId: e.id })}
            >
              <div className="flex-between" style={{ gap: "10px" }}>
                <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-base)" }}>
                  {e.title || crit?.title || "Bewijsstuk"}
                </span>
                {e.files?.length > 0 && (
                  <span className="chip chip-gray" style={{ fontSize: "var(--fs-xs)", flexShrink: 0 }}>
                    {e.files.length} bestand{e.files.length !== 1 ? "en" : ""}
                  </span>
                )}
              </div>
              {e.text && (
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", margin: "5px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.text}
                </p>
              )}
              <div className="flex-center" style={{ gap: "10px", marginTop: "5px", fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                {luk && <span>{luk.name}</span>}
                <span className="dot-row" style={{ gap: "4px" }}>
                  <AppIcon name="projects" size="xs" /> {projectName(state.projects, e.periode)}
                </span>
                {e.date && <span>{e.date}</span>}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
