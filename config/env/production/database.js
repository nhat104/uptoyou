module.exports = ({ env }) => ({
  connection: {
    client: "mysql",
    connection: {
      host: "us-cdbr-east-06.cleardb.net",
      port: 3306,
      database: "heroku_aebb0043a9a8cc2",
      user: "b8a859804b59c0",
      password: "85d9effe",
      ssl: {
        rejectUnauthorized: false,
      },
    },
    debug: false,
  },
});
