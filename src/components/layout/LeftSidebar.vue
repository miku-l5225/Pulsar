<!-- src/components/layout/LeftSidebar.vue -->
<script setup lang="ts">
import { onClickOutside, useColorMode } from "@vueuse/core";
import { CheckCircle2, Circle, Moon, Sun } from "lucide-vue-next";
import { type Component, computed, type PropType, ref } from "vue";
import draggable from "vuedraggable";
import {
	type CustomPage,
	useCustomPageStore,
} from "@/features/CustomPage/CustomPage.store";
import { type SidebarView, useUIStore } from "@/features/UI/UI.store";
import { useTheme } from "./composables/useTheme"; // 引入 hook

type OnClickAction = string | Function;

interface ButtonConfig {
	svg: Component;
	onClick: OnClickAction;
	title?: string;
	isActive?: boolean;
}
type ButtonGroup = ButtonConfig[];

const props = defineProps({
	top: { type: Array as PropType<ButtonGroup>, required: true },
	bottom: { type: Array as PropType<ButtonGroup>, required: true },
	customPages: { type: Array as PropType<CustomPage[]>, default: () => [] },
});

const uiStore = useUIStore();
const customPageStore = useCustomPageStore();

// 初始化主题 (确保 CSS 样式被应用到 html 标签上)
useTheme();

/* ======================================================================== */
/* 拖拽排序逻辑                                                           */
/* ======================================================================== */
const dragOptions = {
	animation: 200,
	group: "sidebar-custom-icons",
	ghostClass: "ghost-icon",
	delay: 100,
	delayOnTouchOnly: true,
};

const draggableCustomPages = computed({
	get: () => props.customPages,
	set: (newVal: CustomPage[]) => {
		const newOrder = newVal.map((p) => p.name);
		customPageStore.setOrder(newOrder);
	},
});

/* ======================================================================== */
/* 右键菜单逻辑 (Context Menu)                                            */
/* ======================================================================== */
const showContextMenu = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });
const contextMenuRef = ref<HTMLElement | null>(null);

onClickOutside(contextMenuRef, () => {
	showContextMenu.value = false;
});

const handleContextMenu = (e: MouseEvent) => {
	e.preventDefault();
	showContextMenu.value = true;
	contextMenuPos.value = { x: e.clientX, y: e.clientY };
};

const togglePageVisibility = (page: CustomPage) => {
	const isCurrentlyHidden = !page.isVisible;
	customPageStore.toggleVisibility(page.name);
	if (isCurrentlyHidden) {
		uiStore.openFile(page.entry);
	}
};

/* ======================================================================== */
/* 亮色/暗色模式逻辑 (保留快速切换)                                          */
/* ======================================================================== */
const mode = useColorMode();
const themeIconComponent = computed(() => (mode.value === "dark" ? Sun : Moon));
const themeTitle = computed(
	() => `切换到${mode.value === "dark" ? "亮色" : "暗色"}模式`,
);
const toggleTheme = () => {
	mode.value = mode.value === "dark" ? "light" : "dark";
};

const isItemActive = (item: ButtonConfig): boolean => {
	if (item.isActive !== undefined) return item.isActive;
	if (typeof item.onClick === "string") {
		return uiStore.uiState.leftSidebarView === item.onClick;
	}
	return false;
};

const isCustomPageActive = (entry: string): boolean => {
	return uiStore.uiState.activeFile === entry;
};

const handleButtonClick = (action: OnClickAction) => {
	if (typeof action === "string") {
		if (action === "files" || action === "character") {
			uiStore.toggleSidebarView(action as SidebarView);
		} else {
			uiStore.openFile(action);
		}
	} else if (typeof action === "function") {
		action();
	}
};
</script>

<template>
  <nav
    class="bg-sidebar text-sidebar-foreground flex h-full w-[54px] flex-col transition-all duration-200 z-10 relative"
    @contextmenu="handleContextMenu"
  >
    <div
      class="flex flex-1 min-h-0 flex-col items-center gap-2.5 px-3 py-3 overflow-y-auto no-scrollbar"
      data-tauri-drag-region
    >
      <!-- 1. 顶部固定按钮 -->
      <template v-for="item in top" :key="item.title">
        <button
          :title="item.title"
          @click="handleButtonClick(item.onClick)"
          class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
          :class="{
            'bg-sidebar-accent': isItemActive(item),
          }"
        >
          <component
            :is="item.svg"
            class="shrink-0 size-[18px]"
            :class="
              isItemActive(item)
                ? 'text-sidebar-accent-foreground'
                : 'text-sidebar-foreground'
            "
          />
        </button>
      </template>

      <!-- 2. 可拖拽的自定义页面区域 -->
      <draggable
        v-model="draggableCustomPages"
        item-key="name"
        v-bind="dragOptions"
        class="flex flex-col gap-2.5 w-full items-center"
      >
        <template #item="{ element }">
          <button
            :title="element.name"
            @click="uiStore.openFile(element.entry)"
            class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent group relative"
            :class="{
              'bg-sidebar-accent': isCustomPageActive(element.entry),
            }"
          >
            <img
              v-if="element.icon"
              :src="element.icon"
              class="size-[18px] object-contain transition-transform group-active:scale-95"
              draggable="false"
              alt=""
            />
            <div v-else class="size-[18px] bg-muted rounded-sm"></div>
          </button>
        </template>
      </draggable>
    </div>

    <!-- 底部固定按钮 -->
    <div
      class="flex flex-col items-center justify-center gap-2.5 px-[11px] pb-2.5 pt-3 shrink-0"
    >
      <!-- 原有的 Palette Popover 已移除，移动到了设置页面 -->

      <button
        :title="themeTitle"
        @click="toggleTheme"
        class="flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
      >
        <component
          :is="themeIconComponent"
          class="size-[18px] text-sidebar-foreground"
        />
      </button>

      <template v-for="item in bottom" :key="item.title">
        <button
          :title="item.title"
          @click="handleButtonClick(item.onClick)"
          class="flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
          :class="{
            'bg-sidebar-accent': isItemActive(item),
          }"
        >
          <component
            :is="item.svg"
            class="size-[18px]"
            :class="
              isItemActive(item)
                ? 'text-sidebar-accent-foreground'
                : 'text-sidebar-foreground'
            "
          />
        </button>
      </template>
    </div>

    <Teleport to="body">
      <div
        v-if="showContextMenu"
        ref="contextMenuRef"
        class="fixed z-50 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        :style="{ top: `${contextMenuPos.y}px`, left: `${contextMenuPos.x}px` }"
      >
        <div class="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          显示/隐藏页面
        </div>
        <div class="h-px bg-border my-1" />
        <button
          v-for="page in customPageStore.allPages"
          :key="page.name"
          @click="togglePageVisibility(page)"
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        >
          <span
            class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
          >
            <CheckCircle2 v-if="page.isVisible" class="h-4 w-4" />
            <Circle v-else class="h-4 w-4 text-muted-foreground/30" />
          </span>
          <span class="pl-8">{{ page.name }}</span>
        </button>
      </div>
    </Teleport>
  </nav>
</template>

<style scoped>
.ghost-icon {
  opacity: 0.5;
  background-color: hsl(var(--sidebar-accent));
  border-radius: 0.375rem;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
