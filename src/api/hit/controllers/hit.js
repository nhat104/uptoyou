"use strict";

/**
 * hit controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::hit.hit", ({ strapi }) => ({
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
      data: { user: user.id },
    });
    const response = {
      status: 200,
      data: {
        id: updatedHit.id,
        user: {
          id: updatedHit.user.id,
          username: updatedHit.user.username,
        },
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
      data: { answers },
    });
    const response = {
      status: 200,
      data: updatedHit,
    };
    return response;
  },

  async findOne(ctx) {
    const { id } = ctx.params;

    const hit = await strapi.entityService.findOne("api::hit.hit", id, {
      populate: ["batch", "batch.questions", "batch.questions.answers"],
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
        select:
          question.answers && question.answers
            ? question.answers.map((answer) => answer.name)
            : null,
        answer: (answers && answers[qIdx]) || "",
      })),
    };

    const response = {
      status: 200,
      data: { id: hit.id, batch },
    };
    return response;
  },

  async find(ctx) {
    const { query } = ctx;
    query.populate = "*";
    if (!query.filters) {
      query.filters = {};
    }
    query.filters.publish = true;

    const { data, meta } = await super.find(ctx);

    return { status: 200, data, meta };
  },
}));
