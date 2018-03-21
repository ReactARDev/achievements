import isEmpty from "lodash/isEmpty";
import firebase from "firebase";

export const YOUTUBE_QUESTIONS = {
  topics:
    "What topics were covered in this video? Put each topic on a new line",
  questionAfter: "What question do you have after watching this video",
  questionAnswer:
    "What is a question someone who watched this video " +
    "should be able to answer"
};

export class PathsService {
  auth() {
    window.gapi.load("client:auth2", () => {
      window.gapi.client.init({
        apiKey: "AIzaSyC27mcZBSKrWavXNhsDA1HJCeUurPluc1E",
        clientId:
          "765594031611-aitdj645mls974mu5oo7h7m27bh50prc.apps." +
          "googleusercontent.com",
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
        ],
        scope: "https://www.googleapis.com/auth/drive"
      });
    });
  }

  static getColabURL(fileId) {
    return "https://colab.research.google.com/notebook#fileId=" + fileId;
  }

  getFileId(url) {
    let result = /file\/d\/([^/]+)/.exec(url);
    if (result && result[1]) return result[1];

    throw new Error("Unable fetch file id");
  }

  fetchPathProblem(pathId, problemId) {
    return Promise.resolve()
      .then(
        () =>
          pathId[0] === "-"
            ? firebase
                .database()
                .ref(`/paths/${pathId}`)
                .once("value")
                .then(pathSnapshot => pathSnapshot.val() || {})
            : { owner: pathId, name: "Default" }
      )
      .then(pathInfo =>
        firebase
          .database()
          .ref(`/problems/${pathInfo.owner}/${problemId}`)
          .once("value")
          .then(data => data.val())
          .then(problem => ({
            problemName: problem.name,
            pathName: pathInfo.name,
            pathId: pathInfo.id,
            problemId,
            owner: pathInfo.owner,
            ...problem
          }))
      )
      .then(pathProblem => {
        switch (pathProblem.type) {
          case "jupyter":
            return Promise.all([
              Promise.resolve(this.getFileId(pathProblem.problemURL)).then(
                fileId =>
                  this.fetchFile(fileId).then(data => ({
                    id: fileId,
                    data
                  }))
              ),
              Promise.resolve(this.getFileId(pathProblem.solutionURL)).then(
                fileId =>
                  this.fetchFile(fileId).then(data => ({
                    id: fileId,
                    data
                  }))
              )
            ]).then(files =>
              Object.assign(pathProblem, {
                problemColabURL: PathsService.getColabURL(files[0].id),
                problemJSON: files[0].data,
                solutionJSON: files[1].data
              })
            );
          default:
            return pathProblem;
        }
      });
  }

  fetchPathProgress(solverId, pathOwner, pathId) {
    let ref = firebase
      .database()
      .ref(`/problems/${pathOwner}`)
      .orderByChild("path");

    if (pathId) {
      ref = ref.equalTo(pathId);
    } else {
      ref = ref.endAt(null);
    }

    return ref
      .once("value")
      .then(data => Object.keys(data.val() || {}))
      .then(problemKeys =>
        Promise.all(
          problemKeys.map(problemKey =>
            firebase
              .database()
              .ref(`/problemSolutions/${problemKey}/${solverId}`)
              .once("value")
              .then(data => data.val() || false)
          )
        )
          .then(solutions => solutions.filter(solution => !!solution))
          .then(existingSolutions => ({
            solutions: existingSolutions.length,
            total: problemKeys.length
          }))
      );
  }

  fetchSolutionFile(problemId, uid) {
    return firebase
      .database()
      .ref(`/problemSolutions/${problemId}/${uid}`)
      .once("value")
      .then(snapshot => snapshot.val())
      .then(fileId => (fileId ? this.fetchFile(fileId) : false));
  }

  uploadSolutionFile(uid, problemId, problemJSON) {
    return this.uploadFile(
      `Solution${problemId}.ipynb`,
      JSON.stringify(problemJSON)
    ).then(file =>
      firebase
        .database()
        .ref(`/problemSolutions/${problemId}/${uid}`)
        .set(file.id)
        .then(() => file.id)
    );
  }

  fetchFile(fileId) {
    return window.gapi.client.drive.files
      .get({
        fileId,
        alt: "media"
      })
      .then(data => JSON.parse(data.body));
  }

  /** Taken from https://goo.gl/jyfMGj
   *
   * @param name
   * @param data
   * @returns {Promise<any>}
   */
  uploadFile(name, data) {
    return new Promise(resolve => {
      const boundary = "-------314159265358979323846";
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const contentType = "application/vnd.google.colab";

      const metadata = {
        name: name,
        mimeType: contentType
      };

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: " +
        contentType +
        "\r\n\r\n" +
        data +
        close_delim;

      const request = window.gapi.client.request({
        path: "/upload/drive/v3/files",
        method: "POST",
        params: { uploadType: "multipart" },
        headers: {
          "Content-Type": `multipart/related; boundary="${boundary}"`
        },
        body: multipartRequestBody
      });
      request.execute(resolve);
    });
  }
  pathChange(uid, pathInfo) {
    const key = firebase
      .database()
      .ref("/paths")
      .push().key;

    return firebase
      .database()
      .ref(`/paths/${key}`)
      .set({ ...pathInfo, owner: uid })
      .then(() => key);
  }

  validateProblem(problemInfo) {
    if (!problemInfo) throw new Error("Missing problem");
    if (problemInfo.id) return;
    if (!problemInfo.name) throw new Error("Missing problem name");
    if (!problemInfo.type) throw new Error("Missing problem type");
    switch (problemInfo.type) {
      case "jupyter":
        if (!problemInfo.problemURL) throw new Error("Missing problemURL");
        if (!problemInfo.solutionURL) throw new Error("Missing solutionURL");
        if (!problemInfo.frozen) throw new Error("Missing frozen");
        break;
      case "youtube":
        if (!problemInfo.youtubeURL) throw new Error("Missing youtubeURL");
        if (
          !(
            problemInfo.questionAfter ||
            problemInfo.questionAnswer ||
            problemInfo.topics
          )
        ) {
          throw new Error("Missing any of following question");
        }
        break;
      case "text":
        break;
      default:
        throw new Error("Invalid  problem type");
    }
  }

  problemChange(uid, pathId, problemInfo) {
    this.validateProblem(problemInfo);

    problemInfo.owner = uid;
    if (pathId) {
      problemInfo.path = pathId;
    }

    const key =
      problemInfo.id ||
      firebase
        .database()
        .ref(`/problems/${uid}`)
        .push().key;
    const ref = firebase.database().ref(`/problems/${uid}/${key}`);

    if (problemInfo.id) {
      delete problemInfo.id;
      ref.update(problemInfo);
    } else {
      ref.set(problemInfo);
    }
    return key;
  }

  validateSolution(pathProblem, solution) {
    switch (pathProblem.type) {
      case "youtube":
        if (isEmpty(solution.youtubeEvents)) {
          throw new Error("Did you ever start watching this video?");
        }
        Object.keys(YOUTUBE_QUESTIONS).forEach(question => {
          if (pathProblem[question] && !solution.answers[question]) {
            throw new Error(
              `Missing answer for '${YOUTUBE_QUESTIONS[question]}`
            );
          }
        });
        break;
      default:
        return true;
    }
  }

  submitSolution(uid, pathProblem, solution) {
    this.validateSolution(pathProblem, solution);
    switch (pathProblem.type) {
      case "jupyter":
        break;
      case "youtube":
        return firebase
          .database()
          .ref(`/problemSolutions/${pathProblem.problemId}/${uid}`)
          .set(solution);
      default:
        break;
    }
  }

  fetchPaths(uid) {
    return firebase
      .database()
      .ref("/paths")
      .orderByChild("owner")
      .equalTo(uid)
      .once("value")
      .then(data => data.val())
      .then(paths =>
        Object.keys(paths || {}).map(id => ({
          ...paths[id],
          id
        }))
      );
  }
  fetchProblems(uid, pathId) {
    let ref = firebase.database().ref(`/problems/${uid}`);

    if (pathId && pathId !== "default") {
      ref = ref.orderByChild("path").equalTo(pathId);
    }
    return ref
      .once("value")
      .then(data => data.val())
      .then(problems =>
        Object.keys(problems || {}).map(id => ({
          ...problems[id],
          id
        }))
      )
      .then(
        problems =>
          pathId && pathId !== "default"
            ? problems
            : problems.filter(problem => !problem.path)
      );
  }
}

/** @type PathsService */
export const pathsService = new PathsService();