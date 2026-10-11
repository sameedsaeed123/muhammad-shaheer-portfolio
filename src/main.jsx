import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CivilApp from './civil/CivilApp';
import './civil/civil.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CivilApp />
  </StrictMode>,
);
