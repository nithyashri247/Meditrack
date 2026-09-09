import "dotenv/config";
import { connectDatabase } from "./config/db.js";
import Prescription from "./models/Prescription.js";
import MedicationLog from "./models/MedicationLog.js";

async function clearOldPrescriptions() {
  try {
    await connectDatabase();

    const patientEmail =
      "patient@meditrack.demo";

    const User =
      (await import("./models/User.js")).default;

    const patient =
      await User.findOne({
        email: patientEmail,
      });

    if (!patient) {
      console.log(
        "Patient account not found."
      );
      process.exit(1);
    }

    const prescriptions =
      await Prescription.find({
        patient: patient._id,
      }).select("_id doctorName hospitalName");

    console.log(
      `Found ${prescriptions.length} prescription(s).`
    );

    for (const prescription of prescriptions) {
      console.log(
        `Deleting: ${prescription.doctorName || "Unknown doctor"} - ${prescription.hospitalName || "Unknown hospital"}`
      );

      await MedicationLog.deleteMany({
        prescription: prescription._id,
      });

      await Prescription.deleteOne({
        _id: prescription._id,
      });
    }

    console.log(
      "✅ Old prescriptions and their medication logs removed."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Cleanup failed:",
      error
    );

    process.exit(1);
  }
}

clearOldPrescriptions();