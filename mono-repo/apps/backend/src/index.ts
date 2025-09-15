import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import trainRoutes from "./routes/trainRoutes.js";
import uploadRoutes from "./routes/uploadroutes.js";

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

app.use("/api/upload",uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/train",trainRoutes);
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
