import React from 'react';
import { 
  LayoutDashboard, 
  FilePlus, 
  FileCheck2, 
  CheckCircle, 
  BarChart3, 
  FileSpreadsheet,
  AlertCircle,
  Users,
  Building2,
  UserRoundPlus,
  Archive
  ,Settings
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, role, counts }) {
  const getNavItems = () => {
    switch (role) {
      case 'SERVICE_INFO':
        return [
          { id: 'dashboard', label: 'Contrôle Physico-Numérique', icon: FileCheck2, badge: counts.en_verification },
          { id: 'nouveau', label: 'Saisir pour un Conseiller', icon: FilePlus, highlight: true },
          { id: 'gestion_conseillers', label: 'Gestion des Conseillers', icon: UserRoundPlus },
          { id: 'attestations_entreprises', label: 'Attestations Entreprises', icon: Building2, badge: counts.valides, badgeColor: 'bg-emerald-600' },
          { id: 'valides', label: 'Dossiers Validés', icon: CheckCircle, badge: counts.valides },
          { id: 'stats', label: 'Rapports & Statistiques', icon: BarChart3 },
          { id: 'excel', label: 'Import / Export Excel', icon: FileSpreadsheet },
          { id: 'archives', label: 'Archives attestations', icon: Archive }
          ,{ id: 'parametres', label: 'Paramètres', icon: Settings }
        ]; 

      case 'DIRECTION':
        return [
          { id: 'dashboard', label: 'Tableau de Bord Direction', icon: BarChart3, badge: counts.total },
          { id: 'nouveau', label: 'Saisir un Dossier', icon: FilePlus, highlight: true },
          { id: 'gestion_conseillers', label: 'Gestion des Conseillers', icon: UserRoundPlus },
          { id: 'attestations_entreprises', label: 'Attestations Entreprises', icon: Building2, badge: counts.valides, badgeColor: 'bg-emerald-600' },
          { id: 'valides', label: 'Dossiers Validés', icon: CheckCircle, badge: counts.valides },
          { id: 'excel', label: 'Exportation des Données', icon: FileSpreadsheet },
          { id: 'archives', label: 'Archives attestations', icon: Archive }
          ,{ id: 'parametres', label: 'Paramètres', icon: Settings }
        ];

      case 'CONSEILLER':
      default:
        return [
          { id: 'dashboard', label: 'Mon Tableau de Bord', icon: LayoutDashboard, badge: counts.total },
          { id: 'nouveau', label: 'Saisir un Nouveau Dossier', icon: FilePlus, highlight: true },
          { id: 'attestations_entreprises', label: 'Attestations Entreprises', icon: Building2, badge: counts.valides, badgeColor: 'bg-emerald-600' },
          // { id: 'corrections', label: 'Corrections Demandées', icon: AlertCircle, badge: counts.corrections_demandees, badgeColor: 'bg-rose-500' },
          { id: 'valides', label: 'Attestations De Fin', icon: CheckCircle, badge: counts.attestations_disponibles, badgeColor: 'bg-emerald-600' },
          { id: 'stats', label: 'Mes Statistiques', icon: BarChart3 },
          { id: 'excel', label: 'Exportation Excel', icon: FileSpreadsheet },
          { id: 'archives', label: 'Archives attestations', icon: Archive }
          ,{ id: 'parametres', label: 'Paramètres', icon: Settings }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-[#16323a] border-r border-[#244850] h-[calc(100vh-4.5rem)] sticky top-[4.5rem] flex-shrink-0 p-4 flex flex-col justify-between overflow-y-auto shadow-xl">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-black text-[#b4c5bf] uppercase tracking-widest border-b border-[#31545a] mb-3">
          Navigation Principale
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-aej-orange to-orange-600 text-white shadow-md shadow-orange-500/20'
                  : item.highlight
                  ? 'bg-orange-50 text-aej-orange border border-orange-200 hover:bg-orange-100 font-extrabold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-5 ${isActive ? 'text-white' : item.highlight ? 'text-aej-orange' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : item.badgeColor 
                    ? `${item.badgeColor} text-white` 
                    : 'bg-white/10 text-slate-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-aej-green-dark to-aej-dark text-white space-y-2 shadow-sm border border-aej-green/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-wider">AEJ Bouaké</span>
        </div>
        <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
          Base unique et traçabilité des actions horodatée.
        </p>
      </div>
    </aside>
  );
}
