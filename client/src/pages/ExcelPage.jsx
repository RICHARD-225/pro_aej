import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Download, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function ExcelPage({ currentUser, dossiers }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFilePick = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(selected.type) && !/\.(xlsx|xls)$/i.test(selected.name)) {
      setError('Format invalide. Sélectionnez un fichier Excel (.xlsx ou .xls).');
      return;
    }
    setFile(selected);
    setError('');
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Choisissez d’abord un fichier Excel.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const formData = new FormData();
      formData.append('file', file);
      if (currentUser?.role === 'SERVICE_INFO') {
        formData.append('conseiller_id', currentUser.id);
      }

      const response = await fetch('/api/dossiers/import-excel', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {})
        },
        body: formData
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Erreur lors de l’import Excel.');
      }

      setResult(payload.data);
      setMessage(`Import terminé : ${payload.data.imported.length} dossiers importés, ${payload.data.failed.length} lignes refusées.`);
      setFile(null);
    } catch (err) {
      setError(err.message || 'L’import Excel a échoué.');
    } finally {
      setLoading(false);
    }
  };

  // export excel
  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/dossiers/export-excel', {
        credentials: 'include',
        headers: {
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {})
        }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'Erreur lors de l’export Excel.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dossiers_aej.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage('Export Excel terminé avec succès.');
    } catch (err) {
      setError(err.message || 'L’export Excel a échoué.');
    } finally {
      setLoading(false);
    }
  };
/////////// --->>
  const templateColumns = [
    'Nom', 'Prenoms', 'Sexe', 'Date de Naissance', 'Contact 1', 'Numéro Pièce Identité',
    'Numéro Paiement', 'Tuteur Nom Prenoms', 'Contact Tuteur', 'Entreprise Nom',
    'Service Affectation', 'Date Début Stage', 'Date Fin Stage'
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-2 text-slate-800">
      <div className="rounded-2xl bg-gradient-to-r from-aej-orange via-orange-500 to-aej-green p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <FileSpreadsheet size={32} />
          <h1 className="text-2xl font-bold">Import / Export Excel</h1>
        </div>
        <p className="text-sm text-white/90">
          Importez les informations complètes d’un formulaire ou exportez l’ensemble des dossiers de votre agence au format Excel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="text-aej-orange" size={22} />
            <h2 className="text-xl font-bold">Importer depuis Excel</h2>
          </div>

          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <input id="excel-import-input" type="file" accept=".xlsx,.xls" onChange={handleFilePick} className="hidden" />
            <label htmlFor="excel-import-input" className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-aej-orange px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600">
              Sélectionner un fichier Excel
            </label>

            {file && (
              <div className="mt-4 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 border border-slate-200 flex items-center justify-between gap-3">
                <span className="truncate">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-xs font-semibold text-aej-green hover:underline">Retirer</button>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="mt-5 w-full rounded-xl bg-aej-green px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 hover:bg-green-700 transition"
          >
            {loading ? <span className="inline-flex items-center gap-2"><Loader className="animate-spin" size={16} /> Traitement...</span> : 'Importer les dossiers'}
          </button>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && !error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle size={18} className="mt-0.5" />
              <span>{message}</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Download className="text-aej-green" size={22} />
            <h2 className="text-xl font-bold">Exporter vers Excel</h2>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
            <p className="font-semibold mb-2">Le fichier exporté contient :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Informations du candidat</li>
              <li>Informations du tuteur</li>
              <li>Informations de l’entreprise</li>
              <li>Informations du stage</li>
              <li>Statut du dossier et historique</li>
            </ul>
          </div>

          <button
            onClick={handleExport}
            disabled={loading || dossiers.length === 0}
            className="mt-5 w-full rounded-xl bg-aej-orange px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 hover:bg-orange-600 transition"
          >
            {loading ? <span className="inline-flex items-center gap-2"><Loader className="animate-spin" size={16} /> Préparation...</span> : 'Exporter tous les dossiers'}
          </button>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
              <FileText size={18} />
              Modèle attendu
            </div>
            <div className="flex flex-wrap gap-2">
              {templateColumns.map((col) => (
                <span key={col} className="rounded-full bg-white border border-slate-200 px-2 py-1 text-xs text-slate-600">{col}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Résultat du traitement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold text-slate-800">{result.total}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
              <p className="text-sm text-emerald-700">Importés</p>
              <p className="text-2xl font-bold text-emerald-800">{result.imported.length}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-700">Refusés</p>
              <p className="text-2xl font-bold text-red-800">{result.failed.length}</p>
            </div>
          </div>

          {result.failed.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 text-sm font-semibold text-slate-700">Ligne</th>
                    <th className="p-3 text-sm font-semibold text-slate-700">Erreur</th>
                  </tr>
                </thead>
                <tbody>
                  {result.failed.map((item) => (
                    <tr key={item.rowNumber} className="border-t border-slate-200">
                      <td className="p-3 text-sm text-slate-700">{item.rowNumber}</td>
                      <td className="p-3 text-sm text-red-700">{item.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
