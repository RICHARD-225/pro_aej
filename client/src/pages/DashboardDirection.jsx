import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle2, 
  Building, 
  FileSpreadsheet, 
  Download,
  Calendar,
  Sparkles,
  Award,
  Filter,
  BarChart2
} from 'lucide-react';

export default function DashboardDirection({ dossiers, stats, conseillersList: providedList = [] }) {
  const [activeTabDirection, setActiveTabDirection] = useState('global'); // 'global' vs 'conseillers'

  // Conseillers régionaux
  const conseillers = (providedList || []).filter(Boolean);

  // Stats individuelles par conseiller (uniquement en lignes)
  const conseillersStats = conseillers.map(cons => {
    const list = dossiers.filter(d => d.conseiller_id === cons.id || d.conseiller_nom?.toLowerCase().includes(cons.nom.toLowerCase()));
    const total = list.length;
    const valides = list.filter(d => d.statut_workflow === 'VALIDE' || d.statut_workflow === 'ATTESTATION_GENEREE').length;
    const en_verif = list.filter(d => ['SOUMIS', 'EN_VERIFICATION', 'RESOUMIS'].includes(d.statut_workflow)).length;
    const corrections = list.filter(d => d.statut_workflow === 'CORRECTION_DEMANDEE').length;
    const tauxConformite = total > 0 ? Math.round((valides / total) * 100) : 0;

    return {
      user: cons,
      total,
      valides,
      en_verif,
      corrections,
      tauxConformite
    };
  }).sort((first, second) => {
    if (second.total !== first.total) return second.total - first.total;
    if (second.valides !== first.valides) return second.valides - first.valides;
    return `${first.user.prenoms} ${first.user.nom}`.localeCompare(`${second.user.prenoms} ${second.user.nom}`, 'fr');
  });

  // Ventilation des données globales par entreprise
  const statsParEntreprise = dossiers.reduce((acc, d) => {
    const name = d.entreprise.raison_sociale;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  // Ventilation par type d'entreprise (Privé, Public non EPN, EPN)
  const statsParTypeEntreprise = dossiers.reduce((acc, d) => {
    const type = d.entreprise.type_entreprise || 'Privé';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5 font-sans animate-in fade-in duration-200">
      
      {/* Header Banner Direction */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-aej-green text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
              Direction Régionale AEJ Bouaké
            </span>
            <span className="text-xs text-slate-300 font-mono">PILOTAGE & PERFORMANCE</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Espace de Décision & Statistiques Globales</h2>
          <p className="text-xs text-slate-200">
            Vision consolidée sur l'ensemble des immersions et suivi individuel des conseillers.
          </p>
        </div>

        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-aej-orange" />
          <span>Imprimer le Rapport Régional</span>
        </button>
      </div>

      {/* SÉPARATEUR DE NAVIGATION CLAIRE (Stats Globales vs Suivi Conseillers) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTabDirection('global')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTabDirection === 'global'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-aej-orange" />
          <span>1. Tableau de Bord Global de l'Agence</span>
        </button>

        <button
          onClick={() => setActiveTabDirection('conseillers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTabDirection === 'conseillers'
              ? 'bg-gradient-to-r from-aej-orange to-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Suivi des Conseillers (Vue en Lignes)</span>
        </button>
      </div>

      {/* ================================================== */}
      {/* VUE 1 : TABLEAU DE BORD GLOBAL DE L'AGENCE */}
      {/* ================================================== */}
      {activeTabDirection === 'global' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* KPIs Globaux */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Dossiers</span>
              <span className="text-2xl font-black text-slate-900">{stats.kpis.total}</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 shadow-sm">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Soumis</span>
              <span className="text-2xl font-black text-blue-900">{stats.kpis.enregistres}</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 shadow-sm">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">En Vérification</span>
              <span className="text-2xl font-black text-amber-900">{stats.kpis.en_verification}</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Validés</span>
              <span className="text-2xl font-black text-emerald-900">{stats.kpis.valides}</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 shadow-sm">
              <span className="text-[10px] font-bold text-rose-700 uppercase block">En Correction</span>
              <span className="text-2xl font-black text-rose-900">{stats.kpis.corrections_demandees}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-sm border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block">Taux Validation</span>
              <span className="text-2xl font-black text-emerald-400">
                {stats.kpis.total > 0 ? Math.round((stats.kpis.valides / stats.kpis.total) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Ventilation par Entreprise & Type d'Entreprise */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Ventilation par Entreprise d'Accueil */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">
                Répartition des Bénéficiaires par Entreprise d'Accueil
              </h3>
              <div className="space-y-6">
                {Object.entries(statsParEntreprise).map(([entName, count]) => {
                  const pct = Math.round((count / dossiers.length) * 100);
                  return (
                    <div key={entName} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-800">{entName}</span>
                        <span className="text-slate-600">{count} candidat(s) ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-aej-orange rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ventilation par Type d'Entreprise (Privé, Public non EPN, EPN) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                Répartition par Type d'Entreprise (Privé / Public / EPN)
              </h3>
              <div className="space-y-2">
                {Object.entries(statsParTypeEntreprise).map(([typeStr, count]) => {
                  const pct = Math.round((count / dossiers.length) * 100);
                  return (
                    <div key={typeStr} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-800 font-bold">{typeStr}</span>
                        <span className="text-slate-600">{count} stage(s) ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-aej-green rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Rapport Journalier Synthétique */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center  justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-8 h-8 text-aej-orange" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Rapport Quotidien Régional - Agence de Bouaké
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">{new Date().toLocaleDateString('fr-FR')}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Toutes les données ci-dessus sont issues du système centralisé d'immersion de l'AEJ Bouaké et sont mises à jour en temps réel à chaque soumission et validation.
            </p>
          </div>

        </div>
      )}

      {/* ================================================== */}
      {/* VUE 2 : SUIVI DES CONSEILLERS STRICTEMENT EN LIGNES */}
      {/* ================================================== */}
      {activeTabDirection === 'conseillers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Tableau de Suivi de la Performance des Conseillers (Vue en Lignes)</h3>
              <p className="text-xs text-slate-500">Statistiques individuelles présentées uniquement sous forme de lignes récapitulatives.</p>
            </div>
            <span className="text-xs font-bold bg-orange-100 text-aej-orange px-3 py-1 rounded-full border border-orange-200">
              {conseillers.length} Conseillers régionaux
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-normal border-collapse">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Conseiller Emploi</th>
                  <th className="px-5 py-3.5 text-center">Titre / Rôle</th>
                  <th className="px-5 py-3.5 text-center">Dossiers Saisis</th>
                  <th className="px-5 py-3.5 text-center">En Vérification</th>
                  <th className="px-5 py-3.5 text-center">En Correction</th>
                  <th className="px-5 py-3.5 text-center">Dossiers Validés</th>
                  <th className="px-5 py-3.5 text-center">Taux de Réussite (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {conseillersStats.map((cs) => (
                  <tr key={cs.user.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Conseiller */}
                    <td className="px-5 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img src={cs.user.avatar || '/logo-aej.png'} onError={(event) => { event.currentTarget.src = '/logo-aej.png'; }} className="w-8 h-8 rounded-lg object-cover" alt="Avatar" />
                        <div>
                          <div className="font-extrabold text-slate-900">{cs.user.prenoms} {cs.user.nom}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{cs.user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Titre */}
                    <td className="px-5 py-4 text-center font-medium text-slate-600">
                      {cs.user.titre}
                    </td>

                    {/* Dossiers Saisis */}
                    <td className="px-5 py-4 text-center font-extrabold text-slate-900">
                      {cs.total}
                    </td>

                    {/* En vérification */}
                    <td className="px-5 py-4 text-center font-bold text-amber-800 bg-amber-50/40">
                      {cs.en_verif}
                    </td>

                    {/* En correction */}
                    <td className="px-5 py-4 text-center font-bold text-rose-800 bg-rose-50/40">
                      {cs.corrections}
                    </td>

                    {/* Validés */}
                    <td className="px-5 py-4 text-center font-bold text-emerald-800 bg-emerald-50/40">
                      {cs.valides}
                    </td>

                    {/* Taux de Réussite */}
                    <td className="px-5 py-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                        {cs.tauxConformite}%
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
