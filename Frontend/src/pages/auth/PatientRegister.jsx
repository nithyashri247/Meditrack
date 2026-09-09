import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function PatientRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    // Frontend validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register/patient", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      setSuccess(true);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="success-page">
        <div className="success-card">

          <div className="success-icon">
            <CheckCircle2 size={32} />
          </div>

          <div className="eyebrow">
            ACCOUNT CREATED
          </div>

          <h1>
            Welcome to
            <span> MediTrack.</span>
          </h1>

          <p>
            Your patient account has been created
            successfully. You can now sign in using
            the email and password you selected.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/login/patient")
            }
          >
            Continue to patient login
            <ArrowRight size={17} />
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="register-page">

      {/* HEADER */}

      <header className="register-header">

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/login/patient")
          }
        >
          <ArrowLeft size={17} />
          Back to login
        </button>

        <button
          type="button"
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

        <div className="register-security">
          <LockKeyhole size={15} />
          Secure registration
        </div>

      </header>


      {/* MAIN */}

      <main className="register-container">

        <div className="register-heading">

          <div className="eyebrow">
            PATIENT ACCOUNT
          </div>

          <h1>
            Start your
            <span> health journey.</span>
          </h1>

          <p>
            Create your secure MediTrack account.
            You will be able to complete your health
            profile after registration.
          </p>

        </div>


        {/* REGISTRATION CARD */}

        <div className="register-card">

          <form
            onSubmit={handleSubmit}
            noValidate
          >

            {/* PERSONAL DETAILS */}

            <section className="form-section">

              <h3>
                Personal details
              </h3>

              <div className="form-grid">

                <label>
                  Full name

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  Phone number

                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                    autoComplete="tel"
                  />
                </label>

                <label className="full-width">
                  Email address

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                    autoComplete="email"
                    required
                  />
                </label>

              </div>

            </section>


            {/* SECURITY */}

            <section className="form-section">

              <h3>
                Account security
              </h3>

              <div className="form-grid">

                <label>
                  Password

                  <input
                    type="password"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(event) =>
                      updateField(
                        "password",
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    required
                  />
                </label>

                <label>
                  Confirm password

                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    value={
                      form.confirmPassword
                    }
                    onChange={(event) =>
                      updateField(
                        "confirmPassword",
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    required
                  />
                </label>

              </div>

              <p className="password-hint">
                Use at least 8 characters with
                uppercase, lowercase and a number.
              </p>

            </section>


            {/* ERROR */}

            {error && (
              <div
                className="login-error"
                role="alert"
              >
                {error}
              </div>
            )}


            {/* TERMS */}

            <label className="terms-check">

              <input
                type="checkbox"
                required
              />

              <span>
                I agree to MediTrack's privacy
                policy and terms of use.
              </span>

            </label>


            {/* SUBMIT */}

            <button
              type="submit"
              className="primary-button register-button"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create patient account"}

              {!loading && (
                <ArrowRight size={17} />
              )}
            </button>

          </form>


          {/* FOOTER */}

          <div className="register-footer">

            Already have a patient account?

            <button
              type="button"
              onClick={() =>
                navigate("/login/patient")
              }
            >
              Sign in
            </button>

          </div>

        </div>


        {/* TRUST */}

        <div className="registration-trust">

          <div>
            <ShieldCheck size={16} />
            Secure account creation
          </div>

          <div>
            <LockKeyhole size={16} />
            Passwords are protected
          </div>

        </div>

      </main>

    </div>
  );
}

export default PatientRegister;