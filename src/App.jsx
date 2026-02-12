import React, { useState, useEffect } from 'react'
import { Analytics } from "@vercel/analytics/next"
import GiftList from './components/GiftList'
import AdminPanel from './components/AdminPanel'

function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  // Check URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setShowAdmin(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      {showAdmin ? (
        <AdminPanel onClose={() => {
          setShowAdmin(false);
          window.history.replaceState(null, '', '/');
        }} />
      ) : (
        <>
          <GiftList />

          {/* Footer / Credits */}
          <footer className="py-8 text-center text-slate-400 text-sm">
            <p>Feito com ❤️ para celebrar este momento especial.</p>
            <button
              onClick={() => setShowAdmin(true)}
              className="mt-4 text-slate-300 hover:text-slate-500 text-xs transition-colors underline underline-offset-2"
            >
              Área do Anfitrião
            </button>
          </footer>
        </>
      )}
      <Analytics />
    </div>
  )
}

export default App
