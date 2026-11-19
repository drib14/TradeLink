/**
 * Replace campus bulletin announcements with measurable visits and durable email campaigns.
 */
exports.up = async function(knex) {
  if (await knex.schema.hasTable('announcements')) {
    await knex.schema.dropTable('announcements');
  }

  if (!(await knex.schema.hasTable('site_visits'))) {
    await knex.schema.createTable('site_visits', (table) => {
      table.string('visitor_hash', 64).notNullable();
      table.date('visit_date').notNullable();
      table.dateTime('first_seen_at').notNullable().defaultTo(knex.fn.now());
      table.dateTime('last_seen_at').notNullable().defaultTo(knex.fn.now());
      table.string('last_path', 200).nullable();
      table.primary(['visitor_hash', 'visit_date']);
      table.index(['visit_date'], 'idx_site_visits_date');
    });
  }

  if (!(await knex.schema.hasTable('email_campaigns'))) {
    await knex.schema.createTable('email_campaigns', (table) => {
      table.string('id', 36).primary();
      table.string('title', 160).notNullable();
      table.string('subject', 200).notNullable();
      table.text('message').notNullable();
      table.enu('audience', ['all', 'campus', 'verified', 'unverified']).notNullable().defaultTo('all');
      table.string('campus', 100).nullable();
      table.integer('total_recipients').unsigned().notNullable().defaultTo(0);
      table.integer('sent_count').unsigned().notNullable().defaultTo(0);
      table.integer('failed_count').unsigned().notNullable().defaultTo(0);
      table.enu('status', ['sending', 'sent', 'partial', 'failed']).notNullable().defaultTo('sending');
      table.string('created_by', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
      table.dateTime('completed_at').nullable();
      table.timestamps(true, true);
      table.index(['created_at'], 'idx_email_campaign_created');
      table.index(['status'], 'idx_email_campaign_status');
    });
  }

  if (!(await knex.schema.hasTable('email_campaign_recipients'))) {
    await knex.schema.createTable('email_campaign_recipients', (table) => {
      table.string('id', 36).primary();
      table.string('campaign_id', 36).notNullable().references('id').inTable('email_campaigns').onDelete('CASCADE');
      table.string('user_id', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
      table.string('email', 254).notNullable();
      table.string('recipient_name', 120).nullable();
      table.enu('status', ['queued', 'processing', 'sent', 'failed']).notNullable().defaultTo('queued');
      table.string('error_message', 500).nullable();
      table.dateTime('processing_at').nullable();
      table.dateTime('sent_at').nullable();
      table.timestamps(true, true);
      table.unique(['campaign_id', 'email'], 'uq_email_campaign_recipient');
      table.index(['campaign_id', 'status'], 'idx_campaign_recipient_status');
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('email_campaign_recipients');
  await knex.schema.dropTableIfExists('email_campaigns');
  await knex.schema.dropTableIfExists('site_visits');
};