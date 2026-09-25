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
    // Protection : ignorer les modifications sur les champs verrouillés
    if (!isFieldEditable(name)) return;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMsg('');
  };

  // Seuls les champs dont le point de contrôle a été rejeté (non validé) par le Service Info sont modifiables
  const isFieldEditable = (fieldName) => {
    if (!dossier?.checklist) return true;

    switch (fieldName) {
      case 'nom':
      case 'prenoms':
      case 'date_naissance':
      case 'sexe':
      case 'lieu_naissance':
      case 'sous_prefecture_naissance':
      case 'handicap':
      case 'autre_type_handicap':
        return dossier.checklist.identite_conforme !== true;

      case 'contact_1':
      case 'contact_2':
        return dossier.checklist.telephone_conforme !== true;

      case 'nature_piece_identite':
      case 'numero_piece_identite':
        return dossier.checklist.piece_identite_conforme !== true;

      case 'niveau_etude':
      case 'etablissement_frequente':
      case 'type_enseignement':
        return dossier.checklist.convention_conforme !== true;

      case 'numero_paiement':
        return dossier.checklist.telephone_conforme !== true || dossier.checklist.identite_conforme !== true;

      case 'entreprise_nom':
      case 'entreprise_branche':
      case 'entreprise_type':
      case 'entreprise_contact_1':
      case 'entreprise_contact_2':
      case 'sous_prefecture_lieu_stage':
      case 'localite_lieu_stage':
        return dossier.checklist.entreprise_conforme !== true;

      case 'service_affectation':
        return dossier.checklist.poste_conforme !== true;

      case 'date_debut_stage':
      case 'date_fin_previsionnelle':
        return dossier.checklist.dates_conformes !== true;

      case 'nom_prenoms_tuteur':
      case 'lien_parente_tuteur':
      case 'contact_tuteur':
        return dossier.checklist.signature_conforme !== true;

      default:
        return true;
    }
  };

  const getCorrectionFieldClass = (fieldName) => {
    const editable = isFieldEditable(fieldName);
    if (!editable) {
      return 'w-full px-3 py-2 bg-slate-100/90 border border-slate-200 rounded-xl font-bold text-slate-400 cursor-not-allowed select-none transition-all';
    }
    return 'w-full px-3 py-2 bg-white border-2 border-amber-400 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-aej-orange/40 outline-none shadow-sm transition-all';
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                1. Identité du Bénéficiaire & Contacts
              </h4>
              <span className="text-[10px] text-slate-400">
                Les champs validés sont automatiquement grisés
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Nom *</span>
                  {!isFieldEditable('nom') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="nom"
                  disabled={!isFieldEditable('nom')}
                  value={formData.nom}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('nom')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Prénom(s) *</span>
                  {!isFieldEditable('prenoms') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="prenoms"
                  disabled={!isFieldEditable('prenoms')}
                  value={formData.prenoms}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('prenoms')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Date de Naissance (JJ/MM/AAAA) *</span>
                  {!isFieldEditable('date_naissance') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="date_naissance"
                  disabled={!isFieldEditable('date_naissance')}
                  value={formData.date_naissance}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('date_naissance')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>N° Pièce d'Identité *</span>
                  {!isFieldEditable('numero_piece_identite') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="numero_piece_identite"
                  disabled={!isFieldEditable('numero_piece_identite')}
                  value={formData.numero_piece_identite}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('numero_piece_identite')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Contact 1 (10 Chiffres) *</span>
                  {!isFieldEditable('contact_1') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="contact_1"
                  maxLength={10}
                  disabled={!isFieldEditable('contact_1')}
                  value={formData.contact_1}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('contact_1')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Contact 2 (Optionnel)</span>
                  {!isFieldEditable('contact_2') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="contact_2"
                  maxLength={10}
                  disabled={!isFieldEditable('contact_2')}
                  value={formData.contact_2}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('contact_2')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>N° Paiement (10 Chiffres) *</span>
                  {!isFieldEditable('numero_paiement') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="numero_paiement"
                  maxLength={10}
                  disabled={!isFieldEditable('numero_paiement')}
                  value={formData.numero_paiement}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('numero_paiement')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Établissement Fréquenté</span>
                  {!isFieldEditable('etablissement_frequente') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="etablissement_frequente"
                  disabled={!isFieldEditable('etablissement_frequente')}
                  value={formData.etablissement_frequente}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('etablissement_frequente')}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Entreprise */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                2. Entreprise d'Accueil & Immersion
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Nom de l'Entreprise *</span>
                  {!isFieldEditable('entreprise_nom') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="entreprise_nom"
                  disabled={!isFieldEditable('entreprise_nom')}
                  value={formData.entreprise_nom}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('entreprise_nom')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Service d'Affectation *</span>
                  {!isFieldEditable('service_affectation') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="service_affectation"
                  disabled={!isFieldEditable('service_affectation')}
                  value={formData.service_affectation}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('service_affectation')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Contact Entreprise 1 *</span>
                  {!isFieldEditable('entreprise_contact_1') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="entreprise_contact_1"
                  maxLength={10}
                  disabled={!isFieldEditable('entreprise_contact_1')}
                  value={formData.entreprise_contact_1}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('entreprise_contact_1')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Contact Entreprise 2 (Optionnel)</span>
                  {!isFieldEditable('entreprise_contact_2') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="entreprise_contact_2"
                  maxLength={10}
                  disabled={!isFieldEditable('entreprise_contact_2')}
                  value={formData.entreprise_contact_2}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('entreprise_contact_2')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Date de Début (JJ/MM/AAAA) *</span>
                  {!isFieldEditable('date_debut_stage') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="date_debut_stage"
                  disabled={!isFieldEditable('date_debut_stage')}
                  value={formData.date_debut_stage}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('date_debut_stage')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Date de Fin Prévisionnelle *</span>
                  {!isFieldEditable('date_fin_previsionnelle') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="date_fin_previsionnelle"
                  disabled={!isFieldEditable('date_fin_previsionnelle')}
                  value={formData.date_fin_previsionnelle}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('date_fin_previsionnelle')}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Tuteur */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                3. Tuteur Légal & Contact d'Urgence
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Nom et Prénom(s) du Tuteur</span>
                  {!isFieldEditable('nom_prenoms_tuteur') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="nom_prenoms_tuteur"
                  disabled={!isFieldEditable('nom_prenoms_tuteur')}
                  value={formData.nom_prenoms_tuteur}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('nom_prenoms_tuteur')}
                />
              </div>

              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Contact du Tuteur</span>
                  {!isFieldEditable('contact_tuteur') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      À corriger
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="contact_tuteur"
                  maxLength={10}
                  disabled={!isFieldEditable('contact_tuteur')}
                  value={formData.contact_tuteur}
                  onChange={handleChange}
                  className={getCorrectionFieldClass('contact_tuteur')}
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
