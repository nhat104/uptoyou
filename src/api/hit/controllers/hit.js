"use strict";

/**
 * hit controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::hit.hit", ({ strapi }) => ({
  async findOne(ctx) {
    const { id } = ctx.params;

    const hit = await strapi.entityService.findOne("api::hit.hit", id, {
      populate: [
        "batch",
        "images",
        "batch.questions",
        "batch.questions.answers",
      ],
    });

    if (!hit) {
      return ctx.notFound("Hit not found");
    }

    const answers = JSON.parse(hit.answers);
    const batch = {
      ...hit.batch,
      questions: hit.batch.questions.map((question, qIdx) => ({
        title: question.title,
        type: question.type,
        select: question.answers,
        answer: (answers && answers[qIdx]) || "",
      })),
    };

    const response = {
      status: 200,
      data: {
        id: hit.id,
        images: hit.images ? hit.images.map((image) => image.url) : [],
        batch,
      },
    };
    return response;
  },

  async find(ctx) {
    const { query } = ctx;
    const { user } = ctx.state;
    query.populate = ["*", "batch.workerRequire"];
    // if (!query.filters) {
    //   query.filters = {};
    // }
    // query.filters.publish = true;
    const { data, meta } = await super.find(ctx);
    const hits = data.map((hit) => {
      const { batch, ...rest } = hit.attributes;
      const { workerRequire, ...restBatch } = batch.data.attributes;
      let workable = true;
      const { age, address } = workerRequire;
      if (age && user.age < age) {
        workable = false;
      }
      if (address && !user.address.includes(address)) {
        workable = false;
      }
      return {
        id: hit.id,
        ...rest,
        batch: {
          ...restBatch,
          workable,
        },
      };
    });

    return { status: 200, data: hits, meta };
  },

  async apply(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;
    const hit = await strapi.entityService.findOne("api::hit.hit", id, {
      populate: ["user"],
    });
    if (!hit) {
      return ctx.notFound("Hit not found");
    }
    if (hit.user) {
      return ctx.badRequest("This HIT has been applied");
    }
    const updatedHit = await strapi.entityService.update("api::hit.hit", id, {
      populate: ["user"],
      data: { user: user.id, status: "working" },
    });
    const response = {
      status: 200,
      data: {
        id: updatedHit.id,
        status: updatedHit.status,
        user: { id: updatedHit.user.id, username: updatedHit.user.username },
      },
    };
    return response;
  },

  async submit(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;
    const { answers } = ctx.request.body;
    const hit = await strapi.entityService.findOne("api::hit.hit", id, {
      populate: ["batch", "user"],
    });
    if (!answers) {
      return ctx.badRequest("Answer is required");
    }
    if (!hit) {
      return ctx.notFound("Hit not found");
    }
    if (!hit.user) {
      return ctx.badRequest("This HIT has not been applied");
    }
    if (hit.user.id !== user.id) {
      return ctx.badRequest("You are not the worker of this HIT");
    }
    // console.log("hit", hit);
    // const batch = await strapi.entityService.findOne(
    //   "api::batch.batch",
    //   hit.batch.id,
    //   { populate: ["questions", "questions.answers"] }
    // );
    // console.log("batch", batch);
    const updatedHit = await strapi.entityService.update("api::hit.hit", id, {
      data: { answers, status: "submitted" },
    });
    const response = {
      status: 200,
      data: updatedHit,
    };
    return response;
  },

  async accept(ctx) {
    const { user } = ctx.state;
    const { hits } = ctx.request.body;

    if (!hits) {
      return ctx.badRequest("Hits is required");
    }

    const hitAccepted = [];

    for (const hitId of hits) {
      const hit = await strapi.entityService.findOne("api::hit.hit", hitId, {
        populate: ["user", "batch.requester"],
      });

      if (!hit) {
        return ctx.notFound(`Hit with id ${hitId} not found`);
      }

      if (user.id !== hit.batch.requester.id) {
        return ctx.badRequest(
          `You are not the requester of hit with id ${hitId}`
        );
      }

      if (hit.status !== "submitted") {
        return ctx.badRequest(
          `Hit status with id ${hitId} is ${hit.status}, not submitted`
        );
      }

      hitAccepted.push({
        id: hitId,
        user: hit.user.id,
        reward: hit.batch?.reward || 0,
      });
    }

    if (hits.length === hitAccepted.length) {
      hitAccepted.forEach(async (hit) => {
        await strapi.entityService.update("api::hit.hit", hit.id, {
          data: { status: "accepted" },
        });
        const user = await strapi.entityService.findOne(
          "plugin::users-permissions.user",
          hit.user
        );
        await strapi.entityService.update(
          "plugin::users-permissions.user",
          hit.user,
          {
            data: {
              money: user.money + hit.reward,
              totalMoney: user.totalMoney + hit.reward,
            },
          }
        );
      });
    }

    return { status: 200, message: "Accepted", data: hits };
  },

  async reject(ctx) {
    const { user } = ctx.state;
    const { hits } = ctx.request.body;

    if (!hits) {
      return ctx.badRequest("Hits is required");
    }

    const hitRejected = [];

    for (const hitId of hits) {
      const hit = await strapi.entityService.findOne("api::hit.hit", hitId, {
        populate: ["user", "batch.requester"],
      });

      if (!hit) {
        return ctx.notFound(`Hit with id ${hitId} not found`);
      }

      if (user.id !== hit.batch.requester.id) {
        return ctx.badRequest(
          `You are not the requester of hit with id ${hitId}`
        );
      }

      if (hit.status === "accepted") {
        return ctx.badRequest(
          `Hit status with id ${hitId} is accepted, cannot reject`
        );
      }
      if (hit.status !== "submitted") {
        return ctx.badRequest(
          `Hit status with id ${hitId} is ${hit.status}, not submitted`
        );
      }

      hitRejected.push(hitId);
    }

    if (hits.length === hitRejected.length) {
      hitRejected.forEach(async (hitId) => {
        await strapi.entityService.update("api::hit.hit", hitId, {
          data: { status: "rejected" },
        });
      });
    }

    return { status: 200, message: "Rejected", data: hits };
  },

  async hitByWorker(ctx) {
    // const { id } = ctx.params;
    const { user } = ctx.state;
    // const { populate } = ctx.query;
    const hits = await strapi.entityService.findMany("api::hit.hit", {
      // populate: ["user"],
      filters: {
        user: user.id,
        status: { $in: ["working", "submitted", "accepted", "rejected"] },
      },
    });
    const response = {
      status: 200,
      data: hits,
    };
    return response;
  },
}));
