"use strict";

/**
 * hit controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::hit.hit", ({ strapi }) => ({
  async publish(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;
    const hit = await strapi.entityService.findOne("api::hit.hit", id, {
      populate: ["requester"],
    });
    if (hit.requester.id !== user.id) {
      return ctx.unauthorized("You are not allowed to publish this hit");
    }
    const updatedHit = await strapi.entityService.update("api::hit.hit", id, {
      fields: ["id", "publish", "createdAt", "updatedAt"],
      data: { publish: !hit.publish },
    });
    const response = {
      status: 200,
      data: updatedHit,
    };
    return response;
  },

  async hitsByRequester(ctx) {
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
    const hits = await strapi.entityService.findMany("api::hit.hit", {
      ...query,
      filters: {
        ...query.filters,
        requester: user.id,
      },
    });
    const response = {
      status: 200,
      data: hits,
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
