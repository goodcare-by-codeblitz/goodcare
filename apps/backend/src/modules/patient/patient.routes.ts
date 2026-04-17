import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
  createPatientController,
  deletePatientController,
  getPatientController,
  getPatientProfileController,
  listPatientsController,
  updatePatientController,
  updatePatientProfileController,
} from './patient.controller';
import {
  createPatientOpts,
  deletePatientOpts,
  getPatientOpts,
  getPatientProfileOpts,
  listPatientsOpts,
  updatePatientOpts,
  updatePatientProfileOpts,
} from './patient.schemas';

export async function patientRoutes(app: FastifyInstance) {
  const auth = authenticate(app);

  // POST /orgs/:organizationId/patients
  app.post(
    '/:organizationId/patients',
    { ...createPatientOpts, preHandler: [auth, orgScope, authorize('manage_patients')] },
    createPatientController,
  );

  // GET /orgs/:organizationId/patients
  app.get(
    '/:organizationId/patients',
    { ...listPatientsOpts, preHandler: [auth, orgScope, authorize('view_patients')] },
    listPatientsController,
  );

  // GET /orgs/:organizationId/patients/:patientId
  app.get(
    '/:organizationId/patients/:patientId',
    { ...getPatientOpts, preHandler: [auth, orgScope, authorize('view_patients')] },
    getPatientController,
  );

  app.get(
    '/:organizationId/patients/:patientId/profile',
    { ...getPatientProfileOpts, preHandler: [auth, orgScope, authorize('view_patients')] },
    getPatientProfileController,
  );

  // PATCH /orgs/:organizationId/patients/:patientId
  app.patch(
    '/:organizationId/patients/:patientId',
    { ...updatePatientOpts, preHandler: [auth, orgScope, authorize('manage_patients')] },
    updatePatientController,
  );

  app.patch(
    '/:organizationId/patients/:patientId/profile',
    { ...updatePatientProfileOpts, preHandler: [auth, orgScope, authorize('manage_patients')] },
    updatePatientProfileController,
  );

  // DELETE /orgs/:organizationId/patients/:patientId (soft delete)
  app.delete(
    '/:organizationId/patients/:patientId',
    { ...deletePatientOpts, preHandler: [auth, orgScope, authorize('manage_patients')] },
    deletePatientController,
  );
}
