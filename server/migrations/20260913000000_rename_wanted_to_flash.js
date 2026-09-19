/**
 * Migration: Rename wanted_requests to flash_requests (⚡ Flash Market)
 */

exports.up = async function (knex) {
  // 1. Rename wanted_requests table to flash_requests if wanted_requests exists
  const hasWantedTable = await knex.schema.hasTable('wanted_requests');
  const hasFlashTable = await knex.schema.hasTable('flash_requests');

  if (hasWantedTable && !hasFlashTable) {
    await knex.schema.renameTable('wanted_requests', 'flash_requests');
  } else if (!hasFlashTable) {
    await knex.schema.createTable('flash_requests', (table) => {
      table.string('id', 36).primary();
      table.string('requester_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('item_name', 200).notNullable();
      table.string('category', 100).notNullable();
      table.string('budget_range', 50).nullable();
      table.enu('urgency', ['immediate', 'this_week', 'flexible']).notNullable().defaultTo('flexible');
      table.text('notes').nullable();
      table.enu('target_campus', [
        'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
        'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
      ]).notNullable();
      table.enu('status', ['open', 'fulfilled', 'cancelled', 'expired']).notNullable().defaultTo('open');
      table.integer('offers_count').unsigned().notNullable().defaultTo(0);
      table.timestamps(true, true);

      table.index(['requester_id'], 'idx_flash_requester');
      table.index(['target_campus'], 'idx_flash_campus');
      table.index(['status'], 'idx_flash_status');
    });
  }

  // 2. Rename or add flash_request_id in conversations
  const hasConvTable = await knex.schema.hasTable('conversations');
  if (hasConvTable) {
    const hasWantedId = await knex.schema.hasColumn('conversations', 'wanted_id');
    const hasFlashId = await knex.schema.hasColumn('conversations', 'flash_request_id');

    if (hasWantedId && !hasFlashId) {
      await knex.schema.alterTable('conversations', (table) => {
        table.renameColumn('wanted_id', 'flash_request_id');
      });
    } else if (!hasFlashId) {
      await knex.schema.alterTable('conversations', (table) => {
        table.string('flash_request_id', 36).nullable().references('id').inTable('flash_requests').onDelete('SET NULL');
        table.index(['flash_request_id'], 'idx_conv_flash');
      });
    }
  }

  // 3. Rename or add flash_request_id in messages
  const hasMsgTable = await knex.schema.hasTable('messages');
  if (hasMsgTable) {
    const hasWantedMsgId = await knex.schema.hasColumn('messages', 'wanted_request_id');
    const hasFlashMsgId = await knex.schema.hasColumn('messages', 'flash_request_id');

    if (hasWantedMsgId && !hasFlashMsgId) {
      await knex.schema.alterTable('messages', (table) => {
        table.renameColumn('wanted_request_id', 'flash_request_id');
      });
    } else if (!hasFlashMsgId) {
      await knex.schema.alterTable('messages', (table) => {
        table.string('flash_request_id', 36).nullable().references('id').inTable('flash_requests').onDelete('SET NULL');
        table.index(['flash_request_id'], 'idx_messages_flash');
      });
    }
  }
};

exports.down = async function (knex) {
  // Revert messages column
  const hasMsgTable = await knex.schema.hasTable('messages');
  if (hasMsgTable) {
    const hasFlashMsgId = await knex.schema.hasColumn('messages', 'flash_request_id');
    if (hasFlashMsgId) {
      await knex.schema.alterTable('messages', (table) => {
        table.renameColumn('flash_request_id', 'wanted_request_id');
      });
    }
  }

  // Revert conversations column
  const hasConvTable = await knex.schema.hasTable('conversations');
  if (hasConvTable) {
    const hasFlashId = await knex.schema.hasColumn('conversations', 'flash_request_id');
    if (hasFlashId) {
      await knex.schema.alterTable('conversations', (table) => {
        table.renameColumn('flash_request_id', 'wanted_id');
      });
    }
  }

  // Revert table name
  const hasFlashTable = await knex.schema.hasTable('flash_requests');
  if (hasFlashTable) {
    await knex.schema.renameTable('flash_requests', 'wanted_requests');
  }
};
