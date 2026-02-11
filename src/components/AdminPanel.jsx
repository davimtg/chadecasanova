import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Settings, Lock, Unlock, UserX, Edit2, Save, X, Plus, Trash2, Image, Link as LinkIcon, Gift } from 'lucide-react';

export default function AdminPanel({ onClose }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create | edit
    const [currentGift, setCurrentGift] = useState({
        name: '', description: '', price: '', image_url: '', product_link: '',
        warning_title: '', warning_message: '', category: ''
    });

    const fetchGifts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('gifts')
            .select('*')
            .order('id', { ascending: true });

        if (data) setGifts(data);
        setLoading(false);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsAuthenticated(true);
            fetchGifts();
        } else {
            alert('Senha incorreta');
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setCurrentGift({
            name: '', description: '', price: '', image_url: '', product_link: '',
            warning_title: '', warning_message: '', category: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (gift) => {
        setModalMode('edit');
        setCurrentGift({
            ...gift,
            warning_title: gift.warning_title || '',
            warning_message: gift.warning_message || '',
            category: gift.category || ''
        });
        setIsModalOpen(true);
    };

    const clearReservation = async (gift) => {
        if (!confirm(`Remover a reserva de ${gift.reserved_by}?`)) return;

        const { error } = await supabase.rpc('admin_clear_reservation', {
            p_id: gift.id,
            p_secret_key: password
        });

        if (error) alert('Erro: ' + error.message);
        else fetchGifts();
    };

    const deleteGift = async (gift) => {
        if (gift.reserved_by) {
            alert('Este item está reservado! Cancele a reserva primeiro antes de excluir.');
            return;
        }

        if (!confirm(`TEM CERTEZA? Isso excluirá o item "${gift.name}" permanentemente da lista.`)) return;

        const { error } = await supabase.rpc('admin_delete_gift', {
            p_id: gift.id,
            p_secret_key: password
        });

        if (error) {
            alert('Erro ao excluir: ' + error.message);
        } else {
            fetchGifts();
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            p_id: modalMode === 'edit' ? currentGift.id : null,
            p_name: currentGift.name,
            p_description: currentGift.description,
            p_price: parseFloat(currentGift.price) || 0,
            p_image_url: currentGift.image_url,
            p_product_link: currentGift.product_link,
            p_warning_title: currentGift.warning_title || null,
            p_warning_message: currentGift.warning_message || null,
            p_category: currentGift.category || null,
            p_secret_key: password
        };

        const { error } = await supabase.rpc('admin_upsert_gift', payload);

        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            setIsModalOpen(false);
            fetchGifts();
        }
        setLoading(false);
    };

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 z-[60] bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Settings className="text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Painel Admin</h2>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                            placeholder="Senha de Administrador"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900">
                            Entrar
                        </button>
                        <button type="button" onClick={onClose} className="w-full py-2 text-slate-500 text-sm hover:underline">
                            Voltar ao site
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-slate-500" />
                        Vou Presentear - Admin
                    </h1>
                    <div className="flex gap-3">
                        <button
                            onClick={openCreateModal}
                            className="bg-rose-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-600 flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={18} /> Novo Item
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-white border border-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-50"
                        >
                            Sair
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-16">Img</th>
                                <th className="p-4">Item</th>
                                <th className="p-4 hidden md:table-cell">Preço</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {gifts.map(gift => (
                                <tr key={gift.id} className="hover:bg-slate-50/50">
                                    <td className="p-4">
                                        <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden">
                                            {gift.image_url ? (
                                                <img src={gift.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : <Gift className="w-full h-full p-2 text-slate-300" />}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800">
                                        {gift.name}
                                        {gift.category && (
                                            <span className="block text-xs text-slate-400 font-normal mt-0.5">{gift.category}</span>
                                        )}
                                    </td>
                                    <td className="p-4 hidden md:table-cell">R$ {parseFloat(gift.price).toFixed(2)}</td>
                                    <td className="p-4">
                                        {gift.reserved_by ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
                                                <Lock size={12} />
                                                {gift.reserved_by}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">Disponível</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(gift)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title="Editar">
                                            <Edit2 size={18} />
                                        </button>
                                        {gift.reserved_by ? (
                                            <button
                                                onClick={() => clearReservation(gift)}
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                title="Remover Reserva"
                                            >
                                                <UserX size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => deleteGift(gift)}
                                                className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir Item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">
                            {modalMode === 'create' ? 'Novo Item' : 'Editar Item'}
                        </h3>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 border rounded-lg"
                                    value={currentGift.name}
                                    onChange={e => setCurrentGift({ ...currentGift, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full px-4 py-2 border rounded-lg"
                                        value={currentGift.price}
                                        onChange={e => setCurrentGift({ ...currentGift, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg bg-white"
                                        value={currentGift.category || ''}
                                        onChange={e => setCurrentGift({ ...currentGift, category: e.target.value })}
                                    >
                                        <option value="">Geral (Sem Categoria)</option>
                                        <option value="Cozinha">Cozinha</option>
                                        <option value="Banheiro">Banheiro</option>
                                        <option value="Quarto">Quarto</option>
                                        <option value="Sala">Sala</option>
                                        <option value="Lavanderia">Lavanderia</option>
                                        <option value="Decoração">Decoração</option>
                                        <option value="Eletros">Eletros</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Link da Imagem</label>
                                <input
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="https://..."
                                    value={currentGift.image_url || ''}
                                    onChange={e => setCurrentGift({ ...currentGift, image_url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Link do Produto (Loja)</label>
                                <input
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="https://..."
                                    value={currentGift.product_link || ''}
                                    onChange={e => setCurrentGift({ ...currentGift, product_link: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    value={currentGift.description || ''}
                                    onChange={e => setCurrentGift({ ...currentGift, description: e.target.value })}
                                />
                            </div>

                            {/* Warning Fields */}
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <h4 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
                                    ⚠️ Alerta Técnico (Opcional)
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-yellow-700 mb-1">Título do Aviso (ex: Voltagem)</label>
                                        <input
                                            className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm"
                                            placeholder="Ex: Atenção à Voltagem 110v"
                                            value={currentGift.warning_title || ''}
                                            onChange={e => setCurrentGift({ ...currentGift, warning_title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-yellow-700 mb-1">Mensagem Detalhada</label>
                                        <input
                                            className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm"
                                            placeholder="Ex: Este item DEVE ser 110v"
                                            value={currentGift.warning_message || ''}
                                            onChange={e => setCurrentGift({ ...currentGift, warning_message: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
