// src/features/FileSystem/composables/usePackageRoot.ts
import { computed, type MaybeRef, unref } from "vue";
import { useFileSystemStore } from "@/features/FileSystem/FileSystem.store";

/**
 * @deprecated 使用 useLocalManifest 或其他新的 composables 替代
 * 此函数保留用于向后兼容
 */
export function usePackageRoot(path: MaybeRef<string | null>) {
  const store = useFileSystemStore();

  const packageRoot = computed(() => {
    const currentPath = unref(path);
    if (!currentPath || !store.isInitialized) return null;
    try {
      // 使用新的 resolvePackageName 和 getPackageSubfolder
      const packageName = store.resolvePackageName(currentPath);
      return store.getPackageSubfolder(packageName);
    } catch (_) {
      console.warn(
        `[usePackageRoot] Could not resolve package root for: ${currentPath}`
      );
      return null;
    }
  });

  return packageRoot;
}
