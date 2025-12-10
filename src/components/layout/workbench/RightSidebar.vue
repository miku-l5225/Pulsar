<!-- src/components/layout/workbench/RightSidebar.vue -->
<template>
  <!-- 移动端遮罩层 -->
  <div
    v-if="mobile && uiStore.uiState.isRightSidebarOpen"
    class="fixed inset-0 bg-black/50 z-40"
    @click="uiStore.toggleRightSidebar()"
  ></div>

  <aside
    :class="
      cn(
        'shrink-0 bg-background flex flex-col overflow-hidden',
        'transition-all duration-300 ease-in-out',
        // 移动端适配：Fixed 布局
        mobile ? 'fixed inset-y-0 right-0 z-50 h-full shadow-xl' : '',

        uiStore.uiState.isRightSidebarOpen
          ? mobile
            ? 'w-[85vw] max-w-[320px] opacity-100 border-l'
            : 'w-80 opacity-100 border-l border-border'
          : 'w-0 opacity-0 border-none'
      )
    "
  >
    <!-- 固定宽度的内部容器 -->
    <div
      class="h-full flex flex-col relative text-foreground bg-background"
      :class="mobile ? 'w-full' : 'w-80'"
    >
      <!-- 1. 渲染内置组件 -->
      <template v-for="item in uiStore.bottomBarItems" :key="item.id">
        <div
          v-show="uiStore.uiState.activeRightPanelId === item.id"
          class="flex-1 w-full h-full overflow-hidden flex flex-col"
        >
          <component :is="item.component" v-if="item.component" />
        </div>
      </template>

      <!-- 2. 渲染自定义 Teleport 容器 -->
      <template v-for="id in uiStore.uiState.customSidebarIds" :key="id">
        <div
          :id="id"
          v-show="uiStore.uiState.activeRightPanelId === id"
          class="flex-1 w-full h-full overflow-hidden flex flex-col custom-teleport-container"
        ></div>
      </template>

      <!-- 空状态 -->
      <div
        v-if="!hasActiveContent"
        class="flex-1 flex items-center justify-center p-4 text-sm text-muted-foreground"
      >
        <div class="text-center space-y-2">
          <p>暂无内容</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUIStore } from "@/features/UI/UI.store";
import { cn } from "@/lib/utils";
import { isMobile } from "@/utils/platform";

const uiStore = useUIStore();
const mobile = isMobile();

const hasActiveContent = computed(() => {
  const activeId = uiStore.uiState.activeRightPanelId;
  const isBuiltIn = uiStore.bottomBarItems.some((i) => i.id === activeId);
  const isCustom = uiStore.uiState.customSidebarIds.includes(activeId);
  return isBuiltIn || isCustom;
});
</script>

<style scoped>
.custom-teleport-container {
  display: flex;
  flex-direction: column;
}
</style>
