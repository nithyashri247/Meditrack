import EmergencyProfile from "../models/EmergencyProfile.js";

/*
|--------------------------------------------------------------------------
| GET MY EMERGENCY PROFILE
|--------------------------------------------------------------------------
| GET /api/emergency-profile
|--------------------------------------------------------------------------
*/

export async function getEmergencyProfile(req, res) {
  try {
    const profile = await EmergencyProfile.findOne({
      patient: req.user._id,
    }).lean();

    /*
     * A new patient may not have a profile yet.
     */
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Emergency profile not created yet.",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error(
      "Get emergency profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load your emergency profile.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| CREATE / UPDATE MY EMERGENCY PROFILE
|--------------------------------------------------------------------------
| PUT /api/emergency-profile
|--------------------------------------------------------------------------
*/

export async function saveEmergencyProfile(req, res) {
  try {
    const {
      bloodGroup = "",
      allergies = [],
      medicalConditions = [],
      importantNotes = "",
      emergencyContacts = [],
      allowAuthorizedDoctors = true,
      allowEmergencyContactAlert = true,
    } = req.body;

    /*
     * ------------------------------------------------------
     * CLEAN ALLERGIES
     * ------------------------------------------------------
     */

    const cleanAllergies = Array.isArray(allergies)
      ? [
          ...new Set(
            allergies
              .map((item) =>
                String(item || "").trim()
              )
              .filter(Boolean)
          ),
        ]
      : [];

    /*
     * ------------------------------------------------------
     * CLEAN MEDICAL CONDITIONS
     * ------------------------------------------------------
     */

    const cleanConditions = Array.isArray(
      medicalConditions
    )
      ? [
          ...new Set(
            medicalConditions
              .map((item) =>
                String(item || "").trim()
              )
              .filter(Boolean)
          ),
        ]
      : [];

    /*
     * ------------------------------------------------------
     * CLEAN EMERGENCY CONTACTS
     * ------------------------------------------------------
     */

    const cleanContacts = Array.isArray(
      emergencyContacts
    )
      ? emergencyContacts
          .filter(Boolean)
          .map((contact) => ({
            name: String(
              contact.name || ""
            ).trim(),

            relationship: String(
              contact.relationship || ""
            ).trim(),

            phone: String(
              contact.phone || ""
            ).trim(),

            alternatePhone: String(
              contact.alternatePhone || ""
            ).trim(),

            isPrimary:
              contact.isPrimary === true,
          }))
          .filter(
            (contact) =>
              contact.name &&
              contact.relationship &&
              contact.phone
          )
      : [];

    /*
     * ------------------------------------------------------
     * ENSURE ONLY ONE PRIMARY CONTACT
     * ------------------------------------------------------
     */

    let primaryFound = false;

    cleanContacts.forEach((contact) => {
      if (contact.isPrimary && !primaryFound) {
        primaryFound = true;
      } else {
        contact.isPrimary = false;
      }
    });

    /*
     * If contacts exist but none is primary,
     * make the first contact primary.
     */

    if (
      cleanContacts.length > 0 &&
      !primaryFound
    ) {
      cleanContacts[0].isPrimary = true;
    }

    /*
     * ------------------------------------------------------
     * SAVE
     * ------------------------------------------------------
     */

    const profile =
      await EmergencyProfile.findOneAndUpdate(
        {
          patient: req.user._id,
        },
        {
          $set: {
            bloodGroup: String(
              bloodGroup || ""
            ).trim(),

            allergies: cleanAllergies,

            medicalConditions:
              cleanConditions,

            importantNotes: String(
              importantNotes || ""
            ).trim(),

            emergencyContacts:
              cleanContacts,

            allowAuthorizedDoctors:
              allowAuthorizedDoctors !== false,

            allowEmergencyContactAlert:
              allowEmergencyContactAlert !== false,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      ).lean();

    return res.status(200).json({
      success: true,
      message:
        "Emergency profile saved successfully.",
      data: profile,
    });
  } catch (error) {
    console.error(
      "Save emergency profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save your emergency profile.",
    });
  }
}