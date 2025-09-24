import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Armchair, DollarSign, Utensils, HandPlatter } from 'lucide-react';
import { api } from '../services/api';
import { Table } from '../types';
import OrderTimer from '../components/OrderTimer';

const getTableStatus = (table: Table) => {
    if (table.statut === 'libre') {
        return { text: 'Libre', Icon: <Armchair size={60} className="text-green-600" />, styles: 'bg-green-100 border-green-500 text-green-800' };
    }
    if (table.statut === 'a_payer') {
        if (table.estado_cocina === 'servido') {
            return { text: 'Para Pagar', Icon: <DollarSign size={60} className="text-red-600" />, styles: 'bg-red-100 border-red-500 text-red-800' };
        }
        return { text: 'Para Entregar', Icon: <HandPlatter size={60} className="text-blue-600" />, styles: 'bg-blue-100 border-blue-500 text-blue-800' };
    }
    if (table.statut === 'occupee') {
        if (table.estado_cocina === 'recibido') {
           return { text: 'En Cuisine', Icon: <Utensils size={60} className="text-yellow-600" />, styles: 'bg-yellow-100 border-yellow-500 text-yellow-800' };
        }
        return { text: 'Occupée', Icon: <Utensils size={60} className="text-yellow-600" />, styles: 'bg-yellow-100 border-yellow-500 text-yellow-800' };
    }
    return { text: 'Inconnu', Icon: <Armchair size={60} className="text-gray-600" />, styles: 'bg-gray-100 border-gray-400' };
};


const TableCard: React.FC<{ table: Table; onServe: (orderId: string) => void }> = ({ table, onServe }) => {
    const navigate = useNavigate();
    const { text, Icon, styles } = getTableStatus(table);

    const handleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.entregada-button')) {
            return;
        }
        navigate(`/commande/${table.id}`);
    };

    const handleServeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (table.commandeId) {
            onServe(table.commandeId);
        }
    };

    return (
        <div 
            onClick={handleClick}
            className={`rounded-lg border-2 p-4 flex flex-col items-center justify-between cursor-pointer transition-transform transform hover:scale-105 ${styles}`}
        >
            <div className="flex justify-between w-full items-start">
                 <h3 className="text-2xl font-bold">{table.nom}</h3>
                 {table.date_envoi_cuisine && table.statut !== 'libre' && (
                    <OrderTimer startTime={table.date_envoi_cuisine} />
                 )}
            </div>

            <div className="flex-grow flex flex-col items-center justify-center my-4 text-center">
                {Icon}
                <p className="font-bold text-lg mt-2">{text}</p>
            </div>
            
            <div className="w-full text-center">
                {table.statut !== 'libre' ? (
                    <p className="text-sm font-semibold">Couverts: {table.couverts}</p>
                ) : (
                    <p className="text-sm">Capacité: {table.capacite}</p>
                )}
                
                {table.estado_cocina === 'listo' && (
                    <button
                        onClick={handleServeClick}
                        className="entregada-button uppercase w-full mt-3 bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition"
                    >
                        ENTREGADA
                    </button>
                )}
            </div>
        </div>
    );
};

const Ventes: React.FC = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTables = useCallback(async () => {
        try {
            const data = await api.getTables();
            setTables(data);
        } catch (error) {
            console.error("Failed to fetch tables", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        setLoading(true);
        fetchTables();
        const interval = setInterval(fetchTables, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, [fetchTables]);

    const handleServeOrder = async (orderId: string) => {
        try {
            await api.markOrderAsServed(orderId);
            fetchTables(); // Refresh table view immediately
        } catch (error) {
            console.error("Failed to mark order as served:", error);
        }
    };

    if (loading) return <div className="text-gray-800">Chargement du plan de salle...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Plan de Salle</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {tables.map(table => (
                    <TableCard key={table.id} table={table} onServe={handleServeOrder} />
                ))}
            </div>
        </div>
    );
};

export default Ventes;