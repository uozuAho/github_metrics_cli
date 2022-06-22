import { request, gql } from 'graphql-request';

export async function loadPrs(
  repo: string,
  apiToken: string)
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

  console.log(nextPage);
}
