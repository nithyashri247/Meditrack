import "dotenv/config";

import { connectDatabase } from "./config/db.js";
import User from "./models/User.js";
import Prescription from "./models/Prescription.js";
import MedicationLog from "./models/MedicationLog.js";

async function resetPatientPrescriptions() {
  try {
    await connectDatabase();

    const patient = await User.findOne({
      email: "patient@meditrack.demo",
      role: "patient",
    });

    if (!patient) {
      console.log(
        "❌ Demo patient not found."
      );
      process.exit(1);
    }

    const prescriptions =
      await Prescription.find({
        patient: patient._id,
      }).select("_id");

    console.log(
      `Found ${prescriptions.length} prescription(s).`
    );

    await MedicationLog.deleteMany({
      patient: patient._id,
    });

    await Prescription.deleteMany({
      patient: patient._id,
    });

    console.log(
      "✅ All old patient prescriptions deleted."
    );

    console.log(
      "✅ All old medication logs deleted."
    );

    console.log(
      "✅ Patient is now ready for a fresh first prescription."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Reset failed:",
      error
    );

    process.exit(1);
  }
}

resetPatientPrescriptions();