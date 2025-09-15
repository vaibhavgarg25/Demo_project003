export const sanitizedTrains = async (trains:any)=>{
trains.map((train:any) => ({
            id: train.id,
            trainname: train.trainname,
            createdAt: train.createdAt,
            updatedAt: train.updatedAt,
            fitness: train.fitness
                ? {
                      rollingStockFitnessStatus: train.fitness.rollingStockFitnessStatus,
                      signallingFitnessStatus: train.fitness.signallingFitnessStatus,
                      telecomFitnessStatus: train.fitness.telecomFitnessStatus,
                      fitnessExpiryDate: train.fitness.fitnessExpiryDate,
                      lastFitnessCheckDate: train.fitness.lastFitnessCheckDate,
                  }
                : null,
            jobCardStatus: train.jobCardStatus
                ? {
                      jobCardStatus: train.jobCardStatus.jobCardStatus,
                      openJobCards: train.jobCardStatus.openJobCards,
                      closedJobCards: train.jobCardStatus.closedJobCards,
                      lastJobCardUpdate: train.jobCardStatus.lastJobCardUpdate,
                  }
                : null,
            branding: train.branding
                ? {
                      brandingActive: train.branding.brandingActive,
                      brandCampaignID: train.branding.brandCampaignID,
                      exposureHoursAccrued: train.branding.exposureHoursAccrued,
                      exposureHoursTarget: train.branding.exposureHoursTarget,
                      exposureDailyQuota: train.branding.exposureDailyQuota,
                  }
                : null,
            mileage: train.mileage
                ? {
                      totalMileageKM: train.mileage.totalMileageKM,
                      mileageSinceLastServiceKM: train.mileage.mileageSinceLastServiceKM,
                      mileageBalanceVariance: train.mileage.mileageBalanceVariance,
                      brakepadWearPercent: train.mileage.brakepadWearPercent,
                      hvacWearPercent: train.mileage.hvacWearPercent,
                  }
                : null,
            cleaning: train.cleaning
                ? {
                      cleaningRequired: train.cleaning.cleaningRequired,
                      cleaningSlotStatus: train.cleaning.cleaningSlotStatus,
                      bayOccupancyIDC: train.cleaning.bayOccupancyIDC,
                      cleaningCrewAssigned: train.cleaning.cleaningCrewAssigned,
                      lastCleanedDate: train.cleaning.lastCleanedDate,
                  }
                : null,
            stabling: train.stabling
                ? {
                      bayPositionID: train.stabling.bayPositionID,
                      shuntingMovesRequired: train.stabling.shuntingMovesRequired,
                      stablingSequenceOrder: train.stabling.stablingSequenceOrder,
                  }
                : null,
            operations: train.operations
                ? {
                      operationalStatus: train.operations.operationalStatus,
                  }
                : null,
        }));
} 