import { createServer } from "./server.js";

const port = Number(process.env.PORT ?? 3000);
const server = createServer();

const address = await server.listen({ port, host: "0.0.0.0" });
console.info(`Remote API listening at ${address}`);
