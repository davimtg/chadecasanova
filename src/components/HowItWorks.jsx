import React from 'react';
import { MousePointerClick, Store, PartyPopper } from 'lucide-react';

export default function HowItWorks() {
    const steps = [
        {
            icon: <MousePointerClick className="text-orange-500" size={28} />,
            title: "Escolha e Reserve",
            description: "Clique no presente que deseja nos dar para tirá-lo da lista."
        },
        {
            icon: <Store className="text-orange-500" size={28} />,
            title: "Compre onde quiser",
            description: "Use o link de exemplo ou compre na sua loja favorita."
        },
        {
            icon: <PartyPopper className="text-orange-500" size={28} />,
            title: "Entregue ou faça um Pix",
            description: "Leve no dia do Chá ou, se preferir, envie o valor equivalente via Pix."
        }
    ];

    return (
        <div className="bg-orange-50 rounded-2xl p-6 md:p-8 border border-orange-100 mb-8 mx-auto max-w-6xl w-full">
            <h2 className="text-xl font-bold text-slate-800 font-serif text-center mb-6">Como Funciona</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm border border-orange-50">
                        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                            {step.icon}
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
                        <p className="text-slate-600 text-sm">{step.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
