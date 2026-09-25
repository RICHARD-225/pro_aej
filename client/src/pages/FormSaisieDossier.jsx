import React, { useEffect, useState } from 'react';
import { 
  User, 
  Phone, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,  
  Sparkles,
  UserCheck,
  Calendar
} from 'lucide-react';
import { isValidCalendarDate, isValidPhone, isDateRangeValid } from '../utils/validation';
import { toDossierPayload } from '../utils/dossierMappers';

export default function FormSaisieDossier({ onSubmit, onCancel, referentiels, currentUser, dossiers = [], conseillersList: providedList = [] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorField, setErrorField] = useState('');
  // submitAttempted : mis à true UNIQUEMENT quand l'utilisateur clique "Valider & Soumettre"
  // Jamais déclenché par la navigation entre étapes
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setErrorMsg('');
    setErrorField('');
    setSubmitAttempted(false);
  }, [currentStep]);

  // Défilement fluide et focus immédiat sur le champ en erreur
  const scrollToErrorField = (fieldName) => {
    setErrorField(fieldName);
    setTimeout(() => {
      const el = document.querySelector(`[name="${fieldName}"]`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  // Liste des conseillers régionaux pour attribution par le Service Info
  const conseillersList = providedList || [];
  const enterpriseSuggestions = dossiers.filter((dossier, index, list) => list.findIndex((item) => item.entreprise_id === dossier.entreprise_id) === index);
  const establishmentSuggestions = [...new Set(dossiers.map((dossier) => dossier.candidat.etablissement_frequente).filter(Boolean))];

  const [formData, setFormData] = useState({
    // Conseiller associé (Si la saisie est faite par le Service Info)
    conseiller_attribue_id: currentUser.role === 'SERVICE_INFO' ? (conseillersList[0]?.id || '') : currentUser.id,

    // Step 1: Beneficiaire
    nom: '',
    prenoms: '',
    sexe: 'FEMME',
    date_naissance: '',
    lieu_naissance: 'BOUAKÉ',
    sous_prefecture_naissance: 'BOUAKÉ',
    handicap: false,
    autre_type_handicap: '',
    nature_piece_identite: 'Carte CNI blanc',
    numero_piece_identite: '',
    contact_1: '',
    contact_2: '',
    niveau_etude: 'BTS',
    etablissement_frequente: '',
    type_enseignement: 'Professionnelle public',
    sous_prefecture_residence: 'BOUAKÉ',
    localite_residence_habituelle: 'BOUAKÉ',

    // Step 2: Paiement & Tuteur
    type_paiement: 'Trésor Money',
    numero_paiement: '',
    nom_prenoms_tuteur: '',
    lien_parente_tuteur: 'Père',
    contact_tuteur: '',

    // Step 3: Entreprise & Stage
    entreprise_nom: '',
    entreprise_branche: 'Santé & Médical',
    entreprise_type: 'Privé',
    entreprise_contact_1: '',
    entreprise_contact_2: '',
    service_affectation: '',
    date_debut_stage: '',
    date_fin_previsionnelle: '',
    sous_prefecture_lieu_stage: 'BOUAKÉ',
    departement_administratif_stage: 'BOUAKÉ',
    localite_lieu_stage: 'BOUAKÉ'
  });

  // Les champs HTML date utilisent le format ISO AAAA-MM-JJ, fiable pour le navigateur et l'API.
  const calculateOneMonthLater = (dateStr) => {
    if (!isValidCalendarDate(dateStr)) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const result = new Date(Date.UTC(year, month, 0));
    result.setUTCMonth(result.getUTCMonth() + 1);
    result.setUTCDate(Math.min(day, new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()));
    return result.toISOString().slice(0, 10);
  };

  const handleDateDebutChange = (e) => {
    const val = e.target.value;
    const autoEndDate = calculateOneMonthLater(val);
    setFormData(prev => ({
      ...prev,
      date_debut_stage: val,
      date_fin_previsionnelle: autoEndDate || prev.date_fin_previsionnelle
    }));
  };

  const handleSousPrefStageChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      sous_prefecture_lieu_stage: val,
      departement_administratif_stage: val
    }));
  };

  // Gestion de la date de naissance : affichage JJ/MM/AAAA avec calendrier
  const formatDateForDisplay = (isoDate) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDateForStorage = (displayDate) => {
    const match = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return '';
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  };

  const handleBirthDateChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);

    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }

    const isoDate = formatDateForStorage(value);

    setFormData(prev => ({
      ...prev,
      date_naissance: isoDate || value
    }));
    setErrorMsg('');
  };

  const handleBirthDateCalendarChange = (e) => {
    const isoDate = e.target.value;

    setFormData(prev => ({
      ...prev,
      date_naissance: isoDate
    }));
    setErrorMsg('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'contact_1' && (!prev.numero_paiement || prev.numero_paiement === prev.contact_1)) {
        updated.numero_paiement = value;
      }
      if (name === 'entreprise_nom') {
        const existing = enterpriseSuggestions.find((dossier) => dossier.entreprise.raison_sociale.toLowerCase() === value.trim().toLowerCase());
        if (existing) {
          updated.entreprise_branche = existing.entreprise.branche_activite || updated.entreprise_branche;
          updated.entreprise_type = existing.entreprise.type_entreprise || updated.entreprise_type;
          updated.entreprise_contact_1 = existing.entreprise.contact_1 || updated.entreprise_contact_1;
          updated.entreprise_contact_2 = existing.entreprise.contact_2 || updated.entreprise_contact_2;
          updated.sous_prefecture_lieu_stage = existing.entreprise.sous_prefecture || updated.sous_prefecture_lieu_stage;
          updated.departement_administratif_stage = existing.entreprise.sous_prefecture || updated.departement_administratif_stage;
          updated.localite_lieu_stage = existing.entreprise.localite || updated.localite_lieu_stage;
        }
      }
      return updated;
    });
    if (errorField === name) {
      setErrorField('');
      setErrorMsg('');
    }
    setErrorMsg('');
  };

  // Remplissage rapide d'essai
  const handleFillDemo = () => {
    const randomDigits = String(Math.floor(10000000 + Math.random() * 90000000)).padStart(8, '0');
    const phone1 = `05${randomDigits}`;
    const phoneTuteur = `07${randomDigits}`;
    const dateToday = "2026-01-07";
    setFormData({
      conseiller_attribue_id: conseillersList[0]?.id || '',
      nom: "KOUADIO",
      prenoms: "KOUAME BRICE",
      sexe: "HOMME",
      date_naissance: "2005-04-12",
      lieu_naissance: "BOUAKÉ",
      sous_prefecture_naissance: "BOUAKÉ",
      handicap: false,
      autre_type_handicap: "",
      nature_piece_identite: "Carte CNI blanc",
      numero_piece_identite: `CI009${randomDigits.substring(0, 6)}`,
      contact_1: phone1,
      contact_2: "",
      niveau_etude: "BTS",
      etablissement_frequente: "INPHB YAMOUSSOUKRO",
      type_enseignement: "Supérieur public",
      sous_prefecture_residence: "BOUAKÉ",
      localite_residence_habituelle: "BOUAKÉ",

      type_paiement: "Wave",
      numero_paiement: phone1,
      nom_prenoms_tuteur: "KOUADIO JEAN",
      lien_parente_tuteur: "Père",
      contact_tuteur: phoneTuteur,

      entreprise_nom: "SOGEPIE BOUAKÉ",
      entreprise_branche: "Informatique & Télécoms",
      entreprise_type: "Public non EPN",
      entreprise_contact_1: "0303040405",
      entreprise_contact_2: "",
      service_affectation: "MAINTENANCE SYSTEMES",
      date_debut_stage: dateToday,
      date_fin_previsionnelle: calculateOneMonthLater(dateToday),
      sous_prefecture_lieu_stage: "BOUAKÉ",
      departement_administratif_stage: "BOUAKÉ",
      localite_lieu_stage: "BOUAKÉ"
    });
    setErrorMsg('');
    setErrorField('');
    setSubmitAttempted(false);
  };

  // Validation étape par étape avec renvoi direct sur le champ en erreur
  const validateStep = (step) => {
    const fail = (field, msg) => {
      setErrorMsg(msg);
      scrollToErrorField(field);
      return false;
    };

    if (step === 1) {
      if (!formData.nom.trim()) {
        return fail('nom', "Erreur de saisie : Le champ 'Nom de Famille' est obligatoire.");
      }
      if (!formData.prenoms.trim()) {
        return fail('prenoms', "Erreur de saisie : Le champ 'Prénom(s)' est obligatoire.");
      }
      if (!formData.date_naissance.trim()) {
        return fail('date_naissance', "Erreur de saisie : Le champ 'Date de Naissance' est obligatoire.");
      }
      if (!isValidCalendarDate(formData.date_naissance)) {
        return fail('date_naissance', "Erreur de format : La 'Date de Naissance' doit suivre le format valide JJ/MM/AAAA (ex: 30/05/2006).");
      }
      if (!formData.numero_piece_identite.trim()) {
        return fail('numero_piece_identite', "Erreur de saisie : Le 'Numéro de Pièce d'Identité' est obligatoire.");
      }
      if (!formData.contact_1.trim()) {
        return fail('contact_1', "Erreur de saisie : Le champ 'Contact 1' est obligatoire.");
      }
      if (!isValidPhone(formData.contact_1)) {
        return fail('contact_1', "Erreur de format : Le 'Contact 1' doit comporter exactement 10 chiffres (ex: 0502837295).");
      }
      if (formData.contact_2 && !isValidPhone(formData.contact_2)) {
        return fail('contact_2', "Erreur de format : Le 'Contact 2' doit comporter exactement 10 chiffres (ex: 0707001122).");
      }
      if (!formData.etablissement_frequente.trim()) {
        return fail('etablissement_frequente', "Erreur de saisie : Le champ 'Établissement Fréquenté' est obligatoire.");
      }
      if (formData.handicap && !formData.autre_type_handicap.trim()) {
        return fail('autre_type_handicap', "Erreur de saisie : Le type de handicap doit être précisé.");
      }

      const normalizedPiece = formData.numero_piece_identite.trim().toUpperCase();
      const normalizedContact = formData.contact_1.trim();
      const duplicate = dossiers.find((dossier) =>
        dossier.candidat.numero_piece_identite?.trim().toUpperCase() === normalizedPiece ||
        dossier.candidat.contact_1?.trim() === normalizedContact
      );
      if (duplicate) {
        const samePiece = duplicate.candidat.numero_piece_identite?.trim().toUpperCase() === normalizedPiece;
        return fail(
          samePiece ? 'numero_piece_identite' : 'contact_1',
          samePiece
            ? "Doublon détecté : ce numéro de pièce d'identité existe déjà dans la base."
            : "Doublon détecté : ce contact candidat existe déjà dans la base."
        );
      }
    } else if (step === 2) {
      if (!formData.numero_paiement.trim()) {
        return fail('numero_paiement', "Erreur de saisie : Le 'N° de Paiement' est obligatoire.");
      }
      if (!isValidPhone(formData.numero_paiement)) {
        return fail('numero_paiement', "Erreur de format : Le 'N° de Paiement' doit comporter exactement 10 chiffres (ex: 0502837295).");
      }
      const duplicatePayment = dossiers.find((dossier) => dossier.candidat.numero_paiement?.trim() === formData.numero_paiement.trim());
      if (duplicatePayment) {
        return fail('numero_paiement', "Doublon détecté : ce numéro de paiement existe déjà dans la base.");
      }
      if (!formData.nom_prenoms_tuteur.trim()) {
        return fail('nom_prenoms_tuteur', "Erreur de saisie : Le 'Nom et Prénom(s) du Tuteur' est obligatoire.");
      }
      if (!formData.contact_tuteur.trim()) {
        return fail('contact_tuteur', "Erreur de saisie : Le 'Contact du Tuteur' est obligatoire.");
      }
      if (!isValidPhone(formData.contact_tuteur)) {
        return fail('contact_tuteur', "Erreur de format : Le 'Contact du Tuteur' doit comporter exactement 10 chiffres (ex: 0707087609).");
      }
    } else if (step === 3) {
      if (!formData.entreprise_nom.trim()) {
        return fail('entreprise_nom', "Erreur de saisie : Le 'Nom de l'Entreprise' est obligatoire.");
      }
      if (!formData.service_affectation.trim()) {
        return fail('service_affectation', "Erreur de saisie : Le 'Service d'Affectation' est obligatoire.");
      }
      if (!formData.entreprise_contact_1.trim()) {
        return fail('entreprise_contact_1', "Erreur de saisie : Le contact de l'entreprise est obligatoire.");
      }
      if (!isValidPhone(formData.entreprise_contact_1)) {
        return fail('entreprise_contact_1', "Erreur de format : Le contact de l'entreprise doit comporter exactement 10 chiffres.");
      }
      if (formData.entreprise_contact_2 && !isValidPhone(formData.entreprise_contact_2)) {
        return fail('entreprise_contact_2', "Erreur de format : Le contact secondaire de l'entreprise doit comporter exactement 10 chiffres.");
      }
      if (!formData.date_debut_stage.trim()) {
        return fail('date_debut_stage', "Erreur de saisie : La 'Date de Début du Stage' est obligatoire.");
      }
      if (!isValidCalendarDate(formData.date_debut_stage)) {
        return fail('date_debut_stage', "Erreur de format : La 'Date de Début du Stage' doit suivre le format valide JJ/MM/AAAA (ex: 07/01/2026).");
      }
      if (!formData.date_fin_previsionnelle.trim() || !isValidCalendarDate(formData.date_fin_previsionnelle)) {
        return fail('date_fin_previsionnelle', "Erreur de format : La 'Date de Fin Prévisionnelle' doit être une date valide JJ/MM/AAAA.");
      }
      if (!isDateRangeValid(formData.date_debut_stage, formData.date_fin_previsionnelle)) {
        return fail('date_fin_previsionnelle', "Erreur de cohérence : La date de fin doit être postérieure ou égale à la date de début.");
      }
    }
    setErrorMsg('');
    setErrorField('');
    return true;
  };

  const handleNext = () => {
    setErrorMsg('');
    setErrorField('');
    if (validateStep(currentStep)) {
      setErrorMsg('');
      setErrorField('');
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    setErrorField('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // handleFinalSubmit : appelé UNIQUEMENT par le bouton "Valider & Soumettre" à l'étape 3
  const handleFinalSubmit = () => {
    setSubmitAttempted(true);
    setErrorMsg('');
    setErrorField('');
    if (!validateStep(3)) {
      return;
    }
    const conseillerTarget = conseillersList.find(c => c.id === formData.conseiller_attribue_id) || conseillersList[0];
    onSubmit(toDossierPayload(formData, currentUser, conseillerTarget));
  };

  const getFieldBorderClass = (name) => {
    return errorField === name 
      ? '!border-rose-500 !ring-2 !ring-rose-400 !bg-rose-50/40' 
      : 'border-slate-200 focus:border-aej-orange';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header Card */}
      <div className="bg-orange-300 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-aej-orange font-extrabold text-[11px] uppercase tracking-wider">
              Formulaire de Saisie AEJ
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Saisie de Dossier d'Immersion</h2>
        </div>

        <button
          type="button"
          onClick={handleFillDemo}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-300"
          title="Pré-remplir le formulaire pour test"
        >
          <Sparkles className="w-4 h-4 text-aej-orange" />
          <span>Masque de saisie</span>
        </button>
      </div>

      {/* CHAMP OBLIGATOIRE SERVICE INFO : CONSEILLER ASSOCIÉ */}
      {currentUser.role === 'SERVICE_INFO' && (
        <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">
                Attribution par le Service Informatique
              </span>
              <span className="text-[11px] text-blue-700 font-medium">Sélectionnez le Conseiller référent pour ce dossier :</span>
            </div>
          </div>

          <select
            name="conseiller_attribue_id"
            value={formData.conseiller_attribue_id}
            onChange={handleChange}
            className="px-4 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {conseillersList.map(c => (
              <option key={c.id} value={c.id}>
                {c.prenoms} {c.nom} ({c.titre})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Wizard Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 px-2">
          <span className={currentStep === 1 ? 'text-aej-orange' : currentStep > 1 ? 'text-aej-green' : ''}>
            1. Bénéficiaire & Identité
          </span>
          <span className={currentStep === 2 ? 'text-aej-orange' : currentStep > 2 ? 'text-aej-green' : ''}>
            2. Paiement & Tuteur
          </span>
          <span className={currentStep === 3 ? 'text-aej-orange' : ''}>
            3. Entreprise & Immersion
          </span>
        </div>

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-aej-green to-aej-orange transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* EXPLICIT ERROR ALERT — uniquement après clic sur "Valider & Soumettre" */}
      {errorMsg && submitAttempted && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-3 animate-in shake">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Wizard Body */}
      <div className="space-y-6">

        {/* ÉTAPE 1 */}
        {currentStep === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-aej-orange flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Étape 1 : Identité du Candidat</h3>
                  <p className="text-xs text-slate-500">Renseignez les informations de la pièce d'identité.</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-400">Étape 1/3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Nom de Famille *</label>
                <input
                  type="text"
                  name="nom"
                  placeholder="ex: KABA"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('nom')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Prénom(s) du Bénéficiaire *</label>
                <input
                  type="text"
                  name="prenoms"
                  placeholder="ex: FOTOUMATA"
                  value={formData.prenoms}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('prenoms')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Genre / Sexe *</label>
                <select
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  <option value="FEMME">FEMME</option>
                  <option value="HOMME">HOMME</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Date de Naissance (Format JJ/MM/AAAA) *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="date_naissance"
                    placeholder="JJ/MM/AAAA"
                    value={formatDateForDisplay(formData.date_naissance)}
                    onChange={handleBirthDateChange}
                    maxLength={10}
                    inputMode="numeric"
                    className={`w-full px-4 py-2.5 pr-12 bg-slate-50 border rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('date_naissance')}`}
                  />

                  <label
                    htmlFor="date-naissance-calendar"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 cursor-pointer"
                    title="Choisir la date avec le calendrier"
                  >
                    <Calendar className="w-4 h-4 text-slate-600" />
                  </label>

                  <input
                    id="date-naissance-calendar"
                    type="date"
                    value={/^\d{4}-\d{2}-\d{2}$/.test(formData.date_naissance) ? formData.date_naissance : ''}
                    onChange={handleBirthDateCalendarChange}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                    tabIndex={-1}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Saisissez JJ/MM/AAAA *
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Lieu de Naissance *</label>
                <input
                  type="text"
                  name="lieu_naissance"
                  placeholder="ex: BOUAKÉ"
                  value={formData.lieu_naissance}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold uppercase focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Sous-Préfecture de Naissance *</label>
                <select
                  name="sous_prefecture_naissance"
                  value={formData.sous_prefecture_naissance}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  {referentiels.sous_prefectures.map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Nature de la Pièce d'Identité *</label>
                <select
                  name="nature_piece_identite"
                  value={formData.nature_piece_identite}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  {referentiels.natures_piece.map(np => (
                    <option key={np} value={np}>{np}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Numéro de Pièce d'Identité *</label>
                <input
                  type="text"
                  name="numero_piece_identite"
                  placeholder="ex: CI008311935 ou 21846751Q" 
                  maxLength={11}
                  value={formData.numero_piece_identite}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('numero_piece_identite')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Contact 1 (10 Chiffres) *</label>
                <input
                  type="text"
                  name="contact_1"
                  maxLength={10}
                  placeholder="ex: 0502837295"
                  value={formData.contact_1}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-extrabold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('contact_1')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Contact 2 (Optionnel)</label>
                <input
                  type="text"
                  name="contact_2"
                  maxLength={10}
                  placeholder="ex: 0707001122"
                  value={formData.contact_2}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('contact_2')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Niveau d'Étude *</label>
                <select
                  name="niveau_etude"
                  value={formData.niveau_etude}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  {referentiels.niveaux_etude.map(ne => (
                    <option key={ne} value={ne}>{ne}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Type d'Enseignement *</label>
                <select
                  name="type_enseignement"
                  value={formData.type_enseignement}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  {referentiels.types_enseignement.map(te => (
                    <option key={te} value={te}>{te}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Établissement Fréquenté *</label>
                <input
                  type="text"
                  name="etablissement_frequente"
                  placeholder="ex: LPMMS BOUAKÉ"
                  value={formData.etablissement_frequente}
                  onChange={handleChange}
                  list="etablissements-existants"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold uppercase focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('etablissement_frequente')}`}
                />
                <datalist id="etablissements-existants">{establishmentSuggestions.map((value) => <option key={value} value={value} />)}</datalist>
              </div>

            </div>

            <div className="pt-2 space-y-3">
              <label className="inline-flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors w-full sm:w-auto">
                <input
                  type="checkbox"
                  name="handicap"
                  checked={Boolean(formData.handicap)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      handicap: isChecked,
                      autre_type_handicap: isChecked ? prev.autre_type_handicap : ''
                    }));
                    setErrorMsg('');
                  }}
                  className="w-4 h-4 rounded text-aej-orange focus:ring-aej-orange cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Le bénéficiaire présente-t-il un handicap ? (Oui / Non)</span>
              </label>

              {Boolean(formData.handicap) && (
                <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-800">
                    Précisez la nature / le type de handicap *
                  </label>
                  <input
                    type="text"
                    name="autre_type_handicap"
                    placeholder="ex: Handicap moteur membre inférieur, malvoyant..."
                    value={formData.autre_type_handicap}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-bold focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('autre_type_handicap')}`}
                  />
                </div>
              )}
            </div>

          </div>
        )}

        {/* ÉTAPE 2 */}
        {currentStep === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-aej-green flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Étape 2 : Mode de Paiement & Contact du Tuteur</h3>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-400">Étape 2/3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Type de Paiement Mobile *</label>
                <select
                  name="type_paiement"
                  value={formData.type_paiement}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  {referentiels.types_paiement.map(tp => (
                    <option key={tp} value={tp}>{tp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">N° de Paiement (10 Chiffres ) *</label>
                <input
                  type="text"
                  name="numero_paiement"
                  maxLength={10}
                  placeholder="ex: 0502837295"
                  value={formData.numero_paiement}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('numero_paiement')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Nom et Prénom(s) du Tuteur *</label>
                <input
                  type="text"
                  name="nom_prenoms_tuteur"
                  placeholder="ex: KABA SAIDOU"
                  value={formData.nom_prenoms_tuteur}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('nom_prenoms_tuteur')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Lien de Parenté du Tuteur *</label>
                <select
                  name="lien_parente_tuteur"
                  value={formData.lien_parente_tuteur}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  {referentiels.liens_tuteur.map(lp => (
                    <option key={lp} value={lp}>{lp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Contact du Tuteur (10 Chiffres) *</label>
                <input
                  type="text"
                  name="contact_tuteur"
                  maxLength={10}
                  placeholder="ex: 0707087609"
                  value={formData.contact_tuteur}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('contact_tuteur')}`}
                />
              </div>

            </div>

          </div>
        )}

        {/* ÉTAPE 3 */}
        {currentStep === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Étape 3 : Entreprise d'Accueil & Période de Stage</h3>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-400">Étape 3/3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Nom / Raison Sociale de l'Entreprise *</label>
                <input
                  type="text"
                  name="entreprise_nom"
                  placeholder="ex: CLINIQUE MEDICAL BETHESDA BOUAKÉ"
                  value={formData.entreprise_nom}
                  onChange={handleChange}
                  list="entreprises-existantes"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-extrabold uppercase focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('entreprise_nom')}`}
                />
                <datalist id="entreprises-existantes">{enterpriseSuggestions.map((dossier) => <option key={dossier.entreprise_id} value={dossier.entreprise.raison_sociale} />)}</datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Type d'Entreprise *</label>
                <select
                  name="entreprise_type"
                  value={formData.entreprise_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  {referentiels.types_entreprise.map(te => (
                    <option key={te} value={te}>{te}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Branche d'Activité de l'Entreprise *</label>
                <select
                  name="entreprise_branche"
                  value={formData.entreprise_branche}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  {referentiels.branches_activite.map(ba => (
                    <option key={ba} value={ba}>{ba}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Service d'Affectation *</label>
                <input
                  type="text"
                  name="service_affectation"
                  placeholder="ex: SANTE / INFORMATIQUE"
                  value={formData.service_affectation}
                  onChange={handleChange}
                  list="services-existants"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('service_affectation')}`}
                />
                <datalist id="services-existants">{[...new Set(dossiers.map((dossier) => dossier.service_affectation).filter(Boolean))].map((value) => <option key={value} value={value} />)}</datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Contact Téléphonique Entreprise (10 chiffres) *</label>
                <input
                  type="text"
                  name="entreprise_contact_1"
                  maxLength={10}
                  placeholder="ex: 0102030405"
                  value={formData.entreprise_contact_1}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('entreprise_contact_1')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Contact Secondaire Entreprise (Optionnel)</label>
                <input
                  type="text"
                  name="entreprise_contact_2"
                  maxLength={10}
                  placeholder="ex: 0708091011"
                  value={formData.entreprise_contact_2}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('entreprise_contact_2')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Sous-Préfecture du Lieu de Stage *</label>
                <select
                  name="sous_prefecture_lieu_stage"
                  value={formData.sous_prefecture_lieu_stage}
                  onChange={handleSousPrefStageChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none"
                >
                  {referentiels.sous_prefectures.map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Département Administratif du Lieu de Stage</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">AUTO-SYNCHRONISÉ</span>
                </label>
                <input
                  type="text"
                  name="departement_administratif_stage"
                  readOnly
                  value={formData.departement_administratif_stage}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Date de Début (Format JJ/MM/AAAA) *</label>
                <input
                  type="date"
                  name="date_debut_stage"
                  placeholder="ex: 07/01/2026"
                  value={formData.date_debut_stage}
                  onChange={handleDateDebutChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-aej-orange/40 outline-none transition-all ${getFieldBorderClass('date_debut_stage')}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Date de Fin Prévisionnelle (1 mois)</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">AUTO (+1 MOIS)</span>
                </label>
                <input
                  type="date"
                  name="date_fin_previsionnelle"
                  placeholder="Calculé auto après la date de début..."
                  value={formData.date_fin_previsionnelle}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-emerald-50/60 border rounded-xl text-xs font-extrabold text-emerald-950 outline-none transition-all ${getFieldBorderClass('date_fin_previsionnelle')}`}
                />
              </div>

            </div>

          </div>
        )}

        {/* BOTTOM NAV */}
        <div className="flex items-center justify-between pt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-aej-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button" onClick={handleFinalSubmit}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-aej-green to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-700/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Valider & Soumettre le Dossier</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
