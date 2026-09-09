import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileHeart,
  HeartPulse,
  Home,
  LogOut,
  Menu,
  Pill,
  ScanLine,
  Settings,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function PatientLayout() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const snapshotKey = "meditrack_notification_snapshot";
    const seenKey = "meditrack_notification_seen";
    const readSeen = () => { try { return JSON.parse(localStorage.getItem(seenKey) || "[]"); } catch { return []; } };
    const saveSeen = (items) => localStorage.setItem(seenKey, JSON.stringify(items.slice(-100)));
    async function checkNotifications() {
      try {
        let prefs = { appointmentNotifications: true, medicineReminders: true, browserNotifications: true };
        try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem("meditrack_settings") || "{}") }; } catch { /* defaults */ }
        const [appointments, medicines] = await Promise.all([api.get("/appointments/my"), api.get("/prescriptions/medications/today")]);
        if (cancelled) return;
        const currentAppointments = appointments.data?.data || [];
        const currentMeds = medicines.data?.data || [];
        const previous = (() => { try { return JSON.parse(localStorage.getItem(snapshotKey) || "{}"); } catch { return {}; } })();
        const seen = readSeen();
        const next = [];
        currentAppointments.filter(a => prefs.appointmentNotifications && ["confirmed", "rejected"].includes(a.status)).forEach(a => {
          const id = `appointment-${a._id}-${a.status}`;
          const doctorName = a.doctor?.name || "your doctor";
          next.push({ id, type: "appointment", title: a.status === "confirmed" ? "Appointment approved" : "Appointment update", text: a.status === "confirmed" ? `${doctorName} approved your appointment.` : `${doctorName} rejected your appointment.`, date: a.updatedAt || a.createdAt || a.appointmentDate, unread: !seen.includes(id) });
          if (!seen.includes(id) && previous.appointments && prefs.browserNotifications) notifyBrowser(a.status === "confirmed" ? "Appointment approved" : "Appointment update", next[next.length - 1].text);
        });
        const now = new Date();
        currentMeds.filter(m => prefs.medicineReminders && m.status === "scheduled").forEach(m => {
          const scheduled = new Date(m.scheduledDate); const [h, min] = String(m.scheduledTime || "00:00").split(":").map(Number); scheduled.setHours(h || 0, min || 0, 0, 0);
          const dueKey = `medicine-${m._id}`;
          const isDue = scheduled.getTime() <= now.getTime() && now.getTime() - scheduled.getTime() < 24 * 60 * 60 * 1000;
          if (isDue) next.push({ id: dueKey, type: "medicine", title: "Medicine reminder", text: `Time to take ${m.medicineName || "your medicine"} (${m.dosage || "as prescribed"}). ${foodText(m.foodInstruction)}.`, date: scheduled.toISOString(), unread: !seen.includes(dueKey) });
          if (isDue && !seen.includes(dueKey) && previous.medicines && prefs.browserNotifications) notifyBrowser("Medicine reminder", `Time to take ${m.medicineName || "your medicine"}.`);
        });
        const unique = next.filter((n, i, arr) => arr.findIndex(x => x.id === n.id) === i).sort((a,b) => new Date(b.date)-new Date(a.date));
        setNotifications(unique);
        localStorage.setItem(snapshotKey, JSON.stringify({ appointments: currentAppointments.map(a => `${a._id}:${a.status}`), medicines: currentMeds.map(m => m._id) }));
      } catch (e) { console.debug("Notification check unavailable", e); }
    }
    function notifyBrowser(title, body) {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(title, { body });
    }
    function foodText(value) { return ({ before_food: "Before food", after_food: "After food", with_food: "With food", empty_stomach: "On an empty stomach", anytime: "As directed" }[value] || "As directed"); }
    checkNotifications();
    const timer = window.setInterval(checkNotifications, 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  function openNotifications() {
    setNotificationOpen(v => !v);
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().catch(() => {});
  }
  function markNotificationsRead() {
    const seen = (() => { try { return JSON.parse(localStorage.getItem("meditrack_notification_seen") || "[]"); } catch { return []; } })();
    const merged = [...new Set([...seen, ...notifications.map(n => n.id)])];
    localStorage.setItem("meditrack_notification_seen", JSON.stringify(merged.slice(-100)));
    setNotifications(current => current.map(n => ({ ...n, unread: false })));
  }

  const mainNavigation = [
    {
      label: "Dashboard",
      path: "/patient",
      icon: Home,
      end: true,
    },
    {
      label: "Health Monitor",
      path: "/patient/health",
      icon: Activity,
    },
    {
      label: "Medical Records",
      path: "/patient/records",
      icon: FileHeart,
    },
    {
      label: "Prescriptions",
      path: "/patient/prescriptions",
      icon: ScanLine,
    },
    {
      label: "Medicines",
      path: "/patient/medicines",
      icon: Pill,
    },
    {
      label: "Appointments",
      path: "/patient/appointments",
      icon: CalendarDays,
    },
    {
      label: "MediTrack AI",
      path: "/patient/ai-insight",
      icon: Stethoscope,
    },
    {
      label: "Health Timeline",
      path: "/patient/timeline",
      icon: HeartPulse,
    },
    {
      label: "Health Assessment",
      path: "/patient/assessment",
      icon: ClipboardCheck,
    },
    {
      label: "Emergency Profile",
      path: "/patient/emergency",
      icon: AlertTriangle,
    },
  ];

  const accountNavigation = [
    {
      label: "My Profile",
      path: "/patient/profile",
      icon: UserRound,
    },
    {
      label: "Settings",
      path: "/patient/settings",
      icon: Settings,
    },
  ];

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();

    navigate("/auth/roles", {
      replace: true,
    });
  }

  const displayName =
    user?.name || "Patient";

  const avatarLetter =
    displayName
      .trim()
      .charAt(0)
      .toUpperCase() || "P";

  return (
    <div className="patient-app">

      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeMobileMenu}
        />
      )}


      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`patient-sidebar ${
          mobileOpen
            ? "mobile-open"
            : ""
        }`}
      >

        <div className="patient-sidebar-top">

          {/* BRAND */}

          <button
            type="button"
            className="patient-brand"
            onClick={() => {
              navigate("/patient");
              closeMobileMenu();
            }}
          >
            <span>
              <HeartPulse size={20} />
            </span>

            <strong>
              Medi<span>Track</span>
            </strong>
          </button>


          {/* MOBILE CLOSE */}

          <button
            type="button"
            className="patient-sidebar-close"
            aria-label="Close navigation"
            onClick={closeMobileMenu}
          >
            <X size={19} />
          </button>


          {/* NAVIGATION */}

          <nav className="patient-navigation">

            <div className="navigation-label">
              MY HEALTH
            </div>

            {mainNavigation.map(
              (item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({
                      isActive,
                    }) =>
                      `patient-nav-link ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
                    onClick={
                      closeMobileMenu
                    }
                  >
                    <Icon size={17} />

                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                );
              }
            )}

            <div className="navigation-divider" />

            <div className="navigation-label">
              ACCOUNT
            </div>

            {accountNavigation.map(
              (item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({
                      isActive,
                    }) =>
                      `patient-nav-link ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
                    onClick={
                      closeMobileMenu
                    }
                  >
                    <Icon size={17} />

                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                );
              }
            )}

          </nav>

        </div>


        {/* ===================================================
            SIDEBAR FOOTER
            =================================================== */}

        <div className="patient-sidebar-footer">

          <button
            type="button"
            className="patient-logout"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Sign out
          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN AREA
          ===================================================== */}

      <div className="patient-main">

        {/* TOP BAR */}

        <header className="patient-topbar">

          <button
            type="button"
            className="patient-mobile-menu"
            aria-label="Open navigation"
            onClick={() =>
              setMobileOpen(true)
            }
          >
            <Menu size={21} />
          </button>

          <div className="patient-topbar-space" />

          {/* NOTIFICATIONS */}

          <div className="patient-notification-wrap">
            <button type="button" className={`patient-notification ${notificationOpen ? "open" : ""}`} aria-label="Notifications" onClick={openNotifications}>
              <Bell size={19} />
              {notifications.some(n => n.unread) && <span className="notification-dot" />}
            </button>
            {notificationOpen && <div className="patient-notification-panel">
              <div className="patient-notification-head"><div><strong>Notifications</strong><span>{notifications.filter(n => n.unread).length} unread</span></div><button type="button" onClick={markNotificationsRead}>Mark all read</button></div>
              {!notifications.length ? <div className="patient-notification-empty"><Bell size={18}/><strong>No new notifications</strong><span>Appointment approvals and medicine reminders will appear here.</span></div> : <div className="patient-notification-list">{notifications.slice(0,8).map(n => <button type="button" className={`patient-notification-item ${n.unread ? "unread" : ""}`} key={n.id} onClick={markNotificationsRead}><span className={`patient-notification-icon ${n.type}`}>{n.type === "medicine" ? <Pill size={15}/> : <CalendarDays size={15}/>}</span><span><strong>{n.title}</strong><em>{n.text}</em><small>{new Date(n.date).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"numeric", minute:"2-digit" })}</small></span></button>)}</div>}
            </div>}
          </div>


          {/* PROFILE */}

          <button
            type="button"
            className="patient-header-profile"
            onClick={() =>
              navigate(
                "/patient/profile"
              )
            }
          >
            <div className="patient-avatar small">
              {avatarLetter}
            </div>

            <div>
              <strong>
                {displayName}
              </strong>

              <span>
                Patient
              </span>
            </div>
          </button>

        </header>


        {/* ===================================================
            PAGE CONTENT
            =================================================== */}

        <main className="patient-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default PatientLayout;