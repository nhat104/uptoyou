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
        "pack",
        "hits",
        "hits.user",
      ],
    });

    if (!batch) {
      return ctx.notFound("Batch not found");
    }

    const hitCount = batch.hits.length;
    const hitWorking = batch.hits.filter(
      (hit) => hit.status === "working"
    ).length;
    const hitApproved = batch.hits.filter(
      (hit) => hit.status === "accepted"
    ).length;
    const hitRejected = batch.hits.filter(
      (hit) => hit.status === "rejected"
    ).length;

    const response = {
      status: 200,
      data: {
        ...batch,
        id: batch.id,
        projectName: batch.projectName,
        title: batch.title,
        status: batch.status,
        service: batch?.service?.name || "",
        description: batch.description,
        timeExpired: batch.timeExpired,
        workerRequire: batch.workerRequire,
        imagePerHIT: batch.imagePerHIT,
        reward: batch.reward,
        requester: {
          id: batch?.requester?.id || "",
          username: batch?.requester?.username || "",
          email: batch?.requester?.email || "",
        },
        pack: batch.pack ? batch.pack.map((image) => image.url) : [],
        questions: batch.questions.map((question) => ({
          title: question.title,
          type: question.type,
          select:
            question.answers && question.answers
              ? question.answers.map((answer) => answer.name)
              : null,
        })),
        hits: batch.hits.map((hit) => ({
          id: hit.id,
          status: hit.status,
          answers: hit.answers || "",
          user: {
            id: hit?.user?.id || "",
            username: hit?.user?.username || "",
            email: hit?.user?.email || "",
          },
        })),
        result: {
          hitWorking,
          hitApproved,
          hitRejected,
          progress: Math.round((hitApproved / hitCount) * 100),
        },
      },
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
    const { user } = ctx.state;
    const { data } = ctx.request.body;

    if (!data.batch) {
      return ctx.badRequest("Batch id is required");
    }

    const batch = await strapi.entityService.findOne(
      "api::batch.batch",
      data.batch,
      {
        populate: ["requester"],
      }
    );
    if (batch.requester.id !== user.id) {
      return ctx.unauthorized("You are not allowed to publish this batch");
    }
    if (batch.status !== "working") {
      return ctx.badRequest("Batch was already published");
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
      query.populate = "requester,hits";
    }
    console.log("query", query);
    let batches = await strapi.entityService.findMany("api::batch.batch", {
      ...query,
      filters: {
        ...query.filters,
        requester: user.id,
      },
    });
    batches = batches.map((batch) => {
      const hitCount = batch.hits.length;
      const hitWorking = batch.hits.filter(
        (hit) => hit.status === "working"
      ).length;
      const hitApproved = batch.hits.filter(
        (hit) => hit.status === "accepted"
      ).length;
      const hitRejected = batch.hits.filter(
        (hit) => hit.status === "rejected"
      ).length;
      return {
        ...batch,
        result: {
          hitWorking,
          hitApproved,
          hitRejected,
          progress: Math.round((hitApproved / hitCount) * 100),
        },
      };
    });
    const response = {
      status: 200,
      data: batches,
    };
    return response;
  },
}));
