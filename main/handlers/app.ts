/**
 * App Handlers - Application-level IPC methods
 */

export const appHandlers = {
  getInfo: async () => {
    return {
      name: "CE-Innovation Logboek",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "production",
    };
  },
};
