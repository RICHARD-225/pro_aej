import React, { useState } from 'react';
import { CalendarDays, ChevronDown, FileSearch, History, MapPin, Phone, ReceiptText } from 'lucide-react';
import StatusBadge from './StatusBadge';

function DossierRow({ dossier, onOpenChecklist, onOpenCorrection, onViewHistory, onPrimaryAction, primaryLabel, primaryIcon: PrimaryIcon = FileSearch, primaryTitle, secondaryContent }) {
  const [expanded, setExpanded] = useState(false);
  const firstLog = dossier.historique?.[0]?.date || `${dossier.date_saisie} à 09:00`;

  return (
    <article className="aej-dossier-row">
      <div className="aej-dossier-main">
        <div className="aej-dossier-id">
          <span className="aej-kicker">Dossier</span>
          <strong>{dossier.id}</strong>
          <span className="aej-date"><CalendarDays size={13} /> {firstLog}</span>
          <small className="text-[0.65rem] text-slate-500 font-bold">Conseiller : {dossier.conseiller_nom || 'Non attribué'}</small>
        </div>

        <div className="aej-dossier-person">
          <div className="aej-avatar">{dossier.candidat.nom?.slice(0, 1)}{dossier.candidat.prenoms?.slice(0, 1)}</div>
          <div className="min-w-0">
            <h3>{dossier.candidat.nom} {dossier.candidat.prenoms}</h3>
            <p><span>CNI {dossier.candidat.numero_piece_identite}</span><span><Phone size={12} /> {dossier.candidat.contact_1}</span></p>
          </div>
        </div>

        <div className="aej-dossier-place">
          <strong>{dossier.entreprise.raison_sociale}</strong>
          <span><MapPin size={12} /> {dossier.service_affectation || 'Service non précisé'}</span>
          <small>{dossier.date_debut_stage} → {dossier.date_fin_previsionnelle}</small>
        </div>

        <div className="aej-dossier-status">
          {dossier.statut_workflow !== 'ATTESTATION_GENEREE' && <StatusBadge status={dossier.statut_workflow} />}
          {dossier.candidat.etablissement_frequente && <span>{dossier.candidat.etablissement_frequente}</span>}
        </div>
      </div>

      <div className="aej-dossier-actions">
        <button type="button" className="aej-icon-button" onClick={() => setExpanded((value) => !value)} title={expanded ? 'Masquer les détails du candidat' : 'Voir les détails du candidat'} aria-label={expanded ? 'Masquer les détails du candidat' : 'Voir les détails du candidat'}>
          <ChevronDown size={16} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
        <button type="button" className="aej-icon-button" onClick={() => onViewHistory?.(dossier)} title="Voir l'historique">
          <History size={16} />
        </button>
        {onOpenCorrection && dossier.statut_workflow === 'CORRECTION_DEMANDEE' ? (
          <button type="button" className="aej-action-button aej-action-primary" onClick={() => onOpenCorrection(dossier)} title="Corriger et resoumettre le dossier">
            <FileSearch size={15} /> Corriger
          </button>
        ) : onOpenChecklist && (
          <button type="button" className="aej-action-button aej-action-neutral" onClick={() => onOpenChecklist(dossier)}>
            <FileSearch size={15} /> Contrôle
          </button>
        )}
        {onPrimaryAction && (
          <button type="button" className="aej-action-button aej-action-primary" onClick={() => onPrimaryAction(dossier)} title={primaryTitle}>
            <PrimaryIcon size={15} /> {primaryLabel}
          </button>
        )}
        {secondaryContent}
      </div>
      {expanded && (
        <div className="col-span-full mt-3 grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 text-xs text-slate-600 md:grid-cols-3">
          <div><strong className="block text-slate-800">Identité</strong><span>Naissance : {dossier.candidat.date_naissance || 'Non renseignée'}</span><br /><span>Lieu : {dossier.candidat.lieu_naissance || 'Non renseigné'}</span></div>
          <div><strong className="block text-slate-800">Contacts</strong><span>Secondaire : {dossier.candidat.contact_2 || 'Non renseigné'}</span><br /><span>Paiement : {dossier.candidat.type_paiement || ''} {dossier.candidat.numero_paiement || 'Non renseigné'}</span></div>
          <div><strong className="block text-slate-800">Formation et résidence</strong><span>{dossier.candidat.niveau_etude || 'Niveau non renseigné'} · {dossier.candidat.etablissement_frequente || 'Établissement non renseigné'}</span><br /><span>{dossier.candidat.localite_residence_habituelle || 'Résidence non renseignée'}</span></div>
          <div><strong className="block text-slate-800">Tuteur</strong><span>{dossier.candidat.tuteur?.nom_prenoms || 'Non renseigné'}</span><br /><span>{dossier.candidat.tuteur?.contact || 'Contact non renseigné'} · {dossier.candidat.tuteur?.lien_parente || 'Lien non renseigné'}</span></div>
          <div><strong className="block text-slate-800">Entreprise</strong><span>{dossier.entreprise.raison_sociale}</span><br /><span>{dossier.entreprise.type_entreprise || ''} · {dossier.entreprise.branche_activite || 'Secteur non renseigné'}</span><br /><span>{dossier.entreprise.contact_1 || 'Contact non renseigné'}</span></div>
        </div>
      )}
    </article>
  );
}

export default function DossierList({ dossiers, emptyMessage, onOpenChecklist, onOpenCorrection, onViewHistory, primaryLabel, primaryIcon, primaryTitle, onPrimaryAction, secondaryContent }) {
  return (
    <div className="aej-dossier-list">
      {dossiers.length === 0 ? (
        <div className="aej-empty-state">
          <ReceiptText size={28} />
          <strong>Aucun dossier trouvé</strong>
          <span>{emptyMessage}</span>
        </div>
      ) : dossiers.map((dossier) => (
        <DossierRow
          key={dossier.id}
          dossier={dossier}
          onOpenChecklist={onOpenChecklist}
          onOpenCorrection={onOpenCorrection}
          onViewHistory={onViewHistory}
          onPrimaryAction={onPrimaryAction}
          primaryLabel={primaryLabel}
          primaryIcon={primaryIcon}
          primaryTitle={primaryTitle}
          secondaryContent={secondaryContent?.(dossier)}
        />
      ))}
    </div>
  );
}
