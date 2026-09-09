import Prescription from "../models/Prescription.js";
import MedicationLog from "../models/MedicationLog.js";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isValidTime(time) {
  return (
    typeof time === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
  );
}

function normalizeSchedules(schedules) {
  if (!Array.isArray(schedules)) {
    return [];
  }

  const seen = new Set();

  return schedules
    .filter(
      (schedule) =>
        schedule &&
        isValidTime(schedule.time)
    )
    .map((schedule) => ({
      label: [
        "morning",
        "afternoon",
        "evening",
        "night",
        "custom",
      ].includes(schedule.label)
        ? schedule.label
        : "custom",

      time: schedule.time,

      enabled: schedule.enabled !== false,
    }))
    .filter((schedule) => {
      const key =
        `${schedule.label}-${schedule.time}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

/*
|--------------------------------------------------------------------------
| CREATE PRESCRIPTION
|--------------------------------------------------------------------------
| POST /api/prescriptions
|--------------------------------------------------------------------------
*/

export async function createPrescription(req, res) {
  try {
    const {
      doctor,
      doctorName,
      hospitalName,
      prescriptionDate,
      diagnosisContext,
      followUpDate,
      medicines,
      patientNotes,
      doctorInstructions,
    } = req.body;

    if (
      !Array.isArray(medicines) ||
      medicines.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please add at least one medicine.",
      });
    }

    if (medicines.length > 50) {
      return res.status(400).json({
        success: false,
        message:
          "A prescription cannot contain more than 50 medicines.",
      });
    }

    const normalizedMedicines = [];

    for (
      let index = 0;
      index < medicines.length;
      index++
    ) {
      const medicine = medicines[index];

      if (
        !medicine?.name ||
        !String(medicine.name).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Medicine ${index + 1} requires a name.`,
        });
      }

      if (
        !medicine?.dosage ||
        !String(medicine.dosage).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Medicine ${index + 1} requires a dosage.`,
        });
      }

      const startDate = parseDate(
        medicine.startDate
      );

      if (!startDate) {
        return res.status(400).json({
          success: false,
          message:
            `Please provide a valid start date for ${medicine.name}.`,
        });
      }

      const endDate = parseDate(
        medicine.endDate
      );

      if (
        endDate &&
        endDate < startDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            `End date cannot be before start date for ${medicine.name}.`,
        });
      }

      const schedules = normalizeSchedules(
        medicine.schedules
      );

      const frequencyValues = [
        "once_daily",
        "twice_daily",
        "three_times_daily",
        "four_times_daily",
        "every_4_hours",
        "every_6_hours",
        "every_8_hours",
        "every_12_hours",
        "once_weekly",
        "as_needed",
        "custom",
      ];

      const frequency =
        frequencyValues.includes(
          medicine.frequency
        )
          ? medicine.frequency
          : "once_daily";

      const foodValues = [
        "before_food",
        "after_food",
        "with_food",
        "empty_stomach",
        "anytime",
      ];

      const foodInstruction =
        foodValues.includes(
          medicine.foodInstruction
        )
          ? medicine.foodInstruction
          : "anytime";

      const routeValues = [
        "oral",
        "topical",
        "inhaled",
        "injection",
        "sublingual",
        "other",
      ];

      const route =
        routeValues.includes(medicine.route)
          ? medicine.route
          : "oral";

      /*
       * Fixed-time medicines require at least
       * one enabled reminder.
       *
       * As-needed medicines do not.
       */
      if (
        frequency !== "as_needed" &&
        schedules.filter(
          (schedule) =>
            schedule.enabled
        ).length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${medicine.name} requires at least one reminder time.`,
        });
      }

      normalizedMedicines.push({
        name: String(medicine.name)
          .trim()
          .slice(0, 150),

        dosage: String(medicine.dosage)
          .trim()
          .slice(0, 100),

        dosageUnit:
          medicine.dosageUnit
            ? String(
                medicine.dosageUnit
              )
                .trim()
                .slice(0, 50)
            : "",

        route,

        frequency,

        schedules,

        foodInstruction,

        startDate,

        endDate,

        quantityPerDose:
          Number(
            medicine.quantityPerDose
          ) > 0
            ? Number(
                medicine.quantityPerDose
              )
            : 1,

        totalQuantity:
          medicine.totalQuantity !==
            undefined &&
          medicine.totalQuantity !==
            null &&
          medicine.totalQuantity !==
            ""
            ? Number(
                medicine.totalQuantity
              )
            : null,

        instructions:
          medicine.instructions
            ? String(
                medicine.instructions
              )
                .trim()
                .slice(0, 500)
            : "",

        remindersEnabled:
          medicine.remindersEnabled !==
          false,

        status: "active",

        stoppedAt: null,

        stoppedReason: "",
      });
    }

    const finalPrescriptionDate =
      parseDate(
        prescriptionDate
      ) || new Date();

    if (
      finalPrescriptionDate >
      new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Prescription date cannot be in the future.",
      });
    }

    const finalFollowUpDate =
      parseDate(followUpDate);

    const prescription =
      await Prescription.create({
        patient: req.user._id,

        doctor:
          doctor || null,

        doctorName:
          doctorName
            ? String(doctorName)
                .trim()
                .slice(0, 150)
            : "",

        hospitalName:
          hospitalName
            ? String(hospitalName)
                .trim()
                .slice(0, 150)
            : "",

        prescriptionDate:
          finalPrescriptionDate,

        diagnosisContext:
          diagnosisContext
            ? String(
                diagnosisContext
              )
                .trim()
                .slice(0, 500)
            : "",

        followUpDate:
          finalFollowUpDate,

        medicines:
          normalizedMedicines,

        patientNotes:
          patientNotes
            ? String(patientNotes)
                .trim()
                .slice(0, 1500)
            : "",

        doctorInstructions:
          doctorInstructions
            ? String(
                doctorInstructions
              )
                .trim()
                .slice(0, 1500)
            : "",

        status: "active",
      });

    /*
     * Create initial reminder records.
     */
    await generateMedicationLogs(
      prescription
    );

    const populated =
      await Prescription.findById(
        prescription._id
      )
        .populate(
          "doctor",
          "name email specialization"
        )
        .lean();

    return res.status(201).json({
      success: true,
      message:
        "Prescription created successfully.",
      data: populated,
    });
  } catch (error) {
    console.error(
      "Create prescription error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create the prescription.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET MY PRESCRIPTIONS
|--------------------------------------------------------------------------
| GET /api/prescriptions
|--------------------------------------------------------------------------
*/

export async function getMyPrescriptions(
  req,
  res
) {
  try {
    const {
      status = "all",
    } = req.query;

    const query = {
      patient: req.user._id,
    };

    if (
      [
        "active",
        "completed",
        "archived",
      ].includes(status)
    ) {
      query.status = status;
    }

    const prescriptions =
      await Prescription.find(query)
        .populate(
          "doctor",
          "name email specialization"
        )
        .sort({
          prescriptionDate: -1,
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error(
      "Get prescriptions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your prescriptions.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET SINGLE PRESCRIPTION
|--------------------------------------------------------------------------
| GET /api/prescriptions/:id
|--------------------------------------------------------------------------
*/

export async function getPrescriptionById(
  req,
  res
) {
  try {
    const prescription =
      await Prescription.findOne({
        _id: req.params.id,
        patient: req.user._id,
      })
        .populate(
          "doctor",
          "name email specialization"
        )
        .lean();

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message:
          "Prescription not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error(
      "Get prescription error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve the prescription.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PATIENT NOTES
|--------------------------------------------------------------------------
| PATCH /api/prescriptions/:id/notes
|--------------------------------------------------------------------------
*/

export async function updatePatientNotes(
  req,
  res
) {
  try {
    const {
      patientNotes,
    } = req.body;

    const prescription =
      await Prescription.findOneAndUpdate(
        {
          _id: req.params.id,
          patient: req.user._id,
        },
        {
          $set: {
            patientNotes:
              patientNotes
                ? String(
                    patientNotes
                  )
                    .trim()
                    .slice(0, 1500)
                : "",
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message:
          "Prescription not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Your prescription note was saved.",
      data: prescription,
    });
  } catch (error) {
    console.error(
      "Update prescription note error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save your prescription note.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| STOP ONE MEDICINE
|--------------------------------------------------------------------------
| PATCH /api/prescriptions/:prescriptionId/medicines/:medicineId/stop
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Stopping one medicine does NOT delete the prescription.
| Other active medicines remain active.
|--------------------------------------------------------------------------
*/

export async function stopMedicine(
  req,
  res
) {
  try {
    const {
      reason = "",
    } = req.body;

    const prescription =
      await Prescription.findOne({
        _id:
          req.params.prescriptionId,

        patient:
          req.user._id,
      });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message:
          "Prescription not found.",
      });
    }

    const medicine =
      prescription.medicines.id(
        req.params.medicineId
      );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message:
          "Medicine not found.",
      });
    }

    if (
      medicine.status ===
      "stopped"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${medicine.name} is already stopped.`,
      });
    }

    /*
     * Stop ONLY this medicine.
     */
    medicine.status =
      "stopped";

    medicine.stoppedAt =
      new Date();

    medicine.stoppedReason =
      String(reason || "")
        .trim()
        .slice(0, 300);

    medicine.remindersEnabled =
      false;

    /*
     * Keep prescription active if at least
     * one other medicine is still active.
     */
    const hasActiveMedicine =
      prescription.medicines.some(
        (item) =>
          item.status ===
          "active"
      );

    prescription.status =
      hasActiveMedicine
        ? "active"
        : "completed";

    await prescription.save();

    /*
     * Remove only future reminders belonging
     * to the stopped medicine.
     *
     * We do NOT mark them as skipped because
     * the patient did not skip those doses.
     */
    await MedicationLog.deleteMany({
      prescription:
        prescription._id,

      medicineId:
        medicine._id,

      patient:
        req.user._id,

      status: {
        $in: [
          "scheduled",
          "snoozed",
        ],
      },

      scheduledDate: {
        $gte: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message:
        `${medicine.name} has been stopped. ` +
        `Only its future reminders were disabled.`,

      data: prescription,
    });
  } catch (error) {
    console.error(
      "Stop medicine error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to stop the medicine.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE PRESCRIPTION
|--------------------------------------------------------------------------
| DELETE /api/prescriptions/:id
|--------------------------------------------------------------------------
*/

export async function deletePrescription(
  req,
  res
) {
  try {
    const prescription =
      await Prescription.findOne({
        _id: req.params.id,
        patient: req.user._id,
      });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message:
          "Prescription not found.",
      });
    }

    /*
     * Delete its medication logs too,
     * otherwise old logs would continue
     * affecting adherence.
     */
    await MedicationLog.deleteMany({
      prescription:
        prescription._id,

      patient:
        req.user._id,
    });

    await Prescription.deleteOne({
      _id: prescription._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Prescription deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete prescription error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete the prescription.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| COMPLETE PRESCRIPTION
|--------------------------------------------------------------------------
| PATCH /api/prescriptions/:id/complete
|--------------------------------------------------------------------------
*/

export async function completePrescription(
  req,
  res
) {
  try {
    const prescription =
      await Prescription.findOne({
        _id: req.params.id,
        patient: req.user._id,
      });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message:
          "Prescription not found.",
      });
    }

    prescription.status =
      "completed";

    prescription.medicines.forEach(
      (medicine) => {
        if (
          medicine.status ===
          "active"
        ) {
          medicine.status =
            "completed";

          medicine.remindersEnabled =
            false;
        }
      }
    );

    await prescription.save();

    /*
     * Remove future reminders because
     * the entire prescription is completed.
     */
    await MedicationLog.deleteMany({
      prescription:
        prescription._id,

      patient:
        req.user._id,

      status: {
        $in: [
          "scheduled",
          "snoozed",
        ],
      },

      scheduledDate: {
        $gte: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Prescription marked as completed.",
      data: prescription,
    });
  } catch (error) {
    console.error(
      "Complete prescription error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete the prescription.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GENERATE MEDICATION LOGS
|--------------------------------------------------------------------------
|
| Creates a reasonable rolling reminder horizon.
|--------------------------------------------------------------------------
*/

async function generateMedicationLogs(
  prescription
) {
  const now =
    new Date();

  const horizon =
    new Date(now);

  horizon.setDate(
    horizon.getDate() + 60
  );

  const logs = [];

  for (
    const medicine of
      prescription.medicines
  ) {
    if (
      medicine.frequency ===
        "as_needed" ||
      !medicine.remindersEnabled ||
      medicine.status !==
        "active"
    ) {
      continue;
    }

    const start =
      new Date(
        medicine.startDate
      );

    const treatmentEnd =
      medicine.endDate
        ? new Date(
            medicine.endDate
          )
        : horizon;

    const effectiveEnd =
      treatmentEnd < horizon
        ? treatmentEnd
        : horizon;

    const firstDate =
      new Date(start);

    firstDate.setHours(
      0,
      0,
      0,
      0
    );

    const today =
      new Date(now);

    today.setHours(
      0,
      0,
      0,
      0
    );

    const scheduleStart =
      firstDate > today
        ? firstDate
        : today;

    /*
     * Weekly medicines.
     */
    if (
      medicine.frequency ===
      "once_weekly"
    ) {
      const targetDay =
        firstDate.getDay();

      const currentDay =
        scheduleStart.getDay();

      let daysUntil =
        targetDay -
        currentDay;

      if (daysUntil < 0) {
        daysUntil += 7;
      }

      scheduleStart.setDate(
        scheduleStart.getDate() +
          daysUntil
      );

      while (
        scheduleStart <=
          effectiveEnd &&
        scheduleStart <=
          horizon
      ) {
        addLogsForDate(
          logs,
          prescription,
          medicine,
          scheduleStart
        );

        scheduleStart.setDate(
          scheduleStart.getDate() +
            7
        );
      }

      continue;
    }

    /*
     * Daily/custom schedules.
     */
    const currentDate =
      new Date(scheduleStart);

    while (
      currentDate <=
        effectiveEnd &&
      currentDate <=
        horizon
    ) {
      addLogsForDate(
        logs,
        prescription,
        medicine,
        currentDate
      );

      currentDate.setDate(
        currentDate.getDate() +
          1
      );
    }
  }

  if (logs.length === 0) {
    return;
  }

  try {
    await MedicationLog.insertMany(
      logs,
      {
        ordered: false,
      }
    );
  } catch (error) {
    console.error(
      "Medication log generation error:",
      error
    );
  }
}

/*
|--------------------------------------------------------------------------
| ADD SCHEDULE LOGS FOR ONE DATE
|--------------------------------------------------------------------------
*/

function addLogsForDate(
  logs,
  prescription,
  medicine,
  date
) {
  const schedules =
    medicine.schedules?.filter(
      (schedule) =>
        schedule.enabled
    ) || [];

  const now =
    new Date();

  for (
    const schedule of
      schedules
  ) {
    const scheduledDate =
      new Date(date);

    const [
      hour,
      minute,
    ] =
      schedule.time
        .split(":")
        .map(Number);

    scheduledDate.setHours(
      hour,
      minute,
      0,
      0
    );

    /*
     * Keep today's past reminder visible
     * as "missed" instead of deleting it.
     */
    const status =
      scheduledDate < now
        ? "missed"
        : "scheduled";

    logs.push({
      patient:
        prescription.patient,

      prescription:
        prescription._id,

      medicineId:
        medicine._id,

      medicineName:
        medicine.name,

      dosage:
        medicine.dosage,

      scheduledDate,

      scheduledTime:
        schedule.time,

      scheduleLabel:
        schedule.label,

      foodInstruction:
        medicine.foodInstruction,

      status,
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET TODAY'S MEDICATION LOGS
|--------------------------------------------------------------------------
| GET /api/prescriptions/medications/today
|--------------------------------------------------------------------------
*/

export async function getTodaysMedicationLogs(
  req,
  res
) {
  try {
    const start =
      new Date();

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 1
    );

    /*
     * Generate today's reminders for
     * all prescriptions that still contain
     * active medicines.
     */
    const activePrescriptions =
      await Prescription.find({
        patient:
          req.user._id,

        status: "active",

        medicines: {
          $elemMatch: {
            status: "active",
            remindersEnabled: true,
          },
        },
      });

    for (
      const prescription of
        activePrescriptions
    ) {
      await ensureTodayLogs(
        prescription
      );
    }

    /*
     * IMPORTANT:
     *
     * Return every relevant status for today.
     * The UI can therefore show:
     *
     * Upcoming
     * Taken
     * Skipped
     * Snoozed
     * Missed
     *
     * instead of making the dose disappear.
     */
    const logs =
      await MedicationLog.find({
        patient:
          req.user._id,

        scheduledDate: {
          $gte: start,
          $lt: end,
        },
      })
        .sort({
          scheduledDate: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(
      "Get today's medication logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve today's medication schedule.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| ENSURE TODAY'S LOGS
|--------------------------------------------------------------------------
*/

async function ensureTodayLogs(
  prescription
) {
  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const tomorrow =
    new Date(today);

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const existing =
    await MedicationLog.find({
      prescription:
        prescription._id,

      patient:
        prescription.patient,

      scheduledDate: {
        $gte: today,
        $lt: tomorrow,
      },
    }).select(
      "medicineId scheduledTime status"
    );

  const existingKeys =
    new Set(
      existing.map(
        (item) =>
          `${item.medicineId}-${item.scheduledTime}`
      )
    );

  const newLogs = [];

  const now =
    new Date();

  for (
    const medicine of
      prescription.medicines
  ) {
    if (
      medicine.status !==
        "active" ||
      !medicine.remindersEnabled ||
      medicine.frequency ===
        "as_needed"
    ) {
      continue;
    }

    const start =
      new Date(
        medicine.startDate
      );

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end =
      medicine.endDate
        ? new Date(
            medicine.endDate
          )
        : null;

    if (
      today < start
    ) {
      continue;
    }

    if (
      end &&
      today > end
    ) {
      continue;
    }

    /*
     * Weekly treatment.
     */
    if (
      medicine.frequency ===
      "once_weekly"
    ) {
      if (
        today.getDay() !==
        start.getDay()
      ) {
        continue;
      }
    }

    for (
      const schedule of
        medicine.schedules || []
    ) {
      if (!schedule.enabled) {
        continue;
      }

      const key =
        `${medicine._id}-${schedule.time}`;

      if (
        existingKeys.has(key)
      ) {
        continue;
      }

      const scheduledDate =
        new Date(today);

      const [
        hour,
        minute,
      ] =
        schedule.time
          .split(":")
          .map(Number);

      scheduledDate.setHours(
        hour,
        minute,
        0,
        0
      );

      /*
       * Past dose = missed.
       * Future dose = scheduled.
       *
       * This ensures today's schedule
       * never silently disappears.
       */
      const status =
        scheduledDate < now
          ? "missed"
          : "scheduled";

      newLogs.push({
        patient:
          prescription.patient,

        prescription:
          prescription._id,

        medicineId:
          medicine._id,

        medicineName:
          medicine.name,

        dosage:
          medicine.dosage,

        scheduledDate,

        scheduledTime:
          schedule.time,

        scheduleLabel:
          schedule.label,

        foodInstruction:
          medicine.foodInstruction,

        status,
      });
    }
  }

  if (newLogs.length === 0) {
    return;
  }

  try {
    await MedicationLog.insertMany(
      newLogs,
      {
        ordered: false,
      }
    );
  } catch (error) {
    console.error(
      "Ensure medication logs error:",
      error
    );
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE MEDICATION LOG STATUS
|--------------------------------------------------------------------------
| PATCH /api/prescriptions/medications/:logId/status
|--------------------------------------------------------------------------
*/

export async function updateMedicationLogStatus(
  req,
  res
) {
  try {
    const {
      status,
      note = "",
    } = req.body;

    const validStatuses = [
      "taken",
      "skipped",
      "snoozed",
    ];

    if (
      !validStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid medication status.",
      });
    }

    const log =
      await MedicationLog.findOne({
        _id: req.params.logId,
        patient: req.user._id,
      });

    if (!log) {
      return res.status(404).json({
        success: false,
        message:
          "Medication reminder not found.",
      });
    }

    /*
     * Taken and skipped are final states
     * for that particular dose.
     */
    if (
      log.status === "taken" ||
      log.status === "skipped"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This medication dose has already been recorded.",
      });
    }

    const now =
      new Date();

    if (
      status === "taken"
    ) {
      log.status =
        "taken";

      log.takenAt =
        now;

      log.snoozedUntil =
        null;
    }

    if (
      status === "skipped"
    ) {
      log.status =
        "skipped";

      log.skippedAt =
        now;

      log.snoozedUntil =
        null;
    }

    if (
      status === "snoozed"
    ) {
      log.status =
        "snoozed";

      const snoozeMinutes =
        Number(
          req.body.snoozeMinutes
        );

      const safeSnoozeMinutes =
        Number.isFinite(
          snoozeMinutes
        ) &&
        snoozeMinutes >= 5 &&
        snoozeMinutes <= 240
          ? snoozeMinutes
          : 30;

      const snoozedUntil =
        new Date(now);

      snoozedUntil.setMinutes(
        snoozedUntil.getMinutes() +
          safeSnoozeMinutes
      );

      log.snoozedUntil =
        snoozedUntil;
    }

    if (
      typeof note ===
      "string"
    ) {
      log.note =
        note
          .trim()
          .slice(0, 300);
    }

    await log.save();

    return res.status(200).json({
      success: true,
      message:
        `Medication marked as ${status}.`,
      data: log,
    });
  } catch (error) {
    console.error(
      "Update medication log error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update the medication reminder.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET MEDICATION ADHERENCE
|--------------------------------------------------------------------------
| GET /api/prescriptions/medications/adherence
|--------------------------------------------------------------------------
*/

export async function getMedicationAdherence(
  req,
  res
) {
  try {
    const days =
      Math.min(
        Math.max(
          Number(
            req.query.days
          ) || 30,
          1
        ),
        180
      );

    /*
     * Previous boundary:
     * start of the current day.
     */
    const end =
      new Date();

    /*
     * Start is N days before the current day.
     */
    const start =
      new Date();

    start.setHours(
      0,
      0,
      0,
      0
    );

    start.setDate(
      start.getDate() -
        (days - 1)
    );

    /*
     * Only count doses that have actually
     * become due. Future reminder records must
     * not reduce current adherence.
     */
    const logs =
      await MedicationLog.find({
        patient:
          req.user._id,

        scheduledDate: {
          $gte: start,
          $lte: end,
        },
      }).lean();

    const scheduled =
      logs.filter(
        (log) =>
          [
            "scheduled",
            "taken",
            "skipped",
            "snoozed",
            "missed",
          ].includes(
            log.status
          )
      ).length;

    const taken =
      logs.filter(
        (log) =>
          log.status ===
          "taken"
      ).length;

    const skipped =
      logs.filter(
        (log) =>
          log.status ===
          "skipped"
      ).length;

    const missed =
      logs.filter(
        (log) =>
          log.status ===
          "missed"
      ).length;

    const snoozed =
      logs.filter(
        (log) =>
          log.status ===
          "snoozed"
      ).length;

    const adherence =
      scheduled > 0
        ? Math.round(
            (taken /
              scheduled) *
              100
          )
        : 0;

    return res.status(200).json({
      success: true,

      data: {
        periodDays:
          days,

        scheduled,

        taken,

        skipped,

        missed,

        snoozed,

        adherence,
      },
    });
  } catch (error) {
  console.error(
    "Create prescription error:",
    error
  );

  return res.status(500).json({
    success: false,
    message:
      error.message ||
      "Unable to create the prescription.",
  });
}
}