import { CalendarOff, Check, Clock3, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../services/api";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function DoctorSchedule() {
  const [doctor, setDoctor] = useState(null);
  const [days, setDays] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [leaveDates, setLeaveDates] = useState([]);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const response = await api.get("/doctors/me/profile");
      const data = response.data?.doctor;
      setDoctor(data);
      setDays(data?.availableDays || []);
      setAvailability(data?.availability || []);
      setLeaveDates(data?.leaveDates || []);
      setIsAvailable(data?.isAvailable !== false);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to load schedule.");
    }
  }

  useEffect(() => { load(); }, []);

  function toggleDay(day) {
    setDays((current) =>
      current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    );
  }

  function setDaySlots(day, value) {
    const next = availability.filter(item => item.day !== day);
    next.push({ day, slots: value.split(",").map(s => s.trim()).filter(Boolean) });
    setAvailability(next);
  }

  function slotsFor(day) {
    return availability.find(item => item.day === day)?.slots?.join(", ") || "";
  }

  async function saveSchedule() {
    try {
      setSaving(true);
      await api.patch("/doctors/me/availability", {
        availableDays: days,
        availability,
        isAvailable,
      });
      alert("Schedule updated successfully.");
      await load();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update schedule.");
    } finally { setSaving(false); }
  }

  async function addLeave() {
    if (!leaveDate) return;
    try {
      await api.post("/doctors/me/leave", { date: leaveDate, reason: leaveReason });
      setLeaveDate("");
      setLeaveReason("");
      await load();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to add leave.");
    }
  }

  async function removeLeave(id) {
    try {
      await api.delete(`/doctors/me/leave/${id}`);
      await load();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to remove leave.");
    }
  }

  return (
    <div className="doctor-page">
      <section className="doctor-page-header">
        <div>
          <span className="doctor-eyebrow">AVAILABILITY</span>
          <h1>My consultation schedule</h1>
          <p>Tell patients when you are available. Leave dates automatically block new bookings.</p>
        </div>
        <button className={`doctor-availability-toggle ${isAvailable ? "on" : ""}`} onClick={() => setIsAvailable(v => !v)}>
          <span /> {isAvailable ? "Accepting appointments" : "Appointments paused"}
        </button>
      </section>

      <div className="doctor-schedule-grid">
        <section className="doctor-panel">
          <div className="doctor-panel-header">
            <div><span className="doctor-eyebrow">WEEKLY HOURS</span><h2>Working days & slots</h2></div>
            <button className="doctor-save-button" onClick={saveSchedule} disabled={saving}>
              <Save size={15} /> {saving ? "Saving..." : "Save schedule"}
            </button>
          </div>

          <div className="doctor-day-editor">
            {DAYS.map(day => (
              <div className={`doctor-day-row ${days.includes(day) ? "selected" : ""}`} key={day}>
                <button type="button" className="doctor-day-check" onClick={() => toggleDay(day)}>
                  {days.includes(day) && <Check size={14} />}
                </button>
                <strong>{day}</strong>
                <input
                  value={slotsFor(day)}
                  onChange={(e) => setDaySlots(day, e.target.value)}
                  placeholder="09:00, 09:30, 10:00..."
                  disabled={!days.includes(day)}
                  aria-label={`${day} appointment slots`}
                />
              </div>
            ))}
          </div>
          <p className="doctor-helper">Use comma-separated slots. Example: 09:00, 09:30, 10:00, 10:30.</p>
        </section>

        <section className="doctor-panel">
          <div className="doctor-panel-header">
            <div><span className="doctor-eyebrow">TIME OFF</span><h2>Leave & unavailable dates</h2></div>
          </div>

          <div className="doctor-leave-form">
            <label>
              Leave date
              <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
            </label>
            <label>
              Reason <span>optional</span>
              <input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Conference, personal leave..." />
            </label>
            <button className="doctor-add-leave" onClick={addLeave} disabled={!leaveDate}>
              <Plus size={15} /> Add leave
            </button>
          </div>

          <div className="doctor-leave-list">
            {leaveDates.length === 0 ? (
              <div className="doctor-empty compact"><CalendarOff size={20} /><span>No leave dates added.</span></div>
            ) : leaveDates.map(leave => (
              <div className="doctor-leave-item" key={leave._id}>
                <div><strong>{new Date(leave.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong><span>{leave.reason || "Unavailable"}</span></div>
                <button onClick={() => removeLeave(leave._id)} aria-label="Remove leave"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>

          <div className="doctor-schedule-tip">
            <Clock3 size={16} />
            <span>Patients cannot book you on a leave date or when appointments are paused.</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DoctorSchedule;
