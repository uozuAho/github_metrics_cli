import { request, gql } from 'graphql-request';

export interface PrInfo {
  title: string;
  created: Date;
  firstApprovalAt: Date | null;
  hoursToFirstApproval: number | null;
  merged: Date | null;
  hoursFromApprovedToMerged: number | null;
  reviews: ReviewInfo[];
}

export interface ReviewInfo {
  state: ReviewState,
  createdAt: Date
}

export async function loadPrs(
  repo: string,
  apiToken: string): Promise<PrInfo[]>
{
  const [owner, name] = repo.split('/');
  const query = gql`
    query {
      repository(name:"${name}", owner: "${owner}") {
        pullRequests(last:50) {
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

  const prs = nextPage.repository.pullRequests.edges as PrNode[];

  return prs.map(p => prNodeToPrInfo(p));
}

function firstApprovalDate(reviews: ReviewInfo[]): Date | null {
  const approvalsByDateAscending = [...reviews.filter(r => r.state === "APPROVED")];
  approvalsByDateAscending.sort((a, b) => a.createdAt.getDate() - b.createdAt.getDate());

  if (approvalsByDateAscending.length === 0) {
    return null;
  }
  return approvalsByDateAscending[0].createdAt;
}

function prNodeToPrInfo(node: PrNode): PrInfo {
  const n = node.node;
  const created = new Date(n.createdAt);
  const reviews = n.reviews.edges.map(r => reviewNodeToReviewInfo(r));
  const firstApprovalAt = firstApprovalDate(reviews);
  const merged = n.mergedAt ? new Date(n.mergedAt) : null;

  const hoursToFirstApproval = firstApprovalAt
    ? (firstApprovalAt.getTime() - created.getTime()) / 1000 / 3600
    : null;

  const hoursFromApprovedToMerged = firstApprovalAt && merged
    ? (merged.getTime() - firstApprovalAt.getTime()) / 1000 / 3600
    : null;

  return {
    title: n.title,
    created,
    firstApprovalAt,
    hoursToFirstApproval,
    merged,
    hoursFromApprovedToMerged,
    reviews
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
    state: ReviewState,
    createdAt: string
  }
}

// https://docs.github.com/en/graphql/reference/enums#pullrequestreviewstate
type ReviewState =
  "APPROVED" |
  "CHANGES_REQUESTED" |
  "COMMENTED" |
  "DISMISSED" |
  "PENDING";
