import React, { useMemo } from 'react';
import { Building2, Printer, CheckCircle, AlertCircle, FileText, Search, UserCheck } from 'lucide-react';

export default function PageAttestationEntreprise({ dossiers, onGenerateAttestationEntreprise }) {
  
  // Regroupement des dossiers VALIDÉS par entreprise
  const entreprisesStats = useMemo(() => {
    const map = {};

    dossiers.forEach(d => {
      const entName = d.entreprise.raison_sociale.trim();
      if (!map[entName]) {
        map[entName] = {
          nom: entName,
          id: d.entreprise_id,
          type: d.entreprise.type_entreprise || 'Privé',
          branche: d.entreprise.branche_activite || 'Générale',
          valides: [],
          total: 0
        };
      }
      map[entName].total += 1;
      if (d.statut_workflow === 'VALIDE' || d.statut_workflow === 'ATTESTATION_GENEREE') {
        map[entName].valides.push(d);
      }
    });

    return Object.values(map).sort((a, b) => b.valides.length - a.valides.length);
  }, [dossiers]);

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Header Page Officiel AEJ */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-aej-green text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
              Rubrique Officielle AEJ
            </span>
            <span className="text-xs text-slate-300 font-mono">BOUAKÉ</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Attestations de Démarrage Groupées par Entreprise</h2>
          <p className="text-xs text-slate-200 max-w-xl mt-0.5">
            Génération et impression des attestations officielles pour les structures accueillant des stagiaires validés.
          </p>
        </div>

        <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700 text-right shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Entreprises Conventionnées</span>
          <span className="text-xl font-black text-emerald-400">{entreprisesStats.length} structure(s)</span>
        </div>
      </div>

      {/* RÈGLE MÉTIER BANNER */}
      <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 flex items-start gap-3 shadow-sm">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong className="font-extrabold">Règle de Génération par Lot :</strong> Seuls les stagiaires au statut <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">VALIDÉ</span> (après contrôle physico-numérique 9/9 points) sont automatiquement intégrés sur l'attestation groupée de l'entreprise.
        </div>
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
          <table className="w-full text-left text-xs font-normal border-collapse">
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
                  const hasValid = ent.valides.length > 0;

                  return (
                    <tr key={ent.nom} className="hover:bg-slate-50 transition-colors">
                      
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
                          hasValid ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {ent.valides.length} / {ent.total} validé(s)
                        </span>
                      </td>

                      {/* Aperçu des noms */}
                      <td className="px-5 py-4 text-slate-700">
                        {hasValid ? (
                          <div className="text-[11px] font-medium max-w-xs truncate">
                            {ent.valides.map(v => `${v.candidat.nom} ${v.candidat.prenoms}`).join(', ')}
                          </div>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-bold italic">En attente de validation Service Info</span>
                        )}
                      </td>

                      {/* Statut Attestation */}
                      <td className="px-5 py-4 text-center">
                        {hasValid ? (
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
                            disabled={!hasValid}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm ${
                              hasValid
                                ? 'bg-aej-orange hover:bg-orange-600 text-white shadow-orange-500/20 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Attestation entreprise</span>
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
