<script setup lang="ts">
import { ref, computed, type Component, onMounted, onUnmounted } from "vue";
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

import { Group, Schema, ComponentName, Row } from "./SchemaRenderer.types";

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
const isCollapsed = ref(false);

// [NEW] 移动端适配状态
const isMobile = ref(false);
const showMobileDetail = ref(false); // 控制移动端是否显示详情页

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

// [MODIFIED] 响应式检测
function checkMobile() {
  isMobile.value = window.matchMedia("(max-width: 768px)").matches;
  if (!isMobile.value) {
    // 切回桌面端时，重置详情显示状态，保证左右分栏正常
    showMobileDetail.value = false;
  }
}

// [MODIFIED] 点击处理：移动端点击后进入详情页
function handleGroupClick(group: Group) {
  const index = clickableGroups.value.indexOf(group);
  if (index !== -1) {
    activeGroupIndex.value = index;
    if (isMobile.value) {
      showMobileDetail.value = true;
    }
  }
}

function handleBackToList() {
  showMobileDetail.value = false;
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

// [NEW] 判断是否使用纵向布局 (移动端强制纵向)
function shouldUseVerticalLayout(row: Row): boolean {
  if (isMobile.value) return true;
  return !!row.useTopBottom;
}

// --- 生命周期 ---
onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<template>
  <div
    class="flex h-full bg-background text-foreground overflow-hidden relative"
  >
    <!--
      Left Sidebar
      [MODIFIED] 响应式类名:
      - 移动端: w-full (全宽), 如果正在显示详情(showMobileDetail)则隐藏(hidden)
      - 桌面端(md): 按照 isCollapsed 逻辑显示宽度, block (覆盖 hidden)
    -->
    <aside
      :class="[
        'border-r flex-col min-h-0 transition-all duration-300 ease-in-out relative overflow-hidden bg-background',
        isMobile ? 'w-full' : '',
        !isMobile && isCollapsed
          ? 'md:w-[60px] md:min-w-[60px] items-center'
          : 'md:w-1/4 md:min-w-[250px]',
        isMobile && showMobileDetail ? 'hidden' : 'flex',
      ]"
    >
      <!--
        Sidebar Toggle Button
        [MODIFIED] 移动端隐藏 (hidden md:flex)
      -->
      <div
        :class="[
          'items-center p-2 hidden md:flex',
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

      <!-- Group Meta -->
      <!-- [MODIFIED] 移动端始终显示 Meta (因为没有 collapse 状态) -->
      <div
        v-if="
          (!isCollapsed || isMobile) &&
          typeof schema.groupMeta === 'object' &&
          'title' in schema.groupMeta
        "
        class="px-4 py-2"
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
      <component
        :is="schema.groupMeta"
        v-else-if="(!isCollapsed || isMobile) && schema.groupMeta"
      />

      <!-- Separator -->
      <Separator
        class="my-2"
        v-if="schema.content.length > 0 && schema.content[0] !== 'Separator'"
      />

      <!-- Navigation List -->
      <nav class="flex flex-col space-y-1 w-full px-2 overflow-y-auto">
        <template v-for="(item, index) in schema.content" :key="index">
          <template v-if="typeof item === 'object'">
            <button
              @click="handleGroupClick(item)"
              :class="[
                'flex items-center p-3 md:p-2 rounded-md transition-colors w-full',
                // [MODIFIED] 移动端总是左对齐，桌面端根据折叠状态调整
                !isMobile && isCollapsed
                  ? 'justify-center'
                  : 'justify-start space-x-3 text-left',
                clickableGroups.indexOf(item) === activeGroupIndex
                  ? 'bg-secondary text-secondary-foreground'
                  : 'hover:bg-muted',
              ]"
              :title="!isMobile && isCollapsed ? item.title : ''"
            >
              <span
                v-if="typeof item.svg === 'string'"
                v-html="item.svg"
                class="w-5 h-5 shrink-0"
              ></span>
              <component :is="item.svg" v-else class="w-5 h-5 shrink-0" />

              <span
                v-if="isMobile || !isCollapsed"
                class="truncate flex-1 text-base md:text-sm"
              >
                {{ item.title }}
              </span>
              <!-- [NEW] 移动端显示箭头提示 -->
              <span v-if="isMobile" class="text-muted-foreground">
                <svg
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
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </button>
          </template>
          <template v-else-if="item === 'Separator'">
            <Separator class="my-2" />
          </template>
        </template>
      </nav>
    </aside>

    <!--
      Right Content Panel
      [MODIFIED] 响应式显示逻辑:
      - 移动端: 默认隐藏(hidden)，只有当 showMobileDetail 为 true 时显示(block/flex)，并且全屏覆盖(w-full h-full absolute/fixed)
      - 桌面端: 总是显示(md:flex)，位置保持默认
    -->
    <main
      v-if="activeGroup"
      :class="[
        'flex-1 min-w-0 min-h-0 bg-background/50',
        isMobile
          ? showMobileDetail
            ? 'absolute inset-0 z-50 bg-background flex flex-col'
            : 'hidden'
          : 'flex flex-col',
      ]"
    >
      <ScrollArea class="h-full">
        <div class="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-24">
          <!-- Header -->
          <div class="flex items-center gap-2 mb-2">
            <!-- [NEW] 移动端返回按钮 -->
            <Button
              v-if="isMobile"
              variant="ghost"
              size="icon"
              class="-ml-2 mr-1"
              @click="handleBackToList"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>

            <h1 class="text-2xl md:text-3xl font-bold flex-1">
              {{ activeGroup.content.title }}
            </h1>
          </div>
          <Separator class="my-4 md:my-6" />

          <!-- Content Rows -->
          <div class="space-y-4">
            <div
              v-for="(rowGroup, rgIndex) in activeGroup.content.content"
              :key="rgIndex"
            >
              <h3
                v-if="rowGroup.title"
                class="text-lg md:text-xl font-semibold mb-3 md:mb-4"
              >
                {{ rowGroup.title }}
              </h3>
              <div class="space-y-3">
                <div
                  v-for="(row, rIndex) in rowGroup.content"
                  :key="`${rgIndex}-${rIndex}`"
                >
                  <!--
                    [MODIFIED] 布局逻辑:
                    如果 shouldUseVerticalLayout(row) 为 true (包含移动端强制情况)，
                    使用 Title-Content-Description 的纵向布局。
                  -->
                  <div
                    v-if="shouldUseVerticalLayout(row)"
                    class="flex flex-col space-y-2 p-3 md:p-4 border rounded-md bg-card"
                  >
                    <label class="font-medium text-sm md:text-base">{{
                      row.title
                    }}</label>
                    <component
                      :is="resolveComponent(row.component)"
                      v-bind="row.props"
                      :modelValue="get(data, row.accessChain)"
                      @update:modelValue="updateData(row.accessChain, $event)"
                    />
                    <p
                      v-if="row.description"
                      class="text-xs md:text-sm text-muted-foreground"
                    >
                      {{ row.description }}
                    </p>
                  </div>

                  <!--
                    桌面端默认布局: Left-Right (Shadcn Item)
                    仅当非移动端且配置为非 Vertical 时渲染
                   -->
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
                      <div class="w-60 flex justify-end">
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
  font-size: clamp(14px, 1vw + 0.1rem, 15px);
}

/* 优化移动端点击体验 */
@media (max-width: 768px) {
  button,
  input,
  select,
  textarea {
    min-height: 44px; /* 触控热区 */
  }
}

textarea:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
</style>
