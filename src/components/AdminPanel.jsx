import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Settings, Lock, Unlock, UserX, Edit2, Save, X, Plus, Trash2, Image, Link as LinkIcon, Gift, Search, LayoutDashboard, CheckCircle2, AlertCircle, Truck, PartyPopper, Wallet } from 'lucide-react';

export default function AdminPanel({ onClose }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [gifts, setGifts] = useState([]);
    const [pixDonations, setPixDonations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'available', 'reserved'

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create | edit
    const [currentGift, setCurrentGift] = useState({
        name: '', description: '', price: '', image_url: '', product_link: '',
        warning_title: '', warning_message: '', category: '', max_quantity: 1
    });

    // Management Modal State
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedGiftForManagement, setSelectedGiftForManagement] = useState(null);

    const fetchGifts = async () => {
        setLoading(true);
        const { data: giftsData, error: giftsError } = await supabase
            .from('gifts')
            .select('*')
            .order('id', { ascending: true });

        if (giftsData) setGifts(giftsData);

        // Fetch Pix Donations
        const { data: pixData, error: pixError } = await supabase
            .rpc('admin_get_pix_donations', { p_secret_key: password });

        if (pixData) setPixDonations(pixData);

        setLoading(false);
    };

    const handleUpdatePixStatus = async (donation) => {
        const newStatus = donation.status === 'received' ? 'pending' : 'received';
        const confirmMsg = newStatus === 'received'
            ? `Confirmar recebimento de R$ ${donation.amount} de ${donation.donor_name}?`
            : `Marcar como pendente a doação de ${donation.donor_name}?`;

        if (!confirm(confirmMsg)) return;

        const { error } = await supabase.rpc('admin_update_pix_status', {
            p_id: donation.id,
            p_status: newStatus,
            p_secret_key: password
        });

        if (error) {
            alert('Erro: ' + error.message);
        } else {
            fetchGifts(); // Refresh lists
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'davilarimo') {
            setIsAuthenticated(true);
            fetchGifts();
        } else {
            alert('Senha incorreta');
        }
    };

    // Derived State for Dashboard & Search
    const filteredGifts = gifts.filter(gift => {
        const lowerTerm = searchTerm.toLowerCase();
        const matchesSearch = (
            gift.name.toLowerCase().includes(lowerTerm) ||
            (gift.category && gift.category.toLowerCase().includes(lowerTerm))
        );

        const isReserved = !!gift.reserved_by || (gift.max_quantity > 1 && (gift.current_quantity || 0) >= gift.max_quantity);
        const hasPartial = gift.max_quantity > 1 && (gift.current_quantity || 0) > 0;

        let matchesStatus = true;
        if (statusFilter === 'available') {
            // Strictly available (no reservations or partials that are not full? - User said "Available" means Green)
            // Let's say Available means NOT fully reserved. Or strictly 0 reservations?
            // "Disponíveis" implies you can still buy it. So < max_quantity.
            matchesStatus = !isReserved;
        } else if (statusFilter === 'reserved') {
            // Includes partials and sold out
            matchesStatus = hasPartial || isReserved || !!gift.reserved_by;
        }

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: gifts.length,
        available: gifts.filter(g => !g.reserved_by && (!g.max_quantity || g.max_quantity === 1)).length +
            gifts.filter(g => g.max_quantity > 1 && (g.current_quantity || 0) < g.max_quantity).length, // Simplified logic for mixed types
        reserved: gifts.filter(g => !!g.reserved_by || (g.max_quantity > 1 && (g.current_quantity || 0) >= g.max_quantity)).length // Count fully reserved items roughly
    };

    // Correction for Dashboard Stats logic to be more precise based on "units" or "items"
    // Let's keep it simple: Count ITEMS that are fully available vs fully reserved for now, 
    // or just count how many items have at least 1 reservation.
    // User requested "Total", "Disponíveis", "Reservados".
    const totalItems = gifts.length;
    const reservedItems = gifts.filter(g => {
        if (g.max_quantity > 1) return (g.current_quantity || 0) >= g.max_quantity;
        return !!g.reserved_by;
    }).length;
    const availableItems = totalItems - reservedItems;


    const getLogisticsSummary = (gift) => {
        if (!gift.reservations || !Array.isArray(gift.reservations) || gift.reservations.length === 0) return null;

        const shipCount = gift.reservations.filter(r => r.method === 'ship').length;
        const handCount = gift.reservations.filter(r => r.method === 'hand').length;

        if (shipCount === 0 && handCount === 0) return null;

        return (
            <div className="flex gap-2 mt-1">
                {shipCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100" title={`${shipCount} para entregar`}>
                        <Truck size={10} /> {shipCount}
                    </span>
                )}
                {handCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200" title={`${handCount} em mãos`}>
                        <PartyPopper size={10} /> {handCount}
                    </span>
                )}
            </div>
        );
    };

    const openCreateModal = () => {
        setModalMode('create');
        setCurrentGift({
            name: '', description: '', price: '', image_url: '', product_link: '',
            warning_title: '', warning_message: '', category: '', max_quantity: 1
        });
        setIsModalOpen(true);
    };

    const openManageModal = (gift) => {
        setSelectedGiftForManagement(gift);
        setIsManageModalOpen(true);
    };

    const handleRemoveSpecificReservation = async (nameToRemove) => {
        if (!confirm(`Remover a reserva de "${nameToRemove}"?`)) return;

        const gift = selectedGiftForManagement;
        const currentNames = gift.reserved_by ? gift.reserved_by.split(',').map(n => n.trim()) : [];

        // Filter out ONE instance of the name (in case duplicates exist, though unlikely)
        const nameIndex = currentNames.indexOf(nameToRemove);
        if (nameIndex > -1) {
            currentNames.splice(nameIndex, 1);
        }

        const newReservedBy = currentNames.length > 0 ? currentNames.join(', ') : null;
        // Decrement quantity, ensure not below 0
        const newQuantity = Math.max(0, (gift.current_quantity || 0) - 1);

        // Update JSONB array - filter out the one being removed
        let currentReservations = gift.reservations || [];
        // If it's not an array for some reason (legacy), treat as empty
        if (!Array.isArray(currentReservations)) currentReservations = [];

        // Remove the FIRST matching occurrence of this name
        const resIndex = currentReservations.findIndex(r => r.name === nameToRemove);
        if (resIndex > -1) {
            currentReservations.splice(resIndex, 1);
        }

        const { error } = await supabase.rpc('admin_update_gift_status', {
            p_id: gift.id,
            p_reserved_by: newReservedBy,
            p_current_quantity: newQuantity,
            p_reservations: currentReservations,
            p_secret_key: password
        });

        if (error) {
            alert('Erro ao atualizar: ' + error.message);
        } else {
            fetchGifts();
            setSelectedGiftForManagement({
                ...gift,
                reserved_by: newReservedBy,
                current_quantity: newQuantity,
                reservations: currentReservations
            });
            if (newQuantity === 0 && !newReservedBy) setIsManageModalOpen(false);
        }
    };
    const openEditModal = (gift) => {
        setModalMode('edit');
        setCurrentGift({
            ...gift,
            warning_title: gift.warning_title || '',
            warning_message: gift.warning_message || '',
            category: gift.category || '',
            max_quantity: gift.max_quantity || 1
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
            p_max_quantity: parseInt(currentGift.max_quantity) || 1,
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

                {/* Header & Dashboard */}
                <div className="space-y-6 mb-8">

                    {/* Top Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="text-slate-500" />
                            Vou Presentear - Admin
                        </h1>
                        <button
                            onClick={onClose}
                            className="bg-white border border-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 text-slate-600 shadow-sm self-start md:self-auto"
                        >
                            Sair
                        </button>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-3 gap-3 md:gap-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                            <p className="text-xs md:text-sm text-slate-500 font-medium mb-1">Total de Itens</p>
                            <p className="text-2xl md:text-3xl font-bold text-slate-800">{totalItems}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 shadow-sm text-center">
                            <p className="text-xs md:text-sm text-emerald-600 font-medium mb-1">Disponíveis</p>
                            <p className="text-2xl md:text-3xl font-bold text-emerald-700">{availableItems}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-rose-100 bg-rose-50/50 shadow-sm text-center">
                            <p className="text-xs md:text-sm text-rose-600 font-medium mb-1">Esgotados/Reserv.</p>
                            <p className="text-2xl md:text-3xl font-bold text-rose-700">{reservedItems}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-orange-100 bg-orange-50/50 shadow-sm text-center col-span-3 md:col-span-1">
                            <p className="text-xs md:text-sm text-orange-600 font-medium mb-1 flex items-center justify-center gap-1">
                                <Wallet size={14} /> Total em Pix
                            </p>
                            <p className="text-2xl md:text-3xl font-bold text-orange-700">
                                R$ {pixDonations.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                    </div>

                    {/* Status Filters */}
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'available', label: 'Disponíveis', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                            { id: 'reserved', label: 'Reservados', color: 'bg-rose-100 text-rose-700 border-rose-200' }
                        ].map(step => (
                            <button
                                key={step.id}
                                onClick={() => setStatusFilter(step.id)}
                                className={`
                                    px-4 py-1.5 rounded-full text-sm font-bold transition-all border
                                    ${statusFilter === step.id
                                        ? (step.color || 'bg-slate-800 text-white border-slate-800')
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}
                                `}
                            >
                                {step.label}
                            </button>
                        ))}
                    </div>

                    {/* Actions & Search */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 sm:text-sm shadow-sm"
                                placeholder="Buscar por nome ou categoria..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="bg-rose-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-rose-600 flex items-center justify-center gap-2 shadow-md shadow-rose-200 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={20} /> Novo Item
                        </button>
                    </div>
                </div>

                {/* --- CONTENT LIST --- */}

                {/* Mobile View: Cards (Hidden on Desktop) */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {filteredGifts.map(gift => (
                        <div key={gift.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <div className="flex gap-4 mb-4">
                                <div className="w-16 h-16 rounded-lg bg-slate-50 shrink-0 overflow-hidden border border-slate-100">
                                    {gift.image_url ? (
                                        <img src={gift.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : <Gift className="w-full h-full p-4 text-slate-300" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 leading-tight">{gift.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {gift.category && (
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                                                {gift.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4 text-sm text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                <div className="flex justify-between">
                                    <span>Preço:</span>
                                    <span className="font-semibold text-slate-800">R$ {parseFloat(gift.price).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Status:</span>
                                    {(gift.reserved_by || (gift.max_quantity > 1 && (gift.current_quantity || 0) >= gift.max_quantity)) ? (
                                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs">
                                            <Lock size={12} /> Reservado
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 font-medium text-xs">Disponível</span>
                                    )}
                                </div>
                                {getLogisticsSummary(gift) && (
                                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-end">
                                        {getLogisticsSummary(gift)}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => openEditModal(gift)}
                                    className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    <Edit2 size={16} /> Editar
                                </button>
                                {((gift.reserved_by) || (gift.current_quantity > 0)) ? (
                                    <button
                                        onClick={() => openManageModal(gift)}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 border border-rose-100 transition-colors"
                                    >
                                        <Settings size={16} /> Gerenciar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => deleteGift(gift)}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-400 font-medium rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                                    >
                                        <Trash2 size={16} /> Excluir
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View: Modern Table (Hidden on Mobile) */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-5 w-20">Img</th>
                                <th className="p-5">Item</th>
                                <th className="p-5">Categoria</th>
                                <th className="p-5 w-32">Preço</th>
                                <th className="p-5 w-40">Status</th>
                                <th className="p-5 text-right w-32">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredGifts.map(gift => (
                                <tr key={gift.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-4 pl-5">
                                        <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 relative group-hover:shadow-sm transition-all">
                                            {gift.image_url ? (
                                                <img src={gift.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : <Gift className="w-full h-full p-3 text-slate-300" />}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-slate-700 text-base">{gift.name}</td>
                                    <td className="p-4">
                                        {gift.category ? (
                                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                                {gift.category}
                                            </span>
                                        ) : <span className="text-slate-300">-</span>}
                                    </td>
                                    <td className="p-4 font-medium text-slate-600">R$ {parseFloat(gift.price).toFixed(2)}</td>
                                    <td className="p-4">
                                        {(gift.reserved_by || (gift.max_quantity > 1 && (gift.current_quantity || 0) >= gift.max_quantity)) ? (
                                            <div className="flex flex-col">
                                                <span className="inline-flex w-fit items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100">
                                                    <Lock size={12} /> Reservado
                                                </span>
                                                <span className="text-[10px] text-slate-400 mt-1 pl-1 truncate max-w-[120px]" title={gift.reserved_by}>
                                                    {gift.reserved_by}
                                                </span>
                                                {getLogisticsSummary(gift)}
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-medium">
                                                    Disponível
                                                </span>
                                                {gift.max_quantity > 1 && (
                                                    <span className="text-[10px] text-orange-500 block mt-1 pl-1 font-medium">
                                                        {gift.current_quantity || 0}/{gift.max_quantity} res.
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right pr-5">
                                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(gift)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                <Edit2 size={18} />
                                            </button>
                                            {((gift.reserved_by) || (gift.current_quantity > 0)) ? (
                                                <button
                                                    onClick={() => openManageModal(gift)}
                                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Gerenciar Reservas"
                                                >
                                                    <Settings size={18} />
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
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PIX DONATIONS SECTION */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 pb-24">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Wallet className="text-orange-500" />
                    Extrato de Pix (Intenções)
                </h2>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-orange-50 text-orange-900 font-semibold border-b border-orange-100">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Mensagem</th>
                                <th className="p-4 text-right">Valor</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pixDonations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                                        Nenhuma doação registrada ainda.
                                    </td>
                                </tr>
                            ) : (
                                pixDonations.map(pix => (
                                    <tr key={pix.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-500">
                                            {new Date(pix.created_at).toLocaleDateString('pt-BR')} <br />
                                            <span className="text-xs">{new Date(pix.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="p-4 font-bold text-slate-700">{pix.donor_name}</td>
                                        <td className="p-4 italic text-slate-500">"{pix.message || '-'}"</td>
                                        <td className="p-4 text-right font-bold text-emerald-600">
                                            R$ {parseFloat(pix.amount).toFixed(2).replace('.', ',')}
                                        </td>
                                        <td className="p-4 text-center">
                                            {pix.status === 'received' ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1 w-fit mx-auto">
                                                    <CheckCircle2 size={12} /> Recebido
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center justify-center gap-1 w-fit mx-auto">
                                                    <AlertCircle size={12} /> Pendente
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleUpdatePixStatus(pix)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors
                                                    ${pix.status === 'received'
                                                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}
                                                `}
                                            >
                                                {pix.status === 'received' ? 'Desmarcar' : 'Confirmar Pix'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            {modalMode === 'create' ? <Plus className="text-rose-500" /> : <Edit2 className="text-indigo-500" />}
                            {modalMode === 'create' ? 'Novo Item' : 'Editar Item'}
                        </h3>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                    value={currentGift.name}
                                    onChange={e => setCurrentGift({ ...currentGift, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                        value={currentGift.price}
                                        onChange={e => setCurrentGift({ ...currentGift, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. Máxima</label>
                                    <input
                                        type="number" step="1" min="1"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                        placeholder="1"
                                        value={currentGift.max_quantity || ''}
                                        onChange={e => setCurrentGift({ ...currentGift, max_quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
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
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                    placeholder="https://..."
                                    value={currentGift.image_url || ''}
                                    onChange={e => setCurrentGift({ ...currentGift, image_url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Link do Produto (Loja)</label>
                                <input
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                    placeholder="https://..."
                                    value={currentGift.product_link || ''}
                                    onChange={e => setCurrentGift({ ...currentGift, product_link: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                    value={currentGift.description || ''}
                                    onChange={e => setCurrentGift({ ...currentGift, description: e.target.value })}
                                />
                            </div>

                            {/* Warning Fields */}
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                <h4 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    Alerta Técnico (Opcional)
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-yellow-700 mb-1">Título do Aviso (ex: Voltagem)</label>
                                        <input
                                            className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-200 outline-none"
                                            placeholder="Ex: Atenção à Voltagem 110v"
                                            value={currentGift.warning_title || ''}
                                            onChange={e => setCurrentGift({ ...currentGift, warning_title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-yellow-700 mb-1">Mensagem Detalhada</label>
                                        <input
                                            className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-200 outline-none"
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
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold shadow-lg shadow-slate-200 transition-colors"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Manage/Cancel Reservation Modal */}
            {isManageModalOpen && selectedGiftForManagement && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsManageModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Gerenciar Reservas</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Item: <span className="font-semibold text-slate-700">{selectedGiftForManagement.name}</span>
                        </p>

                        <div className="space-y-3 mb-6">
                            {selectedGiftForManagement.reserved_by ? (
                                selectedGiftForManagement.reserved_by.split(',').map((name, idx) => {
                                    // Find reservation details for this name
                                    // We loosely match by name. In a real app with IDs it would be better, but this works for now.
                                    // reservations is an array of objects { name, method, date }
                                    const cleanName = name.trim();
                                    const resDetails = selectedGiftForManagement.reservations?.find(
                                        r => r.name === cleanName
                                    );
                                    const method = resDetails?.method || 'hand'; // default to hand if not found

                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                                    {cleanName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-700 block leading-tight">{cleanName}</span>
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        {method === 'ship' ? (
                                                            <>
                                                                <Truck size={10} /> Enviar p/ casa
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PartyPopper size={10} /> Levar no evento
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveSpecificReservation(cleanName)}
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Cancelar esta reserva"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-400 py-4 italic">Nenhuma reserva ativa.</p>
                            )}
                        </div>

                        <button
                            onClick={() => setIsManageModalOpen(false)}
                            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
// ... inside AdminPanel (Note: I need to do this carefully not to overwrite the whole file or break it)
// IMPORTANT: I will do this in multiple small edits or one smart edit.
// Since the file is large, I'll use multi_replace.

// I need to:
// 1. Add [pixDonations, setPixDonations] state
// 2. Fetch pix donations in fetchGifts or fetchAll
// 3. Add 'Wallet' icon import
// 4. Render the Pix section below the main table

// Let's start with import and state.
// I already added 'Wallet' in PixCard, but not AdminPanel.
// AdminPanel needs Wallet icon.
