const core = require("@actions/core");
const github = require("@actions/github");
const vsoNodeApi = require("azure-devops-node-api");

const ValidWorkItemType = ["Defect", "Change", "Feature"];

async function getWorkItemTrackingApi() {
  const orgUrl = core.getInput("azure_devops_org_url");
  const token = core.getInput("devops_access_token");

  let authHandler = vsoNodeApi.getPersonalAccessTokenHandler(token);
  let webApi = new vsoNodeApi.WebApi(orgUrl, authHandler);

  await webApi.connect();
  return await webApi.getWorkItemTrackingApi();
}

async function action() {
  if (!github.context.payload.pull_request) {
    core.warning("Not a pull request skipping verification!");
    return;
  }

  const regex = /(?<=AB#)(\d*?)(?=\s|$|[\D])/gi;

  const issues = github.context.payload.pull_request.body.match(regex);

  if (!issues) {
    core.setFailed("No work item linked");
    return;
  }

  const workItemTrackingApi = await getWorkItemTrackingApi();

  const hasValidWorkItem = false;

  for (const issue of issues) {
    const workItem = await workItemTrackingApi.getWorkItem(parseInt(issue), [
      "System.WorkItemType",
    ]);

    if (!workItem) {
      core.setFailed(`Work Item '${issue}' not found`);
    } else {
      if (ValidWorkItemType.includes(workItem.fields["System.WorkItemType"])) {
        hasValidWorkItem = true;
      }
    }
  }

  if (!hasValidWorkItem) {
    core.setFailed(
      `Linked Worked item type must have a linked type : "${ValidWorkItemType.join(
        ", "
      )}`
    );
  }

  return;
}

module.exports = {
  action,
};
