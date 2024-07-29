
export async function getCurrentWeather({ location, unit = 'fahrenheit'}) {
	console.debug("Location: " + location);
	console.debug("Unit: " + unit);
	
	const weather = {
		temperature: "72",
		unit: 'F',
		forecast: 'sunny'
	}
	return JSON.stringify(weather);
}


export async function getLocation() {
	return 'Salt Lake City, UT';
}