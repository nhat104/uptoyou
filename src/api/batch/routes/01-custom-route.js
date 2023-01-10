module.exports = {
  routes: [
    {
      method: "POST",
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
