const swaggerJsdoc = require("swagger-jsdoc")

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Food Tour API",
      version: "1.0.0"
    }
  },
  apis: ["./src/**/*.js"]
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec