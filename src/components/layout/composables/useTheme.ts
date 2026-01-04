// src/components/layout/composables/useTheme.ts
import { useStorage } from "@vueuse/core";
import { computed, watchEffect } from "vue";
import {
  parseThemeFromCSS,
  injectThemeCSS,
  removeThemeCSS,
} from "./themeUtils";

export interface Theme {
  name: string;
  class: string;
  colors: string[];
  isCustom?: boolean;
  css?: string; // 自定义主题的 CSS 内容
}

export const builtInThemes: Theme[] = [
  {
    name: "默认",
    class: "theme-default",
    colors: ["oklch(0.6171 0.1375 39.0427)", "oklch(0.9245 0.0138 92.9892)"],
  },
  {
    name: "Catppuccin",
    class: "theme-catppuccin",
    colors: ["oklch(0.5547 0.2503 297.0156)", "oklch(0.6820 0.1448 235.3822)"],
  },
  {
    name: "Tangerine",
    class: "theme-tangerine",
    colors: ["oklch(0.6397 0.1720 36.4421)", "oklch(0.9119 0.0222 243.8174)"],
  },
  {
    name: "Amber Minimal",
    class: "theme-amberminimal",
    colors: ["oklch(0.7686 0.1647 70.0804)", "oklch(0.4732 0.1247 46.2007)"],
  },
  {
    name: "Clean Slate",
    class: "theme-cleanslate",
    colors: ["oklch(0.5854 0.2041 277.1173)", "oklch(0.3729 0.0306 259.7328)"],
  },
  {
    name: "Solar Dusk",
    class: "theme-solardusk",
    colors: ["oklch(0.5553 0.1455 48.9975)", "oklch(0.8276 0.0752 74.4400)"],
  },
  {
    name: "Claymorphism",
    class: "theme-claymorphism",
    colors: ["oklch(0.5854 0.2041 277.1173)", "oklch(0.8687 0.0043 56.3660)"],
  },
  {
    name: "Violet Bloom",
    class: "theme-violetbloom",
    colors: ["oklch(0.5393 0.2713 286.7462)", "oklch(0.9540 0.0063 255.4755)"],
  },
  {
    name: "Twitter",
    class: "theme-twitter",
    colors: ["oklch(0.6723 0.1606 244.9955)", "oklch(0.9392 0.0166 250.8453)"],
  },
  {
    name: "Notebook",
    class: "theme-notebook",
    colors: ["oklch(0.4891 0 0)", "oklch(0.9006 0 0)"],
  },
];

export function useTheme() {
  const currentTheme = useStorage("color-theme", "theme-default");
  const customThemes = useStorage<Theme[]>("custom-themes", []);

  // 合并内置主题和自定义主题
  const themes = computed(() => {
    return [...builtInThemes, ...customThemes.value];
  });

  const setTheme = (themeClass: string) => {
    currentTheme.value = themeClass;
  };

  /**
   * 添加自定义主题
   * @param cssString CSS 字符串
   * @returns 添加的主题信息，如果解析失败则返回 null
   */
  const addCustomTheme = (cssString: string): Theme | null => {
    const parsed = parseThemeFromCSS(cssString);
    if (!parsed) {
      return null;
    }

    // 检查是否已存在相同类名的主题
    const existingIndex = customThemes.value.findIndex(
      (t) => t.class === parsed.class
    );

    const newTheme: Theme = {
      ...parsed,
      isCustom: true,
      css: cssString,
    };

    if (existingIndex >= 0) {
      // 更新现有主题
      customThemes.value[existingIndex] = newTheme;
    } else {
      // 添加新主题
      customThemes.value.push(newTheme);
    }

    // 注入 CSS
    injectThemeCSS(cssString, parsed.class);

    return newTheme;
  };

  /**
   * 更新自定义主题
   * @param themeClass 原主题类名
   * @param cssString 新的 CSS 字符串
   * @returns 更新后的主题信息，如果解析失败则返回 null
   */
  const updateCustomTheme = (
    themeClass: string,
    cssString: string
  ): Theme | null => {
    const parsed = parseThemeFromCSS(cssString);
    if (!parsed) {
      return null;
    }

    const index = customThemes.value.findIndex((t) => t.class === themeClass);
    if (index < 0) {
      return null;
    }

    const updatedTheme: Theme = {
      ...parsed,
      isCustom: true,
      css: cssString,
    };

    // 如果主题类名改变了，需要删除旧的 CSS 并注入新的
    if (parsed.class !== themeClass) {
      removeThemeCSS(themeClass);
      // 如果当前使用的是旧主题，切换到新主题
      if (currentTheme.value === themeClass) {
        currentTheme.value = parsed.class;
      }
    }

    customThemes.value[index] = updatedTheme;

    // 更新注入的 CSS（使用新的类名）
    injectThemeCSS(cssString, parsed.class);

    return updatedTheme;
  };

  /**
   * 删除自定义主题
   * @param themeClass 主题类名
   */
  const removeCustomTheme = (themeClass: string): void => {
    const index = customThemes.value.findIndex((t) => t.class === themeClass);
    if (index >= 0) {
      customThemes.value.splice(index, 1);
      // 移除注入的 CSS
      removeThemeCSS(themeClass);
      // 如果当前使用的是被删除的主题，切换回默认主题
      if (currentTheme.value === themeClass) {
        currentTheme.value = "theme-default";
      }
    }
  };

  /**
   * 获取自定义主题的 CSS
   * @param themeClass 主题类名
   * @returns CSS 字符串，如果不存在则返回 null
   */
  const getCustomThemeCSS = (themeClass: string): string | null => {
    const theme = customThemes.value.find((t) => t.class === themeClass);
    return theme?.css || null;
  };

  // 确保在任何组件使用此 Hook 时，主题类名都能被正确应用
  // 注意：只要 LeftSidebar 依然挂载（作为布局的一部分），这个 effect 就会保持活跃
  watchEffect(() => {
    if (typeof window === "undefined") return;
    const htmlEl = document.documentElement;
    themes.value.forEach((theme) => {
      if (htmlEl.classList.contains(theme.class))
        htmlEl.classList.remove(theme.class);
    });
    if (currentTheme.value && currentTheme.value !== "theme-default") {
      htmlEl.classList.add(currentTheme.value);
    }
  });

  // 初始化时注入所有自定义主题的 CSS
  watchEffect(() => {
    if (typeof window === "undefined") return;
    customThemes.value.forEach((theme) => {
      if (theme.css) {
        injectThemeCSS(theme.css, theme.class);
      }
    });
  });

  return {
    themes,
    currentTheme,
    setTheme,
    addCustomTheme,
    updateCustomTheme,
    removeCustomTheme,
    getCustomThemeCSS,
  };
}
