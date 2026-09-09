import "dotenv/config";

import { connectDatabase } from "./config/db.js";
import User from "./models/User.js";
import Prescription from "./models/Prescription.js";
import MedicationLog from "./models/MedicationLog.js";

async function resetCurrentPatient() {
  try {
    await connectDatabase();

    // PUT THE EMAIL YOU USE TO LOGIN AS NETHRA N HERE
    const patientEmail = "nethranatarajan@gmail.com";

    const patient = await User.findOne({
      email: patientEmail,
      role: "patient",
    });

    if (!patient) {
      console.log("Patient account not found.");
      process.exit(1);
    }

    const prescriptions = await Prescription.find({
      patient: patient._id,
    }).select("_id");

    console.log(
      `Found ${prescriptions.length} old prescription(s).`
    );

    const deletedLogs =
      await MedicationLog.deleteMany({
        patient: patient._id,
      });

    const deletedPrescriptions =
      await Prescription.deleteMany({
        patient: patient._id,
      });

    console.log(
      `Deleted ${deletedPrescriptions.deletedCount} prescription(s).`
    );

    console.log(
      `Deleted ${deletedLogs.deletedCount} medication log(s).`
    );

    console.log(
      "Patient medication data is now completely clean."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Reset failed:",
      error.message
    );

    process.exit(1);
  }
}

resetCurrentPatient();