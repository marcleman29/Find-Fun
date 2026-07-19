export type PlaceCategory = 'thingsToDo' | 'placesToVisit' | 'placesToEat';

export interface ReviewSnippet {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  rating: number;
  reviewCount: number;
  topReviews: ReviewSnippet[];
}

export interface RankedPlace extends Place {
  qualityScore: number;
  aiHighlight?: string;
}
