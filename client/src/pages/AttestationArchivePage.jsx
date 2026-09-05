import React, { useEffect, useMemo, useState } from 'react';
import { Archive, CalendarDays, FileSearch, FileText } from 'lucide-react';
import { getAttestations } from '../services/dossierService';

export default function AttestationArchivePage() {
  const [attestations, setAttestations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAttestations('ARCHIVEE')
      .then(setAttestations)
      .catch((requestError) => setError(requestError.message || 'Impossible de charger les archives.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredAttestations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return attestations;
    return attestations.filter((attestation) => [
      attestation.numeroAttestation,
      attestation.entreprise?.raisonSociale,
      attestation.dateGeneration && new Date(attestation.dateGeneration).toLocaleDateString('fr-FR')
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [attestations, search]);

  const groupedArchives = useMemo(() => {
    const groups = new Map();
    filteredAttestations.forEach((attestation) => {
      const key = attestation.entrepriseId || attestation.entreprise?.id || attestation.id;
      const current = groups.get(key);
      if (current) {
        current.references.push(attestation.numeroAttestation);
        if (new Date(attestation.dateGeneration) > new Date(current.dateGeneration)) current.dateGeneration = attestation.dateGeneration;
      } else {
        groups.set(key, { ...attestation, references: [attestation.numeroAttestation] });
      }
    });
    return Array.from(groups.values());
  }, [filteredAttestations]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3"><Archive className="text-emerald-300" /><div><h1 className="text-xl font-black">Archive des attestations</h1><p className="text-xs text-slate-300">Retrouvez les attestations entreprise archivées après impression.</p></div></div>
      </div>
      {loading && <p className="text-sm font-semibold text-slate-500">Chargement des archives...</p>}
      {error && <p className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}
      {!loading && !error && attestations.length > 0 && (
        <label className="relative block max-w-xl">
          <FileSearch className="absolute left-3 top-3 text-slate-400" size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une entreprise, une référence ou une date" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-aej-orange" />
        </label>
      )}
      {!loading && !error && attestations.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">Aucune attestation archivée.</div>}
      {!loading && !error && attestations.length > 0 && groupedArchives.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">Aucun résultat pour cette recherche.</div>}
      <div className="grid gap-3">
        {groupedArchives.map((attestation) => (
          <article key={attestation.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3"><FileText className="text-aej-orange" /><div><strong className="block text-sm text-slate-900">{attestation.entreprise?.raisonSociale || 'Entreprise'}</strong><span className="text-xs text-slate-500">{attestation.references.length} attestation(s) · {attestation.references.join(', ')}</span></div></div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><CalendarDays size={14} /> {new Date(attestation.dateGeneration).toLocaleDateString('fr-FR')}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
