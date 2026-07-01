export interface SeedStory {
  id: string;
  title: string;
  author: string;
  genre_tags: string[];
  estimated_minutes: number;
  body_text: string;
}

export const SEED_STORIES: SeedStory[] = [
  {
    id: 'story-tortoise-hare',
    title: 'The Tortoise and the Hare',
    author: 'Aesop',
    genre_tags: ['Philosophy', 'Fiction'],
    estimated_minutes: 3,
    body_text: `A Hare was one day making fun of a Tortoise for being so slow on his feet.
"Do you ever get anywhere?" he asked with a mocking laugh.
"Yes," replied the Tortoise, "and I get there sooner than you think. I'll run you a race and prove it."

The Hare was much amused at the idea of running a race with the Tortoise, but for the fun of the thing he agreed. So the Fox, who had consented to act as judge, marked the distance and started the runners off.

The Hare was soon far out of sight, and to make the Tortoise feel very deeply how ridiculous it was for him to try a race with a Hare, he lay down beside the course to take a nap until the Tortoise should catch up.

The Tortoise meanwhile kept going slowly but steadily, and, after a time, passed the place where the Hare was sleeping. But the Hare slept on very peacefully; and when at last he did wake up, the Tortoise was near the goal. The Hare now ran his swiftest, but he could not overtake the Tortoise in time.

Slow and steady wins the race. Keep this lesson close to heart as you build your reading habit! It's not about how fast you read, but the consistency of opening a book every single day.`,
  },
  {
    id: 'story-tell-tale-heart',
    title: 'The Tell-Tale Heart',
    author: 'Edgar Allan Poe',
    genre_tags: ['Mystery', 'Fiction'],
    estimated_minutes: 8,
    body_text: `TRUE!—nervous—very, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses—not destroyed—not dulled them. Above all was the sense of hearing acute. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad? Hearken! and observe how healthily—how calmly I can tell you the whole story.

It is impossible to say how first the idea entered my brain; but once conceived, it haunted me day and night. Object there was none. Passion there was none. I loved the old man. He had never wronged me. He had never given me insult. For his gold I had no desire. I think it was his eye! yes, it was this! He had the eye of a vulture—a pale blue eye, with a film over it. Whenever it fell upon me, my blood ran cold; and so by degrees—very gradually—I made up my mind to take the life of the old man, and thus rid myself of the eye forever.

Now this is the point. You fancy me mad. Madmen know nothing. But you should have seen me. You should have seen how wisely I proceeded—with what caution—with what foresight—with what dissimulation I went to work! I was never kinder to the old man than during the whole week before I killed him.

And every night, about midnight, I turned the latch of his door and opened it—oh so gently! And then, when I had made an opening sufficient for my head, I put in a dark lantern, all closed, closed, that no light shone out, and then I thrust in my head. Oh, you would have laughed to see how cunningly I thrust it in! I moved it slowly—very, very slowly, so that I might not disturb the old man's sleep. It took me an hour to place my whole head within the opening so far that I could see him as he lay upon his bed. Would a madman have been so wise as this?`,
  },
  {
    id: 'story-self-reliance',
    title: 'On Self-Reliance',
    author: 'Ralph Waldo Emerson',
    genre_tags: ['Self-Improvement', 'Philosophy', 'Essays'],
    estimated_minutes: 6,
    body_text: `There is a time in every man's education when he arrives at the conviction that envy is ignorance; that imitation is suicide; that he must take himself for better, for worse, as his portion; that though the wide universe is full of good, no kernel of nourishing corn can come to him but through his toil bestowed on that plot of ground which is given to him to till. The power which resides in him is new in nature, and none but he knows what that is which he can do, nor does he know until he has tried.

Trust thyself: every heart vibrates to that iron string. Accept the place the divine providence has found for you, the society of your contemporaries, the connection of events. Great men have always done so, and confided themselves childlike to the genius of their age, betraying their perception that the absolutely trustworthy was seated at their heart, working through their hands, predominating in all their being. And we are now men, and must accept in the highest mind the same transcendent destiny; and not minors and invalids in a protected corner, but guides, redeemers, and benefactors, obeying the Almighty effort, and advancing on Chaos and the Dark.

Whoso would be a man must be a nonconformist. He who would gather immortal palms must not be hindered by the name of goodness, but must explore if it be goodness. Nothing is at last sacred but the integrity of your own mind. Absolve you to yourself, and you shall have the splendor of the world.`,
  },
  {
    id: 'story-art-of-war',
    title: 'The Art of War: Detail Planning',
    author: 'Sun Tzu',
    genre_tags: ['Philosophy', 'Non-Fiction', 'Career'],
    estimated_minutes: 5,
    body_text: `Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.

The art of war, then, is governed by five constant factors, to be taken into account in one's deliberations, when seeking to determine the conditions obtaining in the field. These are:
1. The Moral Law
2. Heaven
3. Earth
4. The Commander
5. Method and Discipline

The Moral Law causes the people to be in complete accord with their ruler, so that they will follow him regardless of their lives, undismayed by any danger.

Heaven signifies night and day, cold and heat, times and seasons.
Earth comprises distances, great and small; danger and security; open ground and narrow passes; the chances of life and death.
The Commander stands for the virtues of wisdom, sincerely, benevolence, courage, and strictness.
Method and discipline are to be understood the marshaling of the army in its proper subdivisions, the gradations of rank among the officers, the maintenance of roads by which supplies may reach the army, and the control of military expenditure.

These five heads should be familiar to every general: he who knows them will be victorious; he who knows them not will fail.`,
  },
  {
    id: 'story-story-of-an-hour',
    title: 'The Story of an Hour',
    author: 'Kate Chopin',
    genre_tags: ['Fiction'],
    estimated_minutes: 7,
    body_text: `Knowing that Mrs. Mallard was afflicted with a heart trouble, great care was taken to break to her as gently as possible the news of her husband's death.

It was her sister Josephine who told her, in broken sentences; veiled hints that revealed in half concealing. Her husband's friend Richards was there, too, near her. It was he who had been in the newspaper office when intelligence of the railroad disaster was received, with Brently Mallard's name leading the list of "killed." He had only taken the time to assure himself of its truth by a second telegram, and had hastened to forestall any less careful, less tender friend in bearing the sad message.

She did not hear the story as many women have heard the same, with a paralyzed inability to accept its significance. She wept at once, with sudden, wild abandonment, in her sister's arms. When the storm of grief had spent itself she went away to her room alone. She would have no one follow her.

There stood, facing the open window, a comfortable, roomy armchair. Into this she sank, pressed down by a physical exhaustion that haunted her body and seemed to reach into her soul.

She could see in the open square before her house the tops of trees that were all aquiver with the new spring life. The delicious breath of rain was in the air. In the street below a peddler was crying his wares. The notes of a distant song which some one was singing reached her faintly, and countless sparrows were twittering in the eaves.`,
  },
  {
    id: 'story-metamorphosis',
    title: 'The Metamorphosis',
    author: 'Franz Kafka',
    genre_tags: ['Fiction', 'Sci-Fi', 'Philosophy'],
    estimated_minutes: 10,
    body_text: `One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved helplessly before his eyes.

"What's happened to me?" he thought. It wasn't a dream. His room, a proper human room although a little too small, lay peacefully between its four familiar walls. A collection of textile samples lay spread out on the table - Samsa was a travelling salesman - and above it hung a picture that he had recently cut out of an illustrated magazine and housed in a nice, gilded frame. It showed a lady fitted out with a fur hat and fur boa who sat upright, raising a heavy fur muff that covered the whole of her lower arm towards the viewer.

Gregor then turned to look out the window at the dull weather. Drops of rain could be heard hitting the pane, which made him feel quite sad. "How about if I sleep a little bit longer and forget all this nonsense", he thought, but that was something he was unable to do because he was used to sleeping on his right, and in his present state he couldn't get into that position. However hard he threw himself onto his right, he always rolled back to where he was.`,
  },
  {
    id: 'story-philosophy-essays',
    title: 'Meditation on Time',
    author: 'Seneca',
    genre_tags: ['Philosophy', 'Self-Improvement', 'Essays'],
    estimated_minutes: 6,
    body_text: `It is not that we have a short time to live, but that we waste a lot of it. Life is long enough, and a sufficiently generous estimate has been given to us for the highest achievements if it were all well invested. But when it is wasted in heedless luxury and spent on no good activity, we are forced at last by death's final constraint to realize that it has passed away before we knew it was passing.

So it is: we are not given a short life but we make it short, and we are not ill-supplied but wasteful of it. Just as great and princely wealth is scattered in a moment when it comes into the hands of a bad owner, while wealth however limited, if it is entrusted to a good guardian, increases by use, so our life-span is ample for one who disposes of it well.

Why do we complain of Nature? She has shown herself kindly; life, if you know how to use it, is long. But one man is gripped by insatiable greed, another by a laborious dedication to useless tasks; one man is soaked in wine, another sluggish with idleness; one is worn out by political ambition, which is always at the mercy of others' judgments.

No one yields possession of his lands to others, yet how readily we let others trespass on our lives! We are tight-fisted with our property, but throw away our time, the one thing in which it is right to be stingy.`,
  }
];
