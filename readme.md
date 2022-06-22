# GitHub PR metrics reader thingo

# Prerequisites
- node 16

# Quick start
Create a GitHub access token: https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql

Save it to a file named .env with the following contents:

```
GITHUB_GRAPHQL_TOKEN=your-secret-token-value
```

Then,

```sh
# print help info
npm start -- --help
# get stats for a repo
npm start -- -r my-org/my-repo
```

# to do
- inline todos
