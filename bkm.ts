import * as buildkite from './buildkite';

export interface BkmOptions {
  pipeline: string;
  /** Filter builds by labels containing this string */
  filter: string | null;
  /** Load builds from this date (defaults to last 2 weeks) */
  dateFrom: Date | null;
}

export const defaultBkmOptions = {
  filter: null,
  dateFrom: null
};

export interface Builds {
  builds: buildkite.BuildInfo[];
  summary: BuildsSummary
};

export async function loadBuilds(
  options: BkmOptions,
  buildkiteToken: string): Promise<Builds>
{
  const buildFilter = (build: buildkite.BuildInfo) => options.filter
    ? build.name.includes(options.filter)
    : true;

  const twoWeeksAgo = new Date(new Date().setDate(new Date().getDate() - 14));
  const dateFrom = options.dateFrom ?? twoWeeksAgo;
  options = {
    ...options,
    dateFrom
  }

  const builds = await buildkite.loadBuilds(
      options.pipeline,
      buildkiteToken,
      options.dateFrom!)
    .then(builds => builds.filter(b => buildFilter(b)));

  const summary = summariseBuilds(builds, dateFrom, new Date());

  return {
    builds,
    summary
  };
}

export interface BuildsSummary {
  numBuilds: number;
  buildsPerWeek: number;
  passRate: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
}

function summariseBuilds(
  builds: buildkite.BuildInfo[],
  dateFrom: Date,
  dateTo: Date): BuildsSummary
{
  const numBuilds = builds.length;
  const buildsPerWeek = countBuildsPerWeek(builds, dateFrom, dateTo);

  return {
    numBuilds,
    buildsPerWeek,
    passRate: 100 * builds.filter(b => b.pass).length / numBuilds,
    minDuration: Math.min(...builds.map(b => b.duration_min)),
    maxDuration: Math.max(...builds.map(b => b.duration_min)),
    avgDuration: average(builds.map(b => b.duration_min))
  }
}

function countBuildsPerWeek(
  builds: buildkite.BuildInfo[],
  dateFrom: Date,
  dateTo: Date)
{
  const numBuilds = builds.length;
  const timeRangeMs = dateTo.getTime() - dateFrom.getTime();
  const timeRangeWeeks = timeRangeMs / 1000 / 3600 / 24 / 7;

  return numBuilds / timeRangeWeeks;
}

function average(numbers: number[]) {
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}
