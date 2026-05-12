import { FaClipboardCheck, FaShieldHalved, FaUser } from "react-icons/fa6";

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    icon: FaShieldHalved,
    iconBg: "linear-gradient(135deg, #EEEDFE 0%, #E0DEFC 100%)",
    iconColor: "#534AB7",
    pillBg: "#EEEDFE",
    pillText: "#534AB7",
    accent: "radial-gradient(circle, rgba(127,119,221,0.08) 0%, rgba(255,255,255,0) 60%)",
  },
  official: {
    label: "Official",
    icon: FaClipboardCheck,
    iconBg: "linear-gradient(135deg, #E6F1FB 0%, #D9EFFF 100%)",
    iconColor: "#185FA5",
    pillBg: "#E6F1FB",
    pillText: "#185FA5",
    accent: "radial-gradient(circle, rgba(55,138,221,0.08) 0%, rgba(255,255,255,0) 60%)",
  },
  resident: {
    label: "Resident",
    icon: FaUser,
    iconBg: "linear-gradient(135deg, #EAF3DE 0%, #E0EDD1 100%)",
    iconColor: "#3B6D11",
    pillBg: "#EAF3DE",
    pillText: "#3B6D11",
    accent: "radial-gradient(circle, rgba(99,153,34,0.08) 0%, rgba(255,255,255,0) 60%)",
  },
};

export default function RolePageHeader({ title, subtitle, role = "resident", icon: IconOverride = null, right = null }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.resident;
  const Icon = cfg.icon;
  const HeaderIcon = IconOverride || Icon;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-b border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] px-8 py-7"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-[300px] w-[300px] rounded-full"
        style={{ background: cfg.accent }}
      />

      <div className="relative z-[1] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-[18px]">
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]"
            style={{
              background: cfg.iconBg,
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.6)",
            }}
          >
            <HeaderIcon style={{ fontSize: 20, color: cfg.iconColor }} />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="m-0 text-2xl font-bold leading-tight tracking-[-0.03em] text-[var(--color-text-primary)]">
                {title}
              </h1>
              <span
                className="rounded-full px-[10px] py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{
                  background: cfg.pillBg,
                  color: cfg.pillText,
                }}
              >
                {cfg.label}
              </span>
            </div>
            {subtitle ? (
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {right}
      </div>
    </div>
  );
}
