import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { router } from './routes/Routes.jsx';
import React from 'react';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
        <div className='max-w-screen-2xl mx-auto'>
          <RouterProvider router={router} />
        </div>
  </React.StrictMode>,
)
