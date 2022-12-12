module.exports = {
  routes: [
    {
      method: "GET",
      path: "/hits/:id/publish",
      handler: "hit.publish",
    },
    {
      method: "GET",
      path: "/hits-by-requester",
      handler: "hit.hitsByRequester",
    },
  ],
};
