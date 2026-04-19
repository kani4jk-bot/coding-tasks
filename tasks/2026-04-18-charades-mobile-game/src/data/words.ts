export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  words: string[];
};

export const CATEGORIES: Category[] = [
  {
    id: 'movies',
    name: 'Movies',
    emoji: '🎬',
    color: '#E74C3C',
    words: [
      'Titanic', 'The Lion King', 'Jurassic Park', 'Home Alone', 'The Matrix',
      'Avatar', 'Frozen', 'Toy Story', 'Finding Nemo', 'The Avengers',
      'Star Wars', 'Harry Potter', 'Indiana Jones', 'Back to the Future',
      'The Godfather', 'Jaws', 'E.T.', 'Forrest Gump', 'The Shining',
      'Ghostbusters', 'Spider-Man', 'Batman', 'Superman', 'The Dark Knight',
      'Pirates of the Caribbean', 'The Little Mermaid', 'Beauty and the Beast',
      'Shrek', 'Moana', 'Coco', 'Ratatouille', 'Up', 'WALL-E', 'Cars',
      'The Incredibles', 'Monsters Inc', 'Kung Fu Panda', 'Despicable Me',
    ],
  },
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🦁',
    color: '#F39C12',
    words: [
      'Elephant', 'Giraffe', 'Penguin', 'Kangaroo', 'Flamingo',
      'Gorilla', 'Cheetah', 'Dolphin', 'Octopus', 'Porcupine',
      'Crocodile', 'Peacock', 'Sloth', 'Meerkat', 'Platypus',
      'Hummingbird', 'Chameleon', 'Jellyfish', 'Lobster', 'Seahorse',
      'Panda', 'Koala', 'Wombat', 'Armadillo', 'Hedgehog',
      'Toucan', 'Parrot', 'Pelican', 'Stingray', 'Hammerhead shark',
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    emoji: '🏃',
    color: '#27AE60',
    words: [
      'Swimming', 'Skipping', 'Juggling', 'Surfing', 'Rock climbing',
      'Knitting', 'Painting', 'Conducting an orchestra', 'Tightrope walking',
      'Snowboarding', 'Skateboarding', 'Hula hooping', 'Jump roping',
      'Karate', 'Ballet dancing', 'Breakdancing', 'Playing guitar',
      'Brushing teeth', 'Eating spaghetti', 'Sneezing', 'Yawning',
      'Taking a selfie', 'Texting', 'Drinking coffee', 'Walking a dog',
      'Blowing bubbles', 'Building a sandcastle', 'Flying a kite',
    ],
  },
  {
    id: 'famous',
    name: 'Famous People',
    emoji: '⭐',
    color: '#9B59B6',
    words: [
      'Albert Einstein', 'Napoleon Bonaparte', 'Cleopatra', 'Elvis Presley',
      'Marilyn Monroe', 'Michael Jackson', 'Beyoncé', 'Taylor Swift',
      'LeBron James', 'Usain Bolt', 'Serena Williams', 'David Bowie',
      'Freddie Mercury', 'Queen Elizabeth', 'Abraham Lincoln', 'Neil Armstrong',
      'Pablo Picasso', 'Leonardo da Vinci', 'Shakespeare', 'Mozart',
      'Oprah Winfrey', 'Elon Musk', 'Mark Zuckerberg', 'Steve Jobs',
    ],
  },
  {
    id: 'places',
    name: 'Places',
    emoji: '🗺️',
    color: '#1ABC9C',
    words: [
      'Eiffel Tower', 'Great Wall of China', 'Colosseum', 'Taj Mahal',
      'Niagara Falls', 'Grand Canyon', 'Big Ben', 'Statue of Liberty',
      'Sydney Opera House', 'Stonehenge', 'Mount Everest', 'Amazon Rainforest',
      'Sahara Desert', 'Antarctica', 'Times Square', 'Las Vegas',
      'Hollywood', 'Disneyland', 'Area 51', 'The White House',
      'Buckingham Palace', 'Vatican City', 'Machu Picchu', 'Angkor Wat',
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    emoji: '🍕',
    color: '#E67E22',
    words: [
      'Pizza', 'Sushi', 'Tacos', 'Hamburger', 'Spaghetti',
      'Ice cream cone', 'Cotton candy', 'Birthday cake', 'Popcorn',
      'Hot dog', 'Pancakes', 'Waffle', 'Croissant', 'Pretzel',
      'Lobster', 'Smore', 'Fondue', 'Guacamole', 'Dim sum',
      'Churros', 'Baklava', 'Ramen', 'Burrito', 'Nachos',
    ],
  },
  {
    id: 'tv',
    name: 'TV Shows',
    emoji: '📺',
    color: '#3498DB',
    words: [
      'Friends', 'The Office', 'Stranger Things', 'Breaking Bad',
      'Game of Thrones', 'The Simpsons', 'Seinfeld', 'Parks and Recreation',
      'Brooklyn Nine-Nine', 'The Crown', 'Squid Game', 'Euphoria',
      'Bridgerton', 'Ted Lasso', 'Succession', 'The Mandalorian',
      'Sherlock', 'Black Mirror', 'Peaky Blinders', 'Downton Abbey',
      'Grey's Anatomy', 'Survivor', 'The Bachelor', 'Jeopardy',
    ],
  },
  {
    id: 'objects',
    name: 'Objects',
    emoji: '📦',
    color: '#7F8C8D',
    words: [
      'Telescope', 'Accordion', 'Boomerang', 'Sombrero', 'Briefcase',
      'Megaphone', 'Compass', 'Hourglass', 'Magnifying glass', 'Periscope',
      'Stethoscope', 'Typewriter', 'Boombox', 'Lava lamp', 'Pinata',
      'Trampoline', 'Yo-yo', 'Skateboard', 'Snowglobe', 'Trophy',
      'Walkie-talkie', 'Binoculars', 'Abacus', 'Kaleidoscope',
    ],
  },
  {
    id: 'countries',
    name: 'Countries',
    emoji: '🌍',
    color: '#2980B9',
    words: [
      'Brazil', 'Australia', 'Japan', 'Egypt', 'Canada',
      'Mexico', 'France', 'Russia', 'India', 'China',
      'Argentina', 'South Africa', 'Italy', 'Germany', 'Spain',
      'Thailand', 'Greece', 'Sweden', 'Switzerland', 'Portugal',
      'New Zealand', 'Kenya', 'Morocco', 'Colombia', 'Peru',
      'Turkey', 'Norway', 'Netherlands', 'Ireland', 'Scotland',
      'Cuba', 'Jamaica', 'Iceland', 'Finland', 'Vietnam',
      'Indonesia', 'Philippines', 'Pakistan', 'Bangladesh', 'Nigeria',
    ],
  },
];

export function getShuffledWords(categoryIds: string[], count: number): string[] {
  const pool: string[] = [];
  for (const cat of CATEGORIES) {
    if (categoryIds.includes(cat.id)) {
      pool.push(...cat.words);
    }
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
