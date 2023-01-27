module.exports = {
  routes: [
    {
      method: "POST",
      path: "/batches/publish",
      handler: "batch.publish",
    },
    {
      method: "GET",
      path: "/batches-by-requester",
      handler: "batch.batchesByRequester",
    },
  ],
};
