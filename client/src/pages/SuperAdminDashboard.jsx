import React, { useState } from 'react';
import { Building2, Copy, LogOut, Plus, ShieldCheck } from 'lucide-react';
import { createAgency } from '../services/userService';

const emptyForm = { nom: '', ville: '', chef_nom: '', chef_prenoms: '', chef_email: '', chef_titre: 'Chef d’agence', chef_password: '' };

export default function SuperAdminDashboard({ currentUser, agences, onLogout, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => { setForm((previous) => ({ ...previous, [event.target.name]: event.target.value })); setError(''); };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const result = await createAgency(form);
      setCredentials(result.credentials);
      setForm(emptyForm);
      onCreated(result.agency);
    } catch (requestError) { setError(requestError.message || 'Impossible de créer l’agence.'); }
    finally { setSaving(false); }
  };
  const copyCredentials = () => credentials && navigator.clipboard?.writeText(`Email: ${credentials.email}\nMot de passe: ${credentials.password}`);

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white"><ShieldCheck size={21} /></div><div><strong className="block text-sm font-black text-slate-900">AEJ Administration Nationale</strong><span className="text-xs text-slate-500">Espace Super Administrateur · {currentUser.email}</span></div></div><button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><LogOut size={15} /> Déconnexion</button></header>
      <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1fr_1.15fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-2"><Plus className="text-aej-orange" /><div><h1 className="text-lg font-black">Créer une agence</h1><p className="text-xs text-slate-500">Le chef reçoit un compte Direction avec tous les droits de son agence.</p></div></div><div className="grid gap-3 sm:grid-cols-2">{[['nom','Nom de l’agence'],['ville','Ville'],['chef_nom','Nom du chef'],['chef_prenoms','Prénom(s) du chef'],['chef_email','Email de connexion'],['chef_titre','Fonction']].map(([name,label]) => <label key={name} className="text-xs font-bold text-slate-700">{label}<input required name={name} type={name === 'chef_email' ? 'email' : 'text'} value={form[name]} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-aej-orange" /></label>)}</div><label className="mt-3 block text-xs font-bold text-slate-700">Mot de passe initial (optionnel)<input name="chef_password" type="text" value={form.chef_password} onChange={handleChange} placeholder="Généré automatiquement si vide" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label>{error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</p>}<button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-aej-orange px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Création...' : 'Créer l’agence et le chef'}</button>{credentials && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950"><strong className="block">Informations de connexion à transmettre</strong><p className="mt-2">Email : <b>{credentials.email}</b></p><p>Mot de passe : <b>{credentials.password}</b></p><button type="button" onClick={copyCredentials} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 font-bold text-emerald-800"><Copy size={13} /> Copier</button></div>}</form>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><Building2 className="text-aej-green" /><h2 className="text-lg font-black">Agences créées</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{agences.length}</span></div><div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">{agences.length === 0 ? <p className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">Aucune agence créée.</p> : agences.map((agency) => <article key={agency.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><strong className="block text-sm text-slate-900">{agency.nom}</strong><span className="text-xs text-slate-500">{agency.ville}</span></div><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">Active</span></div>{agency.users?.map((chef) => <div key={chef.id} className="mt-3 border-t border-slate-100 pt-3 text-xs"><b>Chef : {chef.prenoms} {chef.nom}</b><br /><span className="text-slate-500">{chef.email}</span></div>)}</article>)}</div></section>
      </div>
    </main>
  );
}
