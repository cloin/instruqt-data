//////////
// Objective: Create a datasource for reporting on the success of individual Instruqt tracks.
// This script should have an associated trigger to collect insights data on all production
// tracks every 7 days and append the collected data to the google sheet this script is 
// attached to. There are functions at the bottom for collecting historic data every 7 days
// starting today - 365 days and ending today.
//////////

////////// Configuration //////////
var graphqlUrl = 'https://play.instruqt.com/graphql';
var teamId = "<your-team-id>";

var requestHeaders = {
  "Authorization": "Bearer <your-token>",
  "Content-Type": "application/json"
};

var requestOptions = {
  'method': 'POST',
  'headers': requestHeaders,
  // 'payload' will be set within each function
};
///////////////////////////////////


function getTrackIds() {
  // Set up the GraphQL request
  // Query all tracks owned by teamId. Return team name, track slug, track id, track maintenance mode
  var query = `
    query teamTracks {
      team(teamID: "${teamId}") {
        name
        tracks {
          slug
          id
          maintenance
        }
      }
    }
  `;

  requestOptions.payload = JSON.stringify({ query: query });

  var response = UrlFetchApp.fetch(graphqlUrl, requestOptions);
  var data = JSON.parse(response.getContentText());
  
  // Extract track IDs with maintenance flag false
  var tracks = data.data.team.tracks;
  var trackIds = tracks.filter(track => !track.maintenance).map(track => track.id);
  
  Logger.log(trackIds);
  return trackIds;
}

function getTrackInsights() {
  var trackIds = getTrackIds();
  
  // Get today's date
  var toDate = new Date();
  var toDateString = toDate.toISOString().slice(0, 19) + "Z";
  
  // Get the date 7 days before today
  var fromDate = new Date();
  fromDate.setDate(toDate.getDate() - 7);
  var fromDateString = fromDate.toISOString().slice(0, 19) + "Z";
  
  // Set up the GraphQL request
  // Query all track insights by team within date range. Return track slug, permalink
  // and current period insights included total plays, learners reached, time spent,
  // completion rate, and average review score over date range
  var query = `
    query teamtrackInsights {
      team(teamID: "${teamId}") {
        name
        insights {
          track {
            page(input: {
              trackIds: ${JSON.stringify(trackIds)},
              playType: ALL,
              dateRangeFilter: {
                from: "${fromDateString}",
                to: "${toDateString}"
              }
            }) {
              items {
                track {
                  slug
                  permalink
                }
                currentPeriod {
                  plays
                  learnersReached
                  timeSpent
                  completionRate
                  averageReviewScore
                }
              }
            }
          }
        }
      }
    }
  `;
  
  requestOptions.payload = JSON.stringify({ query: query });
  
  var response = UrlFetchApp.fetch(graphqlUrl, requestOptions);
  var data = JSON.parse(response.getContentText());

  Logger.log(fromDateString);
  Logger.log(data);
  
  var sheet = SpreadsheetApp.getActiveSheet();
  var items = data.data.team.insights.track.page.items;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var track = item.track;
    var currentPeriod = item.currentPeriod;
    
    // Create a row of data for this track
    var row = [
      fromDateString,  // Collection date
      teamId,
      track.slug,
      track.permalink,
      currentPeriod.plays,
      currentPeriod.learnersReached,
      currentPeriod.timeSpent,
      currentPeriod.completionRate,
      currentPeriod.averageReviewScore
    ];
    
    // Append the row to the Google Sheet
    sheet.appendRow(row);
  }

}


/////////
// populateHistoricalData() can be used to fetch all week to week data across all tracks
// marked `maintenance: false` to grab a years worth of weekly insights data by track
/////////



function populateHistoricalData() {
  var today = new Date();
  var oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  var currentStartDate = oneYearAgo;
  var currentEndDate = new Date(oneYearAgo);
  currentEndDate.setDate(currentStartDate.getDate() + 7);
  
  while (currentEndDate <= today) {
    var fromDateString = currentStartDate.toISOString().slice(0, 19) + "Z";
    var toDateString = currentEndDate.toISOString().slice(0, 19) + "Z";
    
    collectAndLogData(fromDateString, toDateString);
    
    // Move to the next week
    currentStartDate.setDate(currentStartDate.getDate() + 7);
    currentEndDate.setDate(currentEndDate.getDate() + 7);
  }
}

function collectAndLogData(fromDateString, toDateString) {
  var trackIds = getTrackIds();
  // Set up the GraphQL request
  // Query all track insights by team within date range. Return track slug, permalink
  // and current period insights included total plays, learners reached, time spent,
  // completion rate, and average review score over date range
  var query = `
    query teamtrackInsights {
      team(teamID: "${teamId}") {
        name
        insights {
          track {
            page(input: {
              trackIds: ${JSON.stringify(trackIds)},
              playType: ALL,
              dateRangeFilter: {
                from: "${fromDateString}",
                to: "${toDateString}"
              }
            }) {
              items {
                track {
                  slug
                  permalink
                }
                currentPeriod {
                  plays
                  learnersReached
                  timeSpent
                  completionRate
                  averageReviewScore
                }
              }
            }
          }
        }
      }
    }
  `;
  
  requestOptions.payload = JSON.stringify({ query: query });
  
  var response = UrlFetchApp.fetch(graphqlUrl, requestOptions);
  var data = JSON.parse(response.getContentText());
  
  var sheet = SpreadsheetApp.getActiveSheet();
  
  var items = data.data.team.insights.track.page.items;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var track = item.track;
    var currentPeriod = item.currentPeriod;
    
    // Create a row of data for this track
    var row = [
      fromDateString,  // Collection date
      teamId,
      track.slug,
      track.permalink,
      currentPeriod.plays,
      currentPeriod.learnersReached,
      currentPeriod.timeSpent,
      currentPeriod.completionRate,
      currentPeriod.averageReviewScore
    ];
    
    // Append the row to the Google Sheet
    sheet.appendRow(row);
  }
}
