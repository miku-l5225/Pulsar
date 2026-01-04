<!-- src/resources/preset/PresetManager.vue -->
<script setup lang="ts">
import {
	Check,
	Copy,
	FileText,
	Folder,
	Globe2,
	LayoutTemplate,
	MoreVertical,
	Pencil,
	Plus,
	Search,
	Share2,
	Trash2,
	XCircle,
} from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { PresetResourceItem } from "./usePresetResources";
import { usePresetResources } from "./usePresetResources";
import { VirtualFile } from "@/features/FileSystem/FileSystem.store";
import { useFileSystemStore } from "@/features/FileSystem/FileSystem.store";
import { useUIStore } from "@/features/UI/UI.store";

// ==========================
// Props
// ==========================
const props = defineProps<{
	packagePath: string | null;
}>();

const uiStore = useUIStore();
const fsStore = useFileSystemStore();

// 将 packagePath 转换为角色名称
const packageName = computed(() => {
	if (!props.packagePath) return null;
	try {
		return fsStore.resolvePackageName(props.packagePath);
	} catch (e) {
		console.warn("[PresetManager] Failed to resolve package name:", e);
		return null;
	}
});

// ==========================
// 使用 Preset Resources Hook
// ==========================
const { items, actions } = usePresetResources(packageName);

// ==========================
// 状态与计算
// ==========================
const searchQuery = ref("");
const activeMenuId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const filteredList = computed(() => {
	if (!searchQuery.value) return items.value;
	const q = searchQuery.value.toLowerCase();
	return items.value.filter((item) => item.name.toLowerCase().includes(q));
});

// ==========================
// 操作方法
// ==========================

// 1. 导航/打开
const handleItemClick = async (item: PresetResourceItem) => {
	const file = await item.open();
	if (file) {
		uiStore.setActiveFile(file.path);
	} else {
		console.warn("Cannot open item", item.path);
	}
};

// 2. 新建
const handleCreate = async () => {
	const name = prompt("新建预设");
	if (!name) return;

	try {
		await actions.newFile(name + ".json");
	} catch (e) {
		console.error(e);
		alert("创建失败");
	}
};

// 3. 上传/导入
const handleImport = async (e: Event) => {
	console.log("Import not implemented yet");
};

// 4. 重命名
const triggerRename = async (item: PresetResourceItem) => {
	activeMenuId.value = null;
	const newName = prompt("重命名", item.name);
	if (newName && newName !== item.name) {
		await item.rename(newName);
	}
};

// 5. 删除
const triggerDelete = async (item: PresetResourceItem) => {
	activeMenuId.value = null;
	if (confirm(`确定要删除 ${item.name} 吗?`)) {
		await item.delete();
	}
};

// 6. 切换 Signal (S/M/T)
const toggleSignal = async (
	item: PresetResourceItem,
	signal: "S" | "M" | "T" | null,
) => {
	activeMenuId.value = null;
	if (item.node instanceof VirtualFile) {
		if (signal) {
			await item.node.setSignal(signal);
		} else {
			await item.node.removeSignal();
		}
	}
};

// UI 辅助
const toggleMenu = (path: string) => {
	activeMenuId.value = activeMenuId.value === path ? null : path;
};
const closeMenu = () => {
	activeMenuId.value = null;
};
onMounted(() => document.addEventListener("click", closeMenu));
onUnmounted(() => document.removeEventListener("click", closeMenu));
</script>

<template>
  <div class="flex flex-col h-full bg-background text-foreground">
    <!-- Top Bar -->
    <div class="flex items-center gap-2 p-3 border-b border-border shrink-0">
      <div class="relative flex-1">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          v-model="searchQuery"
          class="w-full pl-8 pr-2 py-1.5 text-xs bg-muted/50 border border-transparent focus:border-primary/50 focus:bg-background rounded-md outline-none transition-all placeholder:text-muted-foreground/50"
          placeholder="搜索资源..."
        />
      </div>
      <button
        @click="handleCreate"
        class="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
        title="新建"
      >
        <Plus class="w-4 h-4" />
      </button>
      <input ref="fileInput" type="file" multiple class="hidden" @change="handleImport" />
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <div v-if="filteredList.length === 0" class="text-center py-8 text-xs text-muted-foreground">
        暂无内容
      </div>

      <div
        v-for="item in filteredList"
        :key="item.path"
        class="group flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 border border-transparent hover:border-border/50 transition-all cursor-pointer"
        @click="handleItemClick(item)"
      >
        <!-- Checkbox -->
        <div
          class="shrink-0 flex items-center justify-center w-5 h-5 cursor-pointer"
          @click.stop="item.toggleSelection && item.toggleSelection()"
        >
          <div
            v-if="item.isSelected"
            class="w-4 h-4 rounded-sm bg-primary flex items-center justify-center text-primary-foreground shadow-sm"
          >
            <Check class="w-3 h-3" />
          </div>
          <div
            v-else
            class="w-4 h-4 rounded-sm border border-muted-foreground/30 group-hover:border-primary/50 bg-background transition-colors"
          ></div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="flex items-center gap-1.5">
            <Folder v-if="item.isDirectory" class="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
            <FileText v-else class="w-3.5 h-3.5 text-muted-foreground" />

            <span class="text-sm font-medium truncate text-foreground/90">{{ item.name }}</span>

            <!-- Signals -->
            <div class="flex items-center gap-0.5" v-if="item.node instanceof VirtualFile">
                <span v-if="item.node.isTemplate" class="text-[10px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">T</span>
                <span v-if="item.node.signal === 'S'" class="text-[10px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-600 font-medium">S</span>
                <span v-if="item.node.signal === 'M'" class="text-[10px] px-1 py-0.5 rounded bg-orange-500/10 text-orange-600 font-medium">M</span>
            </div>
          </div>

          <div class="text-[10px] text-muted-foreground/60 truncate pl-5 h-3.5">
            {{ item.extraDisplayText || item.path }}
          </div>
        </div>

        <!-- Menu Button -->
        <div class="shrink-0 relative" @click.stop>
          <button
            @click="toggleMenu(item.path)"
            class="p-1 rounded hover:bg-background hover:shadow-sm opacity-0 group-hover:opacity-100 transition-all text-muted-foreground"
          >
            <MoreVertical class="w-4 h-4" />
          </button>

          <!-- Dropdown -->
          <div
            v-if="activeMenuId === item.path"
            class="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50 py-1 flex flex-col text-sm origin-top-right animate-in fade-in zoom-in-95 duration-75"
          >
            <!-- File Actions -->
            <button @click="triggerRename(item)" class="text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2">
              <Pencil class="w-3.5 h-3.5" /> 重命名
            </button>
            <button @click="actions.copy && actions.copy(item)" class="text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2">
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>

            <div class="h-px bg-border my-1"></div>

            <!-- Signal Actions (Only for Files) -->
            <template v-if="!item.isDirectory">
                <button @click="toggleSignal(item, 'T')" class="text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2">
                  <LayoutTemplate class="w-3.5 h-3.5" :class="item.node.isTemplate ? 'text-primary' : ''"/> 设为模板
                </button>
                <button @click="toggleSignal(item, 'S')" class="text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2">
                  <Share2 class="w-3.5 h-3.5" :class="item.node.signal === 'S' ? 'text-primary' : ''"/> 设为共享
                </button>
                <button @click="toggleSignal(item, 'M')" class="text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2">
                  <Globe2 class="w-3.5 h-3.5" :class="item.node.signal === 'M' ? 'text-primary' : ''"/> 全局混入 (Mixin)
                </button>
                <button @click="toggleSignal(item, null)" class="text-left px-3 py-1.5 hover:bg-accent text-muted-foreground flex items-center gap-2">
                  <XCircle class="w-3.5 h-3.5" /> 清除标记
                </button>
            </template>

            <div class="h-px bg-border my-1"></div>

            <button @click="triggerDelete(item)" class="text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive flex items-center gap-2">
              <Trash2 class="w-3.5 h-3.5" /> 删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

