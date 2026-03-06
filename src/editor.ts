import { CustomEditor } from "@mariozechner/pi-coding-agent";

import type { PidexPrefs } from "./prefs";

export class PidexEditor extends CustomEditor {
	constructor(...args: ConstructorParameters<typeof CustomEditor>) {
		super(...args);
	}

	private prefs: PidexPrefs = {
		themeName: "pidex-dark",
		density: "compact",
		forceTheme: true,
		showHeader: true,
		compactTools: true,
	};

	setPrefs(prefs: PidexPrefs): void {
		this.prefs = prefs;
		this.setPaddingX(prefs.density === "comfortable" ? 2 : 1);
	}

	render(width: number): string[] {
		return super.render(width);
	}
}
