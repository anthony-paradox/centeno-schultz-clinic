import type { MenuItem } from "emdash";

export interface HeaderFields {
	template: string;
	phone: string;
	phoneHref: string;
	appointmentLabel: string;
	appointmentUrl: string;
	appointmentTarget: "_self" | "_blank";
	navigationMenu: string;
}

export interface FooterLocation {
	name: string;
	url: string;
	address: string;
}

export interface FooterBadge {
	image: string;
	alt: string;
}

export interface FooterFields {
	template: string;
	contact: string;
	linkedin: string;
	facebook: string;
	youtube: string;
	instagram: string;
	pinterest: string;
	locations: FooterLocation[];
	badges: FooterBadge[];
	findUsMenu: string;
	legalMenu: string;
	copyrightName: string;
}

export interface LandingFields {
	template: string;
	title: string;
	heroImage: string;
	heroHeading: string;
	heroSubheading: string;
	candidateLabel: string;
	candidateUrl: string;
}

const HEADER_DEFAULTS: HeaderFields = {
	template: "clinic",
	phone: "303-429-6448",
	phoneHref: "tel:13034296448",
	appointmentLabel: "Make an Appointment",
	appointmentUrl: "/appointment/",
	appointmentTarget: "_self",
	navigationMenu: "primary",
};

const FOOTER_DEFAULTS: FooterFields = {
	template: "clinic",
	contact: "303-429-6448\n303-429-6373\ninfo@centenoschultz.com\nOffice hours: 7am – 5pm",
	linkedin: "https://www.linkedin.com/company/27099644/",
	facebook: "https://www.facebook.com/centenoschultzclinic/?fref=ts",
	youtube: "https://www.youtube.com/user/Regenexx",
	instagram: "https://www.instagram.com/centenoschultzclinic/",
	pinterest: "https://www.pinterest.com/centenoschultzclinic/",
	locations: [
		{
			name: "Broomfield",
			url: "https://centenoschultz.com/locations/broomfield/",
			address: "403 Summit Blvd\nSuite 201\nBroomfield, CO 80021",
		},
		{
			name: "Colorado Springs",
			url: "/locations/colorado-springs/",
			address: "5815 Mark Dabling Blvd\nColorado Springs, CO 80919",
		},
	],
	badges: [
		{
			image: "/brand/logo-iof-member.png",
			alt: "Interventional Orthobiologics Foundation Member",
		},
		{
			image: "/brand/logo-bbb.png",
			alt: "Better Business Bureau A+ Rating",
		},
	],
	findUsMenu: "footer_find_us",
	legalMenu: "footer_legal",
	copyrightName: "Centeno-Schultz Clinic",
};

const LANDING_DEFAULTS: LandingFields = {
	template: "clinic",
	title: "Regenexx Colorado - Centeno-Schultz Clinic",
	heroImage: "https://centenoschultz.com/wp-content/uploads/MicrosoftTeams-image-1.jpg",
	heroHeading: "Centeno-Schultz Clinic",
	heroSubheading: "The Standard in Non-Surgical Orthopedic Care Since 2005",
	candidateLabel: "Am I a Candidate?",
	candidateUrl: "/candidate-form/",
};

function text(value: unknown, fallback: string): string {
	return typeof value === "string" && value.trim() ? value : fallback;
}

function locations(value: unknown): FooterLocation[] {
	if (!Array.isArray(value)) return FOOTER_DEFAULTS.locations;
	const parsed = value.flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const row = item as Record<string, unknown>;
		const name = text(row.name, "");
		const url = text(row.url, "");
		const address = text(row.address, "");
		if (!name || !url) return [];
		return [{ name, url, address }];
	});
	return parsed.length ? parsed : FOOTER_DEFAULTS.locations;
}

function badges(value: unknown): FooterBadge[] {
	if (!Array.isArray(value)) return FOOTER_DEFAULTS.badges;
	const parsed = value.flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const row = item as Record<string, unknown>;
		const image = text(row.image, "");
		const alt = text(row.alt, "");
		if (!image) return [];
		return [{ image, alt }];
	});
	return parsed.length ? parsed : FOOTER_DEFAULTS.badges;
}

export function headerFields(data: Record<string, unknown> | undefined): HeaderFields {
	const target = data?.appointment_target === "_blank" ? "_blank" : "_self";
	return {
		template: text(data?.template, HEADER_DEFAULTS.template),
		phone: text(data?.phone, HEADER_DEFAULTS.phone),
		phoneHref: text(data?.phone_href, HEADER_DEFAULTS.phoneHref),
		appointmentLabel: text(data?.appointment_label, HEADER_DEFAULTS.appointmentLabel),
		appointmentUrl: text(data?.appointment_url, HEADER_DEFAULTS.appointmentUrl),
		appointmentTarget: target,
		navigationMenu: text(data?.navigation_menu, HEADER_DEFAULTS.navigationMenu),
	};
}

export function footerFields(data: Record<string, unknown> | undefined): FooterFields {
	return {
		template: text(data?.template, FOOTER_DEFAULTS.template),
		contact: text(data?.contact, FOOTER_DEFAULTS.contact),
		linkedin: text(data?.linkedin, FOOTER_DEFAULTS.linkedin),
		facebook: text(data?.facebook, FOOTER_DEFAULTS.facebook),
		youtube: text(data?.youtube, FOOTER_DEFAULTS.youtube),
		instagram: text(data?.instagram, FOOTER_DEFAULTS.instagram),
		pinterest: text(data?.pinterest, FOOTER_DEFAULTS.pinterest),
		locations: locations(data?.locations),
		badges: badges(data?.badges),
		findUsMenu: text(data?.find_us_menu, FOOTER_DEFAULTS.findUsMenu),
		legalMenu: text(data?.legal_menu, FOOTER_DEFAULTS.legalMenu),
		copyrightName: text(data?.copyright_name, FOOTER_DEFAULTS.copyrightName),
	};
}

export function landingFields(data: Record<string, unknown> | undefined): LandingFields {
	return {
		template: text(data?.template, LANDING_DEFAULTS.template),
		title: text(data?.title, LANDING_DEFAULTS.title),
		heroImage: text(data?.hero_image, LANDING_DEFAULTS.heroImage),
		heroHeading: text(data?.hero_heading, LANDING_DEFAULTS.heroHeading),
		heroSubheading: text(data?.hero_subheading, LANDING_DEFAULTS.heroSubheading),
		candidateLabel: text(data?.candidate_label, LANDING_DEFAULTS.candidateLabel),
		candidateUrl: text(data?.candidate_url, LANDING_DEFAULTS.candidateUrl),
	};
}

export function smsHref(phoneHref: string): string {
	return phoneHref.replace(/^tel:/, "sms:");
}

export function isExternal(url: string): boolean {
	return /^https?:\/\//i.test(url);
}

export type NavItem = MenuItem;
