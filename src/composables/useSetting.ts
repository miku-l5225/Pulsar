// src/composables/useSetting.ts

import { computed } from "vue";
import type { Setting } from "@/resources/setting/setting.types";
import { useFileContent } from "@/features/FileSystem/composables/useFileContent";

const SETTING_PATH = "setting.[setting].json";

/**
 * 使用全局设置
 */
export function useSetting() {
  const setting = useFileContent<Setting>(
    SETTING_PATH,
    null // 如果没有默认值，可以传入 null
  );

  return {
    setting,
  };
}

