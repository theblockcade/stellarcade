/**
 * Knex migration adding Telegram-link columns to users.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('telegram_user_id', 64).unique().nullable();
    table.string('telegram_handle', 64).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('telegram_user_id');
    table.dropColumn('telegram_handle');
  });
};
