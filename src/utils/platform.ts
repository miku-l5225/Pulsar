// src/utils/platform.ts
import { type as getOsType } from "@tauri-apps/plugin-os";

const osType = getOsType();

export function isMobile(): boolean {
  return osType === "ios" || osType === "android";
}
