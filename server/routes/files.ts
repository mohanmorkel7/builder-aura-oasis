import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "public", "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, but could be restricted
    cb(null, true);
  },
});

// Download file by filename
router.get("/download/:filename", async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;

    // Security: prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);

    // Define the uploads directory path
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadsDir, sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      console.log(`Available files in uploads:`, fs.readdirSync(uploadsDir));
      return res.status(404).json({
        error: "File not found",
        requested: sanitizedFilename,
        path: filePath,
      });
    }

    // Get file stats for proper headers
    const stats = fs.statSync(filePath);

    console.log(`Serving file: ${sanitizedFilename} (${stats.size} bytes)`);

    // Set appropriate headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedFilename}"`,
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", stats.size.toString());

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    });
  } catch (error) {
    console.error("Error in file download:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

// Get file info
router.get("/info/:filename", async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const sanitizedFilename = path.basename(filename);
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadsDir, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename: sanitizedFilename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true,
    };

    res.json(fileInfo);
  } catch (error) {
    console.error("Error getting file info:", error);
    res.status(500).json({ error: "Failed to get file info" });
  }
});

export default router;
