import * as vscode from 'vscode';

const LAP_KEY = 'scuderiaFerrari.lapCount';
const PRANCING_HORSE_COMMAND = 'scuderiaFerrari.prancingHorseMode';
const ADD_LAP_COMMAND = 'scuderiaFerrari.addRaceLap';
const RESET_LAPS_COMMAND = 'scuderiaFerrari.resetRaceLapCounter';
const PIT_STOP_COMMAND = 'scuderiaFerrari.startPitStopTimer';
const OPEN_DASHBOARD_COMMAND = 'scuderiaFerrari.openDashboard';

let statusBarItem: vscode.StatusBarItem;
let lapCount = 0;
let pitStopTimer: NodeJS.Timeout | undefined;
let dashboardPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
	lapCount = context.globalState.get<number>(LAP_KEY, 0);

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.name = 'Scuderia Ferrari Race Control';
	statusBarItem.command = OPEN_DASHBOARD_COMMAND;
	statusBarItem.tooltip = new vscode.MarkdownString('$(dashboard) Ferrari F1 Dashboard\n\nOpen the race-control webview.');
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

	const openDashboard = vscode.commands.registerCommand(OPEN_DASHBOARD_COMMAND, () => {
		showFerrariDashboard(context);
	});

	context.subscriptions.push(
		statusBarItem,
		prancingHorseMode,
		addRaceLap,
		resetRaceLapCounter,
		startPitStopTimer,
		openDashboard,
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
	dashboardPanel?.webview.postMessage({ type: 'lapUpdate', lapCount });
}

function showFerrariDashboard(context: vscode.ExtensionContext) {
	if (dashboardPanel) {
		dashboardPanel.reveal(vscode.ViewColumn.One);
		dashboardPanel.webview.postMessage({ type: 'lapUpdate', lapCount });
		return;
	}

	dashboardPanel = vscode.window.createWebviewPanel(
		'scuderiaFerrariDashboard',
		'Ferrari F1 Dashboard',
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, 'media')
			],
			retainContextWhenHidden: true
		}
	);

	dashboardPanel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'ferrari-icon.png');
	dashboardPanel.webview.html = getDashboardHtml(context, dashboardPanel.webview);

	dashboardPanel.webview.onDidReceiveMessage(async (message: { command?: string }) => {
		switch (message.command) {
			case 'addLap':
				await vscode.commands.executeCommand(ADD_LAP_COMMAND);
				break;
			case 'pitStop':
				await vscode.commands.executeCommand(PIT_STOP_COMMAND);
				break;
			case 'resetLaps':
				await vscode.commands.executeCommand(RESET_LAPS_COMMAND);
				break;
			case 'prancingHorse':
				await vscode.commands.executeCommand(PRANCING_HORSE_COMMAND);
				break;
		}
	});

	dashboardPanel.onDidDispose(() => {
		dashboardPanel = undefined;
	});
}

function getDashboardHtml(context: vscode.ExtensionContext, webview: vscode.Webview) {
	const nonce = getNonce();
	const imageUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'ferrari-f1.png'));
	const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'ferrari-dashboard.css'));
	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'ferrari-dashboard.js'));

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
	<link rel="stylesheet" href="${stylesUri}">
	<title>Ferrari F1 Dashboard</title>
</head>
<body>
	<main class="dashboard-shell">
		<section class="hero" aria-label="Ferrari F1 dashboard hero">
			<div class="hero-glow"></div>
			<div class="hero-copy">
				<p class="eyebrow">Scuderia race control</p>
				<h1>Ferrari F1 Dashboard</h1>
				<p class="lede">A carbon-black cockpit for lap rhythm, pit-stop focus, and Rosso Corsa speed.</p>
				<div class="hero-actions">
					<button class="neon-button primary" data-command="prancingHorse">PRANCING HORSE MODE</button>
					<button class="neon-button" data-command="pitStop">Start Pit Stop Timer</button>
				</div>
			</div>
			<div class="car-stage">
				<img src="${imageUri}" alt="Ferrari Formula 1 car" class="hero-car">
			</div>
		</section>

		<section class="telemetry-grid" aria-label="Ferrari dashboard controls">
			<article class="speed-card">
				<div class="gauge gauge-lap">
					<span id="lap-count">${lapCount}</span>
				</div>
				<div>
					<p class="card-kicker">Race pace</p>
					<h2>Lap Counter</h2>
					<p>Track your coding stint like a qualifying run.</p>
				</div>
				<button class="card-button" data-command="addLap">Add Lap</button>
			</article>

			<article class="speed-card">
				<div class="gauge gauge-hot">
					<span>2.6</span>
				</div>
				<div>
					<p class="card-kicker">Garage call</p>
					<h2>Pit Stop Timer</h2>
					<p>Trigger a timed notification for a fast reset.</p>
				</div>
				<button class="card-button" data-command="pitStop">Box Now</button>
			</article>

			<article class="speed-card">
				<div class="gauge gauge-cool">
					<span>0</span>
				</div>
				<div>
					<p class="card-kicker">Fresh tyres</p>
					<h2>Reset Session</h2>
					<p>Clear the counter and launch from a clean grid.</p>
				</div>
				<button class="card-button" data-command="resetLaps">Reset</button>
			</article>
		</section>
	</main>
	<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (let i = 0; i < 32; i += 1) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
}
