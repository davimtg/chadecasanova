import React from 'react';
import { Gift, CheckCircle2 } from 'lucide-react';

export default function GiftCard({ gift, onClick }) {
    const isReserved = !!gift.reserved_by;

    return (
        <div
            className={`
        relative bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300
        ${isReserved ? 'opacity-75 grayscale' : 'hover:shadow-md hover:-translate-y-1 cursor-pointer'}
      `}
            onClick={() => !isReserved && onClick(gift)}
        >
            {/* Image Container */}
            <div className="aspect-square w-full overflow-hidden bg-slate-50 relative">
                {gift.image_url ? (
                    <img
                        src={gift.image_url}
                        alt={gift.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Gift size={48} />
                    </div>
                )}

                {/* Status Badge */}
                {isReserved && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-sm">
                            <CheckCircle2 size={16} />
                            Já Ganhei
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-medium text-slate-800 text-lg leading-tight mb-1">{gift.name}</h3>
                <p className="text-slate-500 text-sm">
                    {gift.price ? `R$ ${parseFloat(gift.price).toFixed(2).replace('.', ',')}` : 'Valor não informado'}
                </p>
            </div>

            {/* Call to Action (Visual only, actual action is clicking the card) */}
            {!isReserved && (
                <div className="px-4 pb-4">
                    <button className="w-full py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors">
                        Ver Detalhes
                    </button>
                </div>
            )}
        </div>
    );
}
