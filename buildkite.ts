import { request, gql } from 'graphql-request';

export interface BuildInfo {
  name: string;
  start: Date;
  end: Date;
  duration_min: number;
  result: string;
  pass: boolean;
  branch: string;
  url: string;
}

export async function loadBuilds(
  pipeline: string,
  buildkiteToken: string,
  dateFrom: Date): Promise<BuildInfo[]>
{
  const dateFromString = dateFrom.toISOString().slice(0, 10);
  const builds: BuildEdge[] = [];
  let cursor = '';
  let done = false;

  while (!done) {
    const query = gql`
    query Builds {
      pipeline(slug: "${pipeline}") {
        builds(first: 100, branch: "master", createdAtFrom: "${dateFromString}", after: "${cursor}") {
          edges {
            cursor
            node {
              message  # todo: is it possible to filter by step names here?
              startedAt
              finishedAt
              state
              branch
              url
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }
    `;

    const nextPage = await request({
      url: 'https://graphql.buildkite.com/v1',
      document: query,
      requestHeaders: {'Authorization': `Bearer ${buildkiteToken}`}
    }) as BuildQueryResponse;

    cursor = nextPage.pipeline.builds.edges.slice(-1)[0].cursor;
    done = !nextPage.pipeline.builds.pageInfo.hasNextPage;

    builds.push(...nextPage.pipeline.builds.edges);
  }

  return builds
    .map(b => buildNodeToInfo(b.node))
    .filter(b => b.start.getFullYear() !== 1970); // filter out builds that didn't start
}

function buildNodeToInfo(node: BuildNode): BuildInfo {
  return {
    name: node.message,
    start: new Date(node.startedAt),
    end: new Date(node.finishedAt),
    duration_min: (new Date(node.finishedAt).getTime() - new Date(node.startedAt).getTime()) / 1000 / 60,
    result: node.state,
    pass: node.state === 'PASSED',
    branch: node.branch,
    url: node.url
  };
}

interface BuildNode {
  message: string;
  startedAt: string;
  finishedAt: string;
  state: string;
  branch: string;
  url: string;
}

interface BuildQueryResponse {
  pipeline: {
    builds: {
      edges: BuildEdge[],
      pageInfo: {
        hasNextPage: boolean
      }
    }
  }
}

interface BuildEdge {
  cursor: string;
  node: BuildNode;
}
