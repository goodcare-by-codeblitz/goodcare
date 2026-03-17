import type { FastifyInstance } from "fastify";
import { loginController, logoutController, registerController } from "./auth.controller";
import { loginOpts, registerOpts } from "./auth.schemas";

export async function authRoutes(app: FastifyInstance) {
    app.post("/register", registerOpts, registerController(app));
    app.post("/login", loginOpts, loginController(app));
    app.delete("/logout", logoutController(app));
}
