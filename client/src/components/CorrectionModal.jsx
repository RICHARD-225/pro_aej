import React, { useState } from 'react';
import { X, AlertTriangle, Check, RefreshCw, User, Phone, Building2, Calendar, CheckCircle2 } from 'lucide-react';
import { isDateRangeValid, isValidCalendarDate, isValidPhone } from '../utils/validation';

const verificationItemsLabels = [
  { key: 'identite_conforme', label: '1. Identité du candidat' },
  { key: 'telephone_conforme', label: '2. Contact téléphonique' },
  { key: 'piece_identite_conforme', label: "3. N° Pièce d'identité" },
  { key: 'convention_conforme', label: '4. Convention de stage' },
  { key: 'entreprise_conforme', label: "5. Entreprise d'accueil" },
  { key: 'poste_conforme', label: "6. Service d'affectation" },
  { key: 'dates_conformes', label: '7. Période de stage' },
  { key: 'signature_conforme', label: '8. Signatures & cachets' },
  { key: 'dossier_physique_present', label: '9. Dossier papier présent' }
];

export default function CorrectionModal({ dossier, onClose, onResubmit, referentiels, currentUser }) {
  if (!dossier) return null;

  const [formData, setFormData] = useState({
    nom: dossier.candidat.nom || '',
    prenoms: dossier.candidat.prenoms || '',
    sexe: dossier.candidat.sexe || 'FEMME',
    date_naissance: dossier.candidat.date_naissance || '',
    lieu_naissance: dossier.candidat.lieu_naissance || 'BOUAKÉ',
    sous_prefecture_naissance: dossier.candidat.sous_prefecture_naissance || 'BOUAKÉ',
    handicap: dossier.candidat.handicap || false,
    autre_type_handicap: dossier.candidat.autre_type_handicap || '',
    nature_piece_identite: dossier.candidat.nature_piece_identite || 'Carte CNI blanc',
    numero_piece_identite: dossier.candidat.numero_piece_identite || '',
    contact_1: dossier.candidat.contact_1 || '',
    contact_2: dossier.candidat.contact_2 || '',
    niveau_etude: dossier.candidat.niveau_etude || 'BTS',
    etablissement_frequente: dossier.candidat.etablissement_frequente || '',
    type_enseignement: dossier.candidat.type_enseignement || 'Professionnelle public',
    sous_prefecture_residence: dossier.candidat.sous_prefecture_residence || 'BOUAKÉ',
    localite_residence_habituelle: dossier.candidat.localite_residence_habituelle || 'BOUAKÉ',

    type_paiement: dossier.candidat.type_paiement || 'Trésor Money',
    numero_paiement: dossier.candidat.numero_paiement || '',
    nom_prenoms_tuteur: dossier.candidat.tuteur?.nom_prenoms || '',
    lien_parente_tuteur: dossier.candidat.tuteur?.lien_parente || 'Père',
    contact_tuteur: dossier.candidat.tuteur?.contact || '',

    entreprise_nom: dossier.entreprise.raison_sociale || '',
    entreprise_branche: dossier.entreprise.branche_activite || 'Santé & Médical',
    entreprise_type: dossier.entreprise.type_entreprise || 'Privé',
    entreprise_contact_1: dossier.entreprise.contact_1 || '',
    entreprise_contact_2: dossier.entreprise.contact_2 || '',
    service_affectation: dossier.service_affectation || '',
    date_debut_stage: dossier.date_debut_stage || '',
    date_fin_previsionnelle: dossier.date_fin_previsionnelle || '',
    sous_prefecture_lieu_stage: dossier.sous_prefecture_lieu_stage || 'BOUAKÉ',
    departement_administratif_stage: dossier.departement_administratif_stage || 'BOUAKÉ',
    localite_lieu_stage: dossier.localite_lieu_stage || 'BOUAKÉ'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [correctedPoints, setCorrectedPoints] = useState(() => Object.fromEntries(verificationItemsLabels.map(({ key }) => [key, dossier.checklist?.[key] === true])));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMsg('');
  };

  const handleCorrectionCheck = (key, checked) => {
    setCorrectedPoints((previous) => ({ ...previous, [key]: checked }));
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const pendingPoints = verificationItemsLabels.filter(({ key }) => dossier.checklist?.[key] !== true && !correctedPoints[key]);
    if (pendingPoints.length) {
      setErrorMsg(`Corrigez puis cochez tous les points concernés avant de resoumettre : ${pendingPoints.map(({ label }) => label).join(', ')}.`);
      return;
    }

    if (!formData.nom || !formData.prenoms || !formData.date_naissance || !formData.numero_piece_identite || !formData.contact_1) {
      setErrorMsg("Veuillez remplir le Nom, Prénoms, Date de Naissance, N° Pièce et Contact 1.");
      return;
    }

    if (!isValidCalendarDate(formData.date_naissance)) {
      setErrorMsg("La Date de Naissance est invalide (Format requis : JJ/MM/AAAA).");
      return;
    }

    if (!isValidPhone(formData.contact_1)) {
      setErrorMsg("Le Contact 1 doit contenir exactement 10 chiffres (ex: 0502837295).");
      return;
    }

    if (!isValidPhone(formData.numero_paiement)) {
      setErrorMsg("Le N° de Paiement doit contenir exactement 10 chiffres (ex: 0502837295).");
      return;
    }

    if (!formData.entreprise_nom || !formData.service_affectation || !formData.date_debut_stage) {
      setErrorMsg("Veuillez renseigner l'Entreprise, le Service d'Affectation et la Date de Début.");
      return;
    }

    if (!isValidPhone(formData.entreprise_contact_1) || (formData.entreprise_contact_2 && !isValidPhone(formData.entreprise_contact_2))) {
      setErrorMsg("Les contacts de l'entreprise doivent comporter exactement 10 chiffres.");
      return;
    }

    if (!isValidCalendarDate(formData.date_debut_stage) || !isValidCalendarDate(formData.date_fin_previsionnelle)) {
      setErrorMsg("La Date de Début du Stage est invalide (Format requis : JJ/MM/AAAA).");
      return;
    }

    if (!isDateRangeValid(formData.date_debut_stage, formData.date_fin_previsionnelle)) {
      setErrorMsg('La date de fin doit être postérieure ou égale à la date de début.');
      return;
    }

    const payload = {
      candidat: {
        nom: formData.nom.trim().toUpperCase(),
        prenoms: formData.prenoms.trim().toUpperCase(),
        sexe: formData.sexe,
        date_naissance: formData.date_naissance.trim(),
        lieu_naissance: formData.lieu_naissance,
        sous_prefecture_naissance: formData.sous_prefecture_naissance,
        handicap: formData.handicap,
        autre_type_handicap: formData.autre_type_handicap?.trim() || '',
        nature_piece_identite: formData.nature_piece_identite,
        numero_piece_identite: formData.numero_piece_identite.trim().toUpperCase(),
        contact_1: formData.contact_1.trim(),
        contact_2: formData.contact_2.trim(),
        niveau_etude: formData.niveau_etude,
        etablissement_frequente: (formData.etablissement_frequente || '').toUpperCase(),
        type_enseignement: formData.type_enseignement,
        sous_prefecture_residence: formData.sous_prefecture_residence,
        localite_residence_habituelle: formData.localite_residence_habituelle,
        type_paiement: formData.type_paiement,
        numero_paiement: formData.numero_paiement.trim(),
        tuteur: {
          nom_prenoms: (formData.nom_prenoms_tuteur || '').toUpperCase(),
          lien_parente: formData.lien_parente_tuteur,
          contact: (formData.contact_tuteur || '').trim()
        }
      },
      entreprise: {
        raison_sociale: formData.entreprise_nom.trim().toUpperCase(),
        branche_activite: formData.entreprise_branche,
        type_entreprise: formData.entreprise_type,
        contact_1: formData.entreprise_contact_1,
        contact_2: formData.entreprise_contact_2,
        sous_prefecture: formData.sous_prefecture_lieu_stage,
        localite: formData.localite_lieu_stage
      },
      service_affectation: formData.service_affectation.toUpperCase(),
      date_debut_stage: formData.date_debut_stage.trim(),
      date_fin_previsionnelle: formData.date_fin_previsionnelle.trim()
      , correction_points: correctedPoints
    };

    onResubmit(dossier.id, payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Formulaire de Correction de Dossier</h3>
              <p className="text-xs text-slate-400">Dossier : <span className="font-mono text-amber-400 font-bold">{dossier.id}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MOTIF DE CORRECTION DEMANDÉ PAR LE SERVICE INFO */}
        <div className="bg-rose-50 p-4 border-b border-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-rose-950 w-full">
            <span className="font-extrabold text-rose-700 uppercase tracking-wider block">
              Motif de la demande transmise par le Service Informatique :
            </span>
            <p className="font-bold text-slate-900 leading-relaxed bg-white p-3 rounded-lg border border-rose-200 mt-1 shadow-sm">
              "{dossier.motif_correction || 'Éléments non conformes détectés lors de la comparaison au dossier physique.'}"
            </p>
          </div>
        </div>

        {/* BILAN DE LA CHECKLIST DES 9 POINTS DE CONTRÔLE */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-aej-orange" />
              État des 9 Points de Contrôle Physico-Numérique :
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Vérifié par le Service Informatique
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {verificationItemsLabels.map(({ key, label }) => {
              const isOk = dossier.checklist?.[key] === true;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-2 rounded-lg border font-medium ${
                    isOk
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                  }`}
                >
                  <span className="truncate pr-1">{label}</span>
                  {isOk ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      <Check className="w-3 h-3" /> OK
                    </span>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-200/80 px-1.5 py-0.5 rounded">
                      <input type="checkbox" checked={Boolean(correctedPoints[key])} onChange={(event) => handleCorrectionCheck(key, event.target.checked)} />
                      {correctedPoints[key] ? <><Check className="w-3 h-3" /> Corrigé</> : <><X className="w-3 h-3" /> À corriger</>}
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="m-4 p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">

          {/* Section 1: Candidat */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              1. Identité du Bénéficiaire
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prénom(s) *</label>
                <input
                  type="text"
                  name="prenoms"
                  value={formData.prenoms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date de Naissance (JJ/MM/AAAA) *</label>
                <input
                  type="text"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">N° Pièce d'Identité *</label>
                <input
                  type="text"
                  name="numero_piece_identite"
                  value={formData.numero_piece_identite}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact 1 (10 Chiffres) *</label>
                <input
                  type="text"
                  name="contact_1"
                  maxLength={10}
                  value={formData.contact_1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">N° Paiement (10 Chiffres) *</label>
                <input
                  type="text"
                  name="numero_paiement"
                  maxLength={10}
                  value={formData.numero_paiement}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Entreprise */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              2. Entreprise & Stage d'Immersion
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Entreprise *</label>
                <input
                  type="text"
                  name="entreprise_nom"
                  value={formData.entreprise_nom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service d'Affectation *</label>
                <input
                  type="text"
                  name="service_affectation"
                  value={formData.service_affectation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date de Début (JJ/MM/AAAA) *</label>
                <input
                  type="text"
                  name="date_debut_stage"
                  value={formData.date_debut_stage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date de Fin Prévisionnelle *</label>
                <input
                  type="text"
                  name="date_fin_previsionnelle"
                  value={formData.date_fin_previsionnelle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Valider les Corrections & Resoumettre au Service Info</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
