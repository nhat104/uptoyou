module.exports = {
  routes: [
    {
      method: "POST",
      path: "/auth/register",
      handler: "auth.register",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
