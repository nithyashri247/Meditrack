import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  HeartPulse,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

const initialForm = {
  dateOfBirth: "",
  gender: "",
  bloodGroup: "unknown",

  address: "",
  city: "",
  state: "",

  allergies: "",
  medicalConditions: "",
  previousSurgeries: "",
  familyHistory: "",

  smokingStatus: "prefer_not_to_say",
  alcoholStatus: "prefer_not_to_say",
  activityLevel: "prefer_not_to_say",

  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",

  criticalNotes: "",
};

function profileToForm(profile) {
  return {
    dateOfBirth: profile.dateOfBirth
      ? profile.dateOfBirth.split("T")[0]
      : "",
    gender: profile.gender || "",
    bloodGroup: profile.bloodGroup || "unknown",
    address: profile.address || "",
    city: profile.city || "",
    state: profile.state || "",
    allergies: profile.allergies?.join(", ") || "",
    medicalConditions: profile.medicalConditions?.join(", ") || "",
    previousSurgeries: profile.previousSurgeries?.join(", ") || "",
    familyHistory: profile.familyHistory?.join(", ") || "",
    smokingStatus: profile.smokingStatus || "prefer_not_to_say",
    alcoholStatus: profile.alcoholStatus || "prefer_not_to_say",
    activityLevel: profile.activityLevel || "prefer_not_to_say",
    emergencyName: profile.emergencyContact?.name || "",
    emergencyRelationship: profile.emergencyContact?.relationship || "",
    emergencyPhone: profile.emergencyContact?.phone || "",
    criticalNotes: profile.criticalNotes || "",
  };
}

function PatientProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const profileCacheKey = user?.email
    ? `meditrack_patient_profile_${user.email.toLowerCase()}`
    : "meditrack_patient_profile";

  const [form, setForm] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [patientName, setPatientName] =
    useState("Patient");

  useEffect(() => {
    if (user?.email) {
      loadProfile();
    }
  }, [user?.email]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/patients/profile"
      );

      const profile =
        response.data?.data;

      if (!profile) {
        throw new Error("Profile data was not returned.");
      }

      // Keep a local copy as a same-user fallback. The database remains
      // the source of truth, so signing out does not erase saved details.
      try {
        localStorage.setItem(
          profileCacheKey,
          JSON.stringify(profile)
        );
      } catch {
        // Ignore storage failures; the server copy is still authoritative.
      }

      setPatientName(
        profile.user?.name ||
          "Patient"
      );

      setForm(profileToForm(profile));
    } catch (err) {
      // If the API is temporarily unavailable, restore the last saved copy
      // for this signed-in patient so their entered details are not lost.
      try {
        const cached = localStorage.getItem(profileCacheKey);
        if (cached) {
          const profile = JSON.parse(cached);
          setPatientName(profile.user?.name || "Patient");
          setForm(profileToForm(profile));
          setError("Showing your last saved profile while we reconnect to MediTrack.");
          return;
        }
      } catch {
        // Ignore invalid/blocked local cache.
      }

      setError(
        err.response?.data?.message ||
          "Unable to load your health profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSuccess("");

    setError("");
  }

  function convertToArray(value) {
    return value
      .split(",")
      .map((item) =>
        item.trim()
      )
      .filter(Boolean);
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        dateOfBirth:
          form.dateOfBirth || null,

        gender:
          form.gender || null,

        bloodGroup:
          form.bloodGroup,

        address:
          form.address,

        city:
          form.city,

        state:
          form.state,

        allergies:
          convertToArray(
            form.allergies
          ),

        medicalConditions:
          convertToArray(
            form.medicalConditions
          ),

        previousSurgeries:
          convertToArray(
            form.previousSurgeries
          ),

        familyHistory:
          convertToArray(
            form.familyHistory
          ),

        smokingStatus:
          form.smokingStatus,

        alcoholStatus:
          form.alcoholStatus,

        activityLevel:
          form.activityLevel,

        emergencyContact: {
          name:
            form.emergencyName,

          relationship:
            form.emergencyRelationship,

          phone:
            form.emergencyPhone,
        },

        criticalNotes:
          form.criticalNotes,
      };

      const response =
        await api.put(
          "/patients/profile",
          payload
        );

      const updatedProfile =
        response.data?.data;

      if (updatedProfile) {
        setPatientName(
          updatedProfile.user
            ?.name ||
            patientName
        );

        try {
          localStorage.setItem(
            profileCacheKey,
            JSON.stringify(updatedProfile)
          );
        } catch {
          // Database save already succeeded; cache is only a convenience.
        }
      }

      setSuccess(
        "Your health profile has been saved successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save your health profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const completion =
    useMemo(() => {
      let completed = 0;
      const total = 10;

      if (form.dateOfBirth)
        completed++;

      if (form.gender)
        completed++;

      if (
        form.bloodGroup &&
        form.bloodGroup !==
          "unknown"
      ) {
        completed++;
      }

      if (form.city)
        completed++;

      if (form.state)
        completed++;

      if (form.allergies.trim())
        completed++;

      if (
        form.medicalConditions.trim()
      ) {
        completed++;
      }

      if (form.emergencyName)
        completed++;

      if (form.emergencyPhone)
        completed++;

      if (
        form.activityLevel !==
        "prefer_not_to_say"
      ) {
        completed++;
      }

      return Math.round(
        (completed / total) * 100
      );
    }, [form]);

  if (loading) {
    return (
      <div className="profile-loading">

        <LoaderCircle
          size={25}
          className="spin"
        />

        <span>
          Loading your health profile...
        </span>

      </div>
    );
  }

  return (
    <div className="patient-profile-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="profile-page-header">

        <div>

          <button
            type="button"
            className="profile-back-button"
            onClick={() =>
              navigate("/patient")
            }
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>

          <div className="patient-page-eyebrow">
            PERSONAL HEALTH PROFILE
          </div>

          <h1>
            My health profile
          </h1>

          <p>
            Keep your personal and health
            information up to date so
            MediTrack can provide a more
            useful and personalized experience.
          </p>

        </div>

        <div className="profile-header-icon">
          <UserRound size={24} />
        </div>

      </div>


      {/* =====================================================
          PROFILE COMPLETION
          ===================================================== */}

      <section className="profile-completion-card">

        <div className="completion-icon">
          <Activity size={19} />
        </div>

        <div className="completion-content">

          <div className="completion-top">

            <div>
              <strong>
                Profile completeness
              </strong>

              <span>
                {completion}% complete
              </span>
            </div>

            <div className="completion-percentage">
              {completion}%
            </div>

          </div>

          <div className="completion-track">

            <div
              className="completion-fill"
              style={{
                width: `${completion}%`,
              }}
            />

          </div>

          <p>
            Complete more of your profile
            to keep your health information
            ready for authorized care workflows.
          </p>

        </div>

      </section>


      {/* =====================================================
          ALERTS
          ===================================================== */}

      {error && (
        <div
          className="profile-message error"
          role="alert"
        >
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="profile-message success"
          role="status"
        >
          <Check size={17} />
          <span>{success}</span>
        </div>
      )}


      <form
        className="profile-form"
        onSubmit={handleSubmit}
      >

        {/* ===================================================
            PERSONAL DETAILS
            =================================================== */}

        <section className="profile-section">

          <div className="profile-section-heading">

            <div className="section-icon">
              <UserRound size={18} />
            </div>

            <div>
              <span>
                PERSONAL DETAILS
              </span>

              <h2>
                About you
              </h2>

              <p>
                Basic information used to
                maintain your patient profile.
              </p>
            </div>

          </div>


          <div className="profile-form-grid">

            <FormField
              label="Date of birth"
              required
            >
              <input
                type="date"
                value={
                  form.dateOfBirth
                }
                onChange={(event) =>
                  updateField(
                    "dateOfBirth",
                    event.target.value
                  )
                }
              />
            </FormField>


            <FormField
              label="Gender"
              required
            >
              <select
                value={form.gender}
                onChange={(event) =>
                  updateField(
                    "gender",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select gender
                </option>

                <option value="male">
                  Male
                </option>

                <option value="female">
                  Female
                </option>

                <option value="other">
                  Other
                </option>

                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </FormField>


            <FormField
              label="Blood group"
              required
            >
              <select
                value={
                  form.bloodGroup
                }
                onChange={(event) =>
                  updateField(
                    "bloodGroup",
                    event.target.value
                  )
                }
              >
                <option value="unknown">
                  Select blood group
                </option>

                <option value="A+">
                  A+
                </option>

                <option value="A-">
                  A-
                </option>

                <option value="B+">
                  B+
                </option>

                <option value="B-">
                  B-
                </option>

                <option value="AB+">
                  AB+
                </option>

                <option value="AB-">
                  AB-
                </option>

                <option value="O+">
                  O+
                </option>

                <option value="O-">
                  O-
                </option>
              </select>
            </FormField>

          </div>

        </section>


        {/* ===================================================
            LOCATION
            =================================================== */}

        <section className="profile-section">

          <div className="profile-section-heading">

            <div className="section-icon">
              <HeartPulse size={18} />
            </div>

            <div>
              <span>
                LOCATION
              </span>

              <h2>
                Where you live
              </h2>

              <p>
                Your location can help support
                appointment and care workflows.
              </p>
            </div>

          </div>


          <div className="profile-form-grid">

            <FormField
              label="Address"
              className="full"
            >
              <textarea
                rows="3"
                placeholder="Enter your address"
                value={
                  form.address
                }
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
              />
            </FormField>


            <FormField label="City">
              <input
                type="text"
                placeholder="Chennai"
                value={form.city}
                onChange={(event) =>
                  updateField(
                    "city",
                    event.target.value
                  )
                }
              />
            </FormField>


            <FormField label="State">
              <input
                type="text"
                placeholder="Tamil Nadu"
                value={form.state}
                onChange={(event) =>
                  updateField(
                    "state",
                    event.target.value
                  )
                }
              />
            </FormField>

          </div>

        </section>


        {/* ===================================================
            MEDICAL BACKGROUND
            =================================================== */}

        <section className="profile-section">

          <div className="profile-section-heading">

            <div className="section-icon medical">
              <HeartPulse size={18} />
            </div>

            <div>
              <span>
                MEDICAL BACKGROUND
              </span>

              <h2>
                Your medical history
              </h2>

              <p>
                Add information that may be
                relevant during authorized care.
              </p>
            </div>

          </div>


          <div className="profile-form-grid">

            <FormField
              label="Allergies"
              className="full"
              hint="Separate multiple entries with commas."
            >
              <textarea
                rows="3"
                placeholder="Example: Penicillin, dust, peanuts"
                value={
                  form.allergies
                }
                onChange={(event) =>
                  updateField(
                    "allergies",
                    event.target.value
                  )
                }
              />
            </FormField>


            <FormField
              label="Existing medical conditions"
              className="full"
              hint="Separate multiple entries with commas."
            >
              <textarea
                rows="3"
                placeholder="Example: Asthma, diabetes"
                value={
                  form.medicalConditions
                }
                onChange={(event) =>
                  updateField(
                    "medicalConditions",
                    event.target.value
                  )
                }
              />
            </FormField>


            <FormField
              label="Previous surgeries"
              className="full"
              hint="Separate multiple entries with commas."
            >
              <textarea
                rows="3"
                placeholder="Example: Appendectomy — 2024"
                value={
                  form.previousSurgeries
                }
                onChange={(event) =>
                  updateField(
                    "previousSurgeries",
                    event.target.value
                  )
                }
              />
            </FormField>


            <FormField
              label="Family medical history"
              className="full"
              hint="Separate multiple entries with commas."
            >
              <textarea
                rows="3"
                placeholder="Example: Hypertension, diabetes"
                value={
                  form.familyHistory
                }
                onChange={(event) =>
                  updateField(
                    "familyHistory",
                    event.target.value
                  )
                }
              />
            </FormField>

          </div>

        </section>


        {/* ===================================================
            LIFESTYLE
            =================================================== */}

        <section className="profile-section">

          <div className="profile-section-heading">

            <div className="section-icon">
              <Activity size={18} />
            </div>

            <div>
              <span>
                LIFESTYLE
              </span>

              <h2>
                Lifestyle information
              </h2>

              <p>
                Optional information that can
                provide context for health trends.
              </p>
            </div>

          </div>


          <div className="profile-form-grid">

            <FormField label="Smoking status">
              <select
                value={
                  form.smokingStatus
                }
                onChange={(event) =>
                  updateField(
                    "smokingStatus",
                    event.target.value
                  )
                }
              >
                <option value="never">
                  Never
                </option>

                <option value="former">
                  Former smoker
                </option>

                <option value="occasional">
                  Occasional
                </option>

                <option value="regular">
                  Regular
                </option>

                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </FormField>


            <FormField label="Alcohol status">
              <select
                value={
                  form.alcoholStatus
                }
                onChange={(event) =>
                  updateField(
                    "alcoholStatus",
                    event.target.value
                  )
                }
              >
                <option value="never">
                  Never
                </option>

                <option value="former">
                  Former
                </option>

                <option value="occasional">
                  Occasional
                </option>

                <option value="regular">
                  Regular
                </option>

                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </FormField>


            <FormField label="Activity level">
              <select
                value={
                  form.activityLevel
                }
                onChange={(event) =>
                  updateField(
                    "activityLevel",
                    event.target.value
                  )
                }
              >
                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>

                <option value="sedentary">
                  Sedentary
                </option>

                <option value="light">
                  Light activity
                </option>

                <option value="moderate">
                  Moderate activity
                </option>

                <option value="active">
                  Active
                </option>

                <option value="very_active">
                  Very active
                </option>
              </select>
            </FormField>

          </div>

        </section>


        {/* ===================================================
            EMERGENCY CONTACT
            =================================================== */}

        <section className="profile-section emergency-section">

          <div className="profile-section-heading">

            <div className="section-icon emergency">
              <ShieldCheck size={18} />
            </div>

            <div>
              <span>
                EMERGENCY INFORMATION
              </span>

              <h2>
                Emergency contact
              </h2>

              <p>
                Keep a trusted contact available
                for emergency workflows.
              </p>
            </div>

          </div>


          <div className="profile-form-grid">

            <FormField label="Contact name">
              <input
                type="text"
                placeholder="Emergency contact name"
                value={
                  form.emergencyName
                }
                onChange={(event) =>
                  updateField(
                    "emergencyName",
                    event.target.value
                  )
                }
              />
            </FormField>


            <FormField label="Relationship">
              <input
                type="text"
                placeholder="Parent, sibling, spouse..."
                value={
                  form.emergencyRelationship
                }
                onChange={(event) =>
                  updateField(
                    "emergencyRelationship",
                    event.target.value
                  )
                }
              />
            </FormField>


            <FormField
              label="Emergency phone"
              className="full"
            >
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={
                  form.emergencyPhone
                }
                onChange={(event) =>
                  updateField(
                    "emergencyPhone",
                    event.target.value
                  )
                }
              />
            </FormField>


            <FormField
              label="Critical medical notes"
              className="full"
              hint="Keep this limited to important information relevant in an emergency."
            >
              <textarea
                rows="4"
                placeholder="Example: Severe allergy to..."
                value={
                  form.criticalNotes
                }
                onChange={(event) =>
                  updateField(
                    "criticalNotes",
                    event.target.value
                  )
                }
              />
            </FormField>

          </div>

        </section>


        {/* ===================================================
            FORM FOOTER
            =================================================== */}

        <div className="profile-form-footer">

          <div className="profile-security-note">

            <ShieldCheck size={17} />

            <div>

              <strong>
                Your information stays under your control
              </strong>

              <span>
                Sensitive health information is
                protected by MediTrack's authorization
                and consent workflows.
              </span>

            </div>

          </div>


          <button
            type="submit"
            className="primary-button profile-save-button"
            disabled={saving}
          >

            {saving ? (
              <>
                <LoaderCircle
                  size={17}
                  className="spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save health profile
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
}


/* =========================================================
   FORM FIELD
   ========================================================= */

function FormField({
  label,
  children,
  className = "",
  hint = "",
  required = false,
}) {
  return (
    <label
      className={`profile-field ${className}`}
    >

      <span className="field-label">

        {label}

        {required && (
          <span className="required-star">
            *
          </span>
        )}

      </span>

      {children}

      {hint && (
        <span className="field-hint">
          {hint}
        </span>
      )}

    </label>
  );
}

export default PatientProfile;