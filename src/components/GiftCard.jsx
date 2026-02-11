import React from 'react';
import { Gift, CheckCircle2 } from 'lucide-react';

export default function GiftCard({ gift, onClick }) {
    const isReserved = !!gift.reserved_by;

    return (
        <div
            className={`
        relative bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 cursor-pointer flex flex-col h-full
        ${isReserved ? 'opacity-90' : 'hover:shadow-md hover:-translate-y-1'}
      `}
            onClick={() => onClick(gift)}
        >
            {/* Image Container */}
            <div className="aspect-square w-full overflow-hidden bg-slate-50 relative shrink-0">
                {gift.image_url ? (
                    <img
                        src={gift.image_url}
                        alt={gift.name}
                        className={`w-full h-full object-cover transition-all ${isReserved ? 'grayscale' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Gift size={48} />
                    </div>
                )}

                {/* Status Badge */}
                {isReserved && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-sm">
                            <CheckCircle2 size={16} />
                            <div className="text-center leading-tight">
                                <span className="block font-bold">Já Ganhei</span>
                                <span className="text-xs opacity-75">de {gift.reserved_by}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content & CTA Container - Grows to fill space */}
            <div className="p-3 md:p-4 flex flex-col flex-grow justify-between">
                <div>
                    <h3 className="font-medium text-slate-800 text-sm md:text-lg leading-tight mb-2 line-clamp-2" title={gift.name}>
                        {gift.name}
                    </h3>

                    {/* Price with High Visibility */}
                    <div className="flex items-baseline gap-0.5 md:gap-1">
                        <span className="text-[10px] md:text-xs font-semibold text-slate-400">R$</span>
                        <p className="text-orange-600 font-extrabold text-lg md:text-2xl tracking-tight">
                            {gift.price ? parseFloat(gift.price).toFixed(2).replace('.', ',') : '--,--'}
                        </p>
                    </div>
                </div>

                {/* Call to Action - Pushed to bottom */}
                <div className="pt-4 mt-auto">
                    {isReserved ? (
                        <button className="w-full py-2 bg-slate-100 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                            <span className="md:hidden">Ver / Liberar</span>
                            <span className="hidden md:inline">Ver Detalhes / Liberar</span>
                        </button>
                    ) : (
                        <button className="w-full py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors border border-rose-100">
                            <span className="md:hidden">Ver Detalhes</span>
                            <span className="hidden md:inline">Ver Detalhes</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
