// The phone map page (/map.html): the engine test's kingdom map for a phone (D-154, D-164, D-204).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PhoneMap } from './PhoneMap.tsx';
import '../../../styles/engine-test-phone.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <PhoneMap />
    </StrictMode>,
  );
}
