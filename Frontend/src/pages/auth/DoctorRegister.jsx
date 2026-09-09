import { ArrowLeft, BadgeCheck, Building2, HeartPulse, LockKeyhole, ShieldCheck, Stethoscope } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function DoctorRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    medicalRegistrationNumber: "", specialization: "", hospital: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.name.trim() || !form.email.trim() || !form.password ||
      !form.medicalRegistrationNumber.trim() || !form.specialization.trim()
    ) {
      setError("Please complete the required professional details.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/register/doctor", form);
      setSuccess(
        response.data?.message ||
        "Application submitted. Admin verification is required before doctor login."
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit doctor application.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="doctor-register-page">
      <header className="login-brand">
        <button className="back-button" onClick={() => navigate("/login/doctor")}>
          <ArrowLeft size={17} /> Back
        </button>
        <button className="auth-logo" onClick={() => navigate("/")}>
          <span><HeartPulse size={21} /></span>
          <strong>MediTrack</strong>
        </button>
        <div className="security-label"><LockKeyhole size={14} /> Professional verification</div>
      </header>

      <main className="doctor-register-main">
        <section className="doctor-register-intro">
          <div className="doctor-register-icon"><Stethoscope size={25} /></div>
          <span className="doctor-eyebrow">HEALTHCARE PROFESSIONAL</span>
          <h1>Apply for verified doctor access.</h1>
          <p>
            MediTrack does not activate doctor accounts immediately. Your professional details are reviewed first.
          </p>
          <div className="doctor-register-checks">
            <div><BadgeCheck size={16} /> Medical registration number required</div>
            <div><ShieldCheck size={16} /> Admin verification before login</div>
            <div><LockKeyhole size={16} /> Patient data stays protected by role</div>
          </div>
        </section>

        <section className="doctor-register-card">
          <div className="doctor-register-card-header">
            <h2>Professional details</h2>
            <span>All required fields are marked by the form.</span>
          </div>

          <form onSubmit={submit} className="doctor-register-form">
            <label>Full name<input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Dr. Full Name" required /></label>
            <div className="doctor-register-two">
              <label>Email<input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="doctor@example.com" required /></label>
              <label>Phone<input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91..." /></label>
            </div>
            <div className="doctor-register-two">
              <label>Medical registration number<input value={form.medicalRegistrationNumber} onChange={e => update("medicalRegistrationNumber", e.target.value)} placeholder="Registration / license number" required /></label>
              <label>Specialization<input value={form.specialization} onChange={e => update("specialization", e.target.value)} placeholder="Cardiology, Dermatology..." required /></label>
            </div>
            <label><Building2 size={15} /> Hospital / clinic<input value={form.hospital} onChange={e => update("hospital", e.target.value)} placeholder="Hospital or clinic name" /></label>
            <label>Password<input type="password" value={form.password} onChange={e => update("password", e.target.value)} placeholder="8+ chars, upper/lowercase and number" required /></label>

            {error && <div className="doctor-alert error">{error}</div>}
            {success && (
              <div className="doctor-alert success">
                <BadgeCheck size={18} />
                <div><strong>Application received</strong><span>{success}</span></div>
              </div>
            )}

            <button className="doctor-submit-button" disabled={loading || !!success}>
              {loading ? "Submitting..." : success ? "Submitted for verification" : "Submit for verification"}
            </button>
          </form>

          <p className="doctor-register-footnote">
            By applying, you confirm that the professional information provided is accurate. MediTrack admin must verify the account before any clinical access is granted.
          </p>
        </section>
      </main>
    </div>
  );
}

export default DoctorRegister;
