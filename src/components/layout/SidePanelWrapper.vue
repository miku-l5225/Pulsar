<!-- src/components/layout/SidePanelWrapper.vue -->
<script setup lang="ts">
import { useUIStore } from "@/features/UI/UI.store";
import { isMobile } from "@/utils/platform"; // 假设路径

const uiStore = useUIStore();
const mobile = isMobile();
</script>

<template>
  <!-- 移动端遮罩层 -->
  <div
    v-if="mobile && uiStore.isLeftSidebarOpen"
    class="fixed inset-0 bg-black/50 z-40"
    @click="uiStore.toggleSidebarView('none')"
  ></div>

  <aside
    class="shrink-0 bg-background flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
    :class="[
      // 移动端逻辑: Fixed, Z-Index 高, 阴影
      mobile
        ? 'fixed inset-y-0 left-0 z-50 h-full shadow-xl border-r'
        : 'relative border-r-0',

      // 开关逻辑
      uiStore.isLeftSidebarOpen
        ? mobile
          ? 'w-[85vw] max-w-[320px] opacity-100'
          : 'w-64 opacity-100 border-r'
        : 'w-0 opacity-0 border-none',
    ]"
  >
    <!-- 内部容器 -->
    <div
      class="h-full flex flex-col bg-background overflow-hidden"
      :class="mobile ? 'w-full' : 'w-64'"
    >
      <!-- 插槽：用于放入移动端导航栏 (原最左侧栏) -->
      <slot name="mobile-nav"></slot>

      <!-- 主内容插槽 -->
      <div class="flex-1 min-h-0 overflow-hidden p-2">
        <slot></slot>
      </div>
    </div>
  </aside>
</template>
