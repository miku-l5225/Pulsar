// src/resources/chat/useChatResources.ts

import { computed, type MaybeRef } from "vue";
import {
  type FolderResourceItem,
  useResourceFolder,
} from "@/composables/useResourceFolder";

// 扩展资源项类型
export interface ChatResourceItem extends FolderResourceItem {
  isSelected: boolean;
  extraDisplayText: string;
}

/**
 * 使用聊天资源（chat 子文件夹）
 * @param packageName 角色名称，例如 "Alice"
 */
export function useChatResources(packageName: MaybeRef<string | null>) {
  const { items, actions } = useResourceFolder(packageName, "chat");

  const resources = computed<ChatResourceItem[]>(() => {
    return items.value.map((item) => ({
      ...item,
      isSelected: false,
      extraDisplayText: "", // Chat 不需要额外状态
    }));
  });

  return { items: resources, actions };
}

