import { Package } from '../../models';
import { AlongWithData, ChangelogEntry } from './changelog.types';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Function to execute shell command and capture output
 * @param scriptPath - Path to the script which we want to run.
 * @returns - Promise that resolves once the script is run and returns the output.
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
 * Function to get and formate alongWith object
 * alongWith object has the information about packages that are modified `along with`
 * a package
 * @param packageName - Name of the package for which we need to create the along with object.
 * @param packages - Details of all the modified packages.
 * @returns - AlongWithData for the package.
 */
function getAlongWithData(packageName: string, packages: Package[]): AlongWithData {
  const alongWith: { [key: string]: string } = {};
  Object.keys(packages).forEach((index: any) => {
    const pkg = packages[index].name;
    if (pkg !== packageName) {
      const exactVersion = packages[index].version;
      alongWith[pkg] = exactVersion;
    }
  });
  return alongWith;
}

/**
 * Function to check if a certain changelog file is present
 * if not present then it will create a file based on the version
 * @param filePath - Checks if a file is present matching the filepath
 * @returns - true - if there is a package, undefined if a new file is created
 */
function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
  return undefined;
}

/**
 * Function to create or update changelog files
 * @param packages - Details of the modified packages
 * @param prevCommitId - commitId of the previous commit
 */
export async function createOrUpdateChangelog(packages: Package[], prevCommitId: string) {
  Object.keys(packages).forEach(async (index: any) => {
    const pkgName = packages[index].name;
    const { version } = packages[index];
    const fileName = version.split('-')[0].replace(/\./g, '_');
    // Constructing the changelog file name
    const changelogFileName = `./docs/changelog/v${fileName}.json`;
    const changelogFilePath = changelogFileName;
    // Prepare the changelog entry
    const changelogEntry: ChangelogEntry = {};
    let commits: string | unknown;
    try {
      commits = await runShellScript(
        `packages/tools/package/src/commands/changelog/getCommits.sh ${prevCommitId}`,
      );
    } catch (err) {
      console.log('Changelog Error: Error while getting commits', err);
    }

    // Create the changelog entry
    if (version && commits) {
      changelogEntry[pkgName] = {
        [version]: {
          commits: JSON.parse(commits as string),
          alongWith: getAlongWithData(pkgName, packages),
        },
      };
    }

    ensureDirectoryExistence(changelogFilePath);
    // Read existing changelog file or create a new one if it doesn't exist
    let changelogData: ChangelogEntry = {};
    if (fs.existsSync(changelogFilePath)) {
      const fileData = fs.readFileSync(changelogFilePath);
      changelogData = JSON.parse(fileData);
    }

    // Merge the new changelog entry
    if (changelogData[pkgName]) {
      changelogData[pkgName] = { ...changelogData[pkgName], ...changelogEntry[pkgName] };
    } else {
      changelogData = { ...changelogData, ...changelogEntry };
    }

    // Write the updated changelog data back to the file
    fs.writeFileSync(changelogFilePath, JSON.stringify(changelogData, null, 2));
  });
}
