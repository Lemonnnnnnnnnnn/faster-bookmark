import { useEffect, useState, ChangeEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import './styles.css';
import { BookmarkFolderSelect } from './components/BookmarkFolderSelect';
import { useBookmarks } from './hooks/useBookmarks';

export default function PopupApp() {
  // 状态管理
  const [bookmarkName, setBookmarkName] = useState<string>("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [inputFolderPath, setInputFolderPath] = useState<string>("");
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  
  // 添加确认按钮ref
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // 添加聚焦确认按钮的函数
  const focusConfirmButton = () => {
    if (confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  };
  
  // 使用自定义hook获取书签功能
  const { 
    allFolders,
    isLoading,
    fetchAllBookmarkFolders, 
    createFolder, 
    getCurrentTabUrl, 
    createBookmark,
    getCurrentTab
  } = useBookmarks();
  
  // 检测是否在iframe中运行
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      // 如果访问window.top时出错，说明是在iframe中
      setIsInIframe(true);
    }
  }, []);
  
  // 获取当前标签页信息
  useEffect(() => {
    const loadTabInfo = async () => {
      const tab = await getCurrentTab();
      if (tab && tab.title) {
        setBookmarkName(tab.title);
      }
    };

    loadTabInfo();
  }, []);

  // 获取所有书签文件夹
  useEffect(() => {
    fetchAllBookmarkFolders();
  }, []);

  // 关闭弹窗
  const handleCancel = () => {
    if (isInIframe) {
      // 如果在iframe中，向父页面发送关闭消息
      window.parent.postMessage({ from: 'faster-bookmark-popup', action: 'close' }, '*');
    } else {
      // 如果是普通弹窗，直接关闭
      window.close();
    }
  };

  // 保存书签后关闭
  const handleSaveSuccess = () => {
    if (isInIframe) {
      // 如果在iframe中，向父页面发送关闭消息
      window.parent.postMessage({ from: 'faster-bookmark-popup', action: 'close' }, '*');
    } else {
      // 如果是普通弹窗，直接关闭
      window.close();
    }
  };

  // 保存书签前确保文件夹存在
  const ensureFolderExists = async (): Promise<string> => {
    // 如果已经选择了文件夹ID，则直接返回
    if (selectedFolderId) {
      return selectedFolderId;
    }
    
    // 如果有输入路径但没有匹配的文件夹ID，则创建新文件夹
    if (inputFolderPath) {
      return await createFolder(inputFolderPath);
    }
    
    // 如果都没有，返回根目录
    return '1';
  };

  // 保存书签
  const handleSaveBookmark = async () => {
    if (!bookmarkName) {
      alert('请输入书签名称!');
      return;
    }

    try {
      // 确保有文件夹
      const folderId = await ensureFolderExists();
      
      // 获取URL并创建书签
      const url = await getCurrentTabUrl();
      await createBookmark(folderId, bookmarkName, url);
      
      // 关闭弹窗
      handleSaveSuccess();
    } catch (error) {
      console.error('保存书签失败:', error);
      alert('保存书签失败，请重试!');
    }
  };

  return (
    <Card className="h-full p-0 border-none flex flex-col shadow-none">
      <CardHeader className="pt-5 pb-2 border-b border-border transition-all duration-200">
        <CardTitle>快速添加书签</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-6 py-5 mb-4 flex flex-col">
        {/* 书签名称输入 */}
        <div className="grid gap-2 mb-4">
          <Label htmlFor="bookmarkName">书签名称</Label>
          <Input
            id="bookmarkName"
            value={bookmarkName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setBookmarkName(e.target.value)}
            placeholder="书签名称"
            className="h-10 transition-all duration-200"
          />
        </div>
        
        {/* 文件夹路径选择 */}
        <div className="select-dropdown-container space-y-2">
          <Label htmlFor="folderPath">文件夹路径</Label>
          {isLoading ? (
            <div className="text-center py-2 border rounded-md p-2">加载中...</div>
          ) : (
            <div className="space-y-2">
              <BookmarkFolderSelect
                allFolders={allFolders}
                value={selectedFolderId}
                onChange={setSelectedFolderId}
                inputValue={inputFolderPath}
                setInputValue={setInputFolderPath}
                placeholder="选择或搜索书签文件夹"
                className="w-full"
                onFolderSelect={focusConfirmButton}
              />
              {inputFolderPath && !selectedFolderId && (
                <div className="text-xs text-blue-500">
                  将创建新文件夹: {inputFolderPath}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-3 px-6 py-4 mt-auto border-t border-border">
        <Button variant="outline" onClick={handleCancel} className="min-w-20 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5">取消</Button>
        <Button 
          ref={confirmButtonRef} 
          onClick={handleSaveBookmark} 
          className="min-w-20 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5"
        >
          确定
        </Button>
      </CardFooter>
    </Card>
  );
}