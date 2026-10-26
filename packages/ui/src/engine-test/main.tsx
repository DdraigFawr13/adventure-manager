import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EngineTest } from './EngineTest.tsx';
import '../../styles/engine-test.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <EngineTest />
    </StrictMode>,
  );
}
