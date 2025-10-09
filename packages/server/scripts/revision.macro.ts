import simpleGit from "simple-git";

const git = simpleGit();

export async function getRevision() {
  const { latest } = await git.log({ maxCount: 1 });
  return latest;
}
