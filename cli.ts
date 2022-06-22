import { ArgumentParser } from 'argparse';
import { stringify } from 'csv';
import { loadPrs, PrInfo } from './github';

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
    description: 'GitHub PR metrics printer'
  });

  parser.add_argument('-r', '--repo', {
    help: 'repo, eg. my_org/my_repo',
    required: true,
  });

  return parser.parse_args();
}

async function run(options: CliOptions, githubToken: string) {
  const prs = await loadPrs(options.repo, githubToken);
  printCsv(prs);
}

function loadGitHubToken() {
  if (!process.env.GITHUB_GRAPHQL_TOKEN) {
    throw new Error('GITHUB_GRAPHQL_TOKEN not set');
  }
  return process.env.GITHUB_GRAPHQL_TOKEN;
}

function printCsv(prs: PrInfo[]) {
  const formattedPrs = prs.map(p => ({
    title: p.title,
    created: p.created.toISOString(),
    firstApproved: p.firstApprovalAt ? p.firstApprovalAt.toISOString() : null,
    merged: p.merged ? p.merged.toISOString() : null,
  }));
  stringify(formattedPrs, {header: true}).pipe(process.stdout);
}

main();
