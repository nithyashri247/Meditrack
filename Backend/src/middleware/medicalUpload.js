import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

/*
|--------------------------------------------------------------------------
| PRIVATE MEDICAL RECORD STORAGE
|--------------------------------------------------------------------------
|
| Files are stored under the backend's uploads directory.
| We will NOT expose this directory as a public static folder.
|
|--------------------------------------------------------------------------
*/

const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "medical-records"
);

/*
 * Create the folder if it does not exist.
 */

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

/*
|--------------------------------------------------------------------------
| ALLOWED FILE TYPES
|--------------------------------------------------------------------------
*/

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const allowedExtensions = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      callback
    ) => {
      callback(
        null,
        uploadDirectory
      );
    },

    filename: (
      req,
      file,
      callback
    ) => {
      /*
       * Never use the original filename
       * directly as the stored filename.
       */

      const extension =
        path.extname(
          file.originalname
        ).toLowerCase();

      const randomId =
        crypto.randomBytes(16).toString(
          "hex"
        );

      callback(
        null,
        `${Date.now()}-${randomId}${extension}`
      );
    },
  });

/*
|--------------------------------------------------------------------------
| FILE FILTER
|--------------------------------------------------------------------------
*/

function fileFilter(
  req,
  file,
  callback
) {
  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();

  /*
   * Check both MIME type and extension.
   */

  const validMime =
    allowedMimeTypes.has(
      file.mimetype
    );

  const validExtension =
    allowedExtensions.has(
      extension
    );

  if (
    !validMime ||
    !validExtension
  ) {
    return callback(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "medicalDocument"
      )
    );
  }

  callback(null, true);
}

/*
|--------------------------------------------------------------------------
| MULTER CONFIGURATION
|--------------------------------------------------------------------------
|
| 10 MB maximum per document.
|
*/

const medicalUpload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        10 * 1024 * 1024,

      files: 1,
    },
  });

export default medicalUpload;