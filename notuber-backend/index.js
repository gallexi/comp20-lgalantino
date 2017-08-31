var cool = require('cool-ascii-faces');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var mongoUri = process.env.MONGODB_URI || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
    db = databaseConnection;
});

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
// See https://stackoverflow.com/questions/5710358/how-to-get-post-query-in-express-node-js
app.use(bodyParser.json());
// See https://stackoverflow.com/questions/25471856/express-throws-error-as-body-parser-deprecated-undefined-extended
app.use(bodyParser.urlencoded({ extended: true })); // Required if we need to use HTTP query or post parameters


//taken from https://enable-cors.org/server_expressjs.html
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


app.post('/submit', function(request, response){
    response.set('Content-Type', 'application/json');
    
    var vehicles = ['JANET','ilFrXqLz', 't4wcLoCT', 'WnVPdTjF', '1fH5MXna', '4aTtB30R', '8CXROgIF', 'w8XMS577', 'ZywrOTLJ', 'cQRzspF5', 'GSXHB9L1', 'TztAkR2g', 'aSOqNo4S', 'ImjNJW4n', 'svEQIneI', 'N10SCqi5', 'QQjjwwH2', 'H0pfmYGr', 'FyUHoAvS', 'bgULOMsX', 'OlOBzZF8', 'Ln7b7ODx', 'ZoxN11Sa', 'itShXf78', 'o6kJKzyI', 'pD0kGOax', 'njr1i7xM', 'wtDRzig8', 'l2r8bViT', 'oZn3b2OZ', 'ym2J1vil'];

    var username = request.body.username;
    var self = 'vehicles';
    var other = 'passengers';
    var lat = parseFloat(request.body.lat);
    var lng = parseFloat(request.body.lng);
    if(!(username) || isNaN(lat) || isNaN(lng))
	response.send('{"error":"Whoops, something is wrong with your data!"}');
    else{
	var toInsert = {
	    "username": username,
	    "lat": lat,
	    "lng": lng,
	    "created_at":new Date()
	}

	var fiveMinutesAgo = new Date(new Date().getTime() - 1000 * 60 * 5);
	
	if(vehicles.indexOf(username) === -1){
	    self = 'passengers';
	    other = 'vehicles';
	}
	db.collection(self, function(error, coll) {
	    if(error)
		response.send(500);
	    else
		coll.update({username: { $eq: username}}, toInsert,
			    {upsert: true});
	});
	db.collection(other, function(error, coll) {	    
	    if(error)
		response.send(500);
	    else {
		coll.find({created_at: { $gt: fiveMinutesAgo }}).toArray(
		    function(err, results) {
			if (!err) {
			    var json = {}
			    json[other]=results;
			    response.send(json);
			} else {
			    response.send(500);
			}
		    });
	    }
	});
    }
});

app.get('/vehicle.json', function(request, response){
    response.set('Content-Type', 'application/json');
    var username = request.query.username;
    db.collection('vehicles', function(error, coll){
	if(error)
	    response.sendStatus(500);
	else {
	    coll.find({username: {$eq: username}}).toArray(function (err, results){
		if (!err) {
		    if (results.length == 0){
			response.send({});
		    }
		    else{
			response.send(results[0]);
		    }
		} else {
		    response.send(500);
		}
	    });
		
	}
    });
});

app.get('/', function(request, response){
    response.set('Content-Type', 'text/html');
    db.collection('passengers', function(error, coll){
	if(error)
	    response.send(500);
	else {	    
	    coll.find().toArray(
		function(err, results) {
		    if (!err) {
			results = results.sort(function(p1,p2){
			    return p2.created_at - p1.created_at;});
			response.render('pages/index', {passengers: results});
		    } else {
			response.send(500);
		    }
		});
	}
    }); 
});
