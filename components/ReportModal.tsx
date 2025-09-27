import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../services/api';
import { DailyReport, RoleLogin } from '../types';
import { Users, ShoppingCart, DollarSign, Package, AlertTriangle, MessageSquare, LogIn } from 'lucide-react';
import { formatIntegerAmount } from '../utils/formatIntegerAmount';

const ReportStat: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-gray-100 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:items-center items-start gap-3">
        <div className="p-2 sm:p-3 bg-brand-primary/20 text-brand-primary rounded-full">
            {icon}
        </div>
        <div className="space-y-1">
            <p className="text-xs sm:text-sm text-gray-500 font-semibold">{label}</p>
            <p className="font-bold text-gray-800 text-[clamp(1.1rem,2.5vw,1.5rem)]">{value}</p>
        </div>
    </div>
);

const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [report, setReport] = useState<DailyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [reportError, setReportError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchReport = async () => {
                setLoading(true);
                setReportError(null);
                try {
                    const data = await api.generateDailyReport();
                    setReport(data);
                } catch (error) {
                    console.error('Échec de la génération du rapport quotidien', error);
                    setReport(null);
                    setReportError("Impossible de générer le rapport quotidien. Veuillez réessayer plus tard.");
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
        parts.push(`- Ventes: *${formatIntegerAmount(reportData.ventesDuJour)} €*`);
        parts.push(`- Clients: *${reportData.clientsDuJour}*`);
        parts.push(`- Panier Moyen: *${formatIntegerAmount(reportData.panierMoyen)} €*`);
        parts.push('---');
    
        parts.push(`*Produits Vendus*`);
        if (reportData.soldProducts.length === 0) {
          parts.push('Aucun produit vendu.');
        } else {
          reportData.soldProducts.forEach(category => {
            parts.push(`\n_${category.categoryName}_`);
            category.products.forEach(product => {
              parts.push(`  - ${product.quantity}x ${product.name} (${formatIntegerAmount(product.totalSales)} €)`);
            });
          });
        }
        parts.push('---');

        parts.push(`*Connexions depuis 05h00*`);
        if (reportData.roleLoginsUnavailable) {
          parts.push('Connexions indisponibles sur cet appareil.');
        } else {
          const groupedLogins = formatLoginsByRole(reportData.roleLogins);
          if (groupedLogins.size === 0) {
            parts.push('Aucune connexion enregistrée.');
          } else {
            groupedLogins.forEach((times, roleName) => {
              parts.push(`- ${roleName}: ${times.join(', ')}`);
            });
          }
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
                     {!loading && reportError && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {reportError}
                        </div>
                     )}
                     {!loading && !report && !reportError && (
                        <p className="text-red-500">Impossible de générer le rapport.</p>
                     )}
                     {!loading && report && (
                         <div className="space-y-6">
                            {report.roleLoginsUnavailable && (
                                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    <span>
                                        Les connexions des rôles sont indisponibles sur cet appareil (stockage local inaccessible).
                                    </span>
                                </div>
                            )}
                            <div className="text-center border-b pb-4">
                                 <h2 className="font-bold text-brand-secondary text-[clamp(1.75rem,4vw,2.75rem)]">Rapport OUIOUITACOS</h2>
                                 <p className="text-gray-500">
                                     Généré le {new Date(report.generatedAt).toLocaleString('fr-FR')}
                                 </p>
                                 <p className="text-sm text-gray-500">
                                     Données depuis le {new Date(report.startDate).toLocaleString('fr-FR')}
                                 </p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <ReportStat icon={<DollarSign/>} label="Ventes du Jour" value={`${formatIntegerAmount(report.ventesDuJour)} €`} />
                                <ReportStat icon={<Users/>} label="Clients du Jour" value={report.clientsDuJour} />
                                <ReportStat icon={<ShoppingCart/>} label="Panier Moyen" value={`${formatIntegerAmount(report.panierMoyen)} €`} />
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
                                                        {product.quantity}x {product.name} - <span className="font-semibold">{formatIntegerAmount(product.totalSales)} €</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-800"><LogIn/> Connexions depuis 05h00</h3>
                                {report.roleLoginsUnavailable ? (
                                    <p className="text-gray-500">Connexions indisponibles : impossible d'accéder au stockage local.</p>
                                ) : (
                                    (() => {
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
                                    })()
                                )}
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
