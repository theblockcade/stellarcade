/**
 * Knex migration for the audit_logs table.
 */

exports.up = function (knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.string('actor').notNullable().index();
    table.string('action').notNullable().index();
    table.string('target').notNullable();
    table.string('payload_hash').nullable();
    table.string('outcome').notNullable().defaultTo('success');
    table.jsonb('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).index();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
