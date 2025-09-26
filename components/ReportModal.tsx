import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../services/api';
import { DailyReport, RoleLogin } from '../types';
import { Users, ShoppingCart, DollarSign, Package, AlertTriangle, MessageSquare, LogIn } from 'lucide-react';

const ReportStat: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-gray-100 p-4 rounded-lg flex items-center">
        <div className="p-3 bg-brand-primary/20 text-brand-primary rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-semibold">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [report, setReport] = useState<DailyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginsError, setLoginsError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchReport = async () => {
                setLoading(true);
                setLoginsError(null);
                try {
                    const data = await api.generateDailyReport();
                    setReport(data);
                } catch (error) {
                    console.error('Échec de la récupération des connexions pour le rapport quotidien', error);
                    setReport(null);
                    setLoginsError(
                        "Impossible de récupérer les connexions depuis le proxy sécurisé. Veuillez réessayer plus tard.",
                    );
                } finally {
                    setLoading(false);
                }
            };
            fetchReport();
        }
    }, [isOpen]);

    const formatLoginsByRole = (logins: RoleLogin[]) => {
        const grouped = new Map<string, string[]>();
        logins.forEach(login => {
            const time = new Date(login.loginAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const existing = grouped.get(login.roleName) ?? [];
            existing.push(time);
            grouped.set(login.roleName, existing);
        });
        return grouped;
    };

    const formatReportForWhatsApp = (reportData: DailyReport): string => {
        const parts: string[] = [];
        parts.push(`*RAPPORT OUIOUITACOS*`);
        parts.push(`Généré le: ${new Date(reportData.generatedAt).toLocaleString('fr-FR')}`);
        parts.push(`Période: depuis le ${new Date(reportData.startDate).toLocaleString('fr-FR')}`);
        parts.push('---');
    
        parts.push(`*Statistiques du Jour*`);
        parts.push(`- Ventes: *${reportData.ventesDuJour.toFixed(2)} €*`);
        parts.push(`- Clients: *${reportData.clientsDuJour}*`);
        parts.push(`- Panier Moyen: *${reportData.panierMoyen.toFixed(2)} €*`);
        parts.push('---');
    
        parts.push(`*Produits Vendus*`);
        if (reportData.soldProducts.length === 0) {
          parts.push('Aucun produit vendu.');
        } else {
          reportData.soldProducts.forEach(category => {
            parts.push(`\n_${category.categoryName}_`);
            category.products.forEach(product => {
              parts.push(`  - ${product.quantity}x ${product.name} (${product.totalSales.toFixed(2)} €)`);
            });
          });
        }
        parts.push('---');

        parts.push(`*Connexions depuis 05h00*`);
        const groupedLogins = formatLoginsByRole(reportData.roleLogins);
        if (groupedLogins.size === 0) {
          parts.push('Aucune connexion enregistrée.');
        } else {
          groupedLogins.forEach((times, roleName) => {
            parts.push(`- ${roleName}: ${times.join(', ')}`);
          });
        }
        parts.push('---');

        parts.push(`*Stocks Bas*`);
        if (reportData.lowStockIngredients.length === 0) {
          parts.push('Aucun ingrédient en stock bas.');
        } else {
          reportData.lowStockIngredients.forEach(ing => {
            parts.push(`- ${ing.nom} (${ing.stock_actuel} / ${ing.stock_minimum} ${ing.unite})`);
          });
        }
    
        return encodeURIComponent(parts.join('\n'));
      };

    const handleSendToWhatsApp = () => {
        if (!report) return;
        const message = formatReportForWhatsApp(report);
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Rapport Quotidien" size="xl">
            <>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                     {loading && <p>Génération du rapport...</p>}
                     {!loading && loginsError && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {loginsError}
                        </div>
                     )}
                     {!loading && !report && !loginsError && (
                        <p className="text-red-500">Impossible de générer le rapport.</p>
                     )}
                     {!loading && report && (
                         <div className="space-y-6">
                            <div className="text-center border-b pb-4">
                                 <h2 className="text-3xl font-bold text-brand-secondary">Rapport OUIOUITACOS</h2>
                                 <p className="text-gray-500">
                                     Généré le {new Date(report.generatedAt).toLocaleString('fr-FR')}
                                 </p>
                                 <p className="text-sm text-gray-500">
                                     Données depuis le {new Date(report.startDate).toLocaleString('fr-FR')}
                                 </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ReportStat icon={<DollarSign/>} label="Ventes du Jour" value={`${report.ventesDuJour.toFixed(2)} €`} />
                                <ReportStat icon={<Users/>} label="Clients du Jour" value={report.clientsDuJour} />
                                <ReportStat icon={<ShoppingCart/>} label="Panier Moyen" value={`${report.panierMoyen.toFixed(2)} €`} />
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-800"><Package/> Produits Vendus</h3>
                                <div className="space-y-4">
                                    {report.soldProducts.map(category => (
                                        <div key={category.categoryName}>
                                            <h4 className="font-bold text-brand-primary">{category.categoryName}</h4>
                                            <ul className="list-disc list-inside pl-2 text-gray-700">
                                                {category.products.map(product => (
                                                    <li key={product.id}>
                                                        {product.quantity}x {product.name} - <span className="font-semibold">{product.totalSales.toFixed(2)} €</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-800"><LogIn/> Connexions depuis 05h00</h3>
                                {(() => {
                                    const grouped = formatLoginsByRole(report.roleLogins);
                                    if (grouped.size === 0) {
                                        return <p className="text-gray-500">Aucune connexion enregistrée depuis 05h00.</p>;
                                    }
                                    return (
                                        <ul className="space-y-2">
                                            {Array.from(grouped.entries()).map(([roleName, times]) => (
                                                <li key={roleName} className="flex justify-between items-center bg-slate-100 p-2 rounded-md">
                                                    <span className="font-semibold text-gray-800">{roleName}</span>
                                                    <span className="text-sm text-gray-600">{times.join(', ')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                })()}
                            </div>

                            <div>
                                 <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-800"><AlertTriangle className="text-orange-500"/> Ingrédients en Stock Bas</h3>
                                 {report.lowStockIngredients.length > 0 ? (
                                    <ul className="space-y-1">
                                        {report.lowStockIngredients.map(ing => (
                                            <li key={ing.id} className="flex justify-between items-center bg-orange-50 p-2 rounded-md text-orange-800">
                                                <span>{ing.nom}</span>
                                                <span className="font-bold">{ing.stock_actuel} / {ing.stock_minimum} {ing.unite}</span>
                                            </li>
                                        ))}
                                    </ul>
                                 ) : (
                                    <p className="text-gray-500">Aucun ingrédient en stock bas.</p>
                                 )}
                            </div>
                         </div>
                     )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 border-t">
                    <button onClick={onClose} className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition">
                        Fermer
                    </button>
                    <button 
                        onClick={handleSendToWhatsApp} 
                        disabled={loading || !report} 
                        className="w-full sm:w-auto bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                        <MessageSquare size={20}/> Envoyer sur WhatsApp
                    </button>
                </div>
            </>
        </Modal>
    );
};

export default ReportModal;
