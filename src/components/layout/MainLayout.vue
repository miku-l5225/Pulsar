<!-- src/components/layout/MainLayout.vue -->
<script setup lang="ts">
import { computed, onMounted } from "vue";
import LeftSidebar from "./LeftSidebar.vue";
import SidePanelWrapper from "./SidePanelWrapper.vue";
import FileSidebar from "./FileSidebar.vue";
import CharacterSidebar from "./CharacterSidebar.vue";
import Workbench from "./workbench/Workbench.vue";
import { Files, PlugIcon, Settings, User, FlaskConical } from "lucide-vue-next";
import { useProcessManagerStore } from "@/features/ProcessManager/ProcessManager.store";
import { useUIStore, type SidebarView } from "@/features/UI/UI.store";
import { useCustomPageStore } from "@/features/CustomPage/CustomPage.store";
import { isMobile } from "@/utils/platform";

const processStore = useProcessManagerStore();
const uiStore = useUIStore();
const customPageStore = useCustomPageStore();
const mobile = isMobile();

onMounted(async () => {
  processStore.initializeEventListeners();
  await customPageStore.init();
});

const movedToTopIds = [
  "process-manager",
  "task-manager",
  "secrets-manager",
  "mcp-manager",
];

// 计算属性：所有的导航按钮（合并 Top 和 Bottom，用于移动端扁平化展示）
const allNavButtons = computed(() => {
  const base = [
    {
      svg: User,
      id: "character",
      onClick: () => uiStore.toggleSidebarView("character"),
      title: "Character Library",
    },
    {
      svg: Files,
      id: "files",
      onClick: () => uiStore.toggleSidebarView("files"),
      title: "File Explorer",
    },
  ];

  // Store 中的功能
  const features = uiStore.bottomBarItems
    .filter((item) => item.id !== "manifest-config" && item.id !== "search") // 配置项在顶栏右侧，这里不显示
    .map((item) => ({
      svg: item.icon!,
      id: item.id,
      onClick: movedToTopIds.includes(item.id)
        ? () => uiStore.toggleSidebarView(item.id as SidebarView)
        : () => uiStore.toggleRightSidebar(item.id),
      title: item.name,
    }));

  // 静态底部按钮
  const statics = [
    {
      svg: PlugIcon,
      id: "model-config",
      onClick: "modelConfig.[modelConfig].json",
      title: "Model Config",
    },
    {
      svg: Settings,
      id: "settings",
      onClick: "setting.[setting].json",
      title: "Settings",
    },
  ];

  return [...base, ...features, ...statics];
});

// 桌面端 Top Buttons
const topButtons = computed(() => {
  const baseButtons = [
    {
      svg: User,
      onClick: () => uiStore.toggleSidebarView("character"),
      title: "Character Library",
      isActive: uiStore.uiState.leftSidebarView === "character",
    },
    {
      svg: Files,
      onClick: () => uiStore.toggleSidebarView("files"),
      title: "File Explorer",
      isActive: uiStore.uiState.leftSidebarView === "files",
    },
  ];
  const movedItems = uiStore.bottomBarItems
    .filter((item) => movedToTopIds.includes(item.id))
    .map((item) => ({
      svg: item.icon!,
      onClick: () => uiStore.toggleSidebarView(item.id as SidebarView),
      title: item.name,
      isActive: uiStore.uiState.leftSidebarView === item.id,
    }));
  return [...baseButtons, ...movedItems];
});

// 桌面端 Bottom Buttons
const combinedBottomButtons = computed(() => {
  // ... (保持原有的 desktop 逻辑) ...
  const staticBtns = [
    { svg: FlaskConical, onClick: "$test", title: "testComponent" },
    {
      svg: PlugIcon,
      onClick: "modelConfig.[modelConfig].json",
      title: "Model Config",
    },
    { svg: Settings, onClick: "setting.[setting].json", title: "Settings" },
  ];
  const remainingStoreItems = uiStore.bottomBarItems
    .filter(
      (item) =>
        !movedToTopIds.includes(item.id) && item.id !== "manifest-config"
    )
    .map((item) => ({
      svg: item.icon!,
      onClick: () => uiStore.toggleRightSidebar(item.id),
      title: item.name,
      isActive:
        uiStore.uiState.isRightSidebarOpen &&
        uiStore.uiState.activeRightPanelId === item.id,
    }));
  return [...staticBtns, ...remainingStoreItems];
});

// 处理按钮点击 (兼容 string 和 function)
const handleNavClick = (action: string | Function) => {
  if (typeof action === "function") action();
  else uiStore.openFile(action);

  // 移动端点击导航后，如果不是切换视图的操作（即打开文件），可能需要关闭侧边栏
  // 但如果是切换 active view，则保持侧边栏打开
};

// 判断是否激活 (移动端简化逻辑)
const isNavActive = (id: string, action: string | Function) => {
  if (uiStore.uiState.leftSidebarView === id) return true;
  if (typeof action === "string" && uiStore.uiState.activeFile === action)
    return true;
  return false;
};
</script>

<template>
  <div
    class="flex flex-col h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-900"
  >
    <div class="flex flex-1 overflow-hidden w-full flex-col">
      <div class="flex flex-1 overflow-hidden w-full relative">
        <!-- 1. 桌面端最左侧栏 (移动端隐藏) -->
        <LeftSidebar
          v-if="!mobile"
          :top="topButtons"
          :bottom="combinedBottomButtons"
          :custom-pages="customPageStore.visiblePages"
        />

        <!-- 2. 侧边面板 (包含文件树等) -->
        <SidePanelWrapper>
          <!-- 移动端特有：将原本最左侧栏的功能作为顶部 Tab 栏嵌入 -->
          <template #mobile-nav v-if="mobile">
            <div
              class="mobile-status-bar-padding flex items-center gap-1 p-2 border-b border-border overflow-x-auto no-scrollbar shrink-0 bg-muted/30"
            >
              <button
                v-for="btn in allNavButtons"
                :key="btn.title"
                @click="handleNavClick(btn.onClick)"
                class="p-2 rounded-md transition-colors shrink-0"
                :class="
                  isNavActive(btn.id || '', btn.onClick)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                "
                :title="btn.title"
              >
                <component :is="btn.svg" class="w-5 h-5" />
              </button>
            </div>
          </template>

          <!-- 侧边栏内容 -->
          <FileSidebar v-if="uiStore.uiState.leftSidebarView === 'files'" />
          <CharacterSidebar
            v-else-if="uiStore.uiState.leftSidebarView === 'character'"
          />
          <component
            v-else-if="uiStore.activeLeftComponent"
            :is="uiStore.activeLeftComponent"
            class="h-full w-full"
          />
        </SidePanelWrapper>

        <!-- 3. 工作台 -->
        <Workbench class="flex-1 min-w-0 mobile-status-bar-padding" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-status-bar-padding {
  padding-top: env(safe-area-inset-top);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
