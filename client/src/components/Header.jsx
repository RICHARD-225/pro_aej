import React, { useState } from 'react';
import { Bell, KeyRound, LogOut, Search, ShieldCheck } from 'lucide-react';
import { ROLE_LABELS } from '../constants/roles';

/**
 * Composant d'entête principal (Header)
 * Affiche l'identité visuelle AEJ, la barre de recherche globale,
 * les informations de l'utilisateur connecté et le bouton de déconnexion.
 */
export default function Header({ currentUser, onLogout, onChangePassword, searchTerm, onSearchChange, onTabChange }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#fffdf8]/95 backdrop-blur border-b border-[#e7e2d8] shadow-[0_8px_24px_rgba(22,50,58,0.06)]">
      {/* Ligne tricolore décorative officielle aux couleurs de l'AEJ */}
      <div className="h-1 bg-gradient-to-r from-aej-orange via-[#f4c76a] to-aej-green" />

      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-[4.5rem]">
          
          {/* Logo & Titre de l'Agence */}
          <button 
            type="button" 
            onClick={() => onTabChange('dashboard')} 
            className="flex items-center gap-3 text-left group transition"
          >
            <img 
              src="/logo-aej.png" 
              alt="Agence Emploi Jeunes" 
              className="h-12 w-12 rounded-xl object-contain bg-white p-1 ring-1 ring-[#e7e2d8] group-hover:scale-105 transition"
              onError={(event) => { event.currentTarget.style.display = 'none'; }} 
            />
            <div className="hidden sm:block">
                <span className="block text-base sm:text-lg font-black tracking-wide text-[#16323a] uppercase">
                Agence Emploi Jeunes
              </span>
                <span className="block text-xs font-bold text-aej-green">
                Direction Régionale du Gbêkê • Bouaké
              </span>
            </div>
          </button>

          {/* Barre de Recherche Globale */}
          <div className="hidden md:block relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm} 
              onChange={(event) => onSearchChange(event.target.value)} 
              placeholder="Rechercher un candidat, N° CNI, contact, entreprise..." 
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-aej-green focus:outline-none focus:ring-2 focus:ring-emerald-100 transition shadow-inner" 
            />
          </div>

          {/* Profil Utilisateur & Action Déconnexion */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-slate-800 shadow-sm">
              {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" onError={(event) => { event.currentTarget.src = '/logo-aej.png'; }} className="h-8 w-8 rounded-xl object-cover" /> : <div className="w-8 h-8 rounded-xl bg-emerald-100 text-aej-green flex items-center justify-center font-bold"><ShieldCheck className="w-4 h-4" /></div>}
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-black text-slate-900 leading-tight">
                  {currentUser.prenoms} {currentUser.nom}
                </span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </span>
              </div>
            </div>

            <button 
              type="button" 
              onClick={confirmLogout} 
              title="Se déconnecter de la session" 
              className="p-2.5 text-slate-500 hover:text-white hover:bg-rose-600 rounded-xl transition-all shadow-sm border border-slate-200 hover:border-rose-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
            {(currentUser.role === 'SERVICE_INFO' || currentUser.role === 'DIRECTION') && (
              <button type="button" onClick={onChangePassword} title="Modifier le mot de passe" className="p-2.5 text-slate-500 hover:text-white hover:bg-aej-orange rounded-xl transition-all shadow-sm border border-slate-200 hover:border-aej-orange">
                <KeyRound className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h2 id="logout-title" className="font-bold text-slate-900">Se déconnecter ?</h2>
            <p className="mt-2 text-xs text-slate-600">La session actuelle sera fermée sur cet appareil.</p>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowLogoutConfirm(false)} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600">Annuler</button><button type="button" onClick={onLogout} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white">Se déconnecter</button></div>
          </div>
        </div>
      )}
    </header>
  );
}

