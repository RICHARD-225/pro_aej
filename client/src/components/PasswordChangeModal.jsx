import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { changePassword } from '../services/userService';

export default function PasswordChangeModal({ onChanged, onLogout, required = false, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword.length < 8) return setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    if (newPassword !== confirmation) return setError('Les deux nouveaux mots de passe ne correspondent pas.');
    setLoading(true);
    setError('');
    try {
      const user = await changePassword(currentPassword, newPassword);
      onChanged(user);
    } catch (requestError) {
      setError(requestError.message || 'Impossible de modifier le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-2xl" aria-labelledby="password-change-title">
        <div className="flex items-center gap-3"><KeyRound className="text-aej-orange" /><div><h2 id="password-change-title" className="font-bold text-slate-900">Modifier le mot de passe</h2><p className="text-xs text-slate-500">Utilisez au moins 8 caractères.</p></div></div>
        {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
        <label className="block text-xs font-bold text-slate-700">Mot de passe actuel<input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="block text-xs font-bold text-slate-700">Nouveau mot de passe<input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="block text-xs font-bold text-slate-700">Confirmation<input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <div className="flex justify-end gap-2">{required ? <button type="button" onClick={onLogout} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600">Se déconnecter</button> : <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600">Annuler</button>}<button disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-aej-orange px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{loading && <Loader2 size={14} className="animate-spin" />} Enregistrer</button></div>
      </form>
    </div>
  );
}
