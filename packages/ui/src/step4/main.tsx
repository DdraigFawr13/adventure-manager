import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Step4 } from './Step4.tsx';
import '../../styles/step4.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Step4 />
    </StrictMode>,
  );
}
