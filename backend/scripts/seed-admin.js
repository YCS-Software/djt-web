/**
 * Seed a temporary super-admin user for local development.
 *
 * Usage (from backend/):  node scripts/seed-admin.js
 * Honors the same .env as the app, so run it with the local mock stack
 * (DB_DIALECT=sqlite, REDIS_MOCK=true) to create the login in dev.sqlite.
 */

require('dotenv').config();

const { sequelize, User, Role } = require('../src/models');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@evcharge.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin@123';

async function run() {
  // Create tables if they don't exist yet (dev uses sync, not migrations).
  await sequelize.sync({ alter: true });

  // Super-admin role (frontend treats role name 'super_admin' as having every permission).
  const [role] = await Role.findOrCreate({
    where: { name: 'super_admin' },
    defaults: {
      name: 'super_admin',
      displayName: 'Super Administrator',
      description: 'Full platform access',
      isSystem: true,
    },
  });

  // Admin user. The User model hashes passwordHash via a beforeCreate hook.
  const [user, created] = await User.findOrCreate({
    where: { email: ADMIN_EMAIL },
    defaults: {
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD,
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
      emailVerified: true,
    },
  });

  if (!created) {
    // Reset the password in case the user already existed from a previous run.
    user.passwordHash = ADMIN_PASSWORD;
    user.status = 'active';
    await user.save();
  }

  // Ensure the user<->role link exists (idempotent across re-runs).
  await user.addRole(role);
  await sequelize.query(
    `INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
     SELECT :uid, :rid, datetime('now'), datetime('now')
     WHERE NOT EXISTS (
       SELECT 1 FROM user_roles WHERE user_id = :uid AND role_id = :rid
     )`,
    { replacements: { uid: user.id, rid: role.id } }
  );

  console.log('---------------------------------------------');
  console.log('Temporary admin login ready:');
  console.log('  Email   :', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  console.log('  Role    : super_admin (all menus visible)');
  console.log('---------------------------------------------');

  await sequelize.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
