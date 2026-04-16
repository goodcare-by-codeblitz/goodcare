'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	AlertTriangle,
	Check,
	ChevronRight,
	FileText,
	Heart,
	List,
	ListOrdered,
	Pill,
	Plus,
	Search,
	Shield,
	Stethoscope,
	Target,
	Trash2,
	User,
	X,
} from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════════════ */

type PlanStatus = 'DRAFT' | 'ACTIVE' | 'REVIEW' | 'ARCHIVED';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'PAUSED';

interface Condition {
	id: string;
	name: string;
	diagnosedYear?: number;
	description?: string; // HTML – what is this condition
	patientImpact?: string; // HTML – how it affects this patient
	carerNotes?: string; // HTML – carer instructions
}

interface Medication {
	id: string;
	name: string;
	doseAmount: string;
	doseUnit: string;
	route: string;
	frequency: string;
	timing?: string;
	therapeuticEffects?: string; // HTML
	sideEffects?: string; // HTML
	carerInstructions?: string; // HTML
}

interface CareTask {
	id: string;
	label: string;
	visitType: string;
	required: boolean;
	notes?: string;
}

interface RiskItem {
	id: string;
	label: string;
	level: RiskLevel;
	notes: string;
	reviewDate?: string;
}

interface CareGoal {
	id: string;
	description: string;
	category: 'independence' | 'health' | 'social' | 'safety';
	targetDate?: string;
	status: GoalStatus;
	notes?: string;
}

interface Preferences {
	diet: string;
	allergies: string;
	communication: string;
	language: string;
	religion: string;
	lifestyle: string;
	carerGender: 'NO_PREFERENCE' | 'MALE' | 'FEMALE';
	pets: string;
	routine: string;
}

interface CarePlan {
	id: string;
	version: number;
	status: PlanStatus;
	createdAt: string;
	reviewDate: string;
	lastReviewedBy: string;
	conditions: Condition[];
	allergies: string[];
	medications: Medication[];
	dnarStatus: boolean;
	mentalCapacity: boolean;
	gp: string;
	tasks: CareTask[];
	preferences: Preferences;
	risks: RiskItem[];
	goals: CareGoal[];
	consentGiven: boolean;
	lpaName?: string;
	notes: string;
}

interface Patient {
	id: string;
	name: string;
	dob: string;
	nhsNumber: string;
	address: string;
	phone: string;
	emergencyContact: string;
	emergencyPhone: string;
	status: 'ACTIVE' | 'INACTIVE' | 'HOSPITAL';
	plan?: CarePlan;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mock data
═══════════════════════════════════════════════════════════════════════════ */

const MOCK_PATIENTS: Patient[] = [
	{
		id: 'p1',
		name: 'Robert Miller',
		dob: '1942-06-15',
		nhsNumber: '485 777 3451',
		address: '14 Elm Street, Manchester, M1 2AB',
		phone: '0161 234 5678',
		emergencyContact: 'Susan Miller (Daughter)',
		emergencyPhone: '07700 900111',
		status: 'ACTIVE',
		plan: {
			id: 'cp1',
			version: 3,
			status: 'ACTIVE',
			createdAt: '2024-09-01',
			reviewDate: '2026-06-01',
			lastReviewedBy: 'Sarah Jenkins',
			conditions: [
				{
					id: 'c1',
					name: 'Type 2 Diabetes Mellitus',
					diagnosedYear: 2011,
					description:
						'<p>Type 2 Diabetes Mellitus is a chronic metabolic condition in which the body either does not produce sufficient insulin or the cells do not respond effectively to it (insulin resistance). This leads to persistently elevated blood glucose levels (hyperglycaemia) which, over time, can damage blood vessels, nerves and organs including the kidneys, eyes and heart.</p>',
					patientImpact:
						'<p>Robert has had Type 2 Diabetes since 2011, currently well-controlled on Metformin. He monitors his blood glucose daily and adheres to a diabetic diet. He is at elevated risk of cardiovascular disease and renal complications, both of which are being monitored alongside his CKD diagnosis.</p>',
					carerNotes:
						'<p>Check and document blood glucose <strong>every morning</strong>. Target range: <strong>4–10 mmol/L</strong>.</p><ul><li>Reading below 4 mmol/L — treat for hypoglycaemia, contact supervisor</li><li>Reading above 15 mmol/L — do not administer Metformin, contact GP</li></ul><p>All meals must be low-sugar and high-fibre. Never offer sugary snacks unless treating a hypo.</p>',
				},
				{
					id: 'c2',
					name: 'Hypertension',
					diagnosedYear: 2008,
					description:
						'<p>Hypertension (high blood pressure) is a long-term condition in which the force of blood against artery walls is consistently too high. It is a major risk factor for heart attack, stroke and kidney disease. It is generally asymptomatic but causes cumulative cardiovascular damage over time.</p>',
					patientImpact:
						"<p>Managed with Amlodipine since 2008. Generally asymptomatic but contributes to Robert's overall cardiovascular risk profile alongside diabetes and CKD. Blood pressure is reviewed weekly.</p>",
					carerNotes:
						'<p>Blood pressure check <strong>every Thursday morning</strong> — document the reading in the care log. Report any reading above <strong>180/110 mmHg</strong> or if Robert reports severe headache, blurred vision, nosebleed or chest pain.</p>',
				},
				{
					id: 'c3',
					name: 'Chronic Kidney Disease (Stage 2)',
					diagnosedYear: 2019,
					description:
						'<p>Chronic Kidney Disease (CKD) is a long-term condition characterised by gradual loss of kidney function. Stage 2 indicates mildly reduced kidney function (GFR 60–89 ml/min). The kidneys are less effective at filtering waste products and balancing fluid and electrolytes.</p>',
					patientImpact:
						"<p>Robert's CKD is in the early stage and currently managed through monitoring and medication. Fluid intake must be carefully balanced. His kidney function is reviewed regularly by his GP and may be affected by dehydration or certain medications including NSAIDs.</p>",
					carerNotes:
						'<ul><li>Monitor and document fluid intake daily. Target: <strong>1.5 litres</strong> unless GP advises otherwise</li><li>Report any signs of reduced urine output, ankle swelling or sudden confusion</li><li><strong>Never give ibuprofen or NSAIDs</strong> — these worsen kidney function</li></ul>',
				},
			],
			allergies: ['Penicillin (anaphylaxis)', 'Latex'],
			medications: [
				{
					id: 'med1',
					name: 'Metformin',
					doseAmount: '500',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Twice daily',
					timing: 'With food',
					therapeuticEffects:
						'<p>Controls blood glucose by reducing hepatic glucose production and improving peripheral insulin sensitivity. Helps prevent long-term diabetic complications including nephropathy, retinopathy and cardiovascular disease.</p>',
					sideEffects:
						'<p>GI upset (nausea, diarrhoea, abdominal discomfort) — most common when starting or increasing dose. May cause a metallic taste. <strong>Rarely:</strong> lactic acidosis — report any breathlessness, severe muscle pain or unusual fatigue immediately.</p>',
					carerInstructions:
						'<p><strong>Always give with food</strong> to minimise GI side effects. Morning dose with breakfast; evening dose with dinner. <strong>Do not administer if patient is unwell, dehydrated, or refusing to eat</strong> — contact supervisor. Note: PENICILLIN allergy — maintain vigilance with any new medications.</p>',
				},
				{
					id: 'med2',
					name: 'Amlodipine',
					doseAmount: '5',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Once daily',
					timing: 'Morning',
					therapeuticEffects:
						'<p>Calcium channel blocker that relaxes and widens blood vessels, lowering blood pressure and reducing the workload on the heart. Used to treat both hypertension and angina.</p>',
					sideEffects:
						'<p>Ankle swelling (peripheral oedema) — report if sudden or worsening. Facial flushing, headache, dizziness. <strong>Monitor for postural hypotension</strong> (dizziness on standing from a seated or lying position).</p>',
					carerInstructions:
						'<p>Administer in the morning, with or without food. Check ankles for swelling at each visit and document. Assist Robert when standing to reduce fall risk from dizziness. Report any new or worsening oedema to the care manager.</p>',
				},
				{
					id: 'med3',
					name: 'Aspirin',
					doseAmount: '75',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Once daily',
					timing: 'With food',
					therapeuticEffects:
						'<p>Low-dose antiplatelet agent that prevents blood clot formation by inhibiting platelet aggregation. Reduces the risk of heart attack and stroke in patients with cardiovascular risk factors.</p>',
					sideEffects:
						'<p>GI irritation or bleeding — watch for dark/tarry stools, stomach pain or persistent indigestion. Bruising may be more pronounced. <strong>Do not combine with ibuprofen or NSAIDs.</strong></p>',
					carerInstructions:
						'<p>Give with food or a glass of milk to reduce stomach irritation. Do not administer if Robert reports stomach pain. <strong>PENICILLIN ALLERGY on file</strong> — also maintain vigilance about any new OTC medications. Do not give alongside ibuprofen or anti-inflammatories.</p>',
				},
			],
			dnarStatus: false,
			mentalCapacity: true,
			gp: 'Dr. A. Patel – Elm Street Surgery, 0161 234 1000',
			tasks: [
				{
					id: 't1',
					label: 'Personal hygiene, wash & dress',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't2',
					label: 'Blood glucose check (document reading)',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't3',
					label: 'Administer Metformin 500mg + Aspirin 75mg + Amlodipine 5mg',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't4',
					label: 'Prepare and serve breakfast – low sugar, high fibre',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't5',
					label: 'Blood pressure check (weekly, Thursdays)',
					visitType: 'Morning',
					required: false,
				},
				{
					id: 't6',
					label: 'Prepare and serve evening meal',
					visitType: 'Evening',
					required: true,
				},
				{
					id: 't7',
					label: 'Administer Metformin 500mg (evening dose)',
					visitType: 'Evening',
					required: true,
				},
				{
					id: 't8',
					label: 'Assist with undressing and nightwear',
					visitType: 'Evening',
					required: true,
				},
				{
					id: 't9',
					label: 'Document fluid intake for the day',
					visitType: 'Evening',
					required: true,
				},
			],
			preferences: {
				diet: 'Low sugar, high fibre. No red meat. Diabetic-friendly meals only.',
				allergies: 'No nuts or nut-containing products.',
				communication:
					'Speaks clearly. Wears hearing aids – speak clearly and directly.',
				language: 'English',
				religion: 'Church of England – Sunday church important to him.',
				lifestyle:
					'Enjoys daily newspaper, cricket and crosswords. Retired postal worker.',
				carerGender: 'NO_PREFERENCE',
				pets: 'No pets.',
				routine:
					'Prefers to wake no earlier than 07:30. Likes a consistent routine.',
			},
			risks: [
				{
					id: 'r1',
					label: 'Falls Risk',
					level: 'MEDIUM',
					notes:
						'Unsteady gait, uses walking frame. Ensure path is clear. Non-slip mats in bathroom.',
					reviewDate: '2026-06-01',
				},
				{
					id: 'r2',
					label: 'Pressure Sore Risk',
					level: 'LOW',
					notes:
						'Mobile and repositions independently. Check skin integrity monthly.',
					reviewDate: '2026-06-01',
				},
				{
					id: 'r3',
					label: 'Nutrition & Hydration Risk',
					level: 'MEDIUM',
					notes:
						'Diabetic – monitor blood glucose. Encourage 1.5L fluids daily. Weight check monthly.',
					reviewDate: '2026-06-01',
				},
				{
					id: 'r4',
					label: 'Medication Risk',
					level: 'LOW',
					notes:
						'Compliant with medication. PENICILLIN ALLERGY – do not administer.',
					reviewDate: '2026-03-01',
				},
				{
					id: 'r5',
					label: 'Moving & Handling',
					level: 'LOW',
					notes:
						'Mobile with walking frame. No hoist required. Assist with stairs only.',
					reviewDate: '2026-06-01',
				},
			],
			goals: [
				{
					id: 'g1',
					description:
						'Maintain blood glucose within target range (4–10 mmol/L) through diet and medication compliance',
					category: 'health',
					targetDate: '2026-06-01',
					status: 'ACTIVE',
				},
				{
					id: 'g2',
					description:
						'Attend Sunday church service independently with carer transport assistance',
					category: 'social',
					targetDate: '2026-06-01',
					status: 'ACTIVE',
				},
				{
					id: 'g3',
					description:
						'Reduce falls risk through daily mobility exercise and walking frame use',
					category: 'safety',
					targetDate: '2026-06-01',
					status: 'ACTIVE',
				},
				{
					id: 'g4',
					description:
						'Maintain personal hygiene and grooming independently as much as possible',
					category: 'independence',
					status: 'ACTIVE',
				},
			],
			consentGiven: true,
			lpaName: 'Susan Miller',
			notes:
				'Robert is very independent and values his privacy. Always knock and wait. He finds mornings difficult if rushed.',
		},
	},
	{
		id: 'p2',
		name: 'Mary Higgins',
		dob: '1938-03-22',
		nhsNumber: '612 443 9900',
		address: '22 Oak Avenue, Manchester, M4 5CD',
		phone: '0161 876 5432',
		emergencyContact: 'Brian Higgins (Son)',
		emergencyPhone: '07700 900222',
		status: 'ACTIVE',
		plan: {
			id: 'cp2',
			version: 2,
			status: 'ACTIVE',
			createdAt: '2024-11-15',
			reviewDate: '2026-05-15',
			lastReviewedBy: 'David Chen',
			conditions: [
				{
					id: 'c1',
					name: 'Vascular Dementia (Moderate)',
					diagnosedYear: 2022,
					description:
						'<p>Vascular dementia is caused by reduced blood flow to the brain, damaging brain cells. It is the second most common form of dementia. Cognitive decline may be gradual or stepwise following small strokes or TIAs. Short-term memory is most significantly affected in the early-to-moderate stages.</p>',
					patientImpact:
						"<p>Mary's short-term memory is significantly impaired — she may repeat questions, become confused about the time of day, or not recognise newer carers. Her long-term memory remains largely intact. Routine and familiar environments are essential for her wellbeing.</p>",
					carerNotes:
						'<ul><li>Use simple, short sentences — repeat calmly without showing frustration</li><li>Offer orientation prompts (day, date, familiar photos) each morning</li><li>Never argue or correct her — redirect gently</li><li>Familiar music is soothing and can reduce agitation</li><li>If she becomes distressed, stay calm, use her name, and offer comfort</li></ul>',
				},
				{
					id: 'c2',
					name: 'Atrial Fibrillation',
					diagnosedYear: 2015,
					description:
						'<p>Atrial fibrillation (AF) is an irregular and often rapid heart rate that increases the risk of stroke, heart failure and other cardiac complications. The irregular heartbeat causes poor blood flow and can lead to blood clot formation in the heart.</p>',
					patientImpact:
						"<p>Mary's AF is managed with Warfarin to prevent stroke. INR (clotting time) must be monitored regularly. Any new symptoms such as palpitations, sudden breathlessness or chest pain should be reported immediately.</p>",
					carerNotes:
						'<p>Report any new palpitations, chest pain, sudden breathlessness or collapse immediately — call 999. Ensure Warfarin compliance. Watch for any unusual bruising or bleeding. <strong>NO IBUPROFEN</strong> — increases bleeding risk significantly.</p>',
				},
				{
					id: 'c3',
					name: 'Osteoporosis',
					diagnosedYear: 2018,
					description:
						'<p>Osteoporosis is a condition in which bones become weak and brittle, increasing the risk of fractures from minor falls or even everyday activities. It is common in older women and worsens with age and inactivity.</p>',
					patientImpact:
						'<p>Mary is at high fracture risk. Hip protector pads are worn during the day. Any fall must be reported and assessed for injury, even if she appears unharmed. Mobility is supervised at all times.</p>',
					carerNotes:
						'<p><strong>High fracture risk.</strong> Hip protector pads must be worn when Mary is mobile. Bed rails in use. Falls mat by bed. Report any fall immediately regardless of apparent injury — do not move patient until assessed if impact was significant.</p>',
				},
			],
			allergies: ['Ibuprofen (GI bleed history)'],
			medications: [
				{
					id: 'med1',
					name: 'Warfarin',
					doseAmount: '3',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Once daily',
					timing: 'Same time each day (6pm)',
					therapeuticEffects:
						'<p>Anticoagulant (blood thinner) that prevents blood clot formation by blocking Vitamin K-dependent clotting factors. Reduces stroke risk significantly in patients with atrial fibrillation.</p>',
					sideEffects:
						'<p><strong>Increased bleeding risk</strong> — even minor cuts may bleed longer than expected. Watch for:</p><ul><li>Unusual or extensive bruising</li><li>Pink, red or dark brown urine</li><li><strong>Black or tarry stools</strong> — report immediately (sign of internal bleeding)</li><li>Prolonged nosebleeds or bleeding gums</li><li>Unexplained severe headache</li></ul>',
					carerInstructions:
						'<p>Administer at the <strong>same time each day</strong> (6pm). INR must be monitored regularly — check GP appointment compliance. <strong>Never give aspirin, ibuprofen or any NSAIDs</strong> alongside Warfarin. Report any signs of unusual bleeding to care manager and GP immediately. If Mary refuses the dose, document and contact supervisor.</p>',
				},
				{
					id: 'med2',
					name: 'Donepezil',
					doseAmount: '10',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Once daily',
					timing: 'At bedtime',
					therapeuticEffects:
						'<p>Cholinesterase inhibitor that increases acetylcholine levels in the brain. Used to slow cognitive decline in dementia, helping with memory, thinking and daily function. Benefits are modest but meaningful for quality of life.</p>',
					sideEffects:
						'<p>Nausea, diarrhoea, vivid dreams or nightmares (given at bedtime to reduce daytime drowsiness and GI effects). Insomnia in some patients. <strong>Rarely:</strong> bradycardia (slow heart rate) — report any fainting, sudden dizziness or collapse immediately.</p>',
					carerInstructions:
						'<p>Must be given at <strong>bedtime</strong> with a full glass of water. <strong>Swallow whole — do not crush or split.</strong> If Mary refuses or is unable to swallow, document in daily log and contact supervisor immediately. Consistent administration is essential — do not skip doses.</p>',
				},
				{
					id: 'med3',
					name: 'Calcium + Vitamin D3',
					doseAmount: '1',
					doseUnit: 'tablet',
					route: 'Oral',
					frequency: 'Once daily',
					timing: 'With breakfast',
					therapeuticEffects:
						"<p>Supplements calcium for bone density and vitamin D for calcium absorption. Reduces osteoporosis fracture risk — particularly important given Mary's significant osteoporosis and high falls risk.</p>",
					sideEffects:
						'<p>Constipation at higher doses. Rarely: hypercalcaemia symptoms — confusion (may be difficult to distinguish from dementia), fatigue, nausea, increased thirst. Report any sudden increase in confusion.</p>',
					carerInstructions:
						'<p>Give with breakfast. Can be administered alongside the morning routine. Encourage adequate fluid intake throughout the day. Document if Mary refuses. No special timing interactions with Warfarin (which is given in the evening).</p>',
				},
			],
			dnarStatus: true,
			mentalCapacity: false,
			gp: 'Dr. K. Williams – Oak Lane Practice, 0161 876 1000',
			tasks: [
				{
					id: 't1',
					label: 'Prompt and assist with washing and dressing',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't2',
					label: 'Administer Warfarin 3mg + Calcium/Vit D3',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't3',
					label: 'Prepare and serve breakfast – check food intake',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't4',
					label: 'Orientation prompts – day, date, familiar photos',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't5',
					label: 'Assist with lunch preparation and serve',
					visitType: 'Lunch',
					required: true,
				},
				{
					id: 't6',
					label: 'Supervised mobility walk (short, 10 mins)',
					visitType: 'Afternoon',
					required: false,
				},
				{
					id: 't7',
					label: 'Prepare evening meal, assist with eating if needed',
					visitType: 'Evening',
					required: true,
				},
				{
					id: 't8',
					label: 'Administer Donepezil 10mg',
					visitType: 'Evening',
					required: true,
				},
				{
					id: 't9',
					label: 'Assist with undressing and settling to bed',
					visitType: 'Evening',
					required: true,
				},
			],
			preferences: {
				diet: 'Soft foods preferred. No shellfish (personal dislike). Likes sweet tea.',
				allergies: 'No Ibuprofen or NSAIDs.',
				communication:
					'Use simple, short sentences. Repeat calmly if confused. Familiar music is soothing.',
				language: 'English',
				religion: 'Catholic. Rosary beads important comfort object.',
				lifestyle:
					'Former school teacher. Enjoys reminiscence activities, classical music, flower arranging.',
				carerGender: 'FEMALE',
				pets: 'Cat named "Whiskers" – familiar and soothing presence.',
				routine:
					'Settled routine essential. Confusion increases when routine is disrupted. Never hurry her.',
			},
			risks: [
				{
					id: 'r1',
					label: 'Falls Risk',
					level: 'HIGH',
					notes:
						'Osteoporosis – high fracture risk. Falls mat by bed. Bed rails in use. Hip protector pads worn during day.',
					reviewDate: '2026-03-15',
				},
				{
					id: 'r2',
					label: 'Pressure Sore Risk',
					level: 'MEDIUM',
					notes:
						'Reduced mobility. Pressure relieving cushion in use. Check skin at each visit.',
					reviewDate: '2026-03-15',
				},
				{
					id: 'r3',
					label: 'Nutrition & Hydration Risk',
					level: 'HIGH',
					notes:
						'Dementia affects appetite. Document food/fluid intake at every visit. MALNUTRITION TRACKER in use.',
					reviewDate: '2026-03-15',
				},
				{
					id: 'r4',
					label: 'Cognitive & Wandering Risk',
					level: 'HIGH',
					notes:
						'Door alarm fitted. Do not leave alone while confused or distressed. Safeguarding referral pathway in place.',
					reviewDate: '2026-03-15',
				},
				{
					id: 'r5',
					label: 'Medication Risk',
					level: 'HIGH',
					notes:
						'Warfarin – INR must be monitored. Contact GP if bruising or bleeding noted. NO IBUPROFEN.',
					reviewDate: '2026-03-01',
				},
			],
			goals: [
				{
					id: 'g1',
					description:
						'Maintain dignity and comfort while managing dementia progression',
					category: 'health',
					status: 'ACTIVE',
				},
				{
					id: 'g2',
					description:
						'Prevent falls and fractures through supervised mobility and protective equipment',
					category: 'safety',
					status: 'ACTIVE',
				},
				{
					id: 'g3',
					description:
						'Maintain social connection through reminiscence activities and family visits',
					category: 'social',
					status: 'ACTIVE',
				},
				{
					id: 'g4',
					description: 'Ensure adequate nutrition through supported mealtimes',
					category: 'health',
					status: 'ACTIVE',
				},
			],
			consentGiven: true,
			lpaName: 'Brian Higgins',
			notes:
				'LPA held by Brian Higgins (son) – contact for all care decisions. Mary responds best to a calm, gentle approach. Familiar carers preferred.',
		},
	},
	{
		id: 'p3',
		name: 'John Dow',
		dob: '1950-11-08',
		nhsNumber: '390 221 6677',
		address: '5 Pine Road, Salford, M5 6EF',
		phone: '0161 543 2109',
		emergencyContact: 'Linda Dow (Wife)',
		emergencyPhone: '07700 900333',
		status: 'ACTIVE',
		plan: {
			id: 'cp3',
			version: 1,
			status: 'REVIEW',
			createdAt: '2025-01-20',
			reviewDate: '2026-04-01',
			lastReviewedBy: 'Elena Rodriguez',
			conditions: [
				{
					id: 'c1',
					name: 'Multiple Sclerosis (Secondary Progressive)',
					diagnosedYear: 1998,
					description:
						'<p>Multiple Sclerosis (MS) is an autoimmune disease in which the immune system attacks the myelin sheath protecting nerve fibres in the brain and spinal cord. Secondary Progressive MS follows a period of relapsing-remitting disease and is characterised by steadily worsening neurological function with fewer distinct relapses.</p>',
					patientImpact:
						'<p>John has lived with MS for over 25 years. He uses a powered wheelchair and requires full assistance with transfers using an electric hoist. Spasticity, fatigue, and dysarthria (slurred speech) are prominent. His cognitive function remains largely intact — he is highly intelligent and should be involved in all care decisions.</p>',
					carerNotes:
						'<ul><li><strong>Two-carer minimum</strong> for all transfers — hoist is mandatory, no manual transfers</li><li>Allow extra time for all tasks — rushing increases spasticity and distress</li><li>Be patient with speech — dysarthria is present but John communicates clearly given time</li><li>Pressure area checks at every visit — document skin condition</li></ul>',
				},
				{
					id: 'c2',
					name: 'Neurogenic Bladder',
					diagnosedYear: 2005,
					description:
						'<p>Neurogenic bladder is a dysfunction of the urinary bladder caused by neurological damage — in this case, MS lesions disrupting the nerve signals that control bladder function. It can lead to urinary retention requiring intermittent catheterisation.</p>',
					patientImpact:
						'<p>John requires intermittent self-catheterisation (ISC), which is performed by trained carers when he is unable to self-catheterise. Strict aseptic technique is mandatory to prevent urinary tract infection (UTI).</p>',
					carerNotes:
						'<p><strong>Only carers with documented catheterisation training may perform this procedure.</strong> Strict aseptic technique required at all times. Log catheterisation times and volumes. Report any signs of UTI immediately: cloudy or offensive urine, fever, pain, increased confusion or agitation.</p>',
				},
				{
					id: 'c3',
					name: 'Depression',
					diagnosedYear: 2010,
					description:
						'<p>Depression is a common comorbidity in MS, affecting up to 50% of patients over their lifetime. It may be caused by the neurological effects of MS itself as well as the psychosocial burden of living with a progressive disability.</p>',
					patientImpact:
						'<p>John is on Sertraline and is stable. He is highly self-aware about his mental health. He may not always verbalise low mood — carers should observe for withdrawal, reduced engagement or changes in appetite.</p>',
					carerNotes:
						"<p>Be attentive to John's mood and engagement. Note any withdrawal or changes in behaviour in the daily log. Do not rush visits — quality interaction matters significantly to his wellbeing. Ensure he has access to his radio, chess app and F1 content during visits.</p>",
				},
			],
			allergies: [],
			medications: [
				{
					id: 'med1',
					name: 'Baclofen',
					doseAmount: '10',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Three times daily',
					timing: 'Morning, midday, evening',
					therapeuticEffects:
						'<p>Muscle relaxant that reduces spasticity in MS by inhibiting overactive nerve signals in the spinal cord. Helps manage painful muscle spasms, reduces stiffness and improves ease of movement — particularly important for hoist transfers and personal care.</p>',
					sideEffects:
						'<p>Drowsiness and sedation — especially at higher doses or during dose changes. Muscle weakness can temporarily impair transfer safety. Dizziness. <strong>Critical:</strong> Never stop suddenly — abrupt withdrawal can cause seizures, fever and hallucinations. Contact GP immediately if doses are missed or patient is unable to take medication.</p>',
					carerInstructions:
						'<p>Administer strictly at scheduled times — consistent timing is important for spasticity management. <strong>Do not miss doses without GP instruction.</strong> Monitor for increased drowsiness during transfers and document. Note any worsening of spasms between doses — may indicate a need for dose review.</p>',
				},
				{
					id: 'med2',
					name: 'Sertraline',
					doseAmount: '50',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Once daily',
					timing: 'Morning with food',
					therapeuticEffects:
						'<p>SSRI antidepressant that increases serotonin availability in the brain. Treats depression associated with MS, helping to stabilise mood, reduce anxiety and improve quality of life.</p>',
					sideEffects:
						'<p>Nausea (particularly when first starting), dry mouth, insomnia, sexual dysfunction. <strong>Rarely:</strong> serotonin syndrome if combined with other serotonergic drugs — report agitation, confusion, rapid heart rate or tremor. Report any significant mood changes, especially increased agitation or suicidal ideation.</p>',
					carerInstructions:
						"<p>Give with morning meal to reduce GI side effects. <strong>Never stop abruptly</strong> — always under GP supervision (discontinuation syndrome). Observe John's mood at each visit. Document any low mood, withdrawal from conversation, or change in affect in the daily notes.</p>",
				},
				{
					id: 'med3',
					name: 'Vitamin D',
					doseAmount: '1000',
					doseUnit: 'IU',
					route: 'Oral',
					frequency: 'Once daily',
					timing: 'With food',
					therapeuticEffects:
						'<p>Vitamin D supplementation supports bone health (important given reduced mobility and weight-bearing) and immune function. Evidence suggests a potential modest benefit in slowing MS disease activity. MS patients commonly have low vitamin D levels.</p>',
					sideEffects:
						'<p>Generally very well tolerated at 1000 IU. Hypervitaminosis D is extremely rare at this dose. No significant interactions with Baclofen or Sertraline.</p>',
					carerInstructions:
						'<p>Give with any main meal. Can be combined with other morning medications. No special precautions required at this maintenance dose.</p>',
				},
			],
			dnarStatus: false,
			mentalCapacity: true,
			gp: 'Dr. M. Obi – Salford Central Practice, 0161 543 1000',
			tasks: [
				{
					id: 't1',
					label: 'Hoist transfer from bed to wheelchair',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't2',
					label: 'Full personal care – wash, dress, oral hygiene',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't3',
					label: 'Administer Baclofen 10mg + Sertraline 50mg + Vit D',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't4',
					label: 'Prepare breakfast, assist if needed',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't5',
					label: 'Intermittent catheterisation (trained carer only)',
					visitType: 'Morning',
					required: true,
					notes:
						'Only carers with catheterisation training may perform this task',
				},
				{
					id: 't6',
					label: 'Administer Baclofen 10mg (midday dose)',
					visitType: 'Afternoon',
					required: true,
				},
				{
					id: 't7',
					label: 'Hoist transfer to bed, full undress, pressure area check',
					visitType: 'Evening',
					required: true,
				},
				{
					id: 't8',
					label: 'Administer Baclofen 10mg (evening dose)',
					visitType: 'Evening',
					required: true,
				},
			],
			preferences: {
				diet: 'No restrictions. Enjoys Indian food. Wife cooks most meals.',
				allergies: 'None known.',
				communication:
					'Speech can be slow and slurred – be patient. Give time to respond. Dysarthria present.',
				language: 'English',
				religion: 'Sikh (non-practising).',
				lifestyle:
					'Former engineer. Very technically minded. Enjoys radio, chess, and following Formula 1.',
				carerGender: 'MALE',
				pets: 'No pets.',
				routine:
					'Morning routine critical – must be completed before wife leaves for work at 08:30.',
			},
			risks: [
				{
					id: 'r1',
					label: 'Falls Risk',
					level: 'HIGH',
					notes:
						'Non-weight bearing. Hoist mandatory for ALL transfers. Two-carer hoisting required.',
					reviewDate: '2026-04-01',
				},
				{
					id: 'r2',
					label: 'Pressure Sore Risk',
					level: 'HIGH',
					notes:
						'Wheelchair user, limited sensation. Pressure map in use. Repositioning every 2 hours. Check skin at every visit.',
					reviewDate: '2026-04-01',
				},
				{
					id: 'r3',
					label: 'Catheter & Infection Risk',
					level: 'HIGH',
					notes:
						'Strict aseptic technique required. Report any signs of UTI immediately. Log catheterisation times.',
					reviewDate: '2026-04-01',
				},
				{
					id: 'r4',
					label: 'Moving & Handling',
					level: 'HIGH',
					notes:
						'Electric hoist in situ. Two-carer minimum for all transfers. Moving & handling risk assessment filed separately.',
					reviewDate: '2026-04-01',
				},
			],
			goals: [
				{
					id: 'g1',
					description:
						'Maintain independence in communication and decision-making',
					category: 'independence',
					status: 'ACTIVE',
				},
				{
					id: 'g2',
					description:
						'Prevent pressure sores through regular repositioning and skin checks',
					category: 'safety',
					status: 'ACTIVE',
				},
				{
					id: 'g3',
					description:
						'Support mental health through consistent care and social engagement',
					category: 'health',
					targetDate: '2026-06-01',
					status: 'ACTIVE',
				},
			],
			consentGiven: true,
			notes:
				'John is highly intelligent and well-informed about his condition. He values control and should be involved in all care decisions. Two-carer visits required for morning and evening routines.',
		},
	},
	{
		id: 'p4',
		name: 'Mrs. Edith Kemp',
		dob: '1934-07-30',
		nhsNumber: '201 883 5544',
		address: '3 Birch Lane, Manchester, M7 8GH',
		phone: '0161 789 0123',
		emergencyContact: 'Carol Webb (Niece)',
		emergencyPhone: '07700 900444',
		status: 'HOSPITAL',
		plan: {
			id: 'cp4',
			version: 2,
			status: 'REVIEW',
			createdAt: '2023-05-01',
			reviewDate: '2026-03-20',
			lastReviewedBy: 'Thomas Wade',
			conditions: [
				{
					id: 'c1',
					name: 'Congestive Heart Failure',
					diagnosedYear: 2016,
					description:
						'<p>Congestive Heart Failure (CHF) is a chronic condition in which the heart muscle is weakened and cannot pump blood efficiently. Fluid can back up into the lungs (causing breathlessness) and body (causing oedema). It is managed but not cured — deterioration can be sudden and life-threatening.</p>',
					patientImpact:
						"<p>Edith's heart failure requires daily weight monitoring and diuretic therapy. Sudden weight gain indicates dangerous fluid retention. She is DNAR — her wishes and those of her LPA (Carol Webb) must be respected. She is currently hospitalised with this care plan under review.</p>",
					carerNotes:
						'<p><strong>Daily weight is mandatory</strong> — report any gain over 2kg in 48 hours to GP immediately (sign of fluid retention). Check ankles for oedema at every visit. <strong>Breathlessness at rest = emergency</strong> — call 999 and contact GP. Note any cough, increased fatigue or reduced urine output.</p>',
				},
				{
					id: 'c2',
					name: "Parkinson's Disease",
					diagnosedYear: 2019,
					description:
						"<p>Parkinson's disease is a progressive neurological condition caused by the loss of dopamine-producing cells in the brain. It primarily affects movement, causing tremor, rigidity and bradykinesia (slowness of movement). In advanced stages it can affect speech, swallowing and cognition.</p>",
					patientImpact:
						'<p>Edith has prominent tremor and bradykinesia. She is at very high falls risk, particularly combined with her poor vision. She has dysphagia (swallowing difficulties) — thickened fluids and soft foods are required. Levodopa timing is critical for motor function.</p>',
					carerNotes:
						'<ul><li><strong>Walking frame mandatory at all times</strong> — never leave Edith unsupported</li><li>Thickened fluids only — standard fluids cause aspiration risk</li><li>Keep Edith upright for 30 minutes after meals</li><li>Announce yourself on entry — vision is very poor</li><li>Levodopa must be given <strong>exactly on schedule</strong> — do not delay</li></ul>',
				},
				{
					id: 'c3',
					name: 'Cataracts (bilateral)',
					diagnosedYear: 2021,
					description:
						"<p>Cataracts are clouding of the eye's natural lens, causing progressive vision loss. Bilateral cataracts mean both eyes are affected. Surgery may be indicated but may be deferred given Edith's complex medical needs.</p>",
					patientImpact:
						"<p>Edith's vision is significantly reduced. She cannot safely navigate independently. Familiar environments and consistent placement of objects are essential. Carers should always announce themselves to avoid startling her.</p>",
					carerNotes:
						'<p>Always announce your name and role when entering the room. Keep all items (glasses, medication, personal items) in consistent places. Ensure adequate lighting. Guide Edith by arm — do not push. Report any further deterioration in vision to GP.</p>',
				},
			],
			allergies: ['Codeine (nausea and confusion)'],
			medications: [
				{
					id: 'med1',
					name: 'Furosemide',
					doseAmount: '40',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Once daily',
					timing: 'Morning — no later than 10am',
					therapeuticEffects:
						'<p>Loop diuretic that removes excess fluid by significantly increasing urine production. Reduces fluid overload and pulmonary oedema in congestive heart failure, relieving breathlessness and ankle swelling.</p>',
					sideEffects:
						'<p>Frequent urination (especially in first 2–3 hours — late administration disrupts sleep). Electrolyte imbalance (low potassium — watch for muscle cramps, weakness, irregular heartbeat). Dehydration with inadequate fluid intake. Dizziness on standing (postural hypotension).</p>',
					carerInstructions:
						'<p><strong>Give in the morning, no later than 10am</strong> to avoid nocturnal urination. Ensure Edith has prompt access to the commode after dosing. <strong>Daily weight mandatory</strong> — report gain &gt;2kg in 48 hours to GP. Support Edith when standing to prevent falls. Ensure adequate fluid intake despite diuretic effect.</p>',
				},
				{
					id: 'med2',
					name: 'Levodopa/Carbidopa',
					doseAmount: '100/25',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Three times daily',
					timing: '30 minutes before meals — strictly timed',
					therapeuticEffects:
						"<p>The most effective treatment for Parkinson's motor symptoms. Levodopa is converted to dopamine in the brain, restoring motor function and reducing tremor, rigidity and bradykinesia. Carbidopa prevents peripheral breakdown of levodopa, allowing more to reach the brain and reducing side effects.</p>",
					sideEffects:
						'<p>Nausea (especially initially — take without food). Dyskinesia (involuntary movements) with long-term use. "Off" periods as each dose wears off — watch for increased stiffness, tremor or freezing. Orthostatic hypotension — support when Edith stands.</p>',
					carerInstructions:
						'<p><strong>Timing is critical — give 30 minutes before every meal.</strong> Protein in food competes with absorption — do not give with or after meals. <strong>Adhere strictly to the dose schedule.</strong> Even small delays can cause significant motor deterioration and increased falls risk. Document any "off" periods or worsening tremor. <strong>CODEINE ALLERGY — NO OPIOIDS WHATSOEVER.</strong></p>',
				},
				{
					id: 'med3',
					name: 'Bisoprolol',
					doseAmount: '2.5',
					doseUnit: 'mg',
					route: 'Oral',
					frequency: 'Once daily',
					timing: 'Morning with food',
					therapeuticEffects:
						'<p>Beta-blocker that reduces heart rate and blood pressure, lowering cardiac workload in congestive heart failure. Helps prevent arrhythmias and improves long-term cardiac outcomes.</p>',
					sideEffects:
						'<p>Fatigue and tiredness (common — do not over-exert patient). Cold extremities. <strong>Bradycardia</strong> (slow heart rate) — report pulse below 50 bpm. Rarely: worsening breathlessness. <strong>Never stop suddenly</strong> — abrupt withdrawal can precipitate serious cardiac events.</p>',
					carerInstructions:
						'<p>Give with morning meal. If Edith appears unusually breathless, fatigued or unwell, document and contact GP. <strong>Never skip doses without medical instruction.</strong> Monitor for signs of cardiac deterioration: breathlessness at rest, new or worsening ankle oedema, sudden weight gain, or pallor.</p>',
				},
			],
			dnarStatus: true,
			mentalCapacity: true,
			gp: 'Dr. S. Hassan – Birch Lane Surgery, 0161 789 1000',
			tasks: [
				{
					id: 't1',
					label: 'Weigh patient (daily, document)',
					visitType: 'Morning',
					required: true,
					notes: 'Report gain >2kg in 48h to GP – sign of fluid retention',
				},
				{
					id: 't2',
					label: 'Assist with wash, dress and oral hygiene',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't3',
					label: 'Administer Furosemide 40mg + Bisoprolol 2.5mg',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't4',
					label: 'Administer Levodopa/Carbidopa (first dose)',
					visitType: 'Morning',
					required: true,
					notes: 'Administer 30 min BEFORE meals to optimise absorption',
				},
				{
					id: 't5',
					label: 'Prepare breakfast – soft foods, small portions',
					visitType: 'Morning',
					required: true,
				},
				{
					id: 't6',
					label: 'Check ankles for oedema and document',
					visitType: 'Morning',
					required: true,
				},
			],
			preferences: {
				diet: "Soft foods due to Parkinson's swallowing difficulties. Small, frequent portions. Thickened fluids.",
				allergies: 'No Codeine or opioids.',
				communication:
					'Speaks quietly. Vision very poor – announce yourself on entry. Place items consistently.',
				language: 'English',
				religion: 'Anglican.',
				lifestyle:
					'Former seamstress. Enjoys radio drama and audiobooks. Particularly fond of Radio 4.',
				carerGender: 'FEMALE',
				pets: 'No pets.',
				routine:
					'Timing of Levodopa is critical – must be administered consistently. Do not delay.',
			},
			risks: [
				{
					id: 'r1',
					label: 'Falls Risk',
					level: 'HIGH',
					notes:
						"Parkinson's gait + poor vision = very high falls risk. Walking frame mandatory. Do not leave unsupported.",
					reviewDate: '2026-03-20',
				},
				{
					id: 'r2',
					label: 'Aspiration Risk',
					level: 'HIGH',
					notes:
						"Parkinson's dysphagia. Thickened fluids. Upright for 30 min after meals. Report coughing/choking immediately.",
					reviewDate: '2026-03-20',
				},
				{
					id: 'r3',
					label: 'Cardiac Deterioration',
					level: 'HIGH',
					notes:
						'Daily weight mandatory. Ankle oedema check. Breathlessness at rest = emergency. Call 999 + contact GP.',
					reviewDate: '2026-03-20',
				},
				{
					id: 'r4',
					label: 'Medication Risk',
					level: 'HIGH',
					notes:
						'Levodopa timing critical for motor function. Codeine allergy – NO opioids.',
					reviewDate: '2026-03-01',
				},
			],
			goals: [
				{
					id: 'g1',
					description:
						'Prevent hospital readmission through daily monitoring of cardiac symptoms',
					category: 'health',
					status: 'ACTIVE',
				},
				{
					id: 'g2',
					description:
						'Maintain safe mobility with walking frame and carer supervision',
					category: 'safety',
					status: 'ACTIVE',
				},
				{
					id: 'g3',
					description:
						'Maintain quality of life through enjoyment of audiobooks and radio',
					category: 'social',
					status: 'ACTIVE',
				},
			],
			consentGiven: true,
			lpaName: 'Carol Webb',
			notes:
				'Currently hospitalised – plan under review. Contact Carol Webb (niece) regarding discharge planning. DNAR in place, copy held at surgery.',
		},
	},
	{
		id: 'p5',
		name: 'James Porter',
		dob: '1955-09-12',
		nhsNumber: '774 665 2211',
		address: '17 Maple Drive, Manchester, M9 3JK',
		phone: '0161 654 3210',
		emergencyContact: 'Self – lives alone',
		emergencyPhone: '07700 900555',
		status: 'ACTIVE',
		plan: undefined,
	},
];

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
═══════════════════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<PlanStatus, { label: string; cls: string }> = {
	DRAFT: {
		label: 'Draft',
		cls: 'bg-slate-100 text-slate-600 border-slate-200',
	},
	ACTIVE: {
		label: 'Active',
		cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	},
	REVIEW: {
		label: 'Due for Review',
		cls: 'bg-amber-50 text-amber-700 border-amber-200',
	},
	ARCHIVED: {
		label: 'Archived',
		cls: 'bg-slate-100 text-slate-400 border-slate-200',
	},
};

const PATIENT_STATUS: Record<string, { label: string; dot: string }> = {
	ACTIVE: { label: 'Active', dot: 'bg-emerald-500' },
	INACTIVE: { label: 'Inactive', dot: 'bg-slate-400' },
	HOSPITAL: { label: 'Hospital', dot: 'bg-amber-500' },
};

const RISK_CONFIG: Record<
	RiskLevel,
	{ label: string; cls: string; bar: string }
> = {
	LOW: {
		label: 'Low',
		cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		bar: 'bg-emerald-500',
	},
	MEDIUM: {
		label: 'Medium',
		cls: 'bg-amber-50 text-amber-700 border-amber-200',
		bar: 'bg-amber-500',
	},
	HIGH: {
		label: 'High',
		cls: 'bg-red-50 text-red-700 border-red-200',
		bar: 'bg-red-500',
	},
};

const GOAL_CATEGORIES: Record<string, { label: string; color: string }> = {
	independence: { label: 'Independence', color: '#6366f1' },
	health: { label: 'Health', color: '#10b981' },
	social: { label: 'Social', color: '#0ea5e9' },
	safety: { label: 'Safety', color: '#f59e0b' },
};

const TABS = [
	{ id: 'overview', label: 'Overview', icon: FileText },
	{ id: 'medical', label: 'Medical', icon: Heart },
	{ id: 'tasks', label: 'Care Tasks', icon: Check },
	{ id: 'preferences', label: 'Preferences', icon: User },
	{ id: 'risks', label: 'Risk Assessment', icon: Shield },
	{ id: 'goals', label: 'Goals', icon: Target },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* ═══════════════════════════════════════════════════════════════════════════
   Utilities
═══════════════════════════════════════════════════════════════════════════ */

function fmtDOB(dob: string): string {
	return new Date(dob).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

function calcAge(dob: string): number {
	const today = new Date('2026-03-12');
	const birth = new Date(dob);
	let age = today.getFullYear() - birth.getFullYear();
	if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()))
		age--;
	return age;
}

function genId(): string {
	return `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RichTextEditor
═══════════════════════════════════════════════════════════════════════════ */

function ToolBtn({
	title,
	onExec,
	children,
}: {
	title: string;
	onExec: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type='button'
			title={title}
			onMouseDown={(e) => {
				e.preventDefault();
				onExec();
			}}
			className='flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors'>
			{children}
		</button>
	);
}

function RichTextEditor({
	value,
	onChange,
	placeholder,
	minH = 'min-h-[96px]',
}: {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	minH?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		if (ref.current && ref.current.innerHTML !== (value ?? '')) {
			ref.current.innerHTML = value ?? '';
		}
	}, [value]);

	function exec(cmd: string) {
		document.execCommand(cmd, false);
		ref.current?.focus();
		if (ref.current) onChange(ref.current.innerHTML);
	}

	const isEmpty = !value || value === '<br>' || value === '';

	return (
		<div
			className={cn(
				'overflow-hidden rounded-lg border bg-white transition-colors',
				focused ? 'border-[#0284c7] ring-2 ring-[#0284c7]/20' : 'border-border',
			)}>
			{/* Toolbar */}
			<div className='flex items-center gap-0.5 border-b border-border bg-slate-50 px-2 py-1'>
				<ToolBtn title='Bold' onExec={() => exec('bold')}>
					<strong className='text-[11px] font-bold'>B</strong>
				</ToolBtn>
				<ToolBtn title='Italic' onExec={() => exec('italic')}>
					<em className='text-[11px]'>I</em>
				</ToolBtn>
				<ToolBtn title='Underline' onExec={() => exec('underline')}>
					<span className='text-[11px] underline'>U</span>
				</ToolBtn>
				<span className='mx-1 h-4 w-px bg-border' />
				<ToolBtn title='Bullet list' onExec={() => exec('insertUnorderedList')}>
					<List className='h-3.5 w-3.5' />
				</ToolBtn>
				<ToolBtn title='Numbered list' onExec={() => exec('insertOrderedList')}>
					<ListOrdered className='h-3.5 w-3.5' />
				</ToolBtn>
			</div>
			{/* Editor */}
			<div className='relative'>
				{isEmpty && !focused && (
					<p className='pointer-events-none absolute inset-0 select-none px-3 py-2.5 text-sm text-slate-400'>
						{placeholder}
					</p>
				)}
				<div
					ref={ref}
					contentEditable
					suppressContentEditableWarning
					onFocus={() => setFocused(true)}
					onBlur={() => {
						setFocused(false);
						if (ref.current) onChange(ref.current.innerHTML);
					}}
					onInput={() => {
						if (ref.current) onChange(ref.current.innerHTML);
					}}
					className={cn(
						minH,
						'px-3 py-2.5 text-sm text-slate-700 outline-none',
						'[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-0.5',
						'[&_strong]:font-semibold [&_p]:mb-1 last:[&_p]:mb-0',
					)}
				/>
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section components
═══════════════════════════════════════════════════════════════════════════ */

function SectionCard({
	title,
	children,
	action,
}: {
	title: string;
	children: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className='rounded-xl border border-border bg-white'>
			<div className='flex items-center justify-between border-b border-border px-5 py-3.5'>
				<h3 className='text-sm font-semibold text-slate-700'>{title}</h3>
				{action}
			</div>
			<div className='p-5'>{children}</div>
		</div>
	);
}

function OverviewTab({ plan, patient }: { plan: CarePlan; patient: Patient }) {
	const highRisks = plan.risks.filter((r) => r.level === 'HIGH');
	const pendingGoals = plan.goals.filter((g) => g.status === 'ACTIVE');
	return (
		<div className='flex flex-col gap-4'>
			{/* Key alerts */}
			{(plan.dnarStatus ||
				!plan.mentalCapacity ||
				plan.allergies.length > 0 ||
				highRisks.length > 0) && (
				<div className='rounded-xl border border-red-200 bg-red-50 p-4'>
					<p className='mb-2 text-xs font-bold uppercase tracking-wide text-red-600'>
						Key Alerts
					</p>
					<div className='flex flex-wrap gap-2'>
						{plan.dnarStatus && (
							<span className='rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700'>
								⚠ DNAR in place
							</span>
						)}
						{!plan.mentalCapacity && (
							<span className='rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700'>
								⚠ Lacks mental capacity – LPA: {plan.lpaName}
							</span>
						)}
						{plan.allergies.map((a) => (
							<span
								key={a}
								className='rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700'>
								⚠ Allergy: {a}
							</span>
						))}
						{highRisks.map((r) => (
							<span
								key={r.id}
								className='rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'>
								⚠ HIGH: {r.label}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Plan meta */}
			<SectionCard title='Plan Information'>
				<div className='grid grid-cols-2 gap-x-8 gap-y-3 text-sm'>
					{[
						[
							'Plan Status',
							<span
								key='s'
								className={cn(
									'rounded-full border px-2.5 py-0.5 text-xs font-medium',
									STATUS_CONFIG[plan.status].cls,
								)}>
								{STATUS_CONFIG[plan.status].label}
							</span>,
						],
						['Version', `v${plan.version}`],
						['Created', new Date(plan.createdAt).toLocaleDateString('en-GB')],
						[
							'Review Due',
							new Date(plan.reviewDate).toLocaleDateString('en-GB'),
						],
						['Last Reviewed By', plan.lastReviewedBy],
						['Consent Given', plan.consentGiven ? 'Yes' : 'No'],
						[
							'Mental Capacity',
							plan.mentalCapacity ? 'Has capacity' : 'Lacks capacity',
						],
						['LPA Holder', plan.lpaName ?? '—'],
					].map(([label, value]) => (
						<div key={String(label)}>
							<p className='text-[10px] uppercase tracking-wide text-slate-400'>
								{label}
							</p>
							<div className='mt-0.5 font-medium text-slate-800'>{value}</div>
						</div>
					))}
				</div>
			</SectionCard>

			{/* Patient details */}
			<SectionCard title='Patient Details'>
				<div className='grid grid-cols-2 gap-x-8 gap-y-3 text-sm'>
					{[
						[
							'Date of Birth',
							`${fmtDOB(patient.dob)} (aged ${calcAge(patient.dob)})`,
						],
						['NHS Number', patient.nhsNumber],
						['Address', patient.address],
						['Phone', patient.phone],
						['Emergency Contact', patient.emergencyContact],
						['Emergency Phone', patient.emergencyPhone],
						['GP', plan.gp],
					].map(([label, value]) => (
						<div
							key={label}
							className={
								label === 'Address' || label === 'GP' ? 'col-span-2' : ''
							}>
							<p className='text-[10px] uppercase tracking-wide text-slate-400'>
								{label}
							</p>
							<p className='mt-0.5 font-medium text-slate-800'>{value}</p>
						</div>
					))}
				</div>
			</SectionCard>

			{/* Summary stats */}
			<div className='grid grid-cols-4 gap-3'>
				{[
					{
						label: 'Conditions',
						value: plan.conditions.length,
						color: 'text-slate-700',
					},
					{
						label: 'Care Tasks',
						value: plan.tasks.length,
						color: 'text-[#0284c7]',
					},
					{
						label: 'Active Goals',
						value: pendingGoals.length,
						color: 'text-emerald-600',
					},
					{
						label: 'High Risks',
						value: highRisks.length,
						color: 'text-red-600',
					},
				].map(({ label, value, color }) => (
					<div
						key={label}
						className='rounded-xl border border-border bg-white p-4 text-center'>
						<p className={cn('text-2xl font-bold', color)}>{value}</p>
						<p className='mt-0.5 text-xs text-slate-500'>{label}</p>
					</div>
				))}
			</div>

			{plan.notes && (
				<SectionCard title='Care Manager Notes'>
					<p className='text-sm leading-relaxed text-slate-600'>{plan.notes}</p>
				</SectionCard>
			)}
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Medical tab sub-components
═══════════════════════════════════════════════════════════════════════════ */

function ConditionCard({
	condition,
	onChange,
	onDelete,
}: {
	condition: Condition;
	onChange: (c: Condition) => void;
	onDelete: () => void;
}) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className='overflow-hidden rounded-xl border border-border bg-white'>
			<button
				type='button'
				onClick={() => setExpanded((e) => !e)}
				className='flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80'>
				<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600'>
					<Stethoscope className='h-4 w-4' />
				</div>
				<div className='min-w-0 flex-1'>
					<p className='text-sm font-semibold text-slate-800'>
						{condition.name}
					</p>
					{condition.diagnosedYear && (
						<p className='text-[10px] text-slate-400'>
							Diagnosed {condition.diagnosedYear}
						</p>
					)}
				</div>
				<div className='flex shrink-0 items-center gap-1'>
					<Link
						href=''
						type='button'
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						className='rounded p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500'>
						<Trash2 className='h-3.5 w-3.5' />
					</Link>
					<ChevronRight
						className={cn(
							'h-4 w-4 text-slate-400 transition-transform duration-200',
							expanded && 'rotate-90',
						)}
					/>
				</div>
			</button>

			{expanded && (
				<div className='flex flex-col gap-5 border-t border-border bg-slate-50/40 px-4 pb-5 pt-4'>
					<div>
						<p className='mb-0.5 text-xs font-semibold text-slate-700'>
							About this condition
						</p>
						<p className='mb-2 text-[11px] text-slate-400'>
							Clinical definition, progression and background
						</p>
						<RichTextEditor
							value={condition.description ?? ''}
							onChange={(v) => onChange({ ...condition, description: v })}
							placeholder='Describe the condition — what it is, how it develops, clinical context…'
						/>
					</div>
					<div>
						<p className='mb-0.5 text-xs font-semibold text-slate-700'>
							How it affects this patient
						</p>
						<p className='mb-2 text-[11px] text-slate-400'>
							Current severity, observable symptoms and specific impact for this
							individual
						</p>
						<RichTextEditor
							value={condition.patientImpact ?? ''}
							onChange={(v) => onChange({ ...condition, patientImpact: v })}
							placeholder='Describe how this condition presents specifically for this patient…'
						/>
					</div>
					<div>
						<p className='mb-0.5 text-xs font-semibold text-slate-700'>
							Carer instructions & observations
						</p>
						<p className='mb-2 text-[11px] text-slate-400'>
							What carers must do, watch for, or report in relation to this
							condition
						</p>
						<RichTextEditor
							value={condition.carerNotes ?? ''}
							onChange={(v) => onChange({ ...condition, carerNotes: v })}
							placeholder='Document carer actions, monitoring requirements, and when to escalate…'
						/>
					</div>
				</div>
			)}
		</div>
	);
}

function MedicationCard({
	medication,
	onChange,
	onDelete,
}: {
	medication: Medication;
	onChange: (m: Medication) => void;
	onDelete: () => void;
}) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className='overflow-hidden rounded-xl border border-border bg-white'>
			<button
				type='button'
				onClick={() => setExpanded((e) => !e)}
				className='flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80'>
				<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600'>
					<Pill className='h-4 w-4' />
				</div>
				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap items-center gap-1.5'>
						<p className='text-sm font-semibold text-slate-800'>
							{medication.name}
						</p>
						<span className='rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700'>
							{medication.doseAmount} {medication.doseUnit}
						</span>
						<span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500'>
							{medication.route}
						</span>
					</div>
					<p className='mt-0.5 text-[11px] text-slate-400'>
						{medication.frequency}
						{medication.timing ? ` · ${medication.timing}` : ''}
					</p>
				</div>
				<div className='flex shrink-0 items-center gap-1'>
					<button
						type='button'
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						className='rounded p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500'>
						<Trash2 className='h-3.5 w-3.5' />
					</button>
					<ChevronRight
						className={cn(
							'h-4 w-4 text-slate-400 transition-transform duration-200',
							expanded && 'rotate-90',
						)}
					/>
				</div>
			</button>

			{expanded && (
				<div className='flex flex-col gap-5 border-t border-border bg-slate-50/40 px-4 pb-5 pt-4'>
					{/* Editable fields */}
					<div className='grid grid-cols-3 gap-2'>
						<div>
							<label className='mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
								Dose
							</label>
							<input
								type='text'
								value={medication.doseAmount}
								onChange={(e) =>
									onChange({ ...medication, doseAmount: e.target.value })
								}
								className='w-full rounded-lg border border-border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
							/>
						</div>
						<div>
							<label className='mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
								Unit
							</label>
							<input
								type='text'
								value={medication.doseUnit}
								onChange={(e) =>
									onChange({ ...medication, doseUnit: e.target.value })
								}
								className='w-full rounded-lg border border-border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
							/>
						</div>
						<div>
							<label className='mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
								Route
							</label>
							<select
								value={medication.route}
								onChange={(e) =>
									onChange({ ...medication, route: e.target.value })
								}
								className='w-full rounded-lg border border-border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'>
								{[
									'Oral',
									'Sublingual',
									'Topical',
									'Injection',
									'Inhaled',
									'Patch',
									'IV',
									'Rectal',
								].map((r) => (
									<option key={r}>{r}</option>
								))}
							</select>
						</div>
						<div className='col-span-1'>
							<label className='mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
								Frequency
							</label>
							<input
								type='text'
								value={medication.frequency}
								onChange={(e) =>
									onChange({ ...medication, frequency: e.target.value })
								}
								className='w-full rounded-lg border border-border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
							/>
						</div>
						<div className='col-span-2'>
							<label className='mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
								Timing
							</label>
							<input
								type='text'
								value={medication.timing ?? ''}
								onChange={(e) =>
									onChange({
										...medication,
										timing: e.target.value || undefined,
									})
								}
								placeholder='e.g. With food, 30 min before meals…'
								className='w-full rounded-lg border border-border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
							/>
						</div>
					</div>

					{/* Therapeutic effects */}
					<div>
						<p className='mb-0.5 text-xs font-semibold text-slate-700'>
							Therapeutic effects
						</p>
						<p className='mb-2 text-[11px] text-slate-400'>
							What this medication does and why it is prescribed for this
							patient
						</p>
						<RichTextEditor
							value={medication.therapeuticEffects ?? ''}
							onChange={(v) =>
								onChange({ ...medication, therapeuticEffects: v })
							}
							placeholder='Describe what this medication does and its intended benefit for this patient…'
						/>
					</div>

					{/* Side effects */}
					<div>
						<p className='mb-0.5 text-xs font-semibold text-slate-700'>
							Side effects to watch for
						</p>
						<p className='mb-2 text-[11px] text-slate-400'>
							Adverse reactions to monitor and when to escalate to GP or
							supervisor
						</p>
						<RichTextEditor
							value={medication.sideEffects ?? ''}
							onChange={(v) => onChange({ ...medication, sideEffects: v })}
							placeholder='List side effects carers should watch for and when to contact the GP or supervisor…'
						/>
					</div>

					{/* Carer instructions */}
					<div>
						<p className='mb-0.5 text-xs font-semibold text-slate-700'>
							Carer administration instructions
						</p>
						<p className='mb-2 text-[11px] text-slate-400'>
							How to administer, timing, contraindications and what to do if
							patient refuses
						</p>
						<RichTextEditor
							value={medication.carerInstructions ?? ''}
							onChange={(v) =>
								onChange({ ...medication, carerInstructions: v })
							}
							placeholder='Document how and when to administer, any special precautions, and what to do if patient refuses…'
						/>
					</div>
				</div>
			)}
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MedicalTab
═══════════════════════════════════════════════════════════════════════════ */

function MedicalTab({
	plan,
	onChange,
}: {
	plan: CarePlan;
	onChange: (p: Partial<CarePlan>) => void;
}) {
	const [newAllergy, setNewAllergy] = useState('');
	const [newConditionName, setNewConditionName] = useState('');
	const [newConditionYear, setNewConditionYear] = useState('');
	const [showAddMed, setShowAddMed] = useState(false);
	const [newMed, setNewMed] = useState({
		name: '',
		doseAmount: '',
		doseUnit: 'mg',
		route: 'Oral',
		frequency: '',
		timing: '',
	});

	function addCondition() {
		if (!newConditionName.trim()) return;
		onChange({
			conditions: [
				...plan.conditions,
				{
					id: genId(),
					name: newConditionName.trim(),
					diagnosedYear: newConditionYear
						? parseInt(newConditionYear)
						: undefined,
				},
			],
		});
		setNewConditionName('');
		setNewConditionYear('');
	}

	function addMedication() {
		if (!newMed.name.trim()) return;
		onChange({
			medications: [
				...plan.medications,
				{
					id: genId(),
					name: newMed.name.trim(),
					doseAmount: newMed.doseAmount,
					doseUnit: newMed.doseUnit,
					route: newMed.route,
					frequency: newMed.frequency,
					timing: newMed.timing || undefined,
				},
			],
		});
		setNewMed({
			name: '',
			doseAmount: '',
			doseUnit: 'mg',
			route: 'Oral',
			frequency: '',
			timing: '',
		});
		setShowAddMed(false);
	}

	return (
		<div className='flex flex-col gap-4'>
			{/* Conditions */}
			<SectionCard
				title='Medical Conditions & Diagnoses'
				action={
					<span className='rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'>
						{plan.conditions.length}
					</span>
				}>
				<p className='mb-3 text-xs text-slate-400'>
					Click any condition to expand and document clinical details, patient
					impact and carer instructions.
				</p>
				<div className='flex flex-col gap-2'>
					{plan.conditions.map((c) => (
						<ConditionCard
							key={c.id}
							condition={c}
							onChange={(updated) =>
								onChange({
									conditions: plan.conditions.map((x) =>
										x.id === c.id ? updated : x,
									),
								})
							}
							onDelete={() =>
								onChange({
									conditions: plan.conditions.filter((x) => x.id !== c.id),
								})
							}
						/>
					))}
					{plan.conditions.length === 0 && (
						<p className='py-2 text-sm text-slate-400'>
							No conditions recorded
						</p>
					)}
				</div>
				<div className='mt-3 flex gap-2'>
					<input
						type='text'
						placeholder='Condition name'
						value={newConditionName}
						onChange={(e) => setNewConditionName(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && addCondition()}
						className='flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
					/>
					<input
						type='number'
						placeholder='Year'
						value={newConditionYear}
						onChange={(e) => setNewConditionYear(e.target.value)}
						className='w-24 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
					/>
					<Button variant='outline' size='sm' onClick={addCondition}>
						<Plus className='h-4 w-4' />
					</Button>
				</div>
			</SectionCard>

			{/* Allergies */}
			<SectionCard title='Allergies & Adverse Reactions'>
				<div className='flex flex-wrap gap-2'>
					{plan.allergies.map((a) => (
						<span
							key={a}
							className='flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700'>
							{a}
							<button
								onClick={() =>
									onChange({ allergies: plan.allergies.filter((x) => x !== a) })
								}
								className='hover:text-red-900'>
								<X className='h-3 w-3' />
							</button>
						</span>
					))}
					{plan.allergies.length === 0 && (
						<p className='text-sm text-slate-400'>
							No known allergies recorded
						</p>
					)}
				</div>
				<div className='mt-3 flex gap-2'>
					<input
						type='text'
						placeholder='e.g. Penicillin (anaphylaxis)'
						value={newAllergy}
						onChange={(e) => setNewAllergy(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && newAllergy.trim()) {
								onChange({ allergies: [...plan.allergies, newAllergy.trim()] });
								setNewAllergy('');
							}
						}}
						className='flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
					/>
					<Button
						variant='outline'
						size='sm'
						onClick={() => {
							if (!newAllergy.trim()) return;
							onChange({ allergies: [...plan.allergies, newAllergy.trim()] });
							setNewAllergy('');
						}}>
						Add
					</Button>
				</div>
			</SectionCard>

			{/* Medications */}
			<SectionCard
				title='Current Medications'
				action={
					<button
						onClick={() => setShowAddMed((s) => !s)}
						className='flex items-center gap-1 rounded-lg bg-[#0284c7] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-care-blue-hover'>
						<Plus className='h-3.5 w-3.5' />
						Add
					</button>
				}>
				<p className='mb-3 text-xs text-slate-400'>
					Click any medication to expand and document therapeutic effects, side
					effects and administration instructions.
				</p>
				<div className='flex flex-col gap-2'>
					{plan.medications.map((m) => (
						<MedicationCard
							key={m.id}
							medication={m}
							onChange={(updated) =>
								onChange({
									medications: plan.medications.map((x) =>
										x.id === m.id ? updated : x,
									),
								})
							}
							onDelete={() =>
								onChange({
									medications: plan.medications.filter((x) => x.id !== m.id),
								})
							}
						/>
					))}
					{plan.medications.length === 0 && !showAddMed && (
						<p className='py-2 text-sm text-slate-400'>
							No medications recorded
						</p>
					)}
				</div>

				{showAddMed && (
					<div className='mt-3 rounded-xl border border-dashed border-[#0284c7]/40 bg-sky-50/30 p-4'>
						<p className='mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400'>
							New Medication
						</p>
						<div className='flex flex-col gap-2'>
							<input
								type='text'
								placeholder='Medication name *'
								value={newMed.name}
								onChange={(e) =>
									setNewMed((p) => ({ ...p, name: e.target.value }))
								}
								className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
							/>
							<div className='grid grid-cols-3 gap-2'>
								<input
									type='text'
									placeholder='Dose (e.g. 500)'
									value={newMed.doseAmount}
									onChange={(e) =>
										setNewMed((p) => ({ ...p, doseAmount: e.target.value }))
									}
									className='rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
								/>
								<input
									type='text'
									placeholder='Unit (e.g. mg)'
									value={newMed.doseUnit}
									onChange={(e) =>
										setNewMed((p) => ({ ...p, doseUnit: e.target.value }))
									}
									className='rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
								/>
								<select
									value={newMed.route}
									onChange={(e) =>
										setNewMed((p) => ({ ...p, route: e.target.value }))
									}
									className='rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'>
									{[
										'Oral',
										'Sublingual',
										'Topical',
										'Injection',
										'Inhaled',
										'Patch',
										'IV',
										'Rectal',
									].map((r) => (
										<option key={r}>{r}</option>
									))}
								</select>
							</div>
							<div className='grid grid-cols-2 gap-2'>
								<input
									type='text'
									placeholder='Frequency (e.g. Twice daily)'
									value={newMed.frequency}
									onChange={(e) =>
										setNewMed((p) => ({ ...p, frequency: e.target.value }))
									}
									className='rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
								/>
								<input
									type='text'
									placeholder='Timing (e.g. With food)'
									value={newMed.timing}
									onChange={(e) =>
										setNewMed((p) => ({ ...p, timing: e.target.value }))
									}
									className='rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
								/>
							</div>
						</div>
						<div className='mt-3 flex justify-end gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setShowAddMed(false)}>
								Cancel
							</Button>
							<Button
								size='sm'
								className='bg-[#0284c7] text-white hover:bg-care-blue-hover disabled:opacity-50'
								onClick={addMedication}
								disabled={!newMed.name.trim()}>
								Add Medication
							</Button>
						</div>
					</div>
				)}
			</SectionCard>

			{/* Clinical flags */}
			<SectionCard title='Clinical Flags'>
				<div className='flex flex-col gap-3'>
					<label className='flex cursor-pointer items-center gap-3'>
						<input
							type='checkbox'
							checked={plan.dnarStatus}
							onChange={(e) => onChange({ dnarStatus: e.target.checked })}
							className='h-4 w-4 accent-[#0284c7]'
						/>
						<div>
							<p className='text-sm font-medium text-slate-800'>
								DNAR (Do Not Attempt Resuscitation) in place
							</p>
							<p className='text-xs text-slate-400'>
								A signed DNAR form must be on file and shared with out-of-hours
								services
							</p>
						</div>
					</label>
					<label className='flex cursor-pointer items-center gap-3'>
						<input
							type='checkbox'
							checked={plan.mentalCapacity}
							onChange={(e) => onChange({ mentalCapacity: e.target.checked })}
							className='h-4 w-4 accent-[#0284c7]'
						/>
						<div>
							<p className='text-sm font-medium text-slate-800'>
								Has mental capacity (Mental Capacity Act 2005)
							</p>
							<p className='text-xs text-slate-400'>
								Uncheck if a formal mental capacity assessment has determined
								the person lacks capacity
							</p>
						</div>
					</label>
				</div>
			</SectionCard>
		</div>
	);
}

function TasksTab({
	plan,
	onChange,
}: {
	plan: CarePlan;
	onChange: (p: Partial<CarePlan>) => void;
}) {
	const [newLabel, setNewLabel] = useState('');
	const [newVisitType, setNewVisitType] = useState('Morning');
	const [newRequired, setNewRequired] = useState(true);
	const visitTypes = [
		'Morning',
		'Afternoon',
		'Evening',
		'Lunch',
		'Medication',
		'Any',
	];
	const grouped = visitTypes.reduce<Record<string, CareTask[]>>((acc, vt) => {
		acc[vt] = plan.tasks.filter((t) => t.visitType === vt);
		return acc;
	}, {});

	return (
		<div className='flex flex-col gap-4'>
			{visitTypes
				.filter((vt) => grouped[vt].length > 0)
				.map((vt) => (
					<SectionCard key={vt} title={`${vt} Visit Tasks`}>
						<div className='flex flex-col gap-2'>
							{grouped[vt].map((task) => (
								<div
									key={task.id}
									className='flex items-start gap-3 rounded-lg border border-border p-3'>
									<div
										className={cn(
											'mt-0.5 h-2 w-2 shrink-0 rounded-full',
											task.required ? 'bg-red-500' : 'bg-slate-300',
										)}
									/>
									<div className='flex-1'>
										<p className='text-sm text-slate-700'>{task.label}</p>
										{task.notes && (
											<p className='mt-0.5 text-xs text-amber-600'>
												{task.notes}
											</p>
										)}
									</div>
									{task.required && (
										<span className='shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600'>
											Required
										</span>
									)}
									<button
										onClick={() =>
											onChange({
												tasks: plan.tasks.filter((t) => t.id !== task.id),
											})
										}
										className='rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500'>
										<Trash2 className='h-3.5 w-3.5' />
									</button>
								</div>
							))}
						</div>
					</SectionCard>
				))}

			{/* Add task */}
			<div className='rounded-xl border border-dashed border-border p-4'>
				<p className='mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400'>
					Add Care Task
				</p>
				<div className='flex flex-col gap-2'>
					<input
						type='text'
						placeholder='Task description…'
						value={newLabel}
						onChange={(e) => setNewLabel(e.target.value)}
						className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
					/>
					<div className='flex gap-2'>
						<select
							value={newVisitType}
							onChange={(e) => setNewVisitType(e.target.value)}
							className='flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'>
							{visitTypes.map((vt) => (
								<option key={vt} value={vt}>
									{vt} Visit
								</option>
							))}
						</select>
						<label className='flex items-center gap-2 text-sm text-slate-600'>
							<input
								type='checkbox'
								checked={newRequired}
								onChange={(e) => setNewRequired(e.target.checked)}
								className='h-4 w-4 accent-[#0284c7]'
							/>
							Required
						</label>
						<Button
							className='bg-[#0284c7] text-white hover:bg-care-blue-hover'
							size='sm'
							onClick={() => {
								if (!newLabel.trim()) return;
								onChange({
									tasks: [
										...plan.tasks,
										{
											id: genId(),
											label: newLabel.trim(),
											visitType: newVisitType,
											required: newRequired,
										},
									],
								});
								setNewLabel('');
							}}>
							Add Task
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function PreferencesTab({
	plan,
	onChange,
}: {
	plan: CarePlan;
	onChange: (p: Partial<CarePlan>) => void;
}) {
	const fields: { key: keyof Preferences; label: string; hint: string }[] = [
		{
			key: 'diet',
			label: 'Dietary Requirements',
			hint: 'Food preferences, restrictions, cultural/religious dietary needs',
		},
		{
			key: 'allergies',
			label: 'Food Allergies & Intolerances',
			hint: 'Foods to avoid completely',
		},
		{
			key: 'communication',
			label: 'Communication Preferences',
			hint: 'How best to communicate, hearing/vision aids, literacy',
		},
		{
			key: 'language',
			label: 'Preferred Language',
			hint: 'First language, interpreter needs',
		},
		{
			key: 'religion',
			label: 'Religion & Cultural Beliefs',
			hint: 'Important observances, practices affecting care',
		},
		{
			key: 'lifestyle',
			label: 'Lifestyle & Interests',
			hint: 'Hobbies, history, meaningful activities',
		},
		{
			key: 'pets',
			label: 'Pets',
			hint: 'Pet information, potential allergy or contact considerations',
		},
		{
			key: 'routine',
			label: 'Daily Routine Preferences',
			hint: 'Wake/sleep times, preferred daily schedule',
		},
	];

	return (
		<div className='flex flex-col gap-4'>
			<div className='rounded-xl border border-border bg-white p-5'>
				<p className='mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400'>
					Carer Gender Preference
				</p>
				<div className='flex gap-3'>
					{(['NO_PREFERENCE', 'FEMALE', 'MALE'] as const).map((opt) => (
						<button
							key={opt}
							onClick={() =>
								onChange({
									preferences: { ...plan.preferences, carerGender: opt },
								})
							}
							className={cn(
								'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors',
								plan.preferences.carerGender === opt
									? 'border-[#0284c7] bg-[#0284c7]/10 text-[#0284c7]'
									: 'border-border text-slate-500 hover:bg-muted',
							)}>
							{opt === 'NO_PREFERENCE'
								? 'No Preference'
								: opt[0] + opt.slice(1).toLowerCase()}
						</button>
					))}
				</div>
			</div>

			{fields.map(({ key, label, hint }) => (
				<SectionCard key={key} title={label}>
					<p className='mb-2 text-xs text-slate-400'>{hint}</p>
					<textarea
						rows={2}
						value={plan.preferences[key] as string}
						onChange={(e) =>
							onChange({
								preferences: { ...plan.preferences, [key]: e.target.value },
							})
						}
						className='w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
					/>
				</SectionCard>
			))}
		</div>
	);
}

function RisksTab({
	plan,
	onChange,
}: {
	plan: CarePlan;
	onChange: (p: Partial<CarePlan>) => void;
}) {
	const [newLabel, setNewLabel] = useState('');
	const [newLevel, setNewLevel] = useState<RiskLevel>('LOW');
	const [newNotes, setNewNotes] = useState('');

	return (
		<div className='flex flex-col gap-4'>
			{/* Risk summary bar */}
			<div className='grid grid-cols-3 gap-3'>
				{(['HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map((level) => {
					const count = plan.risks.filter((r) => r.level === level).length;
					return (
						<div
							key={level}
							className={cn(
								'rounded-xl border p-4 text-center',
								RISK_CONFIG[level].cls,
							)}>
							<p className='text-2xl font-bold'>{count}</p>
							<p className='text-xs font-medium'>
								{RISK_CONFIG[level].label} Risk
							</p>
						</div>
					);
				})}
			</div>

			{/* Risk items */}
			{plan.risks.map((risk) => (
				<div
					key={risk.id}
					className={cn('rounded-xl border p-4', RISK_CONFIG[risk.level].cls)}>
					<div className='flex items-start justify-between gap-3'>
						<div className='flex-1'>
							<div className='flex items-center gap-2'>
								<span className='text-sm font-semibold'>{risk.label}</span>
								<span
									className={cn(
										'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
										RISK_CONFIG[risk.level].cls,
									)}>
									{RISK_CONFIG[risk.level].label}
								</span>
							</div>
							<p className='mt-1.5 text-sm leading-relaxed opacity-80'>
								{risk.notes}
							</p>
							{risk.reviewDate && (
								<p className='mt-1 text-[10px] opacity-60'>
									Review:{' '}
									{new Date(risk.reviewDate).toLocaleDateString('en-GB')}
								</p>
							)}
						</div>
						<div className='flex gap-1'>
							{(['LOW', 'MEDIUM', 'HIGH'] as RiskLevel[]).map((l) => (
								<button
									key={l}
									onClick={() =>
										onChange({
											risks: plan.risks.map((r) =>
												r.id === risk.id ? { ...r, level: l } : r,
											),
										})
									}
									className={cn(
										'rounded px-2 py-1 text-[10px] font-bold transition-colors',
										l === risk.level
											? RISK_CONFIG[l].cls + ' border'
											: 'text-slate-400 hover:bg-white/50',
									)}>
									{l[0]}
								</button>
							))}
							<button
								onClick={() =>
									onChange({
										risks: plan.risks.filter((r) => r.id !== risk.id),
									})
								}
								className='ml-1 rounded p-1 opacity-50 hover:opacity-100'>
								<Trash2 className='h-3.5 w-3.5' />
							</button>
						</div>
					</div>
				</div>
			))}

			{/* Add risk */}
			<div className='rounded-xl border border-dashed border-border p-4'>
				<p className='mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400'>
					Add Risk Assessment
				</p>
				<div className='flex flex-col gap-2'>
					<div className='flex gap-2'>
						<input
							type='text'
							placeholder='Risk type (e.g. Falls Risk)'
							value={newLabel}
							onChange={(e) => setNewLabel(e.target.value)}
							className='flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
						/>
						<select
							value={newLevel}
							onChange={(e) => setNewLevel(e.target.value as RiskLevel)}
							className='rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'>
							<option value='LOW'>Low</option>
							<option value='MEDIUM'>Medium</option>
							<option value='HIGH'>High</option>
						</select>
					</div>
					<textarea
						rows={2}
						placeholder='Risk management notes…'
						value={newNotes}
						onChange={(e) => setNewNotes(e.target.value)}
						className='w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
					/>
					<div className='flex justify-end'>
						<Button
							className='bg-[#0284c7] text-white hover:bg-care-blue-hover'
							size='sm'
							onClick={() => {
								if (!newLabel.trim()) return;
								onChange({
									risks: [
										...plan.risks,
										{
											id: genId(),
											label: newLabel.trim(),
											level: newLevel,
											notes: newNotes.trim(),
										},
									],
								});
								setNewLabel('');
								setNewNotes('');
							}}>
							Add Risk
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function GoalsTab({
	plan,
	onChange,
}: {
	plan: CarePlan;
	onChange: (p: Partial<CarePlan>) => void;
}) {
	const [newDesc, setNewDesc] = useState('');
	const [newCat, setNewCat] = useState<CareGoal['category']>('health');
	const [newDate, setNewDate] = useState('');

	return (
		<div className='flex flex-col gap-4'>
			{plan.goals.map((goal) => {
				const cat = GOAL_CATEGORIES[goal.category];
				return (
					<div
						key={goal.id}
						className='rounded-xl border border-border bg-white p-4'>
						<div className='flex items-start gap-3'>
							<div
								className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white'
								style={{ backgroundColor: cat.color }}>
								<Target className='h-3.5 w-3.5' />
							</div>
							<div className='flex-1'>
								<p className='text-sm font-medium text-slate-800'>
									{goal.description}
								</p>
								<div className='mt-1.5 flex flex-wrap items-center gap-2'>
									<span
										className='rounded-full px-2 py-0.5 text-[10px] font-semibold text-white'
										style={{ backgroundColor: cat.color }}>
										{cat.label}
									</span>
									{goal.targetDate && (
										<span className='text-[10px] text-slate-400'>
											Target:{' '}
											{new Date(goal.targetDate).toLocaleDateString('en-GB')}
										</span>
									)}
									{/* Status toggle */}
									{(['ACTIVE', 'ACHIEVED', 'PAUSED'] as GoalStatus[]).map(
										(s) => (
											<button
												key={s}
												onClick={() =>
													onChange({
														goals: plan.goals.map((g) =>
															g.id === goal.id ? { ...g, status: s } : g,
														),
													})
												}
												className={cn(
													'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
													goal.status === s
														? s === 'ACHIEVED'
															? 'bg-emerald-100 text-emerald-700'
															: s === 'PAUSED'
																? 'bg-slate-100 text-slate-500'
																: 'bg-sky-100 text-sky-700'
														: 'text-slate-300 hover:text-slate-500',
												)}>
												{s[0] + s.slice(1).toLowerCase()}
											</button>
										),
									)}
								</div>
							</div>
							<button
								onClick={() =>
									onChange({
										goals: plan.goals.filter((g) => g.id !== goal.id),
									})
								}
								className='rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500'>
								<Trash2 className='h-3.5 w-3.5' />
							</button>
						</div>
					</div>
				);
			})}

			{plan.goals.length === 0 && (
				<div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-slate-400'>
					<Target className='mb-2 h-8 w-8 opacity-30' />
					<p className='text-sm'>No goals added yet</p>
				</div>
			)}

			{/* Add goal */}
			<div className='rounded-xl border border-dashed border-border p-4'>
				<p className='mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400'>
					Add Goal
				</p>
				<div className='flex flex-col gap-2'>
					<textarea
						rows={2}
						placeholder='Describe the goal or desired outcome…'
						value={newDesc}
						onChange={(e) => setNewDesc(e.target.value)}
						className='w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
					/>
					<div className='flex gap-2'>
						<select
							value={newCat}
							onChange={(e) =>
								setNewCat(e.target.value as CareGoal['category'])
							}
							className='flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'>
							{Object.entries(GOAL_CATEGORIES).map(([k, v]) => (
								<option key={k} value={k}>
									{v.label}
								</option>
							))}
						</select>
						<input
							type='date'
							value={newDate}
							onChange={(e) => setNewDate(e.target.value)}
							placeholder='Target date'
							className='flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
						/>
						<Button
							className='bg-[#0284c7] text-white hover:bg-care-blue-hover'
							size='sm'
							onClick={() => {
								if (!newDesc.trim()) return;
								onChange({
									goals: [
										...plan.goals,
										{
											id: genId(),
											description: newDesc.trim(),
											category: newCat,
											targetDate: newDate || undefined,
											status: 'ACTIVE',
										},
									],
								});
								setNewDesc('');
								setNewDate('');
							}}>
							Add
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   NewCarePlanModal
═══════════════════════════════════════════════════════════════════════════ */

function NewCarePlanModal({
	onSave,
	onClose,
}: {
	onSave: (plan: CarePlan) => void;
	onClose: () => void;
}) {
	const [patientName, setPatientName] = useState('');
	const [reviewDate, setReviewDate] = useState('');
	const [gp, setGp] = useState('');

	function handleCreate() {
		if (!patientName.trim()) return;
		onSave({
			id: genId(),
			version: 1,
			status: 'DRAFT',
			createdAt: '2026-03-12',
			reviewDate: reviewDate || '2026-09-12',
			lastReviewedBy: '',
			gp: gp.trim(),
			conditions: [],
			allergies: [],
			medications: [],
			dnarStatus: false,
			mentalCapacity: true,
			tasks: [],
			risks: [],
			goals: [],
			consentGiven: false,
			preferences: {
				diet: '',
				allergies: '',
				communication: '',
				language: 'English',
				religion: '',
				lifestyle: '',
				carerGender: 'NO_PREFERENCE',
				pets: '',
				routine: '',
			},
			notes: '',
		});
		onClose();
	}

	return (
		<>
			<div
				className='fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]'
				onClick={onClose}
			/>
			<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
				<div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl'>
					<div className='flex items-center justify-between border-b border-border px-6 py-4'>
						<h2 className='text-lg font-semibold text-slate-900'>
							New Care Plan
						</h2>
						<button
							onClick={onClose}
							className='rounded-lg p-1.5 hover:bg-muted'>
							<X className='h-5 w-5 text-slate-400' />
						</button>
					</div>
					<div className='px-6 py-5'>
						<div className='mb-4'>
							<label className='mb-1 block text-xs font-medium text-slate-500'>
								Patient name *
							</label>
							<input
								type='text'
								placeholder='e.g. James Porter'
								value={patientName}
								onChange={(e) => setPatientName(e.target.value)}
								autoFocus
								className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
							/>
						</div>
						<div className='mb-4'>
							<label className='mb-1 block text-xs font-medium text-slate-500'>
								GP & Surgery
							</label>
							<input
								type='text'
								placeholder='e.g. Dr. Smith – Elm Street Surgery'
								value={gp}
								onChange={(e) => setGp(e.target.value)}
								className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-slate-500'>
								First review date
							</label>
							<input
								type='date'
								value={reviewDate}
								onChange={(e) => setReviewDate(e.target.value)}
								className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
							/>
						</div>
					</div>
					<div className='flex gap-2 border-t border-border px-6 py-4'>
						<Button variant='outline' className='flex-1' onClick={onClose}>
							Cancel
						</Button>
						<Button
							className='flex-1 bg-[#0284c7] text-white hover:bg-care-blue-hover disabled:opacity-50'
							onClick={handleCreate}
							disabled={!patientName.trim()}>
							Create Plan
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════════════════ */

export default function CarePlansPage() {
	const [patients, setPatients] = useState(MOCK_PATIENTS);
	const [selectedId, setSelectedId] = useState<string>('p1');
	const [activeTab, setActiveTab] = useState<TabId>('overview');
	const [search, setSearch] = useState('');
	const [showNewPlan, setShowNewPlan] = useState(false);

	const selected = patients.find((p) => p.id === selectedId) ?? null;

	const filteredPatients = patients.filter(
		(p) => !search || p.name.toLowerCase().includes(search.toLowerCase()),
	);

	function patchPlan(patch: Partial<CarePlan>) {
		setPatients((prev) =>
			prev.map((p) =>
				p.id === selectedId && p.plan
					? { ...p, plan: { ...p.plan, ...patch } }
					: p,
			),
		);
	}

	function handleNewPlan(plan: CarePlan) {
		// Add to the patient with no plan (James Porter in mock)
		const target =
			patients.find((p) => !p.plan) ?? patients[patients.length - 1];
		setPatients((prev) =>
			prev.map((p) => (p.id === target.id ? { ...p, plan } : p)),
		);
		setSelectedId(target.id);
		setActiveTab('overview');
	}

	return (
		<div className='flex h-full overflow-hidden'>
			{/* Patient list */}
			<aside className='flex w-72 shrink-0 flex-col border-r border-border bg-white'>
				<div className='border-b border-border p-4'>
					<div className='flex items-center justify-between'>
						<h1 className='font-heading text-lg font-bold text-slate-900'>
							Care Plans
						</h1>
						<button
							onClick={() => setShowNewPlan(true)}
							className='flex items-center gap-1 rounded-lg bg-[#0284c7] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-care-blue-hover'>
							<Plus className='h-3.5 w-3.5' />
							New
						</button>
					</div>
					<div className='relative mt-3'>
						<Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
						<input
							type='text'
							placeholder='Search patients…'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='w-full rounded-lg border border-border py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
						/>
					</div>
				</div>
				<div className='flex-1 overflow-y-auto'>
					{filteredPatients.map((patient) => {
						const ps = PATIENT_STATUS[patient.status];
						const isActive = patient.id === selectedId;
						return (
							<button
								key={patient.id}
								onClick={() => {
									setSelectedId(patient.id);
									setActiveTab('overview');
								}}
								className={cn(
									'flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3.5 text-left transition-colors',
									isActive ? 'bg-[#0284c7]/5 text-[#0284c7]' : 'hover:bg-muted',
								)}>
								<div
									className={cn(
										'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
										isActive
											? 'bg-[#0284c7]/15 text-[#0284c7]'
											: 'bg-slate-100 text-slate-500',
									)}>
									{patient.name
										.split(' ')
										.map((n) => n[0])
										.join('')
										.slice(0, 2)}
								</div>
								<div className='min-w-0 flex-1'>
									<p
										className={cn(
											'truncate text-sm font-medium',
											isActive ? 'text-[#0284c7]' : 'text-slate-800',
										)}>
										{patient.name}
									</p>
									<div className='mt-0.5 flex items-center gap-1.5'>
										<span className={cn('h-1.5 w-1.5 rounded-full', ps.dot)} />
										<span className='text-[10px] text-slate-400'>
											{ps.label}
										</span>
										{patient.plan && (
											<span
												className={cn(
													'ml-1 rounded-full border px-1.5 py-px text-[9px] font-medium',
													STATUS_CONFIG[patient.plan.status].cls,
												)}>
												{STATUS_CONFIG[patient.plan.status].label}
											</span>
										)}
									</div>
								</div>
								<ChevronRight
									className={cn(
										'h-4 w-4 shrink-0',
										isActive ? 'text-[#0284c7]' : 'text-slate-300',
									)}
								/>
							</button>
						);
					})}
				</div>
			</aside>

			{/* Detail area */}
			<main className='flex min-w-0 flex-1 flex-col overflow-hidden bg-muted'>
				{selected && selected.plan ? (
					<>
						{/* Patient header */}
						<div className='shrink-0 border-b border-border bg-white px-6 py-4'>
							<div className='flex items-start justify-between gap-4'>
								<div>
									<div className='flex items-center gap-3'>
										<h2 className='font-heading text-xl font-bold text-slate-900'>
											{selected.name}
										</h2>
										<span
											className={cn(
												'rounded-full border px-2.5 py-0.5 text-xs font-medium',
												STATUS_CONFIG[selected.plan.status].cls,
											)}>
											{STATUS_CONFIG[selected.plan.status].label}
										</span>
										{selected.plan.status === 'REVIEW' && (
											<span className='flex items-center gap-1 text-xs text-amber-600'>
												<AlertTriangle className='h-3.5 w-3.5' />
												Review due{' '}
												{new Date(selected.plan.reviewDate).toLocaleDateString(
													'en-GB',
												)}
											</span>
										)}
									</div>
									<p className='mt-0.5 text-sm text-slate-500'>
										{fmtDOB(selected.dob)} · {calcAge(selected.dob)} years · NHS{' '}
										{selected.nhsNumber} · v{selected.plan.version}
									</p>
								</div>
								{selected.plan.allergies.length > 0 && (
									<div className='flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5'>
										<AlertTriangle className='h-3.5 w-3.5 text-red-500' />
										<span className='text-xs font-semibold text-red-700'>
											{selected.plan.allergies.length} allerg
											{selected.plan.allergies.length === 1 ? 'y' : 'ies'}
										</span>
									</div>
								)}
							</div>

							{/* Tabs */}
							<div className='mt-4 flex gap-0.5 overflow-x-auto'>
								{TABS.map((tab) => (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={cn(
											'flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
											activeTab === tab.id
												? 'bg-[#0284c7] text-white shadow-sm'
												: 'text-slate-500 hover:bg-muted hover:text-slate-700',
										)}>
										<tab.icon className='h-3.5 w-3.5' />
										{tab.label}
									</button>
								))}
							</div>
						</div>

						{/* Tab content */}
						<div className='flex-1 overflow-y-auto px-6 py-5'>
							{activeTab === 'overview' && (
								<OverviewTab plan={selected.plan} patient={selected} />
							)}
							{activeTab === 'medical' && (
								<MedicalTab plan={selected.plan} onChange={patchPlan} />
							)}
							{activeTab === 'tasks' && (
								<TasksTab plan={selected.plan} onChange={patchPlan} />
							)}
							{activeTab === 'preferences' && (
								<PreferencesTab plan={selected.plan} onChange={patchPlan} />
							)}
							{activeTab === 'risks' && (
								<RisksTab plan={selected.plan} onChange={patchPlan} />
							)}
							{activeTab === 'goals' && (
								<GoalsTab plan={selected.plan} onChange={patchPlan} />
							)}
						</div>
					</>
				) : selected && !selected.plan ? (
					<div className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
						<div className='rounded-full bg-slate-100 p-6'>
							<FileText className='h-10 w-10 text-slate-300' />
						</div>
						<div>
							<h3 className='font-heading text-lg font-semibold text-slate-700'>
								No care plan for {selected.name}
							</h3>
							<p className='mt-1 text-sm text-slate-400'>
								Create a care plan to document their needs, preferences and
								goals.
							</p>
						</div>
						<Button
							className='bg-[#0284c7] text-white hover:bg-care-blue-hover'
							onClick={() => setShowNewPlan(true)}>
							<Plus className='mr-1.5 h-4 w-4' />
							Create Care Plan
						</Button>
					</div>
				) : null}
			</main>

			{showNewPlan && (
				<NewCarePlanModal
					onSave={handleNewPlan}
					onClose={() => setShowNewPlan(false)}
				/>
			)}
		</div>
	);
}
