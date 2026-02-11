import React, { useState } from 'react';
import { X, ExternalLink, Gift, Heart, AlertCircle, MapPin, Truck, PartyPopper, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function GiftModal({ gift, onClose, onReserveSuccess }) {
    // steps: details -> (warning_ack) -> form -> success
    const [step, setStep] = useState('details');
    const [formData, setFormData] = useState({ firstName: '', lastName: '' });
    const [deliveryMethod, setDeliveryMethod] = useState(''); // 'hand' | 'ship'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ADDRESS CONSTANT
    const OUR_ADDRESS = "Rua Samuel das Neves, 915 - Pechincha, Jacarépagua, Rio de Janeiro/RJ - CEP 22770-110";

    if (!gift) return null;

    const maxQty = gift.max_quantity || 1;
    const currentQty = gift.current_quantity || 0;
    const isSoldOut = currentQty >= maxQty;
    const isReserved = isSoldOut; // Treat as reserved if sold out
    const hasWarning = !!gift.warning_title;

    const handleStartReserve = () => {
        if (hasWarning) {
            setStep('warning_ack');
        } else {
            setStep('form');
        }
    };

    const handleReserve = async (e) => {
        e.preventDefault();
        if (!deliveryMethod) {
            setError('Por favor, selecione como pretende entregar o presente.');
            return;
        }

        setLoading(true);
        setError(null);

        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

        try {
            const { data: success, error: rpcError } = await supabase
                .rpc('reserve_gift', {
                    p_gift_id: gift.id,
                    p_guest_name: fullName,
                    p_pin: 'no-pin',
                    p_delivery_method: deliveryMethod
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-orange-900/20 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border-2 border-orange-50">

                {/* Header Image - Hidden in warning_ack to focus attention */}
                {step !== 'warning_ack' && (
                    <div className="h-48 bg-orange-50 relative shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-white/80 p-2 rounded-full text-slate-600 hover:bg-white hover:text-orange-600 transition-colors z-10 shadow-sm"
                        >
                            <X size={20} />
                        </button>

                        {gift.reserved_by && (
                            <div className="absolute inset-0 bg-black/10 flex items-end p-4">
                                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center gap-2">
                                    <Heart size={14} fill="currentColor" />
                                    Indisponível / Reservado
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
                            <div className="w-full h-full flex items-center justify-center text-orange-200">
                                <Gift size={64} />
                            </div>
                        )}
                    </div>
                )}

                {/* Content Area */}
                <div className="p-6 overflow-y-auto">

                    {step === 'details' && (
                        <div className="space-y-6">

                            {/* Warning Banner */}
                            {hasWarning && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 animate-pulse">
                                    <AlertTriangle className="text-amber-600 shrink-0" />
                                    <div>
                                        <p className="font-bold text-amber-800">{gift.warning_title}</p>
                                        {gift.warning_message && (
                                            <p className="text-sm text-amber-700 mt-1">{gift.warning_message}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 font-serif">{gift.name}</h2>
                                <p className="text-orange-600 font-medium text-lg mt-1">
                                    ~ R$ {parseFloat(gift.price).toFixed(2).replace('.', ',')}
                                </p>
                            </div>

                            <div className="prose prose-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p>{gift.description || "Um item especial para nossa casa nova!"}</p>
                            </div>

                            {gift.product_link && (
                                <a
                                    href={gift.product_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-orange-500 hover:text-orange-700 font-medium underline-offset-4 hover:underline transition-colors"
                                >
                                    <ExternalLink size={16} />
                                    Ver exemplo na loja
                                </a>
                            )}

                            {isSoldOut ? (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center space-y-3">
                                    <p className="text-slate-500 text-sm">
                                        Este item já foi totalmente reservado.
                                    </p>
                                    <button
                                        disabled
                                        className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-medium cursor-not-allowed"
                                    >
                                        Esgotado
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {maxQty > 1 && (
                                        <div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-100 text-center text-sm text-orange-800">
                                            Ainda restam <strong>{maxQty - currentQty}</strong> de <strong>{maxQty}</strong> unidades/cotas.
                                        </div>
                                    )}
                                    <button
                                        onClick={handleStartReserve}
                                        className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all shadow-md shadow-orange-200"
                                    >
                                        <Heart size={20} fill="currentColor" className="text-white/20" />
                                        {maxQty > 1 ? 'Quero Presentear uma Unidade' : 'Quero Presentear Este'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'warning_ack' && (
                        <div className="py-4 space-y-6 text-center animate-in zoom-in-95 duration-200">
                            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={40} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Atenção!</h3>
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left">
                                    <p className="font-bold text-amber-900 text-lg mb-2 text-center">{gift.warning_title}</p>
                                    <p className="text-amber-800 text-center">{gift.warning_message}</p>
                                </div>
                            </div>

                            <p className="text-slate-600 text-sm">
                                É muito importante verificar esse detalhe antes de comprar para evitar trocas.
                            </p>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={() => setStep('form')}
                                    className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-md shadow-amber-200 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} /> Entendi, vou conferir!
                                </button>
                                <button
                                    onClick={() => setStep('details')}
                                    className="text-slate-400 text-sm hover:text-slate-600 py-2"
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'form' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-800 font-serif">Ótima escolha!</h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    Informe seu nome para sabermos quem vai nos presentear.
                                </p>
                            </div>

                            <form onSubmit={handleReserve} className="space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                                            placeholder="Ex: Maria"
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Sobrenome</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                                            placeholder="Ex: Silva"
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Delivery Method Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-700">Como você pretende entregar?</label>

                                    <div className="grid gap-3">
                                        <label className={`
                      flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${deliveryMethod === 'hand'
                                                ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200'
                                                : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }
                    `}>
                                            <input
                                                type="radio"
                                                name="delivery"
                                                value="hand"
                                                checked={deliveryMethod === 'hand'}
                                                onChange={e => setDeliveryMethod(e.target.value)}
                                                className="hidden"
                                            />
                                            <div className={`p-2 rounded-full ${deliveryMethod === 'hand' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <PartyPopper size={18} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Levar no dia do evento (Em mãos)</span>
                                        </label>

                                        <label className={`
                      flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${deliveryMethod === 'ship'
                                                ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200'
                                                : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }
                    `}>
                                            <input
                                                type="radio"
                                                name="delivery"
                                                value="ship"
                                                checked={deliveryMethod === 'ship'}
                                                onChange={e => setDeliveryMethod(e.target.value)}
                                                className="hidden"
                                            />
                                            <div className={`p-2 rounded-full ${deliveryMethod === 'ship' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <Truck size={18} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Enviar para o endereço do casal</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional Address Box */}
                                {deliveryMethod === 'ship' && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-start gap-2 text-slate-600">
                                            <MapPin size={16} className="mt-1 shrink-0 text-orange-500" />
                                            <div className="text-sm">
                                                <p className="font-semibold text-slate-800 mb-1">Endereço de Entrega:</p>
                                                <p className="leading-relaxed bg-white p-2 rounded border border-slate-200 select-all">
                                                    {OUR_ADDRESS}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    * Copie o endereço acima para usar na loja.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
                                        className="flex-1 py-2 px-4 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-orange-100"
                                    >
                                        {loading ? 'Confirmando...' : 'Confirmar Reserva'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in spin-in-12 duration-500">
                                <Heart size={32} fill="currentColor" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 font-serif">Obrigado!</h3>
                            <p className="text-slate-600">
                                O item foi reservado com sucesso em seu nome.
                                <br />
                                Ficamos muito felizes com seu carinho! ❤️
                            </p>

                            {deliveryMethod === 'ship' && (
                                <div className="mt-4 p-3 bg-orange-50 text-orange-800 text-sm rounded-lg inline-block">
                                    Lembre-se de enviar para o endereço que mostramos!
                                </div>
                            )}

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
