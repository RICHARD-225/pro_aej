import React, { useMemo } from 'react';
import { Building2, Download, X } from 'lucide-react';

export default function AttestationEntreprisePreview({ entrepriseId, dossiers, onClose, onDownload }) {
  // L'aperçu utilise les mêmes données que le PDF : uniquement les dossiers validés.
  const validDossiers = useMemo(() => dossiers.filter((dossier) => (
    dossier.entreprise_id === entrepriseId && ['VALIDE', 'ATTESTATION_GENEREE'].includes(dossier.statut_workflow)
  )), [dossiers, entrepriseId]);
  const first = validDossiers[0];
  if (!first) return null;

  const entreprise = first.entreprise;
  const startDate = validDossiers.reduce((earliest, dossier) => dossier.date_debut_stage < earliest ? dossier.date_debut_stage : earliest, first.date_debut_stage);
  const endDate = validDossiers.reduce((latest, dossier) => dossier.date_fin_previsionnelle > latest ? dossier.date_fin_previsionnelle : latest, first.date_fin_previsionnelle);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="text-emerald-400" />
            <div><h3 className="font-bold text-sm">Aperçu de l'attestation entreprise</h3><p className="text-xs text-slate-400">{entreprise.raison_sociale} - {validDossiers.length} stagiaire(s)</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onDownload(entrepriseId)} className="inline-flex items-center gap-2 rounded-lg bg-aej-orange px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"><Download size={15} /> Télécharger le PDF</button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white" title="Fermer"><X size={19} /></button>
          </div>
        </div>

        {/* Zone du document A4 : les styles ci-dessous servent uniquement à l'aperçu écran. */}
        <div className="max-h-[82vh] overflow-y-auto p-6 sm:p-10 text-slate-900" id="attestation-preview" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          {/* En-tête officiel : logos, République et identité AEJ. */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3"><img src="/LOGO_MINISTERE.png" alt="Ministère" className="h-16 object-contain" /><div className="text-[10px]"><strong className="block uppercase">République de Côte d'Ivoire</strong><em>Union - Discipline - Travail</em><strong className="block mt-1 text-aej-green uppercase">Ministère de la Jeunesse</strong></div></div>
            <img src="/logo-aej.png" alt="Agence Emploi Jeunes" className="h-16 object-contain" />
          </div>
          {/* Programme et référence : conserver la référence exacte du modèle. */}
          <div className="text-center pt-7 pb-3 space-y-1"><h2 className="font-bold text-sm uppercase">Programme Spécial d'Immersion 2026</h2><p className="text-[11px] pt-3">N/Réf : ……………………/ ADMN/DOP/AEJ-BOUA</p></div>
          <div className="text-center pt-3 mb-5"><span className="inline-block border-2 border-slate-900 px-5 py-2 font-bold text-sm uppercase">Attestation de démarrage de stage d'immersion</span></div>
          <div className="text-[11px] leading-relaxed space-y-3 mb-5 pt-2"><strong className="underline">PREAMBULE :</strong><p className="border-l-2 border-slate-300 pl-2 italic">Dans le but d’accélérer le processus de formalisation de la prise en charge des stagiaires, nous vous saurions gré de bien vouloir remplir le formulaire ci-dessous qui marque le début effectif du stage d’immersion au sein de votre entreprise/structure.</p><p>Nous soussignés : <strong>Agence Régionale de {first.agence_regionale || 'Bouaké'} et {entreprise.raison_sociale}</strong> attestons que les élèves / étudiants ci-après listés :</p></div>
          {/* Tableau : modifier les intitulés ou les classes Tailwind pour changer son apparence. */}
          <table className="w-full border-2 border-slate-900 border-collapse text-[10px]"><thead className="bg-slate-100 uppercase font-bold"><tr><th className="border border-slate-900 p-2">N°</th><th className="border border-slate-900 p-2 text-left">NOM</th><th className="border border-slate-900 p-2 text-left">PRENOMS</th><th className="border border-slate-900 p-2">NIVEAU D'ETUDE / CLASSE</th><th className="border border-slate-900 p-2">N° TELEPHONE (TRESOR PAY)</th></tr></thead><tbody>{validDossiers.map((dossier, index) => <tr key={dossier.id}><td className="border border-slate-900 p-2 text-center font-bold">{index + 1}</td><td className="border border-slate-900 p-2 font-bold uppercase">{dossier.candidat.nom}</td><td className="border border-slate-900 p-2 uppercase">{dossier.candidat.prenoms}</td><td className="border border-slate-900 p-2 text-center font-bold">{dossier.candidat.niveau_etude}</td><td className="border border-slate-900 p-2 text-center font-bold">{dossier.candidat.numero_paiement}</td></tr>)}</tbody></table>
          <p className="text-[11px] leading-relaxed mt-4">ont effectivement démarré leur stage d’immersion d’un (01) mois, au sein de <strong className="uppercase">{entreprise.raison_sociale}</strong> du <strong>{startDate}</strong> au <strong>{endDate}</strong>.</p>
          {/* Signatures et pied de page. */}
          <div className="text-right text-[11px] mt-8">Fait à {first.agence_regionale || 'Bouaké'} le : ………………………</div>
          <div className="grid grid-cols-2 gap-8 text-center text-[11px] mt-10"><div><strong className="block uppercase">Pour {entreprise.raison_sociale}</strong><span className="block mt-8 italic text-slate-500">(Nom et fonction du signataire)</span></div><div><strong className="block">Pour l'Agence Emploi Jeunes</strong><span className="block mt-2 font-bold">{first.agence_directeur_titre || 'Le Directeur Régional'}</span><strong className="block mt-8 uppercase">{first.agence_directeur || 'Direction Régionale AEJ'}</strong></div></div>
          <div className="border-t border-slate-400 mt-8 pt-3 text-center text-[9px] font-semibold text-slate-600">BPV 108 ABIDJAN / Tél : 20 21 25 90 - 20 21 06 69 / Fax : 20 21 50 58</div>
        </div>
      </div>
    </div>
  );
}