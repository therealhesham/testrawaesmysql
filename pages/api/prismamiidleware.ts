// prisma / middleware / loggingMiddleware.ts;

import { Prisma } from "@prisma/client";
import prisma from "./prismaclient";
// import { prisma } from "."; // Assuming your Prisma client is set up
// prisma.
// Logging middleware function
export const loggingMiddleware: Prisma.Middleware = async (params, next) => {
  const { model, action, args } = params;

  // Proceed with the query
  const result = await next(params);

  // We only log certain actions (create, update, delete)
  if (["create", "update", "delete"].includes(action)) {
    const entityId = args?.where?.id || args?.data?.id; // Extract entity ID from args
    const userId = 1; // You can get this from the session or request context (example: user authenticated)

    await prisma.auditLog.create({
      data: {
        action,
        entity: model,
        entityId: entityId,
        userId: userId, // Include user information if available
        changes: action === "update" ? JSON.stringify(args.data) : null, // Store changes for updates
      },
    });
  }

  return result;
};
