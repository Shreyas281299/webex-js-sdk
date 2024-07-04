const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');

// Function to execute shell command and capture output
/**
 *
 */
export function runShellScript(scriptPath: string) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error}`);
        reject(error);
      } else if (stderr) {
        console.error(`Script stderr: ${stderr}`);
        reject(stderr);
      } else {
        // Process the stdout (output) as needed
        resolve(stdout);
      }
    });
  });
}

/**
 *
 */
// @ts-ignore
function getExactVersion(version) {
  if (version.release === 0) {
    if (version.tag === 'latest') {
      return `${version.major}.${version.minor}.${version.patch}`;
    }
    return undefined;
  }
  return `${version.major}.${version.minor}.${version.patch}-${version.tag}.${version.release}`;
}
/**
 *
 */
// @ts-ignore
function getAlongWithData(packageName, packages) {
  const alongWith = {};
  Object.keys(packages).forEach((index) => {
    const pkg = packages[index].name;
    if (pkg !== packageName) {
      const exactVersion = getExactVersion(packages[index].data.version);
      // @ts-ignore
      alongWith[pkg] = exactVersion;
    }
  });
  return alongWith;
}

/**
 *
 */
// @ts-ignore
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, {recursive: true});
  return undefined;
}

// Function to create or update changelog files
/**
 *
 */
// @ts-ignore
export async function createOrUpdateChangelog(packages, prevCommitId) {
  Object.keys(packages).forEach(async (index) => {
    const pkgName = packages[index].name;
    const pkg = packages[index].data;
    const {version} = pkg;
    const versionKey = `${version.major}.${version.minor}.${version.patch}`;
    const exactVersion = getExactVersion(version);

    // Constructing the changelog file name
    const changelogFileName = `./changelog/changelog_${versionKey}.json`;
    const changelogFilePath = changelogFileName;
    // Prepare the changelog entry
    const changelogEntry: any = {};
    let commits = '{}';
    try {
      // @ts-ignore
      commits = await runShellScript(
        `packages/tools/package/src/commands/changelog/getCommits.sh ${prevCommitId}`
      );
    } catch (err) {
      console.log('Changelog Error: Error while getting commits', err);
    }

    // @ts-ignore
    if (exactVersion) {
      changelogEntry[pkgName] = {
        [exactVersion]: {
          // `commits` can be dynamically added here
          // @ts-ignore
          commits: JSON.parse(commits),
          alongWith: getAlongWithData(pkgName, packages),
        },
      };
    }

    ensureDirectoryExistence(changelogFilePath);
    // Read existing changelog file or create a new one if it doesn't exist
    let changelogData = {};
    if (fs.existsSync(changelogFilePath)) {
      const fileData = fs.readFileSync(changelogFilePath);
      changelogData = JSON.parse(fileData);
    }

    // Merge the new changelog entry
    // @ts-ignore
    if (changelogData[pkgName]) {
      // @ts-ignore
      changelogData[pkgName] = {...changelogData[pkgName], ...changelogEntry[pkgName]};
    } else {
      changelogData = {...changelogData, ...changelogEntry};
    }

    // Write the updated changelog data back to the file
    fs.writeFileSync(changelogFilePath, JSON.stringify(changelogData, null, 2));
  });
}
