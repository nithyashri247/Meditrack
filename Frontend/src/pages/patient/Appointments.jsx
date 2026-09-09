import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Star,
  Stethoscope,
  Users,
  Video,
  X,
} from "lucide-react";


/* =========================================================
   APPOINTMENTS
   ========================================================= */

function Appointments() {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState("");

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");

  const [selectedDoctor, setSelectedDoctor] =
    useState(null);

  const [bookingDoctor, setBookingDoctor] =
    useState(null);

  const [bookingStep, setBookingStep] =
    useState(1);

  const [visitReason, setVisitReason] =
    useState("");

  const [visitType, setVisitType] =
    useState("in-person");

  const [priority, setPriority] =
    useState("normal");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedTime, setSelectedTime] =
    useState("");

  const [bookingSuccess, setBookingSuccess] =
    useState(null);

  const [bookingSubmitting, setBookingSubmitting] =
    useState(false);

  const [appointments, setAppointments] =
  useState([]);

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [cancelTarget, setCancelTarget] =
    useState(null);

  const [rescheduleTarget, setRescheduleTarget] =
    useState(null);


  /* =======================================================
     LOAD DOCTORS
     ======================================================= */

  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoadingDoctors(true);
        setDoctorError("");

        const response = await api.get(
          "/doctors",
          {
            params: {
              search,
              specialty,
            },
          }
        );

        setDoctors(
          response.data?.doctors || []
        );
      } catch (error) {
        console.error(
          "Unable to load doctors:",
          error
        );

        setDoctorError(
          error.response?.data?.message ||
            "Unable to load doctors."
        );
      } finally {
        setLoadingDoctors(false);
      }
    }

    loadDoctors();
  }, [search, specialty]);
useEffect(() => {
  loadAppointments();
}, []);

async function loadAppointments() {
  try {
    const response = await api.get(
      "/appointments/my"
    );

    const serverAppointments =
      response.data?.data || [];

    const formattedAppointments =
      serverAppointments.map((appointment) => ({
        id: appointment._id,

        appointmentId:
          appointment.appointmentId,

        doctor:
          appointment.doctor?.name ||
          "Doctor",

        specialty:
          appointment.doctor?.specialization ||
          "Specialist",

        hospital:
          appointment.doctorProfile?.hospital ||
          "MediTrack Hospital",

        date:
          formatBookingDate(
            appointment.appointmentDate
          ),

        time:
          appointment.appointmentTime,

        type:
          appointment.visitType === "video"
            ? "Video consultation"
            : "In-person",

        status:
          appointment.status,
      }));

    setAppointments(
      formattedAppointments
    );
  } catch (error) {
    console.error(
      "Unable to load appointments:",
      error
    );

    setAppointments([]);
  }
}

  /* =======================================================
     SPECIALTIES
     ======================================================= */

  const specialties = useMemo(() => {
    const values = doctors
      .map(
        (doctor) =>
          doctor.specialty ||
          doctor.user?.specialization
      )
      .filter(Boolean);

    return [
      ...new Set(values),
    ];
  }, [doctors]);


  /* =======================================================
     BOOKING HELPERS
     ======================================================= */

  function openBooking(doctor) {
    setBookingDoctor(doctor);
    setBookingStep(1);
    setVisitReason("");
    setPriority("normal");
    setVisitType(
      doctor.visitTypes?.includes("in-person")
        ? "in-person"
        : "video"
    );
    setSelectedDate("");
    setSelectedTime("");
    setBookingSuccess(null);
    setBookingSubmitting(false);
  }

  function closeBooking() {
    setBookingDoctor(null);
    setBookingStep(1);
    setVisitReason("");
    setPriority("normal");
    setSelectedDate("");
    setSelectedTime("");
    setBookingSuccess(null);
    setBookingSubmitting(false);
  }


  async function confirmBooking() {
  if (
    !bookingDoctor ||
    !selectedDate ||
    !selectedTime ||
    !visitReason ||
    !visitType
  ) {
    return;
  }

  try {
    setBookingSubmitting(true);

    const response = await api.post(
      "/appointments",
      {
        doctor:
          bookingDoctor.user?._id,

        doctorProfile:
          bookingDoctor._id,

        visitReason:
          visitReason.trim(),

        visitType,

        priority,

        appointmentDate:
          selectedDate,

        appointmentTime:
          selectedTime,

        duration: 30,
      }
    );

    const appointment =
      response.data?.data;

    if (!appointment) {
      throw new Error(
        "Appointment was not returned by the server."
      );
    }

    await loadAppointments();

    setBookingSuccess({
      id: appointment._id,

      doctor:
        appointment.doctor?.name ||
        bookingDoctor.user?.name ||
        "Doctor",

      specialty:
        appointment.doctor
          ?.specialization ||
        bookingDoctor.specialty ||
        "Specialist",

      hospital:
        appointment.doctorProfile
          ?.hospital ||
        bookingDoctor.hospital ||
        "MediTrack Hospital",

      date:
        formatBookingDate(
          appointment.appointmentDate
        ),

      time:
        appointment.appointmentTime,

      type:
        appointment.visitType ===
        "video"
          ? "Video consultation"
          : "In-person",

      status:
        appointment.status,
    });
  } catch (error) {
    console.error(
      "Unable to create appointment:",
      error
    );

    alert(
      error.response?.data?.message ||
        "Unable to send the appointment request."
    );
  } finally {
    setBookingSubmitting(false);
  }
}

  function formatBookingDate(value) {
    if (!value) return "Date not selected";

    const date = new Date(value);

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }


 async function cancelAppointment() {
  if (!cancelTarget) return;

  try {
    await api.patch(
      `/appointments/${cancelTarget.id}/cancel`,
      {}
    );

    // Reload appointments from MongoDB
    // so the cancelled status is permanent.
    await loadAppointments();

    setCancelTarget(null);
    setSelectedAppointment(null);
  } catch (error) {
    console.error(
      "Unable to cancel appointment:",
      error
    );

    alert(
      error.response?.data?.message ||
        "Unable to cancel the appointment."
    );
  }
}


  /* =======================================================
     UPCOMING COUNT
     ======================================================= */

  const upcomingAppointments =
  appointments.filter((appointment) => {
    const status =
      String(
        appointment.status || ""
      ).toLowerCase();

    return ![
      "cancelled",
      "rejected",
      "completed",
      "no-show",
    ].includes(status);
  });

  const nextAppointment =
    upcomingAppointments[0] || null;


  return (
    <div className="appointments-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="appointments-header">

        <div>
          <span className="appointments-eyebrow">
            PATIENT CARE
          </span>

          <h1>
            Appointments
          </h1>

          <p>
            Find doctors, manage consultations,
            and keep track of your upcoming visits.
          </p>
        </div>


        <button
  type="button"
  className="appointments-primary-button"
  onClick={() => {
    document
      .querySelector(".doctor-search-bar")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }}
  disabled={!doctors.length}
>
  <CalendarDays size={17} />
  Request Appointment
</button>

      </section>


      {/* =====================================================
          NEXT APPOINTMENT
          ===================================================== */}

      {nextAppointment ? (
        <section className="next-appointment-card">

          <div className="next-appointment-top">

            <div className="next-appointment-label">
              <span className="status-dot" />
              NEXT APPOINTMENT
            </div>

            <span className="appointment-status-badge">
              {nextAppointment.status}
            </span>

          </div>


          <div className="next-appointment-content">

            <div className="doctor-avatar-large">
              <Stethoscope size={25} />
            </div>


            <div className="next-doctor-info">

              <h2>
                {nextAppointment.doctor}
              </h2>

              <p className="doctor-specialty">
                {nextAppointment.specialty}
              </p>

              <div className="next-appointment-meta">

                <span>
                  <MapPin size={15} />
                  {nextAppointment.hospital}
                </span>

                <span>
                  <CalendarDays size={15} />
                  {nextAppointment.date}
                </span>

                <span>
                  <Clock3 size={15} />
                  {nextAppointment.time}
                </span>

                <span>
                  {nextAppointment.type ===
                    "Video consultation" ? (
                    <Video size={15} />
                  ) : (
                    <Users size={15} />
                  )}

                  {nextAppointment.type}
                </span>

              </div>

            </div>


            <div className="next-appointment-actions">

              <button
                type="button"
                className="appointment-secondary-button"
                onClick={() =>
                  setSelectedAppointment(
                    nextAppointment
                  )
                }
              >
                View Details
              </button>

              <button
                type="button"
                className="appointment-text-button"
                onClick={() =>
                  setRescheduleTarget(
                    nextAppointment
                  )
                }
              >
                Reschedule
              </button>

            </div>

          </div>

        </section>
      ) : (
        <section className="next-appointment-card">

          <div className="next-appointment-label">
            <CalendarDays size={15} />
            NO UPCOMING APPOINTMENTS
          </div>

          <p style={{ margin: "15px 0 0", color: "#71817c" }}>
            Find a doctor below and book your next
            consultation.
          </p>

        </section>
      )}


      {/* =====================================================
          OVERVIEW
          ===================================================== */}

      <section className="appointment-overview-grid">

        <div className="appointment-stat-card">

          <div className="appointment-stat-icon">
            <CalendarDays size={18} />
          </div>

          <div>
            <span>
              Upcoming
            </span>

            <strong>
              {upcomingAppointments.length}
            </strong>
          </div>

        </div>


        <div className="appointment-stat-card">

          <div className="appointment-stat-icon">
            <CheckCircle2 size={18} />
          </div>

          <div>
            <span>
              Completed
            </span>

            <strong>
              0
            </strong>
          </div>

        </div>


        <div className="appointment-stat-card">

          <div className="appointment-stat-icon">
            <Clock3 size={18} />
          </div>

          <div>
            <span>
              Next Visit
            </span>

            <strong>
              {nextAppointment
                ? "Scheduled"
                : "—"}
            </strong>
          </div>

        </div>

      </section>


      {/* =====================================================
          FIND A DOCTOR
          ===================================================== */}

      <section className="appointment-section">

        <div className="appointment-section-heading">

          <div>
            <span className="appointments-eyebrow">
              DISCOVER
            </span>

            <h2>
              Find a Doctor
            </h2>

            <p>
              Search by doctor name or specialty
              and find a suitable consultation.
            </p>
          </div>

          <span
            style={{
              color: "#087f73",
              fontSize: "9px",
              fontWeight: 800,
            }}
          >
            {doctors.length} doctors available
          </span>

        </div>


        {/* SEARCH */}

        <div className="doctor-search-bar">

          <Search size={19} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search doctor or specialty..."
          />

        </div>


        {/* FILTERS */}

        <div className="doctor-filter-row">

          <button
            type="button"
            className={`doctor-filter ${
              specialty === ""
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSpecialty("")
            }
          >
            All specialties
          </button>


          {specialties.map(
            (item) => (
              <button
                key={item}
                type="button"
                className={`doctor-filter ${
                  specialty === item
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSpecialty(item)
                }
              >
                {item}
              </button>
            )
          )}

        </div>


        {/* DOCTORS */}

        <div className="doctor-card-grid">

          {loadingDoctors ? (
            <div className="doctor-loading-state">
              Loading doctors...
            </div>
          ) : doctorError ? (
            <div className="doctor-error-state">
              {doctorError}
            </div>
          ) : doctors.length === 0 ? (
            <div className="doctor-empty-state">
              No doctors found.
            </div>
          ) : (
            doctors.map(
              (doctor) => (
                <DoctorCard
                  key={doctor._id}
                  doctor={doctor}
                  onViewProfile={() =>
                    setSelectedDoctor(
                      doctor
                    )
                  }
                  onBook={() =>
                    openBooking(
                      doctor
                    )
                  }
                />
              )
            )
          )}

        </div>

      </section>


      {/* =====================================================
          UPCOMING APPOINTMENTS
          ===================================================== */}

      <section className="appointment-section">

        <div className="appointment-section-heading">

          <div>
            <span className="appointments-eyebrow">
              YOUR VISITS
            </span>

            <h2>
              Upcoming Appointments
            </h2>

            <p>
              Stay on top of your scheduled consultations.
            </p>
          </div>

        </div>


        <div className="upcoming-appointment-list">

          {upcomingAppointments.length === 0 ? (
            <div className="doctor-empty-state">
              No upcoming appointments.
            </div>
          ) : (
            upcomingAppointments.map(
              (appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={
                    appointment
                  }
                  onView={() =>
                    setSelectedAppointment(
                      appointment
                    )
                  }
                  onReschedule={() =>
                    setRescheduleTarget(
                      appointment
                    )
                  }
                  onCancel={() =>
                    setCancelTarget(
                      appointment
                    )
                  }
                />
              )
            )
          )}

        </div>

      </section>


      {/* =====================================================
          HISTORY
          ===================================================== */}

      <section className="appointment-section">

        <div className="appointment-section-heading">

          <div>
            <span className="appointments-eyebrow">
              HISTORY
            </span>

            <h2>
              Appointment History
            </h2>

            <p>
              Review your previous consultation activity.
            </p>
          </div>

        </div>


        <div className="appointment-history-card">

          <div className="history-icon">
            <Stethoscope size={18} />
          </div>

          <div className="history-main">

            <strong>
              No completed appointments yet
            </strong>

            <span>
              Completed consultations will appear here.
            </span>

          </div>

          <span className="history-status completed">
            Ready
          </span>

        </div>

      </section>


      {/* =====================================================
          DOCTOR PROFILE MODAL
          ===================================================== */}

      {selectedDoctor && (
        <DoctorProfile
          doctor={selectedDoctor}
          onClose={() =>
            setSelectedDoctor(null)
          }
          onBook={() => {
            setSelectedDoctor(null);
            openBooking(
              selectedDoctor
            );
          }}
        />
      )}


      {/* =====================================================
          BOOKING MODAL
          ===================================================== */}

      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          step={bookingStep}
          setStep={setBookingStep}
          visitReason={visitReason}
          setVisitReason={setVisitReason}
          visitType={visitType}
          setVisitType={setVisitType}
          priority={priority}
          setPriority={setPriority}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          success={bookingSuccess}
          submitting={bookingSubmitting}
          onConfirm={confirmBooking}
          onClose={closeBooking}
        />
      )}


      {/* =====================================================
          APPOINTMENT DETAILS
          ===================================================== */}

      {selectedAppointment && (
        <AppointmentDetails
          appointment={
            selectedAppointment
          }
          onClose={() =>
            setSelectedAppointment(
              null
            )
          }
          onReschedule={() => {
            setRescheduleTarget(
              selectedAppointment
            );
            setSelectedAppointment(
              null
            );
          }}
          onCancel={() => {
            setCancelTarget(
              selectedAppointment
            );
            setSelectedAppointment(
              null
            );
          }}
        />
      )}


      {/* =====================================================
          CANCEL MODAL
          ===================================================== */}

      {cancelTarget && (
        <ConfirmationModal
          title="Cancel Appointment?"
          description={`Are you sure you want to cancel your appointment with ${cancelTarget.doctor}?`}
          confirmText="Cancel Appointment"
          danger
          onClose={() =>
            setCancelTarget(null)
          }
          onConfirm={
            cancelAppointment
          }
        />
      )}


      {/* =====================================================
          RESCHEDULE MODAL
          ===================================================== */}

      {rescheduleTarget && (
        <RescheduleModal
          appointment={
            rescheduleTarget
          }
          onClose={() =>
            setRescheduleTarget(
              null
            )
          }
          onSave={(newDate) => {
            setAppointments(
              (current) =>
                current.map(
                  (appointment) =>
                    appointment.id ===
                    rescheduleTarget.id
                      ? {
                          ...appointment,
                          date:
                            formatBookingDate(
                              newDate
                            ),
                          status:
                            "Rescheduled",
                        }
                      : appointment
                )
            );

            setRescheduleTarget(
              null
            );
          }}
        />
      )}

    </div>
  );
}


/* =========================================================
   DOCTOR CARD
   ========================================================= */

function DoctorCard({
  doctor,
  onViewProfile,
  onBook,
}) {
  const doctorName =
    doctor.user?.name ||
    "Doctor";

  const specialty =
    doctor.specialty ||
    doctor.user?.specialization ||
    "Specialist";

  const hospital =
    doctor.hospital ||
    doctor.user?.hospital ||
    "MediTrack Hospital";

  const experience =
    doctor.experience ?? 0;

  const nextAvailability =
    doctor.availability?.[0]?.slots?.[0] ||
    "Check availability";

  return (
    <article className="doctor-card">

      <div className="doctor-card-top">

        <div className="doctor-avatar">
          <Stethoscope size={20} />
        </div>

        <span className="doctor-available-badge">
          Available
        </span>

      </div>


      <div className="doctor-card-info">

        <h3>
          {doctorName}
        </h3>

        <p className="doctor-card-specialty">
          {specialty}
        </p>

        <span className="doctor-card-hospital">
          <MapPin size={14} />
          {hospital}
        </span>

        <span className="doctor-card-experience">
          {experience} years experience
        </span>

      </div>


      <div className="doctor-card-divider" />


      <div className="doctor-card-bottom">

        <div className="doctor-next-slot">

          <span>
            Next available
          </span>

          <strong>
            {nextAvailability}
          </strong>

        </div>


        <div
          style={{
            display: "flex",
            gap: "6px",
          }}
        >

          <button
            type="button"
            className="doctor-book-button"
            onClick={onViewProfile}
          >
            View Profile
          </button>

          <button
            type="button"
            className="doctor-book-button"
            onClick={onBook}
          >
            Request
          </button>

        </div>

      </div>

    </article>
  );
}


/* =========================================================
   DOCTOR PROFILE
   ========================================================= */

function DoctorProfile({
  doctor,
  onClose,
  onBook,
}) {
  const doctorName =
    doctor.user?.name ||
    "Doctor";

  const specialty =
    doctor.specialty ||
    doctor.user?.specialization ||
    "Specialist";

  const hospital =
    doctor.hospital ||
    doctor.user?.hospital ||
    "MediTrack Hospital";

  return (
    <div className="doctor-profile-overlay">

      <div className="doctor-profile-modal">

        <div className="doctor-profile-header">

          <div>
            <span className="appointments-eyebrow">
              DOCTOR PROFILE
            </span>

            <h2>
              {doctorName}
            </h2>

            <p>
              {specialty}
            </p>
          </div>


          <button
            type="button"
            className="doctor-profile-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>


        <div className="doctor-profile-summary">

          <div className="doctor-profile-avatar">
            <Stethoscope size={27} />
          </div>

          <div>

            <strong>
              {hospital}
            </strong>

            <span>
              {doctor.qualification ||
                "Qualified Medical Specialist"}
            </span>

          </div>

        </div>


        <div className="doctor-profile-grid">

          <ProfileStat
            label="Experience"
            value={`${doctor.experience || 0} years`}
          />

          <ProfileStat
            label="Consultation"
            value={`₹${doctor.consultationFee || 0}`}
          />

          <ProfileStat
            label="Rating"
            value={
              <>
                <Star size={13} />
                {doctor.rating || "—"}
              </>
            }
          />

          <ProfileStat
            label="Reviews"
            value={
              doctor.totalReviews || 0
            }
          />

        </div>


        <ProfileSection title="About the Doctor">
          <p>
            {doctor.bio ||
              "Patient-focused healthcare professional providing consultation and personalized care."}
          </p>
        </ProfileSection>


        <ProfileSection title="Languages">
          <TagList
            items={
              doctor.languages || []
            }
          />
        </ProfileSection>


        <ProfileSection title="Consultation Types">
          <TagList
            items={(
              doctor.visitTypes || []
            ).map(
              (type) =>
                type === "video"
                  ? "Video consultation"
                  : "In-person"
            )}
          />
        </ProfileSection>


        <ProfileSection title="Clinic location">
          <p>
            {[doctor.clinicAddress, doctor.city, doctor.pincode]
              .filter(Boolean)
              .join(", ") || "Clinic location not provided."}
          </p>
        </ProfileSection>

        <ProfileSection title="Education & certifications">
          <p>{doctor.education || "Education details not provided."}</p>
          {doctor.certifications && <p>{doctor.certifications}</p>}
        </ProfileSection>

        <ProfileSection title="Areas of expertise">
          <TagList items={doctor.areasOfExpertise || []} />
        </ProfileSection>

        <ProfileSection title="Services offered">
          <TagList items={doctor.servicesOffered || []} />
        </ProfileSection>

        <ProfileSection title="Available Days">
          <TagList
            items={
              doctor.availableDays || []
            }
          />
        </ProfileSection>


        <ProfileSection title="Available Slots">

          <div className="doctor-language-list">

            {(doctor.availability || [])
              .slice(0, 3)
              .map((item) => (
                <span key={item.day}>
                  {item.day}:{" "}
                  {item.slots
                    ?.slice(0, 2)
                    .join(" · ")}
                </span>
              ))}

          </div>

        </ProfileSection>


        <div className="doctor-profile-actions">

          <button
            type="button"
            className="appointment-secondary-button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="appointments-primary-button"
            onClick={onBook}
          >
            <CalendarDays size={16} />
            Request Appointment
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   PROFILE STAT
   ========================================================= */

function ProfileStat({
  label,
  value,
}) {
  return (
    <div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   PROFILE SECTION
   ========================================================= */

function ProfileSection({
  title,
  children,
}) {
  return (
    <div className="doctor-profile-section">

      <h3>
        {title}
      </h3>

      {children}

    </div>
  );
}


/* =========================================================
   TAG LIST
   ========================================================= */

function TagList({ items }) {
  return (
    <div className="doctor-language-list">

      {items.length ? (
        items.map((item) => (
          <span key={item}>
            {item}
          </span>
        ))
      ) : (
        <span>
          Not specified
        </span>
      )}

    </div>
  );
}


/* =========================================================
   BOOKING MODAL
   ========================================================= */

function BookingModal({
  doctor,
  step,
  setStep,
  visitReason,
  setVisitReason,
  visitType,
  setVisitType,
  priority,
  setPriority,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  success,
  submitting,
  onConfirm,
  onClose,
}) {
  const doctorName =
    doctor.user?.name ||
    "Doctor";

  const visitReasons = [
    "General consultation",
    "Follow-up",
    "Review reports",
    "Medication review",
    "Urgent concern",
    "Other",
  ];

  const availableTypes =
    doctor.visitTypes || [
      "in-person",
    ];

  const selectedDayName = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" })
    : "";

  const selectedDaySchedule = (doctor.availability || []).find(
    (item) => item.day === selectedDayName
  );

  const leaveDateKeys = new Set(
    (doctor.leaveDates || []).map((leave) =>
      new Date(leave.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    )
  );

  const selectedDateOnLeave = selectedDate
    ? leaveDateKeys.has(selectedDate)
    : false;

  const slots = selectedDaySchedule?.slots || [];

  if (success) {
    return (
      <div className="doctor-profile-overlay">

        <div className="doctor-profile-modal">

          <div className="booking-success">

            <div className="booking-success-icon">
              <CheckCircle2 size={29} />
            </div>

            <span className="appointments-eyebrow">
              APPOINTMENT REQUEST
            </span>

            <h2>
              Request Sent
            </h2>

            <p>
              Your appointment request with{" "}
              <strong>
                {success.doctor}
              </strong>{" "}
              has been sent successfully and is waiting for doctor approval.
            </p>


            <div className="booking-success-details">

              <div>
                <span>
                  Appointment ID
                </span>

                <strong>
                  {success.id}
                </strong>
              </div>

              <div>
                <span>
                  Date
                </span>

                <strong>
                  {success.date}
                </strong>
              </div>

              <div>
                <span>
                  Time
                </span>

                <strong>
                  {success.time}
                </strong>
              </div>

              <div>
                <span>
                  Status
                </span>

                <strong>
                  Awaiting approval
                </strong>
              </div>

            </div>


            <button
              type="button"
              className="appointments-primary-button"
              onClick={onClose}
            >
              Done
            </button>

          </div>

        </div>

      </div>
    );
  }


  return (
    <div className="doctor-profile-overlay">

      <div className="doctor-profile-modal booking-modal">

        <div className="doctor-profile-header">

          <div>

            <span className="appointments-eyebrow">
              BOOK APPOINTMENT · STEP {step} OF 3
            </span>

            <h2>
              {doctorName}
            </h2>

            <p>
              {doctor.specialty}
            </p>

          </div>


          <button
            type="button"
            className="doctor-profile-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>


        <div className="booking-step-indicator">

          <span className={step >= 1 ? "active" : ""}>
            01 Visit
          </span>

          <span className={step >= 2 ? "active" : ""}>
            02 Date & Time
          </span>

          <span className={step >= 3 ? "active" : ""}>
            03 Confirm
          </span>

        </div>


        {step === 1 && (
          <div className="booking-step-content">

            <h3>
              Tell us about your visit
            </h3>

            <p>
              Select the reason and preferred consultation type.
            </p>


            <div className="booking-option-grid">

              {visitReasons.map(
                (reason) => (
                  <button
                    key={reason}
                    type="button"
                    className={`booking-option ${
                      visitReason === reason
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setVisitReason(
                        reason
                      )
                    }
                  >
                    {reason}
                  </button>
                )
              )}

            </div>


            <button
              type="button"
              className={`booking-urgent-toggle ${priority === "urgent" ? "selected" : ""}`}
              onClick={() => setPriority(priority === "urgent" ? "normal" : "urgent")}
            >
              <AlertTriangle size={16} />
              <span>
                <strong>Mark as urgent</strong>
                <small>Use only when you need priority review. The doctor will see this request first.</small>
              </span>
            </button>

            <h3 className="booking-subheading">
              Consultation type
            </h3>

            <div className="booking-option-grid">

              {availableTypes.map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    className={`booking-option ${
                      visitType === type
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setVisitType(type)
                    }
                  >
                    {type === "video" ? (
                      <Video size={16} />
                    ) : (
                      <Users size={16} />
                    )}

                    {type === "video"
                      ? "Video consultation"
                      : "In-person"}
                  </button>
                )
              )}

            </div>


            <div className="booking-modal-actions">

              <button
                type="button"
                className="appointment-secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="button"
                className="appointments-primary-button"
                disabled={!visitReason}
                onClick={() =>
                  setStep(2)
                }
              >
                Continue
                <ChevronRight size={16} />
              </button>

            </div>

          </div>
        )}


        {step === 2 && (
          <div className="booking-step-content">

            <h3>
              Choose your date and time
            </h3>

            <p>
              Select an available date and consultation slot.
            </p>


            <label className="booking-date-field">

              <span>
                Appointment date
              </span>

              <input
                type="date"
                value={selectedDate}
                min={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedTime("");
                }}
              />

            </label>


            <div className="booking-availability-note">
              {!selectedDate
                ? "Choose a date to see the doctor's published slots."
                : selectedDateOnLeave
                  ? "The doctor is on leave on this date. Please choose another date."
                  : !selectedDaySchedule
                    ? "The doctor is not accepting appointments on this day."
                    : `Available ${selectedDayName} slots are shown below.`}
            </div>

            <h3 className="booking-subheading">
              Available time slots
            </h3>


            <div className="booking-slot-grid">

              {slots.length ? (
                slots.map(
                  (slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`booking-slot ${
                        selectedTime === slot
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedTime(
                          slot
                        )
                      }
                    >
                      <Clock3 size={14} />
                      {slot}
                    </button>
                  )
                )
              ) : (
                <div className="doctor-empty-state">
                  {selectedDate && !selectedDateOnLeave ? "No published slots for this date." : "Select an available date first."}
                </div>
              )}

            </div>


            <div className="booking-modal-actions">

              <button
                type="button"
                className="appointment-secondary-button"
                onClick={() =>
                  setStep(1)
                }
              >
                <ChevronLeft size={15} />
                Back
              </button>

              <button
                type="button"
                className="appointments-primary-button"
                disabled={
                  !selectedDate ||
                  !selectedTime
                }
                onClick={() =>
                  setStep(3)
                }
              >
                Continue
                <ChevronRight size={16} />
              </button>

            </div>

          </div>
        )}


        {step === 3 && (
          <div className="booking-step-content">

            <h3>
              Review appointment
            </h3>

            <p>
              Check the details before submitting your request.
            </p>


            <div className="booking-review-card">

              <div>
                <span>
                  Doctor
                </span>

                <strong>
                  {doctorName}
                </strong>
              </div>

              <div>
                <span>
                  Specialty
                </span>

                <strong>
                  {doctor.specialty}
                </strong>
              </div>

              <div>
                <span>
                  Reason
                </span>

                <strong>
                  {visitReason}
                </strong>
              </div>

              <div>
                <span>
                  Priority
                </span>

                <strong>
                  {priority === "urgent" ? "Urgent request" : "Normal request"}
                </strong>
              </div>

              <div>
                <span>
                  Type
                </span>

                <strong>
                  {visitType === "video"
                    ? "Video consultation"
                    : "In-person"}
                </strong>
              </div>

              <div>
                <span>
                  Date
                </span>

                <strong>
                  {formatBookingDate(
                    selectedDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Time
                </span>

                <strong>
                  {selectedTime}
                </strong>
              </div>

            </div>


            <div className="booking-modal-actions">

              <button
                type="button"
                className="appointment-secondary-button"
                onClick={() =>
                  setStep(2)
                }
              >
                <ChevronLeft size={15} />
                Back
              </button>

              <button
                type="button"
                className="appointments-primary-button"
                disabled={submitting}
                onClick={onConfirm}
              >
                <CheckCircle2 size={16} />
                {submitting ? "Sending Request..." : "Send Appointment Request"}
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatBookingDate(value) {
  if (!value) return "Date not selected";

  const date = new Date(value);

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


/* =========================================================
   APPOINTMENT ROW
   ========================================================= */

function AppointmentRow({
  appointment,
  onView,
  onReschedule,
  onCancel,
}) {
  return (
    <article className="upcoming-appointment-row">

      <div className="appointment-date-box">

        <strong>
          {appointment.date
            ?.split(" ")[0]}
        </strong>

        <span>
          {appointment.date
            ?.split(" ")[1]
            ?.toUpperCase()}
        </span>

      </div>


      <div className="upcoming-doctor-info">

        <strong>
          {appointment.doctor}
        </strong>

        <span>
          {appointment.specialty}
        </span>

        <small>
          <MapPin size={13} />
          {appointment.hospital}
        </small>

      </div>


      <div className="upcoming-time">

        <strong>
          {appointment.time}
        </strong>

        <span>
          {appointment.type ===
            "Video consultation" && (
            <Video size={13} />
          )}

          {appointment.type}
        </span>

      </div>


      <span className="appointment-status-badge">
        {appointment.status}
      </span>


      <button
        type="button"
        className="appointment-row-details"
        onClick={onView}
      >
        View
      </button>

      <button
        type="button"
        className="appointment-row-details"
        onClick={onReschedule}
      >
        Reschedule
      </button>

      <button
        type="button"
        className="appointment-row-details"
        onClick={onCancel}
      >
        Cancel
      </button>

    </article>
  );
}


/* =========================================================
   APPOINTMENT DETAILS
   ========================================================= */

function AppointmentDetails({
  appointment,
  onClose,
  onReschedule,
  onCancel,
}) {
  return (
    <div className="doctor-profile-overlay">

      <div className="doctor-profile-modal">

        <div className="doctor-profile-header">

          <div>
            <span className="appointments-eyebrow">
              APPOINTMENT DETAILS
            </span>

            <h2>
              {appointment.doctor}
            </h2>

            <p>
              {appointment.specialty}
            </p>
          </div>

          <button
            type="button"
            className="doctor-profile-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>


        <div className="booking-review-card">

          <div>
            <span>
              Appointment ID
            </span>

            <strong>
              {appointment.id}
            </strong>
          </div>

          <div>
            <span>
              Hospital
            </span>

            <strong>
              {appointment.hospital}
            </strong>
          </div>

          <div>
            <span>
              Date
            </span>

            <strong>
              {appointment.date}
            </strong>
          </div>

          <div>
            <span>
              Time
            </span>

            <strong>
              {appointment.time}
            </strong>
          </div>

          <div>
            <span>
              Consultation
            </span>

            <strong>
              {appointment.type}
            </strong>
          </div>

          <div>
            <span>
              Status
            </span>

            <strong>
              {appointment.status}
            </strong>
          </div>

        </div>


        <div className="doctor-profile-actions">

          <button
            type="button"
            className="appointment-secondary-button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="appointment-secondary-button"
            onClick={onReschedule}
          >
            Reschedule
          </button>

          <button
            type="button"
            className="appointments-primary-button"
            onClick={onCancel}
          >
            Cancel Appointment
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   CONFIRMATION MODAL
   ========================================================= */

function ConfirmationModal({
  title,
  description,
  confirmText,
  danger,
  onClose,
  onConfirm,
}) {
  return (
    <div className="doctor-profile-overlay">

      <div
        className="doctor-profile-modal"
        style={{
          maxWidth: "430px",
        }}
      >

        <div className="doctor-profile-header">

          <div>

            <span className="appointments-eyebrow">
              CONFIRM ACTION
            </span>

            <h2>
              {title}
            </h2>

          </div>

          <button
            type="button"
            className="doctor-profile-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>

        <p
          style={{
            color: "#71817c",
            lineHeight: 1.7,
            fontSize: "12px",
          }}
        >
          {description}
        </p>


        <div className="doctor-profile-actions">

          <button
            type="button"
            className="appointment-secondary-button"
            onClick={onClose}
          >
            Keep Appointment
          </button>

          <button
            type="button"
            className={
              danger
                ? "appointment-danger-button"
                : "appointments-primary-button"
            }
            onClick={onConfirm}
          >
            {confirmText}
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   RESCHEDULE MODAL
   ========================================================= */

function RescheduleModal({
  appointment,
  onClose,
  onSave,
}) {
  const [date, setDate] =
    useState("");

  return (
    <div className="doctor-profile-overlay">

      <div
        className="doctor-profile-modal"
        style={{
          maxWidth: "450px",
        }}
      >

        <div className="doctor-profile-header">

          <div>
            <span className="appointments-eyebrow">
              RESCHEDULE
            </span>

            <h2>
              Choose a new date
            </h2>

            <p>
              {appointment.doctor}
            </p>
          </div>

          <button
            type="button"
            className="doctor-profile-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>


        <label className="booking-date-field">

          <span>
            New appointment date
          </span>

          <input
            type="date"
            value={date}
            min={
              new Date()
                .toISOString()
                .split("T")[0]
            }
            onChange={(event) =>
              setDate(
                event.target.value
              )
            }
          />

        </label>


        <div className="doctor-profile-actions">

          <button
            type="button"
            className="appointment-secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="appointments-primary-button"
            disabled={!date}
            onClick={() =>
              onSave(date)
            }
          >
            Confirm New Date
          </button>

        </div>

      </div>

    </div>
  );
}


export default Appointments;