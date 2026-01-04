<!-- src/components/EnvironmentSidebar/ContentRouter.vue -->
<script setup lang="ts">
import {
	BookOpen,
	Box,
	ChevronLeft,
	Image as ImageIcon,
	LayoutGrid,
	MessageSquare,
	Settings2,
	User,
} from "lucide-vue-next";
import { computed, markRaw, ref } from "vue";
import { useUIStore } from "@/features/UI/UI.store";

// 引入具体的 Manager 组件
import CharacterManager from "@/resources/character/CharacterManager.vue";
import ChatManager from "@/resources/chat/ChatManager.vue";
import LorebookManager from "@/resources/lorebook/LorebookManager.vue";
import PresetManager from "@/resources/preset/PresetManager.vue";
import BackgroundManager from "@/resources/background/BackgroundManager.vue";
import ComponentManager from "@/resources/component/ComponentManager.vue";

// 类型定义
type PanelId =
	| "chat"
	| "character"
	| "lorebook"
	| "preset"
	| "background"
	| "component";

interface PanelCard {
	id: PanelId;
	title: string;
	description: string;
	icon: any;
	component: any;
}

interface PanelGroup {
	groupName: string;
	children: PanelCard[];
}

// 定义分组配置
const PANEL_GROUPS: PanelGroup[] = [
	{
		groupName: "Narrative",
		children: [
			{
				id: "chat",
				title: "对话",
				description: "剧情分支与历史记录",
				icon: MessageSquare,
				component: markRaw(ChatManager),
			},
		],
	},
	{
		groupName: "Resources",
		children: [
			{
				id: "character",
				title: "角色",
				description: "角色卡与相关配置",
				icon: User,
				component: markRaw(CharacterManager),
			},
			{
				id: "lorebook",
				title: "世界书",
				description: "扩展词条与知识库",
				icon: BookOpen,
				component: markRaw(LorebookManager),
			},
			{
				id: "preset",
				title: "预设",
				description: "生成参数与模型配置",
				icon: Settings2,
				component: markRaw(PresetManager),
			},
		],
	},
	{
		groupName: "Assets",
		children: [
			{
				id: "background",
				title: "背景与视觉",
				description: "环境背景图片管理",
				icon: ImageIcon,
				component: markRaw(BackgroundManager),
			},
			{
				id: "component",
				title: "组件",
				description: "UI 覆写与内联组件",
				icon: Box,
				component: markRaw(ComponentManager),
			},
		],
	},
];

const uiStore = useUIStore();

// 状态管理
const activePanelId = ref<PanelId | null>(null);

// 计算当前激活的文件所属的包路径
// ResourcePanel 会将 packagePath 转换为角色名称（packageName）
const packagePath = computed(() => {
	const activeFile = uiStore.uiState.activeFile;
	if (!activeFile) return null;
	// 传给 ResourcePanel，它会使用 resolvePackageName 将路径转换为角色名称
	return activeFile;
});

const activeCard = computed(() => {
	if (!activePanelId.value) return null;
	for (const group of PANEL_GROUPS) {
		const found = group.children.find((c) => c.id === activePanelId.value);
		if (found) return found;
	}
	return null;
});

const openPanel = (id: PanelId) => {
	activePanelId.value = id;
};

const closePanel = () => {
	activePanelId.value = null;
};
</script>

<template>
  <div class="h-full w-full bg-background flex flex-col overflow-hidden border-r border-border">
    <!-- 状态 A: 未检测到环境/文件 -->
    <div
      v-if="!packagePath"
      class="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 select-none"
    >
      <LayoutGrid class="w-10 h-10 opacity-20" />
      <div class="text-sm">未选择环境</div>
    </div>

    <!-- 状态 B: 显示 Panel (详情页) -->
    <div v-else-if="activePanelId && activeCard" class="flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
      <!-- Header -->
      <div class="flex items-center gap-2 p-3 border-b border-border bg-muted/30 shrink-0">
        <button
          @click="closePanel"
          class="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
          title="返回"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-2 text-sm font-medium">
          <component :is="activeCard.icon" class="w-4 h-4 text-primary" />
          <span>{{ activeCard.title }}</span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden relative">
        <!--
          关键点：使用 :key="activePanelId"
          当切换面板时，强制重新渲染组件，触发生命周期和 setup
        -->
        <component
          :is="activeCard.component"
          :key="activePanelId"
          :packagePath="packagePath"
          class="h-full w-full"
        />
      </div>
    </div>

    <!-- 状态 C: 显示分组卡片列表 (导航页) -->
    <div v-else class="flex-1 overflow-y-auto p-4 space-y-6">
      <div v-for="group in PANEL_GROUPS" :key="group.groupName">
        <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          {{ group.groupName }}
        </h3>
        <div class="grid grid-cols-1 gap-2">
          <div
            v-for="card in group.children"
            :key="card.id"
            @click="openPanel(card.id)"
            class="group relative flex items-start gap-4 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 cursor-pointer transition-all duration-200"
          >
            <div class="p-2 rounded-md bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
              <component :is="card.icon" class="w-4 h-4" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h4 class="text-sm font-medium text-foreground mb-0.5">
                {{ card.title }}
              </h4>
              <p class="text-xs text-muted-foreground line-clamp-1">
                {{ card.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
