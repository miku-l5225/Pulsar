// src/resources/lorebook/useLorebookResources.ts

import { computed, type MaybeRef } from "vue";
import { useLocalManifest } from "@/composables/useLocalManifest";
import {
  type FolderResourceItem,
  useResourceFolder,
} from "@/composables/useResourceFolder";

// 扩展资源项类型
export interface LorebookResourceItem extends FolderResourceItem {
  isSelected: boolean;
  extraDisplayText: string;
  toggleSelection?: () => void;
}

/**
 * 使用知识库资源（lorebook 子文件夹）
 * @param packageName 角色名称，例如 "Alice"
 */
export function useLorebookResources(packageName: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(packageName, "lorebook");
  const manifest = useLocalManifest(packageName);

  const resources = computed<LorebookResourceItem[]>(() => {
    return items.value.map((item) => {
      const selected = manifest.isLorebookSelected(item.path);
      return {
        ...item,
        isSelected: selected,
        extraDisplayText: selected ? "已启用" : "",
        toggleSelection: () => manifest.toggleLorebook(item.path),
      };
    });
  });

  return { items: resources, actions };
}

