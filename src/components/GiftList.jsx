import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import GiftCard from './GiftCard';
import GiftModal from './GiftModal';
import PixCard from './PixCard';
import { Sparkles } from 'lucide-react';
import nosImage from '../assets/nos.JPEG';

export default function GiftList() {
    const [gifts, setGifts] = useState([]);
    const [selectedGift, setSelectedGift] = useState(null);
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
                <div className="text-center mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                    <div className="max-w-3xl mx-auto my-12 bg-white rounded-[2rem] p-10 md:p-14 shadow-[0_20px_50px_rgba(255,237,213,0.5)] border border-orange-50 text-center relative">

                        {/* Ícone de Coração Flutuante */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white p-4 rounded-full shadow-md border border-orange-50">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-rose-400">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.75 3c1.99 0 3.751.984 4.75 2.499A5.75 5.75 0 0117.25 3c3.036 0 5.5 2.322 5.5 5.25 0 3.924-2.438 7.11-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                        </div>

                        <div className="mt-6">
                            <h2 className="text-3xl font-bold text-slate-800 mb-8">
                                Bem-vindos à nossa lista!
                            </h2>

                            <div className="space-y-6 text-slate-600 text-lg leading-relaxed px-4 md:px-10">
                                <p>
                                    Montamos essa lista com muito carinho para nos ajudar nessa nova etapa!
                                </p>
                                <p>
                                    Os links e preços que aparecem aqui são apenas uma <span className="text-orange-500 font-medium">referência</span>. Sintam-se totalmente à vontade para comprar em outra loja, outra marca ou aproveitar promoções.
                                </p>
                            </div>

                            <div className="mt-12 inline-flex bg-orange-50/50 px-8 py-5 rounded-2xl border border-orange-100 text-orange-900 items-center justify-center mx-auto">
                                <span className="text-lg font-semibold">
                                    💡 Dica de ouro: Lembre-se de clicar em <strong className="text-orange-600 underline decoration-orange-300 underline-offset-4">'Reservar'</strong> aqui no site para evitar presentes repetidos!
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-10 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'up50', label: 'Até R$ 50' },
                        { id: '50to100', label: 'R$ 50 - R$ 100' },
                        { id: '100to200', label: 'R$ 100 - R$ 200' },
                        { id: 'above200', label: 'Acima de R$ 200' },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setFilter(opt.id)}
                            className={`
                                px-4 py-2 rounded-full text-sm font-medium transition-all
                                ${filter === opt.id
                                    ? 'bg-orange-400 text-white shadow-md scale-105'
                                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                }
                            `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT GRID */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 auto-rows-fr">

                        {/* Always show PixCard first or in a prominent spot if filter is 'all' or implies money */}
                        {filter === 'all' && <PixCard />}

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

            {/* MODAL */}
            {selectedGift && (
                <GiftModal
                    gift={selectedGift}
                    onClose={() => setSelectedGift(null)}
                    onReserveSuccess={() => {
                        // Refresh list to show updated status
                        fetchGifts();
                        // Do not close modal immediately if we want to show success message, 
                        // logic is handled inside GiftModal (step=success)
                    }}
                />
            )}
        </div>
    );
}
