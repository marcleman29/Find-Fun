import type { Place } from '../lib/types';

// Placeholder dataset standing in for the Google Places/Reviews API integration
// (roadmap item 2). Shape mirrors what that integration will need to provide.
export const mockLocation = 'Portland, OR';

export const mockPlaces: Place[] = [
  {
    id: 'td-1',
    name: 'Forest Park Trails',
    category: 'thingsToDo',
    address: 'NW 29th Ave, Portland, OR',
    rating: 4.8,
    reviewCount: 3200,
    topReviews: [
      {
        id: 'td-1-r1',
        author: 'Jamie',
        rating: 5,
        text: 'Miles of quiet, well-marked trails right in the city. Went at sunrise and had it almost to myself.',
        date: '2026-05-02',
      },
      {
        id: 'td-1-r2',
        author: 'Priya',
        rating: 5,
        text: 'Best urban hike I have done. Bring water, some sections are steep.',
        date: '2026-03-14',
      },
    ],
  },
  {
    id: 'td-2',
    name: 'Escape Room Collective',
    category: 'thingsToDo',
    address: 'SE Division St, Portland, OR',
    rating: 4.6,
    reviewCount: 540,
    topReviews: [
      {
        id: 'td-2-r1',
        author: 'Marcus',
        rating: 5,
        text: 'Clever puzzles, great game master. Did two rooms back to back.',
        date: '2026-06-01',
      },
    ],
  },
  {
    id: 'td-3',
    name: 'Riverfront Kayak Rentals',
    category: 'thingsToDo',
    address: 'SW Naito Pkwy, Portland, OR',
    rating: 4.3,
    reviewCount: 210,
    topReviews: [
      {
        id: 'td-3-r1',
        author: 'Lena',
        rating: 4,
        text: 'Fun way to see the city from the water. Staff was helpful for first-timers.',
        date: '2025-08-20',
      },
    ],
  },
  {
    id: 'pv-1',
    name: 'International Rose Test Garden',
    category: 'placesToVisit',
    address: 'SW Kingston Ave, Portland, OR',
    rating: 4.9,
    reviewCount: 8100,
    topReviews: [
      {
        id: 'pv-1-r1',
        author: 'Anders',
        rating: 5,
        text: 'Stunning even outside of peak bloom. Free to enter, incredible city views.',
        date: '2026-06-18',
      },
      {
        id: 'pv-1-r2',
        author: 'Sofia',
        rating: 5,
        text: 'Went three times this year, always find a new corner of the garden.',
        date: '2026-04-11',
      },
    ],
  },
  {
    id: 'pv-2',
    name: 'Powell’s City of Books',
    category: 'placesToVisit',
    address: 'W Burnside St, Portland, OR',
    rating: 4.7,
    reviewCount: 12400,
    topReviews: [
      {
        id: 'pv-2-r1',
        author: 'Grace',
        rating: 5,
        text: 'A whole city block of books across multiple floors. Easy to lose a few hours here.',
        date: '2026-02-27',
      },
    ],
  },
  {
    id: 'pv-3',
    name: 'Pittock Mansion Overlook',
    category: 'placesToVisit',
    address: 'NW Pittock Dr, Portland, OR',
    rating: 4.5,
    reviewCount: 640,
    topReviews: [
      {
        id: 'pv-3-r1',
        author: 'Tom',
        rating: 4,
        text: 'Grounds are free and the view of Mt. Hood on a clear day is worth the trip alone.',
        date: '2025-11-05',
      },
    ],
  },
  {
    id: 'pe-1',
    name: 'Pine Street Noodle House',
    category: 'placesToEat',
    address: 'SW Pine St, Portland, OR',
    rating: 4.7,
    reviewCount: 980,
    topReviews: [
      {
        id: 'pe-1-r1',
        author: 'Wei',
        rating: 5,
        text: 'Hand-pulled noodles are the real deal. Broth has serious depth of flavor.',
        date: '2026-07-01',
      },
      {
        id: 'pe-1-r2',
        author: 'Dana',
        rating: 5,
        text: 'Went back three times in one week. Portions are generous too.',
        date: '2026-05-22',
      },
    ],
  },
  {
    id: 'pe-2',
    name: 'Cart Block Food Trucks',
    category: 'placesToEat',
    address: 'SW 10th Ave, Portland, OR',
    rating: 4.4,
    reviewCount: 2100,
    topReviews: [
      {
        id: 'pe-2-r1',
        author: 'Oscar',
        rating: 4,
        text: 'Great variety, something for every craving. Get there early on weekends.',
        date: '2026-01-15',
      },
    ],
  },
  {
    id: 'pe-3',
    name: 'Neighborhood Diner',
    category: 'placesToEat',
    address: 'NE Alberta St, Portland, OR',
    rating: 4.2,
    reviewCount: 75,
    topReviews: [
      {
        id: 'pe-3-r1',
        author: 'Ruth',
        rating: 4,
        text: 'Small spot, huge portions of comfort food. Cash only.',
        date: '2025-06-30',
      },
    ],
  },
];
