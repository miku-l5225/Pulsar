// src/composables/useModelConfig.ts

import { computed } from "vue";
import type { ModelConfig } from "@/resources/modelConfig/modelConfig.types";
import { useFileContent } from "@/features/FileSystem/composables/useFileContent";

const MODEL_CONFIG_PATH = "modelConfig.[modelConfig].json";

/**
 * 使用模型配置
 */
export function useModelConfig() {
  const modelConfig = useFileContent<ModelConfig>(
    MODEL_CONFIG_PATH,
    null // 如果没有默认值，可以传入 null
  );

  return {
    modelConfig,
  };
}

