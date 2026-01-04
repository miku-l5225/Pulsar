// src/resources/component/useComponentResources.ts

import { computed, type MaybeRef } from "vue";
import type { SemanticType } from "@/resources/SemanticType";
import { useLocalManifest } from "@/composables/useLocalManifest";
import {
  type FolderResourceItem,
  useResourceFolder,
} from "@/composables/useResourceFolder";

// 扩展资源项类型
export interface ComponentResourceItem extends FolderResourceItem {
  isSelected: boolean;
  extraDisplayText: string;
  setAs?: (mode: "inline" | "override" | "none", key?: string) => void;
}

/**
 * 使用组件资源（components 子文件夹）
 * @param packageName 角色名称，例如 "Alice"
 */
export function useComponentResources(packageName: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(packageName, "components");
  const manifest = useLocalManifest(packageName);

  const resources = computed<ComponentResourceItem[]>(() => {
    const m = manifest.manifest.value;
    if (!m)
      return items.value.map((i) => ({
        ...i,
        isSelected: false,
        extraDisplayText: "",
      }));

    return items.value.map((item) => {
      const usage = manifest.isComponentUsed(item.path);
      let extraText = "";
      if (usage?.inline) extraText = `Tag: <${usage.inline}>`;
      if (usage?.override) extraText = `Override: ${usage.override}`;
      if (usage?.inline && usage?.override)
        extraText = `Tag: <${usage.inline}> | Override: ${usage.override}`;

      return {
        ...item,
        isSelected: !!(usage?.inline || usage?.override),
        extraDisplayText: extraText,

        // 组件特有的设置方法
        setAs: (mode: "inline" | "override" | "none", key?: string) => {
          if (mode === "inline" && key) {
            manifest.setComponentInline(key, item.path);
          } else if (mode === "override" && key) {
            manifest.setComponentOverride(key as SemanticType, item.path);
          } else if (mode === "none") {
            if (usage?.inline) manifest.removeComponentInline(usage.inline);
            if (usage?.override) manifest.removeComponentOverride(usage.override);
          }
        },
      };
    });
  });

  return { items: resources, actions };
}

