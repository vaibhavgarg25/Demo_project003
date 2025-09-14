import {Router} from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getTrainFitnessById,getTrainBrandingById,getTrainById,getTrainCleaningById ,getTrainJobCardStatusById,getTrainMileageById,getTrainOperationStatusById,getTrainStablingById,getTrains,getTrainBranding,getTrainCleaning,getTrainFitness,getTrainJobCardStatus,getTrainMileage,getTrainOperationStatus,getTrainStabling} from "../handler/trainHandler.js";

const router = Router();

router.get("/getTrains",authMiddleware,getTrains);
router.get("/getTrainFitness",authMiddleware,getTrainFitness)
router.get("/getTrainBranding",authMiddleware,getTrainBranding)
router.get("/getTrainCleaning",authMiddleware,getTrainCleaning)
router.get("/getTrainJobCardStatus",authMiddleware,getTrainJobCardStatus)
router.get("/getTrainMileage",authMiddleware,getTrainMileage)
router.get("/getTrainOperationStatus",authMiddleware,getTrainOperationStatus)
router.get("/getTrainStabling",authMiddleware,getTrainStabling)
router.get("/getTrain/:id",authMiddleware,getTrainById);
router.get("/getTrainFitness/:id",authMiddleware,getTrainFitnessById);
router.get("/getTrainBranding/:id",authMiddleware,getTrainBrandingById);
router.get("/getTrainCleaning/:id",authMiddleware,getTrainCleaningById);
router.get("/getTrainJobCardStatus/:id",authMiddleware,getTrainJobCardStatusById);
router.get("/getTrainMileage/:id",authMiddleware,getTrainMileageById);
router.get("/getTrainOperationStatus/:id",authMiddleware,getTrainOperationStatusById);
router.get("/getTrainStabling/:id",authMiddleware,getTrainStablingById);

export default router;