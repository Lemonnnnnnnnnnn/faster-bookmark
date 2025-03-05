import React from 'react';
import { createRoot } from 'react-dom/client';
import PopupApp from './PopupApp';

// 渲染弹出窗口应用
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
} 