/**
 *
 */

const admin = require("firebase-admin");

const MAX_ACTIVITIES_COUNT = 4;
const ACTIVITY_TYPES = {
  codeCombat: "CodeCombat Activities",
  jupyter: "Jupyter Colaboratory Activities",
  jupyterInline: "Jupyter Notebook Activities",
  youtube: "YouTube Video Activities",
  game: "Game Activities"
};

exports.handler = userKey =>
  admin
    .database()
    .ref("/paths")
    .orderByChild("isPublic")
    .equalTo(true)
    .once("value")
    .then(snapshot => snapshot.val())
    .then(paths =>
      Promise.all(
        Object.keys(paths).map(pathKey =>
          Promise.all([
            admin
              .database()
              .ref("/activities")
              .orderByChild("path")
              .equalTo(pathKey)
              .once("value")
              .then(snapshot => snapshot.val()),
            admin
              .database()
              .ref(`/completedActivities/${userKey}/${pathKey}`)
              .once("value")
              .then(snapshot => snapshot.val())
          ])
        )
      )
    )
    .then(pathActivitiesData => {
      const result = {};
      const updated = {};

      for (const data of pathActivitiesData) {
        const activities = data[0] || {};
        const solutions = data[1] || {};

        for (const activityKey of Object.keys(activities)) {
          const activity = activities[activityKey];
          if (
            ACTIVITY_TYPES[activity.type] &&
            !solutions[activityKey] &&
            (!updated[activity.type] ||
              updated[activity.type].length < MAX_ACTIVITIES_COUNT)
          ) {
            updated[activity.type] = updated[activity.type] || [];
            updated[activity.type].push(activity.id);
            result[activity.type] = result[activity.type] || {
              title: ACTIVITY_TYPES[activity.type]
            };
            result[activity.type][activityKey] = Object.assign(
              {
                name: activity.name,
                feature: "activity",
                featureType: activity.type,
                problem: activityKey
              },
              activity
            );
          }
        }
      }

      return admin
        .database()
        .ref(`/userRecommendations/${userKey}`)
        .update(result)
        .then(() => result);
    })
    .catch(err => {
      console.error(err.message, err.stack);
      throw err;
    });
