import React, { useMemo, useState } from 'react';
import { Building2, Printer, CheckCircle, AlertCircle, FileText, Search, UserCheck, Filter } from 'lucide-react';

export default function PageAttestationEntreprise({ dossiers, onGenerateAttestationEntreprise, archivedEnterpriseIds = [] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('toutes');
  
  // Regroupement des dossiers VALIDÉS par entreprise
  const entreprisesStats = useMemo(() => {
    const map = {};

    dossiers.forEach(d => {
      const entrepriseId = d.entreprise_id;
      if (!map[entrepriseId]) {
        map[entrepriseId] = {
          nom: d.entreprise.raison_sociale.trim(),
          id: entrepriseId,
          type: d.entreprise.type_entreprise || 'Privé',
          branche: d.entreprise.branche_activite || 'Générale',
          valides: [],
          total: 0
        };
      }
      map[entrepriseId].total += 1;
      if (d.statut_workflow === 'VALIDE' || d.statut_workflow === 'ATTESTATION_GENEREE') {
        map[entrepriseId].valides.push(d);
      }
    });

    const query = search.trim().toLowerCase();
    return Object.values(map)
      .filter((enterprise) => !archivedEnterpriseIds.includes(enterprise.id))
      .filter((enterprise) => !query || `${enterprise.nom} ${enterprise.branche} ${enterprise.type}`.toLowerCase().includes(query))
      .filter((enterprise) => {
        const complete = enterprise.valides.length === enterprise.total;
        const generated = complete && enterprise.valides.every((dossier) => dossier.statut_workflow === 'ATTESTATION_GENEREE');
        return statusFilter === 'toutes' || (statusFilter === 'pret' && complete && !generated) || (statusFilter === 'generee' && generated) || (statusFilter === 'attente' && !complete);
      })
      .sort((a, b) => b.valides.length - a.valides.length);
  }, [dossiers, archivedEnterpriseIds, search, statusFilter]);

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Header Page Officiel AEJ */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-aej-green text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          
          <h1 className="text-xl font-extrabold text-white mt-1">Attestations de Démarrage Groupées par Entreprise</h1>
          
        </div>

        <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700 text-right shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Entreprises Conventionnées</span>
          <span className="text-xl font-black text-emerald-400">{entreprisesStats.length} structure(s)</span>
        </div>
      </div>

    

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une entreprise ou un secteur" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs font-semibold outline-none focus:border-aej-orange" /></label>
        <label className="relative"><Filter className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs font-semibold outline-none focus:border-aej-orange"><option value="toutes">Toutes les attestations</option><option value="attente">Dossiers incomplets</option><option value="pret">Prêtes à générer</option><option value="generee">Déjà générées</option></select></label>
      </div>

      {/* REGISTRE EN LIGNES DES ATTESTATIONS ENTREPRISES DISPONIBLES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-aej-orange" />
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Registre des Attestations Disponibles par Entreprise</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold italic">Mise à jour en temps réel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 text-left text-xs font-normal">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Entreprise / Structure</th>
                <th className="px-5 py-3.5">Type & Secteur</th>
                <th className="px-5 py-3.5 text-center">Stagiaires Validés</th>
                <th className="px-5 py-3.5">Aperçu des Bénéficiaires Inclus</th>
                <th className="px-5 py-3.5 text-center">Statut Attestation</th>
                <th className="px-5 py-3.5 text-right">Action d'Impression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
              {entreprisesStats.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-bold">
                    Aucune entreprise enregistrée dans la base de données.
                  </td>
                </tr>
              ) : (
                entreprisesStats.map((ent) => {
                  const allValid = ent.valides.length === ent.total;
                  const allGenerated = allValid && ent.valides.every((dossier) => dossier.statut_workflow === 'ATTESTATION_GENEREE');

                  return (
                    <tr key={ent.id} className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50">
                      
                      {/* Entreprise */}
                      <td className="px-5 py-4 font-bold text-slate-900">
                        <div className="text-sm font-extrabold text-slate-900 uppercase">{ent.nom}</div>
                        <div className="text-[10px] text-slate-400 font-normal">Région du Gbêkê - Bouaké</div>
                      </td>

                      {/* Type & Secteur */}
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        <div>{ent.branche}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{ent.type}</div>
                      </td>

                      {/* Compteur Stagiaires Validés */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-black text-xs ${
                          allValid ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {ent.valides.length} / {ent.total} validé(s)
                        </span>
                      </td>

                      {/* Aperçu des noms */}
                      <td className="px-5 py-4 text-slate-700">
                        {allGenerated ? (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-extrabold">
                            Attestation déjà générée
                          </span>
                        ) : allValid ? (
                          <div className="text-[11px] font-medium max-w-xs truncate">
                            {ent.valides.map(v => `${v.candidat.nom} ${v.candidat.prenoms}`).join(', ')}
                          </div>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-bold italic">En attente de validation Service Info</span>
                        )}
                      </td>

                      {/* Statut Attestation */}
                      <td className="px-5 py-4 text-center">
                        {allGenerated ? (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-extrabold">Déjà générée</span>
                        ) : allValid ? (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
                            Attestation Prête (A4)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-400 text-[10px] font-bold">
                            Non Disponible
                          </span>
                        )}
                      </td>

                      {/* Action Imprimer */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => onGenerateAttestationEntreprise(ent.id)}
                            disabled={!allValid}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm ${
                              allGenerated
                                ? 'bg-slate-700 hover:bg-slate-800 text-white cursor-pointer'
                                : allValid
                                ? 'bg-aej-orange hover:bg-orange-600 text-white shadow-orange-500/20 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{allGenerated ? 'Voir / archiver' : 'Attestation entreprise'}</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
