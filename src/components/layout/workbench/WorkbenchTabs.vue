<!-- src/components/layout/workbench/WorkbenchTabs.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import draggable from "vuedraggable";
import { Button } from "@/components/ui/button";
import {
  XIcon,
  Minus,
  Square,
  X,
  Menu,
  ChevronDown,
  Settings2,
} from "lucide-vue-next";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUIStore } from "@/features/UI/UI.store";
import { isMobile } from "@/utils/platform";

const uiStore = useUIStore();
const mobile = isMobile();
const isDropdownOpen = ref(false);

const appWindow = getCurrentWindow();
const minimizeWindow = () => appWindow.minimize();
const toggleMaximizeWindow = () => appWindow.toggleMaximize();
const closeWindow = () => appWindow.close();

// ... (保留原有的 dragOptions, configItem, isConfigActive, getFileName, handleClose 函数) ...
const dragOptions = computed(() => ({
  animation: 200,
  group: "tabs",
  ghostClass: "ghost-tab",
  handle: ".drag-handle",
}));

const configItem = computed(() =>
  uiStore.bottomBarItems.find((item) => item.id === "manifest-config")
);

const isConfigActive = computed(
  () =>
    uiStore.uiState.isRightSidebarOpen &&
    uiStore.uiState.activeRightPanelId === "manifest-config"
);

function getFileName(path: string): string {
  if (!path) return "";
  if (path.startsWith("$")) return path.substring(1);
  const parts = path.split(/[\\/]/);
  let name = parts.pop() || path;
  const lastDotIndex = name.lastIndexOf(".");
  let nameWithoutExt =
    lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
  const semanticMatch = nameWithoutExt.match(/\.\[(.*?)\]$/);
  let displayName = semanticMatch
    ? nameWithoutExt.substring(0, semanticMatch.index)
    : nameWithoutExt;
  if (displayName.toLowerCase() === "index") {
    const parentDir = parts.pop();
    if (parentDir) displayName = parentDir;
  }
  return displayName;
}

function handleClose(event: MouseEvent, path: string) {
  event.stopPropagation();
  uiStore.closeFile(path);
}

// 移动端：切换左侧栏
const toggleLeftSidebar = () => {
  // 如果左侧栏关闭，默认打开文件视图，或者保持上次视图
  if (!uiStore.isLeftSidebarOpen) {
    if (uiStore.uiState.leftSidebarView === "none") {
      uiStore.toggleSidebarView("files");
    } else {
      // 强制刷新一下状态确保打开
      const current = uiStore.uiState.leftSidebarView;
      uiStore.uiState.leftSidebarView = "none";
      setTimeout(() => (uiStore.uiState.leftSidebarView = current), 0);
    }
  } else {
    uiStore.toggleSidebarView("none");
  }
};

// 移动端：选择文件
const selectFile = (path: string) => {
  uiStore.setActiveFile(path);
  isDropdownOpen.value = false;
};
</script>

<template>
  <nav
    class="shrink-0 border-b border-border bg-background flex justify-between items-center h-12 md:h-10 px-2 md:px-0"
    aria-label="Opened files"
    data-tauri-drag-region
  >
    <!-- === 移动端布局 === -->
    <template v-if="mobile">
      <!-- 1. 左侧栏开关 -->
      <Button variant="ghost" size="icon" @click="toggleLeftSidebar">
        <Menu class="h-5 w-5" />
      </Button>

      <!-- 2. 中间：Tab下拉选择器 -->
      <div class="relative flex-1 mx-2 min-w-0">
        <button
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center justify-center w-full px-3 py-1.5 rounded-md bg-muted/50 text-sm font-medium truncate"
        >
          <span class="truncate">
            {{
              uiStore.uiState.activeFile
                ? getFileName(uiStore.uiState.activeFile)
                : "选择文件"
            }}
          </span>
          <ChevronDown class="ml-2 h-4 w-4 opacity-50 shrink-0" />
        </button>

        <!-- 简易下拉菜单 Overlay -->
        <div
          v-if="isDropdownOpen"
          class="absolute top-full left-0 w-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          <div
            v-for="path in uiStore.uiState.openedFiles"
            :key="path"
            class="flex items-center justify-between px-3 py-2 text-sm hover:bg-accent cursor-pointer"
            :class="{
              'bg-accent text-accent-foreground':
                uiStore.uiState.activeFile === path,
            }"
            @click="selectFile(path)"
          >
            <span class="truncate flex-1">{{ getFileName(path) }}</span>
            <button
              @click.stop="handleClose($event, path)"
              class="p-1 ml-2 text-muted-foreground hover:text-destructive"
            >
              <XIcon class="h-3 w-3" />
            </button>
          </div>
          <div
            v-if="uiStore.uiState.openedFiles.length === 0"
            class="p-3 text-center text-xs text-muted-foreground"
          >
            暂无打开的文件
          </div>
        </div>
        <!-- 点击外部关闭遮罩 -->
        <div
          v-if="isDropdownOpen"
          class="fixed inset-0 z-40"
          @click="isDropdownOpen = false"
        ></div>
      </div>

      <!-- 3. 右侧栏开关 (配置) -->
      <Button
        variant="ghost"
        size="icon"
        @click="uiStore.toggleRightSidebar('manifest-config')"
        :class="{ 'bg-accent text-accent-foreground': isConfigActive }"
      >
        <Settings2 class="h-5 w-5" />
      </Button>
    </template>

    <!-- === 桌面端布局 (保持原有逻辑) === -->
    <template v-else>
      <!-- 左侧标签页区域 -->
      <draggable
        :list="uiStore.uiState.openedFiles"
        :item-key="(file: string) => file"
        class="flex-1 flex items-center gap-1 p-1 overflow-x-auto no-scrollbar"
        v-bind="dragOptions"
        data-tauri-drag-region
      >
        <template #item="{ element: path }">
          <Button
            :variant="
              uiStore.uiState.activeFile === path ? 'secondary' : 'ghost'
            "
            size="sm"
            class="h-8 gap-2 px-3 relative group drag-handle cursor-grab border border-transparent"
            :class="{ 'border-border/50': uiStore.uiState.activeFile === path }"
            @click="uiStore.setActiveFile(path)"
            @click.middle="handleClose($event, path)"
          >
            <span class="text-xs">{{ getFileName(path) }}</span>
            <button
              class="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-opacity ml-1"
              @click="handleClose($event, path)"
              :title="`关闭: ${getFileName(path)}`"
            >
              <XIcon class="h-3 w-3" />
            </button>
          </Button>
        </template>
      </draggable>

      <!-- 右侧功能区 -->
      <div class="flex items-center shrink-0 border-l border-border">
        <!-- 1. 配置菜单按钮 -->
        <button
          v-if="configItem"
          @click="uiStore.toggleRightSidebar(configItem.id)"
          :title="configItem.name"
          class="inline-flex justify-center items-center h-10 w-10 transition-colors hover:bg-muted"
          :class="{
            'bg-accent text-accent-foreground': isConfigActive,
          }"
        >
          <component :is="configItem.icon" class="h-4 w-4" />
        </button>

        <!-- 2. 窗口控制按钮 -->
        <button
          @click="minimizeWindow"
          class="inline-flex justify-center items-center h-10 w-10 hover:bg-muted"
        >
          <Minus class="h-4 w-4" />
        </button>
        <button
          @click="toggleMaximizeWindow"
          class="inline-flex justify-center items-center h-10 w-10 hover:bg-muted"
        >
          <Square class="h-4 w-4" />
        </button>
        <button
          @click="closeWindow"
          class="inline-flex justify-center items-center h-10 w-10 hover:bg-destructive hover:text-destructive-foreground"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </template>
  </nav>
</template>

<style scoped>
/* 保持原有样式 */
.ghost-tab {
  opacity: 0.5;
  background: hsl(var(--accent));
  border-radius: var(--radius-md);
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>
