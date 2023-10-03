import { APILoader } from 'https://unpkg.com/@googlemaps/extended-component-library@0.4'
import { fetchLocations } from './FetchLocations'
import { getDataFromLocalStorage } from './WriteToLocal'
let locatorInstance
class LocatorPlus {
	static REQUIRED_MAPS_JS_LIBRARIES = [
		'core',
		'geometry',
		'marker',
		'routes',
		'maps',
	]
	static MAX_LOCATIONS_TO_SHOW = 5
	static MAX_DISTANCE_METERS = 16093
	static MAX_DISTANCE_MILES = 50

	constructor(configuration) {
		this.MAX_DISTANCE_METERS = 16093
		this.MAX_DISTANCE_MILES = 50
		this.allLocations = configuration.locations || []
		this.locations = configuration.locations || []
		this.capabilities = configuration.capabilities || {}
		this.mapOptions = configuration.mapOptions || {}
	}

	static async init(configuration) {
		const locator = new LocatorPlus(configuration)

		await locator.loadMapsLibraries()
		locator.initializeDOMReferences()
		locator.initializeMapLocations()
		locator.initializeSearchInput()
		locator.initializeDistanceMatrix()

		locator.renderResultsList()

		return locator
	}

	setRadius(newRadius) {
		this.constructor.MAX_DISTANCE_MILES = newRadius // This sets the static property.
		this.renderResultsList()
	}
	// }

	async loadMapsLibraries() {
		this.mapsLibraries = {}
		return Promise.all(
			LocatorPlus.REQUIRED_MAPS_JS_LIBRARIES.map(async (libName) => {
				this.mapsLibraries[libName] = await APILoader.importLibrary(
					libName
				)
			})
		)
	}

	async fetchAndSetLocations() {
		try {
			const fetchedLocations = await fetchLocations()
			this.allLocations = fetchedLocations
			this.locations = [...this.allLocations]
		} catch (error) {
			console.error('Failed to fetch locations:', error)
		}
	}

	/** Caches references to required DOM elements. */
	initializeDOMReferences() {
		this.mapEl = document.querySelector('gmp-map')
		this.routeEl = document.querySelector('gmp-map > gmpx-route-overview')
		this.panelEl = document.getElementById('locations-panel')
		this.sectionNameEl = document.getElementById(
			'location-results-section-name'
		)
		this.resultItemTemplate = document.getElementById(
			'locator-result-item-template'
		)
		this.resultsContainerEl = document.getElementById(
			'location-results-list'
		)

		this.overlayLayoutEl = document.querySelector('gmpx-overlay-layout')
	}

	chunkArray(arr, chunkSize) {
		const chunks = []
		for (let i = 0; i < arr.length; i += chunkSize) {
			chunks.push(arr.slice(i, i + chunkSize))
		}
		return chunks
	}

	selectResultItem(
		locationIdx,
		panToMarker,
		scrollToResult,
		selectedList = false,
		selectedListIndex = null
	) {
		this.selectedLocationIdx = locationIdx
		if (!selectedList) {
			for (const li of this.resultsContainerEl.children) {
				li.classList.remove('selected')
				if (
					parseInt(li.dataset.locationIndex) ===
					this.selectedLocationIdx
				) {
					li.classList.add('selected')
					if (scrollToResult) {
						console.log('scrolling')
						li.scrollIntoView({
							behavior: 'smooth',
							block: 'nearest',
						})
					}
				}
			}
		} else if (selectedList && this.searchLocation) {
			for (let i = 0; i < this.resultsContainerEl.children.length; i++) {
				this.resultsContainerEl.children[i].classList.remove('selected')
			}
			this.resultsContainerEl.children[locationIdx].classList.add(
				'selected'
			)
		}

		if (panToMarker) {
			// Zoom out first
			this.map.setZoom(9) // Adjust this value based on how much you want to zoom out

			setTimeout(() => {
				this.map.setZoom(12) // Adjust zoom level as desired
				if (selectedList && this.searchLocation) {
					this.map.panTo(this.locations[selectedListIndex].coords)
					selectedList = false
				} else {
					this.map.panTo(
						this.allLocations[this.selectedLocationIdx].coords
					)
				}
			}, 500) // 500ms delay between zooming out and zooming in, adjust as needed
		}
	}

	/** Updates the map bounds to markers. */
	updateBounds() {
		const bounds = new this.mapsLibraries.core.LatLngBounds()
		if (this.searchLocationMarker) {
			bounds.extend(this.searchLocationMarker.getPosition())
		}
		for (let i = 0; i < this.markers.length; i++) {
			bounds.extend(this.markers[i].getPosition())
		}

		this.map.fitBounds(bounds)
	}

	updateMap() {
		const locationResults = document.querySelector('#location-results-list')
		// locationResults.forEach((location) => {
		// 	console.log(location)
		// })

		this.markers = this.locations.map((location, index) => {
			const contentText = `<div id='detail_content'>
					<h3 id="detail_heading">${location.title}</h3>	
					<p>${location.address1 + ' ' + location.address2}</p>
					<a href=#>Directions</a>
				</div>`
			const infoWindow = new this.mapsLibraries.maps.InfoWindow({
				content: contentText,
				ariaLabel: location.title,
			})
			const marker = new this.mapsLibraries.marker.Marker({
				position: location.coords,
				map: this.map,
				title: location.title,
			})
			marker.addListener('click', () => {
				this.selectResultItem(index, true, false, true, index)
				infoWindow.open({
					anchor: marker,
					map: this.map,
				})
			})
			return marker
		})

		if (this.locations.length) {
			this.updateBounds()
		}

		const LatLng = this.mapsLibraries.core.LatLng
		for (const location of this.locations) {
			location.placeResult = {
				name: location.title,
				formatted_address: location.address1 + ' ' + location.address2,
				geometry: { location: new LatLng(location.coords) },
			}
		}
	}

	initializeMapLocations() {
		this.searchLocation = null
		this.searchLocationMarker = null
		this.selectedLocationIdx = null
		this.userCountry = null

		// Initialize the map.
		this.map = this.mapEl.innerMap
		this.map.setOptions({
			...this.mapOptions,
			mapId: this.mapOptions.mapId || 'DEMO_MAP_ID',
		})

		this.markers = this.locations.map((location, index) => {
			const marker = new this.mapsLibraries.marker.Marker({
				position: location.coords,
				map: this.map,
				title: location.title,
			})
			marker.addListener('click', () => {
				this.selectResultItem(index, true, true, true, null)
			})
			return marker
		})

		if (this.locations.length) {
			this.updateBounds()
		}

		const LatLng = this.mapsLibraries.core.LatLng
		for (const location of this.locations) {
			location.placeResult = {
				// place_id: location.placeId,
				name: location.title,
				formatted_address: location.address1 + ' ' + location.address2,
				geometry: { location: new LatLng(location.coords) },
			}
		}
	}

	getLocationDistance(location) {
		if (!this.searchLocation) return null

		// Use travel distance if available (from Distance Matrix).
		if (location.travelDistanceValue != null) {
			return location.travelDistanceValue
		}

		// Fall back to straight-line distance.
		return this.mapsLibraries.geometry.spherical.computeDistanceBetween(
			new this.mapsLibraries.core.LatLng(location.coords),
			this.searchLocation.location
		)
	}

	createResultItem(location) {
		// Create the parent DOM node.
		// console.log(location)
		const li =
			this.resultItemTemplate.content.firstElementChild.cloneNode(true)
		li.dataset.locationIndex = location.index
		if (location.index === this.selectedLocationIdx) {
			li.classList.add('selected')
		}

		li.querySelector('gmpx-place-data-provider').place =
			location.placeResult
		li.querySelector('.address').append(
			location.address1,
			document.createElement('br'),
			location.address2
		)
		li.querySelector('gmpx-place-directions-button').origin = this
			.searchLocation
			? this.searchLocation.location
			: null
		li.querySelector('.distance').textContent =
			location.travelDistanceText ?? ''
		// for (const action of location.actions ?? []) {
		// 	console.log(action)
		// 	if (action.defaultUrl) {
		// 		const actionButton = document.createElement('gmpx-icon-button')
		// 		actionButton.icon = 'open_in_new'
		// 		actionButton.href = action.defaultUrl
		// 		actionButton.textContent = action.label
		// 		actionsContainer.append(actionButton)
		// 	}
		// }

		const resultSelectionHandler = (
			isMarker = false,
			selectedIndex = null
		) => {
			if (
				location.index !== this.selectedLocationIdx ||
				this.updateDirectionsOnSelect
			) {
				if (!isMarker) {
					console.log('hi1')
					this.selectResultItem(
						location.index,
						true,
						false,
						false,
						null
					)
				} else {
					console.log('hi2')
					this.selectResultItem(
						location.index,
						true,
						false,
						true,
						selectedIndex
					)
				}
				// this.updateDirections()
				this.updateDirectionsOnSelect = false
			}
		}

		li.addEventListener('click', () => resultSelectionHandler(false, null))
		li.querySelector('.select-location').addEventListener('click', (e) => {
			resultSelectionHandler(false, null)
			e.stopPropagation()
		})

		return li
	}

	/** Renders the list of items next to the map. */
	renderResultsList() {
		let locations = this.allLocations.slice()
		for (let i = 0; i < locations.length; i++) {
			locations[i].index = i
		}
		if (this.searchLocation) {
			locations.forEach((location) => {
				location.distance = this.getLocationDistance(location) / 490.4
			})
			locations = locations.filter((location) => {
				return (
					location.distance != null &&
					location.distance <= LocatorPlus.MAX_DISTANCE_MILES
				)
			})
			locations.sort((a, b) => {
				return a.distance - b.distance
			})
			this.sectionNameEl.textContent =
				'Nearest locations (' + locations.length + ')'
		} else {
			this.sectionNameEl.textContent = `All locations (${this.allLocations.length})`
		}

		console.log(locations, 'biii')
		// this.locations = locations.slice(0, LocatorPlus.MAX_LOCATIONS_TO_SHOW)
		this.locations = locations
		console.log(this.locations, 'hiiii')

		this.resultsContainerEl.replaceChildren(
			...this.locations.map((x) => this.createResultItem(x))
		)
	}

	/** Updates the end user's location, used for travel times and sorting. */
	updateSearchLocation(place) {
		if (this.searchLocationMarker) {
			this.searchLocationMarker.setMap(null)
		}
		this.searchLocationMarker = null
		this.searchLocation = place
		this.clearMarkers()
		// this.clearDirections()
		if (!this.searchLocation) {
			return
		}
		this.searchLocationMarker = new this.mapsLibraries.marker.Marker({
			position: place.location,
			map: this.map,
			title: 'My location',
			icon: {
				path: this.mapsLibraries.core.SymbolPath.CIRCLE,
				scale: 12,
				fillColor: '#3367D6',
				fillOpacity: 0.5,
				strokeOpacity: 0,
			},
		})

		const addressParts = place.formattedAddress.split(' ')
		this.userCountry = addressParts[addressParts.length - 1]

		// Update map bounds to include the new location marker.
		this.updateBounds()

		// Update the result list so we can sort it by proximity.
		this.renderResultsList()

		this.updateTravelTimes()
	}

	/** When the search input capability is enabled, initialize it. */
	initializeSearchInput() {
		const placePicker = document.querySelector('gmpx-place-picker')
		placePicker.addEventListener('gmpx-placechange', () => {
			this.updateSearchLocation(placePicker.value)
		})
	}

	/** Initialize Distance Matrix for the locator. */
	initializeDistanceMatrix() {
		this.distanceMatrixService =
			new this.mapsLibraries.routes.DistanceMatrixService()
	}

	updateTravelTimes() {
		if (!this.searchLocation) return

		const clonedLocations = [...this.allLocations] // Clone the allLocations for manipulation

		const units = this.mapsLibraries.core.UnitSystem.IMPERIAL
		const conversionFactor =
			units === this.mapsLibraries.core.UnitSystem.IMPERIAL ? 0.3048 : 1

		const destinationChunks = this.chunkArray(
			clonedLocations.map((x) => x.coords),
			10
		)

		let processedChunks = 0

		destinationChunks.forEach((chunk, chunkIndex) => {
			const request = {
				origins: [this.searchLocation.location],
				destinations: chunk,
				travelMode: this.mapsLibraries.routes.TravelMode.DRIVING,
				unitSystem: units,
			}

			this.distanceMatrixService.getDistanceMatrix(
				request,
				(response, status) => {
					if (status === 'OK') {
						const distances = response.rows[0].elements
						for (let i = 0; i < distances.length; i++) {
							const distResult = distances[i]
							const location =
								clonedLocations[i + chunkIndex * 10]
							if (location && distResult.status === 'OK') {
								// console.log(distResult.distance.text)
								location.travelDistanceText =
									distResult.distance.text
								location.travelDistanceValue =
									distResult.distance.value * conversionFactor
							}
						}
					}

					processedChunks++
					if (processedChunks === destinationChunks.length) {
						this.locations = clonedLocations.slice(
							0,
							LocatorPlus.MAX_LOCATIONS_TO_SHOW
						)
						this.locations = clonedLocations
						this.renderResultsList()
						this.updateMap() // This will reinitialize your map markers.
					}
				}
			)
		})
	}

	clearMarkers() {
		if (this.markers) {
			for (const marker of this.markers) {
				marker.setMap(null)
			}
			this.markers = []
		}
	}
}

document.addEventListener('DOMContentLoaded', async function () {
	const locations = await getDataFromLocalStorage()
	const CONFIGURATION = {
		locations: locations,
		mapOptions: {
			center: { lat: 38.0, lng: -100.0 },
			fullscreenControl: true,
			mapTypeControl: false,
			streetViewControl: false,
			zoom: 9,
			zoomControl: true,
			maxZoom: 50,
			mapId: '',
		},
		mapsApiKey: 'AIzaSyAXH7Y0D7ObURbN92bhyNncYVkQEn8iIdM',
		capabilities: {
			input: true,
			autocomplete: true,
			directions: true,
			distanceMatrix: true,
			details: true,
			actions: false,
		},
	}
	locatorInstance = await LocatorPlus.init(CONFIGURATION)
})

document.addEventListener('DOMContentLoaded', function () {
	// Get all checkboxes
	const checkbox25miles = document.getElementById('25miles')
	const checkbox50miles = document.getElementById('50miles')

	checkbox25miles.addEventListener('change', function () {
		toggleCheckboxes(checkbox25miles, checkbox50miles)
		updateLocatorPlus(checkbox25miles)
	})

	checkbox50miles.addEventListener('change', function () {
		toggleCheckboxes(checkbox50miles, checkbox25miles)
		updateLocatorPlus(checkbox50miles)
	})
})
function toggleCheckboxes(activeCheckbox, otherCheckbox) {
	if (!activeCheckbox.checked) {
		otherCheckbox.checked = true
	}
	if (activeCheckbox.checked) {
		otherCheckbox.checked = false
	}
}

function updateLocatorPlus(check) {
	locatorInstance.setRadius(check.value)
}
