import { BadgeCheck, Check, Clock3, ShieldCheck, Stethoscope, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function AdminVerification() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");

  async function load() {
    try {
      setLoading(true);
      const response = await api.get("/doctors/admin/pending");
      setDoctors(response.data?.doctors || []);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to load verification queue.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login/admin", { replace: true });
      return;
    }
    if (user.role !== "admin") {
      navigate("/auth/roles", { replace: true });
      return;
    }
    load();
  }, [user, authLoading]);

  async function review(id, decision) {
    const reason = window.prompt(
      decision === "approve"
        ? "Optional verification note:"
        : "Reason for rejection:"
    );
    if (reason === null) return;

    try {
      setActionId(id);
      await api.patch(`/doctors/admin/${id}/verify`, { decision, reason });
      await load();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to complete verification.");
    } finally { setActionId(""); }
  }

  function signOut() {
    logout();
    navigate("/auth/roles", { replace: true });
  }

  if (authLoading || !user) return <div className="doctor-loading">Checking admin access...</div>;

  return (
    <div className="doctor-app">
      <aside className="doctor-sidebar">
        <div>
          <button className="doctor-brand" onClick={() => navigate("/admin")}>
            <span><ShieldCheck size={20} /></span>
            <strong>Medi<span>Track</span></strong>
          </button>
          <div className="doctor-secure-badge"><ShieldCheck size={14} /> Administrator</div>
          <nav className="doctor-navigation">
            <div className="doctor-navigation-label">PLATFORM SECURITY</div>
            <div className="doctor-nav-link active"><BadgeCheck size={17} /><span>Doctor Verification</span></div>
          </nav>
        </div>
        <button className="doctor-logout" onClick={signOut}>Sign out</button>
      </aside>

      <main className="doctor-main">
        <header className="doctor-topbar">
          <div className="doctor-topbar-title"><ShieldCheck size={18} /> Secure Administration</div>
          <div className="doctor-verification-pill"><ShieldCheck size={15} /> Admin access</div>
        </header>

        <div className="doctor-content">
          <section className="doctor-page-header">
            <div>
              <span className="doctor-eyebrow">VERIFICATION QUEUE</span>
              <h1>Doctor identity review</h1>
              <p>Check submitted professional details before activating clinical access.</p>
            </div>
          </section>

          <div className="doctor-access-note" style={{ marginBottom: 18 }}>
            <ShieldCheck size={17} />
            <div><strong>Verification rule</strong><span>Confirm the medical registration number and professional details through your approved verification process before approving. Approval activates doctor login.</span></div>
          </div>

          {loading ? <div className="doctor-empty">Loading applications...</div> :
            doctors.length === 0 ? (
              <div className="doctor-empty"><Check size={25} /><strong>No pending applications.</strong><span>The verification queue is clear.</span></div>
            ) : (
              <div className="doctor-full-list">
                {doctors.map(doctor => (
                  <article className="doctor-full-card" key={doctor._id}>
                    <div className="doctor-full-card-top">
                      <div>
                        <div className="doctor-request-name-row"><h3>{doctor.name}</h3><span className="urgent-badge"><Clock3 size={12} /> Pending</span></div>
                        <p>{doctor.specialization || "Medical professional"}</p>
                      </div>
                    </div>
                    <div className="doctor-detail-row">
                      <span><Stethoscope size={15} /> Reg: {doctor.medicalRegistrationNumber}</span>
                      <span>{doctor.hospital || "Hospital not provided"}</span>
                      <span>{doctor.email}</span>
                    </div>
                    <div className="doctor-full-actions">
                      <button className="doctor-approve-button" disabled={actionId === doctor._id} onClick={() => review(doctor._id, "approve")}><Check size={15} /> Verify & activate</button>
                      <button className="doctor-reject-button" disabled={actionId === doctor._id} onClick={() => review(doctor._id, "reject")}><X size={15} /> Reject</button>
                    </div>
                  </article>
                ))}
              </div>
            )
          }
        </div>
      </main>
    </div>
  );
}

export default AdminVerification;
