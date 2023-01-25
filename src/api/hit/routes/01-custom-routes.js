module.exports = {
  routes: [
    {
      method: "GET",
      path: "/hits/:id/apply",
      handler: "hit.apply",
    },
    {
      method: "POST",
      path: "/hits/:id/submit",
      handler: "hit.submit",
    },
  ],
};
