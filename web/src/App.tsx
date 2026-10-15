import { Route, Routes } from 'react-router-dom';

import { AuthBridge } from './routes/AuthBridge';
import { Home } from './routes/Home';
import { NotFound } from './routes/NotFound';
import { Privacy } from './routes/Privacy';
import { Terms } from './routes/Terms';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      {/* Supabase email templates point here (token_hash flow). */}
      <Route path="/auth/bridge" element={<AuthBridge />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
