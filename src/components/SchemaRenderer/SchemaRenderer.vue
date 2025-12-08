<!-- src/components/SchemaRenderer/SchemaRenderer.vue -->
<script setup lang="ts">
import { ref, computed, type Component } from "vue";
import { get, set } from "lodash-es";

// --- Shadcn UI 组件导入 ---
import Item from "@/components/ui/item/Item.vue";
import ItemActions from "@/components/ui/item/ItemActions.vue";
import ItemContent from "@/components/ui/item/ItemContent.vue";
import ItemDescription from "@/components/ui/item/ItemDescription.vue";
import ItemTitle from "@/components/ui/item/ItemTitle.vue";
import Separator from "@/components/ui/separator/Separator.vue";
import Button from "@/components/ui/button/Button.vue";
import Input from "@/components/ui/input/Input.vue";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import Switch from "@/components/ui/switch/Switch.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import { ScrollArea } from "@/components/ui/scroll-area";

// 导入自定义封装的组件
import WrappedSelect from "./content-elements/WrappedSelect.vue";
import EnhancedSlider from "./content-elements/EnhancedSlider.vue";
import PopableTextarea from "./content-elements/PopableTextarea.vue";
import RegexEditor from "./content-elements/RegexEditor.vue";
import JSCodeEditor from "./content-elements/JSCodeEditor.vue";
import VariableEditor from "./content-elements/VariableEditor.vue";

import { Group, Schema, ComponentName } from "./SchemaRenderer.types";

const defaultComponents: Record<string, Component> = {
  Button,
  Input,
  Checkbox,
  Switch,
  Textarea,
  Select: WrappedSelect,
  Slider: EnhancedSlider,
  PopableTextarea,
  RegexEditor,
  JSCodeEditor,
  VariableEditor,
};

// --- Props 和 Emits ---
const props = defineProps<{
  schema: Schema;
  data: Record<string, any>;
}>();

const emit = defineEmits(["update:data"]);

// --- 状态管理 ---
const activeGroupIndex = ref(0);
// [NEW] 控制侧边栏折叠状态
const isCollapsed = ref(false);

// --- 计算属性 ---

const availableComponents = computed(() => {
  return { ...defaultComponents, ...props.schema.components };
});

const clickableGroups = computed(() =>
  props.schema.content.filter((item): item is Group => typeof item === "object")
);

const activeGroup = computed<Group | undefined>(() => {
  return clickableGroups.value[activeGroupIndex.value];
});

// --- 方法 ---

function handleGroupClick(group: Group) {
  const index = clickableGroups.value.indexOf(group);
  if (index !== -1) {
    activeGroupIndex.value = index;
  }
}

function updateData(path: string, value: any) {
  const newData = JSON.parse(JSON.stringify(props.data));
  set(newData, path, value);
  emit("update:data", newData);
}

function resolveComponent(name: ComponentName): Component | string {
  const component = availableComponents.value[name];
  if (component) {
    return component;
  }
  console.warn(`Component "${name}" not found.`);
  return name;
}
</script>

<template>
  <div class="flex h-full bg-background text-foreground overflow-hidden">
    <!-- Left Sidebar -->
    <aside
      :class="[
        'border-r flex flex-col min-h-0 transition-all duration-300 ease-in-out relative overflow-hidden',
        isCollapsed
          ? 'w-[60px] min-w-[60px] items-center'
          : 'w-1/4 min-w-[250px]',
      ]"
    >
      <div
        :class="[
          'flex items-center p-2',
          isCollapsed ? 'justify-center' : 'justify-end',
        ]"
      >
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          @click="isCollapsed = !isCollapsed"
          :title="isCollapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <!-- 这里使用简单的 SVG 图标，对应 PanelLeftClose / PanelLeftOpen -->
          <svg
            v-if="!isCollapsed"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="9" x2="9" y1="3" y2="21" />
            <path d="m14 15-3-3 3-3" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="9" x2="9" y1="3" y2="21" />
            <path d="m17 15 3-3-3-3" />
          </svg>
        </Button>
      </div>

      <!-- Group Meta (Only visible when expanded) -->
      <div
        v-if="
          !isCollapsed &&
          typeof schema.groupMeta === 'object' &&
          'title' in schema.groupMeta
        "
        class="px-6 pb-2 min-w-0 w-full"
      >
        <h2 class="text-lg font-semibold truncate">
          {{ schema.groupMeta.title }}
        </h2>
        <p
          v-if="schema.groupMeta.description"
          class="text-sm text-muted-foreground truncate"
        >
          {{ schema.groupMeta.description }}
        </p>
      </div>
      <!-- 如果 schema.groupMeta 是组件，也需要处理显隐逻辑，这里简单处理为展开才显示 -->
      <component
        :is="schema.groupMeta"
        v-else-if="!isCollapsed && schema.groupMeta"
      />

      <!-- Separator -->
      <Separator
        class="my-2"
        v-if="schema.content.length > 0 && schema.content[0] !== 'Separator'"
      />

      <!-- Navigation List -->
      <nav class="flex flex-col space-y-1 w-full px-2">
        <template v-for="(item, index) in schema.content" :key="index">
          <template v-if="typeof item === 'object'">
            <button
              @click="handleGroupClick(item)"
              :class="[
                'flex items-center p-2 rounded-md transition-colors w-full',
                // [MODIFIED] 折叠时居中，展开时左对齐
                isCollapsed
                  ? 'justify-center'
                  : 'justify-start space-x-2 text-left',
                clickableGroups.indexOf(item) === activeGroupIndex
                  ? 'bg-secondary text-secondary-foreground'
                  : 'hover:bg-muted',
              ]"
              :title="isCollapsed ? item.title : ''"
            >
              <span
                v-if="typeof item.svg === 'string'"
                v-html="item.svg"
                class="w-5 h-5 shrink-0"
              ></span>
              <component :is="item.svg" v-else class="w-5 h-5 shrink-0" />

              <!-- [MODIFIED] 文字只在展开时显示 -->
              <span v-if="!isCollapsed" class="truncate">{{ item.title }}</span>
            </button>
          </template>
          <template v-else-if="item === 'Separator'">
            <Separator class="my-2" />
          </template>
        </template>
      </nav>
    </aside>

    <!-- Right Content Panel -->
    <!-- [MODIFIED] w-3/4 -> flex-1: 让右侧内容自动填充剩余空间 -->
    <!-- 添加 min-w-0 防止 flex 子元素内容溢出 -->
    <main v-if="activeGroup" class="flex-1 min-w-0 min-h-0 bg-background/50">
      <ScrollArea class="h-full">
        <div class="max-w-5xl mx-auto px-8 py-8 pb-24">
          <!-- Header -->
          <h1 class="text-3xl font-bold">
            {{ activeGroup.content.title }}
          </h1>
          <Separator class="my-6" />

          <!-- Content Rows -->
          <div class="space-y-4">
            <div
              v-for="(rowGroup, rgIndex) in activeGroup.content.content"
              :key="rgIndex"
            >
              <h3 v-if="rowGroup.title" class="text-xl font-semibold mb-4">
                {{ rowGroup.title }}
              </h3>
              <div class="space-y-2">
                <div
                  v-for="(row, rIndex) in rowGroup.content"
                  :key="`${rgIndex}-${rIndex}`"
                >
                  <!-- 布局: Top-Bottom -->
                  <div
                    v-if="row.useTopBottom"
                    class="flex flex-col space-y-2 p-4 border rounded-md bg-card"
                  >
                    <label class="font-medium">{{ row.title }}</label>
                    <component
                      :is="resolveComponent(row.component)"
                      v-bind="row.props"
                      :modelValue="get(data, row.accessChain)"
                      @update:modelValue="updateData(row.accessChain, $event)"
                    />
                    <p
                      v-if="row.description"
                      class="text-sm text-muted-foreground"
                    >
                      {{ row.description }}
                    </p>
                  </div>

                  <!-- 默认布局: Left-Right -->
                  <Item v-else>
                    <ItemContent>
                      <ItemTitle
                        class="text-base font-medium text-foreground"
                        >{{ row.title }}</ItemTitle
                      >
                      <ItemDescription
                        v-if="row.description"
                        class="text-sm text-muted-foreground"
                      >
                        {{ row.description }}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <!-- 稍微增加宽度以适应更大的主空间 -->
                      <div class="w-full max-w-sm flex justify-end">
                        <component
                          :is="resolveComponent(row.component)"
                          v-bind="row.props"
                          :modelValue="get(data, row.accessChain)"
                          @update:modelValue="
                            updateData(row.accessChain, $event)
                          "
                        />
                      </div>
                    </ItemActions>
                  </Item>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </main>
  </div>
</template>

<style>
:root {
  font-size: clamp(12px, 1vw + 0.1rem, 14px);
}

textarea:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
</style>
