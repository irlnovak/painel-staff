-- ==========================================
-- F4TE STAFF PANEL - Schema do banco
-- Banco: MySQL / MariaDB
-- ==========================================

CREATE DATABASE IF NOT EXISTS f4te_panel
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE f4te_panel;

-- Tabela de usuários do painel (staff do hotel)
CREATE TABLE IF NOT EXISTS panel_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role ENUM('MOD','ADMIN','HELPER') NOT NULL DEFAULT 'HELPER',
  rank_habbo TINYINT UNSIGNED NOT NULL DEFAULT 1,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultimo_login DATETIME NULL
) ENGINE=InnoDB;

-- Log de ações executadas pelo painel
CREATE TABLE IF NOT EXISTS panel_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  acao VARCHAR(60) NOT NULL,
  alvo VARCHAR(120) NULL,
  detalhes TEXT NULL,
  ip VARCHAR(45) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_acao (acao),
  INDEX idx_data (criado_em),
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES panel_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Eventos do hotel
CREATE TABLE IF NOT EXISTS panel_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  tipo ENUM('EVENTO','PAGAMENTO','HALL','CUSTOM') NOT NULL DEFAULT 'EVENTO',
  descricao TEXT NULL,
  criado_por INT NOT NULL,
  ativo TINYINT(1) DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_user FOREIGN KEY (criado_por) REFERENCES panel_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Registro de pagamentos / cotas
CREATE TABLE IF NOT EXISTS panel_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_habbo VARCHAR(80) NOT NULL,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  descricao VARCHAR(255) NULL,
  registrado_por INT NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_habbo_user (usuario_habbo),
  CONSTRAINT fk_pay_user FOREIGN KEY (registrado_por) REFERENCES panel_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Cota global (zerável)
CREATE TABLE IF NOT EXISTS panel_cota (
  id INT PRIMARY KEY,
  total_atual DECIMAL(12,2) NOT NULL DEFAULT 0,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
INSERT IGNORE INTO panel_cota (id, total_atual) VALUES (1, 0);

-- Usuário admin padrão (senha: Mude123!@#)
-- hash bcrypt gerado para "Mude123!@#" - TROCAR NO PRIMEIRO LOGIN
INSERT IGNORE INTO panel_users (username, password_hash, display_name, role, rank_habbo)
VALUES ('f4te', '$2a$10$YwvH6z1qGq3sKxQ7vJxK9.placeholder.trocar.no.primeiro.login', 'F4TE', 'ADMIN', 7);
