import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Diwali Tambola API",
            version: "1.0.0",
            description:
                "API documentation for Diwali Tambola (Housie) game backend",
        },
        servers: [
            {
                url: "http://localhost:5000", // change to your deployed URL later
            },
        ],
    },
    apis: ["./routes/*.js"], // auto-scan route files for JSDoc comments
};

export const swaggerSpec = swaggerJsdoc(options);
