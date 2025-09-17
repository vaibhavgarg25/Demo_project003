// import express from "express";
// import { getRun, handleMooFinished, handleRlFinished, handleSimulationFinished, startSimulationRun, listRuns } from "../services/pipelineService.js";

// const router = express.Router();

// // Manually start a pipeline run (also used by cron)
// router.post("/start", async (_req, res) => {
//   const runId = await startSimulationRun();
//   res.json({ runId });
// });

// router.post("/simulation-finished", async (req, res) => {
//   const { runId, payload } = req.body || {};
//   if (!runId) return res.status(400).json({ error: "runId required" });
//   await handleSimulationFinished(runId, payload);
//   res.json({ ok: true, run: getRun(runId) });
// });

// router.post("/moo-finished", async (req, res) => {
//   const { runId, payload } = req.body || {};
//   if (!runId) return res.status(400).json({ error: "runId required" });
//   await handleMooFinished(runId, payload);
//   res.json({ ok: true, run: getRun(runId) });
// });

// router.post("/rl-finished", async (req, res) => {
//   const { runId, payload } = req.body || {};
//   if (!runId) return res.status(400).json({ error: "runId required" });
//   await handleRlFinished(runId, payload);
//   res.json({ ok: true, run: getRun(runId) });
// });

// // Inspect runs
// router.get("/runs", (_req, res) => {
//   res.json({ runs: listRuns() });
// });

// export default router;


