import { create } from 'zustand';

type Organization = {
	id: string;
	name: string;
	slug: string;
};

type SessionState = {
	organisations: Organization[];
	selectedOrganisation: Organization | null;
	setOrganisations: (orgs: Organization[]) => void;
	setSelectedOrganisation: (org: Organization) => void;
	clear: () => void;
};

export const useSessionStore = create<SessionState>()((set) => ({
	organisations: [],
	selectedOrganisation: null,
	setOrganisations: (orgs) => set({ organisations: orgs }),
	setSelectedOrganisation: (org) => set({ selectedOrganisation: org }),
	clear: () => set({ organisations: [], selectedOrganisation: null }),
}));
