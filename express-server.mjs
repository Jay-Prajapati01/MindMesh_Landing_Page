import express from "express";
import { middleware } from "./.output/server/index.mjs";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

app.disable("x-powered-by");
app.use(middleware);

app.listen(port, host, () => {
  console.log(`Mindmesh is listening at http://${host}:${port}`);
});
