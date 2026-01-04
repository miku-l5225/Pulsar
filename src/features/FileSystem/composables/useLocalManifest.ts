// src/features/FileSystem/composables/useLocalManifest.ts

import urlJoin from "url-join";
import { computed, type MaybeRef } from "vue";
import { newManifest } from "@/components/EnvironmentSidebar/manifest"; // 假设你有一个默认manifest生成器
import type { ManifestContent } from "@/components/EnvironmentSidebar/manifest.types";
import { useFileContent } from "@/features/FileSystem/composables/useFileContent";
import { usePackageRoot } from "./usePackageRoot";

export function useLocalManifest(path: MaybeRef<string | null>) {
  const root = usePackageRoot(path);

  const manifestPath = computed(() => {
    if (!root.value) return null;
    return urlJoin(root.value.path, "manifest.json");
  });

  // 使用默认值防止读取失败导致 UI 崩溃
  const defaultVal = newManifest();

  return useFileContent<ManifestContent>(manifestPath, defaultVal);
}
