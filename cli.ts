import * as bkm from './bkm';
import { stringify } from 'csv';
import * as buildkite from './buildkite';

import { ArgumentParser } from 'argparse';
import { BkmOptions } from './bkm';

async function main() {
  const options = parseCliOptions();
  const buildkiteToken = loadBuildkiteToken();

  run(options, buildkiteToken);
}

interface CliOptions {
  pipeline: string;
  format: string;
  filter: string | null;
  date_from: string | null;
}

function parseCliOptions(): CliOptions {
  const parser = new ArgumentParser({
    description: 'Buildkite metrics printer'
  });

  parser.add_argument('-p', '--pipeline', {
    help: 'pipeline name',
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

function cliToBkmOptions(cliOptions: CliOptions): BkmOptions {
  return {
    ...cliOptions,
    dateFrom: cliOptions.date_from ? new Date(cliOptions.date_from) : null
  };
}

async function run(options: CliOptions, buildkiteToken: string) {
  const bkmOptions = cliToBkmOptions(options);
  const builds = await bkm.loadBuilds(bkmOptions, buildkiteToken);

  switch (options.format) {
    case 'summary': {
      console.log(builds.summary);
      break;
    }
    case 'csv': {
      printCsv(builds.builds);
      break;
    }
    default:
      throw new Error(`unknown format '${options.format}'`);
  }
}

function loadBuildkiteToken() {
  if (!process.env.BUILDKITE_GRAPHQL_TOKEN) {
    throw new Error('BUILDKITE_GRAPHQL_TOKEN not set');
  }
  return process.env.BUILDKITE_GRAPHQL_TOKEN;
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
