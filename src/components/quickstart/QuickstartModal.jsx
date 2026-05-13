import { useMemo, useState } from "react";
import {
  FaAngleLeft,
  FaAngleRight,
  FaBell,
  FaBullhorn,
  FaChartLine,
  FaCheck,
  FaClipboardList,
  FaLocationDot,
  FaMapLocationDot,
  FaMessage,
  FaRegHandshake,
  FaShieldHalved,
} from "react-icons/fa6";
import Button from "../ui/Button";
import { cx } from "../ui/classNames";

const ROLE_THEME = {
  resident: {
    label: "Resident",
    accent: "#3B6D11",
    soft: "#EAF3DE",
    mid: "#B8D99D",
    text: "#25470C",
  },
  official: {
    label: "Official",
    accent: "#185FA5",
    soft: "#E6F1FB",
    mid: "#A7CBE8",
    text: "#0C447C",
  },
  admin: {
    label: "Admin",
    accent: "#52525B",
    soft: "#F4F4F5",
    mid: "#D4D4D8",
    text: "#27272A",
  },
};

const SLIDES = {
  resident: [
    {
      title: "Dashboard",
      icon: FaChartLine,
      purpose: "See your reports, urgent alerts, and recent barangay updates in one place.",
      use: "Start here to check what needs your attention before opening a specific module.",
      stats: ["Status", "Alerts", "Updates"],
    },
    {
      title: "Reports",
      icon: FaClipboardList,
      purpose: "Submit incidents with the details responders need: category, location, notes, and photos.",
      use: "Open Reports to file a new concern or follow the status of reports you already sent.",
      stats: ["Submit", "Attach", "Track"],
    },
    {
      title: "Map",
      icon: FaMapLocationDot,
      purpose: "View nearby incidents and response-relevant places around your community.",
      use: "Use the map to understand where reports are happening and inspect details by location.",
      stats: ["Nearby", "Pins", "Context"],
    },
    {
      title: "Alerts",
      icon: FaBell,
      purpose: "Read urgent advisories from barangay officials.",
      use: "Check Alerts when there is a safety notice, emergency update, or time-sensitive instruction.",
      stats: ["Urgent", "Safety", "Action"],
    },
    {
      title: "Announcements",
      icon: FaBullhorn,
      purpose: "Follow community news, advisories, and public service updates.",
      use: "Open Announcements for non-emergency information and general barangay guidance.",
      stats: ["News", "Guides", "Events"],
    },
  ],
  official: [
    {
      title: "Dashboard",
      icon: FaChartLine,
      purpose: "Monitor response workload, active reports, and operational status at a glance.",
      use: "Start here before triaging incidents or publishing community updates.",
      stats: ["Workload", "Trends", "Priority"],
    },
    {
      title: "Incident Queue",
      icon: FaClipboardList,
      purpose: "Review resident reports and move them through verification, action, and resolution.",
      use: "Open the queue to inspect details, update status, and record official responses.",
      stats: ["Verify", "Respond", "Resolve"],
    },
    {
      title: "Map",
      icon: FaMapLocationDot,
      purpose: "Inspect incidents spatially so responders can understand clusters and field context.",
      use: "Use map pins to jump from a location view into the related incident record.",
      stats: ["Clusters", "Pins", "Dispatch"],
    },
    {
      title: "Locations",
      icon: FaLocationDot,
      purpose: "Maintain important places such as evacuation centers and local landmarks.",
      use: "Keep location records accurate so map users can rely on the displayed response points.",
      stats: ["Centers", "Landmarks", "Status"],
    },
    {
      title: "Alerts",
      icon: FaBell,
      purpose: "Publish urgent advisories through the channels available to the barangay.",
      use: "Create alerts for emergencies, safety instructions, and time-sensitive incident notices.",
      stats: ["Create", "Notify", "Confirm"],
    },
    {
      title: "SMS Logs",
      icon: FaMessage,
      purpose: "Review outbound SMS delivery records for alert audit and troubleshooting.",
      use: "Check logs when confirming whether a message was sent to residents.",
      stats: ["Sent", "Audit", "Trace"],
    },
    {
      title: "Announcements",
      icon: FaBullhorn,
      purpose: "Publish broader community notices that do not require emergency alert handling.",
      use: "Use announcements for advisories, reminders, programs, and general information.",
      stats: ["Draft", "Publish", "Inform"],
    },
  ],
};

function getSlides(role) {
  const normalizedRole = String(role || "resident").toLowerCase();
  return SLIDES[normalizedRole] || SLIDES.resident;
}

function Infographic({ slide, theme, index, total }) {
  const Icon = slide.icon;

  return (
    <div className="relative min-h-[260px] overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 sm:min-h-[320px]">
      <div
        className="absolute inset-x-0 top-0 h-24"
        style={{
          background: `linear-gradient(135deg, ${theme.soft} 0%, #FFFFFF 58%)`,
        }}
      />
      <div className="relative grid h-full min-h-[232px] grid-rows-[auto_1fr_auto] gap-4 sm:min-h-[292px]">
        <div className="flex items-center justify-between gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl shadow-sm"
            style={{ backgroundColor: theme.accent, color: "white" }}
          >
            <Icon className="text-2xl" />
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase text-neutral-500">Module</p>
            <p className="text-sm font-bold" style={{ color: theme.text }}>
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
          </div>
        </div>

        <div className="grid content-center gap-3">
          <div className="grid grid-cols-3 gap-2">
            {slide.stats.map((item, statIndex) => (
              <div
                key={item}
                className="min-h-[76px] rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
                style={{ transform: `translateY(${statIndex % 2 === 0 ? 0 : 14}px)` }}
              >
                <div className="mb-3 h-2 rounded-full" style={{ backgroundColor: theme.mid }} />
                <div className="h-7 rounded-md" style={{ backgroundColor: theme.soft }} />
                <p className="mt-2 truncate text-[11px] font-bold text-neutral-600">{item}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto flex w-full max-w-[260px] items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
            <span className="h-2 w-10 rounded-full" style={{ backgroundColor: theme.accent }} />
            <span className="h-2 w-16 rounded-full bg-neutral-300" />
            <span className="h-8 w-8 rounded-full" style={{ backgroundColor: theme.soft }} />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.soft, color: theme.accent }}>
            <FaCheck className="text-sm" />
          </div>
          <p className="min-w-0 text-xs font-semibold text-neutral-700">
            Built for quick scanning, clear next steps, and calmer incident response.
          </p>
        </div>
      </div>
    </div>
  );
}

function WelcomePanel({ theme, onClose, onStart }) {
  return (
    <div className="grid max-h-[94vh] overflow-auto md:grid-cols-[0.9fr_1.1fr]">
      <section className="flex min-h-[420px] flex-col justify-between border-b border-neutral-200 p-5 sm:p-6 md:border-b-0 md:border-r">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: theme.accent }}>
            {theme.label} access
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-neutral-950">Welcome to Respondr</h2>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            Respondr helps residents and barangay officials report incidents, coordinate response work, and share urgent community updates in one place.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: theme.soft, color: theme.accent }}>
              <FaRegHandshake className="text-xl" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-950">Built for faster response</p>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                Use the system to understand what is happening, act on the right information, and keep the community informed.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={onClose}>
            Skip
          </Button>
          <Button onClick={onStart} className="gap-2">
            Get started
            <FaAngleRight />
          </Button>
        </div>
      </section>

      <section className="bg-[var(--color-background-secondary)] p-5 sm:p-6">
        <div className="relative min-h-[360px] overflow-hidden rounded-xl border border-neutral-200 bg-white p-5">
          <div
            className="absolute inset-x-0 top-0 h-32"
            style={{ background: `linear-gradient(135deg, ${theme.soft} 0%, #FFFFFF 64%)` }}
          />
          <div className="relative grid min-h-[320px] content-center gap-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm" style={{ backgroundColor: theme.accent, color: "white" }}>
              <FaShieldHalved className="text-4xl" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Know", "Act", "Follow"].map((item, index) => (
                <div
                  key={item}
                  className="rounded-xl border border-neutral-200 bg-white p-3 text-center shadow-sm"
                  style={{ transform: `translateY(${index === 1 ? 16 : 0}px)` }}
                >
                  <div className="mx-auto mb-3 h-8 w-8 rounded-full" style={{ backgroundColor: theme.soft }} />
                  <p className="text-xs font-bold text-neutral-700">{item}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto h-3 w-full max-w-[280px] rounded-full bg-neutral-200">
              <div className="h-3 w-2/3 rounded-full" style={{ backgroundColor: theme.accent }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function QuickstartModal({ open, role = "resident", onClose, onComplete }) {
  const normalizedRole = String(role || "resident").toLowerCase();
  const slides = useMemo(() => getSlides(normalizedRole), [normalizedRole]);
  const theme = ROLE_THEME[normalizedRole] || ROLE_THEME.resident;
  const [activeIndex, setActiveIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const activeSlide = slides[activeIndex];
  const ActiveIcon = activeSlide.icon;
  const isLast = activeIndex === slides.length - 1;

  if (!open) return null;

  const close = () => {
    onClose?.();
  };

  const complete = () => {
    onComplete?.();
  };

  const goPrevious = () => {
    setActiveIndex((current) => Math.max(0, current - 1));
  };

  const goNext = () => {
    if (isLast) {
      complete();
      return;
    }
    setActiveIndex((current) => Math.min(slides.length - 1, current + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px]" onClick={close}>
      <div
        className="w-full max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        {showWelcome ? (
          <WelcomePanel theme={theme} onClose={complete} onStart={() => setShowWelcome(false)} />
        ) : (
        <div className="grid max-h-[94vh] overflow-auto md:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-neutral-200 p-4 sm:p-5 md:border-b-0 md:border-r">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: theme.accent }}>
                  {theme.label} guide
                </p>
                <h2 className="mt-1 text-2xl font-bold text-neutral-950">Respondr Quickstart</h2>
              </div>
              <Button variant="ghost" onClick={complete}>
                Skip
              </Button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cx(
                    "h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-500",
                    index === activeIndex ? "w-9" : "w-2.5 bg-neutral-300"
                  )}
                  style={index === activeIndex ? { backgroundColor: theme.accent } : undefined}
                  aria-label={`Go to ${slide.title}`}
                />
              ))}
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: theme.soft, color: theme.accent }}>
                  <ActiveIcon className="text-xl" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold text-neutral-950">{activeSlide.title}</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase text-neutral-500">Purpose</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-800">{activeSlide.purpose}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-neutral-500">How to use it</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-800">{activeSlide.use}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <Button variant="secondary" onClick={goPrevious} disabled={activeIndex === 0} className="gap-2">
                <FaAngleLeft />
                Previous
              </Button>
              <Button onClick={goNext} className="gap-2">
                {isLast ? "Done" : "Next"}
                {isLast ? <FaCheck /> : <FaAngleRight />}
              </Button>
            </div>
          </section>

          <section className="bg-[var(--color-background-secondary)] p-4 sm:p-5">
            <Infographic slide={activeSlide} theme={theme} index={activeIndex} total={slides.length} />
          </section>
        </div>
        )}
      </div>
    </div>
  );
}
