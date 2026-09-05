import React from 'react';
import { X, History, Clock, User, ShieldCheck, FileText } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function HistoryModal({ dossier, onClose }) {
  if (!dossier) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Historique de Traçabilité & Audit System</h3>
              <p className="text-xs text-slate-400">Dossier : <span className="font-mono text-emerald-400 font-bold">{dossier.id}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Header Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-aej-green uppercase">Bénéficiaire :</span>
              <h4 className="text-base font-extrabold text-slate-900">{dossier.candidat.nom} {dossier.candidat.prenoms}</h4>
              <p className="text-xs text-slate-500">Conseiller référent : <strong className="text-slate-800">{dossier.conseiller_nom}</strong></p>
            </div>
            <StatusBadge status={dossier.statut_workflow} />
          </div>

          {/* Timeline of events */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Journal des Événements & Horodatage Officiel :
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {dossier.historique && dossier.historique.map((h, index) => (
                <div key={index} className="relative group">
                  
                  {/* Circle marker */}
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-aej-orange ring-4 ring-white shadow-sm"></div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {h.auteur}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {h.date}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 pt-1 leading-relaxed">
                      {h.action}
                    </p>

                    {h.statut && (
                      <div className="pt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Statut du dossier :</span>
                        <StatusBadge status={h.statut} />
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
          >
            Fermer l'Historique
          </button>
        </div>

      </div>
    </div>
  );
}
