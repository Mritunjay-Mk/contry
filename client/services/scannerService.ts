import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { CATEGORIES } from "@/constants/categories";
import { ExpenseCategory } from "@/types";
import { ExtractedItem, extractBill } from "@/services/billOcr";

export type ScannedBill = {
  totalAmount: number;
  date: string;
  merchantName: string;
  category: ExpenseCategory;
  description: string;
  fingerprint: string;
  items: ExtractedItem[];
  imageUri?: string;
};

type CapturedImage = { base64: string; mediaType: string };

// Opens a hidden file input on web (used for Gallery, and as a camera fallback).
function pickFileWeb(): Promise<CapturedImage | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result);
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve({ base64, mediaType: file.type || "image/jpeg" });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

// Opens the live webcam on web (desktop browsers ignore <input capture>, so we
// use getUserMedia + a capture overlay). Falls back to the file picker if the
// camera is unavailable or permission is denied.
async function captureFromWebcam(): Promise<CapturedImage | null> {
  const media = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  if (!media?.getUserMedia) {
    const origin = typeof window !== "undefined" ? window.location.origin : "this page";
    throw new Error(
      `Browser is blocking camera access on ${origin}. Open the app on http://localhost:8081 ` +
        `(not a LAN IP) or over HTTPS — the camera API only works in a secure context.`
    );
  }

  let stream: MediaStream;
  try {
    stream = await media.getUserMedia({ video: { facingMode: "environment" }, audio: false });
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "NotAllowedError" || name === "SecurityError") {
      throw new Error("Camera permission was denied. Allow camera access in your browser and try again.");
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      throw new Error("No camera was found on this device. Use the Gallery button instead.");
    }
    throw new Error("Could not open the camera. Use the Gallery button, or check your browser camera settings.");
  }

  return new Promise<CapturedImage | null>((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);" +
      "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;";

    const video = document.createElement("video");
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.srcObject = stream;
    video.style.cssText = "max-width:92vw;max-height:70vh;border-radius:12px;background:#000;";
    // Some browsers (incl. Brave) need an explicit play() even with autoplay.
    video.onloadedmetadata = () => {
      video.play().catch(() => undefined);
    };

    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:16px;";

    const makeButton = (label: string, bg: string) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.style.cssText =
        `padding:12px 28px;border:none;border-radius:24px;font-size:16px;` +
        `font-weight:600;color:#fff;cursor:pointer;background:${bg};`;
      return btn;
    };
    const captureBtn = makeButton("Capture", "#22C55E");
    const cancelBtn = makeButton("Cancel", "#64748B");

    const cleanup = () => {
      stream.getTracks().forEach((track) => track.stop());
      overlay.remove();
    };

    captureBtn.onclick = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      cleanup();
      resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };
    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };

    row.append(captureBtn, cancelBtn);
    overlay.append(video, row);
    document.body.append(overlay);
  });
}

function pickImageWeb(useCamera: boolean): Promise<CapturedImage | null> {
  return useCamera ? captureFromWebcam() : pickFileWeb();
}

// Opens the real camera or photo library on native (iOS/Android).
async function pickImageNative(source: "camera" | "gallery"): Promise<CapturedImage | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.5,
    base64: true
  };

  let result: ImagePicker.ImagePickerResult;
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error("Camera permission is required to scan bills.");
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error("Photo library permission is required to scan bills.");
    result = await ImagePicker.launchImageLibraryAsync(options);
  }

  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (!asset.base64) throw new Error("Could not read the selected image.");
  return { base64: asset.base64, mediaType: asset.mimeType ?? "image/jpeg" };
}

async function captureImage(source: "camera" | "gallery"): Promise<CapturedImage | null> {
  if (Platform.OS === "web") {
    return pickImageWeb(source === "camera");
  }
  return pickImageNative(source);
}

function normalizeCategory(value?: string): ExpenseCategory {
  return CATEGORIES.includes(value as ExpenseCategory) ? (value as ExpenseCategory) : "Other";
}

/**
 * Opens the camera/gallery, sends the image to Claude, and returns the
 * extracted bill. Returns null if the user cancels; throws (with a message)
 * on permission denial or OCR failure so the screen can surface an alert.
 */
export async function scanAndExtract(source: "camera" | "gallery"): Promise<ScannedBill | null> {
  const captured = await captureImage(source);
  if (!captured) return null; // user cancelled

  const extracted = await extractBill(captured.base64, captured.mediaType);
  if (!extracted) {
    throw new Error("Could not read this bill. Try a clearer photo.");
  }

  const merchantName = extracted.merchantName?.trim() || "Scanned bill";
  const itemSummary = extracted.items.map((item) => item.name).join(", ");
  const date = new Date().toISOString();

  return {
    totalAmount: extracted.total,
    date,
    merchantName,
    category: normalizeCategory(extracted.category),
    description: itemSummary ? `${merchantName} — ${itemSummary}` : merchantName,
    fingerprint: `${merchantName.toLowerCase()}-${date.slice(0, 10)}-${extracted.total}`,
    items: extracted.items,
    imageUri: `data:${captured.mediaType};base64,${captured.base64}`
  };
}
