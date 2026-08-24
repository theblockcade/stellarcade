/**
 * Knex migration adding the 18-or-over confirmation timestamp to users.
 *
 * Absent this column, the API had nowhere to persist the age gate a player
 * clears during onboarding, so `needsOnboarding()` on the frontend (which
 * checks `!profile.ageConfirmedAt`) could never see it as satisfied and kept
 * re-showing the onboarding dialog on every session.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.timestamp('age_confirmed_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('age_confirmed_at');
  });
};
