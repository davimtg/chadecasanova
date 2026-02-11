import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import GiftCard from './GiftCard';
import GiftModal from './GiftModal';
import PixCard from './PixCard';
import { Sparkles, Gift, X } from 'lucide-react';
import nosImage from '../assets/foto_casal.jpg';

export default function GiftList() {
    const [gifts, setGifts] = useState([]);
    const [selectedGift, setSelectedGift] = useState(null);
    const [showPixModal, setShowPixModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | up50 | 50to100 | 100to200 | above200

    const fetchGifts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('gifts')
            .select('*')
            .order('name', { ascending: true }); // Alphabetical order mostly

        if (data) setGifts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchGifts();
    }, []);

    const filteredGifts = gifts.filter(gift => {
        if (filter === 'all') return true;

        // Remove R$ if present (though database should be numeric really, but handled just in case)
        const price = parseFloat(gift.price || 0);

        if (filter === 'up50') return price <= 50;
        if (filter === '50to100') return price > 50 && price <= 100;
        if (filter === '100to200') return price > 100 && price <= 200;
        if (filter === 'above200') return price > 200;
        return true;
    });

    return (
        <div className="min-h-screen bg-orange-50 font-sans text-slate-900 pb-20">
            {/* Navigation / Top-bar could go here */}

            <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">

                {/* HERO SECTION */}
                <div className="text-center mb-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative inline-block">
                        <img
                            src={nosImage}
                            alt="Nós"
                            className="rounded-full w-40 h-40 md:w-52 md:h-52 mx-auto object-cover border-4 border-white shadow-xl"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md text-orange-500">
                            <Sparkles size={24} fill="currentColor" />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-orange-900 font-serif tracking-tight">
                            Chá de Casa Nova
                        </h1>
                        <p className="text-orange-700/80 font-medium mt-2 text-lg">
                            Bem-vindos ao nosso cantinho virtual!
                        </p>
                    </div>

                    {/* Welcome Text Card */}
                    <div className="max-w-3xl mx-auto mt-12 mb-8 bg-white rounded-[2rem] p-8 md:p-14 shadow-[0_20px_50px_rgba(255,237,213,0.5)] border border-orange-50 text-center relative">

                        {/* Ícone de Coração Flutuante */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white p-4 rounded-full shadow-md border border-orange-50">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-rose-400">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.75 3c1.99 0 3.751.984 4.75 2.499A5.75 5.75 0 0117.25 3c3.036 0 5.5 2.322 5.5 5.25 0 3.924-2.438 7.11-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                        </div>

                        <div className="mt-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">
                                Bem-vindos à nossa lista!
                            </h2>

                            <div className="space-y-4 text-slate-600 text-base md:text-lg leading-relaxed px-2 md:px-10">
                                <p>
                                    Montamos essa lista com muito carinho para nos ajudar nessa nova etapa!
                                </p>
                                <p>
                                    Os links e preços são apenas uma <span className="text-orange-500 font-medium">referência</span>. Sintam-se à vontade para comprar onde preferirem.
                                </p>
                            </div>
                        </div>

                        {/* Pix Call to Action inside the Welcome Card for better flow */}
                        <div className="mt-10 pt-8 border-t border-orange-100 flex flex-col items-center gap-4">
                            <p className="text-slate-500 text-sm font-medium">Prefere ajudar com algum valor livre?</p>
                            <button
                                onClick={() => setShowPixModal(true)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                            >
                                <Gift size={20} />
                                Quero presentear via Pix
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="sticky top-4 z-40 py-2 -mx-4 px-4 overflow-x-auto no-scrollbar flex justify-start md:justify-center gap-2 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100 bg-orange-50/95 backdrop-blur-sm md:bg-transparent">
                    <div className="flex gap-2 mx-auto">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'up50', label: 'Até R$ 50' },
                            { id: '50to100', label: 'R$ 50 - R$ 100' },
                            { id: '100to200', label: 'R$ 100 - R$ 200' },
                            { id: 'above200', label: '+ R$ 200' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setFilter(opt.id)}
                                className={`
                                    whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all border
                                    ${filter === opt.id
                                        ? 'bg-orange-500 text-white border-orange-500 shadow-md scale-105'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50 hover:border-orange-200'
                                    }
                                `}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT GRID */}
                {/* 
                   Mobile: grid-cols-2 (2 items per row)
                   Gap: smaller gap-3 on mobile to fit items better 
                */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8 auto-rows-fr pb-10">
                        {filteredGifts.map(gift => (
                            <GiftCard
                                key={gift.id}
                                gift={gift}
                                onClick={setSelectedGift}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* MODAL - Gift Details */}
            {selectedGift && (
                <GiftModal
                    gift={selectedGift}
                    onClose={() => setSelectedGift(null)}
                    onReserveSuccess={() => {
                        fetchGifts();
                    }}
                />
            )}

            {/* MODAL - Pix */}
            {showPixModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPixModal(false)} />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowPixModal(false)}
                            className="absolute top-3 right-3 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-1">
                            <PixCard />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
