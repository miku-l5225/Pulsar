// src/features/FileSystem/composables/useResourceFolder.ts

import urlJoin from "url-join";
import { computed, type MaybeRef, ref, unref, watch } from "vue";
import {
  useFileSystemStore,
  VirtualFile,
  VirtualFolder,
  type VirtualNode,
} from "@/features/FileSystem/FileSystem.store";
import { usePackageRoot } from "./usePackageRoot";

// 定义基础资源项类型
export interface FolderResourceItem {
  node: VirtualNode;
  name: string;
  path: string;
  isDirectory: boolean;
  // 基础操作封装在 item 上方便 UI 调用
  open: () => Promise<VirtualFile | null>;
  rename: (newName: string) => Promise<void>;
  delete: () => Promise<void>;
  copy: () => Promise<void>;
}

export function useResourceFolder(
  currentPath: MaybeRef<string | null>,
  folderName: string
) {
  const store = useFileSystemStore();
  const root = usePackageRoot(currentPath);

  // 获取目标文件夹节点
  const targetFolder = computed(() => {
    if (!root.value) return null;
    // 如果 folderName 为空字符串，则直接使用 root
    if (!folderName) return root.value;

    const node = root.value.resolve(folderName);
    window.root = root;
    console.log(root);
    if (node instanceof VirtualFolder) return node;
    return null; // 文件夹不存在或不是文件夹
  });

  // 确保文件夹存在（可选，某些场景需要自动创建）
  const ensureFolder = async () => {
    if (!root.value || targetFolder.value) return;
    await root.value.createDir(folderName);
  };

  // 生成资源列表
  const items = computed<FolderResourceItem[]>(() => {
    const folder = targetFolder.value;
    if (!folder) return [];

    const list: FolderResourceItem[] = [];

    // 遍历子节点
    for (const child of folder.children.values()) {
      list.push({
        node: child,
        name: child.name,
        path: child.path,
        isDirectory: child instanceof VirtualFolder,

        // 封装 open 方法：如果是文件夹，尝试打开内部 index.ts
        open: async () => {
          if (child instanceof VirtualFile) {
            return child;
          } else if (child instanceof VirtualFolder) {
            const indexFile = [...child.children.values()].find(
              (node) =>
                node instanceof VirtualFile && node.name.startsWith("index.")
            );
            if (indexFile) return indexFile;
            else
              console.warn(
                `[useResourceFolder] No index.json found in ${child.path}`
              );
            return null;
          }
          return null;
        },

        rename: async (newName: string) => child.rename(newName),
        delete: async () => child.delete(),
        copy: async () => {
          // 默认复制到当前文件夹，自动重命名由 copyTo 或 FileSystem 处理
          if (folder) await child.copyTo(folder);
        },
      });
    }

    return list.sort((a, b) => {
      // 文件夹优先，然后按名称排序
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  });

  // 封装文件夹级别的操作
  const actions = {
    newFile: async (name: string, content: any = "") => {
      if (!targetFolder.value) await ensureFolder();
      return targetFolder.value?.createFile(name, content);
    },
    newFolder: async (name: string) => {
      if (!targetFolder.value) await ensureFolder();
      return targetFolder.value?.createDir(name);
    },
    refresh: async () => {
      await targetFolder.value?.refresh();
    },
  };

  return {
    folder: targetFolder,
    items,
    actions,
  };
}
