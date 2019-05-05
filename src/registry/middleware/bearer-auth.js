'use strict';

const logger = require('pino')();
const Token = require('../models/token');
const response = require('../lib/response');

module.exports = createBearerAuthMW;

function createBearerAuthMW() {
  return next => {
    return async context => {
      // We skip our (temporarily) embedded website AND paths that are
      // never expected to have valid tokens.
      if (
        context.request.url.startsWith('/www') ||
        context.request.url.startsWith('/-/v1/login')
      ) {
        return next(context);
      }

      const bearer = context.request.headers['authorization']
        ? context.request.headers['authorization'].replace(/^Bearer /, '')
        : '';
      if (!bearer) {
        return next(context);
      }

      if (!bearer.startsWith('ent_')) {
        return response.authneeded(
          'Your auth token is not a valid entropic token.'
        );
      }

      try {
        const user = await Token.lookupUser(bearer);
        if (user) {
          context.user = user;
        }
      } catch (err) {
        // Consider responding with the 401 here.
        logger.warn('unexpected error looking up user', { error: err.message });
      }

      return next(context);
    };
  };
}
