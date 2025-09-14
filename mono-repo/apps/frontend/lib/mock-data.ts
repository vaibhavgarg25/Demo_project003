export type JobCard = {
  id: string
  status: "open" | "closed"
  description: string
  created_at: string
}

export type MaintenanceItem = {
  date: string
  duration_days: number
  notes?: string
}

export type Fitness = {
  expiry_date: string
  last_check_date: string
}

export type Trainset = {
  id: string
  code: string
  status: "Active" | "Standby" | "Maintenance" | "OutOfService"
  fitness_certificate: Fitness
  job_cards: JobCard[]
  maintenance_history: MaintenanceItem[]
  mileage: number
  stabling_position: string
  cleaning_schedule: string
  branding_status: string
  priority_score: number
  availability_confidence?: number
}

export const TRAINSETS: Trainset[] = [
  {
    id: "KM-001",
    code: "T001",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2024-12-15",
      last_check_date: "2024-06-15",
    },
    job_cards: [{ id: "JC-001", status: "open", description: "Brake system inspection", created_at: "2024-01-10" }],
    maintenance_history: [
      { date: "2024-01-05", duration_days: 2, notes: "Routine maintenance" },
      { date: "2023-11-20", duration_days: 1, notes: "Door mechanism repair" },
    ],
    mileage: 45000,
    stabling_position: "A1",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 85,
    availability_confidence: 92,
  },
  {
    id: "KM-002",
    code: "T002",
    status: "Maintenance",
    fitness_certificate: {
      expiry_date: "2024-10-20",
      last_check_date: "2024-04-20",
    },
    job_cards: [
      { id: "JC-002", status: "open", description: "Engine overhaul", created_at: "2024-01-15" },
      { id: "JC-003", status: "open", description: "AC system repair", created_at: "2024-01-18" },
    ],
    maintenance_history: [{ date: "2024-01-15", duration_days: 7, notes: "Major overhaul in progress" }],
    mileage: 52000,
    stabling_position: "B2",
    cleaning_schedule: "Weekly",
    branding_status: "Pending",
    priority_score: 45,
    availability_confidence: 60,
  },
  {
    id: "KM-003",
    code: "T003",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2025-03-10",
      last_check_date: "2024-09-10",
    },
    job_cards: [],
    maintenance_history: [{ date: "2023-12-01", duration_days: 1, notes: "Scheduled maintenance" }],
    mileage: 38000,
    stabling_position: "A3",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 95,
    availability_confidence: 98,
  },
  {
    id: "KM-004",
    code: "T004",
    status: "Standby",
    fitness_certificate: {
      expiry_date: "2024-11-30",
      last_check_date: "2024-05-30",
    },
    job_cards: [{ id: "JC-004", status: "closed", description: "Light replacement", created_at: "2023-12-20" }],
    maintenance_history: [{ date: "2023-12-20", duration_days: 1, notes: "Light system maintenance" }],
    mileage: 41000,
    stabling_position: "C1",
    cleaning_schedule: "Weekly",
    branding_status: "Complete",
    priority_score: 78,
    availability_confidence: 85,
  },
  {
    id: "KM-005",
    code: "T005",
    status: "OutOfService",
    fitness_certificate: {
      expiry_date: "2024-08-15",
      last_check_date: "2024-02-15",
    },
    job_cards: [
      { id: "JC-005", status: "open", description: "Fitness certificate renewal", created_at: "2024-01-20" },
      { id: "JC-006", status: "open", description: "Safety system upgrade", created_at: "2024-01-22" },
    ],
    maintenance_history: [{ date: "2024-01-20", duration_days: 14, notes: "Fitness renewal process" }],
    mileage: 58000,
    stabling_position: "D1",
    cleaning_schedule: "None",
    branding_status: "Expired",
    priority_score: 25,
    availability_confidence: 30,
  },
  {
    id: "KM-006",
    code: "T006",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2025-01-20",
      last_check_date: "2024-07-20",
    },
    job_cards: [],
    maintenance_history: [{ date: "2023-11-15", duration_days: 2, notes: "Preventive maintenance" }],
    mileage: 42000,
    stabling_position: "A2",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 90,
    availability_confidence: 95,
  },
  {
    id: "KM-007",
    code: "T007",
    status: "Maintenance",
    fitness_certificate: {
      expiry_date: "2024-12-05",
      last_check_date: "2024-06-05",
    },
    job_cards: [{ id: "JC-007", status: "open", description: "Wheel replacement", created_at: "2024-01-25" }],
    maintenance_history: [{ date: "2024-01-25", duration_days: 3, notes: "Wheel system maintenance" }],
    mileage: 49000,
    stabling_position: "B1",
    cleaning_schedule: "Weekly",
    branding_status: "Complete",
    priority_score: 65,
    availability_confidence: 70,
  },
  {
    id: "KM-008",
    code: "T008",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2025-02-28",
      last_check_date: "2024-08-28",
    },
    job_cards: [{ id: "JC-008", status: "closed", description: "Interior cleaning", created_at: "2024-01-05" }],
    maintenance_history: [{ date: "2024-01-05", duration_days: 1, notes: "Deep cleaning completed" }],
    mileage: 36000,
    stabling_position: "A4",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 88,
    availability_confidence: 93,
  },
  {
    id: "KM-009",
    code: "T009",
    status: "Standby",
    fitness_certificate: {
      expiry_date: "2024-10-10",
      last_check_date: "2024-04-10",
    },
    job_cards: [],
    maintenance_history: [{ date: "2023-10-15", duration_days: 1, notes: "Routine check" }],
    mileage: 44000,
    stabling_position: "C2",
    cleaning_schedule: "Weekly",
    branding_status: "Complete",
    priority_score: 82,
    availability_confidence: 87,
  },
  {
    id: "KM-010",
    code: "T010",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2025-04-15",
      last_check_date: "2024-10-15",
    },
    job_cards: [],
    maintenance_history: [{ date: "2023-12-10", duration_days: 2, notes: "Scheduled maintenance" }],
    mileage: 39000,
    stabling_position: "A5",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 92,
    availability_confidence: 96,
  },
  {
    id: "KM-011",
    code: "T011",
    status: "Maintenance",
    fitness_certificate: {
      expiry_date: "2024-09-30",
      last_check_date: "2024-03-30",
    },
    job_cards: [
      { id: "JC-009", status: "open", description: "Electrical system check", created_at: "2024-01-30" },
      { id: "JC-010", status: "open", description: "Communication system upgrade", created_at: "2024-02-01" },
    ],
    maintenance_history: [{ date: "2024-01-30", duration_days: 5, notes: "Electrical system overhaul" }],
    mileage: 51000,
    stabling_position: "B3",
    cleaning_schedule: "None",
    branding_status: "Pending",
    priority_score: 50,
    availability_confidence: 65,
  },
  {
    id: "KM-012",
    code: "T012",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2025-01-05",
      last_check_date: "2024-07-05",
    },
    job_cards: [],
    maintenance_history: [{ date: "2023-11-25", duration_days: 1, notes: "Minor repairs" }],
    mileage: 40000,
    stabling_position: "A6",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 89,
    availability_confidence: 94,
  },
  {
    id: "KM-013",
    code: "T013",
    status: "Standby",
    fitness_certificate: {
      expiry_date: "2024-11-15",
      last_check_date: "2024-05-15",
    },
    job_cards: [{ id: "JC-011", status: "closed", description: "Seat repair", created_at: "2023-12-15" }],
    maintenance_history: [{ date: "2023-12-15", duration_days: 1, notes: "Interior maintenance" }],
    mileage: 43000,
    stabling_position: "C3",
    cleaning_schedule: "Weekly",
    branding_status: "Complete",
    priority_score: 80,
    availability_confidence: 86,
  },
  {
    id: "KM-014",
    code: "T014",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2025-03-20",
      last_check_date: "2024-09-20",
    },
    job_cards: [],
    maintenance_history: [{ date: "2023-10-30", duration_days: 2, notes: "Comprehensive check" }],
    mileage: 37000,
    stabling_position: "A7",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 93,
    availability_confidence: 97,
  },
  {
    id: "KM-015",
    code: "T015",
    status: "OutOfService",
    fitness_certificate: {
      expiry_date: "2024-07-25",
      last_check_date: "2024-01-25",
    },
    job_cards: [
      { id: "JC-012", status: "open", description: "Major overhaul required", created_at: "2024-02-05" },
      { id: "JC-013", status: "open", description: "Fitness certificate expired", created_at: "2024-02-06" },
    ],
    maintenance_history: [{ date: "2024-02-05", duration_days: 21, notes: "Major overhaul in progress" }],
    mileage: 62000,
    stabling_position: "D2",
    cleaning_schedule: "None",
    branding_status: "Expired",
    priority_score: 20,
    availability_confidence: 25,
  },
  {
    id: "KM-016",
    code: "T016",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2025-02-10",
      last_check_date: "2024-08-10",
    },
    job_cards: [],
    maintenance_history: [{ date: "2023-12-05", duration_days: 1, notes: "Regular maintenance" }],
    mileage: 41500,
    stabling_position: "A8",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 91,
    availability_confidence: 95,
  },
  {
    id: "KM-017",
    code: "T017",
    status: "Maintenance",
    fitness_certificate: {
      expiry_date: "2024-12-20",
      last_check_date: "2024-06-20",
    },
    job_cards: [{ id: "JC-014", status: "open", description: "Suspension system repair", created_at: "2024-02-10" }],
    maintenance_history: [{ date: "2024-02-10", duration_days: 4, notes: "Suspension maintenance" }],
    mileage: 47000,
    stabling_position: "B4",
    cleaning_schedule: "Weekly",
    branding_status: "Complete",
    priority_score: 68,
    availability_confidence: 72,
  },
  {
    id: "KM-018",
    code: "T018",
    status: "Standby",
    fitness_certificate: {
      expiry_date: "2025-01-15",
      last_check_date: "2024-07-15",
    },
    job_cards: [],
    maintenance_history: [{ date: "2023-11-10", duration_days: 1, notes: "Preventive check" }],
    mileage: 38500,
    stabling_position: "C4",
    cleaning_schedule: "Weekly",
    branding_status: "Complete",
    priority_score: 84,
    availability_confidence: 89,
  },
  {
    id: "KM-019",
    code: "T019",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2025-04-05",
      last_check_date: "2024-10-05",
    },
    job_cards: [],
    maintenance_history: [{ date: "2023-09-20", duration_days: 2, notes: "Routine maintenance" }],
    mileage: 35000,
    stabling_position: "A9",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 94,
    availability_confidence: 98,
  },
  {
    id: "KM-020",
    code: "T020",
    status: "Active",
    fitness_certificate: {
      expiry_date: "2025-03-25",
      last_check_date: "2024-09-25",
    },
    job_cards: [{ id: "JC-015", status: "closed", description: "Window cleaning", created_at: "2024-01-12" }],
    maintenance_history: [{ date: "2024-01-12", duration_days: 1, notes: "Cleaning and minor repairs" }],
    mileage: 39500,
    stabling_position: "A10",
    cleaning_schedule: "Daily",
    branding_status: "Complete",
    priority_score: 87,
    availability_confidence: 92,
  },
]

export const getTrainById = (id: string): Trainset | undefined => {
  return TRAINSETS.find((train) => train.id === id)
}
