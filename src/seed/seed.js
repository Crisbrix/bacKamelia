const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { closePool } = require('../db/pool');

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin', full_name: 'Administrador Rancho Criadero La Kamelia' },
  { username: 'presentador', password: 'kamelia123', role: 'presentador', full_name: 'Locutor La Kamelia' },
];

async function seed() {
  console.log('==> Creando usuarios iniciales ...');

  for (const account of DEFAULT_USERS) {
    const existing = await User.findByUsername(account.username);

    if (existing) {
      console.log(`   [omitido] ${account.username} (${account.role}) ya existe`);
      continue;
    }

    const passwordHash = await bcrypt.hash(account.password, 10);
    await User.create({
      username: account.username,
      passwordHash,
      role: account.role,
      fullName: account.full_name,
    });

    console.log(`   [creado]  ${account.username} / ${account.password} -> ${account.role}`);
  }

  console.log('==> Seed finalizado.\n');
}

seed()
  .then(closePool)
  .catch(async (error) => {
    console.error('\n[ERROR] No se pudo ejecutar el seed:');
    console.error(error.message);
    await closePool().catch(() => {});
    process.exit(1);
  });
