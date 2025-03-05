// 书签文件夹类型定义
export interface BookmarkFolder {
  id: string;
  title: string;
  path: string;
}

// 书签文件夹选择组件属性
export interface BookmarkFolderSelectProps {
  allFolders: BookmarkFolder[];
  value: string;
  onChange: (value: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  placeholder?: string;
  className?: string;
} 