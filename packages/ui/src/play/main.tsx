// The gate 1 play page (/play.html, gate 1 spec "UI").
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, PlayBoundary } from './Play.tsx';
import '../../styles/play.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <PlayBoundary>
        <Play />
      </PlayBoundary>
    </StrictMode>,
  );
}
