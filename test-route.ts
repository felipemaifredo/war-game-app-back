import { Elysia } from "elysia";
new Elysia()
  .post("/create", () => "hello")
  .listen(3002);
