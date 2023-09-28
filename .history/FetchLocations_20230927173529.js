export function fetchLocations() {
	// Google Sheets API URL format: https://sheets.googleapis.com/v4/spreadsheets/SPREADSHEET_ID/values/RANGE?key=API_KEY
	const SHEET_ID = '10FkMzWhOwXzS1XjHvg0UYQCDw4_mj0CVpqCHZ_pmD78'
	const RANGE = 'Locations!K2:K' // get our data from combined column
	const API_KEY = 'AIzaSyAOe-rwikKX4vd9gDO_wzP2ePGTUkTL4Fs'
	const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`

	fetch(url)
		.then((response) => response.json())
		.then((data) => {
			const rows = data.values
			const locations = rows.map((row) => {
				console.log(row)
				return null
			})
			// Use 'locations' as required in your application
			console.log(locations)
		})
		.catch((error) =>
			console.error('Error fetching data from Google Sheets:', error)
		)
}
