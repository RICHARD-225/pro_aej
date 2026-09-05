import React, { useState, useMemo } from 'react';
import StatusBadge from '../components/StatusBadge';
import DossierList from '../components/DossierList';
import { 
  FileText, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  FilePlus, 
  Printer, 
  Eye, 
  Clock,
  History,
  Filter,
  RefreshCw,
  Building2,
  Edit3
} from 'lucide-react';

export default function DashboardConseiller({ 
  dossiers, 
  counts, 
  onNewDossier, 
  onOpenChecklist, 
  onOpenCorrection,
  onGenerateAttestationEntreprise,
  onDownloadDossierAttestation,
  showEndStageAttestation = false,
  onViewDetails,
  filterStatut,
  onFilterChange 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntreprise, setSelectedEntreprise] = useState('');
  const [selectedEcole, setSelectedEcole] = useState('');

  const entreprisesList = useMemo(() => {
    const setE = new Set(dossiers.map(d => d.entreprise.raison_sociale));
    return Array.from(setE).sort();
  }, [dossiers]);

  const ecolesList = useMemo(() => {
    const setE = new Set(dossiers.map(d => d.candidat.etablissement_frequente).filter(Boolean));
    return Array.from(setE).sort();
  }, [dossiers]);

  const filteredDossiers = useMemo(() => {
    return dossiers.filter(d => {
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
          (d.candidat.etablissement_frequente && d.candidat.etablissement_frequente.toLowerCase().includes(q));
        
        if (!matchSearch) return false;
      }

      if (selectedEntreprise && d.entreprise.raison_sociale !== selectedEntreprise) {
        return false;
      }

      if (selectedEcole && d.candidat.etablissement_frequente !== selectedEcole) {
        return false;
      }

      if (filterStatut) {
        if (filterStatut === 'EN_VERIFICATION' && !['SOUMIS', 'EN_VERIFICATION', 'RESOUMIS'].includes(d.statut_workflow)) {
          return false;
        } else if (filterStatut === 'VALIDE' && !['VALIDE', 'ATTESTATION_GENEREE'].includes(d.statut_workflow)) {
          return false;
        } else if (filterStatut === 'ATTESTATION_GENEREE' && !['VALIDE', 'ATTESTATION_GENEREE'].includes(d.statut_workflow)) {
          return false;
        } else if (!['EN_VERIFICATION', 'VALIDE', 'ATTESTATION_GENEREE'].includes(filterStatut) && d.statut_workflow !== filterStatut) {
          return false;
        }
      }

      return true;
    });
  }, [dossiers, searchTerm, selectedEntreprise, selectedEcole, filterStatut]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedEntreprise('');
    setSelectedEcole('');
    onFilterChange('');
  };

  return (
    <div className="space-y-7 font-sans animate-in fade-in duration-200">
      
      {/* Top Banner Conseiller */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-aej-green p-6 rounded-2xl border border-slate-800 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
              Espace Conseiller Emploi
            </span>
            <span className="text-xs text-slate-300 font-mono">AEJ Bouaké</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Gestion et Suivi des Dossiers d'Immersion</h2>
          <p className="text-xs text-slate-200 mt-0.5">
            Saisissez de nouveaux dossiers, suivez les validations et effectuez les corrections demandées.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNewDossier}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-aej-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-orange-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>Saisir un Nouveau Dossier</span>
          </button>
        </div>
      </div>

      {/* KPIs Grid - Clicable pour Filtrage Instantané */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div 
          onClick={() => onFilterChange('')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
            filterStatut === '' ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm bg-slate-50/50' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Tous Dossiers</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{counts.enregistres}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Afficher tout le registre</div>
        </div>

        <div 
          onClick={() => onFilterChange('EN_VERIFICATION')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
            filterStatut === 'EN_VERIFICATION' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm bg-amber-50/30' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase">En Vérification</span>
            <Search className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{counts.en_verification}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">En cours de contrôle</div>
        </div>

        <div 
          onClick={() => onFilterChange('CORRECTION_DEMANDEE')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
            filterStatut === 'CORRECTION_DEMANDEE' ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm bg-rose-50/60' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase">Corrections</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{counts.corrections_demandees}</div>
          <div className="text-[10px] text-rose-600 font-medium mt-1">Nécessite votre action</div>
        </div>

        <div 
          onClick={() => onFilterChange('VALIDE')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
            filterStatut === 'VALIDE' ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm bg-emerald-50/30' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Validés</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{counts.valides}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Contrôle 9/9 validé</div>
        </div>

        <div 
          onClick={() => onFilterChange('ATTESTATION_GENEREE')}
          className={`p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 cursor-pointer transition-all hover:shadow-md hover:bg-slate-800 ${
            filterStatut === 'ATTESTATION_GENEREE' ? 'ring-2 ring-emerald-400/50 shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase">Attestations</span>
            <Printer className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{counts.attestations_disponibles}</div>
          <div className="text-[10px] text-emerald-300 font-medium mt-1">Prêtes par Entreprise</div>
        </div>
      </div>

      {/* Barre de Filtres et Recherche Multi-critères */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-aej-orange" />
            <span>Filtres & Recherche Avancée :</span>
            {filterStatut && (
              <span className="ml-2 bg-aej-orange/10 text-aej-orange px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                Filtre actif : {filterStatut}
              </span>
            )}
          </div>
          {(selectedEntreprise || selectedEcole || searchTerm || filterStatut) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Recherche textuelle :</label>
            <input
              type="text"
              placeholder="Code dossier, nom, CNI, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-aej-green focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Entreprise d'accueil :</label>
            <select
              value={selectedEntreprise}
              onChange={(e) => setSelectedEntreprise(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-aej-green focus:ring-2 focus:ring-emerald-100 outline-none transition"
            >
              <option value="">Toutes les entreprises</option>
              {entreprisesList.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Établissement / École :</label>
            <select
              value={selectedEcole}
              onChange={(e) => setSelectedEcole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-aej-green focus:ring-2 focus:ring-emerald-100 outline-none transition"
            >
              <option value="">Tous les établissements</option>
              {ecolesList.map(ec => (
                <option key={ec} value={ec}>{ec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLEAU DES DOSSIERS CONSEILLER - ORGANISÉ ET EMBELLI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Registre des Dossiers d'Immersion</h3>
            <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {filteredDossiers.length} dossier(s)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Suivi dynamique</span>
        </div>

        <div className="px-4 py-4 bg-[#fbfaf6]">
          <DossierList
            dossiers={filteredDossiers}
            emptyMessage="Modifiez les filtres ou la recherche pour retrouver un dossier."
            onOpenCorrection={onOpenCorrection}
            onViewHistory={onViewDetails}
            onPrimaryAction={showEndStageAttestation ? onDownloadDossierAttestation : undefined}
            primaryLabel="Fin de stage"
            primaryTitle="Télécharger l'attestation individuelle de fin de stage"
            primaryIcon={FileText}
          />
        </div>

        <div className="hidden">
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
                <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions & Suivi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
              {filteredDossiers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400 text-xs font-bold">
                    Aucun dossier ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredDossiers.map((d) => {
                  const isAttestationReady = d.statut_workflow === 'VALIDE' || d.statut_workflow === 'ATTESTATION_GENEREE';
                  const needsCorrection = d.statut_workflow === 'CORRECTION_DEMANDEE';
                  const firstLog = d.historique && d.historique[0] ? d.historique[0].date : `${d.date_saisie} à 09:00`;

                  return (
                    <tr 
                      key={d.id} 
                      className={`transition-all duration-150 ${
                        needsCorrection 
                          ? 'bg-rose-50/70 hover:bg-rose-50 border-l-4 border-rose-500' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      
                      {/* 1. Code / ID Unique */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-[11px] shadow-2xs">
                          {d.id}
                        </span>
                      </td>

                      {/* 2. Date & Heure */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 text-[11px] font-medium">
                        {firstLog}
                      </td>

                      {/* 3. Conseiller Référent */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-800">
                        {d.conseiller_nom}
                      </td>

                      {/* 4. Bénéficiaire */}
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

                      {/* 5. N° Paiement */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-[10px] font-extrabold text-slate-500 uppercase">{d.candidat.type_paiement}</div>
                        <div className="font-mono font-black text-blue-700 text-xs">{d.candidat.numero_paiement}</div>
                      </td>

                      {/* 6. Entreprise */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{d.entreprise.raison_sociale}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{d.service_affectation} • {d.entreprise.type_entreprise}</div>
                      </td>

                      {/* 7. Statut Workflow & Motif */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={d.statut_workflow} />
                        {needsCorrection && d.motif_correction && (
                          <div className="mt-1.5 p-2 bg-rose-100/90 border border-rose-300 rounded-lg text-[10px] text-rose-950 font-medium max-w-xs shadow-2xs">
                            <strong className="text-rose-700 block font-black">Motif rejet IT :</strong>
                            <p className="line-clamp-2">{d.motif_correction}</p>
                          </div>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* SI EN CORRECTION : BOUTON CORRIGER BIEN VISIBLE */}
                          {needsCorrection ? (
                            <button
                              onClick={() => onOpenCorrection(d)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition cursor-pointer"
                              title="Consulter le motif et corriger"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Corriger</span>
                            </button>
                          ) : isAttestationReady && !showEndStageAttestation ? (
                            <button
                              onClick={() => onGenerateAttestationEntreprise(d.entreprise_id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition cursor-pointer"
                              title="Consulter l'attestation de l'entreprise d'accueil"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Attestation Entreprise</span>
                            </button>
                          ) : null}

                          {isAttestationReady && showEndStageAttestation && (
                            <button
                              onClick={() => onDownloadDossierAttestation?.(d.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition cursor-pointer"
                              title="Télécharger l'attestation individuelle de fin de stage"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Attestation de fin de stage</span>
                            </button>
                          )}

                          <button
                            onClick={() => onViewDetails(d)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="Historique horodaté"
                          >
                            <History className="w-4 h-4" />
                          </button>

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
