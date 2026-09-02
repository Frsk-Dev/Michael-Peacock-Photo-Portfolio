/**
 * Site-wide content and configuration.
 * Everything here is plain data - edit this file to change the site copy,
 * contact details and social links. No component changes needed.
 */

export const site = {
  name: "Michael Peacock",
  role: "Motorsport Photographer",
  /** Used in <title>, Open Graph and the JSON-LD block. Set this to your real domain. */
  url: "https://michaelpeacock.photo",
  tagline: "Drifting, show cars and the people around them",
  description:
    "Motorsport and car culture photography by Michael Peacock — drift events, show cars and the details that make them. Available for events, features and licensing.",

  /** Shown on the home hero. Keep it to two short lines. */
  heroLines: ["Sideways,", "held still."],
  heroIntro:
    "Drift action, show cars and close detail work from the UK car scene. Available for events, feature shoots and editorial licensing.",

  email: "michaelpeacock1993@gmail.com",
  phone: "",
  location: "United Kingdom",
  /** Leave a value blank to hide that link entirely. */
  socials: {
    instagram: "https://instagram.com/",
    x: "",
    linkedin: "",
    flickr: "",
  },

  about: {
    heading: "Behind the lens",
    portrait: "/images/portrait.jpg",
    body: [
      "I photograph cars because they refuse to hold still. A drift car gives you a fraction of a second — sideways, half-hidden in its own tyre smoke, with the shot gone by the time you have heard it arrive. Getting it right is the whole appeal.",
      "The work splits three ways: drift action from the bale line, show cars under hall lighting, and the close detail work — a harness, a wheel, a dressed engine bay — that says as much about a build as the whole car does.",
      "I shoot for drivers, teams, event organisers and clubs. If you want your car, your build or your event covered properly, get in touch.",
    ],
    /** Small facts column beside the bio. Add or remove freely. */
    facts: [
      { label: "Based in", value: "United Kingdom" },
      { label: "Shoots", value: "Drift events, shows, feature cars" },
      { label: "Body", value: "Canon EOS R10" },
      { label: "Available for", value: "Events, features, commissions" },
    ],
    /** Pulled from the EXIF of the current gallery — update as your kit changes. */
    gear: [
      { label: "Body", value: "Canon EOS R10" },
      { label: "Standard", value: "Canon RF 24-105mm f/4L IS USM" },
      { label: "Long", value: "Canon RF 100-400mm f/5.6-8 IS USM" },
    ],
  },

  services: [
    {
      title: "Event coverage",
      body: "Drift days, shows and club meets. Full-day coverage of the action, the cars and the atmosphere, delivered as an edited gallery.",
    },
    {
      title: "Feature cars",
      body: "Your build shot properly — full-car sets plus the detail work that shows where the money and the hours actually went.",
    },
    {
      title: "Licensing",
      body: "Archive access for drivers, teams, sponsors and publications. Get in touch with the event and the car you are after.",
    },
  ],
};

export type Site = typeof site;
