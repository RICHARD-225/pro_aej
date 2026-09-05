import React from 'react';
import { Mail, UserRound, X } from 'lucide-react';

export default function UserDetailsModal({ user, onClose }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-2"><UserRound className="text-aej-orange" size={19} /><h2 className="text-sm font-black text-slate-900">Profil utilisateur</h2></div><button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Fermer"><X size={18} /></button></div>
        <div className="max-h-[5rem] space-y-3 overflow-y-auto p-5 text-sm"><div className="flex items-center gap-3">{user.avatar ? <img src={user.avatar} alt="" className="h-14 w-14 rounded-xl object-cover" onError={(event) => { event.currentTarget.src = '/logo-aej.png'; }} /> : <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-700 font-black text-white">{user.prenoms?.[0]}{user.nom?.[0]}</div>}<div><strong className="block text-slate-900">{user.prenoms} {user.nom}</strong><span className="text-xs text-slate-500">{user.titre || user.role}</span></div></div><div className="rounded-xl bg-slate-50 p-3 text-slate-600"><p className="flex items-center gap-2"><Mail size={14} /> {user.email}</p><p className="mt-2">Statut : <strong>{user.actif ? 'Actif' : 'Inactif'}</strong></p><p className="mt-2">Dernière connexion : {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fr-FR') : 'Aucune'}</p><p className="mt-2">Nombre de connexions : {user.loginCount || 0}</p></div></div>
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3"><button onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white">Fermer</button></div>
      </div>
    </div>
  );
}
