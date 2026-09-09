import {
  BadgeCheck,
  Building2,
  Check,
  GraduationCap,
  Hospital,
  LockKeyhole,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const emptyForm = {
  name: "",
  phone: "",
  qualification: "",
  specialty: "",
  hospital: "",
  experience: 0,
  consultationFee: 0,
  languages: "",
  bio: "",
  clinicAddress: "",
  city: "",
  pincode: "",
  education: "",
  certifications: "",
  areasOfExpertise: "",
  servicesOffered: "",
  visitTypes: ["in-person"],
};

function DoctorProfile() {
  const [doctor, setDoctor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/doctors/me/profile");
      const data = response.data?.doctor;
      setDoctor(data);
      const user = data?.user || {};
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        qualification: data?.qualification || "",
        specialty: data?.specialty || user.specialization || "",
        hospital: data?.hospital || user.hospital || "",
        experience: data?.experience ?? 0,
        consultationFee: data?.consultationFee ?? 0,
        languages: (data?.languages || []).join(", "),
        bio: data?.bio || "",
        clinicAddress: data?.clinicAddress || "",
        city: data?.city || "",
        pincode: data?.pincode || "",
        education: data?.education || "",
        certifications: data?.certifications || "",
        areasOfExpertise: (data?.areasOfExpertise || []).join(", "),
        servicesOffered: (data?.servicesOffered || []).join(", "),
        visitTypes: data?.visitTypes?.length ? data.visitTypes : ["in-person"],
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load professional profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess("");
  }

  function toggleVisitType(type) {
    setForm((current) => {
      const selected = current.visitTypes.includes(type);
      if (selected && current.visitTypes.length === 1) return current;
      return {
        ...current,
        visitTypes: selected
          ? current.visitTypes.filter((item) => item !== type)
          : [...current.visitTypes, type],
      };
    });
  }

  function cancelEdit() {
    setEditing(false);
    setSuccess("");
    setError("");
    loadProfile();
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.specialty.trim() || !form.hospital.trim()) {
      setError("Name, specialization and hospital/clinic are required.");
      return;
    }

    try {
      setSaving(true);
      const response = await api.patch("/doctors/me/profile", {
        ...form,
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee || 0),
      });
      setDoctor(response.data?.doctor);
      setSuccess(response.data?.message || "Professional profile updated successfully.");
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save professional profile.");
    } finally {
      setSaving(false);
    }
  }

  const completeness = useMemo(() => {
    const fields = [
      form.name,
      form.phone,
      form.qualification,
      form.specialty,
      form.hospital,
      Number(form.experience) > 0 ? "yes" : "",
      form.languages,
      form.bio,
      form.clinicAddress,
      form.city,
      form.education,
      form.certifications,
      form.areasOfExpertise,
      form.servicesOffered,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const user = doctor?.user || {};
  const displayName = (user.name || "Doctor").replace(/^Dr\.\s*/i, "");

  if (loading) {
    return <div className="doctor-page"><div className="doctor-empty">Loading professional profile...</div></div>;
  }

  return (
    <div className="doctor-page">
      <section className="doctor-page-header">
        <div>
          <span className="doctor-eyebrow">PROFESSIONAL IDENTITY</span>
          <h1>My professional profile</h1>
          <p>Maintain the details patients can use to understand your expertise, consultation options and clinic information.</p>
        </div>
        <div className="doctor-profile-header-actions">
          <div className="doctor-verification-pill"><BadgeCheck size={16} /> Verified identity</div>
          {!editing && (
            <button type="button" className="doctor-edit-profile-button" onClick={() => setEditing(true)}>
              <UserRound size={15} /> Edit profile
            </button>
          )}
        </div>
      </section>

      {error && <div className="doctor-alert error">{error}</div>}
      {success && <div className="doctor-alert success"><Check size={17} /><span>{success}</span></div>}

      {editing ? (
        <form className="doctor-profile-editor" onSubmit={saveProfile}>
          <div className="doctor-profile-editor-top">
            <div>
              <span className="doctor-eyebrow">EDITABLE INFORMATION</span>
              <h2>Complete your professional profile</h2>
              <p>These details are saved to your private doctor profile. Verified identity fields stay locked for security.</p>
            </div>
            <div className="doctor-profile-completion">
              <div><strong>{completeness}%</strong><span>Profile complete</span></div>
              <div className="doctor-progress"><span style={{ width: `${completeness}%` }} /></div>
            </div>
          </div>

          <section className="doctor-profile-form-section">
            <div className="doctor-form-section-heading"><UserRound size={17} /><div><h3>Personal & contact</h3><span>How patients and MediTrack can identify you.</span></div></div>
            <div className="doctor-form-grid">
              <label>Full name<input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Dr. Full Name" /></label>
              <label>Phone number<input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91..." /></label>
              <label className="locked-field">Email address<div className="doctor-readonly-field"><span>{user.email || "Not available"}</span><LockKeyhole size={13} /></div><small>Login identity cannot be changed from this page.</small></label>
              <label className="locked-field">Medical registration number<div className="doctor-readonly-field"><span>{user.medicalRegistrationNumber || "Verified privately"}</span><LockKeyhole size={13} /></div><small>Only MediTrack administration can change verified registration details.</small></label>
            </div>
          </section>

          <section className="doctor-profile-form-section">
            <div className="doctor-form-section-heading"><GraduationCap size={17} /><div><h3>Professional credentials</h3><span>Education, specialization and clinical experience.</span></div></div>
            <div className="doctor-form-grid">
              <label>Qualification<input value={form.qualification} onChange={(e) => update("qualification", e.target.value)} placeholder="MBBS, MD, MS..." /></label>
              <label>Specialization<input value={form.specialty} onChange={(e) => update("specialty", e.target.value)} placeholder="Cardiology" /></label>
              <label>Years of experience<input type="number" min="0" max="60" value={form.experience} onChange={(e) => update("experience", e.target.value)} /></label>
              <label>Consultation fee (₹)<input type="number" min="0" max="1000000" value={form.consultationFee} onChange={(e) => update("consultationFee", e.target.value)} /></label>
              <label className="full-span">Education history<input value={form.education} onChange={(e) => update("education", e.target.value)} placeholder="MBBS — College, MD — University..." /></label>
              <label className="full-span">Certifications & memberships<input value={form.certifications} onChange={(e) => update("certifications", e.target.value)} placeholder="Medical council, fellowships, certifications..." /></label>
            </div>
          </section>

          <section className="doctor-profile-form-section">
            <div className="doctor-form-section-heading"><Hospital size={17} /><div><h3>Clinic & consultation</h3><span>Where and how you provide care.</span></div></div>
            <div className="doctor-form-grid">
              <label>Hospital / clinic<input value={form.hospital} onChange={(e) => update("hospital", e.target.value)} placeholder="Hospital or clinic name" /></label>
              <label>City<input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Chennai" /></label>
              <label className="full-span">Clinic address<input value={form.clinicAddress} onChange={(e) => update("clinicAddress", e.target.value)} placeholder="Full clinic address" /></label>
              <label>PIN code<input value={form.pincode} onChange={(e) => update("pincode", e.target.value)} placeholder="6000XX" /></label>
              <label>Languages spoken<input value={form.languages} onChange={(e) => update("languages", e.target.value)} placeholder="English, Tamil, Hindi" /></label>
              <div className="doctor-form-field full-span"><span className="doctor-form-label">Consultation types</span><div className="doctor-choice-row">
                <button type="button" className={`doctor-choice ${form.visitTypes.includes("in-person") ? "selected" : ""}`} onClick={() => toggleVisitType("in-person")}><Hospital size={15} /> In-person</button>
                <button type="button" className={`doctor-choice ${form.visitTypes.includes("video") ? "selected" : ""}`} onClick={() => toggleVisitType("video")}><Video size={15} /> Video consultation</button>
              </div></div>
            </div>
          </section>

          <section className="doctor-profile-form-section">
            <div className="doctor-form-section-heading"><Stethoscope size={17} /><div><h3>Doctor introduction</h3><span>Help patients understand your practice.</span></div></div>
            <div className="doctor-form-grid">
              <label className="full-span">Professional bio<textarea rows="5" maxLength="1000" value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Briefly describe your approach, experience and areas of care..." /></label>
              <label className="full-span">Areas of expertise<input value={form.areasOfExpertise} onChange={(e) => update("areasOfExpertise", e.target.value)} placeholder="Heart failure, preventive cardiology, hypertension" /></label>
              <label className="full-span">Services offered<input value={form.servicesOffered} onChange={(e) => update("servicesOffered", e.target.value)} placeholder="General consultation, follow-up, video consultation" /></label>
            </div>
          </section>

          <div className="doctor-profile-editor-actions">
            <div><ShieldCheck size={16} /><span>Your verified identity and medical registration are protected from self-editing.</span></div>
            <div className="doctor-editor-buttons"><button type="button" className="doctor-cancel-button" onClick={cancelEdit}>Cancel</button><button type="submit" className="doctor-save-profile-button" disabled={saving}><Save size={15} /> {saving ? "Saving..." : "Save profile"}</button></div>
          </div>
        </form>
      ) : (
        <>
          <section className="doctor-profile-card">
            <div className="doctor-profile-hero">
              <div className="doctor-profile-avatar"><Stethoscope size={30} /></div>
              <div>
                <h2>Dr. {displayName}</h2>
                <p>{doctor?.specialty || user.specialization || "Medical Professional"}</p>
                <span><ShieldCheck size={14} /> Identity and account verified</span>
              </div>
            </div>

            <div className="doctor-profile-grid">
              <div><GraduationCap size={17} /><span>Qualification<strong>{doctor?.qualification || "Not provided"}</strong></span></div>
              <div><Building2 size={17} /><span>Specialization<strong>{doctor?.specialty || "Not provided"}</strong></span></div>
              <div><Hospital size={17} /><span>Hospital / Clinic<strong>{doctor?.hospital || "Not provided"}</strong></span></div>
              <div><BadgeCheck size={17} /><span>Medical registration<strong>{user.medicalRegistrationNumber || "Verified privately"}</strong></span></div>
              <div><Stethoscope size={17} /><span>Experience<strong>{doctor?.experience || 0} years</strong></span></div>
              <div><Video size={17} /><span>Consultation<strong>{doctor?.visitTypes?.map((v) => v === "video" ? "Video" : "In-person").join(" + ") || "In-person"}</strong></span></div>
            </div>

            <div className="doctor-profile-detail-grid">
              <div><strong>Clinic address</strong><span>{doctor?.clinicAddress || "Not provided"}{doctor?.city ? `, ${doctor.city}` : ""}{doctor?.pincode ? ` — ${doctor.pincode}` : ""}</span></div>
              <div><strong>Languages</strong><span>{doctor?.languages?.length ? doctor.languages.join(", ") : "Not provided"}</span></div>
              <div><strong>Education</strong><span>{doctor?.education || "Not provided"}</span></div>
              <div><strong>Certifications & memberships</strong><span>{doctor?.certifications || "Not provided"}</span></div>
              <div><strong>Areas of expertise</strong><span>{doctor?.areasOfExpertise?.length ? doctor.areasOfExpertise.join(", ") : "Not provided"}</span></div>
              <div><strong>Services offered</strong><span>{doctor?.servicesOffered?.length ? doctor.servicesOffered.join(", ") : "Not provided"}</span></div>
            </div>

            <div className="doctor-profile-bio"><strong>Professional bio</strong><p>{doctor?.bio || "Add a short professional introduction so patients can understand your practice."}</p></div>

            <div className="doctor-profile-security"><ShieldCheck size={19} /><div><strong>Verified identity protection</strong><span>Your email and medical registration number are read-only here. Only the authenticated verified doctor can edit the profile, while verification status remains under MediTrack administration.</span></div></div>
          </section>
        </>
      )}
    </div>
  );
}

export default DoctorProfile;
