<!-- src/resources/setting/components/DefaultModelSelector.vue -->
<template>
  <div class="space-y-6">
    <!-- Chat Model Selector -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium leading-none">
          默认对话模型 (Chat)
        </Label>
        <Badge
          variant="outline"
          class="text-xs font-normal text-muted-foreground"
        >
          {{ availableChatModels.length }} 个可用
        </Badge>
      </div>

      <Popover v-model:open="openChat">
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            role="combobox"
            :aria-expanded="openChat"
            class="w-full justify-between font-normal"
            :class="!modelValue?.chat && 'text-muted-foreground'"
          >
            {{
              modelValue?.chat
                ? availableChatModels.find((m) => m.id === modelValue.chat)
                    ?.name || modelValue.chat
                : "选择一个默认对话模型..."
            }}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder="搜索模型..." />
            <CommandEmpty>未找到相关模型</CommandEmpty>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  v-for="model in availableChatModels"
                  :key="model.id"
                  :value="model.name"
                  @select="
                    () => {
                      updateModel('chat', model.id);
                      openChat = false;
                    }
                  "
                >
                  <Check
                    class="mr-2 h-4 w-4"
                    :class="
                      modelValue?.chat === model.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    "
                  />
                  <div class="flex flex-col">
                    <span>{{ model.name }}</span>
                    <span class="text-xs text-muted-foreground">{{
                      model.provider
                    }}</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>

    <!-- Embedding Model Selector -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium leading-none">
          默认向量化模型 (Embedding)
        </Label>
        <Badge
          variant="outline"
          class="text-xs font-normal text-muted-foreground"
        >
          {{ availableEmbeddingModels.length }} 个可用
        </Badge>
      </div>

      <Popover v-model:open="openEmbedding">
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            role="combobox"
            :aria-expanded="openEmbedding"
            class="w-full justify-between font-normal"
            :class="!modelValue?.embedding && 'text-muted-foreground'"
          >
            {{
              modelValue?.embedding
                ? availableEmbeddingModels.find(
                    (m) => m.id === modelValue.embedding
                  )?.name || modelValue.embedding
                : "选择一个默认向量模型..."
            }}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder="搜索模型..." />
            <CommandEmpty>未找到相关模型</CommandEmpty>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  v-for="model in availableEmbeddingModels"
                  :key="model.id"
                  :value="model.name"
                  @select="
                    () => {
                      updateModel('embedding', model.id);
                      openEmbedding = false;
                    }
                  "
                >
                  <Check
                    class="mr-2 h-4 w-4"
                    :class="
                      modelValue?.embedding === model.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    "
                  />
                  <div class="flex flex-col">
                    <span>{{ model.name }}</span>
                    <span class="text-xs text-muted-foreground">{{
                      model.provider
                    }}</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, ChevronsUpDown } from "lucide-vue-next";
import { computed, ref } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useFileSystemStore } from "@/features/FileSystem/FileSystem.store";

// 引入类型定义
import type { ProviderMetadata } from "@/resources/modelConfig/modelConfig.types";
import type { DefaultModelSetting } from "../setting.types";

const props = defineProps<{
	modelValue: DefaultModelSetting;
}>();

const emit =
	defineEmits<(e: "update:modelValue", value: DefaultModelSetting) => void>();

const fsStore = useFileSystemStore();
const openChat = ref(false);
const openEmbedding = ref(false);

/**
 * 提取模型信息的接口定义
 */
interface ModelOption {
	id: string; // 唯一标识: "provider/modelName"
	name: string; // 模型显示名称
	provider: string; // 提供商标识
}

/**
 * 获取标准化的 ProviderMetadata (ModelConfig)
 */
const providersConfig = computed<ProviderMetadata>(() => {
	const rawConfig = fsStore.modelConfig;
	if (!rawConfig) return {};
	return rawConfig as unknown as ProviderMetadata;
});

/**
 * 通用模型提取函数
 */
const getModelsByType = (type: "chat" | "embedding"): ModelOption[] => {
	const providers = providersConfig.value;
	const models: ModelOption[] = [];

	for (const [providerKey, provider] of Object.entries(providers)) {
		// 1. 检查提供商是否启用
		if (!provider.enabled) continue;

		// 2. 获取对应类型的模型列表
		const providerModels = provider.models?.[type];
		if (!providerModels) continue;

		// 3. 遍历模型 (移除了 model.enabled 的判断)
		providerModels.forEach((model) => {
			models.push({
				id: `${providerKey}/${model.name}`,
				name: model.name,
				provider: providerKey,
			});
		});
	}

	return models;
};

// 计算属性：缓存模型列表
const availableChatModels = computed(() => getModelsByType("chat"));
const availableEmbeddingModels = computed(() => getModelsByType("embedding"));

/**
 * 通用更新处理函数
 */
const updateModel = (type: "chat" | "embedding", val: string) => {
	emit("update:modelValue", {
		...props.modelValue,
		[type]: val,
	});
};
</script>
