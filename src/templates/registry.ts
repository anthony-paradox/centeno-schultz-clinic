import ClinicFooter from "../components/chrome/ClinicFooter.astro";
import ClinicHeader from "../components/chrome/ClinicHeader.astro";
import ClinicLanding from "./landing/ClinicLanding.astro";

export const clinicTemplates = {
	clinic: {
		Header: ClinicHeader,
		Footer: ClinicFooter,
		Landing: ClinicLanding,
	},
} as const;

export type ClinicTemplateName = keyof typeof clinicTemplates;

export function clinicTemplate(value: unknown): ClinicTemplateName | null {
	return value === "clinic" ? "clinic" : null;
}
