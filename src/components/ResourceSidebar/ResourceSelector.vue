<script setup lang="ts">
// ... (script 部分保持不变，无需修改) ...
import { ref, computed, watch, onMounted } from "vue";
import {
  VirtualFolder,
  VirtualFile,
  VirtualNode,
  useFileSystemStore,
} from "@/features/FileSystem/FileSystem.store";
import { useUIStore } from "@/features/UI/UI.store";
import { getNewTypedFile, SemanticType } from "@/schema/SemanticType";
import { ManifestContent } from "@/schema/manifest/manifest.types";
import {
  Folder,
  FileText,
  Plus,
  MoreHorizontal,
  FilePenLine,
  Trash2,
  ArrowRightLeft,
  RefreshCw,
  Search,
} from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

// ... (Props, Stores, State, Logic 全部保持不变) ...
const props = defineProps<{
  folderPath: string;
  packagePath: string;
  manifestPath: string;
}>();

const fsStore = useFileSystemStore();
const uiStore = useUIStore();
const localNode = ref<VirtualFolder | null>(null);
const globalNode = ref<VirtualFolder | null>(null);
const manifestContent = ref<ManifestContent | null>(null);
const searchQuery = ref("");
const isLocalSelectAll = ref(false);
const resourceType = computed<SemanticType | null>(() => {
  if (props.folderPath.endsWith("character")) return "character";
  if (props.folderPath.endsWith("lorebook")) return "lorebook";
  if (props.folderPath.endsWith("preset")) return "preset";
  return null;
});
const globalFolderPath = computed(() =>
  resourceType.value ? `global/${resourceType.value}` : ""
);
const localItems = ref<VirtualNode[]>([]);
const globalItems = ref<VirtualNode[]>([]);

const init = async () => {
  if (!fsStore.isInitialized) await fsStore.init();
  if (!resourceType.value) return;
  localNode.value = await ensureFolder(props.folderPath, false);
  globalNode.value = await ensureFolder(globalFolderPath.value, true);
  await refreshLists();
  await loadManifest();
};

const ensureFolder = async (
  path: string,
  allowCreate: boolean
): Promise<VirtualFolder | null> => {
  let node = fsStore.resolvePath(path);
  if (!node && allowCreate && path.includes("/")) {
    try {
      const parts = path.split("/");
      const name = parts.pop()!;
      const parentPath = parts.join("/");
      const parent = fsStore.resolvePath(parentPath);
      if (parent instanceof VirtualFolder) {
        return await parent.createDir(name);
      }
    } catch (e) {
      console.warn(`Failed to create folder ${path}`, e);
    }
  }
  return node instanceof VirtualFolder ? node : null;
};

const refreshLists = async () => {
  if (localNode.value) localItems.value = filterItems(localNode.value);
  if (globalNode.value) globalItems.value = filterItems(globalNode.value);
};

const filterItems = (folder: VirtualFolder): VirtualNode[] => {
  const query = searchQuery.value.toLowerCase();
  const items: VirtualNode[] = [];
  for (const child of folder.children.values()) {
    if (query && !child.name.toLowerCase().includes(query)) continue;
    if (resourceType.value === "character") {
      if (child instanceof VirtualFolder) items.push(child);
    } else {
      if (
        child instanceof VirtualFile &&
        child.name.endsWith(`.[${resourceType.value}].json`)
      ) {
        items.push(child);
      }
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
};

const loadManifest = async () => {
  let node = fsStore.resolvePath(props.manifestPath);
  if (!node && props.packagePath) {
    const pkg = fsStore.resolvePath(props.packagePath);
    if (pkg instanceof VirtualFolder) {
      const name = props.manifestPath.split("/").pop()!;
      try {
        node = await pkg.createFile(name, getNewTypedFile("manifest"));
      } catch {}
    }
  }
  if (node instanceof VirtualFile) {
    const content = await node.read();
    manifestContent.value =
      typeof content === "object" ? content : JSON.parse(content);
    // @ts-ignore
    const list =
      manifestContent.value?.selection?.[
        (resourceType.value as keyof typeof manifestContent.value.selection)!
      ] || [];
    isLocalSelectAll.value = list.includes(props.folderPath);
  }
};

const saveManifest = async () => {
  const node = fsStore.resolvePath(props.manifestPath);
  if (node instanceof VirtualFile && manifestContent.value) {
    await node.write(JSON.parse(JSON.stringify(manifestContent.value)));
  }
};

const toggleSelectAll = async (checked: boolean) => {
  if (
    !manifestContent.value ||
    !(resourceType.value as keyof typeof manifestContent.value.selection)
  )
    return;
  isLocalSelectAll.value = checked;
  let list =
    manifestContent.value.selection[
      resourceType.value as keyof typeof manifestContent.value.selection as keyof typeof manifestContent.value.selection
    ] || [];
  if (checked) {
    const globalPaths = list.filter((p) => p.startsWith("global/"));
    list = [props.folderPath, ...globalPaths];
  } else {
    list = list.filter((p) => p !== props.folderPath);
  }
  manifestContent.value.selection[
    resourceType.value as keyof typeof manifestContent.value.selection
  ] = list;
  await saveManifest();
};

const toggleItemSelection = async (itemPath: string, isGlobal: boolean) => {
  if (
    !manifestContent.value ||
    !(resourceType.value as keyof typeof manifestContent.value.selection)
  )
    return;
  if (!isGlobal && isLocalSelectAll.value) return;
  if (
    !manifestContent.value.selection[
      resourceType.value as keyof typeof manifestContent.value.selection
    ]
  ) {
    manifestContent.value.selection[
      resourceType.value as keyof typeof manifestContent.value.selection
    ] = [];
  }
  const list =
    manifestContent.value.selection[
      resourceType.value as keyof typeof manifestContent.value.selection
    ]!;
  const idx = list.indexOf(itemPath);
  if (idx > -1) list.splice(idx, 1);
  else list.push(itemPath);
  await saveManifest();
};

const isSelected = (path: string, isGlobal: boolean) => {
  if (
    !manifestContent.value ||
    !(resourceType.value as keyof typeof manifestContent.value.selection)
  )
    return false;
  if (!isGlobal && isLocalSelectAll.value) return true;
  const list =
    manifestContent.value.selection[
      resourceType.value as keyof typeof manifestContent.value.selection
    ] || [];
  return list.includes(path);
};

const getUniqueName = (
  folder: VirtualFolder,
  base: string,
  isDir: boolean
): string => {
  let name = base;
  let counter = 1;
  const checkExists = (n: string) => {
    if (isDir) return folder.children.has(n);
    const filename = `${n}.[${resourceType.value}].json`;
    return folder.children.has(filename);
  };
  while (checkExists(name)) {
    counter++;
    name = `${base} (${counter})`;
  }
  return name;
};

const handleCreate = async (isGlobal: boolean) => {
  const targetFolder = isGlobal ? globalNode.value : localNode.value;
  if (!targetFolder || !resourceType.value) return;
  const type = resourceType.value;
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const baseName = `New ${typeLabel}`;
  try {
    if (type === "character") {
      const uniqueName = getUniqueName(targetFolder, baseName, true);
      const newDir = await targetFolder.createDir(uniqueName);
      const content = getNewTypedFile("character", { name: uniqueName });
      await newDir.createFile("index.[character].json", content);
    } else {
      const uniqueName = getUniqueName(targetFolder, baseName, false);
      const fileName = `${uniqueName}.[${type}].json`;
      const content = getNewTypedFile(type, { name: uniqueName });
      await targetFolder.createFile(fileName, content);
    }
    await refreshLists();
  } catch (e) {
    console.error(e);
    alert("创建失败: " + e);
  }
};

const handleOpen = (item: VirtualNode) => {
  if (item instanceof VirtualFile) {
    uiStore.openFile(item.path);
  } else if (
    item instanceof VirtualFolder &&
    resourceType.value === "character"
  ) {
    const indexFile = Array.from(item.children.values()).find(
      (c) => c.name === "index.[character].json"
    );
    if (indexFile instanceof VirtualFile) {
      uiStore.openFile(indexFile.path);
    }
  }
};

const handleRename = async (item: VirtualNode) => {
  const currentName =
    resourceType.value === "character" ? item.name : item.name.split(".")[0];
  const newName = prompt("重命名", currentName);
  if (!newName || newName === currentName) return;
  try {
    if (resourceType.value === "character") {
      await item.rename(newName);
    } else {
      const fullNewName = `${newName}.[${resourceType.value}].json`;
      await item.rename(fullNewName);
    }
    await refreshLists();
  } catch (e) {
    alert("重命名失败: " + e);
  }
};

const handleDelete = async (item: VirtualNode) => {
  if (!confirm(`确定要删除 "${item.name}" 吗？`)) return;
  const pathToDelete = item.path;
  try {
    await item.delete();
    if (
      manifestContent.value &&
      (resourceType.value as keyof typeof manifestContent.value.selection)
    ) {
      let list =
        manifestContent.value.selection[
          resourceType.value as keyof typeof manifestContent.value.selection
        ] || [];
      if (list.includes(pathToDelete)) {
        list = list.filter((p) => p !== pathToDelete);
        manifestContent.value.selection[
          resourceType.value as keyof typeof manifestContent.value.selection
        ] = list;
        await saveManifest();
      }
    }
    await refreshLists();
  } catch (e) {
    alert("删除失败");
  }
};

const handleMove = async (item: VirtualNode, toGlobal: boolean) => {
  const targetFolder = toGlobal ? globalNode.value : localNode.value;
  if (!targetFolder) {
    if (toGlobal && !globalNode.value) alert("目标文件夹不存在");
    return;
  }
  const oldPath = item.path;
  try {
    await item.moveTo(targetFolder);
    if (
      manifestContent.value &&
      (resourceType.value as keyof typeof manifestContent.value.selection)
    ) {
      let list =
        manifestContent.value.selection[
          resourceType.value as keyof typeof manifestContent.value.selection
        ] || [];
      if (list.includes(oldPath)) {
        list = list.filter((p) => p !== oldPath);
        manifestContent.value.selection[
          resourceType.value as keyof typeof manifestContent.value.selection
        ] = list;
        await saveManifest();
      }
    }
    await refreshLists();
  } catch (e) {
    alert("移动失败: " + e);
  }
};

watch(() => props.folderPath, init);
onMounted(init);
</script>

<template>
  <div
    class="flex flex-col h-full w-full bg-background select-none border-r border-border"
  >
    <!-- Header (保持不变) -->
    <div class="p-4 border-b border-border space-y-3">
      <div class="flex items-center justify-between">
        <h2
          class="text-sm font-semibold flex items-center gap-2 tracking-tight"
        >
          <component
            :is="resourceType === 'character' ? Folder : FileText"
            class="w-4 h-4"
          />
          <span class="capitalize">{{ resourceType }}</span> 列表
        </h2>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          @click="refreshLists"
          title="刷新"
        >
          <RefreshCw class="w-4 h-4" />
        </Button>
      </div>
      <div class="relative">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索..."
          class="pl-8 h-9 text-xs bg-background"
        />
      </div>
    </div>

    <!-- Content Split (修改为纵向) -->
    <!-- 改动1: 添加 flex-col -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top: Local Column (修改为上方区块) -->
      <!-- 改动2: 将 border-r (右边框) 改为 border-b (下边框) -->
      <!-- 改动3: 将 min-w-0 改为 min-h-0 以支持纵向滚动 -->
      <div class="flex-1 flex flex-col border-b border-border min-h-0">
        <div
          class="p-2 bg-muted/30 border-b border-border flex items-center justify-between h-10 shrink-0"
        >
          <span class="text-xs font-medium text-muted-foreground px-2"
            >当前包</span
          >
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2" title="全选：将写入文件夹路径">
              <Label
                for="select-all"
                class="text-[10px] text-muted-foreground cursor-pointer"
                >全部选择</Label
              >
              <Switch
                id="select-all"
                :checked="isLocalSelectAll"
                @update:checked="toggleSelectAll"
                class="scale-75 origin-right"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6"
              @click="handleCreate(false)"
              title="新建"
            >
              <Plus class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea class="flex-1">
          <div class="p-2 space-y-1">
            <div
              v-if="localItems.length === 0"
              class="text-xs text-center p-4 text-muted-foreground"
            >
              {{ searchQuery ? "无搜索结果" : "暂无资源" }}
            </div>

            <div
              v-for="item in localItems"
              :key="item.path"
              class="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div class="flex items-center gap-3 overflow-hidden w-full">
                <Checkbox
                  :checked="isSelected(item.path, false)"
                  :disabled="isLocalSelectAll"
                  @update:checked="toggleItemSelection(item.path, false)"
                  class="shrink-0"
                />

                <div
                  class="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer"
                  @click="handleOpen(item)"
                >
                  <component
                    :is="item instanceof VirtualFolder ? Folder : FileText"
                    class="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                  />
                  <span class="text-sm truncate">
                    {{
                      resourceType === "character"
                        ? item.name
                        : item.name.split(".")[0]
                    }}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <MoreHorizontal class="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem @click="handleMove(item, true)">
                    <ArrowRightLeft class="mr-2 h-3.5 w-3.5" /> 移至 Global
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleRename(item)">
                    <FilePenLine class="mr-2 h-3.5 w-3.5" /> 重命名
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive"
                    @click="handleDelete(item)"
                  >
                    <Trash2 class="mr-2 h-3.5 w-3.5" /> 删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ScrollArea>
      </div>

      <!-- Bottom: Global Column (修改为下方区块) -->
      <!-- 改动4: 将 min-w-0 改为 min-h-0 -->
      <div class="flex-1 flex flex-col bg-muted/10 min-h-0">
        <div
          class="p-2 bg-muted/30 border-b border-border flex items-center justify-between h-10 shrink-0"
        >
          <span class="text-xs font-medium text-muted-foreground px-2"
            >全局库</span
          >
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6"
            @click="handleCreate(true)"
            title="新建"
          >
            <Plus class="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea class="flex-1">
          <div class="p-2 space-y-1">
            <div
              v-if="!globalNode"
              class="text-xs text-center p-4 text-destructive"
            >
              Global 文件夹未初始化
            </div>
            <div
              v-else-if="globalItems.length === 0"
              class="text-xs text-center p-4 text-muted-foreground"
            >
              {{ searchQuery ? "无搜索结果" : "暂无资源" }}
            </div>

            <div
              v-for="item in globalItems"
              :key="item.path"
              class="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div class="flex items-center gap-3 overflow-hidden w-full">
                <Checkbox
                  :checked="isSelected(item.path, true)"
                  @update:checked="toggleItemSelection(item.path, true)"
                  class="shrink-0"
                />

                <div
                  class="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer"
                  @click="handleOpen(item)"
                >
                  <component
                    :is="item instanceof VirtualFolder ? Folder : FileText"
                    class="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                  />
                  <span class="text-sm truncate">
                    {{
                      resourceType === "character"
                        ? item.name
                        : item.name.split(".")[0]
                    }}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <MoreHorizontal class="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem @click="handleMove(item, false)">
                    <ArrowRightLeft class="mr-2 h-3.5 w-3.5" /> 移至 Local
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleRename(item)">
                    <FilePenLine class="mr-2 h-3.5 w-3.5" /> 重命名
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive"
                    @click="handleDelete(item)"
                  >
                    <Trash2 class="mr-2 h-3.5 w-3.5" /> 删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  </div>
</template>
