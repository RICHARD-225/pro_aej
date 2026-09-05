import React, { useState, useEffect } from 'react';
import { LockKeyhole, LogIn, Mail, KeyRound, Loader2, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { initiateLogin, verifyOtpLogin, resendOtp } from '../services/userService';

/**
 * Page de Connexion Sécurisée AEJ Bouaké avec 2FA / Code OTP par E-mail
 * Étape 1 : Saisie de l'e-mail et du mot de passe
 * Étape 2 : Saisie du code à 6 chiffres valable 5 minutes
 */
export default function LoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState('CREDENTIALS'); // 'CREDENTIALS' | 'OTP'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  // Minuteur d'expiration OTP (5 minutes = 300s)
  const [timeLeft, setTimeLeft] = useState(300);
  // Cooldown de renvoi du code (30s)
  const [resendCooldown, setResendCooldown] = useState(0);

  // Décompte du temps d'expiration
  useEffect(() => {
    let timer;
    if (step === 'OTP' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Décompte du cooldown de renvoi
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Formatage mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Étape 1 : Vérification des identifiants et envoi du code par email
  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      const response = await initiateLogin(email, password);
      if (response.requireOtp) {
        setStep('OTP');
        setUserName(response.userName || '');
        setTimeLeft(300);
        setResendCooldown(30);
        setInfoMsg(response.message || 'Un code de validation à 6 chiffres a été envoyé à votre e-mail.');
      } else {
        await onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || 'Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérification du code OTP 6 chiffres
  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    const cleanOtp = otpCode.trim();

    if (cleanOtp.length !== 6) {
      setError('Veuillez saisir le code complet à 6 chiffres.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      await verifyOtpLogin(email, cleanOtp);
      await onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Code de vérification incorrect ou expiré.');
      setLoading(false);
    }
  };

  // Renvoi d'un nouveau code
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await resendOtp(email);
      setResendCooldown(30);
      setTimeLeft(300);
      setOtpCode('');
      setInfoMsg(res.message || 'Un nouveau code a été envoyé à votre adresse e-mail.');
    } catch (err) {
      setError(err.message || 'Impossible de renvoyer le code.');
    } finally {
      setLoading(false);
    }
  };

  // Retour à l'étape 1
  const handleBackToCredentials = () => {
    setStep('CREDENTIALS');
    setOtpCode('');
    setError('');
    setInfoMsg('');
  };

  return (
    <main className="login-shell min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Éléments d'arrière-plan animés aux couleurs officielles AEJ */}
      <div className="login-grid absolute inset-0" aria-hidden="true" />
      <div className="login-scan login-scan-one absolute" aria-hidden="true" />
      <div className="login-scan login-scan-two absolute" aria-hidden="true" />
      <div className="login-accent login-accent-orange absolute" aria-hidden="true" />
      <div className="login-accent login-accent-green absolute" aria-hidden="true" />
      <div className="login-horizon absolute" aria-hidden="true" />
      <div className="login-beam login-beam-orange absolute" aria-hidden="true" />
      <div className="login-beam login-beam-green absolute" aria-hidden="true" />
      <div className="login-particles login-particles-orange absolute" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
      </div>
      <div className="login-particles login-particles-green absolute" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      {/* Carte Centrale de Connexion */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        
        {step === 'CREDENTIALS' ? (
          /* =========================================================================
             ÉTAPE 1 : IDENTIFIANT & MOT DE PASSE
             ========================================================================= */
          <form onSubmit={handleCredentialsSubmit} className="login-card w-full rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-2xl space-y-6">
            
            {/* Logo et Entête */}
            <div className="login-brand text-center space-y-2">
              <img 
                src="/logo-aej.png" 
                alt="Agence Emploi Jeunes" 
                className="mx-auto h-20 w-20 object-contain drop-shadow-sm" 
              />
              <div className="flex items-center justify-center gap-2 pt-1">
                <LockKeyhole className="w-5 h-5 text-aej-orange" />
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">AEJ Bouaké</h1>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Système Intégré des Immersions
              </p>
            </div>

            {/* Affichage d'erreur éventuelle */}
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700 animate-in shake duration-200">
                {error}
              </div>
            )}

            {/* Champ Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                Adresse e-mail professionnelle
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="exemple@emploi.ci"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-aej-orange focus:ring-2 focus:ring-aej-orange/30 transition shadow-sm" 
                />
              </div>
            </div>

            {/* Champ Mot de Passe */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                Mot de passe
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-aej-orange focus:ring-2 focus:ring-aej-orange/30 transition shadow-sm" 
                />
              </div>
            </div>

            {/* Bouton de Soumission */}
            <button 
              disabled={loading} 
              type="submit"
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-aej-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification des identifiants…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Valider & Recevoir le Code par E-mail</span>
                </>
              )}
            </button>

            {/* Note de Sécurité */}
            <div className="pt-2 text-center text-[10px] text-slate-400 font-medium">
              🔒 Authentification forte en 2 étapes avec validation par e-mail
            </div>

          </form>
        ) : (
          /* =========================================================================
             ÉTAPE 2 : VALIDATION DU CODE OTP 6 CHIFFRES
             ========================================================================= */
          <form onSubmit={handleOtpSubmit} className="login-card w-full rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-2xl space-y-6 animate-in slide-in-from-right-4 duration-300">
            
            {/* Logo et Entête */}
            <div className="login-brand text-center space-y-2">
              <div className="w-16 h-16 bg-orange-100 text-aej-orange rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-orange-200">
                <ShieldCheck className="w-9 h-9 text-aej-orange" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight pt-2">
                Validation par E-mail
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Un code à 6 chiffres a été envoyé à :<br />
                <strong className="text-slate-800 font-bold font-mono">{email}</strong>
              </p>
            </div>

            {/* Notification de succès d'envoi */}
            {infoMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* Affichage d'erreur éventuelle */}
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700 animate-in shake duration-200">
                {error}
              </div>
            )}

            {/* Saisie du Code OTP 6 Chiffres */}
            <div className="space-y-2 text-center">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Saisissez le code à 6 chiffres
              </label>
              <input
                autoFocus
                required
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(val);
                  setError('');
                }}
                placeholder="• • • • • •"
                className="w-full text-center text-2xl font-mono font-black tracking-[0.6em] py-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-slate-900 outline-none focus:border-aej-orange focus:bg-white focus:ring-4 focus:ring-aej-orange/20 transition shadow-inner"
              />
              
              {/* Minuteur d'expiration (5 min) */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1 px-1">
                <span>Temps restant :</span>
                <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-emerald-700'}`}>
                  ⏱️ {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Bouton de Validation */}
            <button 
              disabled={loading || otpCode.trim().length !== 6 || timeLeft === 0} 
              type="submit"
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-700/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validation du code…</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmer le Code & Se Connecter</span>
                </>
              )}
            </button>

            {/* Options secondaires : Renvoi et Changement de compte */}
            <div className="pt-2 space-y-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="flex items-center justify-center gap-1.5 mx-auto text-xs font-bold text-aej-orange hover:text-orange-700 disabled:text-slate-400 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0 
                    ? `Renvoyer un nouveau code (${resendCooldown}s)` 
                    : 'Renvoyer un nouveau code par e-mail'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleBackToCredentials}
                className="flex items-center justify-center gap-1 mx-auto text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Utiliser un autre identifiant</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </main>
  );
}


