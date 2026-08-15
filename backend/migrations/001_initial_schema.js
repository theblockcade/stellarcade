/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('wallet_address', 56).unique().notNullable();
    table.string('username', 50).nullable();
    table.decimal('balance', 20, 7).defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['wallet_address']);
  });

  await knex.schema.createTable('games', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('game_type', 30).notNullable();
    table.decimal('bet_amount', 20, 7).notNullable();
    table.string('result', 20).notNullable(); // win, loss, pending
    table.decimal('payout', 20, 7).defaultTo(0);
    table.string('tx_hash', 64).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id']);
  });

  await knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('type', 20).notNullable(); // deposit, withdrawal
    table.decimal('amount', 20, 7).notNullable();
    table.string('status', 20).defaultTo('pending'); // pending, success, failed
    table.string('tx_hash', 64).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id']);
  });

  // Create automatic update trigger for updated_at if PostgreSQL
  if (knex.client.config.client === 'postgresql' || knex.client.config.client === 'pg') {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_users_updated_at BEFORE UPDATE
      ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    `);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (knex.client.config.client === 'postgresql' || knex.client.config.client === 'pg') {
    await knex.raw('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
    await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');
  }
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('games');
  await knex.schema.dropTableIfExists('users');
};
