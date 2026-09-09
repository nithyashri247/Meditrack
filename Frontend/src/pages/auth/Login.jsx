import {
  ArrowLeft,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function Login() {
  const { role } = useParams();
  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const roleInformation = {
    patient: {
      name: "Patient",
      icon: UserRound,
      title: "Your health journey starts here.",
      description:
        "Securely access your health profile, medical records, medicines and appointments.",
    },

    doctor: {
      name: "Doctor",
      icon: ShieldCheck,
      title: "Deliver better care.",
      description:
        "Access appointments and authorized patient information through MediTrack's secure care workflow.",
    },

    admin: {
      name: "Administrator",
      icon: LockKeyhole,
      title: "Protect the MediTrack ecosystem.",
      description:
        "Manage verification, access control and platform security.",
    },
  };

  const selected =
    roleInformation[role] ||
    roleInformation.patient;

  const Icon = selected.icon;

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await login(
        email.trim(),
        password,
        role
      );

      const authenticatedUser =
        result.user;

      if (
        authenticatedUser.role ===
        "patient"
      ) {
        navigate("/patient");
        return;
      }

      if (
        authenticatedUser.role ===
        "doctor"
      ) {
        navigate("/doctor");
        return;
      }

      if (
        authenticatedUser.role ===
        "admin"
      ) {
        navigate("/admin");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to sign in. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      {/* HEADER */}

      <header className="login-brand">

        <button
          className="back-button"
          onClick={() =>
            navigate("/auth/roles")
          }
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <button
          className="auth-logo"
          onClick={() =>
            navigate("/auth/roles")
          }
        >
          <span>
            <HeartPulse size={21} />
          </span>

          <strong>MediTrack</strong>
        </button>

        <div className="security-label">
          <LockKeyhole size={14} />
          Secure access
        </div>

      </header>


      {/* MAIN */}

      <main className="login-container">

        {/* LEFT SIDE */}

        <section className="login-visual">

          <div className="login-visual-content">

            <div className="visual-badge">
              <ShieldCheck size={15} />
              Secure {selected.name} portal
            </div>

            <div className="login-big-icon">
              <Icon size={28} />
            </div>

            <h1>
              {selected.title}
            </h1>

            <p>
              {selected.description}
            </p>

            <div className="login-benefits">

              <div>
                <ShieldCheck size={16} />
                <span>
                  Role-based access
                </span>
              </div>

              <div>
                <LockKeyhole size={16} />
                <span>
                  Protected health information
                </span>
              </div>

              <div>
                <HeartPulse size={16} />
                <span>
                  Patient-centered care
                </span>
              </div>

            </div>

          </div>

        </section>


        {/* RIGHT SIDE */}

        <section className="login-form-area">

          <div className="login-form-card">

            <div className="login-form-header">

              <div className="login-role-icon">
                <Icon size={20} />
              </div>

              <div>
                <span>
                  {selected.name} account
                </span>

                <h2>
                  Welcome back
                </h2>
              </div>

            </div>

            <p className="login-description">
              Sign in securely to continue
              to your MediTrack account.
            </p>


            <form
              onSubmit={handleSubmit}
              noValidate
            >

              {/* EMAIL */}

              <label>
                Email address

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  autoComplete="email"
                  required
                />
              </label>


              {/* PASSWORD */}

              <label>
                Password

                <div className="password-field">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </label>


              {/* ERROR */}

              {error && (
                <div
                  className="login-error"
                  role="alert"
                >
                  {error}
                </div>
              )}


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className="primary-button login-button"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : `Sign in as ${selected.name}`}
              </button>

            </form>


            {/* REGISTRATION */}

            {role === "patient" && (
              <div className="login-register">

                <span>
                  Don't have an account?
                </span>

                <button
                  onClick={() =>
                    navigate(
                      "/register/patient"
                    )
                  }
                >
                  Create patient account
                </button>

              </div>
            )}


            {role === "doctor" && (
              <div className="login-register">

                <span>
                  New healthcare professional?
                </span>

                <button
                  onClick={() =>
                    navigate(
                      "/register/doctor"
                    )
                  }
                >
                  Apply as a doctor
                </button>

              </div>
            )}


            {role === "admin" && (
              <div className="admin-notice">

                Administrator accounts are
                provisioned and controlled by
                MediTrack platform management.

              </div>
            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default Login;