import * as bkm from './bkm';
import { stringify } from 'csv';
import * as buildkite from './buildkite';

import { ArgumentParser } from 'argparse';
import { BkmOptions } from './bkm';
import { loadPrs } from './github';

async function main() {
  const options = parseCliOptions();
  const githubToken = loadGitHubToken();

  run(options, githubToken);
}

interface CliOptions {
  repo: string;
  format: string;
  filter: string | null;
  date_from: string | null;
}

function parseCliOptions(): CliOptions {
  const parser = new ArgumentParser({
    description: 'Buildkite metrics printer'
  });

  parser.add_argument('-r', '--repo', {
    help: 'repo, eg. my_org/my_repo',
    required: true,
  });
  parser.add_argument('--filter', {
    help: 'filter builds (only builds with the given string in the build name will be used)',
  });
  parser.add_argument('-f', '--format', {
    help: 'output format',
    choices: ['csv', 'summary'],
    default: 'summary'
  });
  parser.add_argument('--date-from', {
    help: 'load builds from this date onwards (defaults to last 2 weeks)',
  });

  return parser.parse_args();
}

// function cliToBkmOptions(cliOptions: CliOptions): BkmOptions {
//   return {
//     ...cliOptions,
//     dateFrom: cliOptions.date_from ? new Date(cliOptions.date_from) : null
//   };
// }

async function run(options: CliOptions, githubToken: string) {
  // const bkmOptions = cliToBkmOptions(options);
  await loadPrs(options.repo, githubToken);
  // const builds = await bkm.loadBuilds(bkmOptions, githubToken);

  // switch (options.format) {
  //   case 'summary': {
  //     console.log(builds.summary);
  //     break;
  //   }
  //   case 'csv': {
  //     printCsv(builds.builds);
  //     break;
  //   }
  //   default:
  //     throw new Error(`unknown format '${options.format}'`);
  // }
}

function loadGitHubToken() {
  if (!process.env.GITHUB_GRAPHQL_TOKEN) {
    throw new Error('GITHUB_GRAPHQL_TOKEN not set');
  }
  console.log('token', process.env.GITHUB_GRAPHQL_TOKEN);
  return process.env.GITHUB_GRAPHQL_TOKEN;
}

function printCsv(builds: buildkite.BuildInfo[]) {
  const formattedBuilds = builds.map(b => ({
    start: b.start.toISOString(),
    end: b.end.toISOString(),
    duration_min: b.duration_min,
    pass: b.pass ? 'pass' : 'fail',
    branch: b.branch,
    url: b.url
  }));
  stringify(formattedBuilds, {header: true}).pipe(process.stdout);
}

main();
