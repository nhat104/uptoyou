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
    {
      method: "POST",
      path: "/hits/accept",
      handler: "hit.accept",
    },
    {
      method: "POST",
      path: "/hits/reject",
      handler: "hit.reject",
    },
    {
      method: "GET",
      path: "/hits/by-worker",
      handler: "hit.hitByWorker",
    },
  ],
};
