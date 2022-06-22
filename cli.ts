import { ArgumentParser } from 'argparse';
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
    description: 'GitHub PR metrics printer'
  });

  parser.add_argument('-r', '--repo', {
    help: 'repo, eg. my_org/my_repo',
    required: true,
  });

  return parser.parse_args();
}

async function run(options: CliOptions, githubToken: string) {
  await loadPrs(options.repo, githubToken);
}

function loadGitHubToken() {
  if (!process.env.GITHUB_GRAPHQL_TOKEN) {
    throw new Error('GITHUB_GRAPHQL_TOKEN not set');
  }
  return process.env.GITHUB_GRAPHQL_TOKEN;
}

main();
