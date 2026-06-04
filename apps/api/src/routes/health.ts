import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { HealthResponseSchema } from "@artmuseum/shared";

export const healthRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        response: {
          200: HealthResponseSchema
        }
      }
    },
    async () => ({
      ok: true,
      service: "artmuseum-api"
    })
  );
};
