// src/resources/character/useCharacterResources.ts

import { computed, type MaybeRef } from "vue";
import type { ResourceSelection } from "@/components/EnvironmentSidebar/manifest.types";
import { useLocalManifest } from "@/composables/useLocalManifest";
import {
  type FolderResourceItem,
  useResourceFolder,
} from "@/composables/useResourceFolder";

// 扩展资源项类型，增加业务状态
export interface CharacterResourceItem extends FolderResourceItem {
  isSelected: boolean;
  extraDisplayText: string;
  toggleSelection?: () => void;
}

/**
 * 使用角色资源（character 子文件夹）
 * 目标路径：character/${packageName}/character/name/index.[character].json
 * @param packageName 角色名称，例如 "Alice"
 */
export function useCharacterResources(packageName: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(packageName, "character");
  const manifest = useLocalManifest(packageName);

  const resources = computed<CharacterResourceItem[]>(() => {
    return items.value.map((item) => {
      const selected = manifest.isCharacterSelected(item.path);
      return {
        ...item,
        isSelected: selected,
        extraDisplayText: selected ? "主角色" : "",
        toggleSelection: () => manifest.toggleCharacter(item.path),
      };
    });
  });

  return { items: resources, actions };
}

