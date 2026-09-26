const MIGRATIONS = [
  {
    name: '002_add_messages_table_number',
    statements: [
      `ALTER TABLE messages
        ADD COLUMN table_number VARCHAR(20) NULL AFTER song_request_url`,
    ],
  },
];

module.exports = MIGRATIONS;
