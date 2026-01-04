// src/resources/preset/usePresetResources.ts

import { computed, type MaybeRef } from "vue";
import { useLocalManifest } from "@/composables/useLocalManifest";
import {
  type FolderResourceItem,
  useResourceFolder,
} from "@/composables/useResourceFolder";

// 扩展资源项类型
export interface PresetResourceItem extends FolderResourceItem {
  isSelected: boolean;
  extraDisplayText: string;
  toggleSelection?: () => void;
}

/**
 * 使用预设资源（preset 子文件夹）
 * @param packageName 角色名称，例如 "Alice"
 */
export function usePresetResources(packageName: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(packageName, "preset");
  const manifest = useLocalManifest(packageName);

  const resources = computed<PresetResourceItem[]>(() => {
    return items.value.map((item) => {
      const selected = manifest.isPresetSelected(item.path);
      return {
        ...item,
        isSelected: selected,
        extraDisplayText: selected ? "默认预设" : "",
        toggleSelection: () => manifest.togglePreset(item.path),
      };
    });
  });

  return { items: resources, actions };
}

