import React, { useState } from 'react';
import { Camera, Save, Settings, User } from 'lucide-react';
import { updateProfile } from '../services/userService';

export default function SettingsPage({ currentUser, onUpdated }) {
  const [form, setForm] = useState({
    nom: currentUser?.nom || '',
    prenoms: currentUser?.prenoms || '',
    titre: currentUser?.titre || '',
    avatar: currentUser?.avatar || ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setMessage('');
    setError('');
  };

  const handleAvatarFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choisissez une image valide.');
    if (file.size > 700 * 1024) return setError('L’avatar ne doit pas dépasser 700 Ko.');
    const reader = new FileReader();
    reader.onload = () => setForm((previous) => ({ ...previous, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const user = await updateProfile(form);
      onUpdated(user);
      setMessage('Profil mis à jour.');
    } catch (requestError) {
      setError(requestError.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3"><Settings className="text-emerald-300" /><div><h1 className="text-xl font-black">Paramètres</h1><p className="text-xs text-slate-300">Gérez votre profil et les informations affichées dans l'application.</p></div></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          {form.avatar ? <img src={form.avatar} alt="Avatar du profil" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-700 text-xl font-black text-white"><User /></div>}
          <div><p className="font-bold text-slate-900">Photo de profil</p><label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><Camera size={14} /> Choisir une image<input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" /></label></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold text-slate-700">Nom<input name="nom" value={form.nom} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-700">Prénom(s)<input name="prenoms" value={form.prenoms} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-700">Fonction / titre<input name="titre" value={form.titre} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-700"><span className="inline-flex items-center gap-1"><Camera size={14} /> URL de l'avatar (optionnel)</span><input name="avatar" type="url" value={form.avatar.startsWith('data:') ? '' : form.avatar} onChange={handleChange} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
        </div>
        {error && <p className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</p>}
        {message && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{message}</p>}
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-aej-orange px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Save size={15} /> {saving ? 'Enregistrement...' : 'Enregistrer le profil'}</button>
      </form>
    </section>
  );
}
