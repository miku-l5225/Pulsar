// src/composables/useResourceFolder.ts

import urlJoin from "url-join";
import { computed, type MaybeRef, unref } from "vue";
import {
  useFileSystemStore,
  VirtualFile,
  VirtualFolder,
  type VirtualNode,
} from "@/features/FileSystem/FileSystem.store";

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

/**
 * 获取角色包下的子文件夹资源
 * @param packageName 角色名称
 * @param subfolderName 子文件夹名称，例如 "chat", "lorebook", "preset" 等
 */
export function useResourceFolder(
  packageName: MaybeRef<string | null>,
  subfolderName: string
) {
  const store = useFileSystemStore();

  // 获取目标文件夹节点
  const targetFolder = computed(() => {
    const name = unref(packageName);
    if (!name) return null;
    return store.getPackageSubfolder(name, subfolderName);
  });

  // 确保文件夹存在（可选，某些场景需要自动创建）
  const ensureFolder = async () => {
    const name = unref(packageName);
    if (!name) return;
    const packageFolder = store.getPackageSubfolder(name);
    if (!packageFolder) return;
    
    if (!targetFolder.value) {
      await packageFolder.createDir(subfolderName);
    }
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
            if (indexFile) return indexFile as VirtualFile;
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
    importFile: async (file: File) => {
      if (!targetFolder.value) await ensureFolder();
      return targetFolder.value?.importFile(file);
    },
  };

  return {
    folder: targetFolder,
    items,
    actions,
  };
}

