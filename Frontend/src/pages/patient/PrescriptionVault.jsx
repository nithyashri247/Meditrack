import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Info,
  LoaderCircle,
  Moon,
  MoreVertical,
  Plus,
  Save,
  ShieldCheck,
  SkipForward,
  Sun,
  Trash2,
  Utensils,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

/* =========================================================
   CONSTANTS
   ========================================================= */

const FREQUENCIES = [
  {
    value: "once_daily",
    label: "Once daily",
  },
  {
    value: "twice_daily",
    label: "Twice daily",
  },
  {
    value: "three_times_daily",
    label: "Three times daily",
  },
  {
    value: "four_times_daily",
    label: "Four times daily",
  },
  {
    value: "once_weekly",
    label: "Once weekly",
  },
  {
    value: "as_needed",
    label: "As needed",
  },
  {
    value: "custom",
    label: "Custom schedule",
  },
];

const FOOD_OPTIONS = [
  {
    value: "before_food",
    label: "Before food",
  },
  {
    value: "after_food",
    label: "After food",
  },
  {
    value: "with_food",
    label: "With food",
  },
  {
    value: "empty_stomach",
    label: "Empty stomach",
  },
  {
    value: "anytime",
    label: "Anytime",
  },
];

const ROUTES = [
  {
    value: "oral",
    label: "Oral",
  },
  {
    value: "topical",
    label: "Topical",
  },
  {
    value: "inhaled",
    label: "Inhaled",
  },
  {
    value: "injection",
    label: "Injection",
  },
  {
    value: "sublingual",
    label: "Sublingual",
  },
  {
    value: "other",
    label: "Other",
  },
];

const DEFAULT_SCHEDULES = [
  {
    label: "morning",
    time: "08:00",
    enabled: true,
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function getTodayDate() {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  const local =
    new Date(
      now.getTime() -
        offset * 60000
    );

  return local
    .toISOString()
    .slice(0, 10);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(time) {
  if (!time) {
    return "—";
  }

  const [
    hours,
    minutes,
  ] = time.split(":");

  const date =
    new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getFoodLabel(value) {
  return (
    FOOD_OPTIONS.find(
      (item) =>
        item.value === value
    )?.label ||
    "Anytime"
  );
}

function getFrequencyLabel(
  value
) {
  return (
    FREQUENCIES.find(
      (item) =>
        item.value === value
    )?.label ||
    "Custom schedule"
  );
}

function createMedicine() {
  return {
    name: "",
    dosage: "",
    dosageUnit: "",
    route: "oral",
    frequency: "once_daily",

    schedules: [
      ...DEFAULT_SCHEDULES.map(
        (item) => ({
          ...item,
        })
      ),
    ],

    foodInstruction:
      "anytime",

    startDate:
      getTodayDate(),

    endDate: "",

    quantityPerDose: 1,

    totalQuantity: "",

    instructions: "",

    remindersEnabled: true,
  };
}

function getStatusLabel(status) {
  const labels = {
    scheduled: "Upcoming",
    taken: "Taken",
    skipped: "Skipped",
    snoozed: "Snoozed",
    missed: "Missed",
  };

  return (
    labels[status] ||
    "Upcoming"
  );
}

function getStatusClass(status) {
  const classes = {
    scheduled: "med-status-scheduled",
    taken: "med-status-taken",
    skipped: "med-status-skipped",
    snoozed: "med-status-snoozed",
    missed: "med-status-missed",
  };

  return (
    classes[status] ||
    "med-status-scheduled"
  );
}

/* =========================================================
   MEDICATION DISPLAY HELPERS
   ========================================================= */

function getMedicationDisplayStatus(medicine) {
  if (!medicine) return "scheduled";

  if (medicine.status === "taken") return "taken";
  if (medicine.status === "skipped") return "skipped";
  if (medicine.status === "snoozed") return "snoozed";
  if (medicine.status === "missed") return "missed";

  const scheduled = new Date();
  const [hours, minutes] = String(
    medicine.scheduledTime || "00:00"
  )
    .split(":")
    .map(Number);

  scheduled.setHours(
    Number(hours) || 0,
    Number(minutes) || 0,
    0,
    0
  );

  return scheduled < new Date() ? "due" : "scheduled";
}

function getMedicationDisplayLabel(medicine) {
  const state = getMedicationDisplayStatus(medicine);
  return state === "due" ? "Due" : getStatusLabel(state);
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function PrescriptionVault() {
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] =
    useState([]);

  const [todayMedicines, setTodayMedicines] =
    useState([]);

  const [adherence, setAdherence] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [selectedPrescription, setSelectedPrescription] =
    useState(null);
    const [deleteTarget, setDeleteTarget] =
  useState(null);

const [deleting, setDeleting] =
  useState(false);

  const [form, setForm] =
    useState({
      doctorName: "",
      hospitalName: "",
      prescriptionDate:
        getTodayDate(),
      diagnosisContext: "",
      followUpDate: "",
      doctorInstructions: "",
      patientNotes: "",
      medicines: [
        createMedicine(),
      ],
    });

useEffect(() => {
  loadPrescriptionData();
}, []);

useEffect(() => {
  if (!success) return;

  const timer = setTimeout(() => {
    setSuccess("");
  }, 3000);

  return () => clearTimeout(timer);
}, [success]);

 async function loadPrescriptionData() {
  console.log("✅ loadPrescriptionData started");

  setLoading(true);
  setError("");

  try {
    const [
      prescriptionResult,
      todayResult,
      adherenceResult,
    ] = await Promise.allSettled([
      api.get("/prescriptions"),

      api.get(
        "/prescriptions/medications/today"
      ),

      api.get(
        "/prescriptions/medications/adherence?days=30"
      ),
    ]);

    // PRESCRIPTIONS
    if (
      prescriptionResult.status ===
      "fulfilled"
    ) {
      setPrescriptions(
        prescriptionResult.value.data?.data || []
      );
    } else {
      console.error(
        "Prescription list failed:",
        prescriptionResult.reason
      );

      setPrescriptions([]);
    }

    // TODAY'S MEDICATIONS
    if (
      todayResult.status ===
      "fulfilled"
    ) {
      setTodayMedicines(
        todayResult.value.data?.data || []
      );
    } else {
      console.error(
        "Today's medication request failed:",
        todayResult.reason
      );

      setTodayMedicines([]);
    }

    // ADHERENCE
    if (
      adherenceResult.status ===
      "fulfilled"
    ) {
      setAdherence(
        adherenceResult.value.data?.data || null
      );
    } else {
      console.error(
        "Medication adherence request failed:",
        adherenceResult.reason
      );

      setAdherence(null);
    }

  } catch (error) {
    console.error(
      "Unexpected prescription page error:",
      error
    );

    setError(
      error.response?.data?.message ||
        "Unable to load prescription information."
    );

  } finally {
    console.log(
      "✅ loadPrescriptionData finished"
    );

    setLoading(false);
  }
}

    

  /* =======================================================
     CREATE PRESCRIPTION
     ======================================================= */

  function openCreateModal() {
    setForm({
      doctorName: "",
      hospitalName: "",
      prescriptionDate:
        getTodayDate(),
      diagnosisContext: "",
      followUpDate: "",
      doctorInstructions: "",
      patientNotes: "",
      medicines: [
        createMedicine(),
      ],
    });

    setError("");
    setSuccess("");

    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (saving) {
      return;
    }

    setShowCreateModal(false);
  }

  function updatePrescriptionField(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  }

  function updateMedicineField(
    medicineIndex,
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,

      medicines:
        previous.medicines.map(
          (medicine, index) =>
            index ===
            medicineIndex
              ? {
                  ...medicine,
                  [field]:
                    value,
                }
              : medicine
        ),
    }));

    setError("");
  }

  function addMedicine() {
    setForm((previous) => ({
      ...previous,
      medicines: [
        ...previous.medicines,
        createMedicine(),
      ],
    }));
  }

  function removeMedicine(
    medicineIndex
  ) {
    if (
      form.medicines.length ===
      1
    ) {
      setError(
        "A prescription must contain at least one medicine."
      );

      return;
    }

    setForm((previous) => ({
      ...previous,

      medicines:
        previous.medicines.filter(
          (_, index) =>
            index !==
            medicineIndex
        ),
    }));
  }

  function addSchedule(
    medicineIndex
  ) {
    setForm((previous) => ({
      ...previous,

      medicines:
        previous.medicines.map(
          (medicine, index) =>
            index ===
            medicineIndex
              ? {
                  ...medicine,

                  schedules: [
                    ...medicine.schedules,
                    {
                      label: "custom",
                      time: "20:00",
                      enabled:
                        true,
                    },
                  ],
                }
              : medicine
        ),
    }));
  }

  function updateSchedule(
    medicineIndex,
    scheduleIndex,
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,

      medicines:
        previous.medicines.map(
          (medicine, mIndex) =>
            mIndex !==
            medicineIndex
              ? medicine
              : {
                  ...medicine,

                  schedules:
                    medicine.schedules.map(
                      (
                        schedule,
                        sIndex
                      ) =>
                        sIndex ===
                        scheduleIndex
                          ? {
                              ...schedule,
                              [field]:
                                value,
                            }
                          : schedule
                    ),
                }
        ),
    }));

    setError("");
  }

  function removeSchedule(
    medicineIndex,
    scheduleIndex
  ) {
    setForm((previous) => ({
      ...previous,

      medicines:
        previous.medicines.map(
          (medicine, index) =>
            index !==
            medicineIndex
              ? medicine
              : {
                  ...medicine,

                  schedules:
                    medicine.schedules.filter(
                      (_, sIndex) =>
                        sIndex !==
                        scheduleIndex
                    ),
                }
        ),
    }));
  }

  async function handleCreatePrescription(
    event
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Basic frontend validation.
     */

    for (
      let index = 0;
      index <
      form.medicines.length;
      index++
    ) {
      const medicine =
        form.medicines[index];

      if (
        !medicine.name.trim()
      ) {
        setError(
          `Please enter the name for medicine ${index + 1}.`
        );

        return;
      }

      if (
        !medicine.dosage.trim()
      ) {
        setError(
          `Please enter the dosage for medicine ${index + 1}.`
        );

        return;
      }

      if (
        !medicine.startDate
      ) {
        setError(
          `Please select a start date for ${medicine.name}.`
        );

        return;
      }

      if (
        medicine.endDate &&
        medicine.endDate <
          medicine.startDate
      ) {
        setError(
          `End date cannot be before start date for ${medicine.name}.`
        );

        return;
      }

      if (
        medicine.frequency !==
          "as_needed" &&
        medicine.schedules.filter(
          (schedule) =>
            schedule.enabled
        ).length === 0
      ) {
        setError(
          `${medicine.name} needs at least one reminder time.`
        );

        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        doctorName:
          form.doctorName.trim(),

        hospitalName:
          form.hospitalName.trim(),

        prescriptionDate:
          form.prescriptionDate,

        diagnosisContext:
          form.diagnosisContext.trim(),

        followUpDate:
          form.followUpDate ||
          null,

        doctorInstructions:
          form.doctorInstructions.trim(),

        patientNotes:
          form.patientNotes.trim(),

        medicines:
          form.medicines.map(
            (medicine) => ({
              ...medicine,

              name:
                medicine.name.trim(),

              dosage:
                medicine.dosage.trim(),

              dosageUnit:
                medicine.dosageUnit.trim(),

              instructions:
                medicine.instructions.trim(),

              totalQuantity:
                medicine.totalQuantity ===
                ""
                  ? null
                  : Number(
                      medicine.totalQuantity
                    ),

              quantityPerDose:
                Number(
                  medicine.quantityPerDose
                ),
            })
          ),
      };

      const response =
        await api.post(
          "/prescriptions",
          payload
        );

      const newPrescription =
        response.data?.data;

      if (newPrescription) {
        setPrescriptions(
          (previous) => [
            newPrescription,
            ...previous,
          ]
        );
      }

      setShowCreateModal(
        false
      );

      setSuccess(
        "Prescription created and medication schedule prepared."
      );

      await loadPrescriptionData();
    } catch (err) {
      console.error(
        "Create prescription error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to create the prescription."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     MEDICATION STATUS
     ======================================================= */

  async function updateMedicationStatus(
    logId,
    status
  ) {
    try {
      setError("");
      setSuccess("");

      const response =
        await api.patch(
          `/prescriptions/medications/${logId}/status`,
          {
            status,
          }
        );

      const updated =
        response.data?.data;

      if (updated) {
        setTodayMedicines(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                updated._id
                  ? updated
                  : item
            )
        );
      }

      setSuccess(
        `Medication marked as ${status}.`
      );

      /*
       * Refresh adherence after
       * the medication action.
       */

      const adherenceResponse =
        await api.get(
          "/prescriptions/medications/adherence?days=30"
        );

      setAdherence(
        adherenceResponse.data?.data ||
          null
      );
    } catch (err) {
      console.error(
        "Medication status error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update medication status."
      );
    }
  }

  async function snoozeMedication(
    logId
  ) {
    try {
      setError("");
      setSuccess("");

      const response =
        await api.patch(
          `/prescriptions/medications/${logId}/status`,
          {
            status:
              "snoozed",

            snoozeMinutes:
              30,
          }
        );

      const updated =
        response.data?.data;

      if (updated) {
        setTodayMedicines(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                updated._id
                  ? updated
                  : item
            )
        );
      }

      setSuccess(
        "Medication reminder snoozed for 30 minutes."
      );
    } catch (err) {
      console.error(
        "Snooze medication error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to snooze the reminder."
      );
    }
  }

  /* =======================================================
     NOTES
     ======================================================= */

  async function savePatientNotes(
    prescription
  ) {
    try {
      const notes =
        window.prompt(
          "Add or update your personal note:",
          prescription.patientNotes ||
            ""
        );

      if (
        notes === null
      ) {
        return;
      }

      const response =
        await api.patch(
          `/prescriptions/${prescription._id}/notes`,
          {
            patientNotes:
              notes,
          }
        );

      const updated =
        response.data?.data;

      if (updated) {
        setPrescriptions(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                updated._id
                  ? {
                      ...item,
                      patientNotes:
                        updated.patientNotes,
                    }
                  : item
            )
        );
      }

      setSuccess(
        "Your prescription note was saved."
      );
    } catch (err) {
      console.error(
        "Save notes error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to save your note."
      );
    }
  }

  /* =======================================================
     STOP MEDICINE
     ======================================================= */

  async function stopMedicine(
    prescriptionId,
    medicineId,
    medicineName
  ) {
    const confirmed =
  window.confirm(
    `Stop reminders for ${medicineName}?\n\nThis will disable future MediTrack reminders for this medicine. It does not change your doctor's prescription. Please consult your healthcare professional before stopping a prescribed medicine.`
  );
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await api.patch(
          `/prescriptions/${prescriptionId}/medicines/${medicineId}/stop`,
          {
            reason:
              "Stopped from patient medication management.",
          }
        );

      const updated =
        response.data?.data;

      if (updated) {
        setPrescriptions(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                updated._id
                  ? updated
                  : item
            )
        );
      }

      setSuccess(
        `${medicineName} has been stopped and future reminders are disabled.`
      );
      setTodayMedicines((previous) =>
  previous.filter(
    (item) =>
      item.medicineName !== medicineName
  )
);

      await loadPrescriptionData();
    } catch (err) {
      console.error(
        "Stop medicine error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to stop the medicine."
      );
    }
  }
  /* =======================================================
   DELETE PRESCRIPTION
   ======================================================= */

async function deletePrescription(
  prescriptionId,
  prescriptionName
) {
  try {
    setDeleting(true);
    setError("");
    setSuccess("");

    await api.delete(
      `/prescriptions/${prescriptionId}`
    );

    setPrescriptions(
      (previous) =>
        previous.filter(
          (item) =>
            item._id !== prescriptionId
        )
    );

    setDeleteTarget(null);

    setSuccess(
      `${prescriptionName} was deleted successfully.`
    );

    await loadPrescriptionData();

  } catch (err) {
    console.error(
      "Delete prescription error:",
      err
    );

    setError(
      err.response?.data?.message ||
        "Unable to delete the prescription."
    );

  } finally {
    setDeleting(false);
  }
}

  /* =======================================================
     COMPUTED DATA
     ======================================================= */

  const activePrescriptions =
    useMemo(
      () =>
        prescriptions.filter(
          (prescription) =>
            (prescription.status === "active" ||
              prescription.status === undefined) &&
            (prescription.medicines || []).some(
              (medicine) =>
                medicine.status !== "stopped" &&
                medicine.status !== "completed"
            )
        ),
      [prescriptions]
    );

  const completedPrescriptions =
    useMemo(
      () =>
        prescriptions.filter(
          (prescription) =>
            prescription.status ===
            "completed"
        ),
      [prescriptions]
    );

  const pendingTodayMedicines =
    useMemo(
      () =>
        [...todayMedicines]
          .filter(
            (medicine) =>
              medicine.status !== "taken" &&
              medicine.status !== "skipped"
          )
          .sort((a, b) =>
            String(a.scheduledTime || "").localeCompare(
              String(b.scheduledTime || "")
            )
          ),
      [todayMedicines]
    );

  return (
    <div className="prescription-vault-page">

      {/* ===================================================
          HEADER
          =================================================== */}

      <section className="prescription-page-header">

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
            PRESCRIPTIONS & MEDICATIONS
          </div>

          <h1>
            Your medication center
          </h1>

          <p>
            Keep prescriptions organized,
            understand exactly when each medicine
            should be taken, and track your daily
            medication routine.
          </p>

        </div>

        <button
          type="button"
          className="primary-button prescription-add-button"
          onClick={
            openCreateModal
          }
        >
          <Plus size={17} />
          Add prescription
        </button>

      </section>


      {/* ===================================================
          ALERTS
          =================================================== */}

      {error && (
        <div
          className="profile-message error"
          role="alert"
        >
          <AlertCircle size={17} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>

        </div>
      )}

   {success && (
  <div
    className="profile-message success"
    role="status"
  >
    <CheckCircle2 size={17} />

    <span>{success}</span>
  </div>
)}


      {/* ===================================================
    NEXT MEDICATION
    =================================================== */}

<section className="medication-command-center">

  <div className="next-medication-card">

    <div className="next-medication-left">

      <div className="next-medication-icon">
        <Clock3 size={21} />
      </div>

      <div>

        <span className="section-eyebrow">
          NEXT MEDICATION
        </span>

        {pendingTodayMedicines.length > 0 ? (
          <>
            <h2>
              {pendingTodayMedicines[0].medicineName}
            </h2>

            <div className="next-medication-meta">
              <span>
                {pendingTodayMedicines[0].dosage}
              </span>

              <span>•</span>

              <span>
                {formatTime(
                  pendingTodayMedicines[0].scheduledTime
                )}
              </span>

              <span>•</span>

              <span>
                {getFoodLabel(
                  pendingTodayMedicines[0].foodInstruction
                )}
              </span>
            </div>
          </>
        ) : (
          <>
            <h2>
              You're all caught up
            </h2>

            <p>
              There are no medication doses scheduled
              for today.
            </p>
          </>
        )}

      </div>

    </div>

    <div className="next-medication-right">

      <div className="reminder-status">
        <span className="status-dot"></span>

        {pendingTodayMedicines.length > 0
          ? "Reminder active"
          : "No reminders pending"}
      </div>

    </div>

  </div>


  {/* =================================================
      TODAY'S PLAN + ADHERENCE
      ================================================= */}

  <div className="medication-overview-grid">

    <section className="today-plan-card">

      <div className="section-heading-row">

        <div>
          <span className="section-eyebrow">
            TODAY
          </span>

          <h2>
            Today's medication plan
          </h2>

          <p>
            Every scheduled dose for today.
          </p>
        </div>

        <div className="today-date-badge">
          <CalendarDays size={14} />
          {formatDate(new Date())}
        </div>

      </div>


      {loading ? (
        <div className="compact-loading">
          <LoaderCircle
            size={20}
            className="spin"
          />
          Loading today's plan...
        </div>
      ) : todayMedicines.length === 0 ? (
        <div className="compact-empty-state">

          <div className="compact-empty-icon">
            <Clock3 size={19} />
          </div>

          <strong>
            No doses scheduled today
          </strong>

          <p>
            Your medication timeline will appear
            here when an active prescription contains
            reminder times for today.
          </p>

        </div>
      ) : (
        <div className="today-medication-list">

          {todayMedicines.map(
            (medicine) => (
              <TodayMedicationCard
                key={medicine._id}
                medicine={medicine}
                onTaken={() =>
                  updateMedicationStatus(
                    medicine._id,
                    "taken"
                  )
                }
                onSkipped={() =>
                  updateMedicationStatus(
                    medicine._id,
                    "skipped"
                  )
                }
                onSnooze={() =>
                  snoozeMedication(
                    medicine._id
                  )
                }
              />
            )
          )}

        </div>
      )}

    </section>


    {/* =================================================
        ADHERENCE
        ================================================= */}

    <section className="adherence-card">

      <div className="section-eyebrow">
        MEDICATION ADHERENCE
      </div>

      <h2>
        How consistently you're following
        your schedule
      </h2>

      <div className="adherence-score">

        <strong>
          {adherence
            ? `${adherence.adherence}%`
            : "0%"}
        </strong>

        <span>
          last 30 days
        </span>

      </div>

      <div className="adherence-bar">

        <div
          style={{
            width: `${Math.min(
              adherence?.adherence || 0,
              100
            )}%`,
          }}
        />

      </div>

      <div className="adherence-stats">

        <div>
          <strong>
            {adherence?.taken || 0}
          </strong>
          <span>Taken</span>
        </div>

        <div>
          <strong>
            {adherence?.skipped || 0}
          </strong>
          <span>Skipped</span>
        </div>

        <div>
          <strong>
            {adherence?.missed || 0}
          </strong>
          <span>Missed</span>
        </div>

      </div>

      <div className="adherence-note">

        <Info size={14} />

        <span>
          Adherence is calculated from doses
          recorded in MediTrack.
        </span>

      </div>

    </section>

  </div>


  {/* =================================================
      ACTIVE TREATMENTS
      ================================================= */}

  <section className="prescriptions-section">

    <div className="prescription-section-header">

      <div>

        <span>
          ACTIVE TREATMENTS
        </span>

        <h2>
          Your current medicines
        </h2>

        <p>
          Review dosage, timing, food instructions
          and treatment periods.
        </p>

      </div>

    </div>


    {loading ? (
      <div className="prescription-loading">

        <LoaderCircle
          size={22}
          className="spin"
        />

        Loading your treatments...

      </div>
    ) : activePrescriptions.length === 0 ? (
      <div className="prescription-empty">

        <div className="prescription-empty-icon">
          <FileText size={23} />
        </div>

        <h3>
          No active treatments
        </h3>

        <p>
          Use the <strong>Add prescription</strong>
          button at the top of the page to add
          your current prescription.
        </p>

      </div>
    ) : (
      <div className="prescription-card-list">

        {activePrescriptions.map(
          (prescription) => (
            <PrescriptionCard
  key={prescription._id}
  prescription={prescription}
  onView={() =>
    setSelectedPrescription(
      prescription
    )
  }
  onNotes={() =>
    savePatientNotes(
      prescription
    )
  }
  onStopMedicine={
    stopMedicine
  }
  onDelete={() => {
  const confirmed = window.confirm(
    `Delete this prescription from your account?\n\nDoctor: ${
      prescription.doctorName ||
      "Not specified"
    }\nDate: ${formatDate(
      prescription.prescriptionDate
    )}`
  );

  if (confirmed) {
    deletePrescription(
      prescription._id,
      prescription.doctorName ||
        "This prescription"
    );
  }
}}
/>
          )
        )}

      </div>
    )}

  </section>


  {/* =================================================
      DOCTOR INSTRUCTIONS
      ================================================= */}

  {activePrescriptions.some(
    (prescription) =>
      prescription.doctorInstructions
  ) && (
    <section className="doctor-summary-panel">

      <div className="doctor-summary-header">

        <div className="doctor-summary-icon">
          <Info size={18} />
        </div>

        <div>

          <span className="section-eyebrow">
            DOCTOR'S INSTRUCTIONS
          </span>

          <h2>
            What did your doctor tell you?
          </h2>

        </div>

      </div>


      <div className="doctor-summary-content">

        {activePrescriptions
          .filter(
            (prescription) =>
              prescription.doctorInstructions
          )
          .map(
            (prescription) => (
              <div
                className="doctor-instruction-item"
                key={
                  prescription._id
                }
              >

                <div className="doctor-instruction-meta">
                  <strong>
                    {prescription.doctorName ||
                      "Healthcare professional"}
                  </strong>

                  <span>
                    {formatDate(
                      prescription.prescriptionDate
                    )}
                  </span>
                </div>

                <p>
                  {
                    prescription.doctorInstructions
                  }
                </p>

              </div>
            )
          )}

      </div>

    </section>
  )}


  {/* =================================================
      PRESCRIPTION HISTORY
      ================================================= */}

  {completedPrescriptions.length > 0 && (
    <section className="prescriptions-section">

      <div className="prescription-section-header">

        <div>

          <span>
            PRESCRIPTION HISTORY
          </span>

          <h2>
            Completed treatments
          </h2>

          <p>
            Your previous medication plans remain
            available for reference.
          </p>

        </div>

      </div>

      <div className="completed-prescription-list">

        {completedPrescriptions.map(
          (prescription) => (
            <button
              key={
                prescription._id
              }
              type="button"
              className="completed-prescription-item"
              onClick={() =>
                setSelectedPrescription(
                  prescription
                )
              }
            >

              <FileText size={16} />

              <span>

                <strong>
                  {formatDate(
                    prescription.prescriptionDate
                  )}
                </strong>

                <small>
                  {
                    prescription.medicines
                      ?.length || 0
                  } medicines
                </small>

              </span>

              <ChevronDown size={16} />

            </button>
          )
        )}

      </div>

    </section>
  )}


  {/* =================================================
      SAFETY
      ================================================= */}

  <section className="prescription-safety-note">

    <div className="prescription-safety-icon">
      <ShieldCheck size={17} />
    </div>

    <div>

      <strong>
        Your medication information
      </strong>

      <p>
        MediTrack organizes the schedule entered
        from your prescription. It does not change
        your prescribed dose or treatment plan.
        Contact your healthcare professional before
        changing or stopping a prescribed medicine.
      </p>

    </div>

  </section>
  </section>


      {/* ===================================================
          CREATE MODAL
          =================================================== */}

      {showCreateModal && (
        <CreatePrescriptionModal
          form={form}
          saving={saving}
          error={error}
          onClose={
            closeCreateModal
          }
          onChange={
            updatePrescriptionField
          }
          onMedicineChange={
            updateMedicineField
          }
          onAddMedicine={
            addMedicine
          }
          onRemoveMedicine={
            removeMedicine
          }
          onAddSchedule={
            addSchedule
          }
          onUpdateSchedule={
            updateSchedule
          }
          onRemoveSchedule={
            removeSchedule
          }
          onSubmit={
            handleCreatePrescription
          }
        />
      )}


      {/* ===================================================
          DETAILS MODAL
          =================================================== */}

      {selectedPrescription && (
        <PrescriptionDetailsModal
          prescription={
            selectedPrescription
          }
          onClose={() =>
            setSelectedPrescription(
              null
            )
          }
        />
      )}
      

    </div>
  );
}

/* =========================================================
   TODAY MEDICATION CARD
   ========================================================= */

function TodayMedicationCard({
  medicine,
  onTaken,
  onSkipped,
  onSnooze,
}) {
  const isTaken =
    medicine.status === "taken";

  const isSkipped =
    medicine.status === "skipped";

  const isSnoozed =
    medicine.status === "snoozed";

  return (
    <div
      className={`timeline-medication-card ${
        isTaken
          ? "timeline-medication-taken"
          : ""
      } ${
        isSkipped
          ? "timeline-medication-skipped"
          : ""
      }`}
    >

      {/* TIME */}

      <div className="timeline-time">

        <span>
          {medicine.scheduleLabel
            ?.charAt(0)
            .toUpperCase() +
            medicine.scheduleLabel?.slice(1)}
        </span>

        <strong>
          {formatTime(
            medicine.scheduledTime
          )}
        </strong>

      </div>


      {/* TIMELINE LINE */}

      <div className="timeline-marker">

        <div className="timeline-dot">
          {isTaken ? (
            <CheckCircle2
              size={14}
            />
          ) : (
            <Clock3
              size={14}
            />
          )}
        </div>

        <div className="timeline-line"></div>

      </div>


      {/* MEDICINE INFORMATION */}

      <div className="timeline-medication-content">

        <div className="timeline-medication-header">

          <div>

            <h3>
              {medicine.medicineName}
            </h3>

            <p>
              {medicine.dosage}
            </p>

          </div>

          <span
            className={`timeline-status ${getStatusClass(
              medicine.status
            )}`}
          >
            {getMedicationDisplayLabel(
              medicine
            )}
          </span>

        </div>


        <div className="timeline-medication-details">

          <span>
            🍽 {getFoodLabel(
              medicine.foodInstruction
            )}
          </span>

          <span>
            💊 Scheduled dose
          </span>

        </div>


        {/* ACTIONS */}

        <div className="timeline-actions">

          {!isTaken &&
            !isSkipped && (
              <>
                <button
                  type="button"
                  className="medication-taken-button"
                  onClick={onTaken}
                >
                  <CheckCircle2
                    size={14}
                  />
                  Mark as taken
                </button>

                <button
                  type="button"
                  className="medication-snooze-button"
                  onClick={onSnooze}
                >
                  <Clock3
                    size={14}
                  />
                  Snooze 30 min
                </button>

                <button
                  type="button"
                  className="medication-skip-button"
                  onClick={onSkipped}
                >
                  <SkipForward
                    size={14}
                  />
                  Skip
                </button>
              </>
            )}

          {isTaken && (
            <div className="timeline-complete">

              <CheckCircle2
                size={15}
              />

              Dose recorded successfully

            </div>
          )}

          {isSkipped && (
            <div className="timeline-skipped">

              <SkipForward
                size={14}
              />

              Dose marked as skipped

            </div>
          )}

          {isSnoozed && (
            <div className="timeline-snoozed">

              <Clock3
                size={14}
              />

              Reminder snoozed for 30 minutes

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   PRESCRIPTION CARD
   ========================================================= */

function PrescriptionCard({
  prescription,
  onView,
  onNotes,
  onStopMedicine,
  onDelete,
}) {
  const medicines =
    (prescription.medicines || []).filter(
      (medicine) =>
        medicine.status !== "stopped" &&
        medicine.status !== "completed"
    );

  return (
    <article className="prescription-card">

      <div className="prescription-card-header">

        <div className="prescription-doctor-icon">
          <FileText size={20} />
        </div>

        <div className="prescription-doctor-info">

          <span>
            PRESCRIPTION
          </span>

          <h3>
            {prescription.doctorName ||
              "Doctor not specified"}
          </h3>

          <p>

            {prescription.hospitalName ||
              "Healthcare provider not specified"}

            {" · "}

            {formatDate(
              prescription.prescriptionDate
            )}

          </p>

        </div>

        <span className="active-prescription-badge">
          Active
        </span>

      </div>


      <div className="prescription-context">

        {prescription.diagnosisContext && (
          <div>
            <span>
              Reason / context
            </span>

            <strong>
              {
                prescription.diagnosisContext
              }
            </strong>
          </div>
        )}

        {prescription.followUpDate && (
          <div>
            <span>
              Follow-up
            </span>

            <strong>
              {formatDate(
                prescription.followUpDate
              )}
            </strong>
          </div>
        )}

      </div>


      <div className="prescription-medicine-list">

        {medicines.map(
          (medicine) => (
            <PrescriptionMedicine
              key={
                medicine._id
              }
              medicine={
                medicine
              }
              prescriptionId={
                prescription._id
              }
              onStop={
                onStopMedicine
              }
            />
          )
        )}

      </div>


      {prescription.doctorInstructions && (
        <div className="doctor-instructions-box">

          <div>
            <Info size={15} />
            <span>
              WHAT DID MY DOCTOR TELL ME?
            </span>
          </div>

          <p>
            {
              prescription.doctorInstructions
            }
          </p>

        </div>
      )}


      {prescription.patientNotes && (
        <div className="patient-prescription-note">

          <span>
            MY NOTE
          </span>

          <p>
            {
              prescription.patientNotes
            }
          </p>

        </div>
      )}


      <div className="prescription-card-footer">

  <button
    type="button"
    className="prescription-secondary-action"
    onClick={onView}
  >
    <FileText size={15} />
    View details
  </button>

  <button
    type="button"
    className="prescription-secondary-action"
    onClick={onNotes}
  >
    <PencilIcon />
    My note
  </button>

  <button
  type="button"
  className="prescription-delete-icon-button"
  onClick={onDelete}
  title="Delete prescription"
  aria-label="Delete prescription"
>
  <Trash2 size={14} />
</button>

</div>

    </article>
  );
}

/* =========================================================
   PRESCRIPTION MEDICINE
   ========================================================= */

function PrescriptionMedicine({
  medicine,
  prescriptionId,
  onStop,
}) {
  const active =
    medicine.status !==
    "stopped";

  return (
    <div className="prescription-medicine">

      <div className="prescription-medicine-icon">
        <Activity size={18} />
      </div>

      <div className="prescription-medicine-main">

        <div className="prescription-medicine-title">

          <h4>
            {medicine.name}
          </h4>

          <span>
            {medicine.dosage}
            {medicine.dosageUnit
              ? ` ${medicine.dosageUnit}`
              : ""}
          </span>

        </div>


        <div className="medicine-detail-row">

          <span>
            {getFrequencyLabel(
              medicine.frequency
            )}
          </span>

          <span>
            {getFoodLabel(
              medicine.foodInstruction
            )}
          </span>

          <span>
            {formatDate(
              medicine.startDate
            )}
            {" → "}
            {medicine.endDate
              ? formatDate(
                  medicine.endDate
                )
              : "Ongoing"}
          </span>

        </div>


        {medicine.schedules
            ?.length >
          0 && (
          <div className="medicine-schedule-chips">

            {medicine.schedules
              .filter(
                (schedule) =>
                  schedule.enabled
              )
              .map(
                (schedule, index) => (
                  <span
                    key={index}
                  >
                    {getScheduleIcon(
                      schedule.label
                    )}

                    {schedule.label
                      .charAt(
                        0
                      )
                      .toUpperCase() +
                      schedule.label.slice(
                        1
                      )}

                    {" · "}

                    {formatTime(
                      schedule.time
                    )}
                  </span>
                )
              )}

          </div>
        )}


        {medicine.instructions && (
          <p className="medicine-instructions">
            {medicine.instructions}
          </p>
        )}

      </div>


      {active && (
        <button
          type="button"
          className="medicine-stop-button"
          onClick={() =>
            onStop(
              prescriptionId,
              medicine._id,
              medicine.name
            )
          }
        >
          <Trash2 size={14} />
          Stop
        </button>
      )}

      {!active && (
        <span className="medicine-stopped-badge">
          Stopped
        </span>
      )}

    </div>
  );
}

/* =========================================================
   CREATE PRESCRIPTION MODAL
   ========================================================= */

function CreatePrescriptionModal({
  form,
  saving,
  error,
  onClose,
  onChange,
  onMedicineChange,
  onAddMedicine,
  onRemoveMedicine,
  onAddSchedule,
  onUpdateSchedule,
  onRemoveSchedule,
  onSubmit,
}) {
  return (
    <div
      className="prescription-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className="prescription-create-modal"
        role="dialog"
        aria-modal="true"
      >

        <div className="prescription-modal-header">

          <div>

            <span>
              PRESCRIPTION
            </span>

            <h2>
              Add prescription
            </h2>

            <p>
              Enter the information exactly as
              written by your healthcare professional.
            </p>

          </div>

          <button
            type="button"
            className="prescription-modal-close"
            onClick={onClose}
            disabled={saving}
          >
            <X size={18} />
          </button>

        </div>


        <form
          className="prescription-create-form"
          onSubmit={onSubmit}
        >

          {/* ==========================================
              PRESCRIPTION INFORMATION
              ========================================== */}

          <section className="prescription-form-section">

            <div className="prescription-form-section-heading">

              <div className="form-section-icon">
                <FileText size={17} />
              </div>

              <div>
                <span>
                  PRESCRIPTION DETAILS
                </span>

                <h3>
                  Where did this prescription come from?
                </h3>
              </div>

            </div>


            <div className="prescription-form-grid">

              <PrescriptionField
                label="Doctor"
                optional
              >
                <input
                  type="text"
                  placeholder="Dr. Priya Sharma"
                  value={
                    form.doctorName
                  }
                  onChange={(event) =>
                    onChange(
                      "doctorName",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </PrescriptionField>


              <PrescriptionField
                label="Hospital / clinic"
                optional
              >
                <input
                  type="text"
                  placeholder="ABC Hospital"
                  value={
                    form.hospitalName
                  }
                  onChange={(event) =>
                    onChange(
                      "hospitalName",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </PrescriptionField>


              <PrescriptionField
                label="Prescription date"
                required
              >
                <input
                  type="date"
                  value={
                    form.prescriptionDate
                  }
                  max={
                    getTodayDate()
                  }
                  onChange={(event) =>
                    onChange(
                      "prescriptionDate",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </PrescriptionField>


              <PrescriptionField
                label="Follow-up date"
                optional
              >
                <input
                  type="date"
                  value={
                    form.followUpDate
                  }
                  onChange={(event) =>
                    onChange(
                      "followUpDate",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </PrescriptionField>


              <PrescriptionField
                label="Reason / diagnosis context"
                optional
                className="full"
              >
                <input
                  type="text"
                  placeholder="Example: Follow-up for blood pressure"
                  value={
                    form.diagnosisContext
                  }
                  onChange={(event) =>
                    onChange(
                      "diagnosisContext",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </PrescriptionField>

            </div>

          </section>


          {/* ==========================================
              MEDICINES
              ========================================== */}

          <section className="prescription-form-section">

            <div className="prescription-form-section-heading medicine-section-heading">

              <div>

                <div className="form-section-icon">
                  <Activity size={17} />
                </div>

              </div>

              <div>

                <span>
                  MEDICINES
                </span>

                <h3>
                  Build the medication schedule
                </h3>

                <p>
                  Add each medicine separately because
                  every medicine can have a different
                  time and food instruction.
                </p>

              </div>

            </div>


            <div className="medicine-editor-list">

              {form.medicines.map(
                (
                  medicine,
                  medicineIndex
                ) => (
                  <MedicineEditor
                    key={
                      medicineIndex
                    }
                    medicine={
                      medicine
                    }
                    index={
                      medicineIndex
                    }
                    saving={
                      saving
                    }
                    onChange={
                      onMedicineChange
                    }
                    onRemove={
                      onRemoveMedicine
                    }
                    onAddSchedule={
                      onAddSchedule
                    }
                    onUpdateSchedule={
                      onUpdateSchedule
                    }
                    onRemoveSchedule={
                      onRemoveSchedule
                    }
                  />
                )
              )}

            </div>


            <button
              type="button"
              className="add-medicine-button"
              onClick={
                onAddMedicine
              }
              disabled={saving}
            >
              <Plus size={15} />
              Add another medicine
            </button>

          </section>


          {/* ==========================================
              INSTRUCTIONS
              ========================================== */}

          <section className="prescription-form-section">

            <div className="prescription-form-section-heading">

              <div className="form-section-icon">
                <Info size={17} />
              </div>

              <div>

                <span>
                  INSTRUCTIONS
                </span>

                <h3>
                  Doctor instructions & your notes
                </h3>

              </div>

            </div>


            <div className="prescription-form-grid">

              <PrescriptionField
                label="Doctor instructions"
                optional
                className="full"
              >
                <textarea
                  rows="4"
                  placeholder="Example: Continue current medication and return for review in 2 weeks."
                  value={
                    form.doctorInstructions
                  }
                  onChange={(event) =>
                    onChange(
                      "doctorInstructions",
                      event.target.value
                    )
                  }
                  disabled={
                    saving
                  }
                />
              </PrescriptionField>


              <PrescriptionField
                label="My personal note"
                optional
                className="full"
              >
                <textarea
                  rows="3"
                  placeholder="Example: Doctor asked me to take this after dinner."
                  value={
                    form.patientNotes
                  }
                  onChange={(event) =>
                    onChange(
                      "patientNotes",
                      event.target.value
                    )
                  }
                  disabled={
                    saving
                  }
                />
              </PrescriptionField>

            </div>

          </section>


          {/* ==========================================
              ERROR
              ========================================== */}

          {error && (
            <div className="prescription-form-error">

              <AlertCircle size={15} />

              <span>
                {error}
              </span>

            </div>
          )}


          {/* ==========================================
              FOOTER
              ========================================== */}

          <div className="prescription-modal-footer">

            <div className="prescription-footer-note">

              <ShieldCheck size={15} />

              <span>
                MediTrack uses the schedule you enter.
                It does not modify your prescribed treatment.
              </span>

            </div>

            <div className="prescription-footer-actions">

              <button
                type="button"
                className="secondary-action-button"
                onClick={
                  onClose
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  saving
                }
              >
                {saving ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save prescription
                  </>
                )}
              </button>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}

/* =========================================================
   MEDICINE EDITOR
   ========================================================= */

function MedicineEditor({
  medicine,
  index,
  saving,
  onChange,
  onRemove,
  onAddSchedule,
  onUpdateSchedule,
  onRemoveSchedule,
}) {
  const isAsNeeded =
    medicine.frequency ===
    "as_needed";

  return (
    <div className="medicine-editor">

      <div className="medicine-editor-header">

        <div>

          <span>
            MEDICINE {index + 1}
          </span>

          <h4>
            Medication details
          </h4>

        </div>

        <button
          type="button"
          className="medicine-remove-button"
          onClick={() =>
            onRemove(index)
          }
          disabled={
            saving
          }
        >
          <Trash2 size={14} />
          Remove
        </button>

      </div>


      <div className="prescription-form-grid">

        <PrescriptionField
          label="Medicine name"
          required
        >
          <input
            type="text"
            placeholder="Example: Metformin"
            value={
              medicine.name
            }
            onChange={(event) =>
              onChange(
                index,
                "name",
                event.target.value
              )
            }
            disabled={saving}
          />
        </PrescriptionField>


        <PrescriptionField
          label="Dosage"
          required
        >
          <div className="dosage-input-row">

            <input
              type="text"
              placeholder="500"
              value={
                medicine.dosage
              }
              onChange={(event) =>
                onChange(
                  index,
                  "dosage",
                  event.target.value
                )
              }
              disabled={saving}
            />

            <input
              type="text"
              placeholder="mg"
              value={
                medicine.dosageUnit
              }
              onChange={(event) =>
                onChange(
                  index,
                  "dosageUnit",
                  event.target.value
                )
              }
              disabled={saving}
            />

          </div>
        </PrescriptionField>


        <PrescriptionField
          label="Frequency"
          required
        >
          <select
            value={
              medicine.frequency
            }
            onChange={(event) =>
              onChange(
                index,
                "frequency",
                event.target.value
              )
            }
            disabled={saving}
          >
            {FREQUENCIES.map(
              (item) => (
                <option
                  key={
                    item.value
                  }
                  value={
                    item.value
                  }
                >
                  {item.label}
                </option>
              )
            )}
          </select>
        </PrescriptionField>


        <PrescriptionField
          label="How to take"
          required
        >
          <select
            value={
              medicine.route
            }
            onChange={(event) =>
              onChange(
                index,
                "route",
                event.target.value
              )
            }
            disabled={saving}
          >
            {ROUTES.map(
              (item) => (
                <option
                  key={
                    item.value
                  }
                  value={
                    item.value
                  }
                >
                  {item.label}
                </option>
              )
            )}
          </select>
        </PrescriptionField>


        <PrescriptionField
          label="Food instruction"
          required
        >
          <select
            value={
              medicine.foodInstruction
            }
            onChange={(event) =>
              onChange(
                index,
                "foodInstruction",
                event.target.value
              )
            }
            disabled={saving}
          >
            {FOOD_OPTIONS.map(
              (item) => (
                <option
                  key={
                    item.value
                  }
                  value={
                    item.value
                  }
                >
                  {item.label}
                </option>
              )
            )}
          </select>
        </PrescriptionField>


        <PrescriptionField
          label="Quantity per dose"
          required
        >
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={
              medicine.quantityPerDose
            }
            onChange={(event) =>
              onChange(
                index,
                "quantityPerDose",
                event.target.value
              )
            }
            disabled={saving}
          />
        </PrescriptionField>


        <PrescriptionField
          label="Start date"
          required
        >
          <input
            type="date"
            value={
              medicine.startDate
            }
            onChange={(event) =>
              onChange(
                index,
                "startDate",
                event.target.value
              )
            }
            disabled={saving}
          />
        </PrescriptionField>


        <PrescriptionField
          label="End date"
          optional
        >
          <input
            type="date"
            min={
              medicine.startDate
            }
            value={
              medicine.endDate
            }
            onChange={(event) =>
              onChange(
                index,
                "endDate",
                event.target.value
              )
            }
            disabled={saving}
          />
        </PrescriptionField>


        <PrescriptionField
          label="Total quantity"
          optional
        >
          <input
            type="number"
            min="0"
            step="1"
            placeholder="30"
            value={
              medicine.totalQuantity
            }
            onChange={(event) =>
              onChange(
                index,
                "totalQuantity",
                event.target.value
              )
            }
            disabled={saving}
          />
        </PrescriptionField>


        <PrescriptionField
          label="Medicine instructions"
          optional
          className="full"
        >
          <textarea
            rows="2"
            placeholder="Example: Take with a full glass of water."
            value={
              medicine.instructions
            }
            onChange={(event) =>
              onChange(
                index,
                "instructions",
                event.target.value
              )
            }
            disabled={saving}
          />
        </PrescriptionField>

      </div>


      {/* SCHEDULE */}

      <div className="medicine-schedule-editor">

        <div className="medicine-schedule-header">

          <div>

            <span>
              REMINDER SCHEDULE
            </span>

            <h5>
              When should MediTrack remind you?
            </h5>

          </div>

          {!isAsNeeded && (
            <button
              type="button"
              className="add-schedule-button"
              onClick={() =>
                onAddSchedule(
                  index
                )
              }
              disabled={
                saving
              }
            >
              <Plus size={14} />
              Add time
            </button>
          )}

        </div>


        {isAsNeeded ? (
          <div className="as-needed-message">

            <Clock3 size={16} />

            <span>
              This medicine is marked
              <strong>
                {" "}
                as needed
              </strong>
              . MediTrack will not create
              fixed daily reminders.
            </span>

          </div>
        ) : (
          <div className="schedule-editor-list">

            {medicine.schedules.map(
              (
                schedule,
                scheduleIndex
              ) => (
                <div
                  className="schedule-editor-row"
                  key={
                    scheduleIndex
                  }
                >

                  <div className="schedule-label-wrapper">

                    {getScheduleIcon(
                      schedule.label
                    )}

                    <select
                      value={
                        schedule.label
                      }
                      onChange={(
                        event
                      ) =>
                        onUpdateSchedule(
                          index,
                          scheduleIndex,
                          "label",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                    >

                      <option value="morning">
                        Morning
                      </option>

                      <option value="afternoon">
                        Afternoon
                      </option>

                      <option value="evening">
                        Evening
                      </option>

                      <option value="night">
                        Night
                      </option>

                      <option value="custom">
                        Custom
                      </option>

                    </select>

                  </div>


                  <div className="schedule-time-wrapper">

                    <Clock3 size={14} />

                    <input
                      type="time"
                      value={
                        schedule.time
                      }
                      onChange={(
                        event
                      ) =>
                        onUpdateSchedule(
                          index,
                          scheduleIndex,
                          "time",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                    />

                  </div>


                  <label className="schedule-enable">

                    <input
                      type="checkbox"
                      checked={
                        schedule.enabled
                      }
                      onChange={(
                        event
                      ) =>
                        onUpdateSchedule(
                          index,
                          scheduleIndex,
                          "enabled",
                          event.target
                            .checked
                        )
                      }
                      disabled={
                        saving
                      }
                    />

                    Active

                  </label>


                  {medicine.schedules
                    .length >
                    1 && (
                    <button
                      type="button"
                      className="remove-schedule-button"
                      onClick={() =>
                        onRemoveSchedule(
                          index,
                          scheduleIndex
                        )
                      }
                      disabled={
                        saving
                      }
                    >
                      <X
                        size={14}
                      />
                    </button>
                  )}

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   DETAILS MODAL
   ========================================================= */

function PrescriptionDetailsModal({
  prescription,
  onClose,
}) {
  return (
    <div
      className="prescription-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className="prescription-details-modal"
        role="dialog"
        aria-modal="true"
      >

        <div className="prescription-modal-header">

          <div>

            <span>
              PRESCRIPTION DETAILS
            </span>

            <h2>
              Medication plan
            </h2>

            <p>
              {prescription.doctorName ||
                "Doctor not specified"}
              {" · "}
              {formatDate(
                prescription.prescriptionDate
              )}
            </p>

          </div>

          <button
            type="button"
            className="prescription-modal-close"
            onClick={
              onClose
            }
          >
            <X size={18} />
          </button>

        </div>


        <div className="prescription-details-body">

          <div className="details-summary-row">

            <div>
              <span>
                HOSPITAL / CLINIC
              </span>

              <strong>
                {prescription.hospitalName ||
                  "Not specified"}
              </strong>
            </div>

            <div>
              <span>
                FOLLOW-UP
              </span>

              <strong>
                {prescription.followUpDate
                  ? formatDate(
                      prescription.followUpDate
                    )
                  : "Not specified"}
              </strong>
            </div>

          </div>


          <div className="details-medicine-list">

            {prescription.medicines?.map(
              (medicine) => (
                <div
                  key={
                    medicine._id
                  }
                  className="details-medicine"
                >

                  <div className="details-medicine-heading">

                    <div className="prescription-medicine-icon">
                      <Activity
                        size={18}
                      />
                    </div>

                    <div>
                      <h3>
                        {medicine.name}
                      </h3>

                      <p>
                        {medicine.dosage}
                        {medicine.dosageUnit
                          ? ` ${medicine.dosageUnit}`
                          : ""}
                      </p>
                    </div>

                  </div>


                  <div className="details-medicine-grid">

                    <div>
                      <span>
                        Frequency
                      </span>

                      <strong>
                        {getFrequencyLabel(
                          medicine.frequency
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Food
                      </span>

                      <strong>
                        {getFoodLabel(
                          medicine.foodInstruction
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Start
                      </span>

                      <strong>
                        {formatDate(
                          medicine.startDate
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        End
                      </span>

                      <strong>
                        {medicine.endDate
                          ? formatDate(
                              medicine.endDate
                            )
                          : "Ongoing"}
                      </strong>
                    </div>

                  </div>


                  {medicine.schedules
                    ?.length >
                    0 && (
                    <div className="details-schedule-list">

                      {medicine.schedules
                        .filter(
                          (
                            schedule
                          ) =>
                            schedule.enabled
                        )
                        .map(
                          (
                            schedule,
                            index
                          ) => (
                            <span
                              key={
                                index
                              }
                            >
                              {getScheduleIcon(
                                schedule.label
                              )}

                              {schedule.label
                                .charAt(
                                  0
                                )
                                .toUpperCase() +
                                schedule.label.slice(
                                  1
                                )}

                              {" · "}

                              {formatTime(
                                schedule.time
                              )}
                            </span>
                          )
                        )}

                    </div>
                  )}

                  {medicine.instructions && (
                    <div className="details-instructions">

                      <Info size={14} />

                      <span>
                        {
                          medicine.instructions
                        }
                      </span>

                    </div>
                  )}

                </div>
              )
            )}

          </div>


          {prescription.doctorInstructions && (
            <div className="details-doctor-instructions">

              <span>
                WHAT DID MY DOCTOR TELL ME?
              </span>

              <p>
                {
                  prescription.doctorInstructions
                }
              </p>

            </div>
          )}


          {prescription.patientNotes && (
            <div className="details-patient-notes">

              <span>
                MY NOTE
              </span>

              <p>
                {
                  prescription.patientNotes
                }
              </p>

            </div>
          )}

        </div>


        <div className="prescription-details-footer">

          <button
            type="button"
            className="primary-button"
            onClick={
              onClose
            }
          >
            Done
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   FORM FIELD
   ========================================================= */

function PrescriptionField({
  label,
  children,
  required = false,
  optional = false,
  className = "",
}) {
  return (
    <label
      className={`prescription-field ${className}`}
    >

      <span>

        {label}

        {required && (
          <b className="required-star">
            *
          </b>
        )}

        {optional && (
          <small>
            optional
          </small>
        )}

      </span>

      {children}

    </label>
  );
}

/* =========================================================
   ICON HELPERS
   ========================================================= */

function getScheduleIcon(
  label
) {
  if (
    label === "morning"
  ) {
    return (
      <Sun
        size={14}
      />
    );
  }

  if (
    label === "afternoon"
  ) {
    return (
      <Sun
        size={14}
      />
    );
  }

  if (
    label === "evening"
  ) {
    return (
      <Moon
        size={14}
      />
    );
  }

  if (
    label === "night"
  ) {
    return (
      <Moon
        size={14}
      />
    );
  }

  return (
    <Clock3
      size={14}
    />
  );
}

function PencilIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

export default PrescriptionVault;