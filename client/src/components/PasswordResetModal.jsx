import React, { useState } from 'react';
import { KeyRound, Loader2, X } from 'lucide-react';
import { resetUserPassword } from '../services/userService';

export default function PasswordResetModal({ user, onClose, onReset }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword.length < 8) return setError('Le mot de passe doit comporter au moins 8 caractères.');
    if (newPassword !== confirmation) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    setError('');
    try {
      await resetUserPassword(user.id, newPassword);
      onReset(newPassword);
    } catch (requestError) {
      setError(requestError.message || 'Impossible de réinitialiser le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-2xl" aria-labelledby="reset-password-title">
        <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><KeyRound className="text-aej-orange" /><div><h2 id="reset-password-title" className="font-bold text-slate-900">Réinitialiser le mot de passe</h2><p className="text-xs text-slate-500">Conseiller : {user.prenoms} {user.nom}</p></div></div><button type="button" onClick={onClose} title="Fermer" className="text-slate-400 hover:text-slate-800"><X size={18} /></button></div>
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Le conseiller devra utiliser ce nouveau mot de passe puis en définir un personnel.</p>
        {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
        <label className="block text-xs font-bold text-slate-700">Nouveau mot de passe<input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="block text-xs font-bold text-slate-700">Confirmation<input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600">Annuler</button><button disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-aej-orange px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{loading && <Loader2 size={14} className="animate-spin" />} Réinitialiser</button></div>
      </form>
    </div>
  );
}