import React, { useState } from 'react';
import { Users, Plus, Mail, UserRound, Briefcase, CheckCircle2, Search, Filter } from 'lucide-react';

export default function GestionConseillers({ currentUser, users, loginHistory = [], onCreateUser, onUserStatusChange, onResetPassword }) {
  const [form, setForm] = useState({ nom: '', prenoms: '', email: '', password: '', titre: 'Conseiller Emploi' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const conseillers = users.filter((u) => u.role === 'CONSEILLER');
  const filteredConseillers = conseillers.filter((user) => {
    const query = searchTerm.trim().toLowerCase();
    const haystack = `${user.prenoms || ''} ${user.nom || ''} ${user.email || ''} ${user.titre || ''}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'actif' ? user.actif : !user.actif);
    return matchesSearch && matchesStatus;
  });
  const loginRecords = [...loginHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nom = form.nom.trim();
    const prenoms = form.prenoms.trim();
    const email = form.email.trim();
    const password = form.password.trim();

    if (!nom || !prenoms || !email) {
      setError('Le nom, le prénom et l’email sont obligatoires.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const result = await onCreateUser({
      nom,
      prenoms,
      email,
      password,
      titre: form.titre || 'Conseiller Emploi',
      role: 'CONSEILLER'
    });

    setLoading(false);
    if (result) {
      setForm({ nom: '', prenoms: '', email: '', password: '', titre: 'Conseiller Emploi' });
      setMessage(`Le conseiller ${result.user?.prenoms || prenoms} ${result.user?.nom || nom} a bien été créé avec succès !`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-aej-green p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-aej-green" />
          <h1 className="text-2xl font-bold">Gestion des conseillers</h1>
        </div>
        <p className="text-sm text-slate-200">
          Ajouter un conseiller à l’agence en définissant son compte et son mot de passe pour la saisie et le suivi.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="text-aej-orange" size={20} />
            <h2 className="text-xl font-bold text-slate-800">Ajouter un nouveau conseiller</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nom *</span>
                <input name="nom" value={form.nom} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-aej-green focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="KOUASSI" />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Prénom(s) *</span>
                <input name="prenoms" value={form.prenoms} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-aej-green focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="Marie Ange" />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email professionnel *</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-aej-green focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="nom.prenom@emploi.ci" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mot de passe initial * (6 caractères min.)</span>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-aej-green focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="••••••••••••" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Titre / poste</span>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input name="titre" value={form.titre} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-aej-green focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="Conseiller Emploi" />
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 font-semibold">{message}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-aej-orange hover:bg-orange-600 px-5 py-3 font-bold text-white transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
            >
              {loading ? 'Création en cours…' : 'Créer le conseiller'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <UserRound className="text-aej-green" size={20} />
                <h2 className="text-xl font-bold text-slate-800">Conseillers actifs</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {filteredConseillers.length}/{conseillers.length}
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher par nom, prénom, email ou poste"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-aej-green focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="relative block">
                <Filter className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 focus:border-aej-green focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="all">Tous</option>
                  <option value="actif">Actifs</option>
                  <option value="inactif">Inactifs</option>
                </select>
              </label>
            </div>

            <div className="space-y-3">
              {filteredConseillers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Aucun conseiller ne correspond à la recherche ou au filtre sélectionné.
                </div>
              ) : (
                filteredConseillers.map((user) => (
                  <div key={user.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">{user.prenoms} {user.nom}</p>
                        <p className="text-xs text-slate-500">{user.titre || 'Conseiller Emploi'}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${user.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        <CheckCircle2 size={12} /> {user.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <Mail size={12} />
                      <span>{user.email}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      {user.lastLoginAt ? `Dernière connexion : ${new Date(user.lastLoginAt).toLocaleString('fr-FR')}` : 'Aucune connexion enregistrée.'}
                    </div>
                    <button type="button" onClick={() => onUserStatusChange(user.id, !user.actif)} className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      {user.actif ? 'Désactiver le compte' : 'Réactiver le compte'}
                    </button>
                    <button type="button" onClick={() => onResetPassword(user)} className="ml-2 mt-3 rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-50">
                      Réinitialiser le mot de passe
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle2 className="text-aej-orange" size={20} />
              <h2 className="text-xl font-bold text-slate-800">Historique de connexion du jour</h2>
            </div>

            <div className="space-y-3">
              {loginRecords.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Aucune connexion enregistrée aujourd’hui.
                </div>
              ) : (
                loginRecords.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">{entry.prenoms} {entry.nom}</p>
                        <p className="text-xs text-slate-500">{entry.email}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        {entry.role}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      Connecté le {new Date(entry.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
