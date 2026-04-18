import '../../test/setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	transaction: vi.fn(),
}));

const txMocks = vi.hoisted(() => ({
	findFirst: vi.fn(),
	deleteMany: vi.fn(),
	update: vi.fn(),
}));

vi.mock('@repo/db', () => ({
	prisma: {
		$transaction: mocks.transaction,
	},
}));

import { NotFoundError } from '../../lib/errors';
import { unassignCarerService } from './visit.service';

describe('unassignCarerService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) =>
			callback({
				visitAssignment: {
					findFirst: txMocks.findFirst,
					deleteMany: txMocks.deleteMany,
					update: txMocks.update,
				},
			}),
		);
	});

	it('removes older inactive duplicates before deactivating the active assignment', async () => {
		txMocks.findFirst.mockResolvedValue({ id: 'assignment-active' });
		txMocks.deleteMany.mockResolvedValue({ count: 1 });
		txMocks.update.mockResolvedValue({});

		await expect(
			unassignCarerService('org-1', 'visit-1', 'carer-1'),
		).resolves.toEqual({
			message: 'Carer unassigned successfully',
		});

		expect(txMocks.deleteMany).toHaveBeenCalledWith({
			where: {
				visitId: 'visit-1',
				carerId: 'carer-1',
				organizationId: 'org-1',
				isActive: false,
			},
		});
		expect(txMocks.update).toHaveBeenCalledWith({
			where: { id: 'assignment-active' },
			data: expect.objectContaining({
				isActive: false,
				unassignedAt: expect.any(Date),
			}),
		});
	});

	it('throws when there is no active assignment to unassign', async () => {
		txMocks.findFirst.mockResolvedValue(null);

		await expect(
			unassignCarerService('org-1', 'visit-1', 'carer-1'),
		).rejects.toBeInstanceOf(NotFoundError);

		expect(txMocks.deleteMany).not.toHaveBeenCalled();
		expect(txMocks.update).not.toHaveBeenCalled();
	});
});
