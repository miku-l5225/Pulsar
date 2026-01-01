<!-- src/schema/modelConfig/ModelConfigEditor.vue -->
<template>
  <div
    v-if="localContent"
    class="flex h-full bg-background text-foreground relative overflow-hidden"
  >
    <aside
      :class="[
        'border-r flex-col h-full bg-background transition-all duration-300',
        isMobile ? 'w-full' : 'w-1/4 min-w-[280px]',
        isMobile && showMobileDetail ? 'hidden' : 'flex',
      ]"
    >
      <Separator class="my-4" />

      <div class="px-4 py-2 flex justify-between items-center">
        <div>
          <h2 class="text-lg font-semibold">AI 提供商</h2>
          <p class="text-sm text-muted-foreground">启用/禁用并配置提供商。</p>
        </div>
        <Button size="sm" @click="addNewProvider"> 添加 </Button>
      </div>

      <Separator class="my-4" />

      <!-- Navigation List -->
      <nav class="flex flex-col space-y-1 overflow-y-auto px-2 pb-4">
        <!-- Enabled Providers -->
        <div v-for="(provider, key) in enabledProviders" :key="key">
          <button
            @click="handleSelectProvider(key as string)"
            :class="buttonClasses(key as string)"
          >
            <span class="capitalize font-medium grow text-left truncate">{{
              key
            }}</span>
            <Switch v-model="provider.enabled" @click.stop class="ml-auto" />
            <span v-if="isMobile" class="ml-2 text-muted-foreground">
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
        </div>

        <!-- Separator -->
        <div
          v-if="
            Object.keys(enabledProviders).length > 0 &&
            Object.keys(disabledProviders).length > 0
          "
          class="py-2"
        >
          <Separator />
        </div>

        <!-- Disabled Providers -->
        <div v-for="(provider, key) in disabledProviders" :key="key">
          <div
            @click="handleSelectProvider(key as string)"
            :class="buttonClasses(key as string)"
          >
            <span
              class="capitalize font-medium grow text-left text-muted-foreground/80"
              >{{ key }}</span
            >
            <Switch v-model="provider.enabled" @click.stop class="ml-auto" />
            <!-- [NEW] 移动端箭头提示 -->
            <span v-if="isMobile" class="ml-2 text-muted-foreground">
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
          </div>
        </div>
      </nav>
    </aside>

    <main
      :class="[
        'h-full bg-background',
        isMobile
          ? showMobileDetail
            ? 'absolute inset-0 z-10 flex flex-col'
            : 'hidden'
          : 'w-3/4 flex flex-col',
      ]"
    >
      <ScrollArea class="h-full w-full">
        <div class="p-4 md:p-8 pb-20">
          <div
            v-if="!selectedProviderKey || !selectedProviderData"
            class="flex h-full items-center justify-center min-h-[50vh]"
          >
            <p class="text-muted-foreground">
              请从左侧选择一个提供商进行配置。
            </p>
          </div>

          <div v-else class="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <!-- [NEW] Header Area with Back Button -->
            <div class="flex items-center gap-2">
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

              <div class="grow min-w-0">
                <div v-if="selectedProviderData.builtIn">
                  <!-- 移动端隐藏 Label 以节省空间，或者调小字体 -->
                  <Label class="text-xs md:text-sm text-muted-foreground"
                    >提供商 ID</Label
                  >
                  <h1
                    class="text-2xl md:text-3xl font-bold capitalize truncate"
                  >
                    {{ selectedProviderKey }}
                  </h1>
                </div>
                <div v-else>
                  <Label
                    for="provider-key-input"
                    class="text-xs md:text-sm text-muted-foreground"
                  >
                    提供商 ID
                  </Label>
                  <div class="flex items-center gap-2 group">
                    <Input
                      v-if="isEditingTitle"
                      id="provider-key-input"
                      ref="providerKeyInputRef"
                      v-model="providerKeyInput"
                      @blur="handleRenameProvider"
                      @keydown.enter="handleRenameProvider"
                      class="text-2xl md:text-3xl font-bold h-auto p-0 border-none focus-visible:ring-0"
                    />
                    <h1
                      v-else
                      class="text-2xl md:text-3xl font-bold capitalize truncate"
                    >
                      {{ selectedProviderKey }}
                    </h1>
                    <div
                      class="flex items-center"
                      :class="{
                        'opacity-100': isMobile,
                        'opacity-0 group-hover:opacity-100 transition-opacity':
                          !isMobile,
                      }"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        @click="startEditingTitle"
                      >
                        <Pencil class="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        @click="deleteSelectedProvider"
                      >
                        <Trash2 class="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <!-- API Key Section -->
            <div>
              <h3 class="text-lg md:text-xl font-semibold mb-2">密钥配置</h3>
              <p class="text-sm text-muted-foreground mb-4">
                配置 API 密钥名称并写入密钥值。密钥值不会保存在此配置文件中。
              </p>
              <div class="space-y-4 max-w-lg">
                <div class="flex flex-col space-y-2">
                  <div class="flex items-center justify-between">
                    <Label for="api-key-name-input">API 密钥名称</Label>
                    <Badge
                      :variant="keyIsAvailable ? 'secondary' : 'outline'"
                      class="text-xs"
                    >
                      {{ keyIsAvailable ? "密钥已设置" : "密钥未设置" }}
                    </Badge>
                  </div>
                  <p
                    v-if="selectedProviderData.builtIn"
                    class="text-sm font-mono p-2 bg-muted rounded-md break-all"
                  >
                    {{ selectedProviderData.apiKeyName }}
                  </p>
                  <Input
                    v-else
                    id="api-key-name-input"
                    :modelValue="selectedProviderData.apiKeyName"
                    @update:modelValue="handleApiKeyNameInput"
                    placeholder="例如 OPENAI_API_KEY (仅限英文、数字、下划线)"
                  />
                </div>
                <div class="flex flex-col space-y-2">
                  <Label for="api-key-value-input">写入新密钥</Label>
                  <div class="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="api-key-value-input"
                      type="password"
                      v-model="apiKeyInputValue"
                      placeholder="粘贴您的 API 密钥"
                    />
                    <Button
                      @click="handleWriteKey"
                      :disabled="
                        !apiKeyInputValue || !selectedProviderData.apiKeyName
                      "
                      class="w-full sm:w-auto"
                      >保存密钥</Button
                    >
                  </div>
                </div>
                <div
                  v-if="'url' in selectedProviderData"
                  class="flex flex-col space-y-2"
                >
                  <Label for="api-url-input">API 端点 (url, 可选)</Label>
                  <div class="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="api-url-input"
                      v-model="selectedProviderData.url"
                      placeholder="例如 https://api.openai.com/v1"
                    />
                    <Button
                      @click="fetchModelsFromEndpoint"
                      :disabled="!selectedProviderData.url || isFetchingModels"
                      variant="outline"
                      class="w-full sm:w-auto"
                    >
                      {{ isFetchingModels ? "获取中..." : "获取模型" }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab Content -->
            <div>
              <h3 class="text-lg md:text-xl font-semibold mb-4">模型配置</h3>
              <ProviderModelsTable
                v-if="selectedProviderData && selectedProviderData.models"
                :models="selectedProviderData.models"
                :provider-key="selectedProviderKey"
                :is-built-in="selectedProviderData.builtIn"
                :base-url="selectedProviderData.url"
                @add-model="handleAddModel"
                @update-model="handleUpdateModel"
                @delete-model="handleDeleteModel"
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </main>
  </div>
  <div v-else class="flex h-full w-full items-center justify-center">
    <p class="text-muted-foreground">正在加载编辑器...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from "vue";
import { useFileContent } from "@/features/FileSystem/composables/useFileContent";
import type {
  ModelConfig,
  ProviderData,
  ChatModel,
  GenericModel,
} from "./modelConfig.types";
import { useSecretsStore } from "@/features/Secrets/Secrets.store";
import { Pencil, Trash2 } from "lucide-vue-next";
import { push } from "notivue";
import { customFetch } from "@/utils/customFetch";

// --- Components ---
import ProviderModelsTable from "./components/ProviderModelsTable.vue";
import Separator from "@/components/ui/separator/Separator.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import Button from "@/components/ui/button/Button.vue";
import Switch from "@/components/ui/switch/Switch.vue";
import Badge from "@/components/ui/badge/Badge.vue";
import ScrollArea from "@/components/ui/scroll-area/ScrollArea.vue";

const props = defineProps<{
  path: string;
}>();

const localContent = useFileContent<ModelConfig>(props.path);
const keyStore = useSecretsStore();

const selectedProviderKey = ref<string | null>(null);
const providerKeyInput = ref("");
const providerKeyInputRef = ref<HTMLInputElement | null>(null);
const apiKeyInputValue = ref("");
const keyStatusMap = ref<Record<string, boolean>>({});
const isEditingTitle = ref(false);
const isFetchingModels = ref(false);

// [NEW] 移动端适配状态
const isMobile = ref(false);
const showMobileDetail = ref(false);

function checkMobile() {
  isMobile.value = window.matchMedia("(max-width: 768px)").matches;
  if (!isMobile.value) {
    showMobileDetail.value = false;
  }
}

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});

// [MODIFIED] 选择提供商时的处理
function handleSelectProvider(key: string) {
  selectedProviderKey.value = key;
  if (isMobile.value) {
    showMobileDetail.value = true;
  }
}

// [NEW] 返回列表
function handleBackToList() {
  showMobileDetail.value = false;
}

const selectedProviderData = computed<ProviderData | null>({
  get() {
    if (selectedProviderKey.value && localContent.value) {
      return localContent.value[selectedProviderKey.value];
    }
    return null;
  },
  set(newValue) {
    if (selectedProviderKey.value && localContent.value && newValue) {
      localContent.value[selectedProviderKey.value] = newValue;
    }
  },
});

const enabledProviders = computed(() => {
  if (!localContent.value) return {};
  return Object.fromEntries(
    Object.entries(localContent.value).filter(([, p]) => p.enabled)
  );
});

const disabledProviders = computed(() => {
  if (!localContent.value) return {};
  return Object.fromEntries(
    Object.entries(localContent.value).filter(([, p]) => !p.enabled)
  );
});

const keyIsAvailable = computed(() => {
  if (!selectedProviderData.value?.apiKeyName) return false;
  return keyStatusMap.value[selectedProviderData.value.apiKeyName] ?? false;
});

const buttonClasses = (key: string) => [
  "flex items-center p-3 md:p-2 rounded-md transition-colors w-full cursor-pointer",
  selectedProviderKey.value === key
    ? "bg-secondary text-secondary-foreground"
    : "hover:bg-muted",
];

// --- 5. 方法 ---

async function startEditingTitle() {
  isEditingTitle.value = true;
  await nextTick();
  providerKeyInputRef.value?.focus();
}

async function checkKeyStatus() {
  if (!selectedProviderData.value?.apiKeyName) return;
  const keyName = selectedProviderData.value.apiKeyName.trim();
  if (keyName) {
    keyStatusMap.value[keyName] = await keyStore.isKeyAvailable(keyName);
  }
}

async function handleWriteKey() {
  // 校验输入
  if (!selectedProviderData.value?.apiKeyName || !apiKeyInputValue.value)
    return;

  const keyName = selectedProviderData.value.apiKeyName.trim();
  const keyValue = apiKeyInputValue.value;

  try {
    // 调用 Store 写入密钥
    await keyStore.writeSecretKey(keyName, keyValue);

    // 清空输入框
    apiKeyInputValue.value = "";

    // 刷新当前密钥的可用状态 (更新 UI 徽章)
    await checkKeyStatus();

    // Notivue 成功反馈
    push.success({
      title: "密钥保存成功",
      message: `密钥 "${keyName}" 已成功保存并刷新状态。`,
    });
  } catch (error) {
    console.error("Failed to write secret key:", error);

    // Notivue 失败反馈
    push.error({
      title: "密钥保存失败",
      message: (error as Error).message || "发生未知错误，请检查日志。",
    });
  }
}

async function fetchModelsFromEndpoint() {
  // 1. 基础校验
  if (
    !selectedProviderData.value?.url ||
    !localContent.value ||
    !selectedProviderKey.value
  )
    return;

  isFetchingModels.value = true;

  let urlInput = selectedProviderData.value.url.trim();
  // 移除末尾的斜杠
  urlInput = urlInput.replace(/\/$/, "");

  // 如果不包含 http:// 或 https://，默认补全 https://
  if (!/^https?:\/\//i.test(urlInput)) {
    urlInput = `https://${urlInput}`;
    // 可选：同时也更新回数据模型，让用户看到变化
    selectedProviderData.value.url = urlInput;
  }

  const fetchUrl = `${urlInput}/models`;

  try {
    const headers: HeadersInit = {};
    const apiKeyName = selectedProviderData.value.apiKeyName;

    // 只有当 apiKeyName 存在且仅包含 ASCII 字符时才添加到 Header
    // 防止 "failed to construct 'headers'" 错误
    if (apiKeyName && /^[a-zA-Z0-9_.-]+$/.test(apiKeyName)) {
      headers["Authorization"] = `Bearer {{${apiKeyName}}}`;
    } else if (apiKeyName) {
      console.warn(
        "跳过 Authorization Header: 密钥名称包含非法字符",
        apiKeyName
      );
      // 可选：这里可以给用户一个提示，或者允许请求但不带 Auth
    }

    const response = await customFetch(fetchUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`请求失败，状态码: ${response.status}`);
    }
    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      throw new Error("API 响应格式无效，缺少 'data' 数组。");
    }

    const fetchedModelIds: string[] = result.data.map((item: any) => item.id);
    const providerData = localContent.value[selectedProviderKey.value];
    const existingChatModels = new Set(
      providerData.models.chat.map((m) => m.name)
    );
    let addedCount = 0;

    fetchedModelIds.forEach((modelId) => {
      if (!existingChatModels.has(modelId)) {
        // By default, add new models to the 'chat' category
        providerData.models.chat.push({
          name: modelId,
          enabled: true, // Default to enabled
          capabilities: [],
        });
        addedCount++;
      }
    });

    push.success({
      title: "获取成功",
      message: `已合并 ${addedCount} 个新模型。`,
    });
  } catch (error) {
    console.error("获取模型列表失败:", error);
    push.error({
      title: "获取失败",
      message: (error as Error).message || "发生未知网络错误。",
    });
  } finally {
    isFetchingModels.value = false;
  }
}

function addNewProvider() {
  if (!localContent.value) return;
  const newProviderKey = `new_provider_${Date.now()}`;
  localContent.value[newProviderKey] = {
    enabled: false,
    apiKeyName: "",
    url: "",
    models: {
      chat: [],
      embedding: [],
      image: [],
      speech: [],
      transcription: [],
    },
  };
  selectedProviderKey.value = newProviderKey;
}

function deleteSelectedProvider() {
  if (!selectedProviderKey.value || !localContent.value) return;
  if (
    confirm(
      `确定要删除提供商 "${selectedProviderKey.value}" 吗？此操作无法撤销。`
    )
  ) {
    delete localContent.value[selectedProviderKey.value];
    selectedProviderKey.value = Object.keys(localContent.value)[0] || null;
  }
}

function handleRenameProvider() {
  if (
    !localContent.value ||
    !selectedProviderKey.value ||
    !providerKeyInput.value
  ) {
    isEditingTitle.value = false;
    return;
  }
  const oldKey = selectedProviderKey.value;
  const newKey = providerKeyInput.value.trim();

  if (oldKey === newKey) {
    isEditingTitle.value = false;
    return;
  }

  if (localContent.value[newKey]) {
    alert(`提供商 ID "${newKey}" 已存在，请使用其他名称。`);
    providerKeyInput.value = oldKey;
    return;
  }

  const providerData = localContent.value[oldKey];
  const newProviders = { ...localContent.value };
  delete newProviders[oldKey];
  newProviders[newKey] = providerData;

  localContent.value = newProviders;

  selectedProviderKey.value = newKey;
  isEditingTitle.value = false;
}

function handleAddModel({
  newModel,
  typeKey,
}: {
  newModel: ChatModel | GenericModel;
  typeKey: keyof ProviderData["models"];
}) {
  if (
    !selectedProviderData.value ||
    !localContent.value ||
    !selectedProviderKey.value
  )
    return;
  const newModelsList = [
    ...(selectedProviderData.value.models[typeKey] || []),
    newModel,
  ];
  const updatedProvider = {
    ...selectedProviderData.value,
    models: {
      ...selectedProviderData.value.models,
      [typeKey]: newModelsList,
    },
  };
  localContent.value[selectedProviderKey.value] = updatedProvider;
}

function handleUpdateModel({
  updatedModel,
  originalName,
  typeKey,
}: {
  updatedModel: ChatModel | GenericModel;
  originalName: string;
  typeKey: keyof ProviderData["models"];
}) {
  if (
    !selectedProviderData.value ||
    !localContent.value ||
    !selectedProviderKey.value
  )
    return;
  const newModelsList = [
    ...(selectedProviderData.value.models[typeKey] || []),
  ] as (ChatModel | GenericModel)[];
  const modelIndex = newModelsList.findIndex((m) => m.name === originalName);
  if (modelIndex !== -1) {
    newModelsList[modelIndex] = updatedModel;
    const updatedProvider = {
      ...selectedProviderData.value,
      models: {
        ...selectedProviderData.value.models,
        [typeKey]: newModelsList,
      },
    };
    localContent.value[selectedProviderKey.value] = updatedProvider;
  }
}

function handleDeleteModel({
  name,
  typeKey,
}: {
  name: string;
  typeKey: keyof ProviderData["models"];
}) {
  if (
    !selectedProviderData.value ||
    !localContent.value ||
    !selectedProviderKey.value
  )
    return;
  const newModelsList = (
    (selectedProviderData.value.models[typeKey] || []) as (
      | ChatModel
      | GenericModel
    )[]
  ).filter((m) => m.name !== name);
  const updatedProvider = {
    ...selectedProviderData.value,
    models: {
      ...selectedProviderData.value.models,
      [typeKey]: newModelsList,
    },
  };
  localContent.value[selectedProviderKey.value] = updatedProvider;
}

// --- 添加一个新的处理函数 ---
function handleApiKeyNameInput(value: string | number) {
  if (!selectedProviderData.value) return;

  // 1. 使用正则替换掉所有非允许字符 (允许: A-Z, a-z, 0-9, _, ., -)
  // 这完美匹配了后端 Rust 的正则: [a-zA-Z0-9_.-]+
  const sanitizedValue = String(value).replace(/[^a-zA-Z0-9_.-]/g, "");

  // 2. 更新值
  selectedProviderData.value.apiKeyName = sanitizedValue;

  // 3. 检查密钥状态
  checkKeyStatus();
}

// --- 6. 监听器 ---
watch(selectedProviderKey, (newKey) => {
  isEditingTitle.value = false;
  if (newKey) {
    providerKeyInput.value = newKey;
    apiKeyInputValue.value = "";
    checkKeyStatus();
  }
});
</script>
