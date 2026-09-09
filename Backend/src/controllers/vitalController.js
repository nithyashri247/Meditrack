import VitalReading from "../models/VitalReading.js";

/*
|--------------------------------------------------------------------------
| Allowed vital types
|--------------------------------------------------------------------------
*/

const ALLOWED_TYPES = [
  "blood_pressure",
  "heart_rate",
  "blood_glucose",
  "spo2",
  "temperature",
  "respiratory_rate",
  "weight",
];

/*
|--------------------------------------------------------------------------
| Helper: calculate informational status
|--------------------------------------------------------------------------
|
| These are application-level signals, NOT medical diagnoses.
| The thresholds are intentionally conservative demo thresholds
| and should not be presented as clinical diagnosis.
|
*/

function calculateStatus(type, reading) {
  if (type === "heart_rate") {
    const value = Number(reading.value);

    if (!Number.isFinite(value)) {
      return "not_assessed";
    }

    if (value >= 50 && value <= 100) {
      return "within_expected_range";
    }

    if (
      (value > 100 && value <= 120) ||
      (value >= 40 && value < 50)
    ) {
      return "needs_attention";
    }

    if (
      (value > 120 && value <= 140) ||
      (value >= 35 && value < 40)
    ) {
      return "priority_review";
    }

    return "urgent";
  }

  if (type === "blood_glucose") {
    const value = Number(reading.value);

    if (!Number.isFinite(value)) {
      return "not_assessed";
    }

    /*
     * For glucose, interpretation depends heavily on context
     * such as fasting/post-meal. We therefore use broad
     * informational categories only.
     */

    if (value >= 70 && value <= 140) {
      return "within_expected_range";
    }

    if (
      (value >= 55 && value < 70) ||
      (value > 140 && value <= 180)
    ) {
      return "needs_attention";
    }

    if (
      (value >= 40 && value < 55) ||
      (value > 180 && value <= 250)
    ) {
      return "priority_review";
    }

    return "urgent";
  }

  if (type === "spo2") {
    const value = Number(reading.value);

    if (!Number.isFinite(value)) {
      return "not_assessed";
    }

    if (value >= 95) {
      return "within_expected_range";
    }

    if (value >= 92 && value < 95) {
      return "needs_attention";
    }

    if (value >= 88 && value < 92) {
      return "priority_review";
    }

    return "urgent";
  }

  if (type === "temperature") {
    const value = Number(reading.value);

    if (!Number.isFinite(value)) {
      return "not_assessed";
    }

    if (value >= 36 && value <= 37.5) {
      return "within_expected_range";
    }

    if (
      (value >= 35 && value < 36) ||
      (value > 37.5 && value <= 38)
    ) {
      return "needs_attention";
    }

    if (
      (value >= 34 && value < 35) ||
      (value > 38 && value <= 39)
    ) {
      return "priority_review";
    }

    return "urgent";
  }

  if (type === "respiratory_rate") {
    const value = Number(reading.value);

    if (!Number.isFinite(value)) {
      return "not_assessed";
    }

    if (value >= 12 && value <= 20) {
      return "within_expected_range";
    }

    if (
      (value >= 10 && value < 12) ||
      (value > 20 && value <= 24)
    ) {
      return "needs_attention";
    }

    if (
      (value >= 8 && value < 10) ||
      (value > 24 && value <= 30)
    ) {
      return "priority_review";
    }

    return "urgent";
  }

  /*
   * Weight does not receive a universal normal/abnormal
   * classification because interpretation depends on
   * individual context such as height, age and trajectory.
   */

  if (type === "weight") {
    return "not_assessed";
  }

  /*
   * Blood pressure
   */

  if (type === "blood_pressure") {
    const systolic = Number(
      reading.systolic
    );

    const diastolic = Number(
      reading.diastolic
    );

    if (
      !Number.isFinite(systolic) ||
      !Number.isFinite(diastolic)
    ) {
      return "not_assessed";
    }

    if (
      systolic < 120 &&
      diastolic < 80
    ) {
      return "within_expected_range";
    }

    if (
      systolic >= 120 &&
      systolic < 140 &&
      diastolic < 90
    ) {
      return "needs_attention";
    }

    if (
      (systolic >= 140 &&
        systolic < 180) ||
      (diastolic >= 90 &&
        diastolic < 120)
    ) {
      return "priority_review";
    }

    return "urgent";
  }

  return "not_assessed";
}

/*
|--------------------------------------------------------------------------
| Validate vital payload
|--------------------------------------------------------------------------
*/

function validateVitalPayload(body) {
  const {
    type,
    value,
    systolic,
    diastolic,
    unit,
  } = body;

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return "Please provide a valid vital type.";
  }

  if (!unit || String(unit).trim().length === 0) {
    return "Please provide a unit.";
  }

  if (type === "blood_pressure") {
    if (
      systolic === undefined ||
      diastolic === undefined
    ) {
      return (
        "Blood pressure requires both systolic and diastolic values."
      );
    }

    if (
      !Number.isFinite(Number(systolic)) ||
      !Number.isFinite(Number(diastolic))
    ) {
      return "Blood pressure values must be valid numbers.";
    }

    if (
      Number(systolic) <= 0 ||
      Number(diastolic) <= 0
    ) {
      return "Blood pressure values must be greater than zero.";
    }
  } else {
    if (value === undefined || value === null) {
      return "Please provide a vital value.";
    }

    if (!Number.isFinite(Number(value))) {
      return "Vital value must be a valid number.";
    }

    if (Number(value) < 0) {
      return "Vital value cannot be negative.";
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| POST /api/vitals
|--------------------------------------------------------------------------
| Create a new vital reading
|--------------------------------------------------------------------------
*/

export async function createVitalReading(
  req,
  res
) {
  try {
    const validationError =
      validateVitalPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      type,
      value,
      systolic,
      diastolic,
      unit,
      note,
      recordedAt,
      source,
    } = req.body;

    /*
     * Never take patient ID from the client.
     * It comes from authenticated middleware.
     */

    const patientId =
      req.user._id;

    const readingData = {
      patient: patientId,
      type,
      unit: String(unit).trim(),
      note:
        typeof note === "string"
          ? note.trim()
          : "",
      recordedAt:
        recordedAt
          ? new Date(recordedAt)
          : new Date(),
      source:
        source || "manual",
    };

    if (type === "blood_pressure") {
      readingData.systolic =
        Number(systolic);

      readingData.diastolic =
        Number(diastolic);
    } else {
      readingData.value =
        Number(value);
    }

    /*
     * Validate recorded date.
     */

    if (
      Number.isNaN(
        readingData.recordedAt.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid recording date.",
      });
    }

    /*
     * Prevent future-dated health readings.
     */

    if (
      readingData.recordedAt >
      new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A health reading cannot be recorded in the future.",
      });
    }

    /*
     * Calculate informational status
     * on the backend.
     */

    readingData.status =
      calculateStatus(
        type,
        readingData
      );

    const reading =
      await VitalReading.create(
        readingData
      );

    return res.status(201).json({
      success: true,
      message:
        "Health reading recorded successfully.",
      data: reading,
    });
  } catch (error) {
    console.error(
      "Create vital reading error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save the health reading.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/vitals
|--------------------------------------------------------------------------
| Get patient's vital history
|--------------------------------------------------------------------------
*/

export async function getVitalReadings(
  req,
  res
) {
  try {
    const {
      type,
      limit = 100,
      startDate,
      endDate,
    } = req.query;

    const query = {
      patient: req.user._id,
    };

    if (
      type &&
      ALLOWED_TYPES.includes(type)
    ) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.recordedAt = {};

      if (startDate) {
        const start =
          new Date(startDate);

        if (
          !Number.isNaN(
            start.getTime()
          )
        ) {
          query.recordedAt.$gte =
            start;
        }
      }

      if (endDate) {
        const end =
          new Date(endDate);

        if (
          !Number.isNaN(
            end.getTime()
          )
        ) {
          end.setHours(
            23,
            59,
            59,
            999
          );

          query.recordedAt.$lte =
            end;
        }
      }
    }

    const safeLimit = Math.min(
      Math.max(
        Number(limit) || 100,
        1
      ),
      250
    );

    const readings =
      await VitalReading.find(query)
        .sort({
          recordedAt: -1,
        })
        .limit(safeLimit)
        .lean();

    return res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    console.error(
      "Get vital readings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your health readings.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/vitals/latest
|--------------------------------------------------------------------------
| Get latest reading for each vital type
|--------------------------------------------------------------------------
*/

export async function getLatestVitals(
  req,
  res
) {
  try {
    const latestReadings =
      await VitalReading.aggregate([
        {
          $match: {
            patient: req.user._id,
          },
        },

        {
          $sort: {
            recordedAt: -1,
          },
        },

        {
          $group: {
            _id: "$type",
            reading: {
              $first: "$$ROOT",
            },
          },
        },

        {
          $replaceRoot: {
            newRoot: "$reading",
          },
        },

        {
          $sort: {
            recordedAt: -1,
          },
        },
      ]);

    return res.status(200).json({
      success: true,
      data: latestReadings,
    });
  } catch (error) {
    console.error(
      "Get latest vitals error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your latest health readings.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/vitals/:id
|--------------------------------------------------------------------------
| Patient can delete their own manually entered reading.
|--------------------------------------------------------------------------
*/

export async function deleteVitalReading(
  req,
  res
) {
  try {
    const reading =
      await VitalReading.findOne({
        _id: req.params.id,
        patient: req.user._id,
      });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message:
          "Health reading not found.",
      });
    }

    await reading.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Health reading deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete vital reading error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete the health reading.",
    });
  }
}