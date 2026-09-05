import React from 'react';
import { Clock3, X } from 'lucide-react';

export default function LoginHistoryModal({ records, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-2"><Clock3 className="text-aej-orange" size={19} /><h2 className="text-sm font-black text-slate-900">Historique de connexion</h2></div><button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Fermer"><X size={18} /></button></div>
        <div className="max-h-[5rem] space-y-2 overflow-y-auto p-5">{records.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-center text-xs font-semibold text-slate-500">Aucune connexion enregistrée.</p> : records.map((entry) => <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><strong className="text-xs text-slate-800">{entry.prenoms} {entry.nom}</strong><span className="rounded-full bg-slate-900 px-2 py-1 text-[9px] font-bold text-white">{entry.role}</span></div><p className="mt-1 text-[11px] text-slate-500">{entry.email} · {new Date(entry.createdAt).toLocaleString('fr-FR')}</p></div>)}</div>
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3"><button onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white">Fermer</button></div>
      </div>
    </div>
  );
}
