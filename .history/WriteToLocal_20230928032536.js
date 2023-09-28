const fs = require('fs')
const path = require('path')

function saveDataToFile(data) {
	const filePath = path.join(__dirname, 'locations.json')
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}
