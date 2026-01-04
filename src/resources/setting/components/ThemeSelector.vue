<!-- src/resources/setting/components/ThemeSelector.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { Check, Plus, Edit2, Trash2, MoreVertical } from "lucide-vue-next";
import { useTheme } from "@/components/layout/composables/useTheme";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const {
  themes,
  currentTheme,
  setTheme,
  addCustomTheme,
  updateCustomTheme,
  removeCustomTheme,
  getCustomThemeCSS,
} = useTheme();

// 添加/编辑主题的弹窗状态
const isDialogOpen = ref(false);
const editingThemeClass = ref<string | null>(null);
const cssInput = ref("");

// 示例 CSS 模板
const exampleCSS = `.theme-custom {
    --background: oklch(0.9578 0.0058 264.5321);
    --foreground: oklch(0.4355 0.043 279.325);
    --primary: oklch(0.5547 0.2503 297.0156);
    --primary-foreground: oklch(1 0 0);
    --accent: oklch(0.682 0.1448 235.3822);
    --accent-foreground: oklch(1 0 0);
}`;

// 打开添加主题弹窗
const openAddDialog = () => {
  editingThemeClass.value = null;
  cssInput.value = exampleCSS;
  isDialogOpen.value = true;
};

// 打开编辑主题弹窗
const openEditDialog = (themeClass: string) => {
  editingThemeClass.value = themeClass;
  const css = getCustomThemeCSS(themeClass);
  cssInput.value = css || "";
  isDialogOpen.value = true;
};

// 关闭弹窗
const closeDialog = () => {
  isDialogOpen.value = false;
  editingThemeClass.value = null;
  cssInput.value = "";
};

// 保存主题
const handleSave = () => {
  if (!cssInput.value.trim()) {
    return;
  }

  if (editingThemeClass.value) {
    // 编辑现有主题
    updateCustomTheme(editingThemeClass.value, cssInput.value);
  } else {
    // 添加新主题
    addCustomTheme(cssInput.value);
  }

  closeDialog();
};

// 删除主题
const handleDelete = (themeClass: string) => {
  if (confirm("确定要删除这个自定义主题吗？")) {
    removeCustomTheme(themeClass);
  }
};

// 分离内置主题和自定义主题
const builtInThemes = computed(() =>
  themes.value.filter((t) => !t.isCustom)
);
const customThemes = computed(() =>
  themes.value.filter((t) => t.isCustom)
);
</script>

<template>
  <div class="space-y-4">
    <!-- 内置主题 -->
    <div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        <button
          v-for="theme in builtInThemes"
          :key="theme.class"
          @click="setTheme(theme.class)"
          class="relative flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-2 text-left text-sm transition-all hover:bg-accent hover:text-accent-foreground"
          :class="{
            'border-primary bg-accent text-accent-foreground':
              currentTheme === theme.class,
            'border-muted': currentTheme !== theme.class,
          }"
        >
          <div class="flex w-full items-center gap-2">
            <div class="flex items-center gap-1.5">
              <div
                class="h-4 w-4 rounded-full shadow-sm ring-1 ring-inset ring-black/10 dark:ring-white/10"
                :style="{ backgroundColor: theme.colors[0] }"
              ></div>
              <div
                class="h-4 w-4 rounded-full shadow-sm ring-1 ring-inset ring-black/10 dark:ring-white/10"
                :style="{ backgroundColor: theme.colors[1] }"
              ></div>
            </div>
            <span class="font-medium truncate">{{ theme.name }}</span>
          </div>

          <div
            v-if="currentTheme === theme.class"
            class="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Check class="h-3 w-3" />
          </div>
        </button>
      </div>
    </div>

    <!-- 自定义主题 -->
    <div v-if="customThemes.length > 0" class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium">自定义主题</h3>
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        <div
          v-for="theme in customThemes"
          :key="theme.class"
          class="relative group"
        >
          <button
            @click="setTheme(theme.class)"
            class="relative flex w-full cursor-pointer flex-col items-start gap-2 rounded-lg border p-2 text-left text-sm transition-all hover:bg-accent hover:text-accent-foreground"
            :class="{
              'border-primary bg-accent text-accent-foreground':
                currentTheme === theme.class,
              'border-muted': currentTheme !== theme.class,
            }"
          >
            <div class="flex w-full items-center gap-2">
              <div class="flex items-center gap-1.5">
                <div
                  class="h-4 w-4 rounded-full shadow-sm ring-1 ring-inset ring-black/10 dark:ring-white/10"
                  :style="{ backgroundColor: theme.colors[0] }"
                ></div>
                <div
                  class="h-4 w-4 rounded-full shadow-sm ring-1 ring-inset ring-black/10 dark:ring-white/10"
                  :style="{ backgroundColor: theme.colors[1] }"
                ></div>
              </div>
              <span class="font-medium truncate flex-1">{{ theme.name }}</span>
            </div>

            <div
              v-if="currentTheme === theme.class"
              class="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Check class="h-3 w-3" />
            </div>
          </button>

          <!-- 自定义主题的操作菜单 -->
          <div
            class="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0"
                  @click.stop
                >
                  <MoreVertical class="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openEditDialog(theme.class)">
                  <Edit2 class="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click="handleDelete(theme.class)"
                  class="text-destructive"
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加自定义主题按钮 -->
    <div>
      <Button variant="outline" @click="openAddDialog" class="w-full">
        <Plus class="mr-2 h-4 w-4" />
        添加自定义主题
      </Button>
    </div>

    <!-- 添加/编辑主题弹窗 -->
    <Dialog :open="isDialogOpen" @update:open="closeDialog">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {{ editingThemeClass ? "编辑自定义主题" : "添加自定义主题" }}
          </DialogTitle>
          <DialogDescription>
            输入主题的 CSS 代码。系统会自动从 CSS 中提取主题名称和代表色。
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="space-y-2">
            <Label for="css-input">CSS 代码</Label>
            <Textarea
              id="css-input"
              v-model="cssInput"
              class="min-h-[300px] font-mono text-sm"
              placeholder="输入主题 CSS 代码..."
            />
            <p class="text-xs text-muted-foreground">
              提示：CSS 应包含一个以 <code>.theme-</code> 开头的类选择器，例如
              <code>.theme-custom</code>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" @click="closeDialog">取消</Button>
          <Button @click="handleSave">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
