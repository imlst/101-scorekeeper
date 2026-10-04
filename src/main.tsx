import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#a7ef80',
          colorTextLightSolid: '#13271f',
          colorText: '#f4f3e9',
          colorTextHeading: '#13271f',
          colorTextSecondary: '#a2b2aa',
          colorBgContainer: '#18382f',
          colorBorder: 'rgba(230, 244, 233, 0.14)',
          borderRadius: 14,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
