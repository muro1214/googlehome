const eorzeaWeather = require("eorzea-weather");
const eorzeaTime = require("eorzea-time");
const range = require("lodash.range");

// エオルゼア内の時間
const EIGHT_HOURS = 8 * 175 * 1000;
const ONE_DAY = EIGHT_HOURS * 3;

const getStartTime = (date) => {
	const oneHour = 175 * 1000;
	const msec = date.getTime();
	const bell = (msec / oneHour) % 24;
	const startMsec = msec - Math.round(oneHour * bell);

	return new Date(startMsec);
}

// 一個前の天候から2日先の天候まで取得する
exports.getWeathers = function ({locale, zoneId}, baseTime = new Date()) {
	const weather = new eorzeaWeather(zoneId, {locale});
	const startTime = getStartTime(baseTime) - EIGHT_HOURS;
	console.log(weather.getZoneName() + " の天気予報が取得されました");

	return range(startTime, startTime + (ONE_DAY * 2), EIGHT_HOURS).map((time) => {
		const startedAt = new Date(time);
		return {
			name: weather.getWeather(startedAt),
			eorzeaTime: new eorzeaTime(startedAt).toString(),
			startedAt: startedAt.toLocaleString(),
		};
	});
}
