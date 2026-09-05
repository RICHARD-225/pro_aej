// Données de Démonstration Normalisées AEJ Bouaké

export const SOUS_PREFECTURES_CI = [
  "BOUAKÉ",
  "ABIDJAN (COCODY)",
  "ABIDJAN (YOPOUGON)",
  "ABIDJAN (ADJAMÉ)",
  "ABIDJAN (ABOBO)",
  "ABIDJAN (TREICHVILLE)",
  "ABIDJAN (KOUMASSI)",
  "ABIDJAN (MARCORY)",
  "ABIDJAN (PORT-BOUËT)",
  "ABIDJAN (ATTÉCOUBÉ)",
  "YAMOUSSOUKRO",
  "KORHOGO",
  "SAN-PEDRO",
  "DALOA",
  "MAN",
  "GAGNOA",
  "SOUBRÉ",
  "DIVO",
  "ANYAMA",
  "BINGERVILLE",
  "ASSIKOI",
  "BOUAFLÉ",
  "BONDOUKOU",
  "ABENGOUROU",
  "AGBOVILLE",
  "FERKESSEDOUGOU",
  "SÉGUÉLA",
  "ODIENNÉ",
  "AUTRE SOUS-PRÉFECTURE (CI)"
];

export const REFERENTIELS = {
  sous_prefectures: SOUS_PREFECTURES_CI,
  sexes: ["FEMME", "HOMME"],
  natures_piece: [
    "Carte CNI blanc",
    "Carte CNI orange",
    "Carte scolaire",
    "Passeport",
    "Attestation d'identité",
    "Extrait de naissance",
    "Autre"
  ],
  niveaux_etude: ["CAP", "BT", "BTS", "Licence", "Master", "Doctorat", "Sans diplôme"],
  types_enseignement: [
    "Générale public",
    "Générale privé",
    "Technique public",
    "Technique privé",
    "Professionnelle public",
    "Professionnelle privé",
    "Supérieur public",
    "Supérieur privé"
  ],
  types_paiement: ["Trésor Money", "Wave"],
  liens_tuteur: [
    "Père",
    "Mère",
    "Frère",
    "Sœur",
    "Oncle",
    "Tante",
    "Grand-parent",
    "Tuteur légal",
    "Autre"
  ],
  types_entreprise: ["Privé", "Public non EPN", "EPN"],
  branches_activite: [
    "Santé & Médical",
    "Commerce & Distribution",
    "Informatique & Télécoms",
    "BTP & Construction",
    "Agriculture & Agro-industrie",
    "Éducation & Formation",
    "Transport & Logistique",
    "Restauration & Hôtellerie",
    "Services & Administration",
    "Autre"
  ]
};

export const INITIAL_USERS = [
  {
    id: "user-cons-1",
    nom: "KOUAME",
    prenoms: "Yao Richard",
    email: "richard.kouame@emploi.ci",
    role: "CONSEILLER",
    titre: "Conseiller Emploi #1",
    agence_regionale: "BOUAKÉ",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "user-cons-2",
    nom: "KOFFI",
    prenoms: "Affoué Patricia",
    email: "patricia.koffi@emploi.ci",
    role: "CONSEILLER",
    titre: "Conseiller Emploi #2",
    agence_regionale: "BOUAKÉ",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "user-cons-3",
    nom: "KONAN",
    prenoms: "Brou Stéphane",
    email: "stephane.konan@emploi.ci",
    role: "CONSEILLER",
    titre: "Conseiller Emploi #3",
    agence_regionale: "BOUAKÉ",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "user-info-1",
    nom: "DIABATE",
    prenoms: "Lamine",
    email: "service.info@emploi.ci",
    role: "SERVICE_INFO",
    titre: "Chef Service Informatique",
    agence_regionale: "BOUAKÉ",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "user-dir-1",
    nom: "TOURE",
    prenoms: "Ibrahim",
    email: "direction@emploi.ci",
    role: "DIRECTION",
    titre: "Directeur Régional AEJ Bouaké",
    agence_regionale: "BOUAKÉ",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
  }
];

export const INITIAL_DOSSIERS = [
  {
    id: "IMM-2026-000154",
    numero_ordre_excel: 1,
    date_saisie: "29/06/2026",
    agence_regionale: "BOUAKÉ",
    candidat: {
      nom: "KABA",
      prenoms: "FOTOUMATA",
      sexe: "FEMME",
      date_naissance: "30/05/2006",
      lieu_naissance: "BOUAKÉ",
      sous_prefecture_naissance: "BOUAKÉ",
      handicap: false,
      nature_piece_identite: "Carte scolaire",
      numero_piece_identite: "21846751Q",
      contact_1: "0502837295",
      contact_2: "",
      niveau_etude: "CAP",
      etablissement_frequente: "LPMMS BOUAKÉ",
      type_enseignement: "Professionnelle public",
      sous_prefecture_residence: "BOUAKÉ",
      localite_residence_habituelle: "BOUAKÉ",
      type_paiement: "Trésor Money",
      numero_paiement: "0502837295",
      tuteur: {
        nom_prenoms: "KABA SAIDOU",
        lien_parente: "Père",
        contact: "0707087609"
      }
    },
    entreprise: {
      raison_sociale: "CLINIQUE MEDICAL BETHESDA BOUAKÉ",
      contact_1: "0757262513",
      contact_2: "",
      branche_activite: "Santé & Médical",
      type_entreprise: "Privé",
      sous_prefecture: "BOUAKÉ",
      localite: "BOUAKÉ"
    },
    dispositif: "IMMERSION",
    service_affectation: "SANTE",
    date_debut_stage: "07/01/2026",
    date_fin_previsionnelle: "07/02/2026",
    departement_administratif_stage: "BOUAKÉ",
    sous_prefecture_lieu_stage: "BOUAKÉ",
    localite_lieu_stage: "BOUAKÉ",
    statut_workflow: "SOUMIS",
    conseiller_id: "user-cons-1",
    conseiller_nom: "KOUAME Yao Richard",
    checklist: {
      identite_conforme: false,
      telephone_conforme: false,
      piece_identite_conforme: false,
      convention_conforme: false,
      entreprise_conforme: false,
      poste_conforme: false,
      dates_conformes: false,
      signature_conforme: false,
      dossier_physique_present: false,
      observations_controle: ""
    },
    historique: [
      { date: "29/06/2026 à 09:42:15", auteur: "KOUAME Yao Richard (Conseiller)", action: "Saisie et Soumission initiale", statut: "SOUMIS" }
    ]
  },
  {
    id: "IMM-2026-000155",
    numero_ordre_excel: 2,
    date_saisie: "29/06/2026",
    agence_regionale: "BOUAKÉ",
    candidat: {
      nom: "KONATE",
      prenoms: "SANATA",
      sexe: "FEMME",
      date_naissance: "02/03/2007",
      lieu_naissance: "ASSIKOI",
      sous_prefecture_naissance: "ASSIKOI",
      handicap: false,
      nature_piece_identite: "Carte CNI blanc",
      numero_piece_identite: "CI008311935",
      contact_1: "0584108784",
      contact_2: "",
      niveau_etude: "CAP",
      etablissement_frequente: "LPMMS BOUAKÉ",
      type_enseignement: "Professionnelle public",
      sous_prefecture_residence: "BOUAKÉ",
      localite_residence_habituelle: "BOUAKÉ",
      type_paiement: "Trésor Money",
      numero_paiement: "0584108784",
      tuteur: {
        nom_prenoms: "KONATE ADAMA",
        lien_parente: "Frère",
        contact: "0173444511"
      }
    },
    entreprise: {
      raison_sociale: "CLINIQUE MEDICAL BETHESDA BOUAKÉ",
      contact_1: "0757262513",
      contact_2: "",
      branche_activite: "Santé & Médical",
      type_entreprise: "Privé",
      sous_prefecture: "BOUAKÉ",
      localite: "BOUAKÉ"
    },
    dispositif: "IMMERSION",
    service_affectation: "SANTE",
    date_debut_stage: "07/01/2026",
    date_fin_previsionnelle: "07/02/2026",
    departement_administratif_stage: "BOUAKÉ",
    sous_prefecture_lieu_stage: "BOUAKÉ",
    localite_lieu_stage: "BOUAKÉ",
    statut_workflow: "VALIDE",
    conseiller_id: "user-cons-1",
    conseiller_nom: "KOUAME Yao Richard",
    checklist: {
      identite_conforme: true,
      telephone_conforme: true,
      piece_identite_conforme: true,
      convention_conforme: true,
      entreprise_conforme: true,
      poste_conforme: true,
      dates_conformes: true,
      signature_conforme: true,
      dossier_physique_present: true,
      observations_controle: "Dossier 100% conforme au papier"
    },
    historique: [
      { date: "29/06/2026 à 09:50:00", auteur: "KOUAME Yao Richard (Conseiller)", action: "Création et soumission", statut: "SOUMIS" },
      { date: "29/06/2026 à 14:15:30", auteur: "DIABATE Lamine (Service Info)", action: "Vérification Physico-Numérique 9/9 Conforme - Validation Finale", statut: "VALIDE" }
    ]
  },
  {
    id: "IMM-2026-000156",
    numero_ordre_excel: 3,
    date_saisie: "30/06/2026",
    agence_regionale: "BOUAKÉ",
    candidat: {
      nom: "YAPO",
      prenoms: "JEAN-LUC",
      sexe: "HOMME",
      date_naissance: "15/08/2004",
      lieu_naissance: "AGBOVILLE",
      sous_prefecture_naissance: "AGBOVILLE",
      handicap: false,
      nature_piece_identite: "Carte CNI orange",
      numero_piece_identite: "CI009112233",
      contact_1: "0709887766",
      contact_2: "",
      niveau_etude: "BTS",
      etablissement_frequente: "GATL BOUAKÉ",
      type_enseignement: "Technique privé",
      sous_prefecture_residence: "BOUAKÉ",
      localite_residence_habituelle: "BOUAKÉ",
      type_paiement: "Wave",
      numero_paiement: "0709887766",
      tuteur: {
        nom_prenoms: "YAPO ARNAUD",
        lien_parente: "Père",
        contact: "0505112233"
      }
    },
    entreprise: {
      raison_sociale: "ORANGE CÔTE D'IVOIRE (AGENCE BOUAKÉ)",
      contact_1: "0506070809",
      contact_2: "",
      branche_activite: "Informatique & Télécoms",
      type_entreprise: "Privé",
      sous_prefecture: "BOUAKÉ",
      localite: "BOUAKÉ"
    },
    dispositif: "IMMERSION",
    service_affectation: "SERVICE CLIENTELE",
    date_debut_stage: "01/07/2026",
    date_fin_previsionnelle: "01/08/2026",
    departement_administratif_stage: "BOUAKÉ",
    sous_prefecture_lieu_stage: "BOUAKÉ",
    localite_lieu_stage: "BOUAKÉ",
    statut_workflow: "CORRECTION_DEMANDEE",
    motif_correction: "Format du numéro de CNI illisible sur la copie physique fournies.",
    conseiller_id: "user-cons-2",
    conseiller_nom: "KOFFI Affoué Patricia",
    checklist: {
      identite_conforme: true,
      telephone_conforme: true,
      piece_identite_conforme: false,
      convention_conforme: true,
      entreprise_conforme: true,
      poste_conforme: true,
      dates_conformes: true,
      signature_conforme: true,
      dossier_physique_present: true,
      observations_controle: "CNI non lisible sur le physique"
    },
    historique: [
      { date: "30/06/2026 à 10:10:00", auteur: "KOFFI Affoué Patricia (Conseiller)", action: "Saisie et Soumission", statut: "SOUMIS" },
      { date: "30/06/2026 à 11:45:12", auteur: "DIABATE Lamine (Service Info)", action: "Refus physico-numérique : Pièce d'identité non conforme", statut: "CORRECTION_DEMANDEE" }
    ]
  }
];
