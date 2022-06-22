import { request, gql } from 'graphql-request';

export interface PrInfo {

}

export interface ReviewInfo {

}

export async function loadPrs(
  repo: string,
  apiToken: string): Promise<PrInfo>
{
  const [owner, name] = repo.split('/');
  const query = gql`
    query {
      repository(name:"${name}", owner: "${owner}") {
        pullRequests(last:5) {
          edges {
            node {
              title,
              createdAt,
              mergedAt,
              reviews(last:5) {
                edges {
                  node {
                    state,
                    createdAt
                  }
                }
              }
            }
          }
        }
      }
    }
    `;

  const nextPage = await request({
    url: 'https://api.github.com/graphql',
    document: query,
    requestHeaders: {'Authorization': `Bearer ${apiToken}`}
  });

  console.log(JSON.stringify(nextPage, null, 2));

  const prs = nextPage.repository.pullRequests.edges as PrNode[];

  return prs.map(p => prNodeToPrInfo(p));
}

function prNodeToPrInfo(node: PrNode): PrInfo {
  const n = node.node;
  return {
    title: n.title,
    created: new Date(n.createdAt),
    merged: n.mergedAt ? new Date(n.mergedAt) : null,
    reviews: n.reviews.edges.map(r => reviewNodeToReviewInfo(r))
  };
}

function reviewNodeToReviewInfo(node: ReviewNode): ReviewInfo {
  return {
    state: node.node.state,
    createdAt: new Date(node.node.createdAt)
  };
}

interface PrNode {
  node: {
    title: string;
    createdAt: string;
    mergedAt: string | null;
    reviews: {
      edges: ReviewNode[]
    }
  }
}

interface ReviewNode {
  node: {
    state: string,
    createdAt: string
  }
}
