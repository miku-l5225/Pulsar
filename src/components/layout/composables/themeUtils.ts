// src/components/layout/composables/themeUtils.ts

/**
 * 从 CSS 字符串中提取主题信息
 * @param cssString CSS 字符串
 * @returns 主题信息对象，包含类名、名称和代表色
 */
export function parseThemeFromCSS(cssString: string): {
  class: string;
  name: string;
  colors: string[];
} | null {
  try {
    // 提取主题类名（例如：.theme-catppuccin）
    // 支持多种格式：.theme-name { 或 .dark.theme-name { 等
    const classMatch = cssString.match(/\.(theme-[\w-]+)\s*\{/);
    if (!classMatch) {
      return null;
    }
    const themeClass = classMatch[1];

    // 从类名生成名称（例如：theme-catppuccin -> Catppuccin）
    const name = themeClass
      .replace(/^theme-/, "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // 提取代表色：优先使用 --primary 和 --accent
    const colors: string[] = [];
    
    // 提取 --primary 颜色（优先从非 dark 模式中提取）
    const primaryMatches = cssString.matchAll(/--primary:\s*([^;]+);/g);
    const primaryArray = Array.from(primaryMatches);
    if (primaryArray.length > 0) {
      // 优先使用第一个匹配（通常是 light 模式）
      colors.push(primaryArray[0][1].trim());
    }
    
    // 提取 --accent 颜色
    const accentMatches = cssString.matchAll(/--accent:\s*([^;]+);/g);
    const accentArray = Array.from(accentMatches);
    if (accentArray.length > 0) {
      colors.push(accentArray[0][1].trim());
    }
    
    // 如果没有找到 primary 或 accent，尝试使用其他颜色变量
    if (colors.length === 0) {
      const backgroundMatch = cssString.match(/--background:\s*([^;]+);/);
      if (backgroundMatch) {
        colors.push(backgroundMatch[1].trim());
      }
      
      const foregroundMatch = cssString.match(/--foreground:\s*([^;]+);/);
      if (foregroundMatch) {
        colors.push(foregroundMatch[1].trim());
      }
    }
    
    // 确保至少有两个颜色（如果只有一个，复制它）
    if (colors.length === 1) {
      colors.push(colors[0]);
    } else if (colors.length === 0) {
      // 如果完全没有找到颜色，使用默认值
      colors.push("oklch(0.5 0.2 0)", "oklch(0.7 0.1 0)");
    }

    return {
      class: themeClass,
      name,
      colors: colors.slice(0, 2), // 只取前两个颜色
    };
  } catch (error) {
    console.error("Failed to parse theme from CSS:", error);
    return null;
  }
}

/**
 * 将 CSS 字符串注入到页面中
 * @param cssString CSS 字符串
 * @param themeClass 主题类名
 */
export function injectThemeCSS(cssString: string, themeClass: string): void {
  if (typeof window === "undefined") return;

  // 检查是否已经存在该主题的样式
  const existingStyle = document.getElementById(`theme-${themeClass}`);
  if (existingStyle) {
    existingStyle.textContent = cssString;
    return;
  }

  // 创建新的 style 元素
  const style = document.createElement("style");
  style.id = `theme-${themeClass}`;
  style.textContent = cssString;
  document.head.appendChild(style);
}

/**
 * 移除主题的 CSS
 * @param themeClass 主题类名
 */
export function removeThemeCSS(themeClass: string): void {
  if (typeof window === "undefined") return;
  const style = document.getElementById(`theme-${themeClass}`);
  if (style) {
    style.remove();
  }
}

