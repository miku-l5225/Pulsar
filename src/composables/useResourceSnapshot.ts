// src/composables/useResourceSnapshot.ts

import { computed, type MaybeRef, unref } from "vue";
import { createExecuteContext, type ResourceSnapshot } from "./useExecuteContext";
import { useFileContent } from "@/features/FileSystem/composables/useFileContent";
import { useLocalManifest, useSetting, useModelConfig } from "./index";
import { useFileSystemStore } from "@/features/FileSystem/FileSystem.store";

/**
 * 资源快照 Hook
 * 负责读取 Manifest 中的选中项，加载对应的文件内容，并组装执行上下文快照
 * @param contextPath 上下文路径（文件路径），会自动解析为 packageName
 */
export function useResourceSnapshot(contextPath: MaybeRef<string | null>) {
  const fsStore = useFileSystemStore();
  
  // 将 contextPath 转换为角色名称
  const packageName = computed(() => {
    const path = unref(contextPath);
    if (!path) return null;
    try {
      return fsStore.resolvePackageName(path);
    } catch (e) {
      console.warn("[useResourceSnapshot] Failed to resolve package name:", e);
      return null;
    }
  });
  
  const manifest = useLocalManifest(packageName);

  // --- 1. 获取选中资源的路径 ---

  // 角色 (取 selection.character 的第一个)
  const activeCharacterPath = computed(() => {
    const list = manifest.manifest.value?.selection?.character;
    return list && list.length > 0 ? list[0] : null;
  });

  // 预设 (取 selection.preset 的第一个)
  const activePresetPath = computed(() => {
    const list = manifest.manifest.value?.selection?.preset;
    return list && list.length > 0 ? list[0] : null;
  });

  // Lorebooks (列表)
  const activeLorebookPaths = computed(() => {
    return manifest.manifest.value?.selection?.lorebook || [];
  });

  // --- 2. 加载文件内容 ---

  // 使用 useFileContent 自动处理读取和响应式
  const characterContent = useFileContent(activeCharacterPath);
  const presetContent = useFileContent(activePresetPath);

  // --- 3. 构建 Execution Context Snapshot ---

  /**
   * 获取当前所有资源和配置的快照，用于生成
   */
  const getExecuteContextSnapshot = () => {
    // 1. 准备 Resource 对象
    const resourceSnapshot: ResourceSnapshot = {
      character: [],
      preset: [],
      lorebook: [],
    };

    // 填充角色
    if (activeCharacterPath.value && characterContent.value) {
      resourceSnapshot.character.push({
        path: activeCharacterPath.value,
        content: characterContent.value,
      });
    }

    // 填充预设
    if (activePresetPath.value && presetContent.value) {
      resourceSnapshot.preset.push({
        path: activePresetPath.value,
        content: presetContent.value,
      });
    }

    // 填充 Lorebooks (这里需要确保内容已加载)
    // 从 contentCache 读取文件内容
    activeLorebookPaths.value.forEach((path) => {
      // 从 Store 的 contentCache 读取文件内容
      const content = fsStore.contentCache.get(path);
      if (content) {
        resourceSnapshot.lorebook.push({ path, content });
      }
    });

    // 2. 获取 Store 快照
    // 使用新的 composables
    const { setting } = useSetting();
    const { modelConfig } = useModelConfig();
    const settingSnapshot = unref(setting) || {};
    const modelConfigSnapshot = unref(modelConfig) || {};

    // 3. 调用 createExecuteContext
    // customContext 可以传入一些临时变量
    return createExecuteContext(
      {},
      resourceSnapshot,
      settingSnapshot,
      modelConfigSnapshot
    );
  };

  return {
    getExecuteContextSnapshot,
    // 导出当前激活的路径供调试
    activePaths: {
      character: activeCharacterPath,
      preset: activePresetPath,
      lorebook: activeLorebookPaths,
    },
  };
}

