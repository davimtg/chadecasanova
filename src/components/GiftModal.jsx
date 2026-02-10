import React, { useState } from 'react';
import { X, ExternalLink, Gift, Heart, Lock, Unlock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function GiftModal({ gift, onClose, onReserveSuccess }) {
    const [step, setStep] = useState('details'); // details | form | success | cancel-auth
    const [formData, setFormData] = useState({ firstName: '', lastName: '', pin: '' });
    const [cancelPin, setCancelPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!gift) return null;

    const isReserved = !!gift.reserved_by;

    // Function to handle new reservation via RPC
    const handleReserve = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
        const pin = formData.pin.trim();

        if (pin.length < 3) {
            setError('A senha deve ter pelo menos 3 caracteres.');
            setLoading(false);
            return;
        }

        try {
            // Call the RPC function 'reserve_gift'
            const { data: success, error: rpcError } = await supabase
                .rpc('reserve_gift', {
                    p_gift_id: gift.id,
                    p_guest_name: fullName,
                    p_pin: pin
                });

            if (rpcError) throw rpcError;

            if (!success) {
                setError('Ops! Parece que alguém acabou de reservar este item. Atualize a página.');
                return;
            }

            setStep('success');
            if (onReserveSuccess) onReserveSuccess();
        } catch (err) {
            console.error(err);
            setError('Erro ao reservar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Function to handle cancellation via RPC
    const handleCancelReservation = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Call the RPC function 'cancel_reservation'
            const { data: success, error: rpcError } = await supabase
                .rpc('cancel_reservation', {
                    p_gift_id: gift.id,
                    p_pin: cancelPin.trim()
                });

            if (rpcError) throw rpcError;

            if (!success) {
                setError('Senha incorreta. Tente novamente.');
                return;
            }

            // Success
            if (onReserveSuccess) onReserveSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Erro ao cancelar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header Image */}
                <div className="h-48 bg-slate-50 relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/80 p-2 rounded-full text-slate-600 hover:bg-white transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    {gift.reserved_by && step === 'details' && (
                        <div className="absolute inset-0 bg-black/10 flex items-end p-4">
                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center gap-2">
                                <Heart size={14} fill="currentColor" />
                                Reservado por {gift.reserved_by}
                            </span>
                        </div>
                    )}

                    {gift.image_url ? (
                        <img
                            src={gift.image_url}
                            alt={gift.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Gift size={64} />
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto">

                    {/* VIEW: Details */}
                    {step === 'details' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-800">{gift.name}</h2>
                                <p className="text-rose-500 font-medium text-lg mt-1">
                                    ~ R$ {parseFloat(gift.price).toFixed(2).replace('.', ',')}
                                </p>
                            </div>

                            <div className="prose prose-sm text-slate-600">
                                <p>{gift.description || "Um item especial para nossa casa nova!"}</p>
                            </div>

                            {gift.product_link && (
                                <a
                                    href={gift.product_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-rose-500 hover:text-rose-600 font-medium underline-offset-4 hover:underline"
                                >
                                    <ExternalLink size={16} />
                                    Ver exemplo na loja
                                </a>
                            )}

                            {isReserved ? (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center space-y-3">
                                    <p className="text-slate-500 text-sm">
                                        Este item já foi reservado. Fui eu?
                                    </p>
                                    <button
                                        onClick={() => setStep('cancel-auth')}
                                        className="text-slate-600 hover:text-rose-500 text-sm font-medium underline flex items-center justify-center gap-2 w-full"
                                    >
                                        <Unlock size={14} />
                                        Liberar item (Desistir)
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setStep('form')}
                                    className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] transition-all"
                                >
                                    <Heart size={20} fill="currentColor" className="text-white/20" />
                                    Quero Presentear Este
                                </button>
                            )}
                        </div>
                    )}

                    {/* VIEW: Reservation Form */}
                    {step === 'form' && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold text-slate-800">Ótima escolha!</h3>
                                <p className="text-slate-500 text-sm">
                                    Informe seu nome e crie uma senha simples para caso precise mudar de ideia.
                                </p>
                            </div>

                            <form onSubmit={handleReserve} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                                            placeholder="Nome"
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Sobrenome</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                                            placeholder="Sobrenome"
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                    <label className="block text-sm font-bold text-yellow-800 mb-1 flex items-center gap-2">
                                        <Lock size={14} />
                                        Crie uma Senha (PIN)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={10}
                                        className="w-full px-4 py-2 rounded-lg border border-yellow-200 focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 outline-none transition-all bg-white"
                                        placeholder="Ex: 1234"
                                        value={formData.pin}
                                        onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                    />
                                    <p className="text-xs text-yellow-700 mt-2 leading-tight">
                                        * Guarde essa senha! Você vai precisar dela se quiser cancelar a reserva depois.
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep('details')}
                                        className="flex-1 py-2 px-4 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-2 px-4 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? 'Reservando...' : 'Confirmar com Senha'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* VIEW: Cancel Auth */}
                    {step === 'cancel-auth' && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold text-slate-800">Liberar Item</h3>
                                <p className="text-slate-500 text-sm">
                                    Para cancelar a reserva, digite a senha criada no momento da reserva.
                                </p>
                            </div>

                            <form onSubmit={handleCancelReservation} className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                        <Lock size={14} />
                                        Senha (PIN)
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all bg-white"
                                        placeholder="Sua senha"
                                        value={cancelPin}
                                        onChange={e => setCancelPin(e.target.value)}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep('details')}
                                        className="flex-1 py-2 px-4 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? 'Verificando...' : 'Confirmar Cancelamento'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* VIEW: Success */}
                    {step === 'success' && (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Heart size={32} fill="currentColor" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">Tudo Certo!</h3>
                            <p className="text-slate-600">
                                O item foi reservado para você.
                                <br />
                                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2 inline-block font-medium">
                                    Não esqueça sua senha: {formData.pin}
                                </span>
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-8 py-2 bg-slate-800 text-white rounded-full font-medium hover:bg-slate-900 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
