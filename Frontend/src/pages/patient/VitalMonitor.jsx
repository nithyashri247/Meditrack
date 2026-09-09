import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Droplets,
  HeartPulse,
  History,
  Info,
  LoaderCircle,
  Plus,
  RefreshCw,
  Thermometer,
  Trash2,
  Weight,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

/* =========================================================
   VITAL CONFIGURATION
   ========================================================= */

const VITAL_TYPES = {
  blood_pressure: {
    label: "Blood pressure",
    shortLabel: "Blood pressure",
    unit: "mmHg",
    icon: Activity,
    colorClass: "vital-bp",
  },

  heart_rate: {
    label: "Heart rate",
    shortLabel: "Heart rate",
    unit: "BPM",
    icon: HeartPulse,
    colorClass: "vital-heart",
  },

  blood_glucose: {
    label: "Blood glucose",
    shortLabel: "Blood glucose",
    unit: "mg/dL",
    icon: Droplets,
    colorClass: "vital-glucose",
  },

  spo2: {
    label: "Oxygen saturation",
    shortLabel: "Oxygen saturation",
    unit: "%",
    icon: Activity,
    colorClass: "vital-spo2",
  },

  temperature: {
    label: "Temperature",
    shortLabel: "Temperature",
    unit: "°C",
    icon: Thermometer,
    colorClass: "vital-temperature",
  },

  respiratory_rate: {
    label: "Respiratory rate",
    shortLabel: "Respiratory rate",
    unit: "breaths/min",
    icon: Activity,
    colorClass: "vital-respiratory",
  },

  weight: {
    label: "Weight",
    shortLabel: "Weight",
    unit: "kg",
    icon: Weight,
    colorClass: "vital-weight",
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDisplayValue(reading) {
  if (!reading) {
    return "—";
  }

  if (reading.type === "blood_pressure") {
    if (
      reading.systolic === undefined ||
      reading.diastolic === undefined
    ) {
      return "—";
    }

    return `${reading.systolic}/${reading.diastolic}`;
  }

  if (reading.value === undefined || reading.value === null) {
    return "—";
  }

  return reading.value;
}

function getStatusLabel(status) {
  const labels = {
    not_assessed: "Not assessed",
    within_expected_range:
      "Within expected range",
    needs_attention: "Needs attention",
    priority_review: "Priority review",
    urgent: "Urgent",
  };

  return labels[status] || "Not assessed";
}

function getStatusClass(status) {
  const classes = {
    not_assessed: "status-neutral",
    within_expected_range: "status-good",
    needs_attention: "status-attention",
    priority_review: "status-priority",
    urgent: "status-urgent",
  };

  return classes[status] || "status-neutral";
}

/* =========================================================
   COMPONENT
   ========================================================= */

function VitalMonitor() {
  const navigate = useNavigate();

  const [readings, setReadings] = useState([]);
  const [latestVitals, setLatestVitals] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [selectedType, setSelectedType] =
    useState("blood_pressure");

  const [historyFilter, setHistoryFilter] =
    useState("all");

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [form, setForm] = useState({
    systolic: "",
    diastolic: "",
    value: "",
    recordedAt: getCurrentDateTime(),
    note: "",
  });

  /*
   * Load all vital information.
   */

  useEffect(() => {
    loadVitals();
  }, []);

  async function loadVitals() {
    try {
      setError("");

      const [
        historyResponse,
        latestResponse,
      ] = await Promise.all([
        api.get("/vitals?limit=250"),
        api.get("/vitals/latest"),
      ]);

      setReadings(
        historyResponse.data?.data || []
      );

      setLatestVitals(
        latestResponse.data?.data || []
      );
    } catch (err) {
      console.error(
        "Load vitals error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load your health readings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function refreshVitals() {
    setRefreshing(true);
    setSuccessMessage("");

    loadVitals();
  }

  function getLatestReading(type) {
    return (
      latestVitals.find(
        (reading) =>
          reading.type === type
      ) || null
    );
  }

  function openAddModal(type) {
    setSelectedType(type);

    setForm({
      systolic: "",
      diastolic: "",
      value: "",
      recordedAt: getCurrentDateTime(),
      note: "",
    });

    setError("");
    setSuccessMessage("");
    setShowAddModal(true);
  }

  function closeAddModal() {
    if (saving) {
      return;
    }

    setShowAddModal(false);
  }

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const typeConfig =
      VITAL_TYPES[selectedType];

    if (!typeConfig) {
      setError(
        "Please select a valid health measurement."
      );
      return;
    }

    if (
      selectedType ===
      "blood_pressure"
    ) {
      if (
        form.systolic === "" ||
        form.diastolic === ""
      ) {
        setError(
          "Please enter both systolic and diastolic values."
        );

        return;
      }
    } else if (form.value === "") {
      setError(
        `Please enter your ${typeConfig.label.toLowerCase()} value.`
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        type: selectedType,
        unit: typeConfig.unit,
        note: form.note.trim(),
        recordedAt: new Date(
          form.recordedAt
        ).toISOString(),
        source: "manual",
      };

      if (
        selectedType ===
        "blood_pressure"
      ) {
        payload.systolic = Number(
          form.systolic
        );

        payload.diastolic = Number(
          form.diastolic
        );
      } else {
        payload.value = Number(
          form.value
        );
      }

      const response =
        await api.post(
          "/vitals",
          payload
        );

      const saved =
        response.data?.data;

      if (saved) {
        setReadings((previous) => [
          saved,
          ...previous,
        ]);

        setLatestVitals((previous) => {
          const filtered =
            previous.filter(
              (item) =>
                item.type !==
                saved.type
            );

          return [
            saved,
            ...filtered,
          ];
        });
      }

      setSuccessMessage(
        "Health reading saved successfully."
      );

      setShowAddModal(false);
    } catch (err) {
      console.error(
        "Save vital error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to save your health reading."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(readingId) {
    const confirmed =
      window.confirm(
        "Delete this health reading?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(readingId);
      setError("");

      await api.delete(
        `/vitals/${readingId}`
      );

      setReadings((previous) =>
        previous.filter(
          (reading) =>
            reading._id !==
            readingId
        )
      );

      await loadVitals();
    } catch (err) {
      console.error(
        "Delete vital error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to delete the health reading."
      );
    } finally {
      setDeletingId("");
    }
  }

  const filteredHistory =
    useMemo(() => {
      if (historyFilter === "all") {
        return readings;
      }

      return readings.filter(
        (reading) =>
          reading.type === historyFilter
      );
    }, [
      readings,
      historyFilter,
    ]);

  const chartData = useMemo(() => {
    const type =
      selectedType ||
      "heart_rate";

    return readings
      .filter(
        (reading) =>
          reading.type === type
      )
      .slice(0, 20)
      .reverse()
      .map((reading) => ({
        date: new Date(
          reading.recordedAt
        ).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
          }
        ),

        value:
          type ===
          "blood_pressure"
            ? Number(
                reading.systolic
              )
            : Number(
                reading.value
              ),

        fullDate:
          formatDateTime(
            reading.recordedAt
          ),
      }));
  }, [
    readings,
    selectedType,
  ]);

  return (
    <div className="vital-monitor-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="vital-page-header">

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
            HEALTH MONITOR
          </div>

          <h1>
            Track your health signals
          </h1>

          <p>
            Record your personal health readings,
            understand recent patterns, and keep
            your information ready for authorized care.
          </p>

        </div>

        <div className="vital-header-actions">

          <button
            type="button"
            className="secondary-action-button"
            onClick={refreshVitals}
            disabled={refreshing}
          >
            {refreshing ? (
              <LoaderCircle
                size={16}
                className="spin"
              />
            ) : (
              <RefreshCw size={16} />
            )}

            Refresh
          </button>

          <button
            type="button"
            className="primary-button vital-add-button"
            onClick={() =>
              openAddModal("blood_pressure")
            }
          >
            <Plus size={17} />
            Add reading
          </button>

        </div>

      </section>


      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {error && (
        <div
          className="profile-message error"
          role="alert"
        >
          <Info size={17} />
          <span>{error}</span>

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

      {successMessage && (
        <div
          className="profile-message success"
          role="status"
        >
          <CheckCircle2 size={17} />
          <span>
            {successMessage}
          </span>
        </div>
      )}


      {/* =====================================================
          INFO BANNER
          ===================================================== */}

      <section className="vital-info-banner">

        <div className="vital-info-icon">
          <Info size={18} />
        </div>

        <div>

          <strong>
            Keep your readings consistent
          </strong>

          <p>
            Record measurements with the date and
            time they were actually taken. MediTrack
            uses them to show personal trends and
            informational signals.
          </p>

        </div>

      </section>


      {/* =====================================================
          CURRENT READINGS
          ===================================================== */}

      <section className="vital-current-section">

        <div className="vital-section-header">

          <div>

            <span>
              CURRENT READINGS
            </span>

            <h2>
              Your latest health signals
            </h2>

          </div>

          <div className="vital-section-caption">
            Updated from your saved readings
          </div>

        </div>


        {loading ? (
          <div className="vital-loading-card">

            <LoaderCircle
              size={25}
              className="spin"
            />

            <span>
              Loading your health data...
            </span>

          </div>
        ) : (
          <div className="vital-summary-grid">

            {Object.entries(
              VITAL_TYPES
            ).map(
              ([
                type,
                config,
              ]) => {
                const Icon =
                  config.icon;

                const latest =
                  getLatestReading(
                    type
                  );

                return (
                  <VitalSummaryCard
                    key={type}
                    type={type}
                    config={config}
                    icon={Icon}
                    reading={latest}
                    onAdd={() =>
                      openAddModal(
                        type
                      )
                    }
                  />
                );
              }
            )}

          </div>
        )}

      </section>


      {/* =====================================================
          CHART + INSIGHT
          ===================================================== */}

      <section className="vital-analysis-grid">

        <div className="vital-panel chart-panel">

          <div className="vital-panel-header">

            <div>

              <span>
                TREND EXPLORER
              </span>

              <h2>
                Visualize your readings
              </h2>

            </div>

            <div className="chart-selector">

              <select
                value={selectedType}
                onChange={(event) =>
                  setSelectedType(
                    event.target.value
                  )
                }
              >
                {Object.entries(
                  VITAL_TYPES
                ).map(
                  ([
                    type,
                    config,
                  ]) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {config.label}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={14}
              />

            </div>

          </div>


          {chartData.length === 0 ? (
            <div className="chart-empty-state">

              <div className="chart-empty-icon">
                <Activity size={21} />
              </div>

              <strong>
                No readings yet
              </strong>

              <p>
                Add your first{" "}
                {
                  VITAL_TYPES[
                    selectedType
                  ]?.label
                }{" "}
                reading to begin building
                your personal trend.
              </p>

              <button
                type="button"
                onClick={() =>
                  openAddModal(
                    selectedType
                  )
                }
              >
                <Plus size={15} />
                Add first reading
              </button>

            </div>
          ) : (
            <div className="vital-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 12,
                    right: 8,
                    left: -18,
                    bottom: 2,
                  }}
                >

                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    opacity={0.35}
                  />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    fontSize={9}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={9}
                  />

                  <Tooltip
                    content={
                      <CustomTooltip />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#087f73"
                    fill="#dff3ef"
                    strokeWidth={2.2}
                  />

                </AreaChart>
              </ResponsiveContainer>

            </div>
          )}

        </div>


        {/* INFO / INSIGHT PANEL */}

        <div className="vital-panel signal-panel">

          <div className="vital-panel-header">

            <div>

              <span>
                READING GUIDANCE
              </span>

              <h2>
                Understand the signal
              </h2>

            </div>

            <div className="signal-header-icon">
              <Activity size={18} />
            </div>

          </div>


          <div className="signal-content">

            <div className="signal-state neutral">

              <span className="signal-state-dot" />

              Informational

            </div>

            <h3>
              Your readings belong together
            </h3>

            <p>
              A single measurement provides limited
              context. MediTrack can compare repeated
              readings over time to highlight patterns
              worth reviewing.
            </p>

            <div className="signal-points">

              <div>
                <CheckCircle2 size={15} />
                <span>
                  Consistent measurements
                </span>
              </div>

              <div>
                <CheckCircle2 size={15} />
                <span>
                  Personal trend history
                </span>
              </div>

              <div>
                <CheckCircle2 size={15} />
                <span>
                  Informational health signals
                </span>
              </div>

            </div>

            <div className="signal-note">
              MediTrack signals are informational
              and are not a medical diagnosis.
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          HISTORY
          ===================================================== */}

      <section className="vital-panel history-panel">

        <div className="history-header">

          <div>

            <span>
              READING HISTORY
            </span>

            <h2>
              Your saved measurements
            </h2>

          </div>

          <div className="history-controls">

            <History size={16} />

            <select
              value={historyFilter}
              onChange={(event) =>
                setHistoryFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All readings
              </option>

              {Object.entries(
                VITAL_TYPES
              ).map(
                ([
                  type,
                  config,
                ]) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {config.label}
                  </option>
                )
              )}

            </select>

          </div>

        </div>


        {filteredHistory.length === 0 ? (
          <div className="history-empty">

            <div className="history-empty-icon">
              <History size={21} />
            </div>

            <strong>
              No readings found
            </strong>

            <p>
              Your saved health measurements
              will appear here.
            </p>

          </div>
        ) : (
          <div className="history-table-wrapper">

            <table className="vital-history-table">

              <thead>
                <tr>
                  <th>
                    Measurement
                  </th>

                  <th>
                    Value
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Date & time
                  </th>

                  <th>
                    Note
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.map(
                  (reading) => {
                    const config =
                      VITAL_TYPES[
                        reading.type
                      ];

                    const Icon =
                      config?.icon ||
                      Activity;

                    return (
                      <tr
                        key={
                          reading._id
                        }
                      >

                        <td>

                          <div className="history-vital-name">

                            <div className="history-vital-icon">

                              <Icon size={15} />

                            </div>

                            <strong>
                              {
                                config?.label ||
                                reading.type
                              }
                            </strong>

                          </div>

                        </td>

                        <td>

                          <strong className="history-value">

                            {
                              getDisplayValue(
                                reading
                              )
                            }

                            <span>
                              {" "}
                              {reading.unit}
                            </span>

                          </strong>

                        </td>

                        <td>

                          <span
                            className={`health-status-pill ${getStatusClass(
                              reading.status
                            )}`}
                          >
                            {
                              getStatusLabel(
                                reading.status
                              )
                            }
                          </span>

                        </td>

                        <td>
                          <div className="history-date">

                            <CalendarDays
                              size={13}
                            />

                            {formatDateTime(
                              reading.recordedAt
                            )}

                          </div>
                        </td>

                        <td>

                          <span className="history-note">

                            {reading.note ||
                              "—"}

                          </span>

                        </td>

                        <td>

                          <button
                            type="button"
                            className="history-delete-button"
                            disabled={
                              deletingId ===
                              reading._id
                            }
                            onClick={() =>
                              handleDelete(
                                reading._id
                              )
                            }
                            aria-label="Delete reading"
                          >

                            {deletingId ===
                            reading._id ? (
                              <LoaderCircle
                                size={15}
                                className="spin"
                              />
                            ) : (
                              <Trash2
                                size={15}
                              />
                            )}

                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}
              </tbody>

            </table>

          </div>
        )}

      </section>


      {/* =====================================================
          SAFETY FOOTER
          ===================================================== */}

      <section className="vital-safety-footer">

        <div className="vital-safety-icon">
          <Info size={17} />
        </div>

        <div>

          <strong>
            About MediTrack health signals
          </strong>

          <p>
            MediTrack helps organize and understand
            personal health information. It does not
            replace a clinician's examination,
            diagnosis, or treatment plan.
          </p>

        </div>

      </section>


      {/* =====================================================
          ADD READING MODAL
          ===================================================== */}

      {showAddModal && (
        <AddReadingModal
          type={selectedType}
          form={form}
          saving={saving}
          onClose={closeAddModal}
          onChange={updateForm}
          onTypeChange={setSelectedType}
          onSubmit={handleSubmit}
          error={error}
        />
      )}

    </div>
  );
}

/* =========================================================
   VITAL SUMMARY CARD
   ========================================================= */

function VitalSummaryCard({
  type,
  config,
  icon: Icon,
  reading,
  onAdd,
}) {
  return (
    <div className="vital-summary-card">

      <div className="vital-summary-top">

        <div
          className={`vital-summary-icon ${config.colorClass}`}
        >
          <Icon size={18} />
        </div>

        <button
          type="button"
          className="vital-mini-add"
          onClick={onAdd}
          aria-label={`Add ${config.label}`}
        >
          <Plus size={14} />
        </button>

      </div>

      <div className="vital-summary-label">
        {config.label}
      </div>

      <div className="vital-summary-value">

        <strong>
          {getDisplayValue(reading)}
        </strong>

        {reading && (
          <span>
            {reading.unit}
          </span>
        )}

      </div>

      <div className="vital-summary-bottom">

        {reading ? (
          <>
            <span
              className={`health-status-pill compact ${getStatusClass(
                reading.status
              )}`}
            >
              {getStatusLabel(
                reading.status
              )}
            </span>

            <span className="vital-updated">
              {formatDate(
                reading.recordedAt
              )}
            </span>
          </>
        ) : (
          <span className="vital-no-reading">
            No recent reading
          </span>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   ADD READING MODAL
   ========================================================= */

function AddReadingModal({
  type,
  form,
  saving,
  error,
  onClose,
  onChange,
  onTypeChange,
  onSubmit,
}) {
  const config =
    VITAL_TYPES[type];

  const Icon =
    config?.icon || Activity;

  return (
    <div
      className="vital-modal-overlay"
      role="presentation"
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
        className="vital-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-reading-title"
      >

        {/* MODAL HEADER */}

        <div className="vital-modal-header">

          <div>

            <span>
              HEALTH READING
            </span>

            <h2 id="add-reading-title">
              Add a measurement
            </h2>

            <p>
              Record a reading exactly as
              measured.
            </p>

          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={18} />
          </button>

        </div>


        {/* TYPE */}

        <div className="modal-field">

          <label>
            Measurement
          </label>

          <div className="modal-select-wrapper">

            <div className="modal-select-icon">
              <Icon size={16} />
            </div>

            <select
              value={type}
              onChange={(event) =>
                onTypeChange(
                  event.target.value
                )
              }
              disabled={saving}
            >
              {Object.entries(
                VITAL_TYPES
              ).map(
                ([
                  key,
                  item,
                ]) => (
                  <option
                    key={key}
                    value={key}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>

            <ChevronDown
              size={15}
            />

          </div>

        </div>


        {/* VALUES */}

        {type ===
        "blood_pressure" ? (
          <div className="modal-two-columns">

            <div className="modal-field">

              <label>
                Systolic
              </label>

              <input
                type="number"
                min="1"
                step="1"
                placeholder="120"
                value={
                  form.systolic
                }
                onChange={(event) =>
                  onChange(
                    "systolic",
                    event.target.value
                  )
                }
                disabled={saving}
              />

              <span className="modal-input-unit">
                mmHg
              </span>

            </div>

            <div className="modal-field">

              <label>
                Diastolic
              </label>

              <input
                type="number"
                min="1"
                step="1"
                placeholder="80"
                value={
                  form.diastolic
                }
                onChange={(event) =>
                  onChange(
                    "diastolic",
                    event.target.value
                  )
                }
                disabled={saving}
              />

              <span className="modal-input-unit">
                mmHg
              </span>

            </div>

          </div>
        ) : (
          <div className="modal-field">

            <label>
              {config.label}
            </label>

            <div className="modal-value-wrapper">

              <input
                type="number"
                min="0"
                step="any"
                placeholder={getPlaceholder(type)}
                value={form.value}
                onChange={(event) =>
                  onChange(
                    "value",
                    event.target.value
                  )
                }
                disabled={saving}
              />

              <span className="modal-input-unit">
                {config.unit}
              </span>

            </div>

          </div>
        )}


        {/* DATE */}

        <div className="modal-field">

          <label>
            Date & time
          </label>

          <div className="modal-input-with-icon">

            <Clock3 size={16} />

            <input
              type="datetime-local"
              value={
                form.recordedAt
              }
              onChange={(event) =>
                onChange(
                  "recordedAt",
                  event.target.value
                )
              }
              disabled={saving}
            />

          </div>

          <span className="field-hint">
            Use the actual time the reading was taken.
          </span>

        </div>


        {/* NOTE */}

        <div className="modal-field">

          <label>
            Note
            <span>
              {" "}
              optional
            </span>
          </label>

          <textarea
            rows="3"
            maxLength="300"
            placeholder="Example: Before breakfast"
            value={form.note}
            onChange={(event) =>
              onChange(
                "note",
                event.target.value
              )
            }
            disabled={saving}
          />

        </div>


        {/* ERROR */}

        {error && (
          <div className="modal-error">

            <Info size={15} />

            <span>
              {error}
            </span>

          </div>
        )}


        {/* FOOTER */}

        <div className="vital-modal-footer">

          <div className="modal-guidance">
            <Info size={14} />

            <span>
              Health signals are informational,
              not diagnostic.
            </span>
          </div>

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-action-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={onSubmit}
              disabled={saving}
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
                  <CheckCircle2
                    size={16}
                  />
                  Save reading
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   TOOLTIP
   ========================================================= */

function CustomTooltip({
  active,
  payload,
}) {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  const item =
    payload[0];

  return (
    <div className="vital-chart-tooltip">

      <strong>
        {item.value}
      </strong>

      <span>
        {item.payload?.fullDate}
      </span>

    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function getPlaceholder(type) {
  const placeholders = {
    heart_rate: "72",
    blood_glucose: "95",
    spo2: "98",
    temperature: "36.7",
    respiratory_rate: "16",
    weight: "61.5",
  };

  return placeholders[type] || "Enter value";
}

function getCurrentDateTime() {
  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  const localDate =
    new Date(
      now.getTime() -
        offset * 60000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

export default VitalMonitor;