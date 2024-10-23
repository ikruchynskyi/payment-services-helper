import React from 'react';
import { createRoot } from 'react-dom/client';
import App from "./components/App";
import { StrictMode } from 'react';

const container = document.getElementById('wrapper');
const root = createRoot(container);
root.render(
<StrictMode>
  <App />
</StrictMode>
  );
