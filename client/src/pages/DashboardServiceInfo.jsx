import React, { useState, useMemo } from 'react';
import StatusBadge from '../components/StatusBadge';
import { 
  FileCheck2, 
  Search, 
  CheckSquare, 
  AlertTriangle, 
  CheckCircle, 
  History, 
  QrCode,
  Filter,
  RefreshCw,
  FileText,
  FileSearch
} from 'lucide-react';

export default function DashboardServiceInfo({ dossiers, onOpenChecklist, onViewHistory, onDownloadDossierAttestation, onDownloadBulkAttestation, currentUser, conseillersList: providedList = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConseiller, setSelectedConseiller] = useState('');
  const [selectedEntreprise, setSelectedEntreprise] = useState('');
  const [selectedEcole, setSelectedEcole] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('SOUMIS'); // SOUMIS par défaut pour contrôle

  // Conseillers régionaux pour le filtre
  const conseillersList = providedList || [];

  // Extraction unique des Entreprises et Écoles existantes dans les dossiers pour les filtres
  const entreprisesList = useMemo(() => {
    const setE = new Set(dossiers.map(d => d.entreprise.raison_sociale));
    return Array.from(setE).sort();
  }, [dossiers]);

  const ecolesList = useMemo(() => {
    const setE = new Set(dossiers.map(d => d.candidat.etablissement_frequente).filter(Boolean));
    return Array.from(setE).sort();
  }, [dossiers]);

  // Filtrage combiné multi-critères
  const filteredDossiers = useMemo(() => {
    return dossiers.filter(d => {
      // 1. Recherche textuelle
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchSearch = 
          d.id.toLowerCase().includes(q) ||
          d.candidat.nom.toLowerCase().includes(q) ||
          d.candidat.prenoms.toLowerCase().includes(q) ||
          d.candidat.numero_piece_identite.toLowerCase().includes(q) ||
          d.candidat.contact_1.includes(q) ||
          d.candidat.numero_paiement.includes(q) ||
          d.entreprise.raison_sociale.toLowerCase().includes(q) ||
          (d.candidat.etablissement_frequente && d.candidat.etablissement_frequente.toLowerCase().includes(q)) ||
          (d.conseiller_nom && d.conseiller_nom.toLowerCase().includes(q));
        
        if (!matchSearch) return false;
      }

      // 2. Filtre par Conseiller
      if (selectedConseiller && d.conseiller_id !== selectedConseiller) {
        return false;
      }

      // 3. Filtre par Entreprise
      if (selectedEntreprise && d.entreprise.raison_sociale !== selectedEntreprise) {
        return false;
      }

      // 4. Filtre par École / Établissement
      if (selectedEcole && d.candidat.etablissement_frequente !== selectedEcole) {
        return false;
      }
  
      // 5. Filtre par Statut Workflow
      if (selectedStatut) {
        if (selectedStatut === 'SOUMIS') {
          if (!['SOUMIS', 'EN_VERIFICATION', 'RESOUMIS'].includes(d.statut_workflow)) return false;
        } else if (selectedStatut === 'CORRECTION') {
          if (d.statut_workflow !== 'CORRECTION_DEMANDEE') return false;
        } else if (selectedStatut === 'VALIDE') {
          if (!['VALIDE', 'ATTESTATION_GENEREE'].includes(d.statut_workflow)) return false;
        } else if (selectedStatut !== 'TOUS') {
          if (d.statut_workflow !== selectedStatut) return false;
        }
      }

      return true;
    });
  }, [dossiers, searchTerm, selectedConseiller, selectedEntreprise, selectedEcole, selectedStatut]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedConseiller('');
    setSelectedEntreprise('');
    setSelectedEcole('');
    setSelectedStatut('SOUMIS');
  };

  const counts = useMemo(() => {
    return {
      total: dossiers.length,
      soumis: dossiers.filter(d => ['SOUMIS', 'EN_VERIFICATION', 'RESOUMIS'].includes(d.statut_workflow)).length,
      correction: dossiers.filter(d => d.statut_workflow === 'CORRECTION_DEMANDEE').length,
      valides: dossiers.filter(d => ['VALIDE', 'ATTESTATION_GENEREE'].includes(d.statut_workflow)).length
    };
  }, [dossiers]);

  const validDossiers = useMemo(() => filteredDossiers.filter((d) => ['VALIDE', 'ATTESTATION_GENEREE'].includes(d.statut_workflow)), [filteredDossiers]);
  const validEnterpriseIds = useMemo(() => Array.from(new Set(validDossiers.map((d) => d.entreprise_id).filter(Boolean))), [validDossiers]);

  const bulkDownloadCandidates = useMemo(() => {
    if (validDossiers.length === 0) return [];
    const firstEnterpriseId = validDossiers[0].entreprise_id;
    return validDossiers.filter((d) => d.entreprise_id === firstEnterpriseId).map((d) => d.id);
  }, [validDossiers]);

  const canDownloadBulk = selectedStatut === 'VALIDE' && bulkDownloadCandidates.length > 0 && validEnterpriseIds.length === 1;

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Header Banner Service Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-aej-green text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
              Service Informatique & Contrôle
            </span>
            <span className="text-xs text-slate-300 font-mono">AEJ Bouaké</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Espace de Contrôle Physico-Numérique</h2>
          {/* <p className="text-xs text-slate-200 mt-0.5">
            Validation des dossiers soumis en ligne et comparaison avec la fiche physique papier en 9 points.
          </p> */}
        </div>

        {/* Barre de Recherche Rapide */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Rechercher (Code, Nom, CNI, Tél)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs font-semibold text-emerald-300 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-400 outline-none shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        {canDownloadBulk && (
          <button
            type="button"
            onClick={() => onDownloadBulkAttestation?.(bulkDownloadCandidates)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[11px] font-black shadow-sm shadow-emerald-600/20 transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Télécharger le lot unique ({bulkDownloadCandidates.length})
          </button>
        )}

      </div>

      {/* KPI Cards Interactives & Filtrantes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div 
          onClick={() => setSelectedStatut('TOUS')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
            selectedStatut === 'TOUS' ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm bg-slate-50/50' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Dossiers</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{counts.total}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Tous les dossiers reçus</div>
        </div>

        <div 
          onClick={() => setSelectedStatut('SOUMIS')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
            selectedStatut === 'SOUMIS' ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm bg-blue-50/30' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase">À Contrôler (Prioritaires)</span>
            <Search className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">{counts.soumis}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-1">En attente de votre audit 9 pts</div>
        </div>

        <div 
          onClick={() => setSelectedStatut('CORRECTION')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
            selectedStatut === 'CORRECTION' ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm bg-rose-50/60' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase">En Correction Conseiller</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{counts.correction}</div>
          <div className="text-[10px] text-rose-600 font-medium mt-1">Renvoyés pour motifs IT</div>
        </div>

        <div 
          onClick={() => setSelectedStatut('VALIDE')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
            selectedStatut === 'VALIDE' ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm bg-emerald-50/30' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Validés Conformes</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{counts.valides}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Prêts pour attestations</div>
        </div>
      </div>

      {/* BARRE DE FILTRES MULTI-CRITÈRES (Conseiller, Entreprise, École, Statut) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-aej-orange" />
            <span>Filtres de Recherche & Multi-Critères :</span>
          </div>
          {(selectedConseiller || selectedEntreprise || selectedEcole || searchTerm || selectedStatut !== 'SOUMIS') && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réinitialiser tous les filtres</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Filtre Conseiller */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Conseiller Référent :</label>
            <select
              value={selectedConseiller}
              onChange={(e) => setSelectedConseiller(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-aej-orange/30 transition"
            >
              <option value="">Tous les conseillers</option>
              {conseillersList.map(c => (
                <option key={c.id} value={c.id}>{c.prenoms} {c.nom}</option>
              ))}
            </select>
          </div>

          {/* Filtre Entreprise */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Entreprise d'Accueil :</label>
            <select
              value={selectedEntreprise}
              onChange={(e) => setSelectedEntreprise(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-aej-orange/30 transition"
            >
              <option value="">Toutes les entreprises</option>
              {entreprisesList.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Filtre École / Établissement */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Établissement / École :</label>
            <select
              value={selectedEcole}
              onChange={(e) => setSelectedEcole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-aej-orange/30 transition"
            >
              <option value="">Tous les établissements / écoles</option>
              {ecolesList.map(ec => (
                <option key={ec} value={ec}>{ec}</option>
              ))}
            </select>
          </div>

          {/* Filtre Statut Workflow */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Statut du Dossier :</label>
            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-aej-orange/30 transition"
            >
              <option value="SOUMIS">Soumis à Contrôler (Prioritaires)</option>
              <option value="CORRECTION">En Correction chez le Conseiller</option>
              <option value="VALIDE">Validés Conformes</option>
              <option value="TOUS">Tous les statuts</option>
            </select>
          </div>

        </div>
      </div>

      {/* TABLEAU DES DOSSIERS - ORGANISÉ ET EMBELLI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Registre de Contrôle Physico-Numérique</h3>
            <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {filteredDossiers.length} dossier(s)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Audit 9 points</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-normal border-collapse">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap">Code / ID Unique</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Date & Heure Saisie</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Conseiller Référent</th>
                <th className="px-4 py-3.5">Bénéficiaire (Nom & Prénoms)</th>
                <th className="px-4 py-3.5 whitespace-nowrap">N° Paiement (Trésor / Wave)</th>
                <th className="px-4 py-3.5">Entreprise d'Accueil</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Statut Workflow</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions & Contrôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
              {filteredDossiers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400 text-xs font-bold">
                    Aucun dossier ne correspond à ces critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredDossiers.map((d) => {
                  const isReadyForCheck = ['SOUMIS', 'EN_VERIFICATION', 'RESOUMIS'].includes(d.statut_workflow);
                  const isCorrection = d.statut_workflow === 'CORRECTION_DEMANDEE';
                  const firstLog = d.historique && d.historique[0] ? d.historique[0].date : `${d.date_saisie} à 09:00`;

                  return (
                    <tr 
                      key={d.id} 
                      className={`transition-all duration-150 ${
                        isReadyForCheck 
                          ? 'bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-blue-500' 
                          : isCorrection 
                          ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-rose-400' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      
                      {/* 1. Code / ID Unique */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-[11px] shadow-2xs">
                          {d.id}
                        </span>
                      </td>

                      {/* 2. Date & Heure de Saisie */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 text-[11px] font-medium">
                        {firstLog}
                      </td>

                      {/* 3. Conseiller Référent */}
                      <td className="px-4 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                        {d.conseiller_nom}
                      </td>

                      {/* 4. Bénéficiaire (Nom & Prénoms) */}
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900 text-xs">{d.candidat.nom} {d.candidat.prenoms}</div>
                        <div className="text-[10px] text-slate-500 font-medium">CNI: {d.candidat.numero_piece_identite} • Tél: {d.candidat.contact_1}</div>
                        {d.candidat.etablissement_frequente && (
                          <div className="text-[10px] text-emerald-700 font-bold">École: {d.candidat.etablissement_frequente}</div>
                        )}
                        {d.candidat.handicap && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                            Handicap: {d.candidat.autre_type_handicap || 'Déclaré'}
                          </span>
                        )}
                      </td>

                      {/* 5. N° Paiement (Trésor / Wave) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-[10px] font-extrabold text-slate-500 uppercase">{d.candidat.type_paiement}</div>
                        <div className="font-mono font-black text-blue-700 text-xs">{d.candidat.numero_paiement}</div>
                      </td>

                      {/* 6. Entreprise d'Accueil */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{d.entreprise.raison_sociale}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{d.service_affectation} • {d.entreprise.type_entreprise}</div>
                      </td>

                      {/* 7. Statut Workflow */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={d.statut_workflow} />
                        {isCorrection && d.motif_correction && (
                          <div className="mt-1.5 p-2 bg-rose-100/90 border border-rose-300 rounded-lg text-[10px] text-rose-950 font-medium max-w-xs shadow-2xs">
                            <strong className="text-rose-700 block font-black">Motif rejet :</strong>
                            <p className="line-clamp-2">{d.motif_correction}</p>
                          </div>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewHistory(d)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Voir l'historique d'audit horodaté"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenChecklist(d)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              isReadyForCheck
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30'
                                : 'bg-slate-800 hover:bg-slate-900 text-white'
                            }`}
                          >
                            <FileSearch className="w-3.5 h-3.5" />
                            <span>Checklist (9 pts)</span>
                          </button>

                          {selectedStatut === 'VALIDE' && ['VALIDE', 'ATTESTATION_GENEREE'].includes(d.statut_workflow) && (
                            <button
                              onClick={() => onDownloadDossierAttestation?.(d.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Fin de stage</span>
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
