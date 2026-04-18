import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
	createMedicationAdministrationController,
	createMedicationController,
	deleteMedicationController,
	getMedicationController,
	getPatientMarController,
	listMedicationAdministrationsController,
	listMedicationsController,
	updateMedicationController,
} from './medication.controller';
import {
	createAdministrationSchema,
	createMedicationSchema,
	deleteMedicationOpts,
	getMedicationSchema,
	getMarSchema,
	listAdministrationsSchema,
	listMedicationsSchema,
	updateMedicationSchema,
} from './medication.schemas';

export async function medicationRoutes(app: FastifyInstance) {
	const auth = authenticate(app);

	app.get(
		'/:organizationId/medications',
		{ ...listMedicationsSchema, preHandler: [auth, orgScope, authorize('view_medications')] },
		listMedicationsController,
	);

	app.get(
		'/:organizationId/patients/:patientId/mar',
		{ ...getMarSchema, preHandler: [auth, orgScope, authorize('view_medications')] },
		getPatientMarController,
	);

	app.post(
		'/:organizationId/patients/:patientId/medications',
		{ ...createMedicationSchema, preHandler: [auth, orgScope, authorize('manage_medications')] },
		createMedicationController,
	);

	app.get(
		'/:organizationId/patients/:patientId/medications/:medicationId',
		{ ...getMedicationSchema, preHandler: [auth, orgScope, authorize('view_medications')] },
		getMedicationController,
	);

	app.patch(
		'/:organizationId/patients/:patientId/medications/:medicationId',
		{ ...updateMedicationSchema, preHandler: [auth, orgScope, authorize('manage_medications')] },
		updateMedicationController,
	);

	app.delete(
		'/:organizationId/patients/:patientId/medications/:medicationId',
		{ ...deleteMedicationOpts, preHandler: [auth, orgScope, authorize('manage_medications')] },
		deleteMedicationController,
	);

	app.get(
		'/:organizationId/patients/:patientId/medications/:medicationId/administrations',
		{ ...listAdministrationsSchema, preHandler: [auth, orgScope, authorize('view_medications')] },
		listMedicationAdministrationsController,
	);

	app.post(
		'/:organizationId/patients/:patientId/medications/:medicationId/administrations',
		{ ...createAdministrationSchema, preHandler: [auth, orgScope, authorize('administer_medications')] },
		createMedicationAdministrationController,
	);
}
