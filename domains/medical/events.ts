export const MEDICAL_EVENTS = {
  CLEARED: 'medical:cleared',
  PRESCRIPTION_UPSERTED: 'medical:prescription_upserted',
} as const

export interface MedicalClearedPayload {}

export interface MedicalPrescriptionUpsertedPayload {
  prescriptionId: string
  ownerId: string
}
