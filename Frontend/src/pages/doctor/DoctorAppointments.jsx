import { AlertTriangle, CalendarDays, Check, Clock3, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../services/api";

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");

  async function load() {
    try {
      setLoading(true);
      const response = await api.get("/appointments/doctor");
      setAppointments(response.data?.data || []);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const refreshTimer = setInterval(async () => {
      try {
        const response = await api.get("/appointments/doctor");
        setAppointments(response.data?.data || []);
      } catch {
        // Keep the current list if a background refresh fails.
      }
    }, 15000);

    return () => clearInterval(refreshTimer);
  }, []);

  async function approve(id) {
    try {
      setActionId(id);
      await api.patch(`/appointments/${id}/approve`);
      await load();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to accept appointment.");
    } finally { setActionId(""); }
  }

  async function reject(id) {
    const reason = window.prompt("Optional rejection reason:");
    if (reason === null) return;
    try {
      setActionId(id);
      await api.patch(`/appointments/${id}/reject`, { reason });
      await load();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to reject appointment.");
    } finally { setActionId(""); }
  }

  const visible = appointments.filter((a) =>
    filter === "pending" ? a.status === "pending" : a.status === "confirmed"
  );

  return (
    <div className="doctor-page">
      <section className="doctor-page-header">
        <div>
          <span className="doctor-eyebrow">APPOINTMENTS</span>
          <h1>Manage consultation requests</h1>
          <p>Accept, reject, and prioritize appointments assigned only to your verified doctor account.</p>
        </div>
      </section>

      <div className="doctor-filter-tabs">
        <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>
          Requests <span>{appointments.filter(a => a.status === "pending").length}</span>
        </button>
        <button className={filter === "confirmed" ? "active" : ""} onClick={() => setFilter("confirmed")}>
          Confirmed <span>{appointments.filter(a => a.status === "confirmed").length}</span>
        </button>
      </div>

      {loading ? (
        <div className="doctor-empty">Loading appointments...</div>
      ) : visible.length === 0 ? (
        <div className="doctor-empty">
          <CalendarDays size={25} />
          <strong>No {filter} appointments.</strong>
          <span>New patient requests will appear here automatically.</span>
        </div>
      ) : (
        <div className="doctor-full-list">
          {visible.map((appointment) => (
            <article className={`doctor-full-card ${appointment.priority === "urgent" ? "urgent" : ""}`} key={appointment._id}>
              <div className="doctor-full-card-top">
                <div>
                  <div className="doctor-request-name-row">
                    <h3>{appointment.patient?.name || "Patient"}</h3>
                    {appointment.priority === "urgent" && (
                      <span className="urgent-badge"><AlertTriangle size={12} /> Urgent</span>
                    )}
                  </div>
                  <p>{appointment.visitReason}</p>
                </div>
                <span className={`doctor-status ${appointment.status}`}>{appointment.status}</span>
              </div>

              <div className="doctor-detail-row">
                <span><CalendarDays size={15} /> {new Date(appointment.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                <span><Clock3 size={15} /> {appointment.appointmentTime}</span>
                <span><MapPin size={15} /> {appointment.visitType === "video" ? "Video consultation" : "In-person consultation"}</span>
              </div>

              {appointment.patientNote && (
                <div className="doctor-patient-note">
                  <strong>Patient note</strong>
                  <span>{appointment.patientNote}</span>
                </div>
              )}

              {appointment.status === "pending" && (
                <div className="doctor-full-actions">
                  <button className="doctor-approve-button" disabled={actionId === appointment._id} onClick={() => approve(appointment._id)}>
                    <Check size={15} /> Accept appointment
                  </button>
                  <button className="doctor-reject-button" disabled={actionId === appointment._id} onClick={() => reject(appointment._id)}>
                    <X size={15} /> Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorAppointments;
