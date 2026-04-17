'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	NativeSelect,
	NativeSelectOption,
} from '@/components/ui/native-select';
import {
	createCarePlan,
	deleteCarePlan,
	fetchCarePlan,
	fetchCarePlans,
	fetchPatient,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	updateCarePlan,
	type CarePlanDetail,
	type CarePlanListItem,
	type CarePlanGoalStatus,
	type CarePlanRiskLevel,
	type CarePlanStatus,
	type OrgContext,
	type PatientDetail,
} from '@/lib/org-management';
import { ArrowLeft, ChevronRight, ClipboardList, Plus } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState, type ReactNode } from 'react';

type ConditionForm = {
	name: string;
	diagnosedYear: string;
	description: string;
	patientImpact: string;
	carerNotes: string;
};

type RiskForm = {
	label: string;
	level: CarePlanRiskLevel;
	notes: string;
	reviewDate: string;
};

type TaskForm = {
	label: string;
	visitType: string;
	required: boolean;
	notes: string;
};

type GoalForm = {
	description: string;
	category: string;
	targetDate: string;
	status: CarePlanGoalStatus;
	notes: string;
};

type CarePlanFormState = {
	summary: string;
	status: CarePlanStatus;
	conditions: ConditionForm[];
	risks: RiskForm[];
	tasks: TaskForm[];
	goals: GoalForm[];
};

const textAreaClassName =
	'min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

function emptyForm(): CarePlanFormState {
	return {
		summary: '',
		status: 'DRAFT',
		conditions: [{ name: '', diagnosedYear: '', description: '', patientImpact: '', carerNotes: '' }],
		risks: [{ label: '', level: 'MEDIUM', notes: '', reviewDate: '' }],
		tasks: [{ label: '', visitType: '', required: true, notes: '' }],
		goals: [{ description: '', category: 'health', targetDate: '', status: 'ACTIVE', notes: '' }],
	};
}

function toFormState(carePlan: CarePlanDetail): CarePlanFormState {
	return {
		summary: carePlan.summary,
		status: carePlan.status,
		conditions:
			carePlan.conditions.length > 0
				? carePlan.conditions.map((condition) => ({
						name: condition.name,
						diagnosedYear: condition.diagnosedYear?.toString() ?? '',
						description: condition.description ?? '',
						patientImpact: condition.patientImpact ?? '',
						carerNotes: condition.carerNotes ?? '',
				  }))
				: emptyForm().conditions,
		risks:
			carePlan.risks.length > 0
				? carePlan.risks.map((risk) => ({
						label: risk.label,
						level: risk.level,
						notes: risk.notes,
						reviewDate: risk.reviewDate ? risk.reviewDate.slice(0, 10) : '',
				  }))
				: emptyForm().risks,
		tasks:
			carePlan.tasks.length > 0
				? carePlan.tasks.map((task) => ({
						label: task.label,
						visitType: task.visitType,
						required: task.required,
						notes: task.notes ?? '',
				  }))
				: emptyForm().tasks,
		goals:
			carePlan.goals.length > 0
				? carePlan.goals.map((goal) => ({
						description: goal.description,
						category: goal.category,
						targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
						status: goal.status,
						notes: goal.notes ?? '',
				  }))
				: emptyForm().goals,
	};
}

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section className='rounded-2xl border border-border bg-white shadow-sm'>
			<div className='border-b border-border px-6 py-5'>
				<h2 className='font-heading text-base font-bold text-foreground'>{title}</h2>
				{description ? <p className='mt-1 text-sm text-slate-600'>{description}</p> : null}
			</div>
			<div className='px-6 py-6'>{children}</div>
		</section>
	);
}

export default function PatientCarePlansPage({
	params,
}: {
	params: Promise<{ patientId: string }>;
}) {
	const { patientId } = use(params);
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [patient, setPatient] = useState<PatientDetail | null>(null);
	const [carePlans, setCarePlans] = useState<CarePlanListItem[]>([]);
	const [selectedPlan, setSelectedPlan] = useState<CarePlanDetail | null>(null);
	const [selectedId, setSelectedId] = useState<string>('new');
	const [form, setForm] = useState<CarePlanFormState>(emptyForm());
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				const context = await getCurrentOrgContext();
				if (!isMounted) {
					return;
				}

				setOrgContext(context);
				if (!hasOrgPermission(context, 'view_care_plans')) {
					setErrorMessage('You do not have permission to view care plans.');
					return;
				}

				const [patientRecord, carePlansResult] = await Promise.all([
					fetchPatient(context.organizationId, patientId),
					fetchCarePlans(context.organizationId, {
						patientId,
						page: 1,
						limit: 50,
					}),
				]);

				if (!isMounted) {
					return;
				}

				setPatient(patientRecord);
				setCarePlans(carePlansResult.carePlans);
				if (carePlansResult.carePlans.length > 0) {
					const firstPlan = await fetchCarePlan(
						context.organizationId,
						carePlansResult.carePlans[0].id,
					);
					if (!isMounted) {
						return;
					}

					setSelectedPlan(firstPlan);
					setSelectedId(firstPlan.id);
					setForm(toFormState(firstPlan));
				}
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(error, 'Unable to load the patient care plans.'),
					);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		void load();

		return () => {
			isMounted = false;
		};
	}, [patientId]);

	const canManageCarePlans = orgContext
		? hasOrgPermission(orgContext, 'manage_care_plans')
		: false;

	const loadPlanIntoForm = async (carePlanId: string) => {
		if (carePlanId === 'new') {
			setSelectedId('new');
			setSelectedPlan(null);
			setForm(emptyForm());
			return;
		}

		if (!orgContext) {
			return;
		}

		const carePlan = await fetchCarePlan(orgContext.organizationId, carePlanId);
		setSelectedPlan(carePlan);
		setSelectedId(carePlanId);
		setForm(toFormState(carePlan));
	};

	const refreshCarePlans = async (context: OrgContext) => {
		const result = await fetchCarePlans(context.organizationId, {
			patientId,
			page: 1,
			limit: 50,
		});
		setCarePlans(result.carePlans);
		return result.carePlans;
	};

	const handleSave = async () => {
		if (!orgContext || !canManageCarePlans) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			setSuccessMessage('');

			if (selectedPlan) {
				await updateCarePlan(orgContext.organizationId, selectedPlan.id, {
					summary: form.summary.trim(),
					status: form.status,
					conditions: form.conditions
						.filter((condition) => condition.name.trim())
						.map((condition) => ({
							name: condition.name.trim(),
							diagnosedYear: condition.diagnosedYear
								? Number(condition.diagnosedYear)
								: undefined,
							description: condition.description.trim() || undefined,
							patientImpact: condition.patientImpact.trim() || undefined,
							carerNotes: condition.carerNotes.trim() || undefined,
						})),
					risks: form.risks
						.filter((risk) => risk.label.trim() && risk.notes.trim())
						.map((risk) => ({
							label: risk.label.trim(),
							level: risk.level,
							notes: risk.notes.trim(),
							reviewDate: risk.reviewDate || undefined,
						})),
					tasks: form.tasks
						.filter((task) => task.label.trim() && task.visitType.trim())
						.map((task) => ({
							label: task.label.trim(),
							visitType: task.visitType.trim(),
							required: task.required,
							notes: task.notes.trim() || undefined,
						})),
					goals: form.goals
						.filter((goal) => goal.description.trim() && goal.category.trim())
						.map((goal) => ({
							description: goal.description.trim(),
							category: goal.category.trim(),
							targetDate: goal.targetDate || undefined,
							status: goal.status,
							notes: goal.notes.trim() || undefined,
						})),
				});
			} else {
				await createCarePlan(orgContext.organizationId, {
					patientId,
					summary: form.summary.trim(),
					status: form.status,
					conditions: form.conditions
						.filter((condition) => condition.name.trim())
						.map((condition) => ({
							name: condition.name.trim(),
							diagnosedYear: condition.diagnosedYear
								? Number(condition.diagnosedYear)
								: undefined,
							description: condition.description.trim() || undefined,
							patientImpact: condition.patientImpact.trim() || undefined,
							carerNotes: condition.carerNotes.trim() || undefined,
						})),
					risks: form.risks
						.filter((risk) => risk.label.trim() && risk.notes.trim())
						.map((risk) => ({
							label: risk.label.trim(),
							level: risk.level,
							notes: risk.notes.trim(),
							reviewDate: risk.reviewDate || undefined,
						})),
					tasks: form.tasks
						.filter((task) => task.label.trim() && task.visitType.trim())
						.map((task) => ({
							label: task.label.trim(),
							visitType: task.visitType.trim(),
							required: task.required,
							notes: task.notes.trim() || undefined,
						})),
					goals: form.goals
						.filter((goal) => goal.description.trim() && goal.category.trim())
						.map((goal) => ({
							description: goal.description.trim(),
							category: goal.category.trim(),
							targetDate: goal.targetDate || undefined,
							status: goal.status,
							notes: goal.notes.trim() || undefined,
						})),
				});
			}

			const nextCarePlans = await refreshCarePlans(orgContext);
			if (selectedPlan) {
				await loadPlanIntoForm(selectedPlan.id);
			} else if (nextCarePlans[0]) {
				await loadPlanIntoForm(nextCarePlans[0].id);
			}

			setSuccessMessage(selectedPlan ? 'Care plan updated.' : 'Care plan created.');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to save this care plan.'),
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!orgContext || !selectedPlan || !canManageCarePlans) {
			return;
		}

		try {
			setIsSaving(true);
			await deleteCarePlan(orgContext.organizationId, selectedPlan.id);
			await refreshCarePlans(orgContext);
			setSelectedId('new');
			setSelectedPlan(null);
			setForm(emptyForm());
			setSuccessMessage('Care plan deleted.');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to delete this care plan.'),
			);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<BoundingBox className='max-w-7xl'>
				<p className='text-sm text-slate-500'>Loading care plans...</p>
			</BoundingBox>
		);
	}

	if (!patient || !orgContext || !hasOrgPermission(orgContext, 'view_care_plans')) {
		return (
			<BoundingBox className='max-w-5xl'>
				<p className='text-sm font-semibold text-foreground'>
					{errorMessage || 'Care plans are not available for this patient.'}
				</p>
				<Link href={`/dashboard/patients/${patientId}`} className='mt-3 inline-flex text-sm font-semibold text-care-blue hover:underline'>
					Back to patient
				</Link>
			</BoundingBox>
		);
	}

	return (
		<BoundingBox className='max-w-7xl'>
			<nav aria-label='Breadcrumb' className='mb-6'>
				<ol className='flex items-center gap-1.5 text-sm'>
					<li>
						<Link href='/dashboard/patients' className='font-medium text-slate-500 hover:text-care-blue'>
							Patients
						</Link>
					</li>
					<li aria-hidden='true'>
						<ChevronRight className='size-3.5 text-slate-400' />
					</li>
					<li>
						<Link href={`/dashboard/patients/${patient.id}`} className='font-medium text-slate-500 hover:text-care-blue'>
							{patient.firstName} {patient.lastName}
						</Link>
					</li>
					<li aria-hidden='true'>
						<ChevronRight className='size-3.5 text-slate-400' />
					</li>
					<li className='font-semibold text-foreground'>Care plans</li>
				</ol>
			</nav>

			<div className='mb-8 flex flex-wrap items-center gap-3'>
				<Link
					href={`/dashboard/patients/${patient.id}`}
					className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 hover:bg-muted hover:text-foreground'
					aria-label='Back to patient'>
					<ArrowLeft className='size-4' />
				</Link>
				<div>
					<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
						Care plans for {patient.firstName} {patient.lastName}
					</h1>
					<p className='mt-2 text-sm text-slate-600'>
						Use structured plan versions for conditions, risks, tasks, and goals.
					</p>
				</div>
			</div>

			<div className='mb-5 min-h-5'>
				{errorMessage ? <p className='text-sm font-medium text-red-600'>{errorMessage}</p> : null}
				{successMessage ? <p className='text-sm font-medium text-green-600'>{successMessage}</p> : null}
			</div>

			<div className='grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]'>
				<section className='rounded-2xl border border-border bg-white shadow-sm'>
					<div className='flex items-center justify-between border-b border-border px-5 py-4'>
						<div>
							<h2 className='font-heading text-base font-bold text-foreground'>Plan versions</h2>
							<p className='mt-1 text-sm text-slate-600'>{carePlans.length} saved versions</p>
						</div>
						{canManageCarePlans ? (
							<Button type='button' variant='outline' size='sm' onClick={() => void loadPlanIntoForm('new')}>
								<Plus className='size-4' />
								New
							</Button>
						) : null}
					</div>
					<div className='space-y-2 p-3'>
						{carePlans.map((carePlan) => (
							<button
								key={carePlan.id}
								type='button'
								onClick={() => void loadPlanIntoForm(carePlan.id)}
								className={`w-full rounded-xl border px-4 py-3 text-left ${
									selectedId === carePlan.id
										? 'border-care-blue bg-care-blue-light/40'
										: 'border-border hover:bg-slate-50'
								}`}>
								<p className='text-sm font-semibold text-foreground'>
									Version {carePlan.version}
								</p>
								<p className='mt-1 line-clamp-2 text-sm text-slate-600'>{carePlan.summary}</p>
								<p className='mt-2 text-xs font-medium uppercase tracking-wide text-slate-400'>
									{carePlan.status} • {formatDate(carePlan.updatedAt)}
								</p>
							</button>
						))}
						{carePlans.length === 0 ? (
							<p className='px-2 py-4 text-sm text-slate-500'>No care plans created yet.</p>
						) : null}
					</div>
				</section>

				<div className='space-y-6'>
					<Section
						title={selectedPlan ? `Version ${selectedPlan.version}` : 'New care plan'}
						description='The structured care plan stays patient-scoped and versioned.'>
						<div className='grid gap-5 md:grid-cols-2'>
							<div className='space-y-2 md:col-span-2'>
								<Label htmlFor='summary'>Summary</Label>
								<textarea
									id='summary'
									className={textAreaClassName}
									disabled={!canManageCarePlans}
									value={form.summary}
									onChange={(event) =>
										setForm((current) => ({ ...current, summary: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='status'>Status</Label>
								<NativeSelect
									id='status'
									className='w-full'
									disabled={!canManageCarePlans}
									value={form.status}
									onChange={(event) =>
										setForm((current) => ({
											...current,
											status: event.target.value as CarePlanStatus,
										}))
									}>
									<NativeSelectOption value='DRAFT'>Draft</NativeSelectOption>
									<NativeSelectOption value='ACTIVE'>Active</NativeSelectOption>
									<NativeSelectOption value='SUPERSEDED'>Superseded</NativeSelectOption>
									<NativeSelectOption value='ARCHIVED'>Archived</NativeSelectOption>
								</NativeSelect>
							</div>
						</div>
					</Section>

					<Section title='Conditions'>
						<div className='space-y-4'>
							{form.conditions.map((condition, index) => (
								<div key={`condition-${index}`} className='rounded-2xl border border-border p-4'>
									<div className='grid gap-4 md:grid-cols-2'>
										<div className='space-y-2'>
											<Label>Name</Label>
											<Input
												disabled={!canManageCarePlans}
												value={condition.name}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														conditions: current.conditions.map((item, itemIndex) =>
															itemIndex === index
																? { ...item, name: event.target.value }
																: item,
														),
													}))
												}
											/>
										</div>
										<div className='space-y-2'>
											<Label>Diagnosed year</Label>
											<Input
												disabled={!canManageCarePlans}
												value={condition.diagnosedYear}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														conditions: current.conditions.map((item, itemIndex) =>
															itemIndex === index
																? { ...item, diagnosedYear: event.target.value }
																: item,
														),
													}))
												}
											/>
										</div>
										<div className='space-y-2 md:col-span-2'>
											<Label>Description</Label>
											<textarea
												className={textAreaClassName}
												disabled={!canManageCarePlans}
												value={condition.description}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														conditions: current.conditions.map((item, itemIndex) =>
															itemIndex === index
																? { ...item, description: event.target.value }
																: item,
														),
													}))
												}
											/>
										</div>
										<div className='space-y-2'>
											<Label>Patient impact</Label>
											<textarea
												className={textAreaClassName}
												disabled={!canManageCarePlans}
												value={condition.patientImpact}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														conditions: current.conditions.map((item, itemIndex) =>
															itemIndex === index
																? { ...item, patientImpact: event.target.value }
																: item,
														),
													}))
												}
											/>
										</div>
										<div className='space-y-2'>
											<Label>Carer notes</Label>
											<textarea
												className={textAreaClassName}
												disabled={!canManageCarePlans}
												value={condition.carerNotes}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														conditions: current.conditions.map((item, itemIndex) =>
															itemIndex === index
																? { ...item, carerNotes: event.target.value }
																: item,
														),
													}))
												}
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</Section>

					<Section title='Risks, tasks, and goals'>
						<div className='grid gap-6 xl:grid-cols-3'>
							<div className='space-y-4'>
								<h3 className='text-sm font-semibold text-foreground'>Risks</h3>
								{form.risks.map((risk, index) => (
									<div key={`risk-${index}`} className='rounded-2xl border border-border p-4 space-y-3'>
										<Input
											disabled={!canManageCarePlans}
											value={risk.label}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													risks: current.risks.map((item, itemIndex) =>
														itemIndex === index
															? { ...item, label: event.target.value }
															: item,
													),
												}))
											}
											placeholder='Risk label'
										/>
										<NativeSelect
											className='w-full'
											disabled={!canManageCarePlans}
											value={risk.level}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													risks: current.risks.map((item, itemIndex) =>
														itemIndex === index
															? { ...item, level: event.target.value as CarePlanRiskLevel }
															: item,
													),
												}))
											}>
											<NativeSelectOption value='LOW'>Low</NativeSelectOption>
											<NativeSelectOption value='MEDIUM'>Medium</NativeSelectOption>
											<NativeSelectOption value='HIGH'>High</NativeSelectOption>
										</NativeSelect>
										<textarea
											className={textAreaClassName}
											disabled={!canManageCarePlans}
											value={risk.notes}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													risks: current.risks.map((item, itemIndex) =>
														itemIndex === index
															? { ...item, notes: event.target.value }
															: item,
													),
												}))
											}
											placeholder='Risk notes'
										/>
									</div>
								))}
							</div>

							<div className='space-y-4'>
								<h3 className='text-sm font-semibold text-foreground'>Tasks</h3>
								{form.tasks.map((task, index) => (
									<div key={`task-${index}`} className='rounded-2xl border border-border p-4 space-y-3'>
										<Input
											disabled={!canManageCarePlans}
											value={task.label}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													tasks: current.tasks.map((item, itemIndex) =>
														itemIndex === index
															? { ...item, label: event.target.value }
															: item,
													),
												}))
											}
											placeholder='Task label'
										/>
										<Input
											disabled={!canManageCarePlans}
											value={task.visitType}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													tasks: current.tasks.map((item, itemIndex) =>
														itemIndex === index
															? { ...item, visitType: event.target.value }
															: item,
													),
												}))
											}
											placeholder='Visit type'
										/>
										<label className='inline-flex items-center gap-2 text-sm text-slate-700'>
											<input
												type='checkbox'
												disabled={!canManageCarePlans}
												checked={task.required}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														tasks: current.tasks.map((item, itemIndex) =>
															itemIndex === index
																? { ...item, required: event.target.checked }
																: item,
														),
													}))
												}
											/>
											Required task
										</label>
									</div>
								))}
							</div>

							<div className='space-y-4'>
								<h3 className='text-sm font-semibold text-foreground'>Goals</h3>
								{form.goals.map((goal, index) => (
									<div key={`goal-${index}`} className='rounded-2xl border border-border p-4 space-y-3'>
										<textarea
											className={textAreaClassName}
											disabled={!canManageCarePlans}
											value={goal.description}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													goals: current.goals.map((item, itemIndex) =>
														itemIndex === index
															? { ...item, description: event.target.value }
															: item,
													),
												}))
											}
											placeholder='Goal description'
										/>
										<Input
											disabled={!canManageCarePlans}
											value={goal.category}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													goals: current.goals.map((item, itemIndex) =>
														itemIndex === index
															? { ...item, category: event.target.value }
															: item,
													),
												}))
											}
											placeholder='Category'
										/>
										<NativeSelect
											className='w-full'
											disabled={!canManageCarePlans}
											value={goal.status}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													goals: current.goals.map((item, itemIndex) =>
														itemIndex === index
															? { ...item, status: event.target.value as CarePlanGoalStatus }
															: item,
													),
												}))
											}>
											<NativeSelectOption value='ACTIVE'>Active</NativeSelectOption>
											<NativeSelectOption value='ACHIEVED'>Achieved</NativeSelectOption>
											<NativeSelectOption value='PAUSED'>Paused</NativeSelectOption>
										</NativeSelect>
									</div>
								))}
							</div>
						</div>
					</Section>

					<div className='flex flex-wrap items-center justify-end gap-3'>
						{selectedPlan && canManageCarePlans ? (
							<Button type='button' variant='destructive' onClick={handleDelete} disabled={isSaving}>
								Delete care plan
							</Button>
						) : null}
						{canManageCarePlans ? (
							<Button type='button' onClick={handleSave} disabled={isSaving}>
								{isSaving ? 'Saving...' : selectedPlan ? 'Save care plan' : 'Create care plan'}
							</Button>
						) : null}
					</div>
				</div>
			</div>
		</BoundingBox>
	);
}
