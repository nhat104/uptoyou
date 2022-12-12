"use strict";

/**
 * A set of functions called "actions" for `auth`
 */

module.exports = {
  login: async (ctx, next) => {
    try {
      const { identifier: username, password } = ctx.request.body;
      const user = await strapi
        .service("api::auth.auth")
        .findUser(username, null, ctx);

      if (!user.length) {
        return ctx.badRequest("Username or Password are incorrect");
      }

      const validPassword = await strapi.plugins[
        "users-permissions"
      ].services.user.validatePassword(password, user[0].password);
      if (!validPassword) {
        return ctx.badRequest("Email or Password are incorrect");
      }

      try {
        const jwt = await strapi.plugins[
          "users-permissions"
        ].services.jwt.issue({ id: user[0].id });
        ctx.body = { jwt, user: { ...user[0], role: user[0].role.name } };
      } catch (error) {
        ctx.badRequest("Create jwt error", { moreDetails: error });
      }
    } catch (err) {
      ctx.body;
    }
  },

  register: async (ctx, next) => {
    try {
      const { username, email, password, role } = ctx.request.body;
      const user = await strapi
        .service("api::auth.auth")
        .findUser(username, email, ctx);
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
