const multer = require("multer");
const path = require("path");

const validateFile = (
  allowedExtensions,
  allowedMimeTypes,
  maxSize,
  fieldName
) => {
  return (req, res, next) => {
    const upload = multer({
      storage: multer.diskStorage({}),
      limits: { fileSize: maxSize },
      fileFilter: (req, file, cb) => {
        if (!file) {
          return cb(new Error("No file uploaded"), false);
        }

        // Get file extension
        const fileExt = path.extname(file.originalname).toLowerCase();
        // Check MIME type and file extension
        const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
        const isValidExtension = allowedExtensions.test(fileExt);

        if (isValidMimeType && isValidExtension) {
          return cb(null, true);
        }

        return cb(
          new Error(
            `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`
          ),
          false
        );
      },
    }).single(fieldName);

    upload(req, res, (err) => {
      if (err) {
        // Handle the file size error specifically
        if (
          err instanceof multer.MulterError &&
          err.code === "LIMIT_FILE_SIZE"
        ) {
          return res.status(400).json({
            status: "fail",
            data: {
              message: `File is too large. Max size allowed: ${Math.ceil(
                maxSize / (1024 * 1024)
              )} MB.`,
            },
          });
        }

        return res.status(400).json({
          status: "fail",
          data: {
            message: err.message || "File upload error",
          },
        });
      }
      next();
    });
  };
};

module.exports = validateFile;
