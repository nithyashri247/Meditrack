import {
  AlertTriangle,
  ArrowLeft,
  HeartPulse,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
  Save,
  Siren,
  Stethoscope,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function EmergencyProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showEmergencyView, setShowEmergencyView] =
    useState(false);

  const [showContactModal, setShowContactModal] =
    useState(false);
    const [showUrgentAppointment, setShowUrgentAppointment] =
  useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [form, setForm] = useState({
    bloodGroup: "",
    allergies: [],
    medicalConditions: [],
    importantNotes: "",
    emergencyContacts: [],
    allowAuthorizedDoctors: true,
    allowEmergencyContactAlert: true,
  });

  const [contactForm, setContactForm] = useState({
    name: "",
    relationship: "",
    phone: "",
    alternatePhone: "",
    isPrimary: false,
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD PROFILE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadEmergencyProfile();
  }, []);

 async function loadEmergencyProfile() {
  try {
    setLoading(true);
    setError("");

    const response = await api.get(
      "/emergency-profile"
    );

    const data =
      response.data?.data || {};

    setForm({
      bloodGroup:
        data.bloodGroup || "",

      allergies:
        Array.isArray(data.allergies)
          ? data.allergies
          : [],

      medicalConditions:
        Array.isArray(
          data.medicalConditions
        )
          ? data.medicalConditions
          : [],

      importantNotes:
        data.importantNotes || "",

      emergencyContacts:
        Array.isArray(
          data.emergencyContacts
        )
          ? data.emergencyContacts
          : [],

      allowAuthorizedDoctors:
        data.allowAuthorizedDoctors !== false,

      allowEmergencyContactAlert:
        data.allowEmergencyContactAlert !== false,
    });
    setProfileLoaded(true);
  } catch (error) {
  console.error(
    "Unable to load emergency profile:",
    error
  );

  if (error.response?.status === 404) {
    setProfileLoaded(true);
    return;
  }

  setError(
    error.response?.data?.message ||
      "Unable to load your emergency profile."
  );
} finally {
  setLoading(false);
}
}
useEffect(() => {
  if (!profileLoaded) return;

  const timer = setTimeout(() => {
    autoSaveEmergencyProfile();
  }, 700);

  return () => clearTimeout(timer);
}, [
  profileLoaded,
  form.bloodGroup,
  form.allergies,
  form.medicalConditions,
  form.importantNotes,
  form.emergencyContacts,
  form.allowAuthorizedDoctors,
  form.allowEmergencyContactAlert,
]);
async function autoSaveEmergencyProfile() {
  try {
    await api.put(
      "/emergency-profile",
      form
    );

    console.log(
      "✅ Emergency profile auto-saved."
    );
  } catch (error) {
    console.error(
      "❌ Emergency profile auto-save failed:",
      error
    );
  }
}


  /*
  |--------------------------------------------------------------------------
  | SIMPLE FIELD UPDATE
  |--------------------------------------------------------------------------
  */

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  /*
  |--------------------------------------------------------------------------
  | TAG HELPERS
  |--------------------------------------------------------------------------
  */

  function addTag(field, value) {
    const cleanValue =
      String(value || "").trim();

    if (!cleanValue) return;

    if (
      form[field].some(
        (item) =>
          item.toLowerCase() ===
          cleanValue.toLowerCase()
      )
    ) {
      return;
    }

    updateField(field, [
      ...form[field],
      cleanValue,
    ]);
  }

  function removeTag(field, index) {
    updateField(
      field,
      form[field].filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CONTACT HELPERS
  |--------------------------------------------------------------------------
  */

  function openContactModal() {
    setContactForm({
      name: "",
      relationship: "",
      phone: "",
      alternatePhone: "",
      isPrimary:
        form.emergencyContacts.length ===
        0,
    });

    setShowContactModal(true);
    setError("");
  }

  function closeContactModal() {
    setShowContactModal(false);
  }

  function addEmergencyContact() {
    if (
      !contactForm.name.trim() ||
      !contactForm.relationship.trim() ||
      !contactForm.phone.trim()
    ) {
      setError(
        "Please enter the contact name, relationship and phone number."
      );
      return;
    }

    /*
     * Only one contact can be primary.
     */
    const existing =
      form.emergencyContacts.map(
        (contact) => ({
          ...contact,
          isPrimary:
            contactForm.isPrimary
              ? false
              : contact.isPrimary,
        })
      );

    updateField(
      "emergencyContacts",
      [
        ...existing,
        {
          id:
            Date.now().toString(),
          name:
            contactForm.name.trim(),
          relationship:
            contactForm.relationship.trim(),
          phone:
            contactForm.phone.trim(),
          alternatePhone:
            contactForm.alternatePhone.trim(),
          isPrimary:
            contactForm.isPrimary ||
            existing.length === 0,
        },
      ]
    );

    setShowContactModal(false);
  }

  function removeEmergencyContact(id) {
    updateField(
      "emergencyContacts",
      form.emergencyContacts.filter(
        (contact) =>
          contact.id !== id
      )
    );
  }

  function makePrimaryContact(id) {
    updateField(
      "emergencyContacts",
      form.emergencyContacts.map(
        (contact) => ({
          ...contact,
          isPrimary:
            contact.id === id,
        })
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE PROFILE
  |--------------------------------------------------------------------------
  */

 async function saveEmergencyProfile() {
  try {
    setSaving(true);
    setError("");
    setSuccess("");

    const response =
      await api.put(
        "/emergency-profile",
        form
      );

    const saved =
      response.data?.data;

    if (saved) {
      setForm({
        bloodGroup:
          saved.bloodGroup || "",

        allergies:
          Array.isArray(saved.allergies)
            ? saved.allergies
            : [],

        medicalConditions:
          Array.isArray(
            saved.medicalConditions
          )
            ? saved.medicalConditions
            : [],

        importantNotes:
          saved.importantNotes || "",

        emergencyContacts:
          Array.isArray(
            saved.emergencyContacts
          )
            ? saved.emergencyContacts
            : [],

        allowAuthorizedDoctors:
          saved.allowAuthorizedDoctors !== false,

        allowEmergencyContactAlert:
          saved.allowEmergencyContactAlert !== false,
      });
    }

    setSuccess(
      "Emergency profile saved successfully."
    );
  } catch (error) {
    console.error(
      "Save emergency profile error:",
      error
    );

    setError(
      error.response?.data?.message ||
        "Unable to save your emergency profile."
    );
  } finally {
    setSaving(false);
  }
}

  /*
  |--------------------------------------------------------------------------
  | PROFILE COMPLETENESS
  |--------------------------------------------------------------------------
  */

  const completion = useMemo(() => {
    let completed = 0;
    const total = 5;

    if (form.bloodGroup) {
      completed++;
    }

    if (
      form.allergies.length > 0
    ) {
      completed++;
    }

    if (
      form.medicalConditions.length >
      0
    ) {
      completed++;
    }

    if (
      form.emergencyContacts.length >
      0
    ) {
      completed++;
    }

    if (
      form.importantNotes.trim()
    ) {
      completed++;
    }

    return Math.round(
      (completed / total) * 100
    );
  }, [form]);

  /*
  |--------------------------------------------------------------------------
  | PRIMARY CONTACT
  |--------------------------------------------------------------------------
  */

  const primaryContact =
    form.emergencyContacts.find(
      (contact) =>
        contact.isPrimary
    ) ||
    form.emergencyContacts[0] ||
    null;

  if (loading) {
    return (
      <div className="emergency-profile-page">
        <div className="emergency-loading">
          <HeartPulse size={30} />
          <h2>
            Loading emergency profile...
          </h2>
          <p>
            Preparing your critical health information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-profile-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="emergency-header">

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

          <div className="emergency-eyebrow">
            EMERGENCY HEALTH PROFILE
          </div>

          <h1>
            Your emergency information
          </h1>

          <p>
            Keep essential health information
            ready for situations where every
            second matters.
          </p>

        </div>

        <div className="emergency-header-actions">

  <button
    type="button"
    className="urgent-appointment-button"
    onClick={() =>
      setShowUrgentAppointment(true)
    }
  >
    <Siren size={17} />
    Request Urgent Appointment
  </button>

  <button
    type="button"
    className="emergency-view-button"
    onClick={() =>
      setShowEmergencyView(true)
    }
  >
    <ShieldCheck size={17} />
    View Emergency Card
  </button>

  <button
    type="button"
    className="emergency-save-button"
    onClick={
      saveEmergencyProfile
    }
    disabled={saving}
  >
    <Save size={17} />
    {saving
      ? "Saving..."
      : "Save Profile"}
  </button>

</div>
      </section>


      {/* =====================================================
          ALERTS
          ===================================================== */}

      {error && (
        <div className="emergency-alert emergency-alert-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="emergency-alert emergency-alert-success">
          <ShieldCheck size={17} />
          <span>{success}</span>
        </div>
      )}


      {/* =====================================================
          COMPLETENESS
          ===================================================== */}

      <section className="emergency-completion-card">

        <div>

          <span>
            EMERGENCY PROFILE
          </span>

          <h2>
            {completion === 100
              ? "Emergency profile complete"
              : "Complete your emergency profile"}
          </h2>

          <p>
            Keep your critical information
            accurate and up to date.
          </p>

        </div>

        <div className="emergency-completion-score">

          <strong>
            {completion}%
          </strong>

          <div className="emergency-progress">
            <div
              style={{
                width: `${completion}%`,
              }}
            />
          </div>

        </div>

      </section>


      {/* =====================================================
          BLOOD GROUP + ALERTS
          ===================================================== */}

      <section className="emergency-grid">

        <article className="emergency-card blood-group-card">

          <div className="emergency-card-icon">
            🩸
          </div>

          <div className="emergency-card-title">
            <span>
              BLOOD GROUP
            </span>

            <h2>
              {form.bloodGroup ||
                "Not provided"}
            </h2>
          </div>

          <select
            value={form.bloodGroup}
            onChange={(event) =>
              updateField(
                "bloodGroup",
                event.target.value
              )
            }
          >
            <option value="">
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

        </article>


        <article className="emergency-card allergy-card">

          <div className="emergency-card-heading">

            <div>
              <span>
                CRITICAL ALLERGIES
              </span>

              <h2>
                What should healthcare staff know?
              </h2>
            </div>

            <AlertTriangle
              size={20}
            />

          </div>

          <div className="emergency-tag-list">

            {form.allergies.length === 0 ? (
              <span className="emergency-empty-text">
                No allergies added
              </span>
            ) : (
              form.allergies.map(
                (allergy, index) => (
                  <span
                    className="emergency-tag emergency-tag-warning"
                    key={`${allergy}-${index}`}
                  >
                    {allergy}

                    <button
                      type="button"
                      onClick={() =>
                        removeTag(
                          "allergies",
                          index
                        )
                      }
                    >
                      <X size={13} />
                    </button>
                  </span>
                )
              )
            )}

          </div>

          <TagInput
            placeholder="Add allergy and press Enter"
            onAdd={(value) =>
              addTag(
                "allergies",
                value
              )
            }
          />

        </article>

      </section>


      {/* =====================================================
          CONDITIONS + MEDICATIONS
          ===================================================== */}

      <section className="emergency-grid">

        <article className="emergency-card">

          <div className="emergency-card-heading">

            <div>
              <span>
                MEDICAL CONDITIONS
              </span>

              <h2>
                Important conditions
              </h2>
            </div>

            <HeartPulse
              size={21}
            />

          </div>

          <div className="emergency-tag-list">

            {form.medicalConditions
              .length === 0 ? (
              <span className="emergency-empty-text">
                No medical conditions added
              </span>
            ) : (
              form.medicalConditions.map(
                (
                  condition,
                  index
                ) => (
                  <span
                    className="emergency-tag"
                    key={`${condition}-${index}`}
                  >
                    {condition}

                    <button
                      type="button"
                      onClick={() =>
                        removeTag(
                          "medicalConditions",
                          index
                        )
                      }
                    >
                      <X size={13} />
                    </button>
                  </span>
                )
              )
            )}

          </div>

          <TagInput
            placeholder="Add condition and press Enter"
            onAdd={(value) =>
              addTag(
                "medicalConditions",
                value
              )
            }
          />

        </article>


        <article className="emergency-card medication-summary-card">

          <div className="emergency-card-heading">

            <div>
              <span>
                CURRENT MEDICATIONS
              </span>

              <h2>
                Active medicines
              </h2>
            </div>

            <HeartPulse
              size={21}
            />

          </div>

          <p className="emergency-integration-note">
            Your active medicines from the
            Prescription module will appear here
            automatically.
          </p>

          <div className="emergency-linked-card">
            <Stethoscope size={17} />

            <div>
              <strong>
                Prescription integration
              </strong>

              <span>
                Active medications stay synchronized
                with your medication records.
              </span>
            </div>
          </div>

        </article>

      </section>


      {/* =====================================================
          EMERGENCY CONTACTS
          ===================================================== */}

      <section className="emergency-card emergency-contacts-card">

        <div className="emergency-card-heading">

          <div>
            <span>
              EMERGENCY CONTACTS
            </span>

            <h2>
              People to contact in an emergency
            </h2>

            <p>
              Add trusted contacts who can be
              reached when you need assistance.
            </p>
          </div>

          <button
            type="button"
            className="emergency-add-button"
            onClick={
              openContactModal
            }
          >
            <Plus size={16} />
            Add Contact
          </button>

        </div>


        {form.emergencyContacts
          .length === 0 ? (

          <div className="emergency-empty-state">

            <UserRound size={24} />

            <strong>
              No emergency contacts yet
            </strong>

            <span>
              Add at least one trusted contact.
            </span>

          </div>

        ) : (

          <div className="emergency-contact-list">

            {form.emergencyContacts.map(
              (contact) => (
                <article
                  className="emergency-contact-item"
                  key={contact.id}
                >

                  <div className="emergency-contact-avatar">
                    <UserRound size={19} />
                  </div>

                  <div className="emergency-contact-main">

                    <div className="emergency-contact-name">

                      <strong>
                        {contact.name}
                      </strong>

                      {contact.isPrimary && (
                        <span className="primary-contact-badge">
                          Primary
                        </span>
                      )}

                    </div>

                    <span>
                      {contact.relationship}
                    </span>

                    <span>
                      {contact.phone}
                    </span>

                  </div>

                  <div className="emergency-contact-actions">

                    {!contact.isPrimary && (
                      <button
                        type="button"
                        onClick={() =>
                          makePrimaryContact(
                            contact.id
                          )
                        }
                      >
                        Make primary
                      </button>
                    )}

                    <a
                      href={`tel:${contact.phone}`}
                      className="emergency-call-button"
                    >
                      <Phone size={15} />
                      Call
                    </a>

                    <button
                      type="button"
                      className="emergency-delete-button"
                      onClick={() =>
                        removeEmergencyContact(
                          contact.id
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                </article>
              )
            )}

          </div>

        )}

      </section>


      {/* =====================================================
          IMPORTANT NOTES
          ===================================================== */}

      <section className="emergency-card">

        <div className="emergency-card-heading">

          <div>
            <span>
              IMPORTANT INFORMATION
            </span>

            <h2>
              Notes for healthcare providers
            </h2>

            <p>
              Add patient-provided information
              that may be important during care.
            </p>
          </div>

        </div>

        <textarea
          rows={5}
          value={form.importantNotes}
          onChange={(event) =>
            updateField(
              "importantNotes",
              event.target.value
            )
          }
          placeholder="Example: History of fainting during prolonged fasting..."
        />

      </section>


      {/* =====================================================
          PRIVACY & CONSENT
          ===================================================== */}

      <section className="emergency-card">

        <div className="emergency-card-heading">

          <div>
            <span>
              PRIVACY & ACCESS
            </span>

            <h2>
              Control who can use your emergency information
            </h2>
          </div>

          <ShieldCheck
            size={21}
          />

        </div>


        <label className="emergency-setting">

          <div>

            <strong>
              Allow authorized healthcare professionals
            </strong>

            <span>
              Authorized doctors may view your
              emergency profile during care.
            </span>

          </div>

          <input
            type="checkbox"
            checked={
              form.allowAuthorizedDoctors
            }
            onChange={(event) =>
              updateField(
                "allowAuthorizedDoctors",
                event.target.checked
              )
            }
          />

        </label>


        <label className="emergency-setting">

          <div>

            <strong>
              Allow emergency contact alerts
            </strong>

            <span>
              Allow your primary emergency contact
              to be selected when you request help.
            </span>

          </div>

          <input
            type="checkbox"
            checked={
              form.allowEmergencyContactAlert
            }
            onChange={(event) =>
              updateField(
                "allowEmergencyContactAlert",
                event.target.checked
              )
            }
          />

        </label>

      </section>


      {/* =====================================================
          EMERGENCY ACTION CENTER
          ===================================================== */}

      <section className="emergency-action-card">

  <div className="emergency-action-icon">
    <Siren size={27} />
  </div>

  <div className="emergency-action-content">

    <span>
      EMERGENCY ASSISTANCE
    </span>

    <h2>
      Need urgent medical help?
    </h2>

    <p>
      For a life-threatening emergency,
      contact your local emergency service
      immediately. You can also contact your
      saved emergency contact directly.
    </p>

  </div>

  <div className="emergency-action-buttons">

  <button
    type="button"
    className="emergency-call-button emergency-call-red"
    onClick={() => {
      if (primaryContact?.phone) {
        window.location.href =
          `tel:${primaryContact.phone}`;
      } else {
        const element =
          document.querySelector(
            ".emergency-contacts-card"
          );

        element?.scrollIntoView({
          behavior: "smooth",
        });

        setError(
          "Please add an emergency contact first."
        );
      }
    }}
  >
    <Phone size={17} />

    {primaryContact
      ? `Call ${primaryContact.name}`
      : "Call Emergency Contact"}
  </button>


  <button
    type="button"
    className="emergency-secondary-action"
    onClick={() =>
      setShowEmergencyView(true)
    }
  >
    <ShieldCheck size={17} />
    View Emergency Information
  </button>

</div>
</section>


      {/* =====================================================
          SAVE FOOTER
          ===================================================== */}

      <div className="emergency-save-footer">

        <div>
          <ShieldCheck size={17} />

          <span>
            Keep your emergency information accurate
            and up to date.
          </span>
        </div>

        <button
          type="button"
          className="emergency-save-button"
          onClick={
            saveEmergencyProfile
          }
          disabled={saving}
        >
          <Save size={17} />
          {saving
            ? "Saving..."
            : "Save Emergency Profile"}
        </button>

      </div>


      {/* =====================================================
          EMERGENCY CARD MODAL
          ===================================================== */}
{showUrgentAppointment && (
  <div className="emergency-modal-overlay">

    <div className="emergency-modal">

      <div className="emergency-modal-header">

        <div>
          <span>
            URGENT MEDICAL CARE
          </span>

          <h2>
            Request an urgent appointment
          </h2>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowUrgentAppointment(false)
          }
        >
          <X size={18} />
        </button>

      </div>

      <div style={{ padding: "24px 25px" }}>

        <div className="emergency-view-warning">
          <AlertTriangle size={18} />

          <span>
            For a life-threatening emergency,
            contact your local emergency service
            immediately. This request is for urgent
            medical consultation through MediTrack.
          </span>
        </div>

        <h3 style={{ margin: "22px 0 8px" }}>
          Choose a doctor
        </h3>

        <p
          style={{
            margin: 0,
            color: "#748480",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          You will be able to request an urgent
          consultation with any registered doctor.
        </p>

        <button
          type="button"
          className="urgent-appointment-button"
          style={{
            width: "100%",
            marginTop: "20px",
          }}
          onClick={() => {
            setShowUrgentAppointment(false);
            navigate("/patient/appointments");
          }}
        >
          <Stethoscope size={17} />
          Choose a doctor
        </button>

      </div>

    </div>

  </div>
)}
      {showEmergencyView && (
        <EmergencyViewModal
          form={form}
          primaryContact={
            primaryContact
          }
          onClose={() =>
            setShowEmergencyView(false)
          }
        />
      )}


      {/* =====================================================
          CONTACT MODAL
          ===================================================== */}

      {showContactModal && (
        <ContactModal
          form={contactForm}
          setForm={setContactForm}
          onClose={
            closeContactModal
          }
          onSave={
            addEmergencyContact
          }
        />
      )}

    </div>
  );
}


/* =========================================================
   TAG INPUT
   ========================================================= */

function TagInput({
  placeholder,
  onAdd,
}) {
  const [value, setValue] =
    useState("");

  function handleKeyDown(event) {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      onAdd(value);

      setValue("");
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(event) =>
        setValue(
          event.target.value
        )
      }
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="emergency-tag-input"
    />
  );
}


/* =========================================================
   CONTACT MODAL
   ========================================================= */

function ContactModal({
  form,
  setForm,
  onClose,
  onSave,
}) {
  function update(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  return (
    <div className="emergency-modal-overlay">

      <div className="emergency-modal">

        <div className="emergency-modal-header">

          <div>
            <span>
              EMERGENCY CONTACT
            </span>

            <h2>
              Add trusted contact
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>


        <div className="emergency-modal-form">

          <label>
            Full name

            <input
              value={form.name}
              onChange={(event) =>
                update(
                  "name",
                  event.target.value
                )
              }
              placeholder="Contact name"
            />
          </label>


          <label>
            Relationship

            <input
              value={
                form.relationship
              }
              onChange={(event) =>
                update(
                  "relationship",
                  event.target.value
                )
              }
              placeholder="Mother, Father, Spouse..."
            />
          </label>


          <label>
            Phone number

            <input
              type="tel"
              value={form.phone}
              onChange={(event) =>
                update(
                  "phone",
                  event.target.value
                )
              }
              placeholder="+91 XXXXX XXXXX"
            />
          </label>


          <label>
            Alternate phone
            <span className="optional-label">
              optional
            </span>

            <input
              type="tel"
              value={
                form.alternatePhone
              }
              onChange={(event) =>
                update(
                  "alternatePhone",
                  event.target.value
                )
              }
              placeholder="Alternate number"
            />
          </label>


          <label className="emergency-modal-checkbox">

            <input
              type="checkbox"
              checked={
                form.isPrimary
              }
              onChange={(event) =>
                update(
                  "isPrimary",
                  event.target.checked
                )
              }
            />

            <span>
              Set as primary emergency contact
            </span>

          </label>

        </div>


        <div className="emergency-modal-actions">

          <button
            type="button"
            className="emergency-cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="emergency-save-button"
            onClick={onSave}
          >
            <Plus size={16} />
            Add Contact
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   EMERGENCY VIEW MODAL
   ========================================================= */

function EmergencyViewModal({
  form,
  primaryContact,
  onClose,
}) {
  return (
    <div className="emergency-modal-overlay">

      <div className="emergency-card-modal">

        <div className="emergency-card-modal-header">

          <div>

            <span>
              MEDITrack EMERGENCY CARD
            </span>

            <h2>
              Emergency Health Information
            </h2>

          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>


        <div className="emergency-view-warning">

          <AlertTriangle size={18} />

          <span>
            For emergency use. This information is
            patient-provided and should be verified
            by healthcare professionals when possible.
          </span>

        </div>


        <div className="emergency-view-grid">

          <div>
            <span>
              BLOOD GROUP
            </span>

            <strong>
              {form.bloodGroup ||
                "Not provided"}
            </strong>
          </div>


          <div>
            <span>
              ALLERGIES
            </span>

            <strong>
              {form.allergies.length
                ? form.allergies.join(
                    ", "
                  )
                : "None added"}
            </strong>
          </div>


          <div>
            <span>
              MEDICAL CONDITIONS
            </span>

            <strong>
              {form.medicalConditions
                .length
                ? form.medicalConditions.join(
                    ", "
                  )
                : "None added"}
            </strong>
          </div>


          <div>
            <span>
              EMERGENCY CONTACT
            </span>

            <strong>
              {primaryContact
                ? `${primaryContact.name} · ${primaryContact.phone}`
                : "No contact added"}
            </strong>
          </div>

        </div>


        {form.importantNotes && (
          <div className="emergency-view-notes">

            <span>
              IMPORTANT INFORMATION
            </span>

            <p>
              {form.importantNotes}
            </p>

          </div>
        )}


        {primaryContact && (
          <a
            href={`tel:${primaryContact.phone}`}
            className="emergency-large-call-button"
          >
            <Phone size={17} />
            Call {primaryContact.name}
          </a>
        )}


        <div className="emergency-modal-actions">

          <button
            type="button"
            className="emergency-cancel-button"
            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

export default EmergencyProfile;