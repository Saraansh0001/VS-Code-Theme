import * as vscode from 'vscode';

const LAP_KEY = 'scuderiaFerrari.lapCount';
const PRANCING_HORSE_COMMAND = 'scuderiaFerrari.prancingHorseMode';
const ADD_LAP_COMMAND = 'scuderiaFerrari.addRaceLap';
const RESET_LAPS_COMMAND = 'scuderiaFerrari.resetRaceLapCounter';
const PIT_STOP_COMMAND = 'scuderiaFerrari.startPitStopTimer';

let statusBarItem: vscode.StatusBarItem;
let lapCount = 0;
let pitStopTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
	lapCount = context.globalState.get<number>(LAP_KEY, 0);

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.name = 'Scuderia Ferrari Race Control';
	statusBarItem.command = PRANCING_HORSE_COMMAND;
	statusBarItem.tooltip = new vscode.MarkdownString('$(dashboard) PRANCING HORSE MODE\n\nClick to add a racing lap.');
	updateStatusBar();
	statusBarItem.show();

	const prancingHorseMode = vscode.commands.registerCommand(PRANCING_HORSE_COMMAND, async () => {
		await addLap(context);
		vscode.window.showInformationMessage(`PRANCING HORSE MODE: Lap ${lapCount} logged. Forza Ferrari.`);
	});

	const addRaceLap = vscode.commands.registerCommand(ADD_LAP_COMMAND, async () => {
		await addLap(context);
		vscode.window.setStatusBarMessage(`Scuderia Ferrari lap ${lapCount} recorded`, 2500);
	});

	const resetRaceLapCounter = vscode.commands.registerCommand(RESET_LAPS_COMMAND, async () => {
		lapCount = 0;
		await context.globalState.update(LAP_KEY, lapCount);
		updateStatusBar();
		vscode.window.showInformationMessage('Race lap counter reset. Fresh tyres, clear track.');
	});

	const startPitStopTimer = vscode.commands.registerCommand(PIT_STOP_COMMAND, () => {
		if (pitStopTimer) {
			clearTimeout(pitStopTimer);
		}

		const startedAt = Date.now();
		vscode.window.setStatusBarMessage('Pit stop timer running: target 2.6s', 2600);

		pitStopTimer = setTimeout(() => {
			const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);
			vscode.window.showInformationMessage(`Pit stop complete in ${elapsedSeconds}s. Box, box, launch.`);
			pitStopTimer = undefined;
		}, 2600);
	});

	context.subscriptions.push(
		statusBarItem,
		prancingHorseMode,
		addRaceLap,
		resetRaceLapCounter,
		startPitStopTimer,
		{
			dispose: () => {
				if (pitStopTimer) {
					clearTimeout(pitStopTimer);
				}
			}
		}
	);
}

export function deactivate() {
	if (pitStopTimer) {
		clearTimeout(pitStopTimer);
		pitStopTimer = undefined;
	}
}

async function addLap(context: vscode.ExtensionContext) {
	lapCount += 1;
	await context.globalState.update(LAP_KEY, lapCount);
	updateStatusBar();
}

function updateStatusBar() {
	statusBarItem.text = `$(dashboard) 🏎️ Ferrari Lap ${lapCount}`;
	statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
	statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
}
