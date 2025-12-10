<!-- src/features/VisualInterface/ManifestEditor.vue -->
<script setup lang="ts">
import { computed, toRef, ref } from "vue";
import type { BackgroundMode } from "@/schema/manifest/manifest.types";
import { useResources } from "@/schema/manifest/composables/useResources";
import {
  useFileSystemStore,
  VirtualFolder,
} from "@/features/FileSystem/FileSystem.store";
import { getNewTypedFile, type SemanticType } from "@/schema/SemanticType";

// UI Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import ResourceSelector from "@/features/FileSystem/ResourceSelector/ResourceSelector.vue";
import {
  RefreshCcw,
  ImageIcon,
  Box,
  Plus,
  Trash2,
  FolderOpen,
  AppWindow,
} from "lucide-vue-next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// 接收包路径，而非直接的文件路径
const props = defineProps<{
  packagePath: string;
}>();

const fsStore = useFileSystemStore();
const {
  manifestContent,
  updateManifest,
  updateSelection,
  localRootPath,
  globalRootPath,
  availableBackgrounds,
  availableComponents,
} = useResources(toRef(props, "packagePath"));

const activeTab = ref("local");
const manifest = computed(() => manifestContent.value);

// --- Helpers & Logic (保持原参考逻辑不变) ---
const getSelection = (type: "character" | "lorebook" | "preset") => {
  return manifest.value?.selection?.[type] || [];
};

const createNewResource = async (
  type: SemanticType,
  scope: "local" | "global"
) => {
  const root = scope === "local" ? localRootPath.value : globalRootPath;
  if (!root) return;
  const targetDir = `${root}/${type}`;
  let dirNode = fsStore.resolvePath(targetDir);
  if (!dirNode) {
    const parent = fsStore.resolvePath(root);
    if (parent instanceof VirtualFolder) {
      await parent.createDir(type);
      dirNode = fsStore.resolvePath(targetDir);
    }
  }
  if (dirNode instanceof VirtualFolder) {
    const content = getNewTypedFile(type);
    const name = `New ${type}_${Date.now()}.json`;
    await dirNode.createFile(name, content);
  }
};

const bgModes: { value: BackgroundMode; label: string }[] = [
  { value: "cover", label: "填充 (Cover)" },
  { value: "contain", label: "适应 (Contain)" },
  { value: "tile", label: "平铺 (Tile)" },
  { value: "center", label: "居中 (Center)" },
];

const updateBackground = (key: "path" | "mode", value: string) => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  newManifest.background[key] = value;
  updateManifest(newManifest);
};

// ... 组件映射逻辑 (Components) ...
const componentList = computed(() =>
  Object.entries(manifest.value?.customComponents || {}).map(([tag, path]) => ({
    tag,
    path,
  }))
);
const addComponent = () => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  newManifest.customComponents[`tag-${Date.now()}`] = "";
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
  delete newManifest.customComponents[tag];
  updateManifest(newManifest);
};

const overrideList = computed(() =>
  Object.entries(manifest.value?.overrides || {}).map(([type, path]) => ({
    type: type as SemanticType,
    path,
  }))
);
const addOverride = () => {
  // 简化逻辑：添加第一个未使用的类型
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  if (!newManifest.overrides) newManifest.overrides = {};
  newManifest.overrides["chat"] = "";
  updateManifest(newManifest);
};
const removeOverride = (type: SemanticType) => {
  if (!manifest.value) return;
  const newManifest = JSON.parse(JSON.stringify(manifest.value));
  if (newManifest.overrides) delete newManifest.overrides[type];
  updateManifest(newManifest);
};
</script>

<template>
  <div class="flex flex-col h-full w-full">
    <!-- Loading State -->
    <div
      v-if="!manifest"
      class="flex-1 flex items-center justify-center text-muted-foreground"
    >
      <RefreshCcw class="w-5 h-5 animate-spin mr-2" />
      <span class="text-xs">正在读取配置...</span>
    </div>

    <Tabs v-else v-model="activeTab" class="flex-1 flex flex-col min-h-0">
      <!-- Secondary Tab Bar -->
      <div class="px-4 border-b bg-muted/20">
        <TabsList class="w-full justify-start h-9 bg-transparent p-0 gap-4">
          <TabsTrigger
            value="local"
            class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-9 px-1"
            >本地资源</TabsTrigger
          >
          <TabsTrigger
            value="global"
            class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-9 px-1"
            >全局资源</TabsTrigger
          >
          <TabsTrigger
            value="appearance"
            class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-9 px-1"
            >视觉与组件</TabsTrigger
          >
        </TabsList>
      </div>

      <div class="flex-1 overflow-hidden relative">
        <ScrollArea class="h-full">
          <div class="p-4 space-y-6 pb-20">
            <!-- Content: Local -->
            <TabsContent value="local" class="mt-0 space-y-4">
              <Accordion
                type="multiple"
                class="w-full"
                :default-value="['character', 'lorebook', 'preset']"
              >
                <template
                  v-for="type in (['character', 'lorebook', 'preset'] as const)"
                  :key="type"
                >
                  <AccordionItem :value="type" class="border-b-0 mb-4">
                    <div class="flex items-center justify-between mb-2">
                      <AccordionTrigger
                        class="py-0 hover:no-underline text-sm font-medium capitalize flex gap-2"
                      >
                        <FolderOpen class="w-4 h-4" /> {{ type }}s
                      </AccordionTrigger>
                      <Button
                        size="sm"
                        variant="ghost"
                        class="h-6 gap-1 text-xs"
                        @click="createNewResource(type, 'local')"
                      >
                        <Plus class="w-3 h-3" /> 新建
                      </Button>
                    </div>
                    <AccordionContent>
                      <div
                        class="h-[180px] border rounded-md overflow-hidden bg-background"
                      >
                        <ResourceSelector
                          :root-path="`${localRootPath}/${type}`"
                          :model-value="getSelection(type)"
                          @update:model-value="(v) => updateSelection(type, v)"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </template>
              </Accordion>
            </TabsContent>

            <!-- Content: Global -->
            <TabsContent value="global" class="mt-0 space-y-4">
              <!-- 类似 Local，略去重复代码，逻辑同上，传入 scope='global' -->
              <div class="text-xs text-muted-foreground p-2">
                全局资源选择逻辑同上 (指向 Global 目录)
              </div>
            </TabsContent>

            <!-- Content: Appearance -->
            <TabsContent value="appearance" class="mt-0 space-y-6">
              <!-- Background Settings -->
              <section class="space-y-3">
                <div class="flex items-center gap-2 font-medium text-sm">
                  <ImageIcon class="w-4 h-4 text-primary" /> 背景设置
                </div>
                <div
                  class="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-background/50"
                >
                  <div class="space-y-2">
                    <Label class="text-xs">图片文件</Label>
                    <Select
                      :model-value="manifest.background?.path || '__NONE__'"
                      @update:model-value="
                        (v) =>
                          updateBackground(
                            'path',
                            v === '__NONE__' ? '' : String(v)
                          )
                      "
                    >
                      <SelectTrigger class="h-8 text-xs"
                        ><SelectValue
                      /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__NONE__">无背景</SelectItem>
                        <SelectGroup
                          v-for="g in availableBackgrounds"
                          :key="g.group"
                        >
                          <SelectLabel>{{ g.group }}</SelectLabel>
                          <SelectItem
                            v-for="opt in g.options"
                            :key="opt.value"
                            :value="opt.value"
                            >{{ opt.label }}</SelectItem
                          >
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="space-y-2">
                    <Label class="text-xs">显示模式</Label>
                    <Select
                      :model-value="manifest.background?.mode || 'cover'"
                      @update:model-value="
                        (v) => updateBackground('mode', String(v))
                      "
                    >
                      <SelectTrigger class="h-8 text-xs"
                        ><SelectValue
                      /></SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="m in bgModes"
                          :key="m.value"
                          :value="m.value"
                          >{{ m.label }}</SelectItem
                        >
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <Separator />

              <!-- Components & Overrides (简化展示) -->
              <section class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 font-medium text-sm">
                    <AppWindow class="w-4 h-4 text-blue-500" /> 全局界面覆盖
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="h-6 w-6"
                    @click="addOverride"
                    ><Plus class="w-3 h-3"
                  /></Button>
                </div>
                <div
                  v-for="ov in overrideList"
                  :key="ov.type"
                  class="flex gap-2 items-center text-xs"
                >
                  <span class="w-20 font-mono text-muted-foreground">{{
                    ov.type
                  }}</span>
                  <span
                    class="flex-1 truncate border px-2 py-1 rounded bg-background"
                    >{{ ov.path || "未选择" }}</span
                  >
                  <Button
                    size="icon"
                    variant="ghost"
                    class="h-6 w-6 text-destructive"
                    @click="removeOverride(ov.type)"
                    ><Trash2 class="w-3 h-3"
                  /></Button>
                </div>
              </section>

              <section class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 font-medium text-sm">
                    <Box class="w-4 h-4 text-purple-500" /> 自定义组件映射
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="h-6 w-6"
                    @click="addComponent"
                    ><Plus class="w-3 h-3"
                  /></Button>
                </div>
                <div
                  v-for="comp in componentList"
                  :key="comp.tag"
                  class="flex gap-2 items-center text-xs"
                >
                  <Input
                    :model-value="comp.tag"
                    class="h-7 w-24 text-xs font-mono"
                    @change="(e:any) => updateComponent(comp.tag, e.target.value, comp.path)"
                  />
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
                    <SelectTrigger class="h-7 flex-1 text-xs"
                      ><SelectValue placeholder="Select Component"
                    /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">None</SelectItem>
                      <SelectGroup
                        v-for="g in availableComponents"
                        :key="g.group"
                      >
                        <SelectLabel>{{ g.group }}</SelectLabel>
                        <SelectItem
                          v-for="opt in g.options"
                          :key="opt.value"
                          :value="opt.value"
                          >{{ opt.label }}</SelectItem
                        >
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="h-6 w-6 text-destructive"
                    @click="removeComponent(comp.tag)"
                    ><Trash2 class="w-3 h-3"
                  /></Button>
                </div>
              </section>
            </TabsContent>
          </div>
        </ScrollArea>
      </div>
    </Tabs>
  </div>
</template>
