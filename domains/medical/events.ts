export const MEDICAL_EVENTS = {
  CLEARED: 'medical:cleared',
  PRESCRIPTION_UPSERTED: 'medical:prescription_upserted',
  PRESCRIPTION_SCANNED: 'medical:prescription_scanned',
} as const

export interface MedicalClearedPayload {}

export interface MedicalPrescriptionUpsertedPayload {
  prescriptionId: string
  ownerId: string
}

export interface MedicalPrescriptionScannedPayload {
  token: string
}
