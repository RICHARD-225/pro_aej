import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardConseiller from './pages/DashboardConseiller';
import FormSaisieDossier from './pages/FormSaisieDossier';
import DashboardServiceInfo from './pages/DashboardServiceInfo';
import DashboardDirection from './pages/DashboardDirection';
import PageAttestationEntreprise from './pages/PageAttestationEntreprise';
import ExcelPage from './pages/ExcelPage';
import AttestationArchivePage from './pages/AttestationArchivePage';
import SettingsPage from './pages/SettingsPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import GestionConseillers from './pages/GestionConseillers';
import ChecklistModal from './components/ChecklistModal';
import CorrectionModal from './components/CorrectionModal';
import HistoryModal from './components/HistoryModal';
import AttestationEntreprisePreview from './components/AttestationEntreprisePreview';
import PasswordChangeModal from './components/PasswordChangeModal';
import PasswordResetModal from './components/PasswordResetModal';
import LoginPage from './pages/LoginPage';
import { archiveEnterpriseAttestation, createDossier, generateBulkAttestation, generateDossierAttestation, generateEnterpriseAttestation, getAttestations, getDossiers, requestCorrection, resubmitDossier, saveChecklist } from './services/dossierService';
import { getReferentiels } from './services/referentielService';
import { createUser, getAgencies, getCurrentUser, getLoginHistory, getUsers, login, logout, resetUserPassword, updateUserStatus } from './services/userService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dossiers, setDossiers] = useState([]);
  const [archivedEnterpriseIds, setArchivedEnterpriseIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [agences, setAgences] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [referentiels, setReferentiels] = useState({
    sous_prefectures: [],
    branches_activite: [],
    types_entreprise: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => window.localStorage.getItem('aej:active-tab') || 'dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Modals state
  const [selectedDossierForChecklist, setSelectedDossierForChecklist] = useState(null);
  const [selectedDossierForCorrection, setSelectedDossierForCorrection] = useState(null);
  const [selectedDossierForHistory, setSelectedDossierForHistory] = useState(null);
  const [selectedEntrepriseForAttestation, setSelectedEntrepriseForAttestation] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [userForPasswordReset, setUserForPasswordReset] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Une session expirée revient proprement à la connexion, sans conserver de données sensibles à l'écran.
  const loadApplication = async () => {
    // Sécurité : isolation stricte de session par onglet / fenêtre
    // Si l'URL est copiée dans un autre onglet, fenêtre ou machine, sessionStorage sera vide
    // et l'utilisateur sera obligatoirement redirigé vers l'interface de connexion.
    const isTabAuthenticated = window.sessionStorage.getItem('aej_tab_authenticated');
    if (!isTabAuthenticated) {
      setCurrentUser(null);
      setDossiers([]);
      setReferentiels(null);
      setLoading(false);
      return;
    }

    const currentUserData = await getCurrentUser();
    if (currentUserData.role === 'SUPER_ADMIN') {
      setCurrentUser(currentUserData);
      setAgences(await getAgencies());
      setReferentiels({});
      setLoading(false);
      return;
    }
    const [loadedDossiers, loadedReferentiels, archivedAttestations] = await Promise.all([
      getDossiers(),
      getReferentiels(),
      getAttestations('ARCHIVEE').catch(() => [])
    ]);

    let loadedUsers = [];
    let loadedLoginHistory = [];

    if (currentUserData.role === 'SERVICE_INFO' || currentUserData.role === 'DIRECTION') {
      [loadedUsers, loadedLoginHistory] = await Promise.all([
        getUsers(),
        getLoginHistory()
      ]);
    } else {
      loadedUsers = await getUsers().catch(() => []);
    }

    setCurrentUser(currentUserData);
    setDossiers(loadedDossiers);
    setArchivedEnterpriseIds([...new Set(archivedAttestations.map((item) => item.entrepriseId).filter(Boolean))]);
    setReferentiels(loadedReferentiels);
    setUsers(loadedUsers);
    setLoginHistory(loadedLoginHistory);
  };

  useEffect(() => {
    window.localStorage.setItem('aej:active-tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    loadApplication().catch(() => logout()).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      window.sessionStorage.removeItem('aej_tab_authenticated');
      setCurrentUser(null);
      setDossiers([]);
      setReferentiels(null);
    };
    window.addEventListener('aej:session-expired', handleExpiredSession);
    return () => window.removeEventListener('aej:session-expired', handleExpiredSession);
  }, []);

  const handleLogin = async (email, password) => {
    await login(email, password);
    window.sessionStorage.setItem('aej_tab_authenticated', 'true');
    await loadApplication();
  };

  const handleLogout = () => { 
    window.sessionStorage.removeItem('aej_tab_authenticated');
    logout(); 
    setCurrentUser(null); 
    setDossiers([]); 
    setReferentiels(null); 
    setUsers([]); 
  };

  const handleAgencyCreated = (agency) => setAgences((previous) => [agency, ...previous]);

  const handleCreateUser = async (payload) => {
    try {
      const result = await createUser(payload);
      setUsers((prev) => [result.user, ...prev.filter((item) => item.id !== result.user.id)]);
      setActiveTab('gestion_conseillers');
      showToast(`Conseiller ajouté : ${result.user.prenoms} ${result.user.nom}. Le mot de passe initial doit être transmis séparément.`, 'info');
      return result;
    } catch (error) {
      showToast(error.message, 'warning');
      return null;
    }
  };

  const handleUserStatusChange = async (userId, actif) => {
    try {
      await updateUserStatus(userId, actif);
      setUsers((previous) => previous.map((user) => user.id === userId ? { ...user, actif } : user));
      showToast(actif ? 'Compte réactivé.' : 'Compte désactivé et sessions révoquées.', 'info');
    } catch (error) {
      showToast(error.message || 'Impossible de modifier le statut du compte.', 'warning');
    }
  };

  const handleResetUserPassword = async (user, newPassword) => {
    try {
      await resetUserPassword(user.id, newPassword);
      setUserForPasswordReset(null);
      showToast(`Mot de passe réinitialisé pour ${user.prenoms} ${user.nom}.`, 'success');
    } catch (error) {
      showToast(error.message || 'Impossible de réinitialiser le mot de passe.', 'warning');
    }
  };

  const handleUserRoleChange = (roleKey) => {
    showToast(`Le changement de rôle nécessite une connexion avec un autre compte (${roleKey}).`, 'info');
  };

  // =========================================================================
  // GESTION DES DOSSIERS D'IMMERSION (APPELS API ET SYNCHRONISATION DU STATE)
  // =========================================================================

  // 1. Création d'un nouveau dossier d'immersion
  const handleCreateDossier = async (payload) => {
    try {
      const dossier = await createDossier({ ...payload, conseiller_id: payload.conseiller_attribue?.id });
      setDossiers((items) => [dossier, ...items]);
      setActiveTab('dashboard');
      showToast(`Dossier ${dossier.id} créé et soumis avec succès !`, 'success');
    } catch (error) {
      showToast(error.message || 'Erreur lors de la création du dossier.', 'warning');
    }
  };

  // 2. Enregistrement de la checklist 9 points (Service Informatique)
  const handleSubmitChecklist = async (dossierId, checklistObj) => {
    try {
      const updated = await saveChecklist(dossierId, checklistObj);
      setDossiers((previous) => previous.map((item) => item.id === updated.id ? updated : item));
      setSelectedDossierForChecklist(null);
      showToast('Checklist de contrôle enregistrée avec succès !', 'success');
    } catch (error) {
      showToast(error.message || 'Erreur lors de l’enregistrement de la checklist.', 'warning');
    }
  };

  // 3. Demande de correction au conseiller (Service Informatique) avec transmission des 9 points
  const handleRequestCorrection = async (dossierId, motif, checklist = null) => {
    try {
      const updated = await requestCorrection(dossierId, motif, checklist);
      setDossiers((previous) => previous.map((item) => item.id === updated.id ? updated : item));
      setSelectedDossierForChecklist(null);
      showToast('Dossier renvoyé en correction au conseiller.', 'warning');
    } catch (error) {
      showToast(error.message || 'Erreur lors de la demande de correction.', 'warning');
    }
  };

  // 4. Resoumission du dossier corrigé par le Conseiller
  const handleResubmitCorrection = async (dossierId, payload) => {
    try {
      const updated = await resubmitDossier(dossierId, payload);
      setDossiers((previous) => previous.map((item) => item.id === updated.id ? updated : item));
      setSelectedDossierForCorrection(null);
      showToast(`Dossier ${dossierId} corrigé et resoumis pour validation !`, 'success');
    } catch (error) {
      showToast(error.message || 'Erreur lors de la resoumission du dossier.', 'warning');
    }
  };

  const handleGenerateAttestationEntreprise = (entrepriseId) => {
    setSelectedEntrepriseForAttestation(entrepriseId);
  };

  // Génération de l'attestation PDF groupée par entreprise.
  const handleDownloadAttestationEntreprise = async (entrepriseId) => {
    try {
      const blob = await generateEnterpriseAttestation(entrepriseId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const entrepriseName = dossiers.find((dossier) => dossier.entreprise_id === entrepriseId)?.entreprise?.raison_sociale || 'entreprise';
      link.download = `${entrepriseName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'entreprise'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setDossiers((previous) => previous.map((dossier) => dossier.entreprise_id === entrepriseId && ['VALIDE', 'ATTESTATION_GENEREE'].includes(dossier.statut_workflow)
        ? { ...dossier, statut_workflow: 'ATTESTATION_GENEREE' }
        : dossier));
      showToast('Attestation entreprise PDF générée avec succès.', 'success');
    } catch (error) {
      showToast(error.message || 'Erreur lors de la génération de l’attestation.', 'warning');
    }
  };

  const handleDownloadDossierAttestation = async (dossierOrId) => {
    const dossierId = typeof dossierOrId === 'string' ? dossierOrId : dossierOrId?.id;
    if (!dossierId) {
      showToast('Identifiant du dossier manquant.', 'warning');
      return;
    }
    try {
      const blob = await generateDossierAttestation(dossierId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dossier = dossiers.find((item) => item.id === dossierId);
      const baseName = dossier ? `${dossier.candidat.nom}-${dossier.candidat.prenoms}` : 'attestation';
      link.download = `${baseName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'attestation'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setDossiers((previous) => previous.map((item) => item.id === dossierId ? { ...item, statut_workflow: 'ATTESTATION_GENEREE' } : item));
      showToast('Attestation individuelle téléchargée.', 'success');
    } catch (error) {
      showToast(error.message || 'Erreur lors du téléchargement de l’attestation individuelle.', 'warning');
    }
  };

  const handleArchiveEnterpriseAttestation = async (entrepriseId) => {
    try {
      await archiveEnterpriseAttestation(entrepriseId);
      setArchivedEnterpriseIds((previous) => [...new Set([...previous, entrepriseId])]);
      setSelectedEntrepriseForAttestation(null);
      showToast('Attestation entreprise archivée.', 'success');
    } catch (error) {
      showToast(error.message || 'Erreur lors de l’archivage de l’attestation.', 'warning');
    }
  };

  const handleDownloadBulkAttestation = async (dossierIds) => {
    try {
      const blob = await generateBulkAttestation(dossierIds);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const selected = dossiers.filter((d) => dossierIds.includes(d.id))[0];
      const entrepriseName = selected?.entreprise?.raison_sociale || 'lot-attestations';
      link.download = `${entrepriseName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'lot-attestations'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Lot d’attestations téléchargé avec succès.', 'success');
    } catch (error) {
      showToast(error.message || 'Erreur lors du téléchargement du lot d’attestations.', 'warning');
    }
  };

  const counts = {
    total: dossiers.length,
    enregistres: dossiers.length,
    en_verification: dossiers.filter(d => d.statut_workflow === 'SOUMIS' || d.statut_workflow === 'EN_VERIFICATION' || d.statut_workflow === 'RESOUMIS').length,
    corrections_demandees: dossiers.filter(d => d.statut_workflow === 'CORRECTION_DEMANDEE').length,
    valides: dossiers.filter(d => d.statut_workflow === 'VALIDE' || d.statut_workflow === 'ATTESTATION_GENEREE').length,
    attestations_disponibles: dossiers.filter(d => d.statut_workflow === 'ATTESTATION_GENEREE' || d.statut_workflow === 'VALIDE').length
  };

  const displayDossiers = dossiers.filter(d => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase().trim();
      return (
        d.id.toLowerCase().includes(q) ||
        d.candidat.nom.toLowerCase().includes(q) ||
        d.candidat.prenoms.toLowerCase().includes(q) ||
        d.candidat.numero_piece_identite.toLowerCase().includes(q) ||
        d.candidat.contact_1.includes(q) ||
        d.entreprise.raison_sociale.toLowerCase().includes(q)
      );
    }
    if (filterStatut) {
      return d.statut_workflow === filterStatut;
    }
    return true;
  });

  if (loading) return <div className="min-h-screen grid place-items-center text-sm font-bold text-slate-600">Chargement sécurisé…</div>;
  if (!currentUser || !referentiels) return <LoginPage onLoginSuccess={loadApplication} />;
  if (currentUser.role === 'SUPER_ADMIN') return <SuperAdminDashboard currentUser={currentUser} agences={agences} onLogout={handleLogout} onCreated={handleAgencyCreated} />;

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-800 flex flex-col font-sans">
      
      {/* Système de Notification / Toast Global */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white transition-all duration-300 animate-in slide-in-from-top-3 border ${
          notification.type === 'warning'
            ? 'bg-amber-600 border-amber-500 shadow-amber-900/20'
            : notification.type === 'info'
            ? 'bg-blue-600 border-blue-500 shadow-blue-900/20'
            : 'bg-emerald-600 border-emerald-500 shadow-emerald-900/20'
        }`}>
          <div className="flex-1 max-w-sm leading-snug">{notification.msg}</div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Fermer"
          >
            ✕
          </button>
        </div>
      )}

      <Header
        currentUser={currentUser}
        onUserChange={handleUserRoleChange}
        onLogout={handleLogout}
        onChangePassword={() => setShowPasswordChange(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 w-full flex items-start">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          role={currentUser.role}
          counts={counts}
        />

        <main className="flex-1 p-6 min-h-[calc(100vh-5rem)] overflow-y-auto bg-[#F4F6F8]">
          {activeTab === 'nouveau' && (
            <FormSaisieDossier
              onSubmit={handleCreateDossier}
              onCancel={() => setActiveTab('dashboard')}
              referentiels={referentiels}
              currentUser={currentUser}
              dossiers={dossiers}
              conseillersList={users.filter((u) => u.role === 'CONSEILLER')}
            />
          )}

          {activeTab === 'gestion_conseillers' && (
            <GestionConseillers currentUser={currentUser} users={users} loginHistory={loginHistory} onCreateUser={handleCreateUser} onUserStatusChange={handleUserStatusChange} onResetPassword={setUserForPasswordReset} />
          )}

          {activeTab === 'attestations_entreprises' && (
            <PageAttestationEntreprise
              dossiers={dossiers}
              archivedEnterpriseIds={archivedEnterpriseIds}
              onGenerateAttestationEntreprise={handleGenerateAttestationEntreprise}
              onDownloadDossierAttestation={handleDownloadDossierAttestation}
            />
          )}

          {activeTab === 'dashboard' && currentUser.role === 'SERVICE_INFO' && (
            <DashboardServiceInfo
              dossiers={displayDossiers}
              onOpenChecklist={(d) => setSelectedDossierForChecklist(d)}
              onViewHistory={(d) => setSelectedDossierForHistory(d)}
              onDownloadDossierAttestation={handleDownloadDossierAttestation}
              onDownloadBulkAttestation={handleDownloadBulkAttestation}
              currentUser={currentUser}
              conseillersList={users.filter((u) => u.role === 'CONSEILLER')}
            />
          )}

          {activeTab === 'dashboard' && currentUser.role === 'CONSEILLER' && (
            <DashboardConseiller
              dossiers={displayDossiers}
              counts={counts}
              onNewDossier={() => setActiveTab('nouveau')}
              onOpenCorrection={(d) => setSelectedDossierForCorrection(d)}
              onGenerateAttestationEntreprise={handleGenerateAttestationEntreprise}
              onDownloadDossierAttestation={handleDownloadDossierAttestation}
              onViewDetails={(d) => setSelectedDossierForHistory(d)}
              filterStatut={filterStatut}
              onFilterChange={setFilterStatut}
            />
          )}

          {(activeTab === 'stats' || (activeTab === 'dashboard' && currentUser.role === 'DIRECTION')) && (
            <DashboardDirection
              dossiers={dossiers}
              stats={{ kpis: counts }}
              conseillersList={users.filter((u) => u.role === 'CONSEILLER')}
            />
          )}

          {(activeTab === 'valides' || activeTab === 'corrections') && (
            <DashboardConseiller
              dossiers={displayDossiers.filter(d => activeTab === 'valides' ? (d.statut_workflow === 'VALIDE' || d.statut_workflow === 'ATTESTATION_GENEREE') : d.statut_workflow === 'CORRECTION_DEMANDEE')}
              counts={counts}
              onNewDossier={() => setActiveTab('nouveau')}
              onOpenChecklist={(d) => setSelectedDossierForChecklist(d)}
              onOpenCorrection={(d) => setSelectedDossierForCorrection(d)}
              onGenerateAttestationEntreprise={handleGenerateAttestationEntreprise}
              onDownloadDossierAttestation={handleDownloadDossierAttestation}
              showEndStageAttestation={activeTab === 'valides'}
              onViewDetails={(d) => setSelectedDossierForHistory(d)}
              filterStatut={filterStatut}
              onFilterChange={setFilterStatut}
            />
          )}

          {activeTab === 'excel' && (
            <ExcelPage currentUser={currentUser} dossiers={dossiers} />
          )}

          {activeTab === 'archives' && <AttestationArchivePage />}
          {activeTab === 'parametres' && <SettingsPage currentUser={currentUser} onUpdated={(user) => setCurrentUser(user)} />}
        </main>
      </div>

      {/* Modals */}
      {selectedDossierForChecklist && (
        <ChecklistModal
          dossier={selectedDossierForChecklist}
          onClose={() => setSelectedDossierForChecklist(null)}
          onSubmitChecklist={handleSubmitChecklist}
          onRequestCorrection={handleRequestCorrection}
        />
      )}

      {selectedDossierForCorrection && (
        <CorrectionModal
          dossier={selectedDossierForCorrection}
          onClose={() => setSelectedDossierForCorrection(null)}
          onResubmit={handleResubmitCorrection}
          referentiels={referentiels}
          currentUser={currentUser}
        />
      )}

      {selectedDossierForHistory && (
        <HistoryModal
          dossier={selectedDossierForHistory}
          onClose={() => setSelectedDossierForHistory(null)}
        />
      )}

      {selectedEntrepriseForAttestation && (
        <AttestationEntreprisePreview
          entrepriseId={selectedEntrepriseForAttestation}
          dossiers={dossiers}
          onClose={() => setSelectedEntrepriseForAttestation(null)}
          onDownload={handleDownloadAttestationEntreprise}
              onArchive={handleArchiveEnterpriseAttestation}
        />
      )}

      {(currentUser?.passwordChangeRequired || showPasswordChange) && (
        <PasswordChangeModal
          required={Boolean(currentUser?.passwordChangeRequired)}
          onChanged={(user) => { setCurrentUser(user); setShowPasswordChange(false); showToast('Mot de passe modifié avec succès.', 'success'); }}
          onLogout={handleLogout}
          onClose={() => setShowPasswordChange(false)}
        />
      )}

      {userForPasswordReset && (
        <PasswordResetModal
          user={userForPasswordReset}
          onClose={() => setUserForPasswordReset(null)}
          onReset={(newPassword) => handleResetUserPassword(userForPasswordReset, newPassword)}
        />
      )}

    </div>
  );
}
