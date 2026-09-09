import fs from "fs/promises";
import path from "path";

import MedicalRecord from "../models/MedicalRecord.js";

/*
|--------------------------------------------------------------------------
| Allowed categories
|--------------------------------------------------------------------------
*/

const ALLOWED_CATEGORIES = [
  "lab_report",
  "scan",
  "prescription",
  "discharge_summary",
  "consultation",
  "vaccination",
  "other",
];

/*
|--------------------------------------------------------------------------
| GET MY MEDICAL RECORDS
|--------------------------------------------------------------------------
|
| Returns only records belonging to the authenticated patient.
|
*/

export async function getMyMedicalRecords(
  req,
  res
) {
  try {
    const {
      category,
      status = "active",
    } = req.query;

    const query = {
      patient: req.user._id,
      status,
    };

    if (
      category &&
      ALLOWED_CATEGORIES.includes(category)
    ) {
      query.category = category;
    }

    const records =
      await MedicalRecord.find(query)
        .sort({
          documentDate: -1,
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error(
      "Get medical records error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your medical records.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET SINGLE RECORD METADATA
|--------------------------------------------------------------------------
*/

export async function getMedicalRecordById(
  req,
  res
) {
  try {
    const record =
      await MedicalRecord.findOne({
        _id: req.params.id,
        patient: req.user._id,
      }).lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message:
          "Medical record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error(
      "Get medical record error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve the medical record.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| CREATE MEDICAL RECORD
|--------------------------------------------------------------------------
|
| req.file is supplied by the upload middleware.
|
*/

export async function uploadMedicalRecord(
  req,
  res
) {
  try {
    /*
     * File must exist.
     */

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a medical document to upload.",
      });
    }

    const {
      title,
      category,
      description,
      doctorName,
      hospitalName,
      documentDate,
      visibility,
    } = req.body;

    /*
     * Required metadata.
     */

    if (
      !title ||
      !String(title).trim()
    ) {
      await safelyDeleteFile(
        req.file.path
      );

      return res.status(400).json({
        success: false,
        message:
          "Document title is required.",
      });
    }

    if (
      !category ||
      !ALLOWED_CATEGORIES.includes(
        category
      )
    ) {
      await safelyDeleteFile(
        req.file.path
      );

      return res.status(400).json({
        success: false,
        message:
          "Please select a valid document category.",
      });
    }

    /*
     * Validate document date.
     */

    let parsedDocumentDate = null;

    if (documentDate) {
      parsedDocumentDate =
        new Date(documentDate);

      if (
        Number.isNaN(
          parsedDocumentDate.getTime()
        )
      ) {
        await safelyDeleteFile(
          req.file.path
        );

        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid document date.",
        });
      }

      /*
       * A medical document should not be
       * dated in the future.
       */

      if (
        parsedDocumentDate >
        new Date()
      ) {
        await safelyDeleteFile(
          req.file.path
        );

        return res.status(400).json({
          success: false,
          message:
            "Document date cannot be in the future.",
        });
      }
    }

    /*
     * Visibility is controlled by the server.
     */

    const safeVisibility =
      visibility ===
        "authorized_care"
        ? "authorized_care"
        : "private";

    /*
     * Prevent unsafe names from being
     * exposed through metadata.
     */

    const safeOriginalName =
      path
        .basename(
          req.file.originalname
        )
        .slice(0, 255);

    /*
     * Create database record.
     */

    const record =
      await MedicalRecord.create({
        patient: req.user._id,

        title:
          String(title)
            .trim()
            .slice(0, 150),

        category,

        description:
          typeof description ===
          "string"
            ? description
                .trim()
                .slice(0, 1000)
            : "",

        doctorName:
          typeof doctorName ===
          "string"
            ? doctorName
                .trim()
                .slice(0, 150)
            : "",

        hospitalName:
          typeof hospitalName ===
          "string"
            ? hospitalName
                .trim()
                .slice(0, 150)
            : "",

        documentDate:
          parsedDocumentDate,

        originalFileName:
          safeOriginalName,

        storedFileName:
          path.basename(
            req.file.filename
          ),

        filePath:
          req.file.path,

        mimeType:
          req.file.mimetype,

        fileSize:
          req.file.size,

        visibility:
          safeVisibility,

        status: "active",

        uploadedAt:
          new Date(),
      });

    return res.status(201).json({
      success: true,
      message:
        "Medical record uploaded successfully.",
      data: record,
    });
  } catch (error) {
    /*
     * If MongoDB creation fails after the
     * file has been uploaded, remove the
     * orphaned file.
     */

    if (req.file?.path) {
      await safelyDeleteFile(
        req.file.path
      );
    }

    console.error(
      "Upload medical record error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to upload the medical record.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE MY MEDICAL RECORD
|--------------------------------------------------------------------------
*/

export async function deleteMedicalRecord(
  req,
  res
) {
  try {
    const record =
      await MedicalRecord.findOne({
        _id: req.params.id,
        patient: req.user._id,
      });

    if (!record) {
      return res.status(404).json({
        success: false,
        message:
          "Medical record not found.",
      });
    }

    /*
     * Delete physical file first.
     */

    await safelyDeleteFile(
      record.filePath
    );

    /*
     * Then delete the metadata.
     */

    await record.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Medical record deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete medical record error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete the medical record.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| ARCHIVE MEDICAL RECORD
|--------------------------------------------------------------------------
|
| Useful when a patient doesn't want to see
| an older record in the active list but
| doesn't want to permanently delete it.
|
*/

export async function archiveMedicalRecord(
  req,
  res
) {
  try {
    const record =
      await MedicalRecord.findOneAndUpdate(
        {
          _id: req.params.id,
          patient: req.user._id,
          status: "active",
        },
        {
          $set: {
            status: "archived",
          },
        },
        {
          new: true,
        }
      );

    if (!record) {
      return res.status(404).json({
        success: false,
        message:
          "Active medical record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Medical record archived successfully.",
      data: record,
    });
  } catch (error) {
    console.error(
      "Archive medical record error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to archive the medical record.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOWNLOAD / VIEW FILE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This endpoint verifies ownership before
| sending the actual document.
|
*/

export async function viewMedicalRecordFile(
  req,
  res
) {
  try {
    const record =
      await MedicalRecord.findOne({
        _id: req.params.id,
        patient: req.user._id,
        status: "active",
      });

    if (!record) {
      return res.status(404).json({
        success: false,
        message:
          "Medical record not found.",
      });
    }

    /*
     * Ensure the stored path exists.
     */

    try {
      await fs.access(
        record.filePath
      );
    } catch {
      return res.status(404).json({
        success: false,
        message:
          "The stored document could not be found.",
      });
    }

    /*
     * Update last access time.
     */

    record.lastAccessedAt =
      new Date();

    await record.save();

    /*
     * Tell the browser what type
     * of document it is.
     */

    res.setHeader(
      "Content-Type",
      record.mimeType
    );

    /*
     * Inline display where the browser
     * supports the file type.
     */

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${sanitizeHeaderFilename(
        record.originalFileName
      )}"`
    );

    return res.sendFile(
      path.resolve(
        record.filePath
      )
    );
  } catch (error) {
    console.error(
      "View medical record file error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to open the medical document.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOWNLOAD FILE
|--------------------------------------------------------------------------
*/

export async function downloadMedicalRecordFile(
  req,
  res
) {
  try {
    const record =
      await MedicalRecord.findOne({
        _id: req.params.id,
        patient: req.user._id,
        status: "active",
      });

    if (!record) {
      return res.status(404).json({
        success: false,
        message:
          "Medical record not found.",
      });
    }

    try {
      await fs.access(
        record.filePath
      );
    } catch {
      return res.status(404).json({
        success: false,
        message:
          "The stored document could not be found.",
      });
    }

    record.lastAccessedAt =
      new Date();

    await record.save();

    return res.download(
      path.resolve(
        record.filePath
      ),
      sanitizeHeaderFilename(
        record.originalFileName
      )
    );
  } catch (error) {
    console.error(
      "Download medical record error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to download the medical document.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

async function safelyDeleteFile(
  filePath
) {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(
      filePath
    );
  } catch (error) {
    /*
     * File may already be deleted.
     * We don't want cleanup failure to
     * crash the application.
     */

    if (error.code !== "ENOENT") {
      console.error(
        "File cleanup error:",
        error
      );
    }
  }
}

function sanitizeHeaderFilename(
  filename
) {
  return path
    .basename(
      String(filename || "medical-record")
    )
    .replace(
      /["\r\n]/g,
      "_"
    )
    .slice(0, 200);
}