// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import store from './store';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1e40af', color: '#fff', fontFamily: 'Inter', fontSize: '14px' },
            success: { style: { background: '#059669' } },
            error:   { style: { background: '#dc2626' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
