import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function DoctorDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [urgentPopup, setUrgentPopup] = useState(null);
  const lastUrgentIdsRef = useRef([]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [appointmentsResponse, profileResponse] = await Promise.all([
        api.get("/appointments/doctor"),
        api.get("/doctors/me/profile"),
      ]);
      setAppointments(appointmentsResponse.data?.data || []);
      setProfile(profileResponse.data?.doctor || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load the doctor workspace."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // Poll frequently so an urgent request is surfaced quickly while the
    // doctor is on the dashboard. The backend remains the source of truth.
    const refreshTimer = setInterval(async () => {
      try {
        const [appointmentsResponse, profileResponse] = await Promise.all([
          api.get("/appointments/doctor"),
          api.get("/doctors/me/profile"),
        ]);
        const nextAppointments = appointmentsResponse.data?.data || [];
        setAppointments(nextAppointments);
        setProfile(profileResponse.data?.doctor || null);

        const nextUrgent = nextAppointments.filter(
          (a) => a.status === "pending" && a.priority === "urgent"
        );
        const previousIds = lastUrgentIdsRef.current;
        const freshUrgent = nextUrgent.find((a) => !previousIds.includes(a._id));

        if (freshUrgent) {
          setUrgentPopup(freshUrgent);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("🚨 Urgent MediTrack appointment", {
              body: `${freshUrgent.patient?.name || "A patient"} needs urgent attention.`,
            });
          }
        }
        lastUrgentIdsRef.current = nextUrgent.map((a) => a._id);
      } catch {
        // Keep the current dashboard visible if a background refresh fails.
      }
    }, 5000);

    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  async function approve(id) {
    try {
      setActionId(id);
      await api.patch(`/appointments/${id}/approve`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to approve appointment.");
    } finally {
      setActionId("");
    }
  }

  async function reject(id) {
    const reason = window.prompt(
      "Optional rejection reason for the patient:"
    );
    if (reason === null) return;

    try {
      setActionId(id);
      await api.patch(`/appointments/${id}/reject`, { reason });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to reject appointment.");
    } finally {
      setActionId("");
    }
  }

  const cleanProfileName = (profile?.user?.name || "Doctor").replace(/^Dr\.\s*/i, "");

  const pending = appointments.filter((a) => a.status === "pending");
  const urgent = pending.filter((a) => a.priority === "urgent");
  const confirmed = appointments.filter((a) => a.status === "confirmed");

  const nextAppointments = useMemo(
    () =>
      confirmed.slice(0, 5),
    [confirmed]
  );

  function formatDate(value) {
    return value
      ? new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
  }

  if (loading) {
    return <div className="doctor-page"><div className="doctor-empty">Loading secure workspace...</div></div>;
  }

  return (
    <div className="doctor-page">
      {urgentPopup && (
        <div className="doctor-urgent-overlay" role="alertdialog" aria-modal="true" aria-label="Urgent appointment request">
          <div className="doctor-urgent-popup">
            <div className="doctor-urgent-popup-icon"><AlertTriangle size={28} /></div>
            <span className="doctor-eyebrow">IMMEDIATE ATTENTION</span>
            <h2>🚨 Urgent appointment request</h2>
            <p><strong>{urgentPopup.patient?.name || "A patient"}</strong> has sent an urgent request.</p>
            <div className="doctor-urgent-popup-details">
              <span><CalendarDays size={14} /> {formatDate(urgentPopup.appointmentDate)}</span>
              <span><Clock3 size={14} /> {urgentPopup.appointmentTime}</span>
              <span>{urgentPopup.visitType === "video" ? "Video consultation" : "In-person consultation"}</span>
            </div>
            <div className="doctor-urgent-popup-reason">
              <strong>Reason</strong>
              <span>{urgentPopup.visitReason}</span>
            </div>
            <div className="doctor-urgent-popup-actions">
              <button className="doctor-reject-button" onClick={() => setUrgentPopup(null)}>Review later</button>
              <button className="doctor-approve-button" onClick={() => { setUrgentPopup(null); navigate("/doctor/appointments"); }}>Open urgent request</button>
            </div>
          </div>
        </div>
      )}
      <section className="doctor-page-header">
        <div>
          <span className="doctor-eyebrow">VERIFIED CLINICIAN</span>
          <h1>Good to see you, Dr. {cleanProfileName}.</h1>
          <p>
            Review requests, prioritize urgent care, and control your consultation availability.
          </p>
        </div>
        <div className="doctor-verification-pill">
          <ShieldCheck size={16} />
          Identity verified
        </div>
      </section>

      {error && <div className="doctor-alert error">{error}</div>}

      <section className="doctor-stat-grid">
        <div className="doctor-stat-card">
          <div className="doctor-stat-icon"><CalendarDays size={19} /></div>
          <div><span>Pending requests</span><strong>{pending.length}</strong></div>
        </div>
        <div className="doctor-stat-card urgent-stat">
          <div className="doctor-stat-icon"><AlertTriangle size={19} /></div>
          <div><span>Urgent requests</span><strong>{urgent.length}</strong></div>
        </div>
        <div className="doctor-stat-card">
          <div className="doctor-stat-icon"><CheckCircle2 size={19} /></div>
          <div><span>Confirmed visits</span><strong>{confirmed.length}</strong></div>
        </div>
        <div className="doctor-stat-card">
          <div className="doctor-stat-icon"><Clock3 size={19} /></div>
          <div><span>Consultation length</span><strong>{profile?.consultationDuration || 30} min</strong></div>
        </div>
      </section>

      <div className="doctor-dashboard-grid">
        <section className="doctor-panel">
          <div className="doctor-panel-header">
            <div>
              <span className="doctor-eyebrow">ACTION REQUIRED</span>
              <h2>Appointment requests</h2>
            </div>
            <button className="doctor-link-button" onClick={() => navigate("/doctor/appointments")}>
              View all
            </button>
          </div>

          {pending.length === 0 ? (
            <div className="doctor-empty compact">
              <CheckCircle2 size={22} />
              <strong>You're all caught up.</strong>
              <span>No appointment requests need approval.</span>
            </div>
          ) : (
            <div className="doctor-request-list">
              {pending.slice(0, 5).map((appointment) => (
                <article className={`doctor-request ${appointment.priority === "urgent" ? "urgent" : ""}`} key={appointment._id}>
                  <div className="doctor-request-main">
                    <div className="doctor-patient-avatar">
                      {(appointment.patient?.name || "P").charAt(0).toUpperCase()}
                    </div>
                    <div className="doctor-request-info">
                      <div className="doctor-request-name-row">
                        <strong>{appointment.patient?.name || "Patient"}</strong>
                        {appointment.priority === "urgent" && (
                          <span className="urgent-badge"><AlertTriangle size={12} /> Urgent</span>
                        )}
                      </div>
                      <p>{appointment.visitReason}</p>
                      <div className="doctor-request-meta">
                        <span><CalendarDays size={13} /> {formatDate(appointment.appointmentDate)}</span>
                        <span><Clock3 size={13} /> {appointment.appointmentTime}</span>
                        <span>{appointment.visitType === "video" ? "Video" : "In-person"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="doctor-request-actions">
                    <button
                      className="doctor-approve-button"
                      disabled={actionId === appointment._id}
                      onClick={() => approve(appointment._id)}
                    >
                      <Check size={15} /> {actionId === appointment._id ? "Saving..." : "Accept"}
                    </button>
                    <button
                      className="doctor-reject-button"
                      disabled={actionId === appointment._id}
                      onClick={() => reject(appointment._id)}
                    >
                      <X size={15} /> Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="doctor-panel doctor-day-panel">
          <div className="doctor-panel-header">
            <div>
              <span className="doctor-eyebrow">YOUR DAY</span>
              <h2>Confirmed visits</h2>
            </div>
            <button className="doctor-icon-button" onClick={() => navigate("/doctor/schedule")} aria-label="Manage schedule">
              <Clock3 size={17} />
            </button>
          </div>

          {nextAppointments.length === 0 ? (
            <div className="doctor-empty compact">
              <Stethoscope size={22} />
              <strong>No confirmed visits yet.</strong>
              <span>Accepted appointments will appear here.</span>
            </div>
          ) : (
            <div className="doctor-confirmed-list">
              {nextAppointments.map((appointment) => (
                <div className="doctor-confirmed-item" key={appointment._id}>
                  <div className="doctor-time">{appointment.appointmentTime}</div>
                  <div>
                    <strong>{appointment.patient?.name || "Patient"}</strong>
                    <span>{formatDate(appointment.appointmentDate)} · {appointment.visitType === "video" ? "Video" : "In-person"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="doctor-access-note">
            <ShieldCheck size={16} />
            <div>
              <strong>Privacy by design</strong>
              <span>Only appointment-linked patient details are shown here. Full medical records remain behind patient consent.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DoctorDashboard;
