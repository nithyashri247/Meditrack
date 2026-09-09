import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  LogOut,
  Menu,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function DoctorLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "doctor")) {
      navigate("/login/doctor", { replace: true });
    }
    if (
      !loading &&
      user?.role === "doctor" &&
      (user.accountStatus !== "active" ||
        user.doctorVerification !== "verified")
    ) {
      navigate("/login/doctor", { replace: true });
    }
  }, [user, loading, navigate]);

  const displayName = user?.name || "Doctor";
  const cleanDisplayName = displayName.replace(/^Dr\.\s*/i, "");
  const avatarLetter = useMemo(
    () => displayName.trim().charAt(0).toUpperCase() || "D",
    [displayName]
  );

  function handleLogout() {
    logout();
    navigate("/auth/roles", { replace: true });
  }

  if (loading || !user || user.role !== "doctor") {
    return (
      <div className="doctor-loading">
        <HeartPulse size={22} />
        <span>Checking secure doctor access...</span>
      </div>
    );
  }

  const navigation = [
    { label: "Dashboard", path: "/doctor", icon: Activity, end: true },
    { label: "Appointments", path: "/doctor/appointments", icon: CalendarDays },
    { label: "My Schedule", path: "/doctor/schedule", icon: Clock3 },
    { label: "Professional Profile", path: "/doctor/profile", icon: UserRound },
  ];

  return (
    <div className="doctor-app">
      {mobileOpen && (
        <button
          type="button"
          className="doctor-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`doctor-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div>
          <div className="doctor-sidebar-brand-row">
            <button
              type="button"
              className="doctor-brand"
              onClick={() => navigate("/doctor")}
            >
              <span><HeartPulse size={20} /></span>
              <strong>Medi<span>Track</span></strong>
            </button>
            <button
              type="button"
              className="doctor-sidebar-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          <div className="doctor-secure-badge">
            <ShieldCheck size={14} />
            Verified Doctor
          </div>

          <nav className="doctor-navigation">
            <div className="doctor-navigation-label">CLINICAL WORKSPACE</div>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `doctor-nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="doctor-sidebar-footer">
          <div className="doctor-mini-profile">
            <div className="doctor-avatar">{avatarLetter}</div>
            <div>
              <strong>{displayName}</strong>
              <span>Verified clinician</span>
            </div>
          </div>
          <button type="button" className="doctor-logout" onClick={handleLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="doctor-main">
        <header className="doctor-topbar">
          <button
            type="button"
            className="doctor-mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <div className="doctor-topbar-title">
            <Stethoscope size={18} />
            <span>Clinical Workspace</span>
          </div>
          <div className="doctor-topbar-profile">
            <div className="doctor-avatar small">{avatarLetter}</div>
            <div>
              <strong>Dr. {cleanDisplayName}</strong>
              <span>Verified account</span>
            </div>
          </div>
        </header>

        <main className="doctor-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DoctorLayout;
