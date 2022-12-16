module.exports = {
  routes: [
    {
      method: "GET",
      path: "/batches/:id/publish",
      handler: "batch.publish",
    },
    {
      method: "GET",
      path: "/batches-by-requester",
      handler: "batch.batchesByRequester",
    },
  ],
};
