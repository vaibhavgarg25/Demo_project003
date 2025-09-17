import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import trainRoutes from "./routes/trainRoutes.js";
import uploadRoutes from "./routes/uploadroutes.js";
// import webhookRoutes from "./routes/webhookRoutes.js";
// import { setSseBroadcaster, startSimulationRun } from "./services/pipelineService.js";
// import cron from "node-cron";

dotenv.config({ debug: false });

const app = express();
const port = process.env.PORT || 8000;

const corsOptions = {
    origin: "*",
    methods: "POST,GET,PUT,DELETE,PATCH,HEAD",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/upload",uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/train",trainRoutes);
// app.use("/api/webhook", webhookRoutes);

// // SSE stream for realtime pipeline updates
// app.get("/api/events", (req, res) => {
//     res.setHeader("Content-Type", "text/event-stream");
//     res.setHeader("Cache-Control", "no-cache");
//     res.setHeader("Connection", "keep-alive");
//     res.flushHeaders?.();

//     const write = (event: string, data: any) => {
//         res.write(`event: ${event}\n`);
//         res.write(`data: ${JSON.stringify(data)}\n\n`);
//     };

//     setSseBroadcaster(write);

//     req.on("close", () => {
//         // noop; simple single-subscriber broadcaster
//     });
// });

// // Cron job every 24 hours at 00:05
// cron.schedule("5 0 * * *", async () => {
//     try {
//         await startSimulationRun();
//     } catch (e) {
//         console.error("Cron startSimulationRun error:", e);
//     }
// });
app.get("/", (req, res) => {
    res.send("Server is up and running");
});

// Global error handler (must be after routes and middleware)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    const status = err?.status || 500;
    res.status(status).json({ message: err?.message || "Internal Server Error" });
});

app.listen(port, () => {
    console.log(`Server is running at: http://localhost:${port}`);
});
