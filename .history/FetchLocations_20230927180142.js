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
				const entry = row[0].split(',')
				const title = entry[0]
				const address1 = entry[1]
				const address2 = entry[2] + ', ' + entry[3] + ',  ' + entry[4]
				const latitude = parseFloat(entry[5])
				const longitude = parseFloat(entry[6])
				return {
					title: title,
					address1: address1,
					address2: address2,
					coords: { lat: latitude, lng: longitude },
				}
			})
			// Use 'locations' as required in your application
			// console.log(locations[0])
			return locations
		})
		.catch((error) =>
			console.error('Error fetching data from Google Sheets:', error)
		)
}
