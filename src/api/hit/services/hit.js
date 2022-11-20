'use strict';

/**
 * hit service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::hit.hit');
