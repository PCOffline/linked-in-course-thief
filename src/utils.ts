export const sleep = (time: number): Promise<void> =>
  new Promise((r) => setTimeout(r, time));

export const elementQueries = {
  video: {
    video: 'video.vjs-tech',
    duration: 'div.vjs-time-display div.vjs-duration span.vjs-duration-display',
  },
  sidebar: {
    sections: 'section.classroom-layout__sidebar > div',

  },
};

export const defaultValues = {
  loginTimeout: 120_000,
  delayBetweenEpisodes: 5000,
}
