/**
 * Site-wide content and configuration.
 * Everything here is plain data - edit this file to change the site copy,
 * contact details and social links. No component changes needed.
 */

export const site = {
  name: "Michael Peacock",
  role: "Motorsport Photographer",
  /** Used in <title>, Open Graph and the JSON-LD block. */
  url: "https://michaelpeacock.photo",
  tagline: "Motorsport, at the limit.",
  description:
    "Motorsport photography by Michael Peacock - circuit racing, rally and endurance. Trackside stills, panning, pit lane and paddock portraiture.",

  /** Shown on the home hero. Keep it to two short lines. */
  heroLines: ["Speed,", "held still."],
  heroIntro:
    "Trackside photography from circuit racing, rally stages and endurance paddocks. Available for race weekends, team commissions and editorial licensing.",

  email: "michaelpeacock1993@gmail.com",
  phone: "",
  location: "United Kingdom",
  /** Leave blank to hide a link entirely. */
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
      "I photograph motorsport because it refuses to hold still. A car at racing speed gives you a fraction of a second, in poor light, behind a fence, with the shot already gone by the time you have heard it arrive. Getting it right is the whole appeal.",
      "My work covers circuit racing, rally stages and endurance events - trackside action, pit-lane detail and the quieter moments in the paddock that say as much about a race weekend as the racing does.",
      "I shoot for teams, drivers, series organisers and editorial clients. If you need coverage of a race weekend, a test day, or a specific car, get in touch.",
    ],
    /** Small facts column beside the bio. Add or remove freely. */
    facts: [
      { label: "Based in", value: "United Kingdom" },
      { label: "Shooting since", value: "2014" },
      { label: "Disciplines", value: "Circuit, rally, endurance" },
      { label: "Available for", value: "Race weekends, tests, commissions" },
    ],
    gear: [
      { label: "Bodies", value: "Canon EOS R5, Canon EOS R6 Mark II" },
      { label: "Long", value: "RF 100-500mm f/4.5-7.1L, EF 400mm f/2.8L" },
      { label: "Mid", value: "RF 70-200mm f/2.8L" },
      { label: "Wide", value: "RF 24-70mm f/2.8L, RF 16mm f/2.8" },
      { label: "Other", value: "Monopod, remote triggers, ND filters" },
    ],
  },

  services: [
    {
      title: "Race weekends",
      body: "Full coverage across practice, qualifying and race. Fast turnaround galleries delivered the same evening where the schedule allows.",
    },
    {
      title: "Team & driver commissions",
      body: "Sponsor-facing imagery, car detail sets, pit-crew work and driver portraiture built around your marketing needs.",
    },
    {
      title: "Editorial licensing",
      body: "Archive access and licensing for publications, series communications and manufacturer press use.",
    },
  ],
};

export type Site = typeof site;
