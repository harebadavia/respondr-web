import Button from "./Button";
import { PAGE_SIZE_OPTIONS } from "./listControlUtils";

const SURFACE_STYLE = {
  background: "#FFFFFF",
  border: "1px solid #DDE4EE",
  borderRadius: 16,
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 11px",
  fontSize: 13,
  color: "var(--color-text-primary)",
  background: "var(--color-background-secondary)",
  border: "0.5px solid var(--color-border-secondary)",
  borderRadius: 8,
  outline: "none",
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--color-text-tertiary)",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
};

export function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  filters = [],
  pageSize,
  onPageSizeChange,
}) {
  return (
    <div
      style={{
        ...SURFACE_STYLE,
        padding: "14px 16px",
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "flex-end",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 260px", minWidth: 220 }}>
        <label style={labelStyle}>Search</label>
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
      </div>

      {filters.map((filter) => (
        <div key={filter.id} style={{ display: "flex", flexDirection: "column", gap: 6, flex: "0 1 180px", minWidth: 150 }}>
          <label style={labelStyle}>{filter.label}</label>
          <select value={filter.value} onChange={(event) => filter.onChange(event.target.value)} style={inputStyle}>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      ))}

      {pageSize && onPageSizeChange ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "0 0 110px" }}>
          <label style={labelStyle}>Rows</label>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} style={inputStyle}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

export function Pagination({ page, totalPages, totalItems, start, end, onPageChange }) {
  if (totalItems === 0) return null;
  return (
    <div
      style={{
        ...SURFACE_STYLE,
        padding: "10px 14px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>
        Showing {start + 1}-{end} of {totalItems}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)" }}>
          {page} / {totalPages}
        </span>
        <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
