import { useEffect, useState, useRef } from 'react';
import { BookmarkFolderSelectProps, BookmarkFolder } from '../types';

export function BookmarkFolderSelect({
  allFolders,
  value,
  onChange,
  inputValue,
  setInputValue,
  placeholder = "选择或搜索书签文件夹",
  className = "",
  onFolderSelect,
}: BookmarkFolderSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState<BookmarkFolder[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 聚焦到输入框
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // 过滤文件夹
    filterFolders(newValue);
    
    // 重置高亮索引
    setHighlightedIndex(0);
    
    // 如果有输入但没有匹配结果，清除选择的ID
    if (newValue && filteredFolders.length === 0) {
      onChange('');
    }
    
    // 打开下拉框
    setIsOpen(true);
  };

  // 过滤文件夹
  const filterFolders = (searchText: string) => {
    if (!searchText) {
      setFilteredFolders(allFolders);
      return;
    }

    // 支持按斜杠分段搜索
    const pathSegments = searchText.toLowerCase().split('/').filter(Boolean);
    let results = allFolders;

    if (pathSegments.length > 0) {
      results = allFolders.filter(folder => {
        const folderPathSegments = folder.path.toLowerCase().split('/').filter(Boolean);
        
        // 检查是否为单关键词搜索（没有斜杠）
        if (pathSegments.length === 1 && !searchText.includes('/')) {
          // 匹配任何包含该关键词的路径段，特别是最后一个段落（文件夹名称）
          return folderPathSegments.some(segment => segment.includes(pathSegments[0]));
        }
        
        // 按路径层级进行匹配的原有逻辑
        if (folderPathSegments.length < pathSegments.length) return false;
        
        for (let i = 0; i < pathSegments.length; i++) {
          // 对于最后一个部分，使用包含匹配，前面的部分需要精确匹配
          if (i === pathSegments.length - 1) {
            if (!folderPathSegments[i].includes(pathSegments[i])) return false;
          } else {
            if (folderPathSegments[i] !== pathSegments[i]) return false;
          }
        }
        
        return true;
      });
    }

    setFilteredFolders(results);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setHighlightedIndex((prevIndex) => 
          prevIndex < filteredFolders.length - 1 ? prevIndex + 1 : prevIndex
        );
        e.preventDefault();
        break;
      case 'ArrowUp':
        setHighlightedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
        e.preventDefault();
        break;
      case 'Tab':
        if (filteredFolders.length > 0) {
          const selectedFolder = filteredFolders[highlightedIndex];
          setInputValue(selectedFolder.path);
          onChange(selectedFolder.id);
          filterFolders(selectedFolder.path);
          e.preventDefault();
        }
        break;
      case 'Enter':
        if (filteredFolders.length > 0) {
          const selectedFolder = filteredFolders[highlightedIndex];
          setInputValue(selectedFolder.path);
          onChange(selectedFolder.id);
          setIsOpen(false);
          // if (onFolderSelect) {
          //   onFolderSelect();
          // }
        } else if (inputValue) {
          // 如果没有匹配的结果，但有输入，保持状态以便创建新文件夹
          onChange('');
          setIsOpen(false);
        }
        if (onFolderSelect) {
          onFolderSelect();
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        e.preventDefault();
        break;
    }
  };

  // 选择文件夹
  const selectFolder = (folder: BookmarkFolder) => {
    setInputValue(folder.path);
    onChange(folder.id);
    setIsOpen(false);
    // focusInput();
    // if (onFolderSelect) {
    //   onFolderSelect();
    // }
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 初始化和更新筛选结果
  useEffect(() => {
    filterFolders(inputValue);
  }, [allFolders, inputValue]);

  // 如果选择了文件夹，显示对应的路径
  useEffect(() => {
    if (value) {
      const selectedFolder = allFolders.find(folder => folder.id === value);
      if (selectedFolder && inputValue !== selectedFolder.path) {
        setInputValue(selectedFolder.path);
      }
    }
  }, [value, allFolders]);

  // 输入框失去焦点时的处理
  const handleBlur = () => {
    // 延迟关闭，以便可以点击选项
    setTimeout(() => {
      // 如果有匹配的文件夹但没有选择
      if (filteredFolders.length === 1 && !value) {
        selectFolder(filteredFolders[0]);
      }
    }, 200);
  };

  // 添加高亮文本组件
  const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={index} className="bg-yellow-200 dark:bg-yellow-800">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  // 高亮路径的每一部分
  const HighlightPath = ({ path, searchText }: { path: string; searchText: string }) => {
    const pathParts = path.split('/');
    const searchParts = searchText.toLowerCase().split('/').filter(Boolean);
    const lastSearchPart = searchParts[searchParts.length - 1] || '';

    return (
      <span>
        {pathParts.map((part, index) => (
          <span key={index}>
            {index > 0 && <span className="text-muted-foreground">/</span>}
            <HighlightText 
              text={part} 
              highlight={
                // 对于最后一个搜索词，在所有部分中查找
                // 对于其他搜索词，只在对应位置查找
                index < searchParts.length - 1 
                  ? searchParts[index] 
                  : lastSearchPart
              }
            />
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:border-input"
        onClick={focusInput}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          autoFocus
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-1"
        >
          <svg 
            width="15" 
            height="15" 
            viewBox="0 0 15 15" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-44 overflow-auto scrollbar-thin"
          style={{
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          }}
        >
          {filteredFolders.length > 0 ? (
            <ul className="py-1">
              {filteredFolders.map((folder, index) => (
                <li 
                  key={folder.id}
                  onClick={() => selectFolder(folder)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                    index === highlightedIndex ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2 text-yellow-500"
                    >
                      <path d="M2 3.5C2 2.67157 2.67157 2 3.5 2H6.5C7.12951 2 7.72229 2.37764 8.03243 2.93879L8.96757 4.56121C9.03771 4.70171 9.18526 4.79998 9.34722 4.8H12.5C13.3284 4.8 14 5.47157 14 6.3V12.5C14 13.3284 13.3284 14 12.5 14H3.5C2.67157 14 2 13.3284 2 12.5V3.5Z" fill="currentColor" />
                    </svg>
                    <HighlightPath path={folder.path} searchText={inputValue} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-center text-muted-foreground">
              {inputValue ? "未找到匹配的文件夹，点击确认将自动创建" : "输入或选择一个书签文件夹"}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 