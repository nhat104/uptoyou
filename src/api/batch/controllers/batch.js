"use strict";

/**
 * batch controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::batch.batch", ({ strapi }) => ({
  async create(ctx) {
    const { user } = ctx.state;
    ctx.request.body.data.requester = user.id;
    const { data } = await super.create(ctx);
    return { data };
  },

  async findOne(ctx) {
    const { id } = ctx.params;

    const batch = await strapi.entityService.findOne("api::batch.batch", id, {
      populate: [
        "workerRequire",
        "service",
        "requester",
        "questions",
        "questions.answers",
      ],
    });
    const response = {
      status: 200,
      data: batch,
    };
    return response;
  },

  async find(ctx) {
    const { query } = ctx;
    query.populate = ["workerRequire", "requester", "service"];
    if (!query.filters) {
      query.filters = {};
    }
    query.filters.status = "working";

    const { data, meta } = await super.find(ctx);
    const res = [];
    data.forEach((batch) => {
      const attributes = batch.attributes;
      const item = {
        id: batch.id,
        projectName: attributes.projectName,
        title: attributes.title,
        status: attributes.status,
        description: attributes.description,
        timeExpired: attributes.timeExpired,
        timeAutoPayment: attributes.timeAutoPayment,
        timeWorkerKeep: attributes.timeWorkerKeep,
        workerRequire: attributes.workerRequire,
        requester: {
          id: attributes.requester.data.id,
          username: attributes.requester.data.attributes.username,
        },
        service: attributes.service.data.attributes.name,
      };
      res.push(item);
    });
    return { status: 200, data: res, meta };
  },

  async publish(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    const batch = await strapi.entityService.findOne("api::batch.batch", id, {
      populate: ["requester"],
    });
    if (batch.requester.id !== user.id) {
      return ctx.unauthorized("You are not allowed to publish this batch");
    }
    const updatedBatch = await strapi.entityService.update(
      "api::batch.batch",
      id,
      {
        fields: ["id", "projectName", "status", "imagePerHIT"],
        populate: ["pack"],
        data: { status: "working" },
      }
    );

    if (updatedBatch.imagePerHIT) {
      // split images to sub array of image
      const chunk = (arr, size) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
          arr.slice(i * size, i * size + size)
        );
      const pack = updatedBatch.pack;
      const chunkedImages = chunk(pack, updatedBatch.imagePerHIT);
      chunkedImages.forEach(async (images) => {
        ctx.request.body.data = {
          ...ctx.request.body.data,
          images,
        };

        await strapi.controller("api::hit.hit").create(ctx);
      });
    }

    const response = {
      status: 200,
      data: {
        ...updatedBatch,
        pack: updatedBatch.pack.map((image) => image.url),
      },
    };
    return response;
  },

  async batchesByRequester(ctx) {
    const { query } = ctx;
    const { user } = ctx.state;
    if (query.populate) {
      if (!query.populate.includes("requester")) {
        query.populate += ",requester";
      }
    } else {
      query.populate = "requester";
    }
    console.log("query", query);
    const batches = await strapi.entityService.findMany("api::batch.batch", {
      ...query,
      filters: {
        ...query.filters,
        requester: user.id,
      },
    });
    const response = {
      status: 200,
      data: batches,
    };
    return response;
  },
}));
