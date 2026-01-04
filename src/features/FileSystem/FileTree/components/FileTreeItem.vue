<!-- src/features/FileSystem/FileTree/components/FileTreeItem.vue -->
<script setup lang="ts">
import {
	Archive, // 用于压缩
	ArchiveRestore,
	Ban, // 用于取消
	ChevronDown,
	ChevronRight,
	Clipboard,
	Copy,
	CopyPlus,
	ExternalLink,
	Eye,
	FileEdit,
	FileJson,
	FileX2,
	Folder as FolderIcon,
	FolderOpen,
	FolderSymlink,
	Image as ImageIcon,
	MonitorPlay,
	MonitorStop,
	Plus,
	Scissors,
	Share2, // 用于 Shared
	Shuffle, // 用于 Mixed
	Trash2,
} from "lucide-vue-next";
import { computed } from "vue";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { type SemanticType, SemanticTypeMap } from "@/resources/SemanticType";
import { type FileSignal, useFileSystemStore, VirtualFile } from "../..";
import { useFileOperations } from "../composables/useFileOperations";
import type { FlatTreeItem } from "../composables/useFileTree";

const props = defineProps<{
	item: FlatTreeItem;
	canPaste: boolean;
}>();

const store = useFileSystemStore();

// --- 更新 emits，添加 compress 和 decompress ---
defineEmits<{
	(e: "click"): void;
	(e: "dblclick"): void;
	(e: "create-file"): void;
	(e: "create-folder"): void;
	(e: "rename"): void;
	(e: "delete"): void;
	(e: "permanent-delete"): void;
	(e: "cut"): void;
	(e: "copy"): void;
	(e: "duplicate"): void;
	(e: "paste"): void;
	(e: "copy-path", type: "relative" | "absolute" | "src"): void;
	// 新增事件
	(e: "compress"): void;
	(e: "decompress"): void;
	(e: "reveal-in-explorer"): void;
	(e: "open-default"): void;
	(e: "set-signal", signal: FileSignal | null): void;
}>();

const ops = useFileOperations();

// Icons
const icon = computed(() => {
	if (props.item.isFolder) return FolderIcon;
	if (props.item.name.endsWith(".json")) return FileJson;
	if (/\.(jpg|png|webp)$/i.test(props.item.name)) return ImageIcon;
	return FileJson; // Default
});

// Semantic Types for Context Menu
const creatableTypes = Object.keys(SemanticTypeMap).filter(
	(t) => t !== "unknown" && t !== "setting" && t !== "modelConfig",
) as SemanticType[];

const handleCreateTyped = (type: SemanticType) => {
	ops.handleCreateTyped(props.item.path, type);
};

// 获取真实节点引用（用于获取 signal, isWatching 等实时状态）
// 使用 computed 使得文件名变更或属性变更时响应
const realNode = computed(() => store.resolvePath(props.item.path));

// 1. 获取 Signal 状态
const currentSignal = computed(() => {
	const node = realNode.value;
	if (node instanceof VirtualFile) {
		return node.signal;
	}
	return null;
});

// 2. 显示名称 (隐藏 .[character-S] 等)
const displayName = computed(() => {
	const name = props.item.name;
	if (!name) return "";

	if (props.item.isFolder) return name;
	if (name.startsWith("$")) return name.substring(1);

	const lastDotIndex = name.lastIndexOf(".");
	const nameWithoutExt =
		lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;

	// 匹配 .[xxx]
	const semanticMatch = nameWithoutExt.match(/\.\[(.*?)\]$/);
	return semanticMatch
		? nameWithoutExt.substring(0, semanticMatch.index)
		: nameWithoutExt;
});

const isZipFile = computed(
	() => !props.item.isFolder && props.item.name.toLowerCase().endsWith(".zip"),
);

const isWatching = computed(() => realNode.value?.isWatching || false);

const toggleWatch = async () => {
	const node = realNode.value;
	if (!node) return;
	if (node.isWatching) node.unwatch();
	else await node.watch();
};
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger
      class="flex items-center space-x-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer select-none group w-full transition-colors"
      @click="$emit('click')"
      @dblclick="$emit('dblclick')"
    >
      <div
        class="flex grow items-center overflow-hidden"
        :style="{ paddingLeft: `${item.indentLevel * 20}px` }"
      >
        <!-- Arrow -->
        <component
          v-if="item.isFolder"
          :is="item.isExpanded ? ChevronDown : ChevronRight"
          class="h-4 w-4 shrink-0 text-muted-foreground mr-1"
        />
        <span v-else class="w-4 h-4 shrink-0 mr-1"></span>

        <!-- Main Icon -->
        <component
          :is="icon"
          class="mr-2 h-4 w-4 shrink-0"
          :class="item.isFolder ? 'text-blue-400' : 'text-slate-500'"
        />

        <!-- Name -->
        <span class="truncate" :title="item.name">{{ displayName }}</span>

        <!-- Badges for Signal -->
        <span
          v-if="currentSignal === 'S'"
          class="ml-2 px-1 py-0.5 text-[10px] font-bold leading-none text-green-700 bg-green-100 rounded border border-green-200"
          title="Shared"
        >
          S
        </span>
        <span
          v-else-if="currentSignal === 'M'"
          class="ml-2 px-1 py-0.5 text-[10px] font-bold leading-none text-purple-700 bg-purple-100 rounded border border-purple-200"
          title="Mixed"
        >
          M
        </span>

        <!-- Watch Indicator -->
        <div
          v-if="isWatching"
          class="ml-auto flex items-center pl-2"
          title="正在监听"
        >
          <Eye class="h-3.5 w-3.5 text-blue-500 animate-pulse" />
        </div>
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent class="w-56">
      <ContextMenuItem @select="$emit('create-file')">
        <Plus class="mr-2 h-4 w-4" />新建文件
      </ContextMenuItem>
      <ContextMenuItem @select="$emit('create-folder')">
        <Plus class="mr-2 h-4 w-4" />新建文件夹
      </ContextMenuItem>

      <!-- New Typed File -->
      <ContextMenuSub v-if="item.isFolder">
        <ContextMenuSubTrigger>
          <Plus class="h-4 w-4" style="margin-right: 14px" />
          新建类型文件
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem
            v-for="t in creatableTypes"
            :key="t"
            @select="handleCreateTyped(t)"
          >
            {{ t }}
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      <!-- Signal / Sharing Menu (Only for Files) -->
      <ContextMenuSub v-if="!item.isFolder">
        <ContextMenuSubTrigger>
          <Share2 class="mr-2 h-4 w-4" />
          资源共享设置
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-48">
          <ContextMenuCheckboxItem
            :checked="currentSignal === 'S'"
            @select="$emit('set-signal', 'S')"
          >
            <Share2 class="mr-2 h-4 w-4 text-green-600" />
            设为共享 (Shared)
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            :checked="currentSignal === 'M'"
            @select="$emit('set-signal', 'M')"
          >
            <Shuffle class="mr-2 h-4 w-4 text-purple-600" />
            设为自动混入 (Mixed)
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem @select="$emit('set-signal', null)">
            <Ban class="mr-2 h-4 w-4" />
            取消共享
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuItem @select="toggleWatch">
        <component
          :is="isWatching ? MonitorStop : MonitorPlay"
          class="mr-2 h-4 w-4"
        />
        {{ isWatching ? "停止监听" : "开始监听" }}
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem @select="$emit('open-default')">
        <ExternalLink class="mr-2 h-4 w-4" />以默认方式打开
      </ContextMenuItem>
      <ContextMenuItem @select="$emit('reveal-in-explorer')">
        <FolderSymlink class="mr-2 h-4 w-4" />在资源管理器中打开
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem @select="$emit('copy-path', 'src')">
        <FolderOpen class="mr-2 h-4 w-4" />复制 Asset URL
      </ContextMenuItem>
      <ContextMenuItem @select="$emit('copy-path', 'absolute')">
        <FolderSymlink class="mr-2 h-4 w-4" />复制绝对路径
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem v-if="item.isFolder" @select="$emit('compress')">
        <Archive class="mr-2 h-4 w-4" />压缩为 Zip
      </ContextMenuItem>
      <ContextMenuItem v-if="isZipFile" @select="$emit('decompress')">
        <ArchiveRestore class="mr-2 h-4 w-4" />解压到当前目录
      </ContextMenuItem>

      <ContextMenuSeparator v-if="item.isFolder || isZipFile" />

      <ContextMenuItem @select="$emit('cut')">
        <Scissors class="mr-2 h-4 w-4" />剪切
      </ContextMenuItem>
      <ContextMenuItem @select="$emit('copy')">
        <Copy class="mr-2 h-4 w-4" />复制
      </ContextMenuItem>
      <ContextMenuItem @select="$emit('duplicate')">
        <CopyPlus class="mr-2 h-4 w-4" />创建副本
      </ContextMenuItem>
      <ContextMenuItem @select="$emit('paste')" :disabled="!canPaste">
        <Clipboard class="mr-2 h-4 w-4" />粘贴
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem @select="$emit('rename')">
        <FileEdit class="mr-2 h-4 w-4" />重命名
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem @select="$emit('delete')">
        <Trash2 class="mr-2 h-4 w-4" />移入垃圾桶
      </ContextMenuItem>
      <ContextMenuItem
        @select="$emit('permanent-delete')"
        class="text-red-600 focus:text-red-600 focus:bg-red-50"
      >
        <FileX2 class="mr-2 h-4 w-4" />永久删除
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
