/**
 * @file PathDialog container module
 * @author Theodor Shaytanov <theodor.shaytanov@gmail.com>
 * @created 01.03.18
 */

import React, { Fragment } from "react";
import PropTypes from "prop-types";

import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import CloudDownload from "@material-ui/icons/CloudDownload";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import LinkIcon from "@material-ui/icons/Link";
import InputAdornment from "@material-ui/core/InputAdornment";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";

import { ACTIVITY_TYPES, YOUTUBE_QUESTIONS } from "../../services/paths";
import { APP_SETTING } from "../../achievementsApp/config";

class ActivityDialog extends React.PureComponent {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    onCommit: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    pathId: PropTypes.string.isRequired,
    paths: PropTypes.array,
    activity: PropTypes.object,
    uid: PropTypes.string.isRequired,
    fetchGithubFiles: PropTypes.func.isRequired,
    fetchGithubFilesStatus : PropTypes.string
  };

  state = {
    type: "text"
  };
  fetchedGithubURL = "";
  componentWillReceiveProps(nextProps) {
    if((nextProps.fetchGithubFilesStatus || '').length>0){
      this.handelfetchGithubFilesStatus(nextProps.fetchGithubFilesStatus,nextProps.activity);
      return;
    }
    this.resetState();
    if (nextProps.activity) {
      let state = {};
      if (nextProps.activity.type === ACTIVITY_TYPES.jupyterInline.id) {
        state = {
          code: nextProps.activity.code || 1,
          frozen: nextProps.activity.frozen || 1
        };
      } else if (nextProps.activity.type === ACTIVITY_TYPES.jest.id) {
        state = {
          githubURL: nextProps.activity.githubURL || "",
          files: nextProps.activity.files || []
        };
        this.fetchedGithubURL = nextProps.activity.githubURL || "";
      }
      this.setState({
        ...nextProps.activity,
        ...state
      });
    }
  }
  handelfetchGithubFilesStatus=(fetchGithubFilesStatus,activity)=>{
    switch(fetchGithubFilesStatus){
      case "SUCCESS":{
        this.fetchedGithubURL = this.state.githubURL;
        this.setState({ files : activity.files || []})
        this.hideLoading();
        break;
      }
      case "LOADING":{
        this.showLoading();
        break;
      }
      case "ERROR":{
        this.hideLoading();
        break;
      }
      default : {
        break;
      }
    }
  }
  getTypeSpecificElements() {
    let { activity } = this.props;

    activity = Object.assign(activity || {}, this.state);
    switch (this.state.type || (activity && activity.type) || "text") {
      case ACTIVITY_TYPES.text.id:
        return (
          <TextField
            fullWidth
            label="Question"
            margin="normal"
            onChange={e => this.onFieldChange("question", e.target.value)}
            value={activity.question || ""}
          />
        );
      case ACTIVITY_TYPES.codeCombat.id:
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="select-multiple-levels">Level</InputLabel>
            <Select
              input={<Input id="select-multiple-levels" />}
              margin="none"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 224,
                    width: 250
                  }
                }
              }}
              onChange={e => this.onFieldChange("level", e.target.value)}
              value={activity.level || ""}
            >
              {Object.keys(APP_SETTING.levels).map(id => (
                <MenuItem key={APP_SETTING.levels[id].name} value={id}>
                  {APP_SETTING.levels[id].name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case ACTIVITY_TYPES.codeCombatNumber.id:
        return (
          <TextField
            defaultValue={activity && String(activity.count || "1")}
            fullWidth
            label="Levels amount"
            margin="normal"
            onChange={e => this.onFieldChange("count", Number(e.target.value))}
            type="number"
            value={activity.count}
          />
        );
      case ACTIVITY_TYPES.jupyter.id:
        return (
          <Fragment>
            <TextField
              defaultValue={activity && activity.problemURL}
              fullWidth
              label="Problem Notebook URL"
              margin="dense"
              onChange={e => this.onFieldChange("problemURL", e.target.value)}
              onKeyPress={this.catchReturn}
            />
            <TextField
              defaultValue={activity && activity.solutionURL}
              fullWidth
              label="Solution Notebook URL"
              margin="dense"
              onChange={e => this.onFieldChange("solutionURL", e.target.value)}
              onKeyPress={this.catchReturn}
            />
            <TextField
              defaultValue={activity && String(activity.frozen || "1")}
              fullWidth
              label="Number of frozen cells"
              margin="dense"
              onChange={e =>
                this.onFieldChange("frozen", Number(e.target.value))
              }
              onKeyPress={this.catchReturn}
              type="number"
            />
          </Fragment>
        );
      case ACTIVITY_TYPES.jupyterInline.id:
        return (
          <Fragment>
            <TextField
              defaultValue={activity && activity.problemURL}
              fullWidth
              label="Problem Notebook URL"
              margin="dense"
              onChange={e => this.onFieldChange("problemURL", e.target.value)}
              onKeyPress={this.catchReturn}
            />
            <TextField
              defaultValue={activity && activity.solutionURL}
              fullWidth
              label="Solution Notebook URL"
              margin="dense"
              onChange={e => this.onFieldChange("solutionURL", e.target.value)}
              onKeyPress={this.catchReturn}
            />
            <TextField
              defaultValue={activity && String(activity.code || "1")}
              fullWidth
              label="Default code block"
              margin="dense"
              onChange={e => this.onFieldChange("code", Number(e.target.value))}
              onKeyPress={this.catchReturn}
              type="number"
            />
            <TextField
              defaultValue={activity && String(activity.frozen || "1")}
              fullWidth
              label="Number of frozen cells"
              margin="dense"
              onChange={e =>
                this.onFieldChange("frozen", Number(e.target.value))
              }
              onKeyPress={this.catchReturn}
              type="number"
            />
          </Fragment>
        );
      case ACTIVITY_TYPES.youtube.id:
        return (
          <Fragment>
            <TextField
              defaultValue={activity && activity.youtubeURL}
              fullWidth
              label="YouTube URL"
              margin="dense"
              onChange={e => this.onFieldChange("youtubeURL", e.target.value)}
              onKeyPress={this.catchReturn}
            />
            <FormControl
              component="fieldset"
              style={{
                marginTop: 24
              }}
            >
              <FormLabel component="legend">Follow Up Questions</FormLabel>
              <FormHelperText>
                Select one or more of the questions below
              </FormHelperText>

              <FormGroup>
                {Object.keys(YOUTUBE_QUESTIONS).map(questionType => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          this.state[questionType] ||
                          (this.state[questionType] === undefined &&
                            activity[questionType])
                        }
                        color="primary"
                        onChange={e =>
                          this.onFieldChange(questionType, e.target.checked)
                        }
                      />
                    }
                    key={questionType}
                    label={YOUTUBE_QUESTIONS[questionType]}
                  />
                ))}
                <TextField
                  defaultValue={activity && activity.customText}
                  disabled={
                    this.state.questionCustom === undefined
                      ? !(activity && activity.questionCustom)
                      : !this.state.questionCustom
                  }
                  fullWidth
                  label="Custom question"
                  onChange={e =>
                    this.onFieldChange("customText", e.target.value)
                  }
                />
              </FormGroup>
            </FormControl>
          </Fragment>
        );
      case ACTIVITY_TYPES.game.id:
        return (
          <TextField
            defaultValue={activity && activity.game}
            fullWidth
            label="Game Variant"
            margin="dense"
            onChange={e => this.onFieldChange("game", e.target.value)}
            onKeyPress={this.catchReturn}
          >
            <MenuItem value="GemCollector">Gem Collector</MenuItem>
            <MenuItem value="Squad">Squad</MenuItem>
          </TextField>
        );
      case ACTIVITY_TYPES.jest.id:
        return (
          <div>
            <FormControl style={{ width: "100%" }}>
              <InputLabel htmlFor="githubURL">Github URL</InputLabel>
              <Input
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Fetch files from github."
                      onClick={this.handleGithubURLSubmit}
                    >
                      {this.state.loading ? (
                        <CircularProgress size={25} />
                      ) : (
                        <CloudDownload />
                      )}
                    </IconButton>
                  </InputAdornment>
                }
                id="githubURL"
                onChange={e => this.onFieldChange("githubURL", e.target.value)}
                type="text"
                value={activity.githubURL || ""}
              />
            </FormControl>
            {this.state.files &&
              this.state.files.length > 0 && (
                <div>
                  <Typography
                    gutterBottom
                    style={{ margin: "12px 0px" }}
                    variant="body2"
                  >
                    <CheckBoxIcon style={{ float: "left" }} /> Check files to
                    allow write access for users.
                  </Typography>
                  <Typography gutterBottom variant="body2">
                    {this.fetchedGithubURL && (
                      <LinkIcon style={{ float: "left" }} />
                    )}{" "}
                    {this.fetchedGithubURL}
                  </Typography>
                  {this.state.files.map(
                    file =>
                      file.type === "file" && (
                        <ListItem
                          button
                          dense
                          key={file.path}
                          role={undefined}
                          style={{ padding: "0px 25px" }}
                        >
                          <Checkbox
                            checked={!file.readOnly}
                            disableRipple
                            onChange={() => this.handleReadOnlyFiles(file.path)}
                            tabIndex={-1}
                          />
                          <ListItemText primary={file.path} />
                        </ListItem>
                      )
                  )}
                </div>
              )}
          </div>
        );
      default:
    }
  }
  showLoading = () => {
    this.setState(() => ({ loading: true }));
  };
  hideLoading = () => {
    this.setState(() => ({ loading: false }));
  };
  handleReadOnlyFiles = filePath => {
    this.setState(() => ({
      files: this.state.files.map(
        file =>
          file.path === filePath ? { ...file, readOnly: !file.readOnly } : file
      )
    }));
  };
  handleGithubURLSubmit = () => {
    if (this.state.loading) return;
    this.fetchedGithubURL = "";
    this.setState({ files: [] });
    this.props.fetchGithubFiles(this.state.githubURL);
  };

  onFieldChange = (field, value) => {
    let state = {};
    if (field === "type" && value === ACTIVITY_TYPES.jupyterInline.id) {
      state = {
        code: 1,
        frozen: 1
      };
    }
    if(field==="level" &&  this.state.type === ACTIVITY_TYPES.codeCombat.id){
      state={
        name : APP_SETTING.levels[value].name
      }
    }
    this.setState({ [field]: value, ...state });
  };
  onCommit = () => {
    const activity = { ...this.props.activity };
    if (this.state.type === ACTIVITY_TYPES.jest.id) {
      const { type, name } = this.state;
      this.props.onCommit(this.props.pathId, {
        ...activity,
        type,
        name,
        githubURL: this.fetchedGithubURL,
        files: this.state.files
      });
    } else {
      this.props.onCommit(
        this.props.pathId,
        Object.assign(activity || {}, this.state, {
          type: this.state.type || (activity && activity.type) || "text"
        })
      );
    }
    this.onClose();
  };

  onClose = () => {
    this.resetState();
    this.props.onClose();
  };
  resetState = () => {
    // Clear state. Render will be invoked 1 time only
    Object.keys(this.state).forEach(
      key => this.setState({ [key]: undefined }) || true
    );
    this.setState({ type: "text" });
  };

  render() {
    const { activity, open } = this.props;
    return (
      <Dialog fullWidth onClose={this.onClose} open={open}>
        <DialogTitle>
          {activity && activity.id ? "Edit Problem" : "Add New Problem"}
        </DialogTitle>
        <DialogContent
          style={{
            width: "100%"
          }}
        >
          <TextField
            autoFocus
            fullWidth
            label="Name"
            margin="dense"
            onChange={e => this.onFieldChange("name", e.target.value)}
            onKeyPress={this.catchReturn}
            required
            value={this.state.name || ""}
          />
          <TextField
            fullWidth
            label="Type"
            margin="dense"
            onChange={e => this.onFieldChange("type", e.target.value)}
            select
            value={this.state.type || (activity && activity.type) || "text"}
          >
            {Object.keys(ACTIVITY_TYPES).map(key => (
              <MenuItem key={key} value={key}>
                {ACTIVITY_TYPES[key].caption}
              </MenuItem>
            ))}
          </TextField>
          {this.getTypeSpecificElements()}
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={this.onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={
              this.state.loading ||
              !this.state.name ||
              !this.state.type ||
              (this.state.type === ACTIVITY_TYPES.jest.id &&
                !(this.state.files && this.state.files.length > 0))
            }
            onClick={this.onCommit}
            variant="raised"
          >
            Commit
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default ActivityDialog;
