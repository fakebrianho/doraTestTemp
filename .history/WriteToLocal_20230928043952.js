export function saveDataToLocalStorage(data) {
	const storageData = {
		timestamp: Date.now(),
		data: data,
	}
	localStorage.setItem('locationsData', JSON.stringify(storageData))
}
