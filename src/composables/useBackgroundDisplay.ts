// src/composables/useBackgroundDisplay.ts

import { computed, type MaybeRef, unref } from "vue";
import { useLocalManifest } from "./useLocalManifest";
import { useFileSystemStore } from "@/features/FileSystem/FileSystem.store";

/**
 * 背景显示 Hook
 * 负责获取当前选中背景的显示信息（用于 UI）
 * @param contextPath 上下文路径（文件路径），会自动解析为 packageName
 */
export function useBackgroundDisplay(contextPath: MaybeRef<string | null>) {
  const fsStore = useFileSystemStore();
  
  // 将 contextPath 转换为角色名称
  const packageName = computed(() => {
    const path = unref(contextPath);
    if (!path) return null;
    try {
      return fsStore.resolvePackageName(path);
    } catch (e) {
      console.warn("[useBackgroundDisplay] Failed to resolve package name:", e);
      return null;
    }
  });
  
  const manifest = useLocalManifest(packageName);

  // 获取背景路径
  const activeBackgroundPath = computed(() => {
    return manifest.manifest.value?.backgroundPath || null;
  });

  // 计算背景显示信息
  const background = computed(() => {
    const path = activeBackgroundPath.value;
    if (!path) return null;

    // 简单判断类型，实际应读取文件头或元数据
    const isVideo = path.endsWith(".mp4") || path.endsWith(".webm");

    // 这一步是将虚拟路径转换为浏览器可访问的 URL
    // 使用 resolvePath 获取节点，然后使用 url 属性
    const node = fsStore.resolvePath(path);
    const src = node?.url || path;

    return {
      type: isVideo ? "video" : "image",
      src: src,
      mode: "cover", // 默认模式
    };
  });

  return {
    background,
  };
}

