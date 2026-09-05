import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const ministryLogoPath = path.resolve(currentDirectory, '../../client/public/LOGO_MINISTERE.png');
const aejLogoPath = path.resolve(currentDirectory, '../../client/public/logo-aej.png');
const frenchMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function formatLongDate(value) {
  const date = new Date(value);
  return `${String(date.getUTCDate()).padStart(2, '0')} ${frenchMonths[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatDateRange(dossiers) {
  const firstDate = dossiers.reduce((earliest, dossier) => dossier.dateDebutStage < earliest ? dossier.dateDebutStage : earliest, dossiers[0].dateDebutStage);
  const lastDate = dossiers.reduce((latest, dossier) => dossier.dateFinPrevisionnelle > latest ? dossier.dateFinPrevisionnelle : latest, dossiers[0].dateFinPrevisionnelle);
  return { start: formatLongDate(firstDate), end: formatLongDate(lastDate) };
}

function drawTableRow(document, values, y, height, header = false) {
  // Largeurs des cinq colonnes du tableau, en points PDF. La somme correspond
  // à la largeur utile A4 entre les marges x=48 et x=547.
  const widths = [28, 110, 145, 105, 139];
  let x = 48;
  document.font(header ? 'Times-Bold' : 'Times-Roman').fontSize(header ? 7.5 : 8);
  values.forEach((value, index) => {
    document.rect(x, y, widths[index], height).stroke();
    document.text(String(value ?? ''), x + 4, y + (header ? 7 : 6), { width: widths[index] - 8, height: height - 8, align: index === 0 || index > 2 ? 'center' : 'left' });
    x += widths[index];
  });
}

function drawPage(document, agency, enterprise, dossiers, reference, pageNumber, pageCount, startIndex) {
  // Coordonnées PDF : origine en haut à gauche, page A4 = 595 x 842 points.
  // Les blocs ci-dessous suivent l'ordre visuel du modèle officiel fourni.
  const pageWidth = 595.28;
  const range = formatDateRange(dossiers);
  const ministryLogo = fs.readFileSync(ministryLogoPath);
  const aejLogo = fs.readFileSync(aejLogoPath);

  // En-tête : les deux logos sont intégrés dans le fichier PDF, pas seulement affichés dans l'aperçu.
  document.font('Times-Roman').fillColor('#111827');
  document.image(ministryLogo, 48, 22, { fit: [105, 58], align: 'left', valign: 'top' });
  document.image(aejLogo, pageWidth - 158, 28, { fit: [110, 43], align: 'right', valign: 'top' });
  document.font('Times-Bold').fontSize(7).text('REPUBLIQUE DE COTE D’IVOIRE', 48, 84, { width: 130, align: 'center' });
  document.font('Times-Italic').fontSize(6.5).text('Union - Discipline - Travail', 48, 94, { width: 130, align: 'center' });
  document.moveTo(48, 108).lineTo(pageWidth - 48, 108).lineWidth(0.7).stroke('#111827');

  // Titre du programme, référence fixe du modèle et titre encadré de l'attestation.
  document.font('Times-Bold').fontSize(16).text('PROGRAMME SPECIAL D’IMMERSION 2026', 48, 126, { width: pageWidth - 96, align: 'center' });
  document.font('Times-Roman').fontSize(8).text('N/Réf : ……………………/ ADMN/DOP/AEJ-BOUA', 48, 158, { width: pageWidth - 96, align: 'right' });
  document.font('Times-Bold').fontSize(14).text('ATTESTATION DE DEMARRAGE DE STAGE D’IMMERSION', 48, 190, { width: pageWidth - 96, align: 'center' });
  document.rect(95, 185, pageWidth - 190, 26).lineWidth(1.1).stroke('#111827');

  // Texte officiel d'introduction et identification de l'entreprise d'accueil.
  document.font('Times-Bold').fontSize(10).text('PREAMBULE :', 48, 232);
  document.font('Times-Italic').fontSize(11).text('Dans le but d’accélérer le processus de formalisation de la prise en charge des stagiaires, nous vous saurions gré de bien vouloir remplir le formulaire ci-dessous qui marque le début effectif du stage d’immersion au sein de votre entreprise/structure.', 48, 248, { width: pageWidth - 96, align: 'justify', lineGap: 2 });
  document.font('Times-Roman').fontSize(12).text('Nous soussignés :', 48, 302);
  document.font('Times-Bold').text(`Agence Régionale de ${agency.ville} et ${enterprise.raisonSociale}`, 48, 318, { width: pageWidth - 96 });
  document.font('Times-Roman').text('attestons que les élèves / étudiants ci-après listés :', 48, 334);

  // Tableau des stagiaires. Modifier ici les intitulés, les colonnes ou les hauteurs de lignes.
  drawTableRow(document, ['N°', 'NOM', 'PRENOMS', 'NIVEAU D’ETUDE / CLASSE', 'N° TELEPHONE (TRESOR PAY)'], 358, 31, true);
  dossiers.forEach((dossier, index) => {
    drawTableRow(document, [startIndex + index + 1, dossier.candidat.nom, dossier.candidat.prenoms, dossier.candidat.niveauEtude, dossier.candidat.numeroPaiement], 389 + index * 23, 23);
  });

  const tableEnd = 389 + dossiers.length * 23;
  document.font('Times-Roman').fontSize(12).text(`ont effectivement démarré leur stage d’immersion d’un (01) mois, au sein de ${enterprise.raisonSociale} du ${range.start} au ${range.end}.`, 48, tableEnd + 18, { width: pageWidth - 96, align: 'justify', lineGap: 0.5 });
  // Bloc final : date, signatures et pied de page officiel.
  const signatureY = Math.max(tableEnd + 76, 500);
  document.text(`Fait à ${agency.ville} le : ………………………`, pageWidth - 220, signatureY, { width: 172, align: 'center' });
  document.moveDown(0.35);
  document.font('Times-Bold').text(`Pour ${enterprise.raisonSociale}`, 72, signatureY + 52, { width: 180, align: 'center' });
  document.font('Times-Italic').fontSize(12).text('(Fonction du Signataire)', 72, signatureY + 83, { width: 180, align: 'center' });
  document.text('(Nom du Signataire)', 72, signatureY + 139, { width: 180, align: 'center' });
  document.font('Times-Bold').fontSize(12).text('Pour l’Agence Emploi Jeunes', 350, signatureY + 52, { width: 160, align: 'center' });
  document.font('Times-Roman').fontSize(12).text('Le Chef d’Agence Régionale', 350, signatureY + 83, { width: 160, align: 'center' });
  document.font('Times-Bold').fontSize(12).text(`${agency.directeurPrenoms} ${agency.directeurNom}`, 350, signatureY + 139, { width: 160, align: 'center' });
  document.moveTo(48, 790).lineTo(pageWidth - 48, 790).lineWidth(0.5).stroke('#9ca3af');
  document.font('Times-Roman').fontSize(11).fillColor('#6b7280').text('BPV 108 ABIDJAN / Tél : 20 21 25 90 – 20 21 06 69 / Fax : 20 21 50 58', 48, 801, { width: pageWidth - 96, align: 'center' });
  if (pageCount > 1) document.text(`Page ${pageNumber}/${pageCount}`, pageWidth - 90, 801, { width: 42, align: 'right' });
}

export function buildEnterpriseAttestationPdf(agency, enterprise, dossiers, reference) {
  // Dix stagiaires maximum par page afin de préserver l'espace réservé aux signatures.
  const document = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, info: { Title: `Attestation entreprise ${enterprise.raisonSociale}`, Author: 'Agence Emploi Jeunes' } });
  const chunks = [];
  for (let index = 0; index < dossiers.length; index += 10) chunks.push(dossiers.slice(index, index + 10));
  const pages = chunks.length ? chunks : [[]];
  const buffers = [];
  document.on('data', (chunk) => buffers.push(chunk));
  const complete = new Promise((resolve, reject) => { document.on('end', () => resolve(Buffer.concat(buffers))); document.on('error', reject); });
  pages.forEach((chunk, index) => { document.addPage(); drawPage(document, agency, enterprise, chunk, reference, index + 1, pages.length, index * 10); });
  document.end();
  return complete;
}

export function buildEndStageAttestationPdf(agency, dossierOrDossiers, reference) {
  const dossiers = Array.isArray(dossierOrDossiers) ? dossierOrDossiers : [dossierOrDossiers];
  const firstDossier = dossiers[0];
  const document = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: {
      Title: `Attestation de fin de stage - ${firstDossier.candidat.nom} ${firstDossier.candidat.prenoms}`,
      Author: 'Agence Emploi Jeunes - Bouaké'
    }
  });
  const buffers = [];
  document.on('data', (chunk) => buffers.push(chunk));
  const complete = new Promise((resolve, reject) => {
    document.on('end', () => resolve(Buffer.concat(buffers)));
    document.on('error', reject);
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const ministryLogo = fs.readFileSync(ministryLogoPath);
  const aejLogo = fs.readFileSync(aejLogoPath);

  dossiers.forEach((dossier) => {
  const candidateName = `${dossier.candidat.nom} ${dossier.candidat.prenoms}`;
  document.addPage();
  document.font('Times-Roman').fillColor('#111827');
  document.image(ministryLogo, 48, 24, { fit: [105, 58], align: 'left', valign: 'top' });
  document.image(aejLogo, pageWidth - 158, 30, { fit: [110, 43], align: 'right', valign: 'top' });
  document.font('Times-Bold').fontSize(7).text('REPUBLIQUE DE COTE D’IVOIRE', 48, 86, { width: 130, align: 'center' });
  document.font('Times-Italic').fontSize(6.5).text('Union - Discipline - Travail', 48, 96, { width: 130, align: 'center' });
  document.moveTo(48, 112).lineTo(pageWidth - 48, 112).lineWidth(0.7).stroke('#111827');

  document.font('Times-Bold').fontSize(16).text('PROGRAMME SPECIAL D’IMMERSION 2026', 48, 132, { width: pageWidth - 96, align: 'center' });
  document.font('Times-Roman').fontSize(9).text(`Ref / N° ${reference}`, 48, 166, { width: pageWidth - 96, align: 'right' });
  document.font('Times-Bold').fontSize(14).text('ATTESTATION DE FIN DE STAGE D’IMMERSION', 48, 202, { width: pageWidth - 96, align: 'center' });
  document.rect(95, 197, pageWidth - 190, 28).lineWidth(1.1).stroke('#111827');

  document.font('Times-Roman').fontSize(14).text(`Je soussigné, ${agency.directeurPrenoms} ${agency.directeurNom}, Chef d’Agence Régionale de l’Agence Emploi Jeunes de ${agency.ville},`, 72, 270, { width: pageWidth - 144, align: 'justify', lineGap: 5 });
  document.text(`atteste par la présente que ${dossier.candidat.sexe === 'FEMME' ? 'Madame' : 'Monsieur'} ${candidateName}, élève/étudiant(e), titulaire de la pièce d’identité N° ${dossier.candidat.numeroPieceIdentite}, a effectué un stage de fin d’immersion d’un (01) mois au sein de l’entreprise ${dossier.entreprise.raisonSociale}, du ${formatLongDate(dossier.dateDebutStage)} au ${formatLongDate(dossier.dateFinPrevisionnelle)}.`, 72, 345, { width: pageWidth - 144, align: 'justify', lineGap: 5 });
  document.text('En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.', 72, 470, { width: pageWidth - 144, align: 'justify', lineGap: 5 });

  document.text(`Fait à ${agency.ville}, le ………………………….`, pageWidth - 255, 555, { width: 185, align: 'center' });
  document.font('Times-Bold').text('Le Chef d’Agence Régionale', 330, 625, { width: 180, align: 'center' });
  document.font('Times-Roman').text(`${agency.directeurPrenoms} ${agency.directeurNom}`, 330, 735, { width: 180, align: 'center' });

  document.moveTo(48, pageHeight - 52).lineTo(pageWidth - 48, pageHeight - 52).lineWidth(0.5).stroke('#9ca3af');
  document.font('Times-Roman').fontSize(10).fillColor('#6b7280').text('BPV 108 ABIDJAN / Tél : 20 21 25 90 – 20 21 06 69 / Fax : 20 21 50 58', 48, pageHeight - 39, { width: pageWidth - 96, align: 'center' });
  });
  document.end();
  return complete;
}

export function groupAttestationDossiers(dossiers) {
  if (!Array.isArray(dossiers) || !dossiers.length) {
    throw new Error('Aucune donnée de dossier disponible pour générer une attestation.');
  }

  const uniqueEnterpriseIds = new Set(dossiers.map((dossier) => dossier.entrepriseId || dossier.entreprise?.id).filter(Boolean));
  if (uniqueEnterpriseIds.size !== 1) {
    throw new Error('Les dossiers sélectionnés doivent appartenir à la même entreprise pour un téléchargement en bloc unique.');
  }

  const entreprise = dossiers[0].entreprise || { raisonSociale: 'Entreprise' };
  return {
    groupKey: dossiers[0].entrepriseId || dossiers[0].entreprise?.id,
    entrepriseName: entreprise.raisonSociale || 'Entreprise',
    items: dossiers
  };
}

export function sanitizeFilename(value) {
  return String(value || 'entreprise')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'entreprise';
}
