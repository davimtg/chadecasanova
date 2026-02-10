import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import GiftCard from './GiftCard';
import GiftModal from './GiftModal';
import { PackageOpen } from 'lucide-react';

export default function GiftList() {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGift, setSelectedGift] = useState(null);

    const fetchGifts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('gifts')
            .select('*')
            .order('id', { ascending: true }); // Or order by price/name

        if (error) {
            console.error('Error fetching gifts:', error);
        } else {
            setGifts(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGifts();

        // Optional: Realtime subscription to updates
        const subscription = supabase
            .channel('gifts-updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gifts' }, (payload) => {
                setGifts(currentGifts =>
                    currentGifts.map(gift =>
                        gift.id === payload.new.id ? payload.new : gift
                    )
                );
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        }
    }, []);

    const handleReserveSuccess = () => {
        // Refresh list or rely on realtime
        fetchGifts();
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-20">

            {/* Header */}
            <div className="text-center mb-12 space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">
                    Chá de Casa Nova
                </h1>
                <p className="text-slate-500 max-w-lg mx-auto">
                    Estamos montando nosso cantinho com muito amor.
                    Escolha um item abaixo para nos presentear! 🏡✨
                </p>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="aspect-[3/4] bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : gifts.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <PackageOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Ainda não adicionamos itens à lista.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {gifts.map((gift) => (
                        <GiftCard
                            key={gift.id}
                            gift={gift}
                            onClick={setSelectedGift}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            {selectedGift && (
                <GiftModal
                    gift={selectedGift}
                    onClose={() => setSelectedGift(null)}
                    onReserveSuccess={handleReserveSuccess}
                />
            )}
        </div>
    );
}
