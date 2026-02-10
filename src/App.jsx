import React from 'react'
import GiftList from './components/GiftList'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <GiftList />

      {/* Footer / Credits */}
      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>Feito com ❤️ para celebrar este momento especial.</p>
      </footer>
    </div>
  )
}

export default App
