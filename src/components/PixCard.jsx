import React, { useState, useEffect } from 'react';
import { Copy, Check, Heart, Wallet, ChevronRight } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { PixPayload } from '../utils/pix';
import { supabase } from '../lib/supabaseClient';

export default function PixCard() {
    // Steps: 'form' -> 'payment'
    const [step, setStep] = useState('form');
    const [loading, setLoading] = useState(false);

    // Form Data
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');

    // Value Logic
    const [selectedAmount, setSelectedAmount] = useState(null); // value in number (e.g. 50.00)
    const [rawValue, setRawValue] = useState(0); // Integer cents (e.g. 500 for R$ 5,00)

    const [payload, setPayload] = useState('');
    const [copied, setCopied] = useState(false);

    // CONFIGURAÇÃO DO PIX (Atualizado com seus dados)
    const PIX_KEY = "davimtg2012+nu@gmail.com";
    const PIX_NAME = "Davi e Larissa";
    const PIX_CITY = "Rio de Janeiro";

    // Helper to format display value
    const formatCurrency = (cents) => {
        return (cents / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    // ATM-style input logic using KeyDown to ignore caret position
    const handleKeyDown = (e) => {
        // Allow navigation keys
        if (['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            return;
        }

        // Handle Backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            setRawValue(prev => Math.floor(prev / 10));
            setSelectedAmount(null);
            return;
        }

        // Handle Numbers
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            const digit = parseInt(e.key, 10);

            setRawValue(prev => {
                const newValue = (prev * 10) + digit;
                // Simple safety cap to avoid overflow/nonsense values
                if (newValue > 100000000) return prev;
                return newValue;
            });
            setSelectedAmount(null);
        }
    };

    // Generate Payload whenever amount changes
    useEffect(() => {
        const amount = selectedAmount ? selectedAmount : (rawValue / 100);

        const pix = new PixPayload({
            key: PIX_KEY,
            name: PIX_NAME,
            city: PIX_CITY,
            value: amount || null,
            txid: 'CHADECASA2025'
        });

        setPayload(pix.generate());
    }, [selectedAmount, rawValue]);

    const handleCopy = () => {
        navigator.clipboard.writeText(payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirm = async (e) => {
        e.preventDefault();

        const finalAmount = selectedAmount ? selectedAmount : (rawValue / 100);
        if (finalAmount <= 0) {
            alert("Por favor, informe um valor válido.");
            return;
        }

        if (!name.trim()) {
            alert("Por favor, informe seu nome.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('pix_donations')
                .insert([{
                    donor_name: name,
                    message: message,
                    amount: finalAmount,
                    status: 'pending'
                }]);

            if (error) throw error;

            setStep('payment');
        } catch (err) {
            console.error(err);
            alert("Erro ao registrar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const PRESETS = [50, 100, 200];
    const displayValue = selectedAmount ? selectedAmount : (rawValue / 100);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden h-full flex flex-col">

            {/* Header */}
            <div className="bg-orange-50 p-6 text-center border-b border-orange-100">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart size={24} fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 font-serif">Presente via Pix</h3>
                <p className="text-sm text-slate-500 mt-1">
                    {step === 'form'
                        ? 'Ajude-nos a construir nosso lar!'
                        : 'Obrigado pelo carinho! ❤️'}
                </p>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 flex flex-col">

                {step === 'form' ? (
                    <form onSubmit={handleConfirm} className="space-y-5">

                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                                placeholder="Quem está mandando esse mimo?"
                            />
                        </div>

                        {/* Value Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Valor do Presente</label>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {PRESETS.map(val => (
                                    <button
                                        type="button"
                                        key={val}
                                        onClick={() => { setSelectedAmount(val); setRawValue(0); }}
                                        className={`
                                            py-2 px-1 rounded-lg text-xs font-bold transition-all border
                                            ${selectedAmount === val
                                                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50'
                                            }
                                        `}
                                    >
                                        R$ {val}
                                    </button>
                                ))}
                            </div>

                            {/* ATM Style Input */}
                            <div className={`
                                relative rounded-xl border-2 transition-all overflow-hidden bg-slate-50
                                ${!selectedAmount && rawValue > 0 ? 'border-orange-400 ring-2 ring-orange-100 bg-white' : 'border-slate-200'}
                            `}>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-400 font-bold text-sm">R$</span>
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={selectedAmount ? '' : formatCurrency(rawValue).replace('R$', '').trim()}
                                    onKeyDown={handleKeyDown}
                                    onChange={() => { }}
                                    placeholder="0,00"
                                    className="block w-full text-right pr-4 pl-10 py-3 bg-transparent text-xl font-bold text-slate-700 placeholder-slate-300 focus:outline-none cursor-text"
                                />
                            </div>
                        </div>

                        {/* Message Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem (Opcional)</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all resize-none"
                                placeholder="Deixe um recadinho pra nós..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || (selectedAmount === null && rawValue === 0)}
                            className="w-full py-4 text-white font-bold rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Gerando...' : (
                                <>
                                    <span>Vou Presentear</span>
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Success Message */}
                        <div className="text-center space-y-1">
                            <p className="text-lg font-bold text-slate-800">Sua intenção foi registrada!</p>
                            <p className="text-sm text-slate-500 px-4">
                                Use o código abaixo no app do seu banco para finalizar a transferência de <strong className="text-slate-800">R$ {displayValue.toFixed(2).replace('.', ',')}</strong>.
                            </p>
                        </div>

                        {/* QR Code Container */}
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 relative">
                            {payload && (
                                <QRCodeCanvas
                                    value={payload}
                                    size={160}
                                    fgColor="#ea580c"
                                    level={"M"}
                                />
                            )}
                        </div>

                        {/* Copy Button */}
                        <div className="w-full space-y-3">
                            <button
                                onClick={handleCopy}
                                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-slate-200"
                            >
                                {copied ? (
                                    <>
                                        <Check size={18} className="text-emerald-400" />
                                        <span className="text-emerald-100">Código Copiado!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={18} />
                                        <span>Copiar "Copia e Cola"</span>
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-slate-400">
                                Dúvidas? A chave é nosso e-mail.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
