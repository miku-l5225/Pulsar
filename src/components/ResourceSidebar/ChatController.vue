<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  VirtualFolder,
  VirtualFile,
  useFileSystemStore,
} from "@/features/FileSystem/FileSystem.store";
import { useUIStore } from "@/features/UI/UI.store";
import { getNewTypedFile } from "@/schema/SemanticType";
import {
  MessageSquare,
  Plus,
  Search,
  MoreHorizontal,
  FilePenLine,
  Trash2,
  Folder,
} from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// ==========================================
// Props
// ==========================================
const props = defineProps<{
  /**
   * 目标文件夹路径，必须以 'chat' 结尾
   * 例如: "character/CharName/chat"
   */
  folderPath: string;

  /**
   * 包根目录路径
   * 例如: "character/CharName"
   */
  packagePath: string;

  /**
   * Manifest 文件完整路径
   * 例如: "character/CharName/manifest.[manifest].json"
   */
  manifestPath: string;
}>();

// ==========================================
// Stores & State
// ==========================================
const fsStore = useFileSystemStore();
const uiStore = useUIStore();

const rootNode = ref<VirtualFolder | null>(null);
const searchQuery = ref("");

const TEMPLATE_FILENAME = "TEMPLATE";
const CHAT_INDEX_FILENAME = "index.[chat].json";

// ==========================================
// Logic: Initialization & Template & Manifest
// ==========================================

/**
 * 验证路径并初始化节点
 * 1. 初始化 Chat 文件夹和 Template
 * 2. 确保 Manifest 文件存在于包目录
 */
const initFolder = async () => {
  if (!props.folderPath.endsWith("chat")) {
    console.warn(
      `[ChatController] Path must end with 'chat'. Given: ${props.folderPath}`
    );
    return;
  }

  // 等待 FS 初始化（如果尚未初始化）
  if (!fsStore.isInitialized) {
    await fsStore.init();
  }

  // 1. 处理 Chat 文件夹
  const node = fsStore.resolvePath(props.folderPath);
  if (node instanceof VirtualFolder) {
    rootNode.value = node;
    await ensureTemplateExists(node);
  } else {
    console.error(`[ChatController] Folder not found: ${props.folderPath}`);
    rootNode.value = null;
  }

  // 2. 处理 Manifest (位于包目录)
  await ensureManifestExists();
};

/**
 * 检查并创建 Chat 文件夹内的模板文件
 */
const ensureTemplateExists = async (folder: VirtualFolder) => {
  const templateNode = folder.children.get(TEMPLATE_FILENAME);

  if (!templateNode) {
    try {
      const defaultContent = getNewTypedFile("chat");
      await folder.createFile(TEMPLATE_FILENAME, defaultContent);
      console.log("[ChatController] Created missing TEMPLATE file.");
    } catch (e) {
      console.error("[ChatController] Failed to create TEMPLATE file", e);
    }
  }
};

/**
 * 检查并创建包目录下的 Manifest 文件
 */
const ensureManifestExists = async () => {
  if (!props.packagePath) return;

  // 解析包文件夹节点
  const packageNode = fsStore.resolvePath(props.packagePath);

  if (packageNode instanceof VirtualFolder) {
    // 获取 manifest 文件名 (从路径中提取，或硬编码)
    // 路径: character/CharName/manifest.[manifest].json -> 文件名: manifest.[manifest].json
    const manifestFileName = props.manifestPath.split("/").pop();

    if (manifestFileName && !packageNode.children.has(manifestFileName)) {
      try {
        console.log(
          `[ChatController] Manifest missing at ${props.manifestPath}, creating...`
        );
        const manifestContent = getNewTypedFile("manifest");
        await packageNode.createFile(manifestFileName, manifestContent);
        console.log("[ChatController] Manifest created successfully.");
      } catch (e) {
        console.error("[ChatController] Failed to create Manifest file", e);
      }
    }
  } else {
    console.warn(
      `[ChatController] Package folder not found: ${props.packagePath}`
    );
  }
};

// 监听路径变化重新初始化
watch(() => props.folderPath, initFolder, { immediate: true });

// ... (Rest of logic: List, Search, Actions remain the same) ...

// ==========================================
// Logic: List & Search
// ==========================================
const chatItems = computed(() => {
  if (!rootNode.value) return [];
  const query = searchQuery.value.toLowerCase();
  const items: VirtualFolder[] = [];
  for (const child of rootNode.value.children.values()) {
    if (!(child instanceof VirtualFolder)) continue;
    if (query && !child.name.toLowerCase().includes(query)) continue;
    items.push(child);
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
});

// ... (Actions: getUniqueFolderName, handleCreate, handleOpen, etc.) ...
const getUniqueFolderName = (base: string) => {
  if (!rootNode.value) return base;
  let name = base;
  let counter = 1;
  while (rootNode.value.children.has(name)) {
    counter++;
    name = `${base} (${counter})`;
  }
  return name;
};

const handleCreate = async () => {
  if (!rootNode.value) return;
  try {
    const templateNode = rootNode.value.children.get(TEMPLATE_FILENAME);
    let content: any = {};
    if (templateNode instanceof VirtualFile) {
      content = await templateNode.read();
      if (typeof content === "object") {
        content = JSON.parse(JSON.stringify(content));
      }
    } else {
      content = getNewTypedFile("chat");
    }
    const newFolderName = getUniqueFolderName("New Chat");
    const newDir = await rootNode.value.createDir(newFolderName);
    const newFile = await newDir.createFile(CHAT_INDEX_FILENAME, content);
    uiStore.openFile(newFile.path);
  } catch (e) {
    console.error("[ChatController] Failed to create chat", e);
    alert("创建失败: " + e);
  }
};

const handleOpen = (folder: VirtualFolder) => {
  const indexFile = folder.children.get(CHAT_INDEX_FILENAME);
  if (indexFile instanceof VirtualFile) {
    uiStore.openFile(indexFile.path);
  } else {
    const anyJson = Array.from(folder.children.values()).find(
      (c) => c.name.endsWith(".json") && c instanceof VirtualFile
    );
    if (anyJson) {
      uiStore.openFile(anyJson.path);
    }
  }
};

const handleRename = async (folder: VirtualFolder) => {
  const newName = prompt("重命名会话", folder.name);
  if (newName && newName !== folder.name) {
    try {
      await folder.rename(newName);
    } catch (e) {
      alert("重命名失败: " + e);
    }
  }
};

const handleDelete = async (folder: VirtualFolder) => {
  if (confirm(`确定要删除会话 "${folder.name}" 吗？此操作不可恢复。`)) {
    try {
      await folder.delete();
    } catch (e) {
      console.error(e);
      alert("删除失败");
    }
  }
};
</script>

<template>
  <div
    class="flex flex-col h-full w-full bg-sidebar-background select-none border-r border-border"
  >
    <!-- Template remains the same -->
    <div class="p-4 border-b border-border space-y-3">
      <div class="flex items-center justify-between">
        <h2
          class="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2"
        >
          <MessageSquare class="w-4 h-4" />
          会话列表
        </h2>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 hover:bg-accent"
          title="新建会话"
          @click="handleCreate"
        >
          <Plus class="h-4 w-4" />
        </Button>
      </div>
      <div class="relative">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索会话..."
          class="pl-8 h-9 text-xs bg-background"
        />
      </div>
    </div>

    <ScrollArea class="flex-1">
      <div class="p-2 space-y-1">
        <div v-if="!rootNode" class="text-xs text-destructive p-4 text-center">
          文件夹不存在: {{ folderPath }}
        </div>
        <div
          v-else-if="chatItems.length === 0"
          class="text-xs text-muted-foreground p-4 text-center"
        >
          {{ searchQuery ? "无搜索结果" : "暂无会话" }}
        </div>
        <div
          v-for="folder in chatItems"
          :key="folder.path"
          class="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
          @click="handleOpen(folder)"
        >
          <div class="flex items-center gap-3 overflow-hidden w-full">
            <div class="shrink-0">
              <Folder
                class="h-4 w-4 text-muted-foreground group-hover:text-foreground"
              />
            </div>
            <span class="text-sm truncate flex-1">
              {{ folder.name }}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                @click.stop
              >
                <MoreHorizontal class="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-40">
              <DropdownMenuItem @click="handleRename(folder)">
                <FilePenLine class="mr-2 h-3.5 w-3.5" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                @click="handleDelete(folder)"
                class="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 class="mr-2 h-3.5 w-3.5" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
