import { useState } from 'react';
import type { Browser } from 'webextension-polyfill';
import { BookmarkFolder } from '../types';

declare const browser: Browser;
declare const chrome: any;

export function useBookmarks() {
  const [allFolders, setAllFolders] = useState<BookmarkFolder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 获取所有书签文件夹
  const fetchAllBookmarkFolders = async () => {
    setIsLoading(true);
    try {
      const collectFolders = (nodes: any[], path = ''): BookmarkFolder[] => {
        let folders: BookmarkFolder[] = [];
        
        for (const node of nodes) {
          const currentPath = path ? `${path}/${node.title}` : node.title;
          
          // 如果是文件夹
          if (node.children) {
            folders.push({
              id: node.id,
              title: node.title,
              path: currentPath
            });
            
            // 递归搜索子文件夹
            const childFolders = collectFolders(node.children, currentPath);
            folders = [...folders, ...childFolders];
          }
        }
        
        return folders.filter(folder => folder.id && folder.path);
      };

      if (typeof chrome !== 'undefined') {
        chrome.bookmarks.getTree((tree: any) => {
          const folders = collectFolders(tree);
          setAllFolders(folders);
          setIsLoading(false);
        });
      } else if (typeof browser !== 'undefined') {
        const tree = await browser.bookmarks.getTree();
        const folders = collectFolders(tree);
        setAllFolders(folders);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('获取书签文件夹失败:', error);
      setIsLoading(false);
    }
  };

  // 创建新的书签文件夹
  const createFolder = async (folderPath: string): Promise<string> => {
    try {
      // 按路径分割
      const pathParts = folderPath.split('/').filter(part => part.trim());
      
      // 如果路径为空，则直接返回
      if (pathParts.length === 0) {
        throw new Error('文件夹路径不能为空');
      }

      // 获取所有文件夹
      const getBookmarkTree = (): Promise<any[]> => {
        return new Promise((resolve, reject) => {
          if (typeof chrome !== 'undefined') {
            chrome.bookmarks.getTree((tree: any) => resolve(tree));
          } else if (typeof browser !== 'undefined') {
            browser.bookmarks.getTree()
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error('未支持的浏览器'));
          }
        });
      };

      // 创建文件夹
      const createBookmarkFolder = (parentId: string, title: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          if (typeof chrome !== 'undefined') {
            chrome.bookmarks.create({ parentId, title }, (folder: any) => resolve(folder.id));
          } else if (typeof browser !== 'undefined') {
            browser.bookmarks.create({ parentId, title })
              .then((folder: any) => resolve(folder.id))
              .catch(reject);
          } else { 
            reject(new Error('未支持的浏览器'));
          }
        });
      };

      // 查找文件夹
      const findFolder = (tree: any[], pathParts: string[], currentIndex: number = 0): string | null => {
        if (currentIndex >= pathParts.length) return null;
        
        const currentPart = pathParts[currentIndex];
        
        for (const node of tree) {
          if (node.title === currentPart && node.children) {
            if (currentIndex === pathParts.length - 1) {
              // 找到了完整路径的最后一个文件夹
              return node.id;
            } else {
              // 找到了当前部分，继续查找下一层
              const result = findFolder(node.children, pathParts, currentIndex + 1);
              if (result) return result;
            }
          }
        }
        
        return null;
      };

      const tree = await getBookmarkTree();
      let parentId = '1'; // 默认从根文件夹开始
      
      // 依次创建或查找每一级文件夹
      for (let i = 0; i < pathParts.length; i++) {
        const currentPathParts = pathParts.slice(0, i + 1);
        const existingFolderId = findFolder(tree, currentPathParts);
        
        if (existingFolderId) {
          // 如果这一级文件夹已存在，直接使用
          parentId = existingFolderId;
        } else {
          // 如果不存在，则创建新文件夹
          parentId = await createBookmarkFolder(parentId, pathParts[i]);
        }
      }
      
      // 刷新文件夹列表
      await fetchAllBookmarkFolders();
      
      return parentId;
    } catch (error) {
      console.error('创建文件夹失败:', error);
      throw error;
    }
  };

  // 获取当前标签页URL
  const getCurrentTabUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
          if (tabs[0] && tabs[0].url) {
            resolve(tabs[0].url);
          } else {
            reject(new Error('无法获取当前标签页URL'));
          }
        });
      } else if (typeof browser !== 'undefined') {
        browser.tabs.query({ active: true, currentWindow: true })
          .then((tabs: any) => {
            if (tabs[0] && tabs[0].url) {
              resolve(tabs[0].url);
            } else {
              reject(new Error('无法获取当前标签页URL'));
            }
          })
          .catch(reject);
      } else {
        reject(new Error('未支持的浏览器'));
      }
    });
  };

  // 创建书签
  const createBookmark = (parentId: string, title: string, url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined') {
        chrome.bookmarks.create({ parentId, title, url }, () => resolve());
      } else if (typeof browser !== 'undefined') {
        browser.bookmarks.create({ parentId, title, url })
          .then(() => resolve())
          .catch(reject);
      } else {
        reject(new Error('未支持的浏览器'));
      }
    });
  };

  // 获取当前标签页信息
  const getCurrentTab = async () => {
    try {
      // 根据浏览器类型获取当前标签页
      if (typeof chrome !== 'undefined') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
      } else if (typeof browser !== 'undefined') {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        return tab;
      }
      return null;
    } catch (error) {
      console.error('获取当前标签页信息失败:', error);
      return null;
    }
  };

  return {
    allFolders,
    isLoading,
    fetchAllBookmarkFolders,
    createFolder,
    getCurrentTabUrl,
    createBookmark,
    getCurrentTab
  };
} 