var _data = {};
var _title_text = {};
var small_chart_height = 180;

var donut_inner = 40
var donut_outer = 80
var donut_height = 180

var valueAccessor =function(d){return d.value < 1 ? 0 : d.value}
var month = {January  : 1,
             February : 2,
             March    : 3,
             April    : 4,
             May      : 5,
             June     : 6,
             July     : 7,
             August   : 8,
             September: 9,
             October  : 10,
             November : 11,
             December : 12
            }
var age_charts;

var getkeys;
//---------------------CLEANUP functions-------------------------

function cleanup(d) {


  d.date = d['Month and year'].split(' ')
  d.year = +d.date[1]
  d.month = month[d.date[0]]
  var age = d.Age.split(' ')
  d.Age_Group = age[1]+'-'+age[3]
  d.sexAge = d.Sex + ', '+ d.Age_Group
  d.Count = +d.Value
  
  return d;
}


//---------------------------crossfilter reduce functions---------------------------

// we only use the built in reduceSum(<what we are summing>) here

//----------------------------Accessor functions-------------------------------------

// because we are only using default reduce functions, we don't need any accessor functions either 

//-------------------------Load data and dictionaries ------------------------------

//Here queue makes sure we have all the data from all the sources loaded before we try and do anything with it. It also means we don't need to nest D3 file reading loops, which could be annoying. 

queue()
    .defer(d3.csv,  "data/child_victims_of_assault 20140108.csv")
    .defer(d3.csv,  "dictionaries/titles.csv")
    .await(showCharts);

function showCharts(err, data, title_text) {

//We use dictionary .csv's to store things we might want to map our data to, such as codes to names, names to abbreviations etc.
  
//titles.csv is a special case of this, allowing for the mapping of text for legends and titles on to the same HTML anchors as the charts. This allows clients to update their own legends and titles by editing the csv rather than monkeying around in the .html or paying us to monkey around with the same.    
  
  var councilNames = [];
  
  for (i in title_text){
        entry = title_text[i]
        //trimAll(entry)
        name = entry.id
        _title_text[name]=entry;     
  }
  

  for (i in data) {
    data[i] = cleanup(data[i]);
  }
  _data = data;

 
//------------Puts legends and titles on the chart divs and the entire page---------------   
  apply_text(_title_text)

//---------------------------------FILTERS-----------------------------------------
  ndx = crossfilter(_data); // YAY CROSSFILTER! Unless things get really complicated, this is the only bit where we call crossfilter directly. 

//--------------------------Count of records---------------------------------------  
  
  
//  dc.dataCount(".dc-data-count")
//    .dimension(ndx)
//    .group(ndx.groupAll());  
  
//---------------------------ORDINARY CHARTS --------------------------------------
  year = ndx.dimension(function(d){return d.year+d.month/12});
  year_group = year.group().reduceSum(function(d){return d.Count});
 
  
  year_chart = dc.barChart('#year')
    .dimension(year)
    .group(year_group)
    .valueAccessor(valueAccessor)
    //.ordering(function(d){return d.year+0.01*d.month})
    .x(d3.scale.linear().domain([2014.5,2016]))
    .xUnits(dc.units.fp.precision(1/12))
    .transitionDuration(200)
    .height(small_chart_height)
    .colors(default_colors)
    .elasticX(false)
    .elasticY(true)
    .centerBar(true)
   
  
  
  format = function(d){ y = Math.floor(d)
                        m = Math.round(12*(d-y)+1)
                        return m+'/'+y
                      }
  year_chart.xAxis().ticks(4).tickFormat(format);
  year_chart.yAxis().ticks(4).tickFormat(integer_format)

  age = ndx.dimension(function(d) {return d.sexAge});
  age_group = age.group().reduceSum(function(d){return d.Count})
   
//
  age_chart = dc.pyramidChart('#tree')
    .dimension(age)
    .group(age_group)
    .data(function(d){return _.filter(d.all(), function(d){return d.key.length < 15})})
    .valueAccessor(valueAccessor)
    .colors(d3.scale.ordinal().range([our_colors[1],our_colors[3]]))
    .colorAccessor(function(d){return d.key[0]})
    .leftColumn(function(d){return d.key[0] == 'M'}) // return true if entry is to go in the left column. Defaults to i%2 == 0, i.e. every second one goes to the right.
   .rowAccessor(function(d){return +d.key.split(' ')[1].split('-')[0]}) // return the row the group needs to go into.
    .height(small_chart_height)
    //.title(function(d,i){return i})
    .label(function(d){return d.key.split(' ')[1]})
    .elasticX(true)
    //.labelOffsetX(20)
    .twoLabels(false)// defaults to true. if false, .label defaults to .rowAccessor
    .columnLabels(['Male','Female'])
    .columnLabelPosition([0,125]) //[in,down], in pix. defaults to [5,10]
    .transitionDuration(200)
  
    age_chart.xAxis().ticks(7).tickFormat(function(x) {return integer_format(Math.abs(x))})
    
  offence = ndx.dimension(function(d){return d.Offence});
  offence_group = offence.group().reduceSum(function(d){return d.Count});
 
  offence_chart = dc.rowChart('#offence')
    .dimension(offence)
    .group(offence_group)
    .valueAccessor(valueAccessor)
    .transitionDuration(200)
    .height(small_chart_height)
    .colors(default_colors)
    .elasticX('true')
    .ordering(function(d){return -d.value})
    
  offence_chart.xAxis().ticks(4).tickFormat(integer_format)
  
  ethnicity = ndx.dimension(function(d){return d.Ethnicity});
  ethnicity_group = ethnicity.group().reduceSum(function(d){return d.Count});
 
  ethnicity_chart = dc.rowChart('#ethnicity')
    .dimension(ethnicity)
    .group(ethnicity_group)
    .valueAccessor(valueAccessor)
    .transitionDuration(200)
    .height(small_chart_height)
    .colors(default_colors)
    .elasticX('true')
    .ordering(function(d){return -d.value})
  
  ethnicity_chart.xAxis().ticks(4).tickFormat(integer_format)
      
 

  
  dc.renderAll()

}
