import PatientProfile from "../models/PatientProfile.js";

/*
|--------------------------------------------------------------------------
| Calculate profile completion
|--------------------------------------------------------------------------
*/

function calculateProfileCompletion(profile) {
  let completed = 0;
  const total = 10;

  if (profile.dateOfBirth) completed++;
  if (profile.gender) completed++;
  if (
    profile.bloodGroup &&
    profile.bloodGroup !== "unknown"
  ) {
    completed++;
  }

  if (profile.city) completed++;
  if (profile.state) completed++;

  if (
    profile.allergies &&
    profile.allergies.length > 0
  ) {
    completed++;
  }

  if (
    profile.medicalConditions &&
    profile.medicalConditions.length > 0
  ) {
    completed++;
  }

  if (profile.emergencyContact?.name) completed++;
  if (profile.emergencyContact?.phone) completed++;
  if (profile.activityLevel !== "prefer_not_to_say") {
    completed++;
  }

  return Math.round(
    (completed / total) * 100
  );
}

/*
|--------------------------------------------------------------------------
| GET MY PROFILE
|--------------------------------------------------------------------------
*/

export async function getMyProfile(req, res) {
  try {
    let profile = await PatientProfile.findOne({
      user: req.user._id,
    }).populate(
      "user",
      "name email phone"
    );

    /*
     * A patient may have an account but no
     * profile yet. Create an empty profile
     * automatically so the frontend always
     * has something to work with.
     */

    if (!profile) {
      profile = await PatientProfile.create({
        user: req.user._id,
      });

      profile = await PatientProfile.findById(
        profile._id
      ).populate(
        "user",
        "name email phone"
      );
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error(
      "Get patient profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your health profile.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| CREATE / UPDATE MY PROFILE
|--------------------------------------------------------------------------
*/

export async function updateMyProfile(
  req,
  res
) {
  try {
    const {
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      city,
      state,
      allergies,
      medicalConditions,
      previousSurgeries,
      familyHistory,
      smokingStatus,
      alcoholStatus,
      activityLevel,
      emergencyContact,
      criticalNotes,
    } = req.body;

    /*
     * Never accept the user ID from the
     * frontend. We take it from req.user,
     * which was established by JWT verification.
     */

    let profile =
      await PatientProfile.findOne({
        user: req.user._id,
      });

    if (!profile) {
      profile =
        new PatientProfile({
          user: req.user._id,
        });
    }

    /*
     * Update allowed fields only.
     */

    if (dateOfBirth !== undefined) {
      profile.dateOfBirth =
        dateOfBirth || null;
    }

    if (gender !== undefined) {
      profile.gender =
        gender || null;
    }

    if (bloodGroup !== undefined) {
      profile.bloodGroup =
        bloodGroup || "unknown";
    }

    if (address !== undefined) {
      profile.address =
        address?.trim() || "";
    }

    if (city !== undefined) {
      profile.city =
        city?.trim() || "";
    }

    if (state !== undefined) {
      profile.state =
        state?.trim() || "";
    }

    if (Array.isArray(allergies)) {
      profile.allergies =
        allergies
          .map((item) =>
            String(item).trim()
          )
          .filter(Boolean);
    }

    if (
      Array.isArray(
        medicalConditions
      )
    ) {
      profile.medicalConditions =
        medicalConditions
          .map((item) =>
            String(item).trim()
          )
          .filter(Boolean);
    }

    if (
      Array.isArray(
        previousSurgeries
      )
    ) {
      profile.previousSurgeries =
        previousSurgeries
          .map((item) =>
            String(item).trim()
          )
          .filter(Boolean);
    }

    if (Array.isArray(familyHistory)) {
      profile.familyHistory =
        familyHistory
          .map((item) =>
            String(item).trim()
          )
          .filter(Boolean);
    }

    if (smokingStatus !== undefined) {
      profile.smokingStatus =
        smokingStatus;
    }

    if (alcoholStatus !== undefined) {
      profile.alcoholStatus =
        alcoholStatus;
    }

    if (activityLevel !== undefined) {
      profile.activityLevel =
        activityLevel;
    }

    if (
      emergencyContact !==
        undefined &&
      typeof emergencyContact ===
        "object"
    ) {
      profile.emergencyContact = {
        name:
          emergencyContact.name
            ?.trim() || "",
        relationship:
          emergencyContact.relationship
            ?.trim() || "",
        phone:
          emergencyContact.phone
            ?.trim() || "",
      };
    }

    if (criticalNotes !== undefined) {
      profile.criticalNotes =
        criticalNotes?.trim() || "";
    }

    /*
     * Recalculate profile completion
     * every time the patient saves.
     */

    profile.profileCompletionPercentage =
      calculateProfileCompletion(
        profile
      );

    profile.profileCompleted =
      profile.profileCompletionPercentage >=
      80;

    await profile.save();

    const populatedProfile =
      await PatientProfile.findById(
        profile._id
      ).populate(
        "user",
        "name email phone"
      );

    return res.status(200).json({
      success: true,
      message:
        "Health profile updated successfully.",
      data: populatedProfile,
    });
  } catch (error) {
    console.error(
      "Update patient profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update your health profile.",
    });
  }
}