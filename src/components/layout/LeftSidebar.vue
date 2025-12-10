<!-- src/components/layout/LeftSidebar.vue -->
<script setup lang="ts">
import { type PropType, type Component, computed, watchEffect, ref } from "vue";
import { useColorMode, useStorage, onClickOutside } from "@vueuse/core";
import {
  Sun,
  Moon,
  Palette,
  Check,
  CheckCircle2,
  Circle,
} from "lucide-vue-next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import draggable from "vuedraggable";
import { SidebarView, useUIStore } from "@/features/UI/UI.store";
import {
  useCustomPageStore,
  type CustomPage,
} from "@/features/CustomPage/CustomPage.store";

type OnClickAction = string | Function;

// 扩展 ButtonConfig 接口，增加 isActive 可选属性
interface ButtonConfig {
  svg: Component;
  onClick: OnClickAction;
  title?: string;
  isActive?: boolean; // 新增：允许外部传入激活状态
}
type ButtonGroup = ButtonConfig[];

const props = defineProps({
  top: { type: Array as PropType<ButtonGroup>, required: true },
  bottom: { type: Array as PropType<ButtonGroup>, required: true },
  customPages: { type: Array as PropType<CustomPage[]>, default: () => [] },
});

const uiStore = useUIStore();
const customPageStore = useCustomPageStore();

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
/* 常规逻辑 (主题、按钮点击)                                               */
/* ======================================================================== */
const mode = useColorMode();
const themeIconComponent = computed(() => (mode.value === "dark" ? Sun : Moon));
const themeTitle = computed(
  () => `切换到${mode.value === "dark" ? "亮色" : "暗色"}模式`
);
const toggleTheme = () => {
  mode.value = mode.value === "dark" ? "light" : "dark";
};

/* ======================================================================== */
/* 主题切换                                                       */
/* ======================================================================== */
const themes = [
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

const currentTheme = useStorage("color-theme", "theme-default");
const setTheme = (themeClass: string) => (currentTheme.value = themeClass);

watchEffect(() => {
  if (typeof window === "undefined") return;
  const htmlEl = document.documentElement;
  themes.forEach((theme) => {
    if (htmlEl.classList.contains(theme.class))
      htmlEl.classList.remove(theme.class);
  });
  if (currentTheme.value && currentTheme.value !== "theme-default") {
    htmlEl.classList.add(currentTheme.value);
  }
});

// 修改判断激活状态的逻辑，支持传入 item 对象检查 isActive
const isItemActive = (item: ButtonConfig): boolean => {
  // 1. 如果配置了 isActive 属性，优先使用
  if (item.isActive !== undefined) return item.isActive;

  // 2. 否则按原有逻辑判断 LeftSidebarView
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
      <Popover>
        <PopoverTrigger as-child>
          <button
            title="切换主题"
            class="flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
          >
            <Palette class="size-[18px] text-sidebar-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" class="w-40 p-2">
          <div class="flex flex-col gap-1">
            <button
              v-for="theme in themes"
              :key="theme.name"
              @click="setTheme(theme.class)"
              class="flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
            >
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1.5">
                  <div
                    class="size-3 rounded-full"
                    :style="{ backgroundColor: theme.colors[0] }"
                  ></div>
                  <div
                    class="size-3 rounded-full"
                    :style="{ backgroundColor: theme.colors[1] }"
                  ></div>
                </div>
                <span>{{ theme.name }}</span>
              </div>
              <Check v-if="currentTheme === theme.class" class="size-4" />
            </button>
          </div>
        </PopoverContent>
      </Popover>

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
