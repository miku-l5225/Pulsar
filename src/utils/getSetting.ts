// src/utils/getSetting.ts

import { useSetting } from "@/composables";

export function getSetting() {
  const { setting } = useSetting();
  return setting;
}
