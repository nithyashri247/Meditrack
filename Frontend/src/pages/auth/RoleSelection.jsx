import {
  ArrowRight,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: "patient",
      title: "Patient",
      heading: "Manage your health journey",
      description:
        "Track your health, medicines, reports, appointments and personal medical history.",
      icon: UserRound,
      route: "/login/patient",
    },
    {
      id: "doctor",
      title: "Doctor",
      heading: "Deliver better care",
      description:
        "Manage appointments and access patient information through authorized workflows.",
      icon: Stethoscope,
      route: "/login/doctor",
    },
    {
      id: "admin",
      title: "Administrator",
      heading: "Protect the platform",
      description:
        "Manage doctor verification, access control, security and platform operations.",
      icon: ShieldCheck,
      route: "/login/admin",
    },
  ];

  return (
    <div className="auth-selection">

      <header className="auth-selection-header">

        <button
          className="auth-logo"
          onClick={() => navigate("/")}
        >
          <span>
            <HeartPulse size={21} />
          </span>

          <strong>MediTrack</strong>
        </button>

        <div className="security-label">
          <LockKeyhole size={15} />
          Secure authentication
        </div>

      </header>

      <main className="auth-selection-content">

        <section className="auth-selection-heading">

          <div className="eyebrow">
            ACCOUNT ACCESS
          </div>

          <h1>
            How are you
            <span> using MediTrack?</span>
          </h1>

          <p>
            Choose your account type to continue
            to the appropriate MediTrack portal.
            Your role determines which information
            and features you can access.
          </p>

        </section>

        <section className="role-grid">

          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <button
                key={role.id}
                className="role-card"
                onClick={() => navigate(role.route)}
              >

                <div className="role-icon">
                  <Icon size={25} />
                </div>

                <span className="role-type">
                  {role.title}
                </span>

                <h2>
                  {role.heading}
                </h2>

                <p>
                  {role.description}
                </p>

                <div className="role-arrow">
                  <ArrowRight size={18} />
                </div>

              </button>
            );
          })}

        </section>

        <div className="auth-selection-footer">

          <span>
            New patient?
          </span>

          <button
            onClick={() =>
              navigate("/register/patient")
            }
          >
            Create a patient account
            <ArrowRight size={15} />
          </button>

        </div>

      </main>

    </div>
  );
}

export default RoleSelection;