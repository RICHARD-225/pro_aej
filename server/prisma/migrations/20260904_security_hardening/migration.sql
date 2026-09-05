-- Migration de durcissement AEJ : sessions, révocation et changement de mot de passe.
ALTER TABLE agences
  ADD COLUMN directeur_nom VARCHAR(100) NOT NULL DEFAULT 'NON RENSEIGNE',
  ADD COLUMN directeur_prenoms VARCHAR(150) NOT NULL DEFAULT 'NON RENSEIGNE',
  ADD COLUMN directeur_titre VARCHAR(150) NOT NULL DEFAULT 'Directeur REGIONAL';

ALTER TABLE users
  ADD COLUMN session_version INT NOT NULL DEFAULT 0,
  ADD COLUMN password_change_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN last_login_at DATETIME NULL,
  ADD COLUMN login_count INT NOT NULL DEFAULT 0;

CREATE TABLE user_session_logs (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  agence_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_session_logs_user_date (user_id, created_at),
  INDEX idx_session_logs_agence_date (agence_id, created_at),
  CONSTRAINT fk_session_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_session_logs_agence FOREIGN KEY (agence_id) REFERENCES agences(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE attestations
  MODIFY COLUMN type_attestation ENUM('ENTREPRISE') NOT NULL;

ALTER TABLE dossiers_immersion
  ADD UNIQUE KEY uq_dossiers_agence_numero_ordre (agence_id, numero_ordre_excel);
