const vscode = acquireVsCodeApi();
const lapCount = document.getElementById('lap-count');

document.querySelectorAll('[data-command]').forEach((button) => {
	button.addEventListener('click', () => {
		vscode.postMessage({ command: button.dataset.command });
	});
});

window.addEventListener('message', (event) => {
	const message = event.data;

	if (message.type === 'lapUpdate' && lapCount) {
		lapCount.textContent = String(message.lapCount);
		lapCount.animate(
			[
				{ transform: 'scale(1)', textShadow: '0 0 0 rgba(255, 40, 0, 0)' },
				{ transform: 'scale(1.18)', textShadow: '0 0 24px rgba(255, 40, 0, 0.9)' },
				{ transform: 'scale(1)', textShadow: '0 0 0 rgba(255, 40, 0, 0)' }
			],
			{
				duration: 420,
				easing: 'ease-out'
			}
		);
	}
});
