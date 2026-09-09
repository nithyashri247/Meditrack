import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, CalendarDays, CheckCircle2, Clock3, ExternalLink, LoaderCircle, Pill, Search, SkipForward, Utensils, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const FOOD = {
  before_food: "Before food",
  after_food: "After food",
  with_food: "With food",
  empty_stomach: "Empty stomach",
  anytime: "Anytime",
};

const FREQUENCY = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  three_times_daily: "Three times daily",
  four_times_daily: "Four times daily",
  once_weekly: "Once weekly",
  every_4_hours: "Every 4 hours",
  every_6_hours: "Every 6 hours",
  every_8_hours: "Every 8 hours",
  every_12_hours: "Every 12 hours",
  as_needed: "As needed",
  custom: "Custom schedule",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(value) {
  if (!value) return "—";
  const [h, m] = String(value).split(":").map(Number);
  const date = new Date();
  date.setHours(h || 0, m || 0, 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function statusForMedicine(medicine) {
  if (medicine.status === "stopped") return "stopped";
  if (medicine.status === "completed") return "completed";
  const end = medicine.endDate ? new Date(medicine.endDate) : null;
  if (end && end < new Date()) return "completed";
  return "active";
}

function MedicineCard({ medicine, onStop }) {
  const schedules = (medicine.schedules || []).filter((item) => item.enabled !== false);
  const status = statusForMedicine(medicine);
  return (
    <article className="medicine-item-card">
      <div className="medicine-item-top">
        <div className="medicine-icon"><Pill size={20} /></div>
        <div className="medicine-item-title">
          <div className="medicine-name-row">
            <h3>{medicine.name}</h3>
            <span className={`medicine-status-badge ${status}`}>{status === "active" ? "Active" : status === "completed" ? "Completed" : "Stopped"}</span>
          </div>
          <p>{medicine.dosage}{medicine.dosageUnit ? ` ${medicine.dosageUnit}` : ""} · {FREQUENCY[medicine.frequency] || "Custom schedule"}</p>
        </div>
      </div>

      <div className="medicine-detail-grid">
        <div><span>Schedule</span><strong>{schedules.length ? schedules.map((s) => formatTime(s.time)).join(" · ") : "As needed"}</strong></div>
        <div><span>Food</span><strong>{FOOD[medicine.foodInstruction] || "Anytime"}</strong></div>
        <div><span>Started</span><strong>{formatDate(medicine.startDate)}</strong></div>
        <div><span>Ends</span><strong>{medicine.endDate ? formatDate(medicine.endDate) : "No end date"}</strong></div>
      </div>

      {medicine.instructions && <div className="medicine-instructions"><strong>Instructions</strong><span>{medicine.instructions}</span></div>}

      {status === "active" && (
        <div className="medicine-card-actions">
          <button type="button" className="secondary-button" onClick={() => onStop(medicine)}>
            Stop medicine
          </button>
        </div>
      )}
    </article>
  );
}

function Medicines() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [today, setToday] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingLog, setWorkingLog] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [prescriptionsRes, todayRes, adherenceRes] = await Promise.all([
        api.get("/prescriptions"),
        api.get("/prescriptions/medications/today"),
        api.get("/prescriptions/medications/adherence"),
      ]);
      setPrescriptions(prescriptionsRes.data?.prescriptions || prescriptionsRes.data?.data || []);
      setToday(todayRes.data?.medications || todayRes.data?.data || []);
      setAdherence(adherenceRes.data?.adherence || adherenceRes.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your medicines right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const medicines = useMemo(() => {
    const result = [];
    prescriptions.forEach((prescription) => {
      (prescription.medicines || []).forEach((medicine) => {
        if (medicine.status === "stopped") return;
        result.push({ ...medicine, prescriptionId: prescription._id, doctorName: prescription.doctorName, hospitalName: prescription.hospitalName });
      });
    });
    return result;
  }, [prescriptions]);

  const filteredMedicines = useMemo(() => medicines.filter((medicine) => {
    const text = `${medicine.name} ${medicine.dosage} ${medicine.doctorName || ""}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const status = statusForMedicine(medicine);
    const matchesFilter = filter === "all" || status === filter;
    return matchesQuery && matchesFilter;
  }), [medicines, query, filter]);

  const activeCount = medicines.filter((m) => statusForMedicine(m) === "active").length;
  const dueToday = today.filter((m) => !["taken", "skipped"].includes(m.status)).length;
  const takenToday = today.filter((m) => m.status === "taken").length;

  async function updateLog(logId, status) {
    setWorkingLog(logId);
    setError("");
    try {
      await api.patch(`/prescriptions/medications/${logId}/status`, { status });
      setMessage(status === "taken" ? "Dose marked as taken." : "Dose skipped.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update this dose.");
    } finally {
      setWorkingLog("");
    }
  }

  async function stopMedicine(medicine) {
    if (!window.confirm(`Stop ${medicine.name}? This will stop it from appearing as an active medicine.`)) return;
    setError("");
    try {
      await api.patch(`/prescriptions/${medicine.prescriptionId}/medicines/${medicine._id}/stop`, { reason: "Stopped by patient" });
      setMessage(`${medicine.name} was stopped.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to stop this medicine.");
    }
  }

  return (
    <div className="medicines-page">
      <div className="medicines-header">
        <div>
          <div className="patient-page-eyebrow">MEDICATION CENTER</div>
          <h1>My Medicines</h1>
          <p>View your prescribed medicines, today's doses and medication progress in one place.</p>
        </div>
        <button type="button" className="secondary-button medicines-prescription-link" onClick={() => navigate("/patient/prescriptions")}>
          <ExternalLink size={16} /> View prescriptions
        </button>
      </div>

      {error && <div className="profile-message error" role="alert"><AlertCircle size={17} /><span>{error}</span><button type="button" onClick={() => setError("")}><X size={15} /></button></div>}
      {message && <div className="profile-message success" role="status"><CheckCircle2 size={17} /><span>{message}</span><button type="button" onClick={() => setMessage("")}><X size={15} /></button></div>}

      <div className="medicine-summary-grid">
        <div className="medicine-summary-card"><div className="medicine-summary-icon"><Pill size={19} /></div><div><span>Active medicines</span><strong>{activeCount}</strong></div></div>
        <div className="medicine-summary-card"><div className="medicine-summary-icon"><Clock3 size={19} /></div><div><span>Doses due today</span><strong>{dueToday}</strong></div></div>
        <div className="medicine-summary-card"><div className="medicine-summary-icon"><CheckCircle2 size={19} /></div><div><span>Taken today</span><strong>{takenToday}</strong></div></div>
        <div className="medicine-summary-card"><div className="medicine-summary-icon"><Activity size={19} /></div><div><span>30-day adherence</span><strong>{adherence?.adherence ?? 0}%</strong></div></div>
      </div>

      <section className="today-medicine-section">
        <div className="medicines-section-heading">
          <div><span className="section-eyebrow">TODAY</span><h2>Today's medication schedule</h2><p>Mark each dose after you take it.</p></div>
          <div className="medicine-date-badge"><CalendarDays size={14} /> {formatDate(new Date())}</div>
        </div>

        {loading ? <div className="medicine-empty"><LoaderCircle className="spin" size={22} /> Loading your medication schedule...</div> : today.length === 0 ? (
          <div className="medicine-empty"><div className="medicine-empty-icon"><Clock3 size={20} /></div><strong>No doses scheduled today</strong><span>Your active prescription schedule will appear here.</span></div>
        ) : (
          <div className="today-dose-list">
            {today.map((dose) => (
              <div className={`today-dose-card ${dose.status === "taken" ? "taken" : ""}`} key={dose._id}>
                <div className="dose-time">{formatTime(dose.scheduledTime)}<span>{dose.scheduleLabel || "Scheduled"}</span></div>
                <div className="dose-main"><div className="dose-title"><Pill size={17} /><strong>{dose.medicineName}</strong></div><p>{dose.dosage || "Dose"} · {FOOD[dose.foodInstruction] || "Anytime"}</p></div>
                <div className="dose-status">{dose.status === "taken" ? <span className="dose-taken"><CheckCircle2 size={15} /> Taken</span> : dose.status === "skipped" ? <span className="dose-skipped"><SkipForward size={15} /> Skipped</span> : <div className="dose-actions"><button disabled={workingLog === dose._id} type="button" className="primary-button" onClick={() => updateLog(dose._id, "taken")}>{workingLog === dose._id ? "Saving..." : "Mark as taken"}</button><button disabled={workingLog === dose._id} type="button" className="icon-text-button" onClick={() => updateLog(dose._id, "skipped")}><SkipForward size={15} /> Skip</button></div>}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="medicine-library-section">
        <div className="medicines-section-heading library-heading"><div><span className="section-eyebrow">MY MEDICINES</span><h2>Active and completed medicines</h2><p>These medicines come from your saved prescriptions.</p></div></div>
        <div className="medicine-toolbar"><div className="medicine-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicines..." /></div><div className="medicine-filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button><button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>Active</button><button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Completed</button></div></div>

        {loading ? <div className="medicine-empty"><LoaderCircle className="spin" size={22} /> Loading medicines...</div> : filteredMedicines.length === 0 ? (
          <div className="medicine-empty"><div className="medicine-empty-icon"><Pill size={20} /></div><strong>{medicines.length ? "No medicines match your search" : "No medicines yet"}</strong><span>{medicines.length ? "Try another search or filter." : "Prescribed medicines will appear here once they are added to your prescriptions."}</span><button type="button" className="primary-button" onClick={() => navigate("/patient/prescriptions")}>{medicines.length ? "View prescriptions" : "Open prescriptions"}</button></div>
        ) : <div className="medicine-list">{filteredMedicines.map((medicine) => <MedicineCard key={`${medicine.prescriptionId}-${medicine._id}`} medicine={medicine} onStop={stopMedicine} />)}</div>}
      </section>

      <div className="medicine-safety-note"><Utensils size={17} /><span>Follow the dose and instructions provided by your healthcare professional. MediTrack does not independently change or recommend prescription doses.</span></div>
    </div>
  );
}

export default Medicines;
