<!-- src/schema/lorebook/components/EntryEditor.vue -->
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { LorebookEntry } from "@/schema/lorebook/lorebook.types";
import { cloneDeep } from "lodash-es";
import {
  Plus,
  Search,
  Zap,
  ZapOff,
  Database,
  ArrowRight,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
  Layers,
  SkipForward,
  Copy,
  Filter,
} from "lucide-vue-next";

// --- 自定义组件 ---
import ExecutableStringEditor from "./ExecutableStringEditor.vue";
import PopableTextarea from "@/components/SchemaRenderer/content-elements/PopableTextarea.vue";

// --- Shadcn UI 组件 ---
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// --- Props & Emits ---
interface Props {
  modelValue: LorebookEntry[];
}
const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);

// --- State ---
const localEntries = ref<LorebookEntry[]>(cloneDeep(props.modelValue || []));
const selectedGroup = ref<string>("All");
const searchQuery = ref<string>("");

// --- Role Options (汉化) ---
const roleOptions = [
  { value: "system", label: "系统 (System)" },
  { value: "user", label: "用户 (User)" },
  { value: "assistant", label: "助手 (Assistant)" },
  { value: "tool", label: "工具 (Tool)" },
];

// --- Computed ---
const groups = computed(() => {
  const g = new Set(localEntries.value.map((e) => e.groupName || "未分组"));
  return ["All", ...Array.from(g).sort()];
});

const getGroupLabel = (group: string) => {
  if (group === "All") return "全部分组";
  if (group === "Ungrouped") return "未分组";
  return group;
};

const filteredEntries = computed(() => {
  return localEntries.value.filter((entry) => {
    const entryGroup = entry.groupName || "未分组";
    const currentSelection =
      selectedGroup.value === "All" ? "All" : selectedGroup.value;

    const matchGroup =
      currentSelection === "All" || entryGroup === currentSelection;

    const query = searchQuery.value.toLowerCase();
    const matchSearch =
      !query ||
      entry.name.toLowerCase().includes(query) ||
      entry.groupName?.toLowerCase().includes(query) ||
      entry.activationEffect.content.toLowerCase().includes(query) ||
      entry.activationWhen.condition.some((c) =>
        c.toLowerCase().includes(query)
      );

    return matchGroup && matchSearch;
  });
});

// --- Actions ---
watch(
  localEntries,
  (newVal) => {
    emit("update:modelValue", newVal);
  },
  { deep: true }
);

const addEntry = () => {
  const newEntry: LorebookEntry = {
    id: crypto.randomUUID().slice(0, 8),
    name: "新条目",
    description: "",
    groupName: selectedGroup.value === "All" ? "默认分组" : selectedGroup.value,
    enabled: true,
    escapeScanWhenRecursing: false,
    activationWhen: { alwaysActivation: false, condition: [] },
    activationEffect: {
      role: "system",
      position: "SCENARIO",
      content: "",
      insertion_order: 100,
      intervalsToCreate: { type: "", length: "", content: {} },
    },
  };
  localEntries.value.unshift(newEntry);
};

const removeEntry = (id: string) => {
  if (confirm("确定要删除这个世界书条目吗？")) {
    localEntries.value = localEntries.value.filter((e) => e.id !== id);
  }
};

const duplicateEntry = (entry: LorebookEntry) => {
  const newEntry = cloneDeep(entry);
  newEntry.id = crypto.randomUUID().slice(0, 8);
  newEntry.name = `${newEntry.name} (副本)`;
  localEntries.value.unshift(newEntry);
};
</script>

<template>
  <!-- 主容器：改为 flex-col 垂直布局，移除侧边栏 -->
  <div
    class="flex flex-col h-[600px] w-full bg-background border border-border rounded-xl overflow-hidden shadow-sm font-sans"
  >
    <!-- 工具栏头部 -->
    <header
      class="bg-background border-b border-border px-4 py-3 flex items-center gap-3 shrink-0"
    >
      <!-- 分组筛选 (原侧边栏功能迁移至此) -->
      <div class="w-[180px] shrink-0">
        <Select v-model="selectedGroup">
          <SelectTrigger class="h-9 text-xs">
            <div class="flex items-center gap-2 truncate">
              <Filter class="h-3.5 w-3.5 text-muted-foreground" />
              <span>{{ getGroupLabel(selectedGroup) }}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="group in groups" :key="group" :value="group">
              <div
                class="flex items-center justify-between w-full gap-4 text-xs"
              >
                <span>{{ getGroupLabel(group) }}</span>
                <Badge variant="secondary" class="h-4 px-1 text-[10px]">
                  {{
                    group === "All"
                      ? localEntries.length
                      : localEntries.filter(
                          (e) => (e.groupName || "未分组") === group
                        ).length
                  }}
                </Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- 搜索框 -->
      <div class="relative flex-1">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4"
        />
        <Input
          v-model="searchQuery"
          placeholder="搜索条目..."
          class="pl-9 h-9 bg-muted/50 border-transparent focus:bg-background focus:border-ring transition-all text-xs shadow-none w-full"
        />
      </div>

      <!-- 添加按钮 -->
      <Button size="sm" class="h-9 px-4 shadow-sm shrink-0" @click="addEntry">
        <Plus class="h-4 w-4 mr-2" />
        添加
      </Button>
    </header>

    <!-- 条目列表区域 (主内容) -->
    <div class="flex-1 min-h-0 bg-muted/20 relative">
      <ScrollArea class="h-full">
        <div class="p-4 sm:p-6 space-y-6">
          <div
            v-for="entry in filteredEntries"
            :key="entry.id"
            :class="[
              'group relative bg-card text-card-foreground rounded-xl border transition-all duration-200 overflow-hidden',
              entry.enabled
                ? 'border-border shadow-sm hover:border-primary/50'
                : 'border-border/50 opacity-60 bg-muted/30 grayscale-[0.8]',
            ]"
          >
            <!-- 卡片头部: 元数据 -->
            <div
              class="flex flex-wrap items-center justify-between px-4 py-2 border-b border-border bg-muted/40 gap-2"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <!-- 启用/禁用 开关 -->
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        @click="entry.enabled = !entry.enabled"
                        :class="[
                          'p-1.5 rounded-md transition-colors border',
                          entry.enabled
                            ? 'text-primary bg-primary/10 border-primary/20 hover:bg-primary/20'
                            : 'text-muted-foreground bg-background border-border hover:bg-muted',
                        ]"
                      >
                        <Eye v-if="entry.enabled" class="h-4 w-4" />
                        <EyeOff v-else class="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {{ entry.enabled ? "禁用此条目" : "启用此条目" }}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <!-- 名称 & 分组 -->
                <div class="flex flex-col min-w-0 gap-1 flex-1">
                  <!-- Ghost Input for Title -->
                  <Input
                    v-model="entry.name"
                    class="h-7 px-1.5 py-0 border-transparent shadow-none hover:bg-background focus-visible:bg-background focus-visible:ring-1 bg-transparent text-sm font-bold placeholder:text-muted-foreground/50 w-full min-w-[120px]"
                    placeholder="条目名称"
                  />
                  <div class="flex items-center gap-2">
                    <Input
                      v-model="entry.groupName"
                      placeholder="未分组"
                      class="h-5 w-24 px-1.5 py-0 text-[10px] bg-background/50 border-transparent hover:border-border rounded shadow-none text-muted-foreground focus-visible:ring-1 focus-visible:bg-background"
                    />
                    <span class="text-[10px] text-muted-foreground select-none">
                      ID: {{ entry.id }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 右侧操作 -->
              <div
                class="flex items-center gap-3 pl-2 border-l border-border/50"
              >
                <!-- 优先级输入 -->
                <div class="flex flex-col items-end">
                  <span
                    class="uppercase text-[9px] font-bold text-muted-foreground/70 tracking-wider"
                  >
                    权重
                  </span>
                  <input
                    type="number"
                    v-model.number="entry.activationEffect.insertion_order"
                    class="w-12 text-right text-xs font-mono bg-transparent border-b border-dashed border-border focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
                    title="插入顺序权重"
                  />
                </div>

                <!-- 递归扫描开关 -->
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        @click="
                          entry.escapeScanWhenRecursing =
                            !entry.escapeScanWhenRecursing
                        "
                        :class="[
                          'p-1.5 rounded transition-colors',
                          entry.escapeScanWhenRecursing
                            ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30'
                            : 'text-muted-foreground hover:text-foreground',
                        ]"
                      >
                        <SkipForward class="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>递归扫描跳过</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <!-- 下拉菜单 -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-32">
                    <DropdownMenuItem @click="duplicateEntry(entry)">
                      <Copy class="mr-2 h-3.5 w-3.5" /> 复制
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      @click="removeEntry(entry.id)"
                      class="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 class="mr-2 h-3.5 w-3.5" /> 删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <!-- 卡片主体 -->
            <div
              class="flex flex-col md:flex-row text-sm divide-y md:divide-y-0 md:divide-x divide-border"
            >
              <!-- 左侧: 激活条件 -->
              <div
                class="md:w-5/12 bg-muted/30 p-4 flex flex-col gap-3 relative"
              >
                <div class="flex items-center justify-between mb-1">
                  <div
                    class="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wide"
                  >
                    <Zap class="h-3.5 w-3.5" /> 激活规则
                  </div>
                  <button
                    @click="
                      entry.activationWhen.alwaysActivation =
                        !entry.activationWhen.alwaysActivation
                    "
                    :class="[
                      'text-[10px] px-2 py-0.5 rounded-full border transition-all font-medium flex items-center gap-1',
                      entry.activationWhen.alwaysActivation
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50',
                    ]"
                  >
                    <span v-if="entry.activationWhen.alwaysActivation"
                      >常驻激活</span
                    >
                    <span v-else>条件激活</span>
                    <Zap
                      v-if="entry.activationWhen.alwaysActivation"
                      class="h-3 w-3 fill-current"
                    />
                    <ZapOff v-else class="h-3 w-3" />
                  </button>
                </div>

                <div class="flex-1 min-h-[60px]">
                  <ExecutableStringEditor
                    v-if="!entry.activationWhen.alwaysActivation"
                    v-model="entry.activationWhen.condition"
                    class="w-full"
                    placeholder="添加触发关键词..."
                  />
                  <div
                    v-else
                    class="h-full flex flex-col items-center justify-center text-green-600/70 dark:text-green-400/70 text-xs italic p-4 border border-dashed border-green-200 dark:border-green-800 rounded-lg bg-green-50/50 dark:bg-green-900/10 text-center"
                  >
                    此条目始终生效，<br />无需配置触发词。
                  </div>
                </div>
              </div>

              <!-- 右侧: 内容效果 -->
              <div
                class="flex-1 bg-card p-4 flex flex-col gap-3 min-w-0 relative"
              >
                <!-- 视觉箭头连接符 -->
                <div
                  class="absolute top-1/2 -left-3 -translate-y-1/2 z-10 hidden md:flex items-center justify-center text-muted-foreground bg-background rounded-full h-6 w-6 border border-border shadow-sm"
                >
                  <ArrowRight class="h-3 w-3" />
                </div>

                <div class="flex items-center justify-between mb-1">
                  <div
                    class="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide"
                  >
                    <Database class="h-3.5 w-3.5" /> 内容效果
                  </div>

                  <!-- 设置行 -->
                  <div class="flex gap-2">
                    <Select v-model="entry.activationEffect.role">
                      <SelectTrigger
                        class="h-6 w-[110px] text-[10px] px-2 bg-background border-input"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="r in roleOptions"
                          :key="r.value"
                          :value="r.value"
                        >
                          {{ r.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      v-model="entry.activationEffect.position"
                      placeholder="插入位置"
                      title="Position"
                      class="h-6 w-24 text-[10px] px-2 bg-background border-input"
                    />
                  </div>
                </div>

                <!-- 内容编辑器 -->
                <PopableTextarea
                  v-model="entry.activationEffect.content"
                  placeholder="在此输入世界书内容..."
                  dialogTitle="编辑详细内容"
                  class="text-xs font-mono leading-relaxed bg-background border-input focus-visible:ring-primary/20 min-h-[100px] resize-none shadow-sm"
                />
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-if="filteredEntries.length === 0"
            class="flex flex-col items-center justify-center py-16 text-muted-foreground"
          >
            <Layers class="h-12 w-12 mb-4 opacity-20" />
            <p class="text-sm font-medium">没有找到匹配的条目。</p>
            <Button
              variant="link"
              size="sm"
              @click="
                selectedGroup = 'All';
                searchQuery = '';
              "
              class="mt-2 text-primary"
            >
              清除筛选条件
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>

<style scoped>
/* 使用 CSS 变量适配滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-muted-foreground);
  opacity: 0.5;
}
</style>
