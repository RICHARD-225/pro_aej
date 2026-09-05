-- =============================================================================
-- AEJ BOUAKE
-- SYSTEME CENTRALISE DE GESTION DES DOSSIERS D'IMMERSION
--
-- SGBD : MySQL 8.0+
-- Normalisation : 3NF
--
-- Fonctionnalites principales :
-- - Gestion des utilisateurs et des roles
-- - Gestion des agences
-- - Gestion des candidats
-- - Gestion des tuteurs
-- - Gestion des entreprises
-- - Gestion des dossiers d'immersion
-- - Verification physique et numerique
-- - Demandes de correction
-- - Validation
-- - Generation d'attestations par entreprise
-- - Historique et audit
-- =============================================================================


CREATE DATABASE IF NOT EXISTS aej_immersion_db
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE aej_immersion_db;


-- =============================================================================
-- ATTENTION : ce fichier est un modèle de référence pour une base neuve.
-- Pour une base existante, utiliser exclusivement `npm run prisma:migrate`.
-- =============================================================================

-- Aucune table n'est supprimée ici. Les évolutions doivent passer par Prisma.


-- =============================================================================
-- 1. TABLE DES AGENCES
-- =============================================================================

CREATE TABLE agences (

    id VARCHAR(36) NOT NULL,

    nom VARCHAR(150) NOT NULL,

    ville VARCHAR(150) NOT NULL,

    directeur_nom VARCHAR(100) NOT NULL,

    directeur_prenoms VARCHAR(150) NOT NULL,

    directeur_titre VARCHAR(150) NOT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_agence_nom (nom)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 2. TABLE DES UTILISATEURS
-- =============================================================================

CREATE TABLE users (

    id VARCHAR(36) NOT NULL,

    agence_id VARCHAR(36) NOT NULL,

    email VARCHAR(191) NOT NULL,

    mot_de_passe_hash VARCHAR(255) NOT NULL,

    nom VARCHAR(100) NOT NULL,

    prenoms VARCHAR(150) NOT NULL,

    role ENUM(
        'CONSEILLER',
        'SERVICE_INFO',
        'DIRECTION'
    ) NOT NULL,

    titre VARCHAR(150) NULL,

    avatar VARCHAR(255) NULL,

    actif TINYINT(1) NOT NULL DEFAULT 1,

    session_version INT NOT NULL DEFAULT 0,

    password_change_required TINYINT(1) NOT NULL DEFAULT 0,

    last_login_at DATETIME NULL,

    login_count INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_users_email (email),

    INDEX idx_users_agence (agence_id),

    INDEX idx_users_role (role),

    CONSTRAINT fk_users_agence
        FOREIGN KEY (agence_id)
        REFERENCES agences(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- JOURNAL DES SESSIONS
-- =============================================================================

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


-- =============================================================================
-- 3. TABLE DES CANDIDATS
--
-- Le candidat represente la personne independamment de son dossier.
--
-- Le numero de paiement Tresor Money appartient au candidat.
-- =============================================================================

CREATE TABLE candidats (

    id VARCHAR(36) NOT NULL,

    nom VARCHAR(100) NOT NULL,

    prenoms VARCHAR(150) NOT NULL,

    sexe ENUM(
        'HOMME',
        'FEMME'
    ) NOT NULL,

    date_naissance DATE NOT NULL,

    lieu_naissance VARCHAR(150) NOT NULL,

    sous_prefecture_naissance VARCHAR(150) NOT NULL,

    handicap TINYINT(1) NOT NULL DEFAULT 0,

    autre_type_handicap VARCHAR(150) NULL,

    nature_piece_identite VARCHAR(100) NOT NULL,

    numero_piece_identite VARCHAR(50) NOT NULL,

    contact_1 VARCHAR(30) NOT NULL,

    contact_2 VARCHAR(30) NULL,

    niveau_etude VARCHAR(100) NOT NULL,

    etablissement_frequente VARCHAR(200) NOT NULL,

    type_enseignement VARCHAR(150) NOT NULL,

    sous_prefecture_residence VARCHAR(150) NOT NULL,

    localite_residence VARCHAR(150) NOT NULL,

    type_paiement ENUM(
        'TRESOR_MONEY',
        'WAVE',
        'ORANGE_MONEY',
        'MTN_MOMO',
        'MOOV_MONEY',
        'AUTRE'
    ) NOT NULL DEFAULT 'TRESOR_MONEY',

    numero_paiement VARCHAR(30) NOT NULL,

    actif TINYINT(1) NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_candidat_piece_identite
        (numero_piece_identite),

    INDEX idx_candidats_nom_prenoms
        (nom, prenoms),

    INDEX idx_candidats_contact_1
        (contact_1),

    INDEX idx_candidats_paiement
        (numero_paiement)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 4. TABLE DES TUTEURS
-- =============================================================================

CREATE TABLE tuteurs (

    id VARCHAR(36) NOT NULL,

    nom_prenoms VARCHAR(200) NOT NULL,

    contact VARCHAR(30) NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_tuteurs_nom
        (nom_prenoms),

    INDEX idx_tuteurs_contact
        (contact)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 5. TABLE DE RELATION CANDIDATS / TUTEURS
--
-- Un candidat peut avoir un ou plusieurs tuteurs.
-- Un tuteur peut etre lie a plusieurs candidats.
-- =============================================================================

CREATE TABLE candidat_tuteur (

    candidat_id VARCHAR(36) NOT NULL,

    tuteur_id VARCHAR(36) NOT NULL,

    lien_parente VARCHAR(100) NOT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
        candidat_id,
        tuteur_id
    ),

    CONSTRAINT fk_candidat_tuteur_candidat
        FOREIGN KEY (candidat_id)
        REFERENCES candidats(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_candidat_tuteur_tuteur
        FOREIGN KEY (tuteur_id)
        REFERENCES tuteurs(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 6. TABLE DES ENTREPRISES
-- =============================================================================

CREATE TABLE entreprises (

    id VARCHAR(36) NOT NULL,

    raison_sociale VARCHAR(200) NOT NULL,

    type_entreprise ENUM(
        'PRIVE',
        'PUBLIC_NON_EPN',
        'EPN'
    ) NOT NULL DEFAULT 'PRIVE',

    branche_activite VARCHAR(150) NOT NULL,

    contact_1 VARCHAR(30) NOT NULL,

    contact_2 VARCHAR(30) NULL,

    sous_prefecture VARCHAR(150) NOT NULL,

    localite VARCHAR(150) NOT NULL,

    actif TINYINT(1) NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_entreprises_raison_sociale
        (raison_sociale),

    INDEX idx_entreprises_localite
        (localite)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 7. TABLE CENTRALE DES DOSSIERS D'IMMERSION
--
-- Chaque dossier represente une candidature dans le dispositif IMMERSION.
-- =============================================================================

CREATE TABLE dossiers_immersion (

    id VARCHAR(50) NOT NULL,

    numero_ordre_excel INT NULL,

    date_saisie DATE NOT NULL,

    agence_id VARCHAR(36) NOT NULL,

    candidat_id VARCHAR(36) NOT NULL,

    entreprise_id VARCHAR(36) NOT NULL,

    conseiller_id VARCHAR(36) NOT NULL,

    service_affectation VARCHAR(150) NOT NULL,

    date_debut_stage DATE NOT NULL,

    date_fin_previsionnelle DATE NOT NULL,

    departement_administratif_stage VARCHAR(150) NOT NULL,

    sous_prefecture_lieu_stage VARCHAR(150) NOT NULL,

    localite_lieu_stage VARCHAR(150) NOT NULL,

    statut_workflow ENUM(
        'BROUILLON',
        'SOUMIS',
        'EN_VERIFICATION',
        'CORRECTION_DEMANDEE',
        'RESOUMIS',
        'VALIDE',
        'ATTESTATION_GENEREE',
        'REJETE',
        'ARCHIVE'
    ) NOT NULL DEFAULT 'BROUILLON',

    date_validation DATETIME NULL,

    valide_par_id VARCHAR(36) NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_dossiers_agence
        (agence_id),

    INDEX idx_dossiers_candidat
        (candidat_id),

    INDEX idx_dossiers_entreprise
        (entreprise_id),

    INDEX idx_dossiers_conseiller
        (conseiller_id),

    INDEX idx_dossiers_statut
        (statut_workflow),

    INDEX idx_dossiers_dates
        (date_debut_stage, date_fin_previsionnelle),

    CONSTRAINT fk_dossiers_agence
        FOREIGN KEY (agence_id)
        REFERENCES agences(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_dossiers_candidat
        FOREIGN KEY (candidat_id)
        REFERENCES candidats(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_dossiers_entreprise
        FOREIGN KEY (entreprise_id)
        REFERENCES entreprises(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_dossiers_conseiller
        FOREIGN KEY (conseiller_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_dossiers_validateur
        FOREIGN KEY (valide_par_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_dates_stage
        CHECK (
            date_fin_previsionnelle >= date_debut_stage
        )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 8. TYPES DE VERIFICATION
--
-- Cette table permet d'ajouter ou supprimer des points de controle
-- sans modifier la structure SQL.
-- =============================================================================

CREATE TABLE types_verification (

    id INT AUTO_INCREMENT NOT NULL,

    libelle VARCHAR(200) NOT NULL,

    description TEXT NULL,

    ordre_affichage INT NOT NULL,

    obligatoire TINYINT(1) NOT NULL DEFAULT 1,

    actif TINYINT(1) NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_types_verification_libelle
        (libelle),

    UNIQUE KEY uq_types_verification_ordre
        (ordre_affichage)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 9. ELEMENTS DE VERIFICATION
--
-- Chaque ligne represente un point de controle pour un dossier.
-- =============================================================================

CREATE TABLE verification_items (

    id VARCHAR(36) NOT NULL,

    dossier_id VARCHAR(50) NOT NULL,

    type_verification_id INT NOT NULL,

    conforme TINYINT(1) NOT NULL DEFAULT 0,

    observation TEXT NULL,

    verifie_par_id VARCHAR(36) NULL,

    date_verification DATETIME NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_verification_dossier_type
        (
            dossier_id,
            type_verification_id
        ),

    INDEX idx_verification_dossier
        (dossier_id),

    CONSTRAINT fk_verification_dossier
        FOREIGN KEY (dossier_id)
        REFERENCES dossiers_immersion(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_verification_type
        FOREIGN KEY (type_verification_id)
        REFERENCES types_verification(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_verification_user
        FOREIGN KEY (verifie_par_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 10. TABLE DES DEMANDES DE CORRECTION
--
-- Un dossier peut passer plusieurs fois par un cycle :
--
-- SOUMIS
--    ↓
-- CORRECTION DEMANDEE
--    ↓
-- CORRIGE
--    ↓
-- RESOUMIS
-- =============================================================================

CREATE TABLE corrections (

    id VARCHAR(36) NOT NULL,

    dossier_id VARCHAR(50) NOT NULL,

    demande_par_id VARCHAR(36) NOT NULL,

    motif TEXT NOT NULL,

    statut ENUM(
        'EN_ATTENTE',
        'CORRIGEE',
        'ANNULEE'
    ) NOT NULL DEFAULT 'EN_ATTENTE',

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    corrigee_at DATETIME NULL,

    PRIMARY KEY (id),

    INDEX idx_corrections_dossier
        (dossier_id),

    INDEX idx_corrections_statut
        (statut),

    CONSTRAINT fk_corrections_dossier
        FOREIGN KEY (dossier_id)
        REFERENCES dossiers_immersion(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_corrections_demandeur
        FOREIGN KEY (demande_par_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 11. TABLE DES ATTESTATIONS
--
-- Attestation regroupant les stagiaires valides d'une meme entreprise.
-- =============================================================================

CREATE TABLE attestations (

    id VARCHAR(36) NOT NULL,

    type_attestation ENUM(
        'ENTREPRISE'
    ) NOT NULL,

    numero_attestation VARCHAR(100) NOT NULL,

    dossier_id VARCHAR(50) NULL,

    entreprise_id VARCHAR(36) NULL,

    agence_id VARCHAR(36) NOT NULL,

    periode_debut DATE NULL,

    periode_fin DATE NULL,

    generee_par_id VARCHAR(36) NOT NULL,

    date_generation DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    chemin_fichier VARCHAR(500) NULL,

    statut ENUM(
        'GENEREE',
        'ANNULEE'
    ) NOT NULL DEFAULT 'GENEREE',

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_attestations_numero
        (numero_attestation),

    INDEX idx_attestations_dossier
        (dossier_id),

    INDEX idx_attestations_entreprise
        (entreprise_id),

    INDEX idx_attestations_type
        (type_attestation),

    CONSTRAINT fk_attestations_dossier
        FOREIGN KEY (dossier_id)
        REFERENCES dossiers_immersion(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_attestations_entreprise
        FOREIGN KEY (entreprise_id)
        REFERENCES entreprises(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_attestations_agence
        FOREIGN KEY (agence_id)
        REFERENCES agences(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_attestations_generee_par
        FOREIGN KEY (generee_par_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 12. HISTORIQUE ET AUDIT
--
-- Chaque action importante est conservee :
--
-- - Creation
-- - Modification
-- - Soumission
-- - Verification
-- - Demande de correction
-- - Correction
-- - Resoumission
-- - Validation
-- - Generation d'attestation
-- =============================================================================

CREATE TABLE historiques_audit (

    id BIGINT AUTO_INCREMENT NOT NULL,

    dossier_id VARCHAR(50) NOT NULL,

    auteur_id VARCHAR(36) NOT NULL,

    action VARCHAR(100) NOT NULL,

    description TEXT NULL,

    ancien_statut VARCHAR(50) NULL,

    nouveau_statut VARCHAR(50) NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_audit_dossier
        (dossier_id),

    INDEX idx_audit_auteur
        (auteur_id),

    INDEX idx_audit_date
        (created_at),

    CONSTRAINT fk_audit_dossier
        FOREIGN KEY (dossier_id)
        REFERENCES dossiers_immersion(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_audit_auteur
        FOREIGN KEY (auteur_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- DONNEES INITIALES
-- =============================================================================


-- AGENCE AEJ BOUAKE

INSERT INTO agences (
    id,
    nom,
    ville
)
VALUES (
    'AGENCE-BOUAKE-001',
    'AEJ Bouake',
    'Bouake'
);


-- =============================================================================
-- TYPES DE VERIFICATION INITIAUX
--
-- Les 9 points peuvent etre modifies plus tard sans modifier le schema.
-- =============================================================================

INSERT INTO types_verification (
    libelle,
    description,
    ordre_affichage,
    obligatoire
)
VALUES

(
    'Identite conforme',
    'Verification de la conformite des informations d''identite.',
    1,
    1
),

(
    'Telephone conforme',
    'Verification du numero de telephone du candidat.',
    2,
    1
),

(
    'Piece d''identite conforme',
    'Verification de la piece d''identite et de son numero.',
    3,
    1
),

(
    'Convention conforme',
    'Verification de la convention ou des documents administratifs.',
    4,
    1
),

(
    'Entreprise conforme',
    'Verification des informations de la structure d''accueil.',
    5,
    1
),

(
    'Service d''affectation conforme',
    'Verification du service ou poste d''affectation.',
    6,
    1
),

(
    'Dates de stage conformes',
    'Verification de la date de debut et de fin du stage.',
    7,
    1
),

(
    'Signatures conformes',
    'Verification de la presence et de la validite des signatures.',
    8,
    1
),

(
    'Dossier physique present',
    'Verification de la presence du dossier physique.',
    9,
    1
);


-- =============================================================================
-- FIN DU SCRIPT
-- =============================================================================