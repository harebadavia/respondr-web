import { useEffect, useMemo, useState } from "react";
import { FaBars } from "react-icons/fa";
import SideNav from "../components/navigation/SideNav";
import QuickstartModal from "../components/quickstart/QuickstartModal";

const SIDENAV_STORAGE_KEY = "respondr.sidenav.collapsed";
const QUICKSTART_AUTO_ROLES = new Set(["resident", "official"]);

function readPersistedCollapsed() {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(SIDENAV_STORAGE_KEY);
  return stored === "true";
}

export default function AppShell({
  role,
  userFirstName,
  userEmail,
  profileTo,
  modules,
  onLogout,
  quickstartCompletedAt,
  onQuickstartComplete,
  quickstartRole,
  children,
}) {
  const [collapsed, setCollapsed] = useState(readPersistedCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickstartOpen, setQuickstartOpen] = useState(false);
  const [quickstartSource, setQuickstartSource] = useState("manual");
  const [completedForUserEmail, setCompletedForUserEmail] = useState(null);
  const normalizedRole = String(quickstartRole || role || "resident").toLowerCase();
  const accountRole = String(role || "").toLowerCase();
  const quickstartCompleted = Boolean(quickstartCompletedAt || (userEmail && completedForUserEmail === userEmail));

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDENAV_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!QUICKSTART_AUTO_ROLES.has(accountRole)) return;
    if (quickstartCompleted || quickstartOpen) return;

    const timer = window.setTimeout(() => {
      setQuickstartSource("auto");
      setQuickstartOpen(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [accountRole, quickstartCompleted, quickstartOpen]);

  const desktopSidebarWidth = useMemo(
    () => (collapsed ? "md:w-[84px]" : "md:w-[300px]"),
    [collapsed]
  );

  const openQuickstart = () => {
    setQuickstartSource("manual");
    setQuickstartOpen(true);
  };

  const closeQuickstart = async () => {
    setQuickstartOpen(false);

    if (quickstartSource !== "auto" || quickstartCompleted) return;

    setCompletedForUserEmail(userEmail || null);
    try {
      await onQuickstartComplete?.();
    } catch (err) {
      console.warn("Quickstart completion failed:", err?.message || err);
    }
  };

  const completeQuickstart = async () => {
    setQuickstartOpen(false);

    if (quickstartCompleted) return;

    setCompletedForUserEmail(userEmail || null);
    try {
      await onQuickstartComplete?.();
    } catch (err) {
      console.warn("Quickstart completion failed:", err?.message || err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background-tertiary)] text-neutral-900">
      <div className="flex min-h-screen">
        <aside
          className={`hidden border-r border-[var(--color-border-tertiary)] bg-white transition-[width] duration-200 md:sticky md:top-0 md:block md:h-screen md:self-start ${desktopSidebarWidth}`}
        >
          <SideNav
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((prev) => !prev)}
            modules={modules}
            firstName={userFirstName}
            email={userEmail}
            profileTo={profileTo}
            onLogout={onLogout}
            onOpenQuickstart={openQuickstart}
            onNavigate={() => {}}
          />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-neutral-900/40 md:hidden" onClick={() => setMobileOpen(false)}>
            <aside
              className="h-full w-[300px] max-w-[86vw] border-r border-[var(--color-border-tertiary)] bg-white"
              onClick={(event) => event.stopPropagation()}
            >
              <SideNav
                collapsed={false}
                onToggleCollapsed={() => setCollapsed((prev) => !prev)}
                modules={modules}
                firstName={userFirstName}
                email={userEmail}
                profileTo={profileTo}
                onLogout={onLogout}
                onOpenQuickstart={openQuickstart}
                mobile
                onNavigate={() => setMobileOpen(false)}
              />
            </aside>
          </div>
        )}

        <div className="flex min-h-screen flex-1 flex-col">
          <main className="flex-1 px-4 py-4 md:px-6 md:py-5">
            <div className="mb-3 md:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-md p-2 text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Open sidebar"
              >
                <FaBars />
              </button>
            </div>
            {children}
          </main>
        </div>
      </div>
      <QuickstartModal
        key={`${normalizedRole}-${quickstartSource}-${quickstartOpen ? "open" : "closed"}`}
        open={quickstartOpen}
        role={normalizedRole}
        onClose={closeQuickstart}
        onComplete={completeQuickstart}
      />
    </div>
  );
}
