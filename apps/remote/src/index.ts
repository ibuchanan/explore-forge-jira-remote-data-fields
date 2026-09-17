import { createServer } from "./server.js";

const port = Number(process.env.PORT ?? 3000);
const server = createServer();

await server.listen({ port, host: "0.0.0.0" });
