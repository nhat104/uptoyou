"use strict";

/**
 * A set of functions called "actions" for `auth`
 */

module.exports = {
  register: async (ctx, next) => {
    try {
      const { username, email, password, role } = ctx.request.body;
      const user = await strapi
        .service("api::auth.auth")
        .findUser(username, email);
      if (user.length) {
        return ctx.conflict("Email or Username are already taken");
      }

      const newUser = await strapi
        .service("api::auth.auth")
        .create(username, email, password, role);

      try {
        const jwt = await strapi.plugins[
          "users-permissions"
        ].services.jwt.issue({ id: newUser.id });
        ctx.body = { jwt, user: newUser };
      } catch (error) {
        ctx.badRequest("Create jwt error", { moreDetails: error });
      }
    } catch (err) {
      ctx.body = err;
    }
  },
};
