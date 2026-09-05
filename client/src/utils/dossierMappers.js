export function toDossierPayload(formData, currentUser, conseiller) {
  return {
    conseiller_attribue: conseiller,
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
      etablissement_frequente: formData.etablissement_frequente.trim().toUpperCase(),
      type_enseignement: formData.type_enseignement,
      sous_prefecture_residence: formData.sous_prefecture_residence,
      localite_residence_habituelle: formData.localite_residence_habituelle,
      type_paiement: formData.type_paiement,
      numero_paiement: formData.numero_paiement.trim(),
      tuteur: {
        nom_prenoms: formData.nom_prenoms_tuteur.trim().toUpperCase(),
        lien_parente: formData.lien_parente_tuteur,
        contact: formData.contact_tuteur.trim()
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
    service_affectation: formData.service_affectation.trim().toUpperCase(),
    date_debut_stage: formData.date_debut_stage.trim(),
    date_fin_previsionnelle: formData.date_fin_previsionnelle.trim(),
    me: currentUser
  };
}
