/**
 * RLS (Row Level Security) integration tests.
 *
 * Connects directly to Supabase Postgres, seeds data inside a transaction,
 * simulates authenticated users via SET LOCAL, and rolls back after each test.
 *
 * Requires SUPABASE_DB_URL env variable (set in .env.local).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import pg from 'pg';

const { Pool } = pg;

const DB_URL = process.env.SUPABASE_DB_URL;

// Fixed test UUIDs
const JAN = '00000000-0000-0000-0000-000000000001';
const SOPHIE = '00000000-0000-0000-0000-000000000002';
const CAROL = '00000000-0000-0000-0000-000000000003';
const ROOM = '00000000-0000-0000-0000-000000000010';
const CONV = '00000000-0000-0000-0000-000000000020';

function jwt(userId: string) {
  return JSON.stringify({ sub: userId, role: 'authenticated' });
}

describe.skipIf(!DB_URL)('RLS policies', () => {
  let pool: InstanceType<typeof Pool>;
  let client: pg.PoolClient;

  let dbAvailable = true;

  beforeAll(async () => {
    pool = new Pool({ connectionString: DB_URL });
    // Verify connectivity — skip all tests if DB is unreachable
    try {
      const probe = await pool.connect();
      probe.release();
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async (ctx) => {
    if (!dbAvailable) ctx.skip();
    client = await pool.connect();
    await client.query('BEGIN');
    await seedBaseData();
  });

  afterEach(async () => {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
  });

  /** Switch the session to an authenticated user */
  async function actAs(userId: string) {
    await client.query("SET LOCAL role = 'authenticated'");
    await client.query(`SET LOCAL request.jwt.claims = '${jwt(userId)}'`);
  }

  /** Reset back to superuser (for mid-test inserts) */
  async function resetRole() {
    await client.query('RESET role');
    await client.query("SET LOCAL request.jwt.claims = ''");
  }

  /** Seed user + profiles, a room, and Sophie as the room owner */
  async function seedBaseData() {
    // Remove any conflicting seed data (rolled back with the transaction)
    await client.query(
      'DELETE FROM housemates WHERE user_id = ANY($1)',
      [[JAN, SOPHIE, CAROL]],
    );
    await client.query('DELETE FROM rooms WHERE id = $1', [ROOM]);
    await client.query(
      'DELETE FROM profiles WHERE id = ANY($1)',
      [[JAN, SOPHIE, CAROL]],
    );
    await client.query(
      'DELETE FROM "user" WHERE id = ANY($1)',
      [[JAN, SOPHIE, CAROL]],
    );

    await client.query(`
      INSERT INTO "user" (id, name, email, "emailVerified")
      VALUES
        ($1, 'Jan Jansen',    'jan-test@id.openhospi.nl',    true),
        ($2, 'Sophie de Vries', 'sophie-test@id.openhospi.nl', true),
        ($3, 'Carol Smit',    'carol-test@id.openhospi.nl',  true)
    `, [JAN, SOPHIE, CAROL]);

    await client.query(`
      INSERT INTO profiles (id, first_name, last_name, email, institution_domain)
      VALUES
        ($1, 'Jan',    'Jansen',   'jan@test.nl',    'test.nl'),
        ($2, 'Sophie', 'de Vries', 'sophie@test.nl', 'test.nl'),
        ($3, 'Carol',  'Smit',     'carol@test.nl',  'test.nl')
    `, [JAN, SOPHIE, CAROL]);

    await client.query(`
      INSERT INTO rooms (id, created_by, title, city, rent_price, status)
      VALUES ($1, $2, 'Sophie Room', 'amsterdam', 500, 'active')
    `, [ROOM, SOPHIE]);

    await client.query(`
      INSERT INTO housemates (room_id, user_id, role)
      VALUES ($1, $2, 'owner')
    `, [ROOM, SOPHIE]);
  }

  // ==========================================================================
  // profiles
  // ==========================================================================
  describe('profiles', () => {
    it('any authenticated user can read all profiles', async () => {
      await actAs(JAN);
      const { rows } = await client.query('SELECT id FROM profiles');
      expect(rows.length).toBe(3);
    });

    it('user can update own profile', async () => {
      await actAs(JAN);
      const { rowCount } = await client.query(
        "UPDATE profiles SET bio = 'hello' WHERE id = $1", [JAN],
      );
      expect(rowCount).toBe(1);
    });

    it('user cannot update another profile', async () => {
      await actAs(JAN);
      const { rowCount } = await client.query(
        "UPDATE profiles SET bio = 'hacked' WHERE id = $1", [SOPHIE],
      );
      expect(rowCount).toBe(0);
    });

    it('user cannot delete another profile', async () => {
      await actAs(JAN);
      const { rowCount } = await client.query(
        'DELETE FROM profiles WHERE id = $1', [SOPHIE],
      );
      expect(rowCount).toBe(0);
    });

    it('user can insert own profile (id = self)', async () => {
      const NEW_USER = '00000000-0000-0000-0000-000000000099';
      // FK requires a user row first
      await resetRole();
      await client.query(
        `INSERT INTO "user" (id, name, email, "emailVerified")
         VALUES ($1, 'New User', 'new-test@id.openhospi.nl', true)`,
        [NEW_USER],
      );
      await actAs(NEW_USER);
      const { rowCount } = await client.query(
        `INSERT INTO profiles (id, first_name, last_name, email, institution_domain)
         VALUES ($1, 'New', 'User', 'new@test.nl', 'test.nl')`,
        [NEW_USER],
      );
      expect(rowCount).toBe(1);
    });
  });

  // ==========================================================================
  // rooms
  // ==========================================================================
  describe('rooms', () => {
    it('any authenticated user can see active rooms', async () => {
      await actAs(JAN);
      const { rows } = await client.query('SELECT id FROM rooms');
      expect(rows.length).toBe(1);
    });

    it('owner can see own draft rooms', async () => {
      await resetRole();
      await client.query(`
        INSERT INTO rooms (id, created_by, title, city, rent_price, status)
        VALUES ('00000000-0000-0000-0000-000000000011', $1, 'Draft', 'utrecht', 400, 'draft')
      `, [SOPHIE]);

      await actAs(SOPHIE);
      const { rows } = await client.query('SELECT id FROM rooms');
      expect(rows.length).toBe(2); // active + own draft
    });

    it('non-owner cannot see draft rooms', async () => {
      await resetRole();
      await client.query(`
        INSERT INTO rooms (id, created_by, title, city, rent_price, status)
        VALUES ('00000000-0000-0000-0000-000000000011', $1, 'Draft', 'utrecht', 400, 'draft')
      `, [SOPHIE]);

      await actAs(JAN);
      const { rows } = await client.query('SELECT id FROM rooms');
      expect(rows.length).toBe(1); // only active
    });

    it('user can create a room as themselves', async () => {
      await actAs(JAN);
      const { rowCount } = await client.query(`
        INSERT INTO rooms (created_by, title, city, rent_price)
        VALUES ($1, 'Jan Room', 'rotterdam', 350)
      `, [JAN]);
      expect(rowCount).toBe(1);
    });

    it('user cannot impersonate another creator', async () => {
      await actAs(JAN);
      await expect(
        client.query(`
          INSERT INTO rooms (created_by, title, city, rent_price)
          VALUES ($1, 'Fake Room', 'rotterdam', 350)
        `, [SOPHIE]),
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // housemates
  // ==========================================================================
  describe('housemates', () => {
    it('housemate can see fellow housemates', async () => {
      await actAs(SOPHIE);
      const { rows } = await client.query('SELECT user_id FROM housemates');
      expect(rows.length).toBe(1);
      expect(rows[0].user_id).toBe(SOPHIE);
    });

    it('non-housemate cannot see any housemates', async () => {
      await actAs(JAN);
      const { rows } = await client.query('SELECT user_id FROM housemates');
      expect(rows.length).toBe(0);
    });

    it('owner can add a new housemate', async () => {
      await actAs(SOPHIE);
      const { rowCount } = await client.query(`
        INSERT INTO housemates (room_id, user_id, role)
        VALUES ($1, $2, 'member')
      `, [ROOM, JAN]);
      expect(rowCount).toBe(1);
    });

    it('member cannot add a housemate', async () => {
      // First add Jan as member (as superuser)
      await resetRole();
      await client.query(`
        INSERT INTO housemates (room_id, user_id, role)
        VALUES ($1, $2, 'member')
      `, [ROOM, JAN]);

      await actAs(JAN);
      await expect(
        client.query(`
          INSERT INTO housemates (room_id, user_id, role)
          VALUES ($1, $2, 'member')
        `, [ROOM, CAROL]),
      ).rejects.toThrow();
    });

    it('member can leave (delete self)', async () => {
      await resetRole();
      await client.query(`
        INSERT INTO housemates (room_id, user_id, role)
        VALUES ($1, $2, 'member')
      `, [ROOM, JAN]);

      await actAs(JAN);
      const { rowCount } = await client.query(
        'DELETE FROM housemates WHERE room_id = $1 AND user_id = $2',
        [ROOM, JAN],
      );
      expect(rowCount).toBe(1);
    });
  });

  // ==========================================================================
  // applications
  // ==========================================================================
  describe('applications', () => {
    const APP = '00000000-0000-0000-0000-000000000030';

    it('applicant can see own application', async () => {
      await resetRole();
      await client.query(`
        INSERT INTO applications (id, room_id, user_id, personal_message)
        VALUES ($1, $2, $3, 'I want to live here!')
      `, [APP, ROOM, JAN]);

      await actAs(JAN);
      const { rows } = await client.query('SELECT id FROM applications');
      expect(rows.length).toBe(1);
    });

    it('housemate can see room applications', async () => {
      await resetRole();
      await client.query(`
        INSERT INTO applications (id, room_id, user_id, personal_message)
        VALUES ($1, $2, $3, 'Pick me!')
      `, [APP, ROOM, JAN]);

      await actAs(SOPHIE);
      const { rows } = await client.query('SELECT id FROM applications');
      expect(rows.length).toBe(1);
    });

    it('unrelated user cannot see applications', async () => {
      await resetRole();
      await client.query(`
        INSERT INTO applications (id, room_id, user_id, personal_message)
        VALUES ($1, $2, $3, 'Pick me!')
      `, [APP, ROOM, JAN]);

      await actAs(CAROL);
      const { rows } = await client.query('SELECT id FROM applications');
      expect(rows.length).toBe(0);
    });

    it('user can insert own application', async () => {
      await actAs(JAN);
      const { rowCount } = await client.query(`
        INSERT INTO applications (room_id, user_id, personal_message)
        VALUES ($1, $2, 'Hello!')
      `, [ROOM, JAN]);
      expect(rowCount).toBe(1);
    });

    it('user cannot impersonate applicant', async () => {
      await actAs(JAN);
      await expect(
        client.query(`
          INSERT INTO applications (room_id, user_id, personal_message)
          VALUES ($1, $2, 'Fake!')
        `, [ROOM, CAROL]),
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // messages (conversations + members + messages)
  // ==========================================================================
  describe('messages', () => {
    beforeEach(async () => {
      // Seed conversation with Jan & Sophie as members
      await resetRole();
      await client.query(`
        INSERT INTO conversations (id, type)
        VALUES ($1, 'direct')
      `, [CONV]);
      await client.query(`
        INSERT INTO conversation_members (conversation_id, user_id)
        VALUES ($1, $2), ($1, $3)
      `, [CONV, JAN, SOPHIE]);
      await client.query(`
        INSERT INTO messages (conversation_id, sender_id, ciphertext, iv)
        VALUES ($1, $2, 'encrypted-text', 'iv-value')
      `, [CONV, JAN]);
    });

    it('member can read messages', async () => {
      await actAs(JAN);
      const { rows } = await client.query('SELECT * FROM messages');
      expect(rows.length).toBe(1);
    });

    it('other member can also read messages', async () => {
      await actAs(SOPHIE);
      const { rows } = await client.query('SELECT * FROM messages');
      expect(rows.length).toBe(1);
    });

    it('non-member cannot read messages', async () => {
      await actAs(CAROL);
      const { rows } = await client.query('SELECT * FROM messages');
      expect(rows.length).toBe(0);
    });

    it('member can send a message', async () => {
      await actAs(SOPHIE);
      const { rowCount } = await client.query(`
        INSERT INTO messages (conversation_id, sender_id, ciphertext, iv)
        VALUES ($1, $2, 'reply', 'iv2')
      `, [CONV, SOPHIE]);
      expect(rowCount).toBe(1);
    });

    it('non-member cannot send a message', async () => {
      await actAs(CAROL);
      await expect(
        client.query(`
          INSERT INTO messages (conversation_id, sender_id, ciphertext, iv)
          VALUES ($1, $2, 'spam', 'iv3')
        `, [CONV, CAROL]),
      ).rejects.toThrow();
    });

    it('cannot spoof sender', async () => {
      await actAs(SOPHIE);
      await expect(
        client.query(`
          INSERT INTO messages (conversation_id, sender_id, ciphertext, iv)
          VALUES ($1, $2, 'fake', 'iv4')
        `, [CONV, JAN]),
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // blocks
  // ==========================================================================
  describe('blocks', () => {
    it('user can create a block', async () => {
      await actAs(JAN);
      const { rowCount } = await client.query(
        'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)',
        [JAN, CAROL],
      );
      expect(rowCount).toBe(1);
    });

    it('user can see own blocks', async () => {
      await resetRole();
      await client.query(
        'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)',
        [JAN, CAROL],
      );

      await actAs(JAN);
      const { rows } = await client.query('SELECT * FROM blocks');
      expect(rows.length).toBe(1);
    });

    it('blocked user cannot see who blocked them', async () => {
      await resetRole();
      await client.query(
        'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)',
        [JAN, CAROL],
      );

      await actAs(CAROL);
      const { rows } = await client.query('SELECT * FROM blocks');
      expect(rows.length).toBe(0);
    });

    it('user can delete own block', async () => {
      await resetRole();
      await client.query(
        'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)',
        [JAN, CAROL],
      );

      await actAs(JAN);
      const { rowCount } = await client.query(
        'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
        [JAN, CAROL],
      );
      expect(rowCount).toBe(1);
    });
  });

  // ==========================================================================
  // private_key_backups
  // ==========================================================================
  describe('private_key_backups', () => {
    it('user can insert and read own backup', async () => {
      await actAs(JAN);
      await client.query(`
        INSERT INTO private_key_backups (user_id, encrypted_private_key, backup_iv, backup_key)
        VALUES ($1, 'enc-key', 'iv', 'key')
      `, [JAN]);

      const { rows } = await client.query('SELECT * FROM private_key_backups');
      expect(rows.length).toBe(1);
      expect(rows[0].user_id).toBe(JAN);
    });

    it('user cannot read another user backup', async () => {
      await resetRole();
      await client.query(`
        INSERT INTO private_key_backups (user_id, encrypted_private_key, backup_iv, backup_key)
        VALUES ($1, 'enc-key', 'iv', 'key')
      `, [SOPHIE]);

      await actAs(JAN);
      const { rows } = await client.query('SELECT * FROM private_key_backups');
      expect(rows.length).toBe(0);
    });

    it('user cannot insert backup for another user', async () => {
      await actAs(JAN);
      await expect(
        client.query(`
          INSERT INTO private_key_backups (user_id, encrypted_private_key, backup_iv, backup_key)
          VALUES ($1, 'enc-key', 'iv', 'key')
        `, [SOPHIE]),
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // admin_audit_log
  // ==========================================================================
  describe('admin_audit_log', () => {
    it('authenticated user cannot read audit log', async () => {
      await resetRole();
      await client.query(`
        INSERT INTO admin_audit_log (admin_user_id, action, reason)
        VALUES ($1, 'view_report', 'test')
      `, [JAN]);

      await actAs(JAN);
      const { rows } = await client.query('SELECT * FROM admin_audit_log');
      expect(rows.length).toBe(0);
    });

    it('authenticated user cannot insert into audit log', async () => {
      await actAs(JAN);
      await expect(
        client.query(`
          INSERT INTO admin_audit_log (admin_user_id, action, reason)
          VALUES ($1, 'view_report', 'test')
        `, [JAN]),
      ).rejects.toThrow();
    });

    it('authenticated user cannot delete from audit log', async () => {
      await resetRole();
      await client.query(`
        INSERT INTO admin_audit_log (admin_user_id, action, reason)
        VALUES ($1, 'view_report', 'test')
      `, [JAN]);

      await actAs(JAN);
      const { rowCount } = await client.query('DELETE FROM admin_audit_log');
      expect(rowCount).toBe(0);
    });
  });
});
