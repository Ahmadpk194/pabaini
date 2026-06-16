const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.ntsscybmwyirhoidflqs:8%25jLK*8NFHyGFxD@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres'
});

async function main() {
  await client.connect();
  try {
    console.log('Querying team 3...');
    const team = await client.query('SELECT * FROM cricket_teams WHERE id = 3;');
    console.table(team.rows);

    console.log('Querying members of team 3...');
    const members = await client.query('SELECT * FROM cricket_team_members WHERE team_id = 3;');
    console.table(members.rows);

    console.log('Querying players...');
    const players = await client.query('SELECT * FROM cricket_player_profiles WHERE id IN (1, 4);');
    console.table(players.rows);

    console.log('Deleting stale notification (ID 1)...');
    const deleteRes = await client.query('DELETE FROM notifications WHERE id = 1;');
    console.log('Deleted rows:', deleteRes.rowCount);

    console.log('Querying all remaining notifications...');
    const notifs = await client.query('SELECT * FROM notifications ORDER BY created_at DESC;');
    console.table(notifs.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
