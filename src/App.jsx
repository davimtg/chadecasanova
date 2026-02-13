import React, { useState, useEffect, useRef } from 'react'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { supabase } from './lib/supabaseClient'
import GiftList from './components/GiftList'
import AdminPanel from './components/AdminPanel'

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const hasLogged = useRef(false);

  // Check URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setShowAdmin(true);
    }

    // Access Logging
    const logAccess = async () => {
      if (hasLogged.current) return;
      hasLogged.current = true;

      try {
        console.log('Iniciando registro de acesso...');
        let ipData = { ip: null, city: null, region: null, country_name: null };

        // Tentativa 1: ipapi.co
        try {
          const res = await fetch('https://ipapi.co/json/');
          if (res.ok) {
            ipData = await res.json();
          } else {
            throw new Error('ipapi.co falhou');
          }
        } catch (e) {
          console.warn('Falha no ipapi.co, tentando fallback 1 (ipwho.is)...', e);

          // Tentativa 2: ipwho.is (fornece local)
          try {
            const res = await fetch('https://ipwho.is/');
            if (res.ok) {
              const data = await res.json();
              if (data.success !== false) {
                ipData = data;
              } else {
                throw new Error('ipwho.is retornou sucesso: false');
              }
            } else {
              throw new Error('ipwho.is falhou');
            }
          } catch (e2) {
            console.warn('Falha no ipwho.is, tentando fallback 2 (ipify)...', e2);

            // Tentativa 3: ipify (só IP)
            try {
              const res = await fetch('https://api.ipify.org?format=json');
              if (res.ok) {
                const data = await res.json();
                ipData.ip = data.ip;
                ipData.city = 'Desconhecido';
                ipData.region = '-';
                ipData.country_name = '-';
              }
            } catch (e3) {
              console.error('Falha também no ipify', e3);
              return; // Desiste se não conseguir nem o IP
            }
          }
        }

        console.log('Dados obtidos:', ipData);

        const { error } = await supabase.from('access_logs').insert([{
          ip_address: ipData.ip,
          user_agent: navigator.userAgent,
          location: ipData.city ? `${ipData.city}, ${ipData.region}, ${ipData.country_name}` : 'Localização Indisponível'
        }]);

        if (error) {
          console.error('Erro Supabase:', error);
        } else {
          console.log('Acesso registrado com sucesso!');
        }

      } catch (error) {
        console.error('Erro geral no log:', error);
      }
    };

    logAccess();
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
          <GiftList onOpenAdmin={() => setShowAdmin(true)} />

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
      <SpeedInsights />
    </div>
  )
}

export default App
