(function(){

	eedt.ready(function($, eedt){
		eedt.loadScript("https://www.google.com/jsapi?callback=EedtMemoryHistoryJSAPIReady");
	});

})();

function EedtMemoryHistoryJSAPIReady(){

	//Fetch data and load visualisation lib in parallel
	var deferreds = [
		eedt.ajax('Eedt_memory_history_ext', 'fetch_memory_and_sql_usage'),
		new jQuery.Deferred()
	];

	google.load("visualization", "1", {
		packages:["corechart"],
		callback: function(){
			deferreds[1].resolve();
		}
	});

	jQuery.when.apply(jQuery, deferreds).then(drawChart);


	//Draw chart
	function drawChart(ajaxData) {
		var series = parseData(ajaxData);


		var data = new google.visualization.DataTable();
		data.addColumn('string', 'URL');
		data.addColumn('number', 'Memory Usage');
		data.addColumn('number', 'SQL Query Count');
		data.addRows(series);


		var options = {
			title: "Peak Memory & SQL Query Count",
			titlePosition: 'out',
			titleTextStyle : {
				color:'#fff'
			},
			legend: 'none',
			backgroundColor:'#032f4f',
			colors: ['#e46c63', '#8be47d'],
			chartArea : {
				top:20,
				left:0,
				width:250,
				height:200
			},
			vAxis : {
				baselineColor: '#032f4f',
				gridlines : {
					count: 10,
					color:'#0e4a85'
				}
			}
		};

		var chart = new google.visualization.LineChart(document.getElementById('Eedt_memory_history_chart'));
		chart.draw(data, options);

		google.visualization.events.addListener(chart, 'select', function (e) {
			window.location = data.getValue(chart.getSelection()[0].row, 0);
		});
	}

	function parseData(data) {
		var parsedData = [],
			memMax = false,
			sqlMax = false;

		//Calculate max so we can normalise
		for(var i = 0; i < data.length; i++){

			data[i].peak_memory = Number(data[i].peak_memory);
			data[i].sql_count = Number(data[i].sql_count);

			if(memMax === false) {
				memMax = data[i].peak_memory;
			}
			if(sqlMax === false) {
				sqlMax = data[i].sql_count;
			}

			if(data[i].peak_memory > memMax) {
				memMax = data[i].peak_memory;
			}

			if(data[i].sql_count > sqlMax) {
				sqlMax = data[i].sql_count;
			}
		}

		for(var i = 0; i < data.length; i++){
			parsedData.push(
				[
					data[i].url,
					{
						v: (data[i].peak_memory / memMax) + 0.3,
						f: String(data[i].peak_memory) + "MB"
					},
					{
						v: data[i].sql_count / sqlMax,
						f: String(data[i].sql_count) + " queries"
					}
				]
			);
		}

		return parsedData;
	}
}

