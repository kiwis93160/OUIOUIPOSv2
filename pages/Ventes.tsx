import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Armchair, DollarSign, Utensils, HandPlatter } from 'lucide-react';
import { api } from '../services/api';
import { Table } from '../types';
import OrderTimer from '../components/OrderTimer';

const getTableStatus = (table: Table) => {
  const hasActiveOrder = Boolean(table.commandeId);

  if (table.statut === 'libre' || (!hasActiveOrder && table.statut !== 'a_payer')) {
    return { text: 'Libre', statusClass: 'status--free', Icon: Armchair };
  }

  if (table.estado_cocina === 'servido' || table.estado_cocina === 'entregada' || table.statut === 'a_payer') {
    return { text: 'Para pagar', statusClass: 'status--payment', Icon: DollarSign };
  }

  if (table.estado_cocina === 'listo') {
    return { text: 'À servir', statusClass: 'status--ready', Icon: HandPlatter };
  }

  if (table.estado_cocina === 'recibido' || table.estado_cocina === 'no_enviado' || table.statut === 'occupee') {
    return { text: 'En cuisine', statusClass: 'status--preparing', Icon: Utensils };
  }

  return { text: 'Inconnu', statusClass: 'status--unknown', Icon: Armchair };
};


const TableCard: React.FC<{ table: Table; onServe: (orderId: string) => void }> = ({ table, onServe }) => {
  const navigate = useNavigate();
  const { text, statusClass, Icon } = getTableStatus(table);

  const handleCardClick = () => {
    navigate(`/commande/${table.id}`);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  const handleServeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (table.commandeId) {
      onServe(table.commandeId);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`ui-card status-card ${statusClass}`}
      role="button"
      tabIndex={0}
    >
      <div className="status-card__header">
        <h3 className="status-card__title">{table.nom}</h3>
        {table.date_envoi_cuisine && table.statut !== 'libre' && (
          <div className="status-card__timer">
            <OrderTimer startTime={table.date_envoi_cuisine} className="w-full justify-center" />
          </div>
        )}
      </div>

      <div className="status-card__body">
        <Icon size={56} className="status-card__icon" />
        <p className="status-card__state">{text}</p>
      </div>

      <div className="status-card__footer">
        {table.statut !== 'libre' ? (
          <p className="status-card__meta">Couverts : {table.couverts}</p>
        ) : (
          <p className="status-card__meta">Capacité : {table.capacite}</p>
        )}

        {table.estado_cocina === 'listo' && (
          <button type="button" onClick={handleServeClick} className="ui-btn ui-btn-accent status-card__cta">
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
        const unsubscribe = api.notifications.subscribe('orders_updated', fetchTables);
        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, [fetchTables]);

    const handleServeOrder = async (orderId: string) => {
        try {
            await api.markOrderAsServed(orderId);
            fetchTables(); // Refresh table view immediately
        } catch (error) {
            console.error("Failed to mark order as served:", error);
        }
    };

    if (loading) return <p className="section-text section-text--muted">Chargement du plan de salle...</p>;

    return (
        <div>
            <h1 className="section-title">Plan de salle</h1>
            <div className="status-grid">
                {tables.map(table => (
                    <TableCard key={table.id} table={table} onServe={handleServeOrder} />
                ))}
            </div>
        </div>
    );
};

export default Ventes;