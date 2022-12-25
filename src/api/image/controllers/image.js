"use strict";

/**
 * image controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::image.image", ({ strapi }) => ({
  async upload(ctx) {
    // const { user } = ctx.state;
    const { files } = ctx.request.files;

    if (!files) {
      return ctx.badRequest("No files were uploaded.");
    }

    // const images = await strapi.plugins["upload"].services.upload.upload({
    //   files,
    //   data: {},
    // });

    // const data = images.map((image) => ({
    //   id: image.id,
    //   name: image.name,
    //   url: image.url,
    // }));

    const data = await strapi.entityService.create("api::image.image", {
      data: { image: 4 },
    });

    return { data };
  },
}));
