'use strict'

var HttpStatus = require('http-status-codes');

module.exports = {
    returnSuccessResponse: function(req, res, hasPayload, payload) {
        if(hasPayload === true) {
            return res.status(HttpStatus.OK).json(
                {"status": "successful", "hasPayload": hasPayload, "payload": payload}
            );
        }
        else {
            return res.status(HttpStatus.OK).json(
                {"status": "successful", "hasPayload": hasPayload}
            );
        }
    },

    returnInternalServerError: function(req, res, message) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
            {"status": "failed", "message": message}
        );
    },

    returnBadRequest: function(req, res, message) {
        return res.status(HttpStatus.BAD_REQUEST).json(
            {"status": "failed", "message": message}
        );
    },

    returnForbiddenResponse: function(req, res, message) {
        return res.status(HttpStatus.FORBIDDEN).json(
            {"status": "failed", "message": message}
        )
    },

    returnNotFound: function (req, res, message) {
        return res.status(HttpStatus.NOT_FOUND).json(
            {"status": "failed", "message": message}
        )
    },

    returnUnacceptableResponse: function (req, res, message) {
        return res.status(HttpStatus.NOT_ACCEPTABLE).json(
            {"status": "failed", "message": message}
        )
    },

    returnUnauthorizedResponse: function(req, res, message) {
        return res.status(HttpStatus.UNAUTHORIZED).json(
            {"status": "failed", "message": message}
        )
    },

    returnStatusError: function (status, req, res, message) {
        return res.status(status).json(
            {"status": "failed", "message": message}
        )
    }
}