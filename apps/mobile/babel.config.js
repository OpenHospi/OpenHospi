// DO NOT DELETE — babel-plugin-inline-import is required by Drizzle ORM's SQLite
// migrator. It imports .sql migration files as strings at build time.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
