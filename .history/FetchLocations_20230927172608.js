export function fetchLocations() {
	// Google Sheets API URL format: https://sheets.googleapis.com/v4/spreadsheets/SPREADSHEET_ID/values/RANGE?key=API_KEY
	const SHEET_ID = '10FkMzWhOwXzS1XjHvg0UYQCDw4_mj0CVpqCHZ_pmD78'
	const RANGE = 'Storelocations!K:K' // get our data from combined column
	const API_KEY = 'AIzaSyAOe-rwikKX4vd9gDO_wzP2ePGTUkTL4Fs'
	const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`

	fetch(url)
		.then((response) => response.json())
		.then((data) => {
			console.log(data)
			// const rows = data.values
			// const locations = rows.map((row) => ({
			// 	title: row[0],
			// 	address1: row[1],
			// 	address2: row[2],
			// 	coords: {
			// 		lat: parseFloat(row[3]),
			// 		lng: parseFloat(row[4]),
			// 	},
			// 	placeId: row[5],
			// }))
			// Use 'locations' as required in your application
			// console.log(locations)
		})
		.catch((error) =>
			console.error('Error fetching data from Google Sheets:', error)
		)
}
