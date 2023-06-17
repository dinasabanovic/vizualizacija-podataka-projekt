(function (d3, topojson) {

    var width=screen.width;
    var height=500;
  
    var svg = d3.select('#worldmap').attr("width",width*0.6).attr("height", height);
    const projection = d3.geoEquirectangular();
    const pathGenerator = d3.geoPath().projection(projection);
  
    var g = svg.append('g');
  
    svg.call(d3.zoom().on('zoom', () => {
      g.attr('transform', d3.event.transform);
    }));

    const chooseMapCategory = d3.select('#mapCategories');
    const chooseChartCategory = d3.select('#chartCategories');
  
    Promise.all([
      d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/110m.tsv'),
      d3.json('https://unpkg.com/world-atlas@1.1.4/world/110m.json'),
      d3.json('NobelPrizeWinners.json')
    ]).then(([tsvData, topoJSONdata, nobelData]) => {
  
      const countryName = {};
      tsvData.forEach(d => {
        countryName[d.iso_n3] = d.name;
      });
  
      const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);
      g.selectAll('path')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', pathGenerator)
            .style('transition', "all 0.5s ease-in-out")
            .attr('fill', function(d) {
                var country = nobelData.find(winner => winner.bornCountry == countryName[d.id]);
                if(country) {
                    return colorFunction(d);
                } else {
                    return "#ccc";
                }
            })
            .on("click", onClickAll)
            .append('title').text(d => countryName[d.id]);

      chooseMapCategory.on("change", () => {
        d3.select("#textContainer").html("");
        const chosenMapCategory = chooseMapCategory.property('value');
        updateMap(chosenMapCategory);
      });

      function updateMap(chosenMapCategory) {
        if(chosenMapCategory == "all") {
            g.selectAll('path')
            .attr('fill', function(d) {
                var country = nobelData.find(winner => winner.bornCountry == countryName[d.id]);
                if(country) {
                    return colorFunction(d);
                } else {
                    return "#ccc";
                }
            })
            .on("click", onClickAll)
        } else {
            g.selectAll('path')
            .attr('fill', function(d) {
                var country = nobelData.find(winner => winner.bornCountry == countryName[d.id] && winner.category == chosenMapCategory);
                if(country) {
                    return colorFunction(d);
                } else {
                    return "#ccc";
                }
            })
            .on("click", onClickCategory);
        }
      }

    chooseChartCategory.on("change", () => {
        const chosenChartCategory = chooseChartCategory.property('value');
        updateCharts(chosenChartCategory);
    });

    updateCharts("all");
    
    function updateCharts(chosenChartCategory) {
        d3.select("#densitychart").selectAll('*').remove();
        d3.select("#piechart").selectAll('*').remove();
      
        var piechartWidth = 500;
        var piechartHeight = 500;
        var piechart = d3.select("#piechart").attr("width", piechartWidth).attr("height", piechartHeight);
      
        var men = 0;
        var women = 0;
      
        if (chosenChartCategory === "all") {
          nobelData.forEach(winner => {
            if (winner.gender == "male") {
              men++;
            }
            if (winner.gender == "female") {
              women++;
            }
          });
        } else {
          nobelData.forEach(winner => {
            if (winner.gender == "male" && winner.category == chosenChartCategory) {
              men++;
            }
            if (winner.gender == "female" && winner.category == chosenChartCategory) {
              women++;
            }
          });
        }
      
        var chartData = [
          { gender: "Male", value: men },
          { gender: "Female", value: women }
        ];
      
        var radius = Math.min(piechartWidth, piechartHeight) / 2.5;
        var cg = piechart.append("g").attr("transform", "translate(" + piechartWidth / 2 + "," + piechartHeight / 2 + ")");
      
        var color = d3.scaleOrdinal(['#4169E1', '#DB7093']);
      
        // Generate the pie
        var pie = d3.pie().value(function (d) { return d.value });
      
        // Generate the arcs
        var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
      
        // Generate groups
        var arcs = cg.selectAll("g.pie")
          .data(pie(chartData))
          .enter()
          .append("g")
          .attr("class", "pie")
          .on("mouseover", function(d) {
            var percentage = Math.round((d.data.value / (men + women)) * 100);
            d3.select(this).style("fill-opacity", 0.9);
            d3.select(this).select("text").text(percentage + "%");
          })
          .on("mouseout", function(d) {
            d3.select(this).style("fill-opacity", 1);
            d3.select(this).select("text").text(d.data.gender);
          });
      
        // Draw arc paths
        arcs.append("path")
          .attr("fill", function (d, i) {
            return color(i);
          })
          .attr("d", arc);
      
        arcs.append("text")
          .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
          .attr("text-anchor", "middle")
          .attr("fill", "#fff")
          .text(function (d, i) { return chartData[i].gender });
      
        piechart.append("text")
          .attr("x", (piechartWidth / 2))
          .attr("y", 15)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text("Nobel Prize Awardees by Gender");
      
        var margin = { top: 30, right: 30, bottom: 30, left: 50 },
          dwidth = 500 - margin.left - margin.right,
          dheight = 440 - margin.top - margin.bottom;
      
        var densitychart = d3.select("#densitychart").attr("width", dwidth + margin.left + margin.right + 50)
          .attr("height", dheight + margin.top + margin.bottom + 50)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      
        // Add the x Axis
        var x = d3.scaleLinear()
          .domain([0, 100])
          .range([0, dwidth]);
      
        densitychart.append("g")
          .attr("transform", "translate(0," + dheight + ")")
          .call(d3.axisBottom(x));
      
        // Add the y Axis
        var y = d3.scaleLinear()
          .domain([0, 0.05])
          .range([dheight, 0])
      
        densitychart.append("g")
          .call(d3.axisLeft(y));
      
        // Compute kernel density estimation
        const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(100));
      
        var filteredNobelData = nobelData;
        if (chosenChartCategory !== "all") {
          filteredNobelData = nobelData.filter(winner => winner.category == chosenChartCategory);
        }
      
        const density = kde(filteredNobelData.map(function (d) { return d.age; }));
      
        // Plot the area
        densitychart.append("path")
          .attr("class", "mypath")
          .datum(density)  
          .attr("fill", "#eb8e84")
          .attr("opacity", ".8")
          .attr("stroke", "#000")
          .attr("stroke-width", 1)
          .attr("stroke-linejoin", "round")
          .attr("d", d3.line()
            .curve(d3.curveBasis)
            .x(function (d) { return x(d[0]); })
            .y(function (d) { return y(d[1]); }));
      
        // X axis label
        densitychart.append("text")
          .attr("text-anchor", "middle")
          .attr("x", dwidth - 210)
          .attr("y", dheight + margin.top)
          .text("age");
      
        // Y axis label
        densitychart.append("text")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("y", -margin.left + 10)
          .attr("x", -margin.top - 150)
          .text("density");
      
        // Title
        densitychart.append("text")
          .attr("x", (dwidth / 2))
          .attr("y", 0 - (margin.top / 2))
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text("Age Distribution of Nobel Prize Awardees");

      }

// Function to compute density
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(function(x) {
            return [x, d3.mean(V, function(v) { return kernel(x - v); })];
        });
    };
}

function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}
    
      function onClickAll(d) {
          var names = [];
          var surnames = [];
          var categories = [];
          var years = [];
          nobelData.forEach(winner => {
              if(winner.bornCountry == countryName[d.id]) {
                  names.push(winner.firstname);
                  surnames.push(winner.surname);
                  categories.push(winner.category);
                  years.push(winner.year);
              }
          });
          let text = "";
          for (let i = 0; i < names.length; i++) {
              text += (i+1) + '. ' + names[i] + ' ' + surnames[i] + ' for ' + categories[i] + ' in ' + years[i] + '<br>';
          }
          d3.select("#textContainer").html(text);
      }

      function onClickCategory(d) {
        const chosenMapCategory = chooseMapCategory.property('value');
        var names = [];
        var surnames = [];
        var years = [];
        nobelData.forEach(winner => {
            if(winner.bornCountry == countryName[d.id] && winner.category == chosenMapCategory) {
                names.push(winner.firstname);
                surnames.push(winner.surname);
                years.push(winner.year);
            }
        });
        let text = "";
        for (let i = 0; i < names.length; i++) {
            text += (i+1) + '. ' + names[i] + ' ' + surnames[i] + ' in ' + years[i] + '<br>';
        }
        d3.select("#textContainer").html(text);
    }

  
      function colorFunction(d) {
        var colorScale = d3.scaleOrdinal()
        .domain([1, 274])
        .range(["#F5B7B1", "#943126", "#EC7063"]);
  
        var winnerCount;
        winnerCount = 0;
        nobelData.forEach(winner => {
          if(winner.bornCountry === countryName[d.id]) {
            winnerCount++;
          }
      });
      return colorScale(winnerCount) 
      }
  });
  
  }(d3, topojson));