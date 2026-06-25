import { create } from "zustand";

import { CurrencyCode } from "@/types";

type ColorMode = "light" | "dark" | "system";
type ScannerSource = "camera" | "gallery";

type SettingsState = {
  colorMode: ColorMode;
  currency: CurrencyCode;
  notificationsEnabled: boolean;
  upiId: string;
  upiQrUri: string;
  upiQrName: string;
  scannerSource: ScannerSource;
  setColorMode: (colorMode: ColorMode) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setUpiId: (upiId: string) => void;
  setUpiQr: (upiQrUri: string, upiQrName: string) => void;
  setScannerSource: (scannerSource: ScannerSource) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  colorMode: "system",
  currency: "INR",
  notificationsEnabled: true,
  upiId: "",
  upiQrUri: "",
  upiQrName: "",
  scannerSource: "camera",
  setColorMode: (colorMode) => set({ colorMode }),
  setCurrency: (currency) => set({ currency }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setUpiId: (upiId) => set({ upiId }),
  setUpiQr: (upiQrUri, upiQrName) => set({ upiQrUri, upiQrName }),
  setScannerSource: (scannerSource) => set({ scannerSource })
}));
