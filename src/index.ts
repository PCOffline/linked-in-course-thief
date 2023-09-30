import puppeteer from 'puppeteer';
import 'dotenv/config';
import { writeFile } from 'fs/promises';
import { elementQueries, sleep, defaultValues } from './utils.js';
import type { Episode, Section } from './types.js';

if (!process.env.COURSE_URL) {
  throw new Error('Please provide the course URL');
}

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: ['--start-maximized'],
});
const page = await browser.newPage();

page.setDefaultTimeout(
  +(process.env.LOGIN_TIMEOUT ?? defaultValues.loginTimeout),
);

await page.goto(process.env.COURSE_URL);
await page.waitForSelector(elementQueries.video.video);

const getCurrentEpisode = async (): Promise<Episode> => ({
  title: await page.title(),
  link: await page.evaluate(
    (elementQueries) =>
      (
        document.querySelector(
          elementQueries.video.video,
        ) as HTMLVideoElement | null
      )?.src ?? '',
    elementQueries,
  ),
  duration: await page.evaluate(
    (elementQueries) =>
      (
        document.querySelector(
          elementQueries.video.duration,
        ) as HTMLSpanElement | null
      )?.textContent ?? '',
    elementQueries,
  ),
});

const sectionsLength: number =
  (await page.evaluate(
    (elementQueries) =>
      document.querySelector(elementQueries.sidebar.sections)?.children.length,
    elementQueries,
  )) ?? 0;

const sections: Section[] = [];

for (let index = 0; index < sectionsLength; index++) {
  const sectionQuery = `${elementQueries.sidebar.sections} section:nth-child(${
    index + 1
  })`;
  await page.click(sectionQuery);

  const { title, episodesLength }: { title: string; episodesLength: number } =
    await page.evaluate((sectionQuery) => {
      const title: string =
        document.querySelector(
          `${sectionQuery} > h2 > button > span.classroom-toc-section__toggle-title`,
        )?.textContent ?? '';
      const episodesLength: number = document.querySelectorAll(
        `${sectionQuery} > ul > li > a`,
      ).length;

      return { title, episodesLength };
    }, sectionQuery);

  const episodes: Episode[] = [];

  for (let episodeIndex = 0; episodeIndex < episodesLength; episodeIndex++) {
    await page.click(
      `${sectionQuery} > ul > li:nth-child(${episodeIndex + 1}) > a`,
    );
    await sleep(
      +(
        process.env.DELAY_BETWEEN_EPISODES ?? defaultValues.delayBetweenEpisodes
      ),
    );
    episodes.push(await getCurrentEpisode());
  }

  sections.push({
    title,
    episodes,
  });
}

await browser.close();

await writeFile(
  './output.md',
  sections.reduce(
    (sectionsString: string, section: Section) =>
      `${sectionsString}## ${section.title.trim()}\n${section.episodes.reduce(
        (episodesString: string, episode: Episode, index: number): string =>
          `${episodesString}${index}. [${episode.title.trim()}](${
            episode.link
          }) ${episode.duration}\n`,
        '',
      )}\n`,
    '',
  ),
);
