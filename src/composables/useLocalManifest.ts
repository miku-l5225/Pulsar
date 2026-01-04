// src/composables/useLocalManifest.ts

import urlJoin from "url-join";
import { computed, type MaybeRef, unref } from "vue";
import { newManifest } from "@/components/EnvironmentSidebar/manifest";
import type { ManifestContent } from "@/components/EnvironmentSidebar/manifest.types";
import type { SemanticType } from "@/resources/SemanticType";
import { useFileContent } from "@/features/FileSystem/composables/useFileContent";

/**
 * 使用角色包的 manifest.json
 * @param packageName 角色名称，例如 "Alice"
 */
export function useLocalManifest(packageName: MaybeRef<string | null>) {
  const manifestPath = computed(() => {
    const name = unref(packageName);
    if (!name) return null;
    return urlJoin("character", name, "manifest.json");
  });

  // 使用默认值防止读取失败导致 UI 崩溃
  const defaultVal = newManifest();

  const manifest = useFileContent<ManifestContent>(manifestPath, defaultVal);

  // 提供具体的操作方法
  const setBackground = (path: string) => {
    if (!manifest.value) return;
    manifest.value = {
      ...manifest.value,
      backgroundPath: path,
    };
  };

  const clearBackground = () => {
    if (!manifest.value) return;
    manifest.value = {
      ...manifest.value,
      backgroundPath: "",
    };
  };

  const toggleCharacter = (path: string) => {
    if (!manifest.value) return;
    const list = new Set(manifest.value.selection.character || []);
    if (list.has(path)) {
      list.delete(path);
    } else {
      list.add(path);
    }
    manifest.value = {
      ...manifest.value,
      selection: {
        ...manifest.value.selection,
        character: Array.from(list),
      },
    };
  };

  const toggleLorebook = (path: string) => {
    if (!manifest.value) return;
    const list = new Set(manifest.value.selection.lorebook || []);
    if (list.has(path)) {
      list.delete(path);
    } else {
      list.add(path);
    }
    manifest.value = {
      ...manifest.value,
      selection: {
        ...manifest.value.selection,
        lorebook: Array.from(list),
      },
    };
  };

  const togglePreset = (path: string) => {
    if (!manifest.value) return;
    const list = new Set(manifest.value.selection.preset || []);
    if (list.has(path)) {
      list.delete(path);
    } else {
      list.add(path);
    }
    manifest.value = {
      ...manifest.value,
      selection: {
        ...manifest.value.selection,
        preset: Array.from(list),
      },
    };
  };

  const setComponentInline = (tagName: string, path: string) => {
    if (!manifest.value) return;
    manifest.value = {
      ...manifest.value,
      customComponents: {
        ...manifest.value.customComponents,
        [tagName]: path,
      },
    };
  };

  const setComponentOverride = (type: SemanticType, path: string) => {
    if (!manifest.value) return;
    manifest.value = {
      ...manifest.value,
      overrides: {
        ...manifest.value.overrides,
        [type]: path,
      },
    };
  };

  const removeComponentInline = (tagName: string) => {
    if (!manifest.value) return;
    const customComponents = { ...manifest.value.customComponents };
    delete customComponents[tagName];
    manifest.value = {
      ...manifest.value,
      customComponents,
    };
  };

  const removeComponentOverride = (type: SemanticType) => {
    if (!manifest.value) return;
    const overrides = { ...manifest.value.overrides };
    delete overrides[type];
    manifest.value = {
      ...manifest.value,
      overrides,
    };
  };

  const isCharacterSelected = (path: string): boolean => {
    if (!manifest.value) return false;
    return manifest.value.selection.character?.includes(path) || false;
  };

  const isLorebookSelected = (path: string): boolean => {
    if (!manifest.value) return false;
    return manifest.value.selection.lorebook?.includes(path) || false;
  };

  const isPresetSelected = (path: string): boolean => {
    if (!manifest.value) return false;
    return manifest.value.selection.preset?.includes(path) || false;
  };

  const isBackgroundSelected = (path: string): boolean => {
    if (!manifest.value) return false;
    return manifest.value.backgroundPath === path;
  };

  const isComponentUsed = (path: string): { inline?: string; override?: SemanticType } | null => {
    if (!manifest.value) return null;
    const inlineKey = Object.entries(manifest.value.customComponents || {}).find(
      ([, v]) => v === path
    )?.[0];
    const overrideKey = Object.entries(manifest.value.overrides || {}).find(
      ([, v]) => v === path
    )?.[0] as SemanticType | undefined;

    if (inlineKey || overrideKey) {
      return { inline: inlineKey, override: overrideKey };
    }
    return null;
  };

  return {
    manifest,
    setBackground,
    clearBackground,
    toggleCharacter,
    toggleLorebook,
    togglePreset,
    setComponentInline,
    setComponentOverride,
    removeComponentInline,
    removeComponentOverride,
    isCharacterSelected,
    isLorebookSelected,
    isPresetSelected,
    isBackgroundSelected,
    isComponentUsed,
  };
}

