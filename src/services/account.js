/**
 * Service for actions with account
 */

import firebase from "firebase";
import { authProvider } from "../achievementsApp/config";

export class AccountService {
  signIn() {
    return firebase
      .auth()
      .signInWithPopup(authProvider)
      .then(ref =>
        // Get existing user name and update display name if it doesn't exists
        firebase
          .database()
          .ref(`/users/${ref.user.uid}`)
          .once("value")
          .then(existing => existing.val() || {})
          .then(existing => {
            return firebase
              .database()
              .ref(`/users/${ref.user.uid}`)
              .update({
                displayName: existing.displayName || ref.user.displayName,
                photoURL: ref.user.photoURL
              });
          })
          // Return user ref to continue processing
          .then(() => ref)
      )
      .then(ref =>
        // Update some private fields (could be increased in future)
        firebase
          .database()
          .ref(`/usersPrivate/${ref.user.uid}`)
          .update({
            displayName: ref.user.displayName,
            email: ref.user.email
          })
      );
  }

  checkEULAAgreement() {
    return firebase
      .ref(`/users/${firebase.auth().currentUser.uid}/acceptedEULA`)
      .once("value")
      .then(data => data.val());
  }

  acceptEULA() {
    return firebase
      .ref(`/users/${firebase.auth().currentUser.uid}`)
      .update({ acceptedEULA: true });
  }

  signOut() {
    return firebase.auth().signOut();
  }

  /**
   *
   * @param {ExternalProfile} externalProfileId
   * @param {String} uid
   * @param {String} login
   */
  addExternalProfile(externalProfileId, uid, login) {
    return firebase.ref(`/userAchievements/${uid}/${externalProfileId}`).set({
      id: login,
      lastUpdate: 0,
      totalAchievements: 0,
      achievements: {}
    });
  }

  watchProfileRefresh(uid, externalProfileId, awaitResolve) {
    let skip = true;
    return firebase
      .ref(`/userAchievements/${uid}/${externalProfileId}`)
      .on("value", data => {
        if (skip) {
          skip = false;
          return;
        }
        data = data.val();
        firebase.ref(`/userAchievements/${uid}/${externalProfileId}`).off();
        awaitResolve(data);
      });
  }

  /**
   *
   * @param {ExternalProfile} externalProfileId
   * @param {String} uid
   * @param {String} login
   */
  refreshAchievements(externalProfileId, uid, login) {
    return firebase.ref("updateProfileQueue/tasks").push({
      service: externalProfileId,
      serviceId: login,
      uid: uid
    });
  }

  /**
   *
   * @param {ExternalProfile} externalProfileId
   * @param {String} uid
   */
  removeExternalProfile(externalProfileId, uid) {
    return firebase
      .ref(`/userAchievements/${uid}/${externalProfileId}`)
      .remove();
  }

  updateDisplayName(uid, displayName) {
    return firebase.ref(`/users/${uid}/displayName`).set(displayName);
  }

  fetchExternalProfiles() {
    // This should be in firebase, I guess
    return {
      CodeCombat: {
        url: "https://codecombat.com",
        id: "CodeCombat",
        name: "Code Combat",
        description: "learn to Code JavaScript by Playing a Game"
      }
      /* Unnecessary for now
      FreeCodeCamp: {
        url: "https://fetch-free-code-ca.mp",
        description:
          "<a href='https://www.freecodecamp.org'>Free Code Camp</a>, " +
          "Learn to code with free online courses, programming projects, " +
          "and interview preparation for developer jobs."
      },
      PivotalExpert: {
        url: "https://fetch-pivotal-expe.rt",
        description: "Some description"
      } */
    };
  }
}

/**
 * @type {AccountService}
 */
export const accountService = new AccountService();
