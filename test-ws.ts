import { Elysia } from "elysia";
const app = new Elysia().ws("/ws", { message(ws, msg) { ws.send(msg); } }).listen(3000);
console.log("running");
