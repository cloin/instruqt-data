# Instruqt Track Insights Collector

The objective of this script is to create a datasource for reporting on the success of individual Instruqt tracks. The script is designed to collect insights data on all production tracks every 7 days and append the collected data to the associated Google Sheet. The data collection is triggered weekly. Additionally, there are functions provided to collect historic data for every 7 days starting from 365 days ago until today.

## Configuration
Replace `<your-team-id>` and `<your-token>` with your actual team ID and authorization token.
```javascript
const graphqlUrl = 'https://play.instruqt.com/graphql';
const teamId = "<your-team-id>";

const requestHeaders = {
  "Authorization": "Bearer <your-token>",
  "Content-Type": "application/json"
};

var requestOptions = {
  'method': 'POST',
  'headers': requestHeaders,
  // 'payload' will be set within each function
};
```

## Weekly Data Collection
The `getTrackIds` and `getTrackInsights` functions are central to the weekly data collection process. `getTrackIds` queries for all tracks owned by the specified team and returns the IDs of tracks not in maintenance mode. `getTrackInsights` then uses these track IDs to collect insights data for the past week and append this data to the Google Sheet.

```javascript
function getTrackIds() {
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
  // ...
}
```

```javascript
function getTrackInsights() {
  // ... 
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
  // ...
}
```

## Historical Data Collection
For historic data collection, the `populateHistoricalData` and `collectAndLogData` functions are provided. `populateHistoricalData` iterates week-by-week from 365 days ago until today, and for each week, `collectAndLogData` is called to collect and log insights data for all tracks not in maintenance mode. This historical data collection is intended to be executed once to populate the sheet with historical data.

```javascript
function populateHistoricalData() {
  // ... 
}

function collectAndLogData(fromDateString, toDateString) {
  // ... 
}
```

## Execution
- For weekly data collection, set a trigger to execute `getTrackInsights` every Friday.
- To collect historical data, execute `populateHistoricalData` once.

## Notes
- Ensure that the Google Sheet is properly set up and accessible.
- Make sure to replace placeholder values in the configuration section with actual values.
- Verify that the Google Apps Script project has the necessary permissions to execute HTTP requests and interact with Google Sheets.

This setup should provide a structured approach to collect and log insights data for Instruqt tracks, facilitating further analysis and reporting.