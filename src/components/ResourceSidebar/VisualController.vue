<script setup lang="ts">
import { computed, toRef, ref } from "vue";
import { useResources } from "@/schema/manifest/composables/useResources";
import {
  useFileSystemStore,
  VirtualFolder,
} from "@/features/FileSystem/FileSystem.store";
import { SemanticType } from "@/schema/SemanticType";
import type { BackgroundMode } from "@/schema/manifest/manifest.types";

// UI Components
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ImageIcon,
  Box,
  Plus,
  Trash2,
  FileType,
  AppWindow,
  Upload,
  Palette,
} from "lucide-vue-next";

// ==========================================
// Props
// ==========================================
const props = defineProps<{
  folderPath?: string; //虽然可能不需要，但为了保持接口一致
  packagePath: string; // 包根目录，用于上传
  manifestPath: string; // Manifest 路径
}>();

// ==========================================
// Setup
// ==========================================
const fsStore = useFileSystemStore();

// 复用 Manifest 逻辑
const {
  manifestContent,
  updateManifest,
  availableBackgrounds,
  availableComponents,
} = useResources(toRef(props, "manifestPath"));

const manifest = computed(() => manifestContent.value);

// ==========================================
// Feature: Image Upload
// ==========================================
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

const triggerUpload = () => {
  fileInputRef.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  isUploading.value = true;

  try {
    // 1. 确定目标文件夹: packagePath/background
    const bgFolderPath = `${props.packagePath}/background`;
    let bgNode = fsStore.resolvePath(bgFolderPath);

    // 如果文件夹不存在，创建它
    if (!bgNode) {
      const packageNode = fsStore.resolvePath(props.packagePath);
      if (packageNode instanceof VirtualFolder) {
        bgNode = await packageNode.createDir("background");
      }
    }

    if (bgNode instanceof VirtualFolder) {
      // 2. 读取文件内容
      const arrayBuffer = await file.arrayBuffer();
      // 注意：这里假设 VirtualFile 支持写入二进制或以某种方式处理
      // 实际实现中可能需要根据你的 VirtualFileSystem 实现调整写入方式
      // 这里演示写入 Buffer 或 Blob
      await bgNode.createFile(file.name, new Uint8Array(arrayBuffer));

      // 3. 自动选中新上传的背景
      updateBackground("path", file.name); // 假设只存文件名，或者存相对路径

      console.log(`[Appearance] Uploaded ${file.name} successfully.`);
    }
  } catch (e) {
    console.error("[Appearance] Upload failed", e);
    alert("上传失败: " + e);
  } finally {
    isUploading.value = false;
    // 重置 input 以允许再次上传同名文件
    if (fileInputRef.value) fileInputRef.value.value = "";
  }
};

// ==========================================
// Logic: Background
// ==========================================
const bgModes: { value: BackgroundMode; label: string }[] = [
  { value: "cover", label: "填充 (Cover)" },
  { value: "contain", label: "适应 (Contain)" },
  { value: "tile", label: "平铺 (Tile)" },
  { value: "center", label: "居中 (Center)" },
];

const updateBackground = (key: "path" | "mode", value: string) => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  if (!newManifest.background) newManifest.background = {};
  newManifest.background[key] = value;
  updateManifest(newManifest);
};

// ==========================================
// Logic: Overrides (Interface)
// ==========================================
const semanticTypes: SemanticType[] = [
  "chat",
  "statistic",
  "lorebook",
  "character",
  "setting",
  "modelConfig",
];

const overrideList = computed(() =>
  Object.entries(manifest.value?.overrides || {}).map(([type, path]) => ({
    type: type as SemanticType,
    path,
  }))
);

const addOverride = () => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  const existingTypes = Object.keys(newManifest.overrides || {});
  const nextType =
    semanticTypes.find((t) => !existingTypes.includes(t)) || "chat";

  if (!newManifest.overrides) newManifest.overrides = {};
  newManifest.overrides[nextType] = "";
  updateManifest(newManifest);
};

const updateOverride = (
  oldType: SemanticType,
  newType: SemanticType,
  newPath: string
) => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  const overs = newManifest.overrides || {};
  if (oldType !== newType) delete overs[oldType];
  overs[newType] = newPath;
  newManifest.overrides = overs;
  updateManifest(newManifest);
};

const removeOverride = (type: SemanticType) => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  if (newManifest.overrides) delete newManifest.overrides[type];
  updateManifest(newManifest);
};

// ==========================================
// Logic: Custom Components
// ==========================================
const componentList = computed(() =>
  Object.entries(manifest.value?.customComponents || {}).map(([tag, path]) => ({
    tag,
    path,
  }))
);

const addComponent = () => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  if (!newManifest.customComponents) newManifest.customComponents = {};
  newManifest.customComponents[`new-tag-${Date.now()}`] = "";
  updateManifest(newManifest);
};

const updateComponent = (oldTag: string, newTag: string, newPath: string) => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  const comps = newManifest.customComponents || {};
  if (oldTag !== newTag) delete comps[oldTag];
  comps[newTag] = newPath;
  newManifest.customComponents = comps;
  updateManifest(newManifest);
};

const removeComponent = (tag: string) => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  if (newManifest.customComponents) delete newManifest.customComponents[tag];
  updateManifest(newManifest);
};
</script>

<template>
  <div
    class="flex flex-col h-full w-full bg-sidebar-background select-none border-r border-border"
  >
    <!-- Header -->
    <div class="p-4 border-b border-border space-y-1">
      <div class="flex items-center gap-2 text-foreground">
        <Palette class="w-4 h-4" />
        <h2 class="text-sm font-semibold tracking-tight">视觉与外观</h2>
      </div>
      <p class="text-[10px] text-muted-foreground">
        配置背景图像、界面覆盖及自定义组件映射。
      </p>
    </div>

    <!-- Scrollable Content -->
    <ScrollArea class="flex-1">
      <div class="p-4 space-y-6">
        <!-- Section: Background -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h3
              class="text-xs font-medium flex items-center gap-2 text-foreground"
            >
              <ImageIcon class="w-3.5 h-3.5 text-muted-foreground" />
              全局背景
            </h3>
            <!-- Upload Button -->
            <div class="flex items-center gap-1">
              <input
                type="file"
                ref="fileInputRef"
                class="hidden"
                accept="image/*"
                @change="handleFileUpload"
              />
              <Button
                variant="outline"
                size="sm"
                class="h-6 text-[10px] px-2 gap-1"
                @click="triggerUpload"
                :disabled="isUploading"
              >
                <Upload class="w-3 h-3" />
                {{ isUploading ? "上传中..." : "上传图片" }}
              </Button>
            </div>
          </div>

          <div class="p-3 bg-background border rounded-lg space-y-3 shadow-sm">
            <div class="space-y-1.5">
              <Label
                class="text-[10px] text-muted-foreground uppercase tracking-wider"
                >图片源</Label
              >
              <Select
                :model-value="manifest?.background?.path || '__NONE__'"
                @update:model-value="
                  (v) =>
                    updateBackground('path', v === '__NONE__' ? '' : String(v))
                "
              >
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue placeholder="选择图片..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__" class="text-muted-foreground"
                    >无背景</SelectItem
                  >
                  <SelectGroup
                    v-for="group in availableBackgrounds"
                    :key="group.group"
                  >
                    <SelectLabel>{{ group.group }}</SelectLabel>
                    <SelectItem
                      v-for="opt in group.options"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <Label
                class="text-[10px] text-muted-foreground uppercase tracking-wider"
                >显示模式</Label
              >
              <Select
                :model-value="manifest?.background?.mode || 'cover'"
                @update:model-value="(v) => updateBackground('mode', String(v))"
              >
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="m in bgModes"
                    :key="m.value"
                    :value="m.value"
                  >
                    {{ m.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <Separator />

        <!-- Section: Interface Overrides -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <h3
                class="text-xs font-medium flex items-center gap-2 text-foreground"
              >
                <AppWindow class="w-3.5 h-3.5 text-muted-foreground" />
                界面覆盖 (Overrides)
              </h3>
              <p class="text-[10px] text-muted-foreground">
                接管特定类型文件的默认渲染界面。
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6"
              @click="addOverride"
            >
              <Plus class="w-3.5 h-3.5" />
            </Button>
          </div>

          <div class="space-y-2">
            <div
              v-if="!overrideList.length"
              class="text-[10px] text-center py-4 bg-muted/30 border border-dashed rounded text-muted-foreground"
            >
              暂无覆盖配置
            </div>
            <div
              v-for="ov in overrideList"
              :key="ov.type"
              class="flex flex-col gap-2 p-2 rounded-md bg-background border shadow-sm group"
            >
              <div class="flex gap-2">
                <Select
                  :model-value="ov.type"
                  @update:model-value="(v) => updateOverride(ov.type, v as SemanticType, ov.path)"
                >
                  <SelectTrigger
                    class="w-[100px] h-7 text-xs bg-muted/50 border-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="t in semanticTypes"
                      :key="t"
                      :value="t"
                      >{{ t }}</SelectItem
                    >
                  </SelectContent>
                </Select>
                <div class="flex-1 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    @click="removeOverride(ov.type)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <Select
                :model-value="ov.path || '__NONE__'"
                @update:model-value="
                  (v) =>
                    updateOverride(
                      ov.type,
                      ov.type,
                      v === '__NONE__' ? '' : String(v)
                    )
                "
              >
                <SelectTrigger class="h-7 text-xs">
                  <SelectValue placeholder="选择组件文件 (.vue)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">默认渲染</SelectItem>
                  <SelectGroup
                    v-for="group in availableComponents"
                    :key="group.group"
                  >
                    <SelectLabel>{{ group.group }}</SelectLabel>
                    <SelectItem
                      v-for="opt in group.options"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <Separator />

        <!-- Section: Custom Components -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <h3
                class="text-xs font-medium flex items-center gap-2 text-foreground"
              >
                <Box class="w-3.5 h-3.5 text-muted-foreground" />
                组件映射
              </h3>
              <p class="text-[10px] text-muted-foreground">
                注册用于对话流的自定义标签。
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6"
              @click="addComponent"
            >
              <Plus class="w-3.5 h-3.5" />
            </Button>
          </div>

          <div class="space-y-2">
            <div
              v-if="!componentList.length"
              class="text-[10px] text-center py-4 bg-muted/30 border border-dashed rounded text-muted-foreground"
            >
              暂无自定义组件
            </div>
            <div
              v-for="comp in componentList"
              :key="comp.tag"
              class="p-2 rounded-md bg-background border shadow-sm group space-y-2"
            >
              <div class="flex items-center gap-2">
                <FileType class="w-3 h-3 text-muted-foreground shrink-0" />
                <Input
                  :model-value="comp.tag"
                  @change="(e: Event) => updateComponent(comp.tag, (e.target as any).value, comp.path)"
                  class="h-6 text-xs font-mono border-0 bg-muted/50 focus-visible:ring-0 px-1 w-full"
                  placeholder="tag-name"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-6 w-6 shrink-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="removeComponent(comp.tag)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </Button>
              </div>

              <Select
                :model-value="comp.path || '__NONE__'"
                @update:model-value="
                  (v) =>
                    updateComponent(
                      comp.tag,
                      comp.tag,
                      v === '__NONE__' ? '' : String(v)
                    )
                "
              >
                <SelectTrigger class="h-7 text-xs">
                  <SelectValue placeholder="选择组件文件 (.vue)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">未绑定</SelectItem>
                  <SelectGroup
                    v-for="group in availableComponents"
                    :key="group.group"
                  >
                    <SelectLabel>{{ group.group }}</SelectLabel>
                    <SelectItem
                      v-for="opt in group.options"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  </div>
</template>
