import { App, Octokit } from "octokit";

export const repo = "OpenHospi";
export const owner = "OpenHospi";
export const DocsCategory = "Docs Feedback";

let instance: Octokit | undefined;

async function getOctokit(): Promise<Octokit> {
  if (instance) return instance;
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("Missing GitHub App credentials for docs feedback.");
  }

  const app = new App({ appId, privateKey });
  const { data } = await app.octokit.request("GET /repos/{owner}/{repo}/installation", {
    owner,
    repo,
    headers: { "X-GitHub-Api-Version": "2022-11-28" },
  });

  instance = await app.getInstallationOctokit(data.id);
  return instance;
}

interface RepositoryInfo {
  id: string;
  discussionCategories: {
    nodes: { id: string; name: string }[];
  };
}

let cachedDestination: RepositoryInfo | undefined;

async function getFeedbackDestination() {
  if (cachedDestination) return cachedDestination;
  const octokit = await getOctokit();

  const { repository }: { repository: RepositoryInfo } = await octokit.graphql(`
      query {
        repository(owner: "${owner}", name: "${repo}") {
          id
          discussionCategories(first: 25) {
            nodes { id name }
          }
        }
      }
    `);

  return (cachedDestination = repository);
}

interface ActionResponse {
  githubUrl: string;
}

export async function onPageFeedbackAction(feedback: {
  url: string;
  opinion: string;
  message: string;
}): Promise<ActionResponse> {
  return createDiscussionThread(
    feedback.url,
    `[${feedback.opinion}] ${feedback.message}\n\n> Doorgestuurd vanuit docs feedback.`,
  );
}

async function createDiscussionThread(pageId: string, body: string): Promise<ActionResponse> {
  const octokit = await getOctokit();
  const destination = await getFeedbackDestination();
  const category = destination.discussionCategories.nodes.find((c) => c.name === DocsCategory);

  if (!category) {
    throw new Error(`Maak eerst een "${DocsCategory}" categorie aan in GitHub Discussions.`);
  }

  const title = `Feedback for ${pageId}`;
  const {
    search: {
      nodes: [discussion],
    },
  }: { search: { nodes: { id: string; url: string }[] } } = await octokit.graphql(`
      query {
        search(
          type: DISCUSSION,
          query: ${JSON.stringify(`${title} in:title repo:${owner}/${repo} author:@me`)},
          first: 1
        ) {
          nodes { ... on Discussion { id, url } }
        }
      }
    `);

  if (discussion) {
    const result: {
      addDiscussionComment: { comment: { id: string; url: string } };
    } = await octokit.graphql(`
      mutation {
        addDiscussionComment(input: {
          body: ${JSON.stringify(body)},
          discussionId: "${discussion.id}"
        }) {
          comment { id, url }
        }
      }
    `);
    return { githubUrl: result.addDiscussionComment.comment.url };
  } else {
    const result: {
      createDiscussion: { discussion: { id: string; url: string } };
    } = await octokit.graphql(`
      mutation {
        createDiscussion(input: {
          repositoryId: "${destination.id}",
          categoryId: "${category.id}",
          body: ${JSON.stringify(body)},
          title: ${JSON.stringify(title)}
        }) {
          discussion { id, url }
        }
      }
    `);
    return { githubUrl: result.createDiscussion.discussion.url };
  }
}
