import { useEffect, useMemo, useState } from "react";
import { FaBars } from "react-icons/fa";
import SideNav from "../components/navigation/SideNav";

const SIDENAV_STORAGE_KEY = "respondr.sidenav.collapsed";

function readPersistedCollapsed() {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(SIDENAV_STORAGE_KEY);
  return stored === "true";
}

export default function AppShell({ role, userFirstName, userEmail, profileTo, modules, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(readPersistedCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const desktopSidebarWidth = useMemo(
    () => (collapsed ? "md:w-[84px]" : "md:w-[280px]"),
    [collapsed]
  );

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
            role={role}
            profileTo={profileTo}
            onLogout={onLogout}
            onNavigate={() => {}}
          />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-neutral-900/40 md:hidden" onClick={() => setMobileOpen(false)}>
            <aside
              className="h-full w-[280px] border-r border-[var(--color-border-tertiary)] bg-white"
              onClick={(event) => event.stopPropagation()}
            >
              <SideNav
                collapsed={false}
                onToggleCollapsed={() => setCollapsed((prev) => !prev)}
                modules={modules}
                firstName={userFirstName}
                email={userEmail}
                role={role}
                profileTo={profileTo}
                onLogout={onLogout}
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
    </div>
  );
}
