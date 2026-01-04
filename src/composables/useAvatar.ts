// src/composables/useAvatar.ts

import { computed, type MaybeRef, unref } from "vue";
import { useFileContent } from "@/features/FileSystem/composables/useFileContent";
import { useLocalManifest } from "./useLocalManifest";
import { useFileSystemStore } from "@/features/FileSystem/FileSystem.store";

/**
 * 头像 Hook
 * 负责获取当前选中角色的头像
 * @param contextPath 上下文路径（文件路径），会自动解析为 packageName
 */
export function useAvatar(contextPath: MaybeRef<string | null>) {
  const fsStore = useFileSystemStore();
  
  // 将 contextPath 转换为角色名称
  const packageName = computed(() => {
    const path = unref(contextPath);
    if (!path) return null;
    try {
      return fsStore.resolvePackageName(path);
    } catch (e) {
      console.warn("[useAvatar] Failed to resolve package name:", e);
      return null;
    }
  });
  
  const manifest = useLocalManifest(packageName);

  // 获取选中角色的路径
  const activeCharacterPath = computed(() => {
    const list = manifest.manifest.value?.selection?.character;
    return list && list.length > 0 ? list[0] : null;
  });

  // 加载角色内容
  const characterContent = useFileContent(activeCharacterPath);

  // 计算头像源
  const src = computed(() => {
    // 优先使用角色定义的头像
    if (characterContent.value?.avatar) {
      return characterContent.value.avatar;
    }
    // 这里的路径解析可能需要根据你的虚拟文件系统 URL 规则调整
    if (activeCharacterPath.value) {
      // 假设同目录下有 avatar.png
      // 实际项目中可能需要 resolve 逻辑
      return "";
    }
    return ""; // 默认头像
  });

  return {
    src,
  };
}

