import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export default function EventInfo() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState(null);

    const handleConfirm = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('rsvps')
                .insert([{ full_name: name, confirmed: true }]);

            if (insertError) throw insertError;

            setConfirmed(true);
            setName('');
        } catch (err) {
            console.error('Erro ao confirmar presença:', err);
            setError('Ocorreu um erro ao confirmar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mb-16 px-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-75">
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-orange-100 flex flex-col md:flex-row">

                {/* Left Side: Event Details */}
                <div className="p-8 md:p-10 flex-1 flex flex-col justify-center space-y-6 bg-gradient-to-br from-orange-50 to-white">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-orange-900 mb-2">Venha celebrar conosco!</h2>
                        <p className="text-orange-700/80 font-medium">Sua presença é o nosso maior presente.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-full shadow-sm text-orange-500 shrink-0">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">7 de Março</h3>
                                <p className="text-slate-500">Domingo, às 13:00h</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-full shadow-sm text-orange-500 shrink-0">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Hilton Gadret</h3>
                                <p className="text-slate-500 mb-1">Rua Hilton Gadret, 140, Bloco 1</p>
                                <a
                                    href="https://maps.app.goo.gl/3hapxJMJEtae61RAA"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-500 font-bold text-sm hover:underline hover:text-orange-600 inline-flex items-center gap-1"
                                >
                                    Ver no Mapa
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: RSVP Form */}
                <div className="p-8 md:p-10 flex-1 bg-white flex flex-col justify-center border-t md:border-t-0 md:border-l border-orange-50">
                    <div className="max-w-sm mx-auto w-full">
                        {confirmed ? (
                            <div className="text-center py-8 animate-in zoom-in-95 duration-300">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Presença Confirmada!</h3>
                                <p className="text-slate-500">Obrigado por confirmar. Mal podemos esperar para te ver lá! ❤️</p>
                                <button
                                    onClick={() => setConfirmed(false)}
                                    className="mt-6 text-sm text-slate-400 hover:text-slate-600 underline"
                                >
                                    Confirmar outra pessoa
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
                                    Confirme sua presença
                                </h3>

                                <form onSubmit={handleConfirm} className="space-y-4">
                                    <div>
                                        <label htmlFor="fullName" className="block text-sm font-medium text-slate-600 mb-1">
                                            Nome e Sobrenome
                                        </label>
                                        <input
                                            id="fullName"
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: João Silva e Maria"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg text-center font-medium">
                                            {error}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Confirmando...' : 'Confirmar Presença'}
                                    </button>
                                </form>
                                <p className="text-center text-xs text-slate-400 mt-4">
                                    É rapidinho, só pra gente se organizar melhor!
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
