<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useUIStore } from "@/features/UI/UI.store";
import {
  useFileSystemStore,
  VirtualFolder,
} from "@/features/FileSystem/FileSystem.store";
import {
  Folder,
  FileQuestion,
  MessageSquare, // Chat
  User, // Character
  Image as ImageIcon, // Visual (Background/Components)
  BookOpen, // Lorebook
  Settings2, // Preset
} from "lucide-vue-next";

// 引入组件
import ChatController from "./ChatController.vue";
import ResourceSelector from "./ResourceSelector.vue";
import VisualController from "./VisualController.vue";

// 1. Tab 合并映射：物理文件夹 -> UI 显示名称
const TAB_MERGE_MAP: Record<string, string> = {
  background: "visual",
  components: "visual",
  component: "visual", // 兼容单数形式
};

// 2. 组件映射：UI 显示名称 -> Vue 组件
const COMPONENT_MAP: Record<string, any> = {
  chat: ChatController,
  character: ResourceSelector,
  lorebook: ResourceSelector,
  preset: ResourceSelector,
  visual: VisualController, // 统一使用 VisualController
};

// 3. 图标映射：UI 显示名称 -> Lucide 图标组件
const TAB_ICON_MAP: Record<string, any> = {
  chat: MessageSquare,
  character: User,
  lorebook: BookOpen,
  preset: Settings2,
  visual: ImageIcon,
};

const uiStore = useUIStore();
const fsStore = useFileSystemStore();
const currentTabName = ref<string>("");
const availableTabs = ref<string[]>([]);

const packagePath = computed(() => {
  const activeFile = uiStore.uiState.activeFile;
  if (!activeFile) return null;
  const parts = activeFile.split("/");
  if (parts.length >= 2) {
    return parts.slice(0, 2).join("/");
  }
  return null;
});

// 获取 Tab 对应的图标，默认为 Folder
const getTabIcon = (tabName: string) => {
  return TAB_ICON_MAP[tabName] || Folder;
};

watch(
  packagePath,
  (newPath) => {
    if (!newPath) {
      availableTabs.value = [];
      currentTabName.value = "";
      return;
    }
    const node = fsStore.resolvePath(newPath);
    if (node instanceof VirtualFolder) {
      const physicalFolders: string[] = [];
      const uiTabs = new Set<string>();

      // 遍历物理文件夹并进行映射合并
      for (const child of node.children.values()) {
        if (child instanceof VirtualFolder) {
          physicalFolders.push(child.name);
          const mappedName = TAB_MERGE_MAP[child.name] || child.name;
          uiTabs.add(mappedName);
        }
      }

      availableTabs.value = Array.from(uiTabs).sort();

      // 自动选中逻辑
      const activeFile = uiStore.uiState.activeFile || "";
      const matchedPhysicalFolder = physicalFolders.find(
        (folder) =>
          activeFile.startsWith(`${newPath}/${folder}/`) ||
          activeFile === `${newPath}/${folder}`
      );

      if (matchedPhysicalFolder) {
        // 将物理文件夹转换回 UI Tab 名称以激活选中状态
        currentTabName.value =
          TAB_MERGE_MAP[matchedPhysicalFolder] || matchedPhysicalFolder;
      }
    } else {
      availableTabs.value = [];
    }
  },
  { immediate: true }
);

const currentComponent = computed(() => {
  if (!currentTabName.value) return null;
  return COMPONENT_MAP[currentTabName.value] || null;
});

const targetFolderPath = computed(() => {
  if (!packagePath.value || !currentTabName.value) return "";
  // 注意：VisualController 内部需要处理合并后的路径逻辑，或者只依赖 packagePath
  return `${packagePath.value}/${currentTabName.value}`;
});

const manifestFilePath = computed(() => {
  if (!packagePath.value) return "";
  return `${packagePath.value}/manifest.[manifest].json`;
});

const handleTabClick = (tabName: string) => {
  currentTabName.value = tabName;
};
</script>

<template>
  <div class="flex flex-col h-full w-full bg-background">
    <!-- 顶部 Tab 栏 -->
    <!-- 修改：flex-wrap 允许换行，移除 no-scrollbar -->
    <div
      v-if="availableTabs.length > 0"
      class="flex flex-wrap items-center gap-2 p-2 border-b border-border bg-muted/30"
    >
      <button
        v-for="tab in availableTabs"
        :key="tab"
        @click="handleTabClick(tab)"
        :title="tab"
        :class="[
          'flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 border',
          currentTabName === tab
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'bg-background text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground hover:border-border',
        ]"
      >
        <!-- 渲染映射后的 SVG 图标 -->
        <component :is="getTabIcon(tab)" class="w-4 h-4" />
        <span class="capitalize">{{ tab }}</span>
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden relative">
      <div
        v-if="!packagePath || availableTabs.length === 0"
        class="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2"
      >
        <div class="text-sm">未检测到有效的环境目录</div>
        <div class="text-xs opacity-60">请在左侧文件树中选择一个角色或包</div>
      </div>

      <!-- 动态渲染组件 -->
      <component
        v-else-if="currentComponent"
        :is="currentComponent"
        :folderPath="targetFolderPath"
        :packagePath="packagePath"
        :manifestPath="manifestFilePath"
        class="h-full w-full"
      />

      <div
        v-else-if="currentTabName"
        class="h-full flex flex-col items-center justify-center text-muted-foreground"
      >
        <FileQuestion class="w-12 h-12 mb-4 opacity-20" />
        <h3 class="text-lg font-semibold text-foreground">无编辑器</h3>
        <p class="text-sm mt-2 max-w-xs text-center">
          UI Tab
          <span class="font-mono bg-muted px-1 rounded">{{
            currentTabName
          }}</span>
          没有配置对应的组件。
        </p>
      </div>
      <div
        v-else
        class="h-full flex items-center justify-center text-xs text-muted-foreground"
      >
        请选择上方的一个环境进行编辑
      </div>
    </div>
  </div>
</template>
