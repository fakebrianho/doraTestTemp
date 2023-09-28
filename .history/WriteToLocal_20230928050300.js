export function saveDataToLocalStorage(data) {
	const storageData = {
		timestamp: Date.now(),
		data: data,
	}
	localStorage.setItem('locationsData', JSON.stringify(storageData))
}

export function getDataFromLocalStorage() {
	const storageData = JSON.parse(localStorage.getItem('locationsData'))

	if (!storageData) {
		// Data doesn't exist, fetch it.
		return fetchDataAndUpdateStorage()
	}

	const oneDay = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
	const now = Date.now()

	if (now - storageData.timestamp > oneDay) {
		// Data is stale, fetch it again.
		return fetchDataAndUpdateStorage()
	} else {
		// Data is still fresh.
		return storageData.data
	}
}

export async function fetchDataAndUpdateStorage() {
	const locations = await fetchLocations() // Assuming fetchLocations() is your API call function
	saveDataToLocalStorage(locations)
	return locations
}
