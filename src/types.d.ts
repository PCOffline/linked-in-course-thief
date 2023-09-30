export interface Episode {
  title: string;
  duration: string;
  link: string;
}

export interface Section {
  title: string;
  episodes: Episode[];
}
