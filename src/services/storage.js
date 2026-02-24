import { ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

const MAX_DIMENSION = 1280;
const MAX_BYTES = 400 * 1024;
const TARGET_MIME = "image/webp";

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read image file"));
    };

    img.src = objectUrl;
  });
}

function computeDimensions(width, height) {
  const longEdge = Math.max(width, height);
  if (longEdge <= MAX_DIMENSION) {
    return { width, height };
  }

  const scale = MAX_DIMENSION / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function compressImageForUpload(file) {
  if (!(file instanceof File)) {
    throw new Error("Invalid image file");
  }

  const img = await loadImageFromFile(file);
  const resized = computeDimensions(img.naturalWidth, img.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = resized.width;
  canvas.height = resized.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to process image");
  }

  ctx.drawImage(img, 0, 0, resized.width, resized.height);

  const qualitySteps = [0.82, 0.72, 0.62, 0.52, 0.42, 0.34, 0.28];
  let blob = null;

  for (const quality of qualitySteps) {
    // Compress progressively until we satisfy strict storage budget.
    blob = await canvasToBlob(canvas, TARGET_MIME, quality);
    if (blob.size <= MAX_BYTES) {
      break;
    }
  }

  if (!blob || blob.size > MAX_BYTES) {
    throw new Error("Compressed image is too large. Please choose a smaller image.");
  }

  return {
    blob,
    mimeType: blob.type || TARGET_MIME,
    sizeBytes: blob.size,
    width: resized.width,
    height: resized.height,
  };
}

function generateStoragePath(firebaseUid, incidentId, mimeType) {
  const extension = mimeType === "image/jpeg" ? "jpg" : "webp";
  const ts = Date.now();
  const nonce = Math.random().toString(36).slice(2, 8);
  return `incidents/${firebaseUid}/${incidentId}/${ts}_${nonce}.${extension}`;
}

export async function uploadIncidentImage({ file, firebaseUid, incidentId }) {
  if (!firebaseUid || !incidentId) {
    throw new Error("Missing upload context");
  }

  const compressed = await compressImageForUpload(file);
  const storagePath = generateStoragePath(firebaseUid, incidentId, compressed.mimeType);
  const objectRef = ref(storage, storagePath);

  await uploadBytes(objectRef, compressed.blob, {
    contentType: compressed.mimeType,
  });

  const fileName = file?.name || storagePath.split("/").pop() || "incident-image.webp";

  return {
    storage_path: storagePath,
    file_name: fileName,
    mime_type: compressed.mimeType,
    size_bytes: compressed.sizeBytes,
    width: compressed.width,
    height: compressed.height,
  };
}
