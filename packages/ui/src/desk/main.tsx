import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DeskApp } from './Desk.tsx';
import '../../styles/prototype.css';
import '../../styles/desk.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <DeskApp />
    </StrictMode>,
  );
}
