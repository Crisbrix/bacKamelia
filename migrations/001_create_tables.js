const MIGRATIONS = [
  {
    name: '001_create_users_and_messages',
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        username VARCHAR(60) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','presentador') NOT NULL DEFAULT 'presentador',
        full_name VARCHAR(120) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS messages (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        client_name VARCHAR(120) NOT NULL,
        honoree_name VARCHAR(120) NOT NULL,
        message_text TEXT NOT NULL,
        song_request_url VARCHAR(500) NULL,
        priority TINYINT UNSIGNED NOT NULL DEFAULT 2,
        status ENUM('pendiente','leido') NOT NULL DEFAULT 'pendiente',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_messages_status_priority (status, priority),
        KEY idx_messages_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ],
  },
];

module.exports = MIGRATIONS;
