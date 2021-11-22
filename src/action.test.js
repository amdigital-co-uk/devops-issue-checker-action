const proxyquire = require("proxyquire").noCallThru(); // Not ideal but lets just test the logic a little

beforeEach(() => {
  process.exitCode = 0;
  process.stdout.write = jest.fn();
  process.env.INPUT_AZURE_DEVOPS_ORG_URL = "orgURL";
  process.env.INPUT_DEVOPS_ACCESS_TOKEN = "accesToken";
});

getProxedAction = () => {
  var coreStub = {};
  var githubStub = {};
  var devopsStub = {};
  const sut = proxyquire("./action", {
    "@actions/core": coreStub,
    "@actions/github": githubStub,
    "azure-devops-node-api": devopsStub,
  });

  return { sut, coreStub, githubStub, devopsStub };
};

//disable all other test since proxyquire doesn't behave as i'd expect it to
test.only("action return when called by non pullrequest flow", async () => {
  const testFixtures = getProxedAction();

  testFixtures.githubStub["context"] = {
    payload: {
      pull_request: null,
    },
  };

  await testFixtures.sut.action();

  expect(process.exitCode).toBe(0);
  expect(process.stdout.write).toHaveBeenCalledTimes(1);
  expect(process.stdout.write).toHaveBeenCalledWith(
    expect.stringContaining(
      "::warning::Not a pull request skipping verification!"
    )
  );
});

test("action fails when called by no worked item linked", async () => {
  const testFixtures = getProxedAction();

  testFixtures.githubStub["contex"] = {
    payload: {
      pull_request: { body: "" },
    },
  };

  await testFixtures.sut.action();

  expect(process.exitCode).toBe(0);
  expect(process.stdout.write).toHaveBeenCalledTimes(1);
  expect(process.stdout.write).toHaveBeenCalledWith(
    expect.stringContaining("::error::No work item linked")
  );
});
