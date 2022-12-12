"use strict";

/**
 * auth service
 */

module.exports = () => ({
  findUser: async (username, email, ctx) => {
    // Check if the username or email is already taken
    try {
      const user = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          fields: ["id", "username", "email", "password"],
          filters: { $or: [{ username }, { email }] },
          populate: ["role"],
        }
      );
      return user;
    } catch (error) {
      ctx.badRequest("Find user error", { moreDetails: error });
    }
  },

  create: async (username, email, password, role) => {
    // Create user
    const roleId = {
      Requester: 3,
      Worker: 4,
    };
    if (!roleId[role]) {
      return ctx.badRequest("Role must be Requester or Worker");
    }

    try {
      const user = await strapi.entityService.create(
        "plugin::users-permissions.user",
        {
          data: {
            blocked: false,
            confirmed: false,
            username,
            provider: "local",
            email,
            password,
            role: { disconnect: [], connect: [{ id: roleId[role] }] },
          },
          fields: ["id", "username", "email", "createdAt", "updatedAt"],
        }
      );
      return user;
    } catch (error) {
      ctx.badRequest("Create user error", { moreDetails: error });
    }
  },
});
