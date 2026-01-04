// src/composables/useBackground.ts

import { computed, type MaybeRef } from "vue";
import { useLocalManifest } from "./useLocalManifest";
import {
  type FolderResourceItem,
  useResourceFolder,
} from "./useResourceFolder";

// 扩展资源项类型
export interface BackgroundResourceItem extends FolderResourceItem {
  isSelected: boolean;
  extraDisplayText: string;
  toggleSelection?: () => void;
}

/**
 * 使用背景资源（background 子文件夹）
 * @param packageName 角色名称，例如 "Alice"
 */
export function useBackground(packageName: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(packageName, "background");
  const manifest = useLocalManifest(packageName);

  const resources = computed<BackgroundResourceItem[]>(() => {
    return items.value.map((item) => {
      const selected = manifest.isBackgroundSelected(item.path);
      return {
        ...item,
        isSelected: selected,
        extraDisplayText: selected ? "当前背景" : "",
        toggleSelection: () => {
          if (selected) {
            manifest.clearBackground();
          } else {
            manifest.setBackground(item.path);
          }
        },
      };
    });
  });

  return { items: resources, actions };
}

