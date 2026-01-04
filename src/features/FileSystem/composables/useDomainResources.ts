// src/features/FileSystem/composables/useDomainResources.ts
import { computed, type MaybeRef, unref } from "vue";
import type { ResourceSelection } from "@/components/EnvironmentSidebar/manifest.types";
import type { SemanticType } from "@/resources/SemanticType";
import { useLocalManifest } from "./useLocalManifest";
import {
  type FolderResourceItem,
  useResourceFolder,
} from "./useResourceFolder";

// 扩展资源项类型，增加业务状态
export interface DomainResourceItem extends FolderResourceItem {
  isSelected: boolean;
  extraDisplayText: string;
  toggleSelection?: () => void;
  setAs?: (type: string, key?: string) => void;
}

/**
 * 通用 Manifest 选择逻辑帮助函数
 */
function useManifestSelection(
  manifest: ReturnType<typeof useLocalManifest>,
  type: keyof ResourceSelection | "background" | "component"
) {
  const isSelected = (path: string, key?: string) => {
    const m = manifest.value;
    if (!m) return false;

    if (type === "background") {
      return m.backgroundPath === path;
    }

    if (type === "component") {
      // 检查 customComponents (inline) 或 overrides
      const isInline = Object.values(m.customComponents || {}).includes(path);
      const isOverride = Object.values(m.overrides || {}).includes(path);
      return isInline || isOverride;
    }

    // 处理 ResourceSelection (character, lorebook, preset)
    const list = m.selection?.[type as keyof ResourceSelection] || [];
    return list.includes(path);
  };

  const toggle = (path: string, forceState?: boolean) => {
    const m = { ...manifest.value! }; // 浅拷贝触发更新

    if (type === "background") {
      m.backgroundPath = m.backgroundPath === path && !forceState ? "" : path;
    } else if (type !== "component") {
      // List types
      const key = type as keyof ResourceSelection;
      const list = new Set(m.selection[key] || []);

      if (list.has(path)) {
        list.delete(path);
      } else {
        list.add(path);
      }
      m.selection[key] = Array.from(list);
    }

    manifest.value = m;
  };

  return { isSelected, toggle };
}

// ------------------------------------------------------------------
// 1. Lorebook Hook
// ------------------------------------------------------------------
export function useLorebook(path: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(path, "lorebook");
  const manifest = useLocalManifest(path);
  const { isSelected, toggle } = useManifestSelection(manifest, "lorebook");

  const resources = computed<DomainResourceItem[]>(() => {
    return items.value.map((item) => {
      const selected = isSelected(item.path);
      return {
        ...item,
        isSelected: selected,
        extraDisplayText: selected ? "已启用" : "",
        toggleSelection: () => toggle(item.path),
      };
    });
  });

  return { items: resources, actions };
}

// ------------------------------------------------------------------
// 2. Preset Hook
// ------------------------------------------------------------------
export function usePreset(path: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(path, "preset");
  const manifest = useLocalManifest(path);
  const { isSelected, toggle } = useManifestSelection(manifest, "preset");

  const resources = computed<DomainResourceItem[]>(() => {
    return items.value.map((item) => {
      const selected = isSelected(item.path);
      return {
        ...item,
        isSelected: selected,
        extraDisplayText: selected ? "默认预设" : "", // 语义上 Preset 通常是选一个
        toggleSelection: () => toggle(item.path),
      };
    });
  });

  return { items: resources, actions };
}

// ------------------------------------------------------------------
// 3. Character Hook (Folders)
// ------------------------------------------------------------------
export function useCharacter(path: MaybeRef<string | null>) {
  // Character 通常位于根目录下的 character 文件夹，或者是根目录本身？
  // 根据题目描述 "character: 文件夹"，这里假设是子目录 "character"
  const { items, actions } = useResourceFolder(path, "character");
  const manifest = useLocalManifest(path);
  const { isSelected, toggle } = useManifestSelection(manifest, "character");

  const resources = computed<DomainResourceItem[]>(() => {
    return items.value.map((item) => {
      // Character 可能是文件夹，也可能是文件
      const selected = isSelected(item.path);
      return {
        ...item,
        isSelected: selected,
        extraDisplayText: selected ? "主角色" : "",
        toggleSelection: () => toggle(item.path),
      };
    });
  });

  return { items: resources, actions };
}

// ------------------------------------------------------------------
// 4. Chat Hook (No Selection)
// ------------------------------------------------------------------
export function useChat(path: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(path, "chat");

  const resources = computed<DomainResourceItem[]>(() => {
    return items.value.map((item) => ({
      ...item,
      isSelected: false,
      extraDisplayText: "", // Chat 不需要额外状态
      // 不提供 toggleSelection
    }));
  });

  return { items: resources, actions };
}

// ------------------------------------------------------------------
// 5. Background Hook
// ------------------------------------------------------------------
export function useBackground(path: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(path, "background");
  const manifest = useLocalManifest(path);
  const { isSelected, toggle } = useManifestSelection(manifest, "background");

  const resources = computed<DomainResourceItem[]>(() => {
    return items.value.map((item) => {
      const selected = isSelected(item.path);
      return {
        ...item,
        isSelected: selected,
        extraDisplayText: selected ? "当前背景" : "",
        toggleSelection: () => toggle(item.path),
      };
    });
  });

  return { items: resources, actions };
}

// ------------------------------------------------------------------
// 6. Component Hook
// ------------------------------------------------------------------
export function useComponent(path: MaybeRef<string | null>) {
  // 组件通常在 components 文件夹，或者根据实际项目结构调整
  const { items, actions } = useResourceFolder(path, "component"); // 或 "components"
  const manifest = useLocalManifest(path);

  // 组件的逻辑较复杂，不使用通用的 selection
  const resources = computed<DomainResourceItem[]>(() => {
    const m = manifest.value;
    if (!m)
      return items.value.map((i) => ({
        ...i,
        isSelected: false,
        extraDisplayText: "",
      }));

    return items.value.map((item) => {
      // 检查内联注册
      const inlineKey = Object.entries(m.customComponents || {}).find(
        ([k, v]) => v === item.path
      )?.[0];
      // 检查覆盖注册
      const overrideKey = Object.entries(m.overrides || {}).find(
        ([k, v]) => v === item.path
      )?.[0];

      let extraText = "";
      if (inlineKey) extraText = `Tag: <${inlineKey}>`;
      if (overrideKey) extraText = `Override: ${overrideKey}`;
      if (inlineKey && overrideKey)
        extraText = `Tag: <${inlineKey}> | Override: ${overrideKey}`;

      return {
        ...item,
        isSelected: !!(inlineKey || overrideKey),
        extraDisplayText: extraText,

        // 组件特有的设置方法
        setAs: (mode: "inline" | "override" | "none", key?: string) => {
          const newManifest = { ...manifest.value! };
          const customComponents = { ...newManifest.customComponents };
          const overrides = { ...newManifest.overrides };

          // 1. 清理旧引用
          for (const [k, v] of Object.entries(customComponents)) {
            if (v === item.path) delete customComponents[k];
          }
          for (const [k, v] of Object.entries(overrides)) {
            if (v === item.path) delete overrides[k as SemanticType];
          }

          // 2. 设置新引用
          if (mode === "inline" && key) {
            customComponents[key] = item.path;
          } else if (mode === "override" && key) {
            overrides[key as SemanticType] = item.path;
          }

          // 3. 回写
          newManifest.customComponents = customComponents;
          newManifest.overrides = overrides;
          manifest.value = newManifest;
        },
      };
    });
  });

  return { items: resources, actions };
}
