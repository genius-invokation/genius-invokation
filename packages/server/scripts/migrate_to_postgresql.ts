import { SQL } from "bun";

const sqlite = new SQL(process.env.SQLITE_DATABASE_URL!);
const postgresql = new SQL(process.env.POSTGRESQL_DATABASE_URL!);

async function migrateUsers() {
  const sqliteUsers = await sqlite`SELECT * FROM User`;
  const users = sqliteUsers.map((user: any) => ({
    ...user,
    createdAt: new Date(user.createdAt).toISOString(),
  }));
  console.log(`migrating ${users.length} users`);
  const inserted = await postgresql`
    INSERT INTO "User" ${postgresql(users)}
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  console.log(`inserted ${inserted.length} users`);
}

async function migrateGames() {
  const sqliteGames = await sqlite`SELECT * FROM Game`;
  const games = sqliteGames.map((game: any) => ({
    ...game,
    createdAt: new Date(game.createdAt).toISOString(),
  }));
  console.log(`migrating ${games.length} games`);
  const inserted = await postgresql`
    INSERT INTO "Game" ${postgresql(games)}
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  console.log(`inserted ${inserted.length} games`);
}

async function migratePlayersOnGames() {
  const playersOnGames = await sqlite`SELECT * FROM PlayerOnGames`;
  console.log(`migrating ${playersOnGames.length} players on games`);
  const inserted = await postgresql`
    INSERT INTO "PlayerOnGames" ${postgresql(playersOnGames)}
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  console.log(`inserted ${inserted.length} players on games`);
}

async function migrateDecks() {
  const sqliteDecks = await sqlite`SELECT * FROM Deck`;
  const decks = sqliteDecks.map((deck: any) => ({
    ...deck,
    createdAt: new Date(deck.createdAt).toISOString(),
    updatedAt: new Date(deck.updatedAt).toISOString(),
  }));
  console.log(`migrating ${decks.length} decks`);
  const inserted = await postgresql`
    INSERT INTO "Deck" ${postgresql(decks)}
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  console.log(`inserted ${inserted.length} decks`);
}

async function main() {
  await migrateUsers();
  await migrateGames();
  await migratePlayersOnGames();
  await migrateDecks();
}

main();
