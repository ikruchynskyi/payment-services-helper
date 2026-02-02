import React from 'react';
import { createRoot } from 'react-dom/client';
import ResultsApp from './ResultsApp.jsx';
import './results.css';

const root = createRoot(document.getElementById('root'));
root.render(<ResultsApp />);
