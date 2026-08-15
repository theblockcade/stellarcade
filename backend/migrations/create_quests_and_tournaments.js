/**
 * Knex migration for quests (with per-user progress) and tournaments.
 */

exports.up = async function (knex) {
  await knex.schema.createTable('quests', (table) => {
    table.increments('id').primary();
    table.string('quest_id', 50).unique().notNullable();
    table.string('title', 100).notNullable();
    table.integer('target').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('user_quests', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('quest_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('quests')
      .onDelete('CASCADE');
    table.integer('progress').notNullable().defaultTo(0);
    table.boolean('claimed').notNullable().defaultTo(false);
    table.integer('streak').notNullable().defaultTo(0);
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['user_id', 'quest_id']);
  });

  await knex.schema.createTable('tournaments', (table) => {
    table.increments('id').primary();
    table.string('game_type', 30).notNullable();
    table.string('status', 20).notNullable().defaultTo('upcoming'); // upcoming, active, finished
    table.decimal('prize_pool', 20, 7).notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['status']);
  });

  // Seed a starter quest catalog so /quests has real definitions to report
  // progress against instead of coming back empty for every player.
  await knex('quests').insert([
    { quest_id: 'daily-login', title: 'Log in today', target: 1 },
    { quest_id: 'play-5-games', title: 'Play 5 games', target: 5 },
    { quest_id: 'win-3-games', title: 'Win 3 games', target: 3 },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('tournaments');
  await knex.schema.dropTableIfExists('user_quests');
  await knex.schema.dropTableIfExists('quests');
};
