import { API_BASE_URL, api } from './api';
import { getAccessToken } from './api';

export async function getDossiers() {
  const firstPage = await api('/dossiers?page=1&pageSize=100');
  const dossiers = [...firstPage.data];
  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await api(`/dossiers?page=${page}&pageSize=100`);
    dossiers.push(...nextPage.data);
  }
  return dossiers;
}

export async function getDossierById(id) {
  return (await api(`/dossiers/${encodeURIComponent(id)}`)).data;
}

export async function createDossier(dossier) {
  return (await api('/dossiers', { method: 'POST', body: JSON.stringify(dossier) })).data;
}

export async function saveChecklist(id, checklist) {
  return (await api(`/dossiers/${encodeURIComponent(id)}/checklist`, { method: 'PUT', body: JSON.stringify({ checklist }) })).data;
}

export async function requestCorrection(id, motif, checklist = null) {
  return (await api(`/dossiers/${encodeURIComponent(id)}/correct`, { method: 'POST', body: JSON.stringify({ motif, checklist }) })).data;
}

export async function resubmitDossier(id, dossier) {
  return (await api(`/dossiers/${encodeURIComponent(id)}/resubmit`, { method: 'PUT', body: JSON.stringify(dossier) })).data;
}

export async function generateEnterpriseAttestation(entrepriseId) {
  const response = await fetch(`${API_BASE_URL}/attestations/entreprise`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken() || ''}`
    },
    body: JSON.stringify({ entreprise_id: entrepriseId })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'La génération de l’attestation a échoué.');
  }
  return response.blob();
}

export async function generateDossierAttestation(dossierId) {
  const response = await fetch(`${API_BASE_URL}/attestations/dossier/${encodeURIComponent(dossierId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken() || ''}`
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'La génération de l’attestation individuelle a échoué.');
  }
  return response.blob();
}

export async function generateBulkAttestation(dossierIds) {
  const response = await fetch(`${API_BASE_URL}/attestations/lot`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken() || ''}`
    },
    body: JSON.stringify({ dossier_ids: dossierIds })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'La génération du lot d’attestations a échoué.');
  }
  return response.blob();
}

export async function archiveEnterpriseAttestation(entrepriseId) {
  const response = await fetch(`${API_BASE_URL}/attestations/entreprise/${encodeURIComponent(entrepriseId)}/archive`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${getAccessToken() || ''}` }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'L’archivage de l’attestation a échoué.');
  return payload;
}

export async function getAttestations(statut = '') {
  const query = statut ? `?statut=${encodeURIComponent(statut)}` : '';
  return (await api(`/attestations${query}`)).data;
}
