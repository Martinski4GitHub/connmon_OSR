/**----------------------------**/
/** Last Modified: 2025-Jul-20 **/
/**----------------------------**/

iziToast.settings({
	title: 'connmon',
	timeout: 5000,
	resetOnHover: false,
	transitionIn: 'fadeInRight',
	transitionOut: 'fadeOutRight',
	position: 'bottomRight',
	messageSize: '16px',
	theme: 'light',
	displayMode: 'replace',
	layout: 2,
	drag: false,
	pauseOnHover: false
});

function getCookie(cookiename, returntype)
{
	if (cookie.get('conn_' + cookiename) !== null)
	{
		if (returntype === 'string')
		{
			return cookie.get('conn_' + cookiename);
		}
		else if (returntype === 'number')
		{
			return cookie.get('conn_' + cookiename) * 1;
		}
	}
	else
	{
		if (returntype === 'string')
		{
			return '';
		}
		else if (returntype === 'number')
		{
			return 0;
		}
	}
}

function setCookie(cookiename, cookievalue)
{ cookie.set('conn_' + cookiename, cookievalue, 10 * 365); }

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-20] **/
/**----------------------------------------**/
let databaseResetDone = 0;
var automaticModeState = 'ENABLED';
var sqlDatabaseFileSize = '0 Bytes';
var jffsAvailableSpaceStr = '0 Bytes';
var jffsAvailableSpaceLow = 'OK';

var daysofweek = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];
var pingtestdur = 60;

var arraysortlistlines = [];
var sortname = 'Time';
var sortdir = 'desc';
var AltLayout = getCookie('AltLayout', 'string');
if (AltLayout === '') {
	AltLayout = 'false';
}

var maxNoCharts = 27;
var currentNoCharts = 0;
var ShowLines = getCookie('ShowLines', 'string');
var ShowFill = getCookie('ShowFill', 'string');
if (ShowFill === '') {
	ShowFill = 'origin';
}
var DragZoom = true;
var ChartPan = false;

var myinterval;
var intervalclear = false;
var pingtestrunning = false;

Chart.defaults.global.defaultFontColor = '#CCC';
Chart.Tooltip.positioners.cursor = function (chartElements, coordinates) {
	return coordinates;
};

var dataintervallist = ['raw', 'hour', 'day'];
var metriclist = ['Ping', 'Jitter', 'LineQuality'];
var titlelist = ['Ping', 'Jitter', 'Quality'];
var measureunitlist = ['ms', 'ms', '%'];
var chartlist = ['daily', 'weekly', 'monthly'];
var timeunitlist = ['hour', 'day', 'day'];
var intervallist = [24, 7, 30];
var bordercolourlist = ['#fc8500', '#42ecf5', '#fff'];
var backgroundcolourlist = ['rgba(252,133,0,0.5)', 'rgba(66,236,245,0.5)', 'rgba(255,255,255,0.5)'];

function settingHint(hintid)
{
	hintid = hintid * 1;
	var tagName = document.getElementsByTagName('a');
	for (var i = 0; i < tagName.length; i++) {
		tagName[i].onmouseout = nd;
	}
	var hinttext = 'My text goes here';
	if (hintid === 1) { hinttext = 'Hour(s) of day to run ping test<br />* for all<br />Valid numbers between 0 and 23<br />comma (,) separate for multiple<br />dash (-) separate for a range'; }
	if (hintid === 2) { hinttext = 'Minute(s) of day to run ping test<br />(* for all<br />Valid numbers between 0 and 59<br />comma (,) separate for multiple<br />dash (-) separate for a range'; }
	return overlib(hinttext, 0, 0);
}

function resetZoom()
{
	for (var i = 0; i < metriclist.length; i++)
	{
		var chartobj = window['LineChart_' + metriclist[i]];
		if (typeof chartobj === 'undefined' || chartobj === null) { continue; }
		chartobj.resetZoom();
	}
}

function toggleDragZoom(button)
{
	var drag = true;
	var pan = false;
	var buttonvalue = '';
	if (button.value.indexOf('On') !== -1)
	{
		drag = false;
		pan = true;
		DragZoom = false;
		ChartPan = true;
		buttonvalue = 'Drag Zoom Off';
	}
	else
	{
		drag = true;
		pan = false;
		DragZoom = true;
		ChartPan = false;
		buttonvalue = 'Drag Zoom On';
	}

	for (var i = 0; i < metriclist.length; i++)
	{
		var chartobj = window['LineChart_' + metriclist[i]];
		if (typeof chartobj === 'undefined' || chartobj === null) { continue; }
		chartobj.options.plugins.zoom.zoom.drag = drag;
		chartobj.options.plugins.zoom.pan.enabled = pan;
		button.value = buttonvalue;
		chartobj.update();
	}
}

function toggleLines()
{
	if (ShowLines === '')
	{
		ShowLines = 'line';
		setCookie('ShowLines', 'line');
	}
	else
	{
		ShowLines = '';
		setCookie('ShowLines', '');
	}
	for (var i = 0; i < metriclist.length; i++)
	{
		for (var i3 = 0; i3 < 3; i3++)
		{
			window['LineChart_' + metriclist[i]].options.annotation.annotations[i3].type = ShowLines;
		}
		window['LineChart_' + metriclist[i]].update();
	}
}

function toggleFill()
{
	if (ShowFill === 'false') {
		ShowFill = 'origin';
		setCookie('ShowFill', 'origin');
	}
	else {
		ShowFill = 'false';
		setCookie('ShowFill', 'false');
	}
	for (var i = 0; i < metriclist.length; i++) {
		window['LineChart_' + metriclist[i]].data.datasets[0].fill = ShowFill;
		window['LineChart_' + metriclist[i]].update();
	}
}

function keyHandler(e)
{
	switch (e.keyCode) {
		case 82:
			$(document).off('keydown');
			resetZoom();
			break;
		case 68:
			$(document).off('keydown');
			toggleDragZoom(document.form.btnDragZoom);
			break;
		case 70:
			$(document).off('keydown');
			toggleFill();
			break;
		case 76:
			$(document).off('keydown');
			toggleLines();
			break;
	}
}

$(document).keydown(function (e) { keyHandler(e); });
$(document).keyup(function (e) {
	$(document).keydown(function (e) {
		keyHandler(e);
	});
});

function validateIP(forminput)
{
	var inputvalue = forminput.value;
	var inputname = forminput.name;
	if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(inputvalue)) {
		$(forminput).removeClass('invalid');
		return true;
	}
	else {
		$(forminput).addClass('invalid');
		return false;
	}
}

function validateDomain(forminput)
{
	var inputvalue = forminput.value;
	var inputname = forminput.name;
	if (/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(inputvalue))
	{
		$(forminput).removeClass('invalid');
		return true;
	}
	else {
		$(forminput).addClass('invalid');
		return false;
	}
}

function validateNumberSetting (forminput, upperlimit, lowerlimit)
{
	var inputname = forminput.name;
	var inputvalue = forminput.value * 1;

	if (inputvalue > upperlimit || inputvalue < lowerlimit)
	{
		$(forminput).addClass('invalid');
		return false;
	}
	else
	{
		$(forminput).removeClass('invalid');
		return true;
	}
}

function formatNumberSetting (forminput)
{
	var inputname = forminput.name;
	var inputvalue = forminput.value * 1;

	if (forminput.value.length === 0 || isNaN(inputvalue))
	{
		return false;
	}
	else
	{
		forminput.value = parseInt(forminput.value, 10);
		return true;
	}
}

function formatNumberSetting3DP(forminput)
{
	var inputname = forminput.name;
	var inputvalue = forminput.value * 1;

	if (inputvalue < 0 || forminput.value.length === 0 || isNaN(inputvalue) || forminput.value === '.') {
		return false;
	}
	else {
		forminput.value = parseFloat(forminput.value).toFixed(3);
		return true;
	}
}

function validateSchedule (forminput, hoursmins)
{
	var inputname = forminput.name;
	var inputvalues = forminput.value.split(',');
	var upperlimit = 0;

	if (hoursmins === 'hours')
	{ upperlimit = 23; }
	else if (hoursmins === 'mins')
	{ upperlimit = 59; }

	showhide('btnfixhours', false);
	showhide('btnfixmins', false);

	var validationfailed = 'false';
	for (var i = 0; i < inputvalues.length; i++)
	{
		if (inputvalues[i] === '*' && i === 0) {
			validationfailed = 'false';
		}
		else if (inputvalues[i] === '*' && i !== 0) {
			validationfailed = 'true';
		}
		else if (inputvalues[0] === '*' && i > 0) {
			validationfailed = 'true';
		}
		else if (inputvalues[i] === '') {
			validationfailed = 'true';
		}
		else if (inputvalues[i].startsWith('*/')) {
			if (!isNaN(inputvalues[i].replace('*/', '') * 1)) {
				if ((inputvalues[i].replace('*/', '') * 1) > upperlimit || (inputvalues[i].replace('*/', '') * 1) < 0) {
					validationfailed = 'true';
				}
			}
			else {
				validationfailed = 'true';
			}
		}
		else if (inputvalues[i].indexOf('-') !== -1) {
			if (inputvalues[i].startsWith('-')) {
				validationfailed = 'true';
			}
			else {
				var inputvalues2 = inputvalues[i].split('-');
				for (var i2 = 0; i2 < inputvalues2.length; i2++) {
					if (inputvalues2[i2] === '') {
						validationfailed = 'true';
					}
					else if (!isNaN(inputvalues2[i2] * 1)) {
						if ((inputvalues2[i2] * 1) > upperlimit || (inputvalues2[i2] * 1) < 0) {
							validationfailed = 'true';
						}
						else if ((inputvalues2[i2 + 1] * 1) < (inputvalues2[i2] * 1)) {
							validationfailed = 'true';
							if (hoursmins === 'hours') {
								showhide('btnfixhours', true);
							}
							else if (hoursmins === 'mins') {
								showhide('btnfixmins', true);
							}
						}
					}
					else {
						validationfailed = 'true';
					}
				}
			}
		}
		else if (!isNaN(inputvalues[i] * 1)) {
			if ((inputvalues[i] * 1) > upperlimit || (inputvalues[i] * 1) < 0) {
				validationfailed = 'true';
			}
		}
		else {
			validationfailed = 'true';
		}
	}
	if (validationfailed === 'true')
	{
		$(forminput).addClass('invalid');
		return false;
	}
	else
	{
		$(forminput).removeClass('invalid');
		return true;
	}
}

function validateScheduleValue (forminput)
{
	var inputname = forminput.name;
	var inputvalue = forminput.value * 1;

	var upperlimit = 0;
	var lowerlimit = 1;
	var unittype = $('#everyxselect').val();

	if (unittype === 'hours')
	{ upperlimit = 24; }
	else if (unittype === 'minutes')
	{ upperlimit = 30; }

	if (inputvalue > upperlimit || inputvalue < lowerlimit || forminput.value.length < 1)
	{
		$(forminput).addClass('invalid');
		return false;
	}
	else
	{
		$(forminput).removeClass('invalid');
		return true;
	}
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-08] **/
/**----------------------------------------**/
//Between 15 and 365 days, Default: 30//
const theDaysToKeepMIN = 15;
const theDaysToKeepDEF = 30;
const theDaysToKeepMAX = 365;
const theDaysToKeepTXT = `(between ${theDaysToKeepMIN} and ${theDaysToKeepMAX}, default: ${theDaysToKeepDEF})`;

//Between 5 and 100 results, Default: 10//
const theLastXResultsMIN = 5;
const theLastXResultsDEF = 10;
const theLastXResultsMAX = 100;
const theLastXResultsTXT = `(between ${theLastXResultsMIN} and ${theLastXResultsMAX}, default: ${theLastXResultsDEF})`;

//Between 10 and 60 seconds, Default: 30//
const thePingDurationMIN = 10;
const thePingDurationDEF = 30;
const thePingDurationMAX = 60;
const thePingDurationTXT = `(between ${thePingDurationMIN} and ${thePingDurationMAX}, default: ${thePingDurationDEF})`;

function validateAll()
{
	var validationfailed = false;
	if (!validateIP(document.form.connmon_ipaddr))
	{ validationfailed = true; }
	if (!validateDomain(document.form.connmon_domain))
	{ validationfailed = true; }
	if (!validateNumberSetting(document.form.connmon_pingduration, thePingDurationMAX, thePingDurationMIN))
	{ validationfailed = true; }
	if (!validateNumberSetting(document.form.connmon_lastxresults, theLastXResultsMAX, theLastXResultsMIN))
	{ validationfailed = true; }
	if (!validateNumberSetting(document.form.connmon_daystokeep, theDaysToKeepMAX, theDaysToKeepMIN))
	{ validationfailed = true; }
	if (document.form.connmon_automaticmode.value === 'true')
	{
		if (document.form.schedulemode.value === 'EveryX')
		{
			if (!validateScheduleValue (document.form.everyxvalue))
			{ validationfailed = true; }
		}
		else if (document.form.schedulemode.value === 'Custom')
		{
			if (!validateSchedule (document.form.connmon_schhours, 'hours')) 
			{ validationfailed = true; }
			if (!validateSchedule (document.form.connmon_schmins, 'mins')) 
			{ validationfailed = true; }
		}
	}
	if (validationfailed)
	{
		alert('**ERROR**\nValidation for some fields failed.\nPlease correct invalid values and try again.');
		return false;
	}
	else
	{ return true; }
}

function fixCron(hoursmins)
{
	if (hoursmins === 'hours')
	{
		var origvalue = document.form.connmon_schhours.value;
		document.form.connmon_schhours.value = origvalue.split('-')[0] + '-23,0-' + origvalue.split('-')[1];
		validateSchedule (document.form.connmon_schhours, 'hours');
	}
	else if (hoursmins === 'mins')
	{
		var origvalue = document.form.connmon_schmins.value;
		document.form.connmon_schmins.value = origvalue.split('-')[0] + '-59,0-' + origvalue.split('-')[1];
		validateSchedule (document.form.connmon_schmins, 'mins');
	}
}

function changePingType(forminput)
{
	var inputvalue = forminput.value * 1;
	var inputname = forminput.name;
	if (inputvalue === 0) {
		document.getElementById('rowip').style.display = '';
		document.getElementById('rowdomain').style.display = 'none';
	}
	else {
		document.getElementById('rowip').style.display = 'none';
		document.getElementById('rowdomain').style.display = '';
	}
}

function getTimeFormat(value, format)
{
	var timeformat;
	value = value * 1;
	if (format === 'axis') {
		if (value === 0) {
			timeformat = {
				millisecond: 'HH:mm:ss.SSS',
				second: 'HH:mm:ss',
				minute: 'HH:mm',
				hour: 'HH:mm'
			};
		}
		else if (value === 1) {
			timeformat = {
				millisecond: 'h:mm:ss.SSS A',
				second: 'h:mm:ss A',
				minute: 'h:mm A',
				hour: 'h A'
			};
		}
	}
	else if (format === 'tooltip') {
		if (value === 0) {
			timeformat = 'YYYY-MM-DD HH:mm:ss';
		}
		else if (value === 1) {
			timeformat = 'YYYY-MM-DD h:mm:ss A';
		}
	}

	return timeformat;
}


function logarithmicFormatter(tickValue, index, ticks) {
	var unit = this.options.scaleLabel.labelString;
	if (this.type !== 'logarithmic') {
		if (!isNaN(tickValue)) {
			return round(tickValue, 2).toFixed(2) + ' ' + unit;
		}
		else {
			return tickValue + ' ' + unit;
		}
	}
	else {
		var labelOpts = this.options.ticks.labels || {};
		var labelIndex = labelOpts.index || ['min', 'max'];
		var labelSignificand = labelOpts.significand || [1, 2, 5];
		var significand = tickValue / (Math.pow(10, Math.floor(Chart.helpers.log10(tickValue))));
		var emptyTick = labelOpts.removeEmptyLines === true ? undefined : '';
		var namedIndex = '';
		if (index === 0) {
			namedIndex = 'min';
		}
		else if (index === ticks.length - 1) {
			namedIndex = 'max';
		}
		if (labelOpts === 'all' || labelSignificand.indexOf(significand) !== -1 || labelIndex.indexOf(index) !== -1 || labelIndex.indexOf(namedIndex) !== -1) {
			if (tickValue === 0) {
				return '0' + ' ' + unit;
			}
			else {
				if (!isNaN(tickValue)) {
					return round(tickValue, 2).toFixed(2) + ' ' + unit;
				}
				else {
					return tickValue + ' ' + unit;
				}
			}
		}
		return emptyTick;
	}
}

function getLimit(datasetname, axis, maxmin, isannotation) {
	var limit = 0;
	var values;
	if (axis === 'x') {
		values = datasetname.map(function (o) { return o.x; });
	}
	else {
		values = datasetname.map(function (o) { return o.y; });
	}

	if (maxmin === 'max') {
		limit = Math.max.apply(Math, values);
	}
	else {
		limit = Math.min.apply(Math, values);
	}
	if (maxmin === 'max' && limit === 0 && isannotation === false) {
		limit = 1;
	}
	return limit;
}

function getYAxisMax(chartname) {
	if (chartname === 'LineQuality') {
		return 100;
	}
}

function getAverage(datasetname) {
	var total = 0;
	for (var i = 0; i < datasetname.length; i++) {
		total += (datasetname[i].y * 1);
	}
	var avg = total / datasetname.length;
	return avg;
}

function round(value, decimals) {
	return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function getChartScale(scale) {
	var chartscale = '';
	scale = scale * 1;
	if (scale === 0) {
		chartscale = 'linear';
	}
	else if (scale === 1) {
		chartscale = 'logarithmic';
	}
	return chartscale;
}

function getChartInterval(layout) {
	var charttype = 'raw';
	layout = layout * 1;
	if (layout === 0) { charttype = 'raw'; }
	else if (layout === 1) { charttype = 'hour'; }
	else if (layout === 2) { charttype = 'day'; }
	return charttype;
}


function getChartPeriod(period) {
	var chartperiod = 'daily';
	period = period * 1;
	if (period === 0) { chartperiod = 'daily'; }
	else if (period === 1) { chartperiod = 'weekly'; }
	else if (period === 2) { chartperiod = 'monthly'; }
	return chartperiod;
}

function drawChartNoData(txtchartname, texttodisplay) {
	document.getElementById('divLineChart_' + txtchartname).width = '730';
	document.getElementById('divLineChart_' + txtchartname).height = '500';
	document.getElementById('divLineChart_' + txtchartname).style.width = '730px';
	document.getElementById('divLineChart_' + txtchartname).style.height = '500px';
	var ctx = document.getElementById('divLineChart_' + txtchartname).getContext('2d');
	ctx.save();
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = 'normal normal bolder 48px Arial sans-serif';
	ctx.fillStyle = 'white';
	ctx.fillText(texttodisplay, 365, 250);
	ctx.restore();
}

function drawChart(txtchartname, txttitle, txtunity, bordercolourname, backgroundcolourname) {
	var chartperiod = getChartPeriod($('#' + txtchartname + '_Period option:selected').val());
	var chartinterval = getChartInterval($('#' + txtchartname + '_Interval option:selected').val());
	var txtunitx = timeunitlist[$('#' + txtchartname + '_Period option:selected').val()];
	var numunitx = intervallist[$('#' + txtchartname + '_Period option:selected').val()];
	var zoompanxaxismax = moment();
	var chartxaxismax = null;
	var chartxaxismin = moment().subtract(numunitx, txtunitx + 's');
	var charttype = 'line';
	var dataobject = window[txtchartname + '_' + chartinterval + '_' + chartperiod];

	if (typeof dataobject === 'undefined' || dataobject === null) { drawChartNoData(txtchartname, 'No data to display'); return; }
	if (dataobject.length === 0) { drawChartNoData(txtchartname, 'No data to display'); return; }

	var chartLabels = dataobject.map(function (d) { return d.Metric; });
	var chartData = dataobject.map(function (d) { return { x: d.Time, y: d.Value }; });
	var objchartname = window['LineChart_' + txtchartname];

	var timeaxisformat = getTimeFormat($('#Time_Format option:selected').val(), 'axis');
	var timetooltipformat = getTimeFormat($('#Time_Format option:selected').val(), 'tooltip');

	if (chartinterval === 'day') {
		charttype = 'bar';
		chartxaxismax = moment().endOf('day').subtract(9, 'hours');
		chartxaxismin = moment().startOf('day').subtract(numunitx - 1, txtunitx + 's').subtract(12, 'hours');
		zoompanxaxismax = chartxaxismax;
	}

	if (chartperiod === 'daily' && chartinterval === 'day') {
		txtunitx = 'day';
		numunitx = 1;
		chartxaxismax = moment().endOf('day').subtract(9, 'hours');
		chartxaxismin = moment().startOf('day').subtract(12, 'hours');
		zoompanxaxismax = chartxaxismax;
	}

	factor = 0;
	if (txtunitx === 'hour') {
		factor = 60 * 60 * 1000;
	}
	else if (txtunitx === 'day') {
		factor = 60 * 60 * 24 * 1000;
	}
	if (objchartname !== undefined) { objchartname.destroy(); }
	var ctx = document.getElementById('divLineChart_' + txtchartname).getContext('2d');
	var lineOptions = {
		segmentShowStroke: false,
		segmentStrokeColor: '#000',
		animationEasing: 'easeOutQuart',
		animationSteps: 100,
		maintainAspectRatio: false,
		animateScale: true,
		hover: { mode: 'point' },
		legend: { display: false, position: 'bottom', onClick: null },
		title: { display: true, text: txttitle },
		tooltips: {
			callbacks: {
				title: function (tooltipItem, data) {
					if (chartinterval === 'day') {
						return moment(tooltipItem[0].xLabel, 'X').format('YYYY-MM-DD');
					}
					else {
						return moment(tooltipItem[0].xLabel, 'X').format(timetooltipformat);
					}
				},
				label: function (tooltipItem, data) { return round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y, 2).toFixed(2) + ' ' + txtunity; }
			},
			mode: 'point',
			position: 'cursor',
			intersect: true
		},
		scales: {
			xAxes: [{
				type: 'time',
				gridLines: { display: true, color: '#282828' },
				ticks: {
					min: chartxaxismin,
					max: chartxaxismax,
					display: true
				},
				time: {
					parser: 'X',
					unit: txtunitx,
					stepSize: 1,
					displayFormats: timeaxisformat
				}
			}],
			yAxes: [{
				type: getChartScale($('#' + txtchartname + '_Scale option:selected').val()),
				gridLines: { display: false, color: '#282828' },
				scaleLabel: { display: false, labelString: txtunity },
				ticks: {
					display: true,
					beginAtZero: true,
					max: getYAxisMax(txtchartname),
					labels: {
						index: ['min', 'max'],
						removeEmptyLines: true
					},
					userCallback: logarithmicFormatter
				}
			}]
		},
		plugins: {
			zoom: {
				pan: {
					enabled: ChartPan,
					mode: 'xy',
					rangeMin: {
						x: chartxaxismin,
						y: 0
					},
					rangeMax: {
						x: zoompanxaxismax,
						y: getLimit(chartData, 'y', 'max', false) + getLimit(chartData, 'y', 'max', false) * 0.1
					},
				},
				zoom: {
					enabled: true,
					drag: DragZoom,
					mode: 'xy',
					rangeMin: {
						x: chartxaxismin,
						y: 0
					},
					rangeMax: {
						x: zoompanxaxismax,
						y: getLimit(chartData, 'y', 'max', false) + getLimit(chartData, 'y', 'max', false) * 0.1
					},
					speed: 0.1
				}
			}
		},
		annotation: {
			drawTime: 'afterDatasetsDraw',
			annotations: [{
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getAverage(chartData),
				borderColor: bordercolourname,
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: 'sans-serif',
					fontSize: 10,
					fontStyle: 'bold',
					fontColor: '#fff',
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: 'center',
					enabled: true,
					xAdjust: 0,
					yAdjust: 0,
					content: 'Avg=' + round(getAverage(chartData), 2).toFixed(2) + txtunity
				}
			},
			{
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getLimit(chartData, 'y', 'max', true),
				borderColor: bordercolourname,
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: 'sans-serif',
					fontSize: 10,
					fontStyle: 'bold',
					fontColor: '#fff',
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: 'right',
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: 'Max=' + round(getLimit(chartData, 'y', 'max', true), 2).toFixed(2) + txtunity
				}
			},
			{
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getLimit(chartData, 'y', 'min', true),
				borderColor: bordercolourname,
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: 'sans-serif',
					fontSize: 10,
					fontStyle: 'bold',
					fontColor: '#fff',
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: 'left',
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: 'Min=' + round(getLimit(chartData, 'y', 'min', true), 2).toFixed(2) + txtunity
				}
			}]
		}
	};
	var lineDataset = {
		labels: chartLabels,
		datasets: [{
			data: chartData,
			borderWidth: 1,
			pointRadius: 1,
			lineTension: 0,
			fill: ShowFill,
			backgroundColor: backgroundcolourname,
			borderColor: bordercolourname
		}]
	};
	objchartname = new Chart(ctx, {
		type: charttype,
		options: lineOptions,
		data: lineDataset
	});
	window['LineChart_' + txtchartname] = objchartname;
}


function changePeriod(e) {
	value = e.value * 1;
	name = e.id.substring(0, e.id.indexOf('_'));
	if (value === 2) {
		$('select[id="' + name + '_Period"] option:contains(24)').text('Today');
	}
	else {
		$('select[id="' + name + '_Period"] option:contains("Today")').text('Last 24 hours');
	}
}

function getLastXFile() {
	$.ajax({
		url: '/ext/connmon/lastx.htm',
		dataType: 'text',
		cache: false,
		error: function (xhr) {
			setTimeout(getLastXFile, 1000);
		},
		success: function (data) {
			parseLastXData(data);
		}
	});
}

function setGlobalDataset(txtchartname, dataobject)
{
	window[txtchartname] = dataobject;
	currentNoCharts++;
	if (currentNoCharts === maxNoCharts)
	{
		showhide('imgConnTest', false);
		showhide('conntest_text', false);
		showhide('btnRunPingtest', true);
		showhide('databaseSize_text',true);
		if (pingtestrunning)
		{
			pingtestrunning = false;
			iziToast.destroy();
			iziToast.success({ message: 'Ping test complete' });
		}
		for (var i = 0; i < metriclist.length; i++)
		{
			$('#' + metriclist[i] + '_Interval').val(getCookie(metriclist[i] + '_Interval', 'number'));
			changePeriod(document.getElementById(metriclist[i] + '_Interval'));
			$('#' + metriclist[i] + '_Period').val(getCookie(metriclist[i] + '_Period', 'number'));
			$('#' + metriclist[i] + '_Scale').val(getCookie(metriclist[i] + '_Scale', 'number'));
			drawChart(metriclist[i], titlelist[i], measureunitlist[i], bordercolourlist[i], backgroundcolourlist[i]);
		}
		getLastXFile();
	}
}

function redrawAllCharts()
{
	for (var i = 0; i < metriclist.length; i++)
	{
		drawChartNoData(metriclist[i], 'Data loading...');
		for (var i2 = 0; i2 < chartlist.length; i2++)
		{
			for (var i3 = 0; i3 < dataintervallist.length; i3++)
			{
				d3.csv('/ext/connmon/csv/' + metriclist[i] + '_' + dataintervallist[i3] + '_' + chartlist[i2] + '.htm').then(setGlobalDataset.bind(null, metriclist[i] + '_' + dataintervallist[i3] + '_' + chartlist[i2]));
			}
		}
	}
}

function buildLastXTable() {
	var tablehtml = '<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="sortTable">';

	if (AltLayout === 'false') {
		tablehtml += '<col style="width:130px;">';
		tablehtml += '<col style="width:200px;">';
		tablehtml += '<col style="width:95px;">';
		tablehtml += '<col style="width:90px;">';
		tablehtml += '<col style="width:90px;">';
		tablehtml += '<col style="width:110px;">';
		tablehtml += '<thead class="sortTableHeader">';
		tablehtml += '<tr>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Time</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Target</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Duration (s)</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Ping (ms)</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Jitter (ms)</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\').replace(\' \',\'\'))">Line Quality (%)</th>';
		tablehtml += '</tr>';
		tablehtml += '</thead>';
		tablehtml += '<tbody class="sortTableContent">';
		for (var i = 0; i < arraysortlistlines.length; i++) {
			tablehtml += '<tr class="sortRow">';
			tablehtml += '<td>' + arraysortlistlines[i].Time + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].Target + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].Duration + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].Ping + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].Jitter + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].LineQuality + '</td>';
			tablehtml += '</tr>';
		}
	}
	else {
		tablehtml += '<col style="width:130px;">';
		tablehtml += '<col style="width:90px;">';
		tablehtml += '<col style="width:90px;">';
		tablehtml += '<col style="width:110px;">';
		tablehtml += '<col style="width:200px;">';
		tablehtml += '<col style="width:95px;">';
		tablehtml += '<thead class="sortTableHeader">';
		tablehtml += '<tr>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Time</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Ping (ms)</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Jitter (ms)</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\').replace(\' \',\'\'))">Line Quality (%)</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Target</th>';
		tablehtml += '<th class="sortable" onclick="sortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Duration (s)</th>';
		tablehtml += '</tr>';
		tablehtml += '</thead>';
		tablehtml += '<tbody class="sortTableContent">';
		for (var i = 0; i < arraysortlistlines.length; i++) {
			tablehtml += '<tr class="sortRow">';
			tablehtml += '<td>' + arraysortlistlines[i].Time + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].Ping + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].Jitter + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].LineQuality + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].Target + '</td>';
			tablehtml += '<td>' + arraysortlistlines[i].Duration + '</td>';
			tablehtml += '</tr>';
		}
	}

	tablehtml += '</tbody>';
	tablehtml += '</table>';
	return tablehtml;
}

function sortTable(sorttext) {
	sortname = sorttext.replace('↑', '').replace('↓', '').trim();
	var sorttype = 'number';
	var sortfield = sortname;
	switch (sortname) {
		case 'Time':
			sorttype = 'date';
			break;
		case 'Target':
			sorttype = 'string';
			break;
	}

	if (sorttype === 'string') {
		if (sorttext.indexOf('↓') === -1 && sorttext.indexOf('↑') === -1) {
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => (a.' + sortfield + ' > b.' + sortfield + ') ? 1 : ((b.' + sortfield + ' > a.' + sortfield + ') ? -1 : 0));');
			sortdir = 'asc';
		}
		else if (sorttext.indexOf('↓') !== -1) {
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => (a.' + sortfield + ' > b.' + sortfield + ') ? 1 : ((b.' + sortfield + ' > a.' + sortfield + ') ? -1 : 0));');
			sortdir = 'asc';
		}
		else {
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => (a.' + sortfield + ' < b.' + sortfield + ') ? 1 : ((b.' + sortfield + ' < a.' + sortfield + ') ? -1 : 0));');
			sortdir = 'desc';
		}
	}
	else if (sorttype === 'number') {
		if (sorttext.indexOf('↓') === -1 && sorttext.indexOf('↑') === -1) {
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => parseFloat(a.' + sortfield + '.replace("m","000")) - parseFloat(b.' + sortfield + '.replace("m","000")));');
			sortdir = 'asc';
		}
		else if (sorttext.indexOf('↓') !== -1) {
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => parseFloat(a.' + sortfield + '.replace("m","000")) - parseFloat(b.' + sortfield + '.replace("m","000"))); ');
			sortdir = 'asc';
		}
		else {
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => parseFloat(b.' + sortfield + '.replace("m","000")) - parseFloat(a.' + sortfield + '.replace("m","000")));');
			sortdir = 'desc';
		}
	}
	else if (sorttype === 'date') {
		if (sorttext.indexOf('↓') === -1 && sorttext.indexOf('↑') === -1) {
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => new Date(a.' + sortfield + ') - new Date(b.' + sortfield + '));');
			sortdir = 'asc';
		}
		else if (sorttext.indexOf('↓') !== -1) {
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => new Date(a.' + sortfield + ') - new Date(b.' + sortfield + '));');
			sortdir = 'asc';
		}
		else {
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => new Date(b.' + sortfield + ') - new Date(a.' + sortfield + '));');
			sortdir = 'desc';
		}
	}

	$('#sortTableContainer').empty();
	$('#sortTableContainer').append(buildLastXTable());

	$('.sortable').each(function (index, element) {
		if (element.innerHTML.replace(/ \(.*\)/, '').replace(' ', '') === sortname) {
			if (sortdir === 'asc') {
				$(element).html(element.innerHTML + ' ↑');
			}
			else {
				$(element).html(element.innerHTML + ' ↓');
			}
		}
	});
}

function parseLastXData(data) {
	var arraysortlines = data.split('\n');
	arraysortlines = arraysortlines.filter(Boolean);
	arraysortlistlines = [];
	for (var i = 0; i < arraysortlines.length; i++) {
		try {
			var resultfields = arraysortlines[i].split(',');
			var parsedsortline = new Object();
			parsedsortline.Time = moment.unix(resultfields[0].trim()).format('YYYY-MM-DD HH:mm:ss');
			parsedsortline.Ping = resultfields[1].trim();
			parsedsortline.Jitter = resultfields[2].trim();
			parsedsortline.LineQuality = resultfields[3].replace('null', '').trim();
			parsedsortline.Target = resultfields[4].replace('null', '').trim();
			parsedsortline.Duration = resultfields[5].replace('null', '').trim();
			arraysortlistlines.push(parsedsortline);
		}
		catch {
			//do nothing,continue
		}
	}
	sortTable(sortname + ' ' + sortdir.replace('desc', '↑').replace('asc', '↓').trim());
}

$.fn.serializeObject = function () {
	var o = customSettings;
	var a = this.serializeArray();
	$.each(a, function () {
		if (o[this.name] !== undefined && this.name.indexOf('connmon') !== -1 && this.name.indexOf('version') === -1 && this.name.indexOf('ipaddr') === -1 && this.name.indexOf('domain') === -1 &&
			this.name.indexOf('schdays') === -1 && this.name.indexOf('pushover_list') === -1 && this.name.indexOf('pushover_list') === -1 && this.name.indexOf('webhook_list') === -1 &&
			this.name !== 'connmon_notifications_pingtest' && this.name !== 'connmon_notifications_pingthreshold' && this.name !== 'connmon_notifications_jitterthreshold' && this.name !== 'connmon_notifications_linequalitythreshold') {
			if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			}
			o[this.name].push(this.value || '');
		}
		else if (this.name.indexOf('connmon') !== -1 && this.name.indexOf('version') === -1 && this.name.indexOf('ipaddr') === -1 && this.name.indexOf('domain') === -1 && this.name.indexOf('schdays') === -1 &&
			this.name.indexOf('pushover_list') === -1 && this.name.indexOf('pushover_list') === -1 && this.name.indexOf('webhook_list') === -1 &&
			this.name !== 'connmon_notifications_pingtest' && this.name !== 'connmon_notifications_pingthreshold' && this.name !== 'connmon_notifications_jitterthreshold' && this.name !== 'connmon_notifications_linequalitythreshold') {
			o[this.name] = this.value || '';
		}
		if (this.name.indexOf('schdays') !== -1) {
			var schdays = [];
			$.each($('input[name="connmon_schdays"]:checked'), function () {
				schdays.push($(this).val());
			});
			var schdaysstring = schdays.join(',');
			if (schdaysstring === 'Mon,Tues,Wed,Thurs,Fri,Sat,Sun') {
				schdaysstring = '*';
			}
			o['connmon_schdays'] = schdaysstring;
		}
		if (this.name === 'connmon_notifications_pingtest') {
			var pingtesttypes = [];
			$.each($('input[name="connmon_notifications_pingtest"]:checked'), function () {
				pingtesttypes.push($(this).val());
			});
			o['connmon_notifications_pingtest'] = pingtesttypes.join(',');
		}
		if (this.name === 'connmon_notifications_pingthreshold') {
			var pingthresholdtypes = [];
			$.each($('input[name="connmon_notifications_pingthreshold"]:checked'), function () {
				pingthresholdtypes.push($(this).val());
			});
			o['connmon_notifications_pingthreshold'] = pingthresholdtypes.join(',');
		}
		if (this.name === 'connmon_notifications_jitterthreshold') {
			var jitterthresholdtypes = [];
			$.each($('input[name="connmon_notifications_jitterthreshold"]:checked'), function () {
				jitterthresholdtypes.push($(this).val());
			});
			o['connmon_notifications_jitterthreshold'] = jitterthresholdtypes.join(',');
		}
		if (this.name === 'connmon_notifications_linequalitythreshold') {
			var linequalitythresholdtypes = [];
			$.each($('input[name="connmon_notifications_linequalitythreshold"]:checked'), function () {
				linequalitythresholdtypes.push($(this).val());
			});
			o['connmon_notifications_linequalitythreshold'] = linequalitythresholdtypes.join(',');
		}
		if (this.name.indexOf('connmon_notifications_email_list') !== -1) {
			o['connmon_notifications_email_list'] = document.getElementById('connmon_notifications_email_list').value.replace(/\n/g, '||||');
		}
		if (this.name.indexOf('connmon_notifications_pushover_list') !== -1) {
			o['connmon_notifications_pushover_list'] = document.getElementById('connmon_notifications_pushover_list').value.replace(/\n/g, '||||');
		}
		if (this.name.indexOf('connmon_notifications_webhook_list') !== -1) {
			o['connmon_notifications_webhook_list'] = document.getElementById('connmon_notifications_webhook_list').value.replace(/\n/g, '||||');
		}
	});

	$.each(this, function () {
		if (this.name.indexOf('schdays') !== -1) {
			var schdays = [];
			$.each($('input[name="connmon_schdays"]:checked'), function () {
				schdays.push($(this).val());
			});
			if (schdays.length === 0) {
				o['connmon_schdays'] = '*';
			}
		}
		if (this.name === 'connmon_notifications_pingtest') {
			var pingtesttypes = [];
			$.each($('input[name="connmon_notifications_pingtest"]:checked'), function () {
				pingtesttypes.push($(this).val());
			});
			if (pingtesttypes.length === 0) {
				o['connmon_notifications_pingtest'] = 'None';
			}
		}
		if (this.name === 'connmon_notifications_pingthreshold') {
			var pingthresholdtypes = [];
			$.each($('input[name="connmon_notifications_pingthreshold"]:checked'), function () {
				pingthresholdtypes.push($(this).val());
			});
			if (pingthresholdtypes.length === 0) {
				o['connmon_notifications_pingthreshold'] = 'None';
			}
		}
		if (this.name === 'connmon_notifications_jitterthreshold') {
			var jitterthresholdtypes = [];
			$.each($('input[name="connmon_notifications_jitterthreshold"]:checked'), function () {
				jitterthresholdtypes.push($(this).val());
			});
			if (jitterthresholdtypes.length === 0) {
				o['connmon_notifications_jitterthreshold'] = 'None';
			}
		}
		if (this.name === 'connmon_notifications_linequalitythreshold') {
			var linequalitythresholdtypes = [];
			$.each($('input[name="connmon_notifications_linequalitythreshold"]:checked'), function () {
				linequalitythresholdtypes.push($(this).val());
			});
			if (linequalitythresholdtypes.length === 0) {
				o['connmon_notifications_linequalitythreshold'] = 'None';
			}
		}
	});
	return o;
};

$.fn.serializeObjectEmail = function () {
	var o = customSettings;
	var a = this.serializeArray();
	$.each(a, function () {
		if (o[this.name] !== undefined && this.name.indexOf('email_') !== -1 && this.name.indexOf('show_pass') === -1) {
			if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			}
			o[this.name].push(this.value || '');
		}
		else if (this.name.indexOf('email_') !== -1 && this.name.indexOf('show_pass') === -1) {
			o[this.name] = this.value || '';
		}
	});
	return o;
};

function setCurrentPage() {
	document.form.next_page.value = window.location.pathname.substring(1);
	document.form.current_page.value = window.location.pathname.substring(1);
}

function parseCSVExport(data) {
	var csvContent = 'Timestamp,Ping,Jitter,LineQuality,PingTarget,PingDuration\n';
	for (var i = 0; i < data.length; i++) {
		var dataString = data[i].Timestamp + ',' + data[i].Ping + ',' + data[i].Jitter + ',' + data[i].LineQuality + ',' + data[i].PingTarget + ',' + data[i].PingDuration;
		csvContent += i < data.length - 1 ? dataString + '\n' : dataString;
	}
	document.getElementById('aExport').href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
}

function errorCSVExport() {
	document.getElementById('aExport').href = 'javascript:alert(\'Error exporting CSV,please refresh the page and try again\')';
}

function jyNavigate(tab, type, tabslength)
{
	for (var i = 1; i <= tabslength; i++)
	{
		if (tab === 0) {
			$('#' + type + 'Navigate' + i).show();
			$('#btn' + type + 'Navigate' + i).css('background', '');
			$('#btn' + type + 'Navigate0').css({ 'background': '#085F96', 'background': '-webkit-linear-gradient(#09639C 0%,#003047 100%)', 'background': '-o-linear-gradient(#09639C 0%,#003047 100%)', 'background': 'linear-gradient(#09639C 0%,#003047 100%)' });
		}
		else {
			if (i === tab) {
				$('#' + type + 'Navigate' + i).show();
				$('#btn' + type + 'Navigate' + i).css({ 'background': '#085F96', 'background': '-webkit-linear-gradient(#09639C 0%,#003047 100%)', 'background': '-o-linear-gradient(#09639C 0%,#003047 100%)', 'background': 'linear-gradient(#09639C 0%,#003047 100%)' });
			}
			else {
				$('#' + type + 'Navigate' + i).hide();
				$('#btn' + type + 'Navigate' + i).css('background', '');
			}
			$('#btn' + type + 'Navigate0').css('background', '');
		}
	}
}

function automaticTestEnableDisable(forminput)
{
	var inputname = forminput.name;
	var inputvalue = forminput.value;
	var prefix = inputname.substring(0, inputname.indexOf('_'));

	var fieldnames = ['schhours', 'schmins'];
	var fieldnames2 = ['schedulemode', 'everyxselect', 'everyxvalue'];

	if (inputvalue === 'false')
	{
		for (var i = 0; i < fieldnames.length; i++)
		{
			$('input[name=' + prefix + '_' + fieldnames[i] + ']').addClass('disabled');
			$('input[name=' + prefix + '_' + fieldnames[i] + ']').prop('disabled', true);
		}
		for (var i = 0; i < daysofweek.length; i++)
		{
			$('#' + prefix + '_' + daysofweek[i].toLowerCase()).prop('disabled', true);
		}
		for (var i = 0; i < fieldnames2.length; i++)
		{
			$('[name=' + fieldnames2[i] + ']').addClass('disabled');
			$('[name=' + fieldnames2[i] + ']').prop('disabled', true);
		}
	}
	else if (inputvalue === 'true')
	{
		for (var i = 0; i < fieldnames.length; i++)
		{
			$('input[name=' + prefix + '_' + fieldnames[i] + ']').removeClass('disabled');
			$('input[name=' + prefix + '_' + fieldnames[i] + ']').prop('disabled', false);
		}
		for (var i = 0; i < daysofweek.length; i++)
		{
			$('#' + prefix + '_' + daysofweek[i].toLowerCase()).prop('disabled', false);
		}
		for (var i = 0; i < fieldnames2.length; i++)
		{
			$('[name=' + fieldnames2[i] + ']').removeClass('disabled');
			$('[name=' + fieldnames2[i] + ']').prop('disabled', false);
		}
	}
}

function scheduleModeToggle(forminput)
{
	var inputname = forminput.name;
	var inputvalue = forminput.value;

	if (inputvalue === 'EveryX')
	{
		showhide('schfrequency', true);
		showhide('schcustom', false);
		if ($('#everyxselect').val() === 'hours')
		{
			showhide('spanxhours', true);
			showhide('spanxminutes', false);
		}
		else if ($('#everyxselect').val() === 'minutes')
		{
			showhide('spanxhours', false);
			showhide('spanxminutes', true);
		}
	}
	else if (inputvalue === 'Custom')
	{
		showhide('schfrequency', false);
		showhide('schcustom', true);
	}
}

function getEmailConfFile()
{
	$.ajax({
		url: '/ext/connmon/email_config.htm',
		dataType: 'text',
		cache: false,
		error: function (xhr) {
			setTimeout(getEmailConfFile, 1000);
		},
		success: function (data) {
			var emailconfigdata = data.split('\n');
			emailconfigdata = emailconfigdata.filter(Boolean);
			emailconfigdata = emailconfigdata.filter(function (item) {
				return item.indexOf('#') === -1;
			});
			for (var i = 0; i < emailconfigdata.length; i++) {
				let settingname = emailconfigdata[i].split('=')[0].toLowerCase();
				let settingvalue = emailconfigdata[i].split('=')[1].replace(/(\r\n|\n|\r)/gm, '').replace(/"/g, '');
				if (settingname.indexOf('emailpwenc') !== -1) {
					continue;
				}
				else {
					eval('document.form.email_' + settingname).value = settingvalue;
				}
			}
		}
	});
}

function getCustomactionInfo()
{
	$.ajax({
		url: '/ext/connmon/customactioninfo.htm',
		dataType: 'text',
		error: function (xhr) {
			setTimeout(getCustomactionInfo, 1000);
		},
		success: function (data) {
			$('#customaction_details').append('\n' + data);
		}
	});
}

function getCustomactionList()
{
	$.ajax({
		url: '/ext/connmon/customactionlist.htm',
		dataType: 'text',
		cache: false,
		error: function (xhr) {
			setTimeout(getCustomactionList, 1000);
		},
		success: function (data) {
			$('#customaction_details').html(data);
			getCustomactionInfo();
		}
	});
}

function getEmailpwFile()
{
	$.ajax({
		url: '/ext/connmon/password.htm',
		dataType: 'text',
		cache: false,
		error: function (xhr) {
			document.formScriptActions.action_script.value = 'start_addon_settings;start_connmoncustomactionlist;start_connmonemailpassword';
			document.formScriptActions.submit();
			setTimeout(getCustomactionList, 10000);
			setTimeout(getEmailpwFile, 10000);
		},
		success: function (data) {
			document.form.email_password.value = data;
			document.formScriptActions.action_script.value = 'start_addon_settings;start_connmondeleteemailpassword';
			document.formScriptActions.submit();
		}
	});
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-05] **/
/**----------------------------------------**/
function getConfigFile()
{
	$.ajax({
		url: '/ext/connmon/config.htm',
		dataType: 'text',
		cache: false,
		error: function (xhr) {
			setTimeout(getConfigFile, 1000);
		},
		success: function (data)
		{
			let settingname, settingvalue;
			var configdata = data.split('\n');
			configdata = configdata.filter(Boolean);

			for (var indx = 0; indx < configdata.length; indx++)
			{
				if (configdata[indx].length === 0 || configdata[indx].match('^[ ]*#') !== null)
				{ continue; }  //Skip comments & empty lines//

				settingname = configdata[indx].split('=')[0];
				settingvalue = configdata[indx].split('=')[1].replace(/(\r\n|\n|\r)/gm,'');

				if (settingname.match(/^JFFS_MSGLOGTIME/) != null)
				{ continue; }  //Skip this config setting// 

				settingname = settingname.toLowerCase();
				if (settingname.indexOf('pingserver') !== -1)
				{
					var pingserver = settingvalue;
					document.form.connmon_pingserver.value = pingserver;
					if (validateIP(document.form.connmon_pingserver))
					{
						document.form.pingtype.value = 0;
						document.form.connmon_ipaddr.value = pingserver;
					}
					else
					{
						document.form.pingtype.value = 1;
						document.form.connmon_domain.value = pingserver;
					}
					document.form.pingtype.onchange();
				}
				else if (settingname.indexOf('schdays') !== -1)
				{
					if (settingvalue === '*')
					{
						for (var i2 = 0; i2 < daysofweek.length; i2++)
						{ $('#connmon_' + daysofweek[i2].toLowerCase()).prop('checked', true); }
					}
					else
					{
						var schdayarray = settingvalue.split(',');
						for (var i2 = 0; i2 < schdayarray.length; i2++)
						{ $('#connmon_' + schdayarray[i2].toLowerCase()).prop('checked', true); }
					}
				}
				else if (settingname === 'notifications_pingtest')
				{
					var pingtesttypearray = settingvalue.split(',');
					for (var i2 = 0; i2 < pingtesttypearray.length; i2++)
					{ $('#connmon_pingtest_' + pingtesttypearray[i2].toLowerCase()).prop('checked', true); }
				}
				else if (settingname === 'notifications_pingthreshold')
				{
					var pingthresholdtypearray = settingvalue.split(',');
					for (var i2 = 0; i2 < pingthresholdtypearray.length; i2++)
					{ $('#connmon_pingthreshold_' + pingthresholdtypearray[i2].toLowerCase()).prop('checked', true); }
				}
				else if (settingname === 'notifications_jitterthreshold')
				{
					var jitterthresholdtypearray = settingvalue.split(',');
					for (var i2 = 0; i2 < jitterthresholdtypearray.length; i2++)
					{ $('#connmon_jitterthreshold_' + jitterthresholdtypearray[i2].toLowerCase()).prop('checked', true); }
				}
				else if (settingname === 'notifications_linequalitythreshold')
				{
					var linequalitythresholdtypearray = settingvalue.split(',');
					for (var i2 = 0; i2 < linequalitythresholdtypearray.length; i2++)
					{ $('#connmon_linequalitythreshold_' + linequalitythresholdtypearray[i2].toLowerCase()).prop('checked', true); }
				}
				else if (settingname.indexOf('notifications_email_list') !== -1 || settingname.indexOf('notifications_pushover_list') !== -1 || settingname.indexOf('notifications_webhook_list') !== -1)
				{
					eval('document.form.connmon_' + settingname).value = settingvalue.replace(/,/g, '\n');
				}
				else
				{
					eval('document.form.connmon_' + settingname).value = settingvalue;
				}
				if (settingname.indexOf('automaticmode') !== -1)
				{
					automaticTestEnableDisable($('#connmon_auto_' + document.form.connmon_automaticmode.value)[0]);
				}
				if (settingname.indexOf('pingduration') !== -1)
				{
					pingtestdur = document.form.connmon_pingduration.value;
				}
			}
			document.getElementById('theDaysToKeepText').textContent = theDaysToKeepTXT;
			document.getElementById('theLastXResultsText').textContent = theLastXResultsTXT;
			document.getElementById('thePingDurationText').textContent = thePingDurationTXT;

			if ($('[name=connmon_schhours]').val().indexOf('/') !== -1 && $('[name=connmon_schmins]').val() * 1 === 0)
			{
				document.form.schedulemode.value = 'EveryX';
				document.form.everyxselect.value = 'hours';
				document.form.everyxvalue.value = $('[name=connmon_schhours]').val().split('/')[1];
			}
			else if ($('[name=connmon_schmins]').val().indexOf('/') !== -1 && $('[name=connmon_schhours]').val() === '*')
			{
				document.form.schedulemode.value = 'EveryX';
				document.form.everyxselect.value = 'minutes';
				document.form.everyxvalue.value = $('[name=connmon_schmins]').val().split('/')[1];
			}
			else
			{
				document.form.schedulemode.value = 'Custom';
			}
			scheduleModeToggle($('#schmode_' + $('[name=schedulemode]:checked').val().toLowerCase())[0]);
		}
	});
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-20] **/
/**----------------------------------------**/
function getStatsTitleFile()
{
	$.ajax({
		url: '/ext/connmon/connstatstext.js',
		dataType: 'script',
		error: function (xhr) {
			setTimeout(getStatsTitleFile, 2000);
		},
		success: function()
		{
			setConnmonStatsTitle();
			document.getElementById('databaseSize_text').textContent = 'Database Size: '+sqlDatabaseFileSize;

			if (jffsAvailableSpaceLow.match(/^WARNING[0-9]/) === null)
			{
				showhide('jffsFreeSpace_LOW',false);
				showhide('jffsFreeSpace_NOTE',false);
				showhide('jffsFreeSpace_WARN',false);
				document.getElementById('jffsFreeSpace_text').textContent = 'JFFS Available: ' + jffsAvailableSpaceStr;
			}
			else
			{
				document.getElementById('jffsFreeSpace_text').textContent = 'JFFS Available: ';
				document.getElementById('jffsFreeSpace_LOW').textContent = jffsAvailableSpaceStr;
				showhide('jffsFreeSpace_LOW',true);
                if (document.form.connmon_storagelocation.value === 'jffs')
				{ showhide('jffsFreeSpace_NOTE',false); showhide('jffsFreeSpace_WARN',true); }
				else
				{ showhide('jffsFreeSpace_WARN',false); showhide('jffsFreeSpace_NOTE',true); }
			}
			if (automaticModeState === 'ENABLED')
			{
				document.getElementById('autoModeState_text').innerHTML =
					'Currently: <span style="margin-left:2px; background-color: #229652; color:#f2f2f2;">&nbsp;ENABLED&nbsp;</span>';
            }
			else
			{
				document.getElementById('autoModeState_text').innerHTML =
					'Currently: <span style="margin-left:2px; background-color: #C81927; color:#f2f2f2;">&nbsp;DISABLED&nbsp;</span>'; 
            }
			if (databaseResetDone === 1)
			{
				currentNoCharts = 0;
				$('#Time_Format').val(getCookie('Time_Format', 'number'));
				redrawAllCharts();
				databaseResetDone += 1;
			}
			setTimeout(getStatsTitleFile, 4000);
		}
	});
}

function getCronFile()
{
	$.ajax({
		url: '/ext/connmon/cron.js',
		dataType: 'text',
		error: function (xhr) {
			setTimeout(getCronFile, 1000);
		},
		success: function (data) {
			document.form.healthcheckio_cron.value = data;
		}
	});
}

function getEmailInfo() {
	$.ajax({
		url: '/ext/connmon/emailinfo.htm',
		dataType: 'text',
		error: function (xhr) {
			setTimeout(getEmailInfo, 1000);
		},
		success: function (data) {
			$('#emailinfo').html(data);
		}
	});
}

function getChangelogFile() {
	$.ajax({
		url: '/ext/connmon/changelog.htm',
		dataType: 'text',
		cache: false,
		error: function (xhr) {
			setTimeout(getChangelogFile, 5000);
		},
		success: function (data) {
			$('#divchangelog').html(data);
		}
	});
}

function getVersionNumber(versiontype) {
	var versionprop;
	if (versiontype === 'local') {
		versionprop = customSettings.connmon_version_local;
	}
	else if (versiontype === 'server') {
		versionprop = customSettings.connmon_version_server;
	}

	if (typeof versionprop === 'undefined' || versionprop === null) {
		return 'N/A';
	}
	else {
		return versionprop;
	}
}

function getVersionChangelogFile() {
	$.ajax({
		url: '/ext/connmon/detect_changelog.js',
		dataType: 'script',
		error: function (xhr) {
			setTimeout(getVersionChangelogFile, 5000);
		},
		success: function () {
			var serverver = getVersionNumber('server');
			$('#connmon_version_server').html('<a style="color:#FFCC00;text-decoration:underline;" href="javascript:void(0);">Updated version available: ' + serverver + '</a>');
			$('#connmon_version_server').on('mouseover', function () { return overlib(changelog, 0, 0); });
			$('#connmon_version_server')[0].onmouseout = nd;
		}
	});
}

function buildLastXTableNoData() {
	var tablehtml = '<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="sortTable">';
	tablehtml += '<tr>';
	tablehtml += '<td colspan="6" class="nodata">';
	tablehtml += 'Data loading...';
	tablehtml += '</td>';
	tablehtml += '</tr>';
	tablehtml += '</table>';
	return tablehtml;
}

function scriptUpdateLayout()
{
	var localver = getVersionNumber('local');
	var serverver = getVersionNumber('server');
	$('#connmon_version_local').text(localver);

	if (localver !== serverver && serverver !== 'N/A')
	{
		if (serverver.indexOf('hotfix') === -1) {
			getVersionChangelogFile();
		}
		else {
			$('#connmon_version_server').text(serverver);
		}
		showhide('connmon_version_server', true);
		showhide('btnChkUpdate', false);
		showhide('btnDoUpdate', true);
	}
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-19] **/
/**----------------------------------------**/
function initial()
{
	setCurrentPage();
	loadCustomSettings();
	show_menu();
	document.formScriptActions.action_script.value = 'start_addon_settings;start_connmoncustomactionlist;start_connmonemailpassword';
	document.formScriptActions.submit();
	setTimeout(getCustomactionList, 10000);
	setTimeout(getEmailpwFile, 10000);
	getConfigFile();
	getEmailConfFile();
	getStatsTitleFile();
	getEmailInfo();
	getCronFile();
	getChangelogFile();
	$('#alternatelayout').prop('checked', AltLayout === 'false' ? false : true);
	$('#sortTableContainer').empty();
	$('#sortTableContainer').append(buildLastXTableNoData());
	d3.csv('/ext/connmon/csv/CompleteResults.htm').then(function (data) { parseCSVExport(data); }).catch(function () { errorCSVExport(); });
	$('#Time_Format').val(getCookie('Time_Format', 'number'));
	redrawAllCharts();
	scriptUpdateLayout();
	showhide('databaseSize_text',true);
	showhide('jffsFreeSpace_text',true);
	showhide('jffsFreeSpace_LOW',false);
	showhide('jffsFreeSpace_WARN',false);
	showhide('jffsFreeSpace_NOTE',false);
	showhide('autoModeState_text',true);
	var starttab = getCookie('StartTab', 'number');
	if (starttab === 0) { starttab = 1; }
	$('#starttab').val(starttab);
	jyNavigate(starttab, '', 5);
	jyNavigate(1, 'Chart', 3);
	jyNavigate(1, 'NotificationType', 4);
	jyNavigate(1, 'NotificationMethod', 6);
}

function setStartTab(dropdown)
{
	setCookie('StartTab', $(dropdown).val());
}

function passChecked(obj, showobj)
{
	switchType(obj, showobj.checked, true);
}

function toggleAlternateLayout(checkbox)
{
	AltLayout = checkbox.checked.toString();
	setCookie('AltLayout', AltLayout);
	sortTable(sortname + ' ' + sortdir.replace('desc', '↑').replace('asc', '↓').trim());
}

function statusUpdate()
{
	$.ajax({
		url: '/ext/connmon/detect_update.js',
		dataType: 'script',
		error: function (xhr) {
			setTimeout(statusUpdate, 1000);
		},
		success: function()
		{
			if (updatestatus === 'InProgress')
			{
				setTimeout(statusUpdate, 1000);
			}
			else
			{
				iziToast.destroy();
				document.getElementById('imgChkUpdate').style.display = 'none';
				showhide('connmon_version_server', true);
				if (updatestatus !== 'None')
				{
					customSettings.connmon_version_server = updatestatus;
					if (updatestatus.indexOf('hotfix') === -1) {
						getVersionChangelogFile();
					}
					else {
						$('#connmon_version_server').text('Updated version available: ' + updatestatus);
					}
					iziToast.warning({ message: 'New version available!' });
					showhide('btnChkUpdate', false);
					showhide('btnDoUpdate', true);
				}
				else
				{
					iziToast.info({ message: 'No updates available' });
					$('#connmon_version_server').text('No updates available');
					showhide('btnChkUpdate', true);
					showhide('btnDoUpdate', false);
				}
			}
		}
	});
}

function checkUpdate()
{
	document.formScriptActions.action_script.value = 'start_addon_settings;start_connmoncheckupdate';
	document.formScriptActions.submit();
	showhide('btnChkUpdate', false);
	document.getElementById('imgChkUpdate').style.display = '';
	iziToast.info({ message: 'Checking for updates...', timeout: false });
	setTimeout(statusUpdate, 2000);
}

function doUpdate()
{
	document.form.action_script.value = 'start_connmondoupdate';
	document.form.action_wait.value = 10;
	showLoading();
	document.form.submit();
}

/**----------------------------------------**/
/** Modified by Martinski W. [2024-Nov-22] **/
/**----------------------------------------**/
function postConnTest()
{
	currentNoCharts = 0;
	$('#Time_Format').val(getCookie('Time_Format', 'number'));
	setTimeout(getStatsTitleFile, 3000);
	setTimeout(redrawAllCharts, 3000);
}

function saveStatus(section)
{
	$.ajax({
		url: '/ext/connmon/detect_save.js',
		dataType: 'script',
		error: function (xhr) {
			setTimeout(saveStatus, 1000, section);
		},
		success: function () {
			if (savestatus === 'InProgress') {
				setTimeout(saveStatus, 1000, section);
			}
			else {
				showhide('imgSave' + section, false);
				if (savestatus === 'Success')
				{
					iziToast.destroy();
					iziToast.success({ message: 'Save successful' });
					showhide('btnSave' + section, true);
					loadCustomSettings();
					if (section === 'Navigate3') { postConnTest(); }
				}
			}
		}
	});
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-08] **/
/**----------------------------------------**/
function saveConfig(section)
{
	switch (section)
	{
		case 'Navigate3':
			if (validateAll())
			{
				var disabledfields = $('#' + section).find('[disabled]');
				disabledfields.prop('disabled', false);

				if (document.form.pingtype.value * 1 === 0)
				{
					document.form.connmon_pingserver.value = document.form.connmon_ipaddr.value;
				}
				else if (document.form.pingtype.value * 1 === 1)
				{
					document.form.connmon_pingserver.value = document.form.connmon_domain.value;
				}
				if (document.form.connmon_automaticmode.value === 'true')
				{
					if (document.form.schedulemode.value === 'EveryX')
					{
						if (document.form.everyxselect.value === 'hours')
						{
							var everyxvalue = document.form.everyxvalue.value * 1;
							document.form.connmon_schmins.value = 0;
							if (everyxvalue === 24)
							{ document.form.connmon_schhours.value = 0; }
							else
							{ document.form.connmon_schhours.value = '*/' + everyxvalue; }
						}
						else if (document.form.everyxselect.value === 'minutes')
						{
							document.form.connmon_schhours.value = '*';
							var everyxvalue = document.form.everyxvalue.value * 1;
							document.form.connmon_schmins.value = '*/' + everyxvalue;
						}
					}
				}
				else
				{
					automaticTestEnableDisable($('#connmon_auto_' + document.form.connmon_automaticmode.value)[0]);
				}
				document.getElementById('amng_custom').value = JSON.stringify($('#' + section).find('input,select,textarea').serializeObject());
				document.formScriptActions.action_script.value = 'start_addon_settings;start_connmonconfig';
				document.formScriptActions.submit();
				disabledfields.prop('disabled', true);
				showhide('btnSave' + section, false);
				showhide('imgSave' + section, true);
				iziToast.info({ message: 'Saving...', timeout: false });
				setTimeout(saveStatus, 5000, section);
			}
			else
			{ return false; }
			break;
		case 'NotificationMethodNavigate1Config':
			var disabledfields = $('#' + section).find('[disabled]');
			disabledfields.prop('disabled', false);
			document.getElementById('amng_custom').value = JSON.stringify($('#table_connmonemailconfig').find('input,select,textarea').serializeObject());
			document.formScriptActions.action_script.value = 'start_addon_settings;start_connmonconfig';
			document.formScriptActions.submit();
			disabledfields.prop('disabled', true);
			showhide('btnSave' + section, false);
			showhide('imgSave' + section, true);
			iziToast.info({ message: 'Saving...', timeout: false });
			setTimeout(saveStatus, 5000, section);
			break;
		case 'NotificationMethodNavigate1Email':
			var disabledfields = $('#' + section).find('[disabled]');
			disabledfields.prop('disabled', false);
			document.getElementById('amng_custom').value = JSON.stringify($('#table_emailconfig').find('input,select,textarea').serializeObjectEmail());
			document.formScriptActions.action_script.value = 'start_addon_settings;start_connmonemailconfig';
			document.formScriptActions.submit();
			disabledfields.prop('disabled', true);
			showhide('btnSave' + section, false);
			showhide('imgSave' + section, true);
			iziToast.info({ message: 'Saving...', timeout: false });
			setTimeout(saveStatus, 5000, section);
			break;
		default:
			var disabledfields = $('#' + section).find('[disabled]');
			disabledfields.prop('disabled', false);
			document.getElementById('amng_custom').value = JSON.stringify($('#' + section).find('input,select,textarea').serializeObject());
			document.formScriptActions.action_script.value = 'start_addon_settings;start_connmonconfig';
			document.formScriptActions.submit();
			disabledfields.prop('disabled', true);
			showhide('btnSave' + section, false);
			showhide('imgSave' + section, true);
			iziToast.info({ message: 'Saving...', timeout: false });
			setTimeout(saveStatus, 5000, section);
			break;
	}
}

function getConntestResultFile()
{
	$.ajax({
		url: '/ext/connmon/ping-result.htm',
		dataType: 'text',
		cache: false,
		error: function (xhr) {
			setTimeout(getConntestResultFile, 500);
		},
		success: function (data) {
			var lines = data.trim().split('\n');
			data = lines.join('\n');
			$('#conntest_output').html(data);
			document.getElementById('conntest_output').parentElement.parentElement.style.display = '';
		}
	});
}

function testStatus(testname)
{
	$.ajax({
		url: '/ext/connmon/detect_test.js',
		dataType: 'script',
		error: function (xhr) {
			setTimeout(testStatus, 1000, testname);
		},
		success: function ()
		{
			if (teststatus === 'InProgress')
			{
				setTimeout(testStatus, 1000, testname);
			}
			else
			{
				showhide('img' + testname, false);
				iziToast.destroy();
				showhide('btn' + testname, true);
				if (teststatus === 'Success') {
					iziToast.success({ message: 'Test successful' });
				}
				else {
					iziToast.error({ message: 'Test failed - please check configuration' });
				}
			}
		}
	});
}

function testNotification(testname)
{
	if (confirm('If you have made any changes, you will need to save them first. Do you want to continue?'))
	{
		showhide('btn' + testname, false);
		document.formScriptActions.action_script.value = 'start_addon_settings;start_connmon' + testname;
		document.formScriptActions.submit();
		showhide('img' + testname, true);
		setTimeout(testStatus, 1000, testname);
		iziToast.info({ message: 'Running test...', timeout: false });
	}
}

function everyXToggle (forminput)
{
	var inputname = forminput.name;
	var inputvalue = forminput.value;

	if (inputvalue === 'hours')
	{
		showhide('spanxhours', true);
		showhide('spanxminutes', false);
	}
	else if (inputvalue === 'minutes')
	{
		showhide('spanxhours', false);
		showhide('spanxminutes', true);
	}
	validateScheduleValue($('[name=everyxvalue]')[0]);
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Jul-20] **/
/**----------------------------------------**/
var pingcount = 2;
function updateConntest()
{
	pingcount++;
	$.ajax({
		url: '/ext/connmon/detect_connmon.js',
		dataType: 'script',
		error: function (xhr) {
			//do nothing
		},
		success: function()
		{
			if (connmonstatus === 'InProgress')
			{
				showhide('imgConnTest', true);
				showhide('conntest_text', true);
				$('#conntest_text').html('Ping test in progress - ' + pingcount + 's elapsed');
			}
			else if (connmonstatus === 'GenerateCSV')
			{
				$('#conntest_text').html('Retrieving data for charts...');
			}
			else if (connmonstatus === 'Done')
			{
				clearInterval(myinterval);
				if (intervalclear === false)
				{
					intervalclear = true;
					pingcount = 2;
					getConntestResultFile();
					$('#conntest_text').html('Refreshing charts...');
					postConnTest();
				}
			}
			else if (connmonstatus === 'LOCKED')
			{
				pingcount = 2;
				clearInterval(myinterval);
				showhide('imgConnTest', false);
				$('#conntest_text').html('Scheduled ping test already running!');
				showhide('conntest_text', true);
				showhide('btnRunPingtest', true);
				document.getElementById('conntest_output').parentElement.parentElement.style.display = 'none';
				iziToast.destroy();
				iziToast.error({ message: 'Ping test failed - scheduled ping test already running!' });
			}
			else if (connmonstatus === 'InvalidServer')
			{
				pingcount = 2;
				clearInterval(myinterval);
				showhide('imgConnTest', false);
				$('#conntest_text').html('Specified ping server is not valid');
				showhide('conntest_text', true);
				showhide('btnRunPingtest', true);
				document.getElementById('conntest_output').parentElement.parentElement.style.display = 'none';
				iziToast.destroy();
				iziToast.error({ message: 'Ping test failed - Specified ping server is not valid' });
			}
			else if (connmonstatus === 'Error')
			{
				pingcount = 2;
				clearInterval(myinterval);
				showhide('imgConnTest', false);
				$('#conntest_text').html('Error when running ping test');
				showhide('conntest_text', true);
				showhide('btnRunPingtest', true);
				document.getElementById('conntest_output').parentElement.parentElement.style.display = 'none';
				iziToast.destroy();
				iziToast.error({ message: 'Ping test failed - WAN interface may be down' });
			}
		}
	});
}

function startConnTestInterval()
{
	intervalclear = false;
	pingtestrunning = true;
	myinterval = setInterval(updateConntest, 1000);
}

/**----------------------------------------**/
/** Modified by Martinski W. [2024-Nov-22] **/
/**----------------------------------------**/
function runPingTest()
{
	showhide('btnRunPingtest', false);
	showhide('databaseSize_text',false);
	$('#conntest_output').html('');
	document.getElementById('conntest_output').parentElement.parentElement.style.display = 'none';
	document.formScriptActions.action_script.value = 'start_addon_settings;start_connmon';
	document.formScriptActions.submit();
	showhide('imgConnTest', true);
	showhide('conntest_text', false);
	setTimeout(startConnTestInterval, 5000);
	iziToast.info({ message: 'Ping test started', timeout: false });
}

function changeAllCharts(e)
{
	value = e.value * 1;
	name = e.id.substring(0, e.id.indexOf('_'));
	setCookie(e.id, value);
	for (var i = 0; i < metriclist.length; i++)
	{
		drawChart(metriclist[i], titlelist[i], measureunitlist[i], bordercolourlist[i], backgroundcolourlist[i]);
	}
}

function changeChart(e)
{
	value = e.value * 1;
	name = e.id.substring(0, e.id.indexOf('_'));
	setCookie(e.id, value);

	if (name === 'Ping')
	{
		drawChart('Ping', titlelist[0], measureunitlist[0], bordercolourlist[0], backgroundcolourlist[0]);
	}
	else if (name === 'Jitter')
	{
		drawChart('Jitter', titlelist[1], measureunitlist[1], bordercolourlist[1], backgroundcolourlist[1]);
	}
	else if (name === 'LineQuality')
	{
		drawChart('LineQuality', titlelist[2], measureunitlist[2], bordercolourlist[2], backgroundcolourlist[2]);
	}
}
