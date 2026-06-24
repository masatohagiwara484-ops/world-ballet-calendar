/**
 * The Journal — première's editorial layer.
 *
 * This is the long-tail SEO + curation moat (ROADMAP #9): evergreen travel
 * guides, work explainers and company stories that target the searches an
 * aggregator ignores ("a ballet weekend in Paris", "Swan Lake explained"), then
 * feed the affiliate / trip funnel. Content is hand-written and EVERGREEN — no
 * performance dates, prices or "now playing" claims (that would violate the
 * trust policy and rot). Dated, bookable data lives in Supabase; this file is
 * durable editorial only.
 */

export type JournalCategory = 'Travel guide' | 'Work explainer' | 'Company story'

export type JournalBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }

export interface JournalArticle {
  slug: string
  category: JournalCategory
  title: string
  /** One-sentence standfirst. */
  dek: string
  readingTime: string
  /** Stable key for the GradientArt hero palette. */
  heroSeed: string
  publishedLabel: string
  body: JournalBlock[]
  /** Company slugs to cross-link at the foot of the article (internal SEO). */
  relatedCompanySlugs?: string[]
  seo: { description: string; keywords: string[] }
  /** Foot-of-article call to action that feeds the funnel. */
  cta?: { kind: 'trip' | 'newsletter'; city?: string }
}

export const journal: JournalArticle[] = [
  {
    slug: "ballet-weekend-in-paris",
    category: "Travel guide",
    title: "A Ballet Weekend in Paris",
    dek: "How to plan two perfect days in the French capital around its greatest stage — the Palais Garnier — and make a true night of it.",
    readingTime: "7 min",
    heroSeed: "ballet-weekend-in-paris",
    publishedLabel: "June 2026",
    body: [
      { type: "p", text: "Paris invented much of what the world now calls ballet, and it has never quite stopped. To plan a weekend here around a performance is not to bolt culture onto a city break — it is to organise the whole trip around a single, glittering evening, and to let the city arrange itself around that fixed point. The dancing is the reason; everything else becomes the setting." },
      { type: "p", text: "The fixed point is almost always the Palais Garnier. Charles Garnier’s opera house, opened in 1875, is the most theatrical building in a city full of them — a wedding cake of marble, gilt and red velvet that was designed, quite deliberately, so that the audience could perform for one another as much as the company performs for the audience. An evening here begins long before the curtain." },
      { type: "h2", text: "The house itself" },
      { type: "p", text: "Arrive early. The Grand Staircase exists to be ascended slowly, and the great foyer — a hall of mirrors and chandeliers consciously modelled on Versailles — rewards the visitor who treats the interval as part of the show rather than a pause in it. Above the auditorium hangs Marc Chagall’s 1964 ceiling, a swirl of composers and dancers that floats, gloriously out of period, over all that nineteenth-century gold." },
      { type: "p", text: "A word on which house to choose. The company performs across two homes: the historic Garnier and the modern Opéra Bastille, a larger, plainer auditorium near the Place de la Bastille. For a first ballet weekend, the Garnier is the romance — the building is half the experience. The Bastille has the sightlines and the scale for grand opera. Check which work plays where before committing, and let the building inform the trip." },
      { type: "quote", text: "One does not simply attend the ballet in Paris. One dresses, one arrives early, one climbs the staircase slowly — and the evening becomes the reason the city was worth crossing a continent for." },
      { type: "h2", text: "Shaping the two days" },
      { type: "p", text: "Build the weekend so that the performance is the summit of the second evening, not an exhausted afterthought. The afternoon before should be unhurried — the body remembers a long museum day, and so does the spine in a velvet seat. A simple rhythm works well." },
      { type: "list", items: ["Friday evening: settle into a quarter you can walk — the Opéra district, the Marais, or Saint-Germain — and dine close to where you sleep.", "Saturday morning: the Louvre or the Musée d’Orsay, then a slow lunch; keep the legs fresh for the night ahead.", "Saturday late afternoon: rest, dress, and allow far more time than seems necessary to reach the house.", "Sunday: a matinée if the schedule offers one, or a long walk along the Seine to let the night settle before the journey home."] },
      { type: "p", text: "Where to stay follows from where you want to walk home. A room within strolling distance of the Garnier — through the Opéra quarter or across to the Right Bank — means the after-theatre glow is not spent in a taxi queue. The pleasure of a Paris ballet night is partly the walk back through lamplit streets, still half inside the music." },
      { type: "h2", text: "Making a night of it" },
      { type: "p", text: "Parisians treat the evening as a single composed arc: an early, light dinner so the meal does not fight the performance, the ballet itself, then a glass somewhere quiet afterward to let it land. The interval is for champagne in the foyer, not for rushing. Reserve any post-performance table in advance — the better rooms near the house fill on performance nights, and the city is unforgiving of the unbooked." },
      { type: "p", text: "Dress is a courtesy rather than a rule. There is no enforced code, but Paris is a city that rewards the effort, and a great house on a great night is precisely the occasion to make some. The reward is the rarest thing a weekend can offer: a single evening you will still be describing, in detail, years from now." }
    ],
    relatedCompanySlugs: ["paris-opera-ballet", "opera-national-de-paris"],
    seo: { description: "Plan a ballet weekend in Paris around the Palais Garnier — the house, the city, where to stay and how to make a true night of the performance.", keywords: ["ballet weekend in paris", "palais garnier guide", "paris ballet travel guide", "opera garnier ballet evening", "ballet trip paris", "what to wear ballet paris", "paris opera house visit", "ballet break in paris"] },
    cta: { kind: "trip", city: "Paris" }
  },
  {
    slug: "swan-lake-explained",
    category: "Work explainer",
    title: "Swan Lake, explained: a first-timer’s guide",
    dek: "The story, the score, and the famous white-and-black swan — everything a newcomer needs to fall for the most beloved ballet ever made.",
    readingTime: "6 min",
    heroSeed: "swan-lake-explained",
    publishedLabel: "June 2026",
    body: [
      { type: "h2", text: "What Swan Lake is, in one breath" },
      { type: "p", text: "Swan Lake is the ballet that taught the world what ballet could be. A prince falls in love with a woman cursed to live as a swan by day; a sorcerer sends his own daughter, disguised as the swan’s mirror image, to break the spell of that love. It is a story of devotion and deception told almost entirely without words — through bodies, light, and one of the most famous scores ever written. If you only ever see one ballet, this is the one most people mean." },
      { type: "p", text: "Part of its magic is how legible it is. You do not need to read a synopsis to follow the feeling in the room. The white swans move as one shimmering organism; the court scenes glitter with menace; the lake itself seems to breathe. Newcomers often arrive braced for something forbidding and leave surprised by how directly it lands." },
      { type: "h2", text: "The story, scene by scene" },
      { type: "p", text: "Prince Siegfried, pressed by his mother to choose a bride, escapes to a moonlit lake where he meets Odette, queen of the swan-maidens. By day she and her companions are swans; only at night, and only here, do they return to human form. The villain Von Rothbart holds them under his spell, which can be broken only by a vow of true and faithful love. Siegfried swears it." },
      { type: "p", text: "At the palace ball, Von Rothbart arrives with his daughter Odile, transformed to look exactly like Odette. Dazzled, Siegfried pledges himself to the wrong woman — and in doing so dooms the right one. The final act returns to the lake, where prince and swan-queen confront the consequences of the broken promise. Endings vary by production: some close in tragedy, some in transcendence, a few in hard-won triumph. That flexibility is a feature, not a flaw." },
      { type: "list", items: [
        "Act I — the prince’s coming-of-age at court, and his flight to the lake.",
        "Act II — the lakeside meeting with Odette and the corps of white swans.",
        "Act III — the glittering ball, the deception by Odile, the broken vow.",
        "Act IV — the return to the lake and the reckoning between love and the curse."
      ] },
      { type: "h2", text: "Tchaikovsky’s score, and why it endures" },
      { type: "p", text: "When Pyotr Ilyich Tchaikovsky composed Swan Lake in the 1870s, dance music was largely treated as decorative filler. He wrote something closer to a symphony — themes that recur, deepen, and darken across the evening. The plaintive oboe melody of the swan theme is among the most recognisable phrases in all of music, and it works precisely because Tchaikovsky lets it return changed each time, carrying the weight of everything that has happened since." },
      { type: "quote", text: "The orchestra is not accompanying the dancers; it is the lake, the curse, and the prince’s conscience made audible." },
      { type: "p", text: "It is worth knowing that the 1877 premiere was not the sensation history later made it. The choreography we now consider definitive came years afterward, refined by Marius Petipa and Lev Ivanov, who gave the white acts their hushed, hypnotic geometry. What survives today is a layering of hands across decades — which is why no two great companies dance quite the same Swan Lake." },
      { type: "h2", text: "What to watch for your first time" },
      { type: "p", text: "The single thing to anticipate is the dual role. In most stagings, one ballerina dances both Odette, the tender white swan, and Odile, the seductive black swan. Watching one artist flip between fragility and predatory brilliance — often within minutes — is the central thrill, and it is the clearest measure of a dancer’s range you will ever see on a stage." },
      { type: "list", items: [
        "The white-against-black contrast: notice how Odette folds inward while Odile cuts outward.",
        "The corps de ballet as a single body — the swans’ unison is the soul of Act II.",
        "Odile’s celebrated turning sequence in Act III, a feat of stamina disguised as flirtation.",
        "Von Rothbart’s presence at the edges, shaping the lovers’ fate before they notice."
      ] },
      { type: "p", text: "Come a little early, let the house lights dim, and resist the urge to decode every gesture. Swan Lake rewards surrender more than study. By the time the swan theme returns at the lake for the last time, you will understand why, more than a century on, it remains the ballet against which every other is quietly measured." }
    ],
    relatedCompanySlugs: ["royal-ballet", "bolshoi-ballet", "mariinsky-ballet"],
    seo: { description: "Swan Lake explained for first-timers: the story act by act, Tchaikovsky’s score, the white and black swan duality, and what to watch for.", keywords: ["swan lake explained", "swan lake story", "swan lake first time", "swan lake for beginners", "odette odile difference", "swan lake plot summary", "tchaikovsky swan lake", "what to watch swan lake"] },
    cta: { kind: "newsletter" }
  },
  {
    slug: "giselle-explained",
    category: "Work explainer",
    title: "Giselle, explained: love, betrayal and the Wilis",
    dek: "The Romantic ballet that turned heartbreak into something eternal — a peasant girl, a deceiving nobleman, and a moonlit army of jilted brides.",
    readingTime: "6 min",
    heroSeed: "giselle-explained",
    publishedLabel: "June 2026",
    body: [
      { type: "p", text: "Few ballets have travelled as far, or aged as gracefully, as Giselle. First staged in Paris in 1841, it remains the work by which great companies and great ballerinas are measured. To understand it is to understand the Romantic era itself — its hunger for the supernatural, its fascination with doomed love, and its conviction that a single human soul could be both fragile and unbreakable." },
      { type: "p", text: "The premise is deceptively simple. A village girl falls in love. She is betrayed. She dies. And then, in an act of grace that has moved audiences for nearly two centuries, she saves the very man who wronged her. What elevates this from melodrama to masterpiece is the architecture: two acts that mirror each other, one drenched in daylight and harvest, the other in mist and moonlight." },
      { type: "h2", text: "Act I: the village and the lie" },
      { type: "p", text: "The first act unfolds in a Rhineland village during the grape harvest. Giselle, a delicate peasant girl who loves to dance, has fallen for a young man she knows as Loys. He is in fact Albrecht, a duke in disguise, already betrothed to a noblewoman. The gamekeeper Hilarion, who loves Giselle himself, suspects the deception and sets out to expose it." },
      { type: "p", text: "When Albrecht’s true identity and his engagement are revealed, Giselle’s world collapses. The famous “mad scene” follows — a passage of dancing that unravels into grief, in which the ballerina must let technique dissolve into something that looks like genuine breakdown. Her weak heart gives way, and the act ends with her death. It is one of the most demanding sequences in the repertoire, because it asks for control in the service of total emotional abandon." },
      { type: "h2", text: "Act II: the Wilis and the forgiveness" },
      { type: "p", text: "The second act moves to Giselle’s forest grave at midnight, and the ballet becomes something otherworldly. Here we meet the Wilis — the spirits of young women betrayed before their wedding day, who rise from their graves to take revenge on any man they find in the woods, dancing him to death until dawn. Their queen, Myrtha, is cold and implacable, and she inducts the newly dead Giselle into their ranks." },
      { type: "p", text: "Both Hilarion and the grieving Albrecht come to the grave. Hilarion is caught and destroyed. But when the Wilis turn on Albrecht, Giselle protects him, dancing beside him to keep him alive until the first light of morning breaks the spirits’ power. Her love, transformed by death into mercy, is what saves him. As the sun rises, she returns to her grave, and he is left alone with the dawn." },
      { type: "quote", text: "The genius of Giselle is that its supernatural second act is not an escape from grief but its completion — forgiveness is what the living rarely manage and the dead, here, achieve." },
      { type: "h2", text: "Adam’s score and the Romantic blueprint" },
      { type: "p", text: "Adolphe Adam composed the music in a matter of weeks, and it proved revolutionary for its time. Rather than stringing together generic dance numbers, Adam used recurring melodic motifs — small musical signatures attached to characters and emotions — so that the orchestra carries memory and foreboding across the two acts. The tune associated with Giselle’s love returns in the second act like a ghost of its own, deepening the sense that the past haunts the present." },
      { type: "p", text: "The libretto drew on a poem by Heinrich Heine about the Wilis and on the writings of Théophile Gautier, the critic and poet who championed the project. Together they captured the Romantic obsessions of the 1840s: the pure-hearted woman, nature charged with the supernatural, and the gulf between social classes that love cannot bridge." },
      { type: "p", text: "What to watch for when you see it performed:" },
      { type: "list", items: [
        "The mad scene closing Act I — how the ballerina lets her dancing fracture without losing musicality.",
        "The contrast between the two acts: earthbound, full-bodied village dancing versus the weightless, drifting style of the Wilis.",
        "Myrtha’s entrance and her cold authority, a role almost as coveted as Giselle herself.",
        "Albrecht’s exhausting solo as the Wilis try to dance him to death — endurance disguised as grace.",
        "The recurring love theme in Adam’s score, and where it returns in Act II."
      ] },
      { type: "p", text: "More than 180 years after its premiere, Giselle endures because it asks one quietly devastating question and answers it with movement alone: what do we owe the people who have hurt us? It is a touchstone of Romantic ballet not merely for its technical demands, but because it remains, act for act, a perfect machine for turning sorrow into beauty." }
    ],
    relatedCompanySlugs: ["paris-opera-ballet", "american-ballet-theatre"],
    seo: { description: "Giselle explained: the story, the two acts, the Wilis and Adolphe Adam’s score — why this Romantic ballet remains a touchstone of the repertoire.", keywords: ["giselle ballet explained", "giselle story", "the wilis", "giselle ballet synopsis", "adolphe adam giselle", "romantic ballet giselle", "giselle two acts", "giselle mad scene", "myrtha queen of the wilis"] },
    cta: { kind: "newsletter" }
  },
  {
    slug: "inside-the-royal-ballet",
    category: "Company story",
    title: "Inside The Royal Ballet: A Balletomane’s Guide to Covent Garden",
    dek: "Britain’s flagship classical company keeps house at the Royal Opera House. Here is what gives it its style, its stature, and why an evening there is a pilgrimage.",
    readingTime: "6 min",
    heroSeed: "inside-the-royal-ballet",
    publishedLabel: "June 2026",
    body: [
      { type: "h2", text: "A company and its house" },
      { type: "p", text: "The Royal Ballet is Britain’s flagship classical company, and it lives at the Royal Opera House in Covent Garden, in the heart of theatreland London. To say the two are inseparable is barely an exaggeration: the company’s identity was shaped on this stage, and the building’s grand auditorium was built for exactly the kind of full-length, full-orchestra storytelling the company exists to give. Walking up from the piazza into the glass-roofed foyer, you feel it before the curtain even rises — this is a place that takes the art form entirely seriously." },
      { type: "p", text: "It is one of a small handful of companies that genuinely sit at the centre of world ballet, alongside the great houses of Paris, Saint Petersburg, Moscow, New York and Copenhagen. What distinguishes The Royal Ballet is not scale alone but a particular sensibility: dramatic clarity, musicality, and a deep loyalty to the danced story. The dancers are trained to act as much as to turn." },
      { type: "h2", text: "The style: English lyricism and dramatic truth" },
      { type: "p", text: "There is a recognisable house manner, often called the English style — refined, lyrical, attentive to the upper body and to phrasing, and allergic to empty display. Steps are there to mean something. A balletomane returning after years away will still sense it: the way an arm completes a phrase, the way a corps breathes together, the unhurried trust that the choreography will carry the drama without being shouted." },
      { type: "p", text: "That character was forged through the company’s founding generation and the choreographers most associated with it, whose narrative ballets remain central to what the company does best. The result is a repertoire that leans into heritage works and full-length classics while still commissioning new pieces — a living tradition rather than a museum." },
      { type: "p", text: "Expect, across a typical season, a balance of three broad strands:" },
      { type: "list", items: ["The great nineteenth-century classics — the kind of full-length story ballets that fill the house and the orchestra pit", "Heritage works by the choreographers who defined the company’s style, danced in the manner they were made for", "New commissions and mixed bills, where the company tests itself against contemporary voices"] },
      { type: "quote", text: "You do not merely watch The Royal Ballet; you are let in on a hundred years of how this country believes a story should be danced." },
      { type: "h2", text: "What an evening is actually like" },
      { type: "p", text: "An evening at Covent Garden has a rhythm of its own. Arrive early enough to climb the staircases, take a glass to the amphitheatre bar, and look out over the rooftops before settling in. The auditorium is opulent but intimate for its size, horseshoe-shaped so that even the upper levels feel connected to the stage. A live orchestra under the boards is part of the contract here — the sound rises into the room rather than arriving from a speaker." },
      { type: "p", text: "Seating runs from the grand tier and stalls circle down to the amphitheatre high above, and the view changes the experience more than newcomers expect. Lower and central gives you faces and detail; higher up gives you the geometry of the corps de ballet, the patterns that only read from above. Neither is wrong. Many devoted regulars happily sit high precisely to watch the architecture of the dancing." },
      { type: "h2", text: "Why it is a pilgrimage" },
      { type: "p", text: "For balletomanes, a trip to The Royal Ballet is a pilgrimage in the truest sense — a journey to a source. This is one of the rooms where the international language of classical ballet is spoken at its most fluent, performed by a company that helped write that language in English. Pairing a performance with a few days in London — the galleries, the river, the city’s own theatrical hum — turns a single evening into a proper occasion." },
      { type: "p", text: "If you are planning the journey, build the trip around the night at the opera house, not the other way round. Choose your programme first, stay within walking distance of Covent Garden so the evening can unfold slowly, and leave time the next morning to let it settle. The performance is the centre of gravity; everything else is the orbit around it." }
    ],
    relatedCompanySlugs: ["royal-ballet", "royal-opera"],
    seo: { description: "A guide to The Royal Ballet at the Royal Opera House, Covent Garden: its English style, classical repertoire, and why seeing it is a balletomane’s pilgrimage.", keywords: ["royal ballet guide", "royal opera house ballet", "seeing the royal ballet", "covent garden ballet", "english style ballet", "royal ballet covent garden", "ballet in london guide", "royal ballet for visitors"] },
    cta: { kind: "trip", city: "London" }
  },
  {
    slug: "first-night-at-the-ballet",
    category: "Travel guide",
    title: "Your First Night at the Ballet: What to Expect",
    dek: "A newcomer’s guide to the evening — when to applaud, what to wear, how the curtain falls, and how to let the art simply wash over you.",
    readingTime: "5 min",
    heroSeed: "first-night-at-the-ballet",
    publishedLabel: "June 2026",
    body: [
      { type: "p", text: "There is a particular hush that settles over a great opera house in the minutes before the curtain rises — the rustle of programmes, the warm-up notes drifting from the pit, the slow dimming of the chandeliers. If this will be your first evening at the ballet, that hush can feel like a door you are not quite sure you are allowed to walk through. You are. The ballet belongs to anyone willing to sit still and be moved, and the so-called rules are far gentler than their reputation suggests." },
      { type: "p", text: "What follows is not a list of commandments but a quiet map of the evening — how it unfolds, where the small courtesies lie, and how to spend your attention so that the art reaches you rather than passing you by. Read it once, then forget most of it. The only thing that truly matters is that you arrive, sit down, and let the dancing happen." },
      { type: "h2", text: "How the evening unfolds" },
      { type: "p", text: "Most full-length ballets run between two and three hours, divided into two or three acts with an interval of fifteen or twenty minutes between them. Arrive early — half an hour is generous and unhurried. Latecomers are usually held at the back until a suitable pause, so giving yourself time to find your seat, glance at the synopsis, and let your eyes adjust is the single kindest thing you can do for your own enjoyment." },
      { type: "p", text: "When the house lights fade and the conductor takes the podium, the audience applauds — a welcome, not yet a verdict. The overture begins, the curtain lifts, and the evening is underway. At the interval the house lights return; this is the moment to stretch, find a glass of something, and let the first act settle before the second begins." },
      { type: "h2", text: "When to applaud, and the small courtesies" },
      { type: "p", text: "The question every newcomer worries about is when to clap. The honest answer is that you will feel it. Ballet audiences applaud generously and at natural seams in the performance, and you can simply follow the room. As a gentle guide:" },
      { type: "list", items: ["After a dazzling solo or a virtuosic sequence — a burst of applause mid-act is welcomed, even expected.", "At the end of a grand pas de deux, when the dancers hold their final pose.", "As the curtain falls on each act, and most warmly of all during the curtain calls at the end.", "Calls of “bravo” for a man, “brava” for a woman, “bravi” for the ensemble — though a simple, heartfelt clap never goes wrong."] },
      { type: "p", text: "The other courtesies are mostly common sense worn lightly: silence your phone and keep it dark, save conversation for the interval, and resist photography during the performance. None of this is about stiffness. It is simply that the dancers, and the people around you, have come for the same fragile, live thing — and a darkened, attentive house is what lets it bloom." },
      { type: "quote", text: "The etiquette of the ballet is really just a single idea wearing formal clothes: protect the silence so the dancing can fill it." },
      { type: "h2", text: "What to wear, and where to sit" },
      { type: "p", text: "Dress is far freer than the old image of the opera house implies. There is no enforced code at most houses; the spirit is simply to mark the occasion. Smart-casual is always safe — a jacket, a good dress, well-chosen shoes. If a gala or an opening night tempts you toward something more formal, by all means rise to it, but no one will turn you away for wearing tailored trousers and an open collar. Dress for your own sense of the evening, and you will feel right." },
      { type: "p", text: "Your seat shapes the experience more than people expect. The grand tier and the front of the balcony offer the view choreographers design for — from there you read the patterns the whole corps makes across the stage, which is much of the ballet’s geometric beauty. The stalls bring you close to the dancers’ faces, their breath and effort and artistry, at the cost of seeing the full formations. Neither is wrong; choose according to whether you want intimacy or the grand design. A central seat a little way back is, for a first night, hard to beat." },
      { type: "h2", text: "Letting the art wash over you" },
      { type: "p", text: "Here is the most important guidance of all: you do not need to understand ballet to be moved by it. You will not catch every step’s name, and you do not have to. Glance at the synopsis beforehand so the story’s shape is familiar, then put the programme down and watch. Let the music carry you, let your eye rest where it wants, and trust that meaning arrives through feeling long before it arrives through knowledge." },
      { type: "p", text: "Some passages will hold you completely; others may drift past, and that is part of learning the form. The dancers have trained their whole lives for the few hours you are watching, and the simplest way to honour that — and to enjoy yourself — is to stay open. Arrive unhurried, sit comfortably, and let the first night be exactly what every first night should be: a beginning." }
    ],
    relatedCompanySlugs: ["royal-ballet", "paris-opera-ballet"],
    seo: { description: "A welcoming first-timer’s guide to a night at the ballet — etiquette, when to applaud, what to wear, choosing a seat, and how to enjoy the evening.", keywords: ["first time at the ballet", "ballet etiquette", "what to wear to the ballet", "when to applaud at the ballet", "first night at the ballet", "ballet for beginners", "how to choose ballet seats", "ballet interval", "what to expect at the ballet"] },
    cta: { kind: "newsletter" }
  },
]

export function getArticle(slug: string): JournalArticle | undefined {
  return journal.find((a) => a.slug === slug)
}
