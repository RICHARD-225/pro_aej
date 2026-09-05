import React, { useState } from 'react';
import { X, CheckSquare, Square, AlertTriangle, CheckCircle2, FileSearch } from 'lucide-react';

export default function ChecklistModal({ dossier, onClose, onSubmitChecklist, onRequestCorrection }) {
  if (!dossier) return null;

  const [checklist, setChecklist] = useState({
    identite_conforme: dossier.checklist?.identite_conforme ?? false,
    telephone_conforme: dossier.checklist?.telephone_conforme ?? false,
    piece_identite_conforme: dossier.checklist?.piece_identite_conforme ?? false,
    convention_conforme: dossier.checklist?.convention_conforme ?? false,
    entreprise_conforme: dossier.checklist?.entreprise_conforme ?? false,
    poste_conforme: dossier.checklist?.poste_conforme ?? false,
    dates_conformes: dossier.checklist?.dates_conformes ?? false,
    signature_conforme: dossier.checklist?.signature_conforme ?? false,
    dossier_physique_present: dossier.checklist?.dossier_physique_present ?? false,
    observations_controle: dossier.checklist?.observations_controle || ''
  });

  const [showCorrectionPrompt, setShowCorrectionPrompt] = useState(false);
  const [motifCorrection, setMotifCorrection] = useState('');

  const itemsConfig = [
    { key: 'identite_conforme', label: '1. Nom, Prénoms & Date de naissance', detail: `${dossier.candidat.nom} ${dossier.candidat.prenoms} (${dossier.candidat.date_naissance})` },
    { key: 'telephone_conforme', label: '2. Numéro de téléphone & Contact', detail: dossier.candidat.contact_1 },
    { key: 'piece_identite_conforme', label: '3. Pièce d\'Identité (CNI / Carte Scolaire)', detail: `${dossier.candidat.nature_piece_identite} - ${dossier.candidat.numero_piece_identite}` },
    { key: 'convention_conforme', label: '4. Convention de stage d\'immersion', detail: `Dispositif ${dossier.dispositif}` },
    { key: 'entreprise_conforme', label: '5. Entreprise d\'Accueil', detail: dossier.entreprise.raison_sociale },
    { key: 'poste_conforme', label: '6. Service & Affectation', detail: dossier.service_affectation },
    { key: 'dates_conformes', label: '7. Dates de stage (Début et Fin)', detail: `${dossier.date_debut_stage} au ${dossier.date_fin_previsionnelle}` },
    { key: 'signature_conforme', label: '8. Signatures & Cachet officiel', detail: 'Signature entreprise et candidat' },
    { key: 'dossier_physique_present', label: '9. Fiche physique présente en archives', detail: 'Dossier papier vérifié' },
  ];

  const toggleItem = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.keys(checklist)
    .filter(k => k !== 'observations_controle')
    .every(k => checklist[k] === true);

  const [correctionError, setCorrectionError] = useState('');

  const handleValidate = () => {
    onSubmitChecklist(dossier.id, checklist);
  };

  const handleSendCorrection = () => {
    if (!motifCorrection.trim()) {
      setCorrectionError("Veuillez saisir un motif explicatif pour le conseiller avant d'envoyer.");
      return;
    }
    onRequestCorrection(dossier.id, motifCorrection, checklist);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Checklist de Contrôle Physico-Numérique</h3>
              <p className="text-xs text-slate-400">Dossier : <span className="font-mono text-blue-400 font-bold">{dossier.id}</span> • Conseiller : {dossier.conseiller_nom}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Candidat Card Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-aej-green uppercase">Bénéficiaire à vérifier :</span>
              <h4 className="text-lg font-extrabold text-slate-900">{dossier.candidat.nom} {dossier.candidat.prenoms}</h4>
              <p className="text-xs text-slate-500">CNI: <span className="font-mono font-bold text-slate-700">{dossier.candidat.numero_piece_identite}</span> | Entreprise: <span className="font-bold text-slate-800">{dossier.entreprise.raison_sociale}</span></p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Identifiant Unique</span>
              <span className="font-mono font-bold text-sm bg-white px-2 py-1 rounded border border-slate-200 text-slate-800">{dossier.id}</span>
            </div>
          </div>

          {/* 9 Points Checklist Grid */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Comparez les éléments du dossier physique papier aux données du système (9 points) :
            </div>

            <div className="grid grid-cols-1 gap-2">
              {itemsConfig.map((item) => {
                const isChecked = checklist[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleItem(item.key)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50/60 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[11px] opacity-80">{item.detail}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isChecked ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                    }`}>
                      {isChecked ? 'Conforme' : 'Non Conforme'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observations ou remarques particulières du vérificateur :
            </label>
            <input
              type="text"
              placeholder="Ex: Fiche physique conforme, signature originale vérifiée..."
              value={checklist.observations_controle}
              onChange={(e) => setChecklist(prev => ({ ...prev, observations_controle: e.target.value }))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Prompt Demande de Correction (Si non conforme) */}
          {showCorrectionPrompt && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Précisez le motif exact du retour au conseiller :</span>
              </div>
              {correctionError && (
                <p className="text-xs font-bold text-rose-700 bg-rose-100 p-2 rounded-lg border border-rose-200">
                  {correctionError}
                </p>
              )}
              <textarea
                rows="3"
                placeholder="Ex: La date de démarrage enregistrée ne correspond pas à la convention physique..."
                value={motifCorrection}
                onChange={(e) => {
                  setMotifCorrection(e.target.value);
                  setCorrectionError('');
                }}
                className="w-full p-3 bg-white border border-rose-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCorrectionPrompt(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendCorrection}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Envoyer la Demande de Correction
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setShowCorrectionPrompt(!showCorrectionPrompt)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Renvoyer en Correction
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl">
              Fermer
            </button>
            <button
              onClick={handleValidate}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-md ${
                allChecked
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-slate-800 hover:bg-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {allChecked ? 'Valider Officiellement (9/9 Conformes)' : 'Valider avec Récapitulatif'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
