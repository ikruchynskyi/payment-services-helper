import React from 'react';
import { createRoot } from 'react-dom/client';
import SnippetsApp from './SnippetsApp.jsx';
import './snippets.css';

const root = createRoot(document.getElementById('root'));
root.render(<SnippetsApp />);
