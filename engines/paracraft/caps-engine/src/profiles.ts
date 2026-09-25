/** keycap profiles — the flow 05 data table.
 *  every value keeps provenance (roadmap risk rule). two sources:
 *  - keycap_playground (riskable, 547⭐) — MIT confirmed by the owner on the
 *    keycap_playground discord, sept 9 2026 (NOT yet in-repo — until it is,
 *    we treat its code as reference-only and carry values as data).
 *    DSA numbers from its DSA_keycap module defaults: base 18.41, cap height
 *    7.39 (DSA_stem key_height), dish 0.8, spherical dish.
 *  - nur-modkeys (nuroctane) — no license on record, so same rule: data only,
 *    never code. its PROFILES table parametrizes {h, taper, dish, tilt} in
 *    scene units (1u = 19.05mm, tilt in radians) — converted here to mm/deg,
 *    viz-grade calibration, flagged per profile.
 *  height here = cap height above the stem plate, mm. */
export interface KeycapProfile {
  id: string;
  name: string;
  /** 1u cap base, mm */
  base: number;
  /** top width relative to base */
  taper: number;
  /** cap height above stem plate, mm */
  height: number;
  /** dish depth on the top, mm */
  dish: number;
  /** per-row top tilt, degrees — index 0 = row R1 (top row) through R5 */
  tilts: [number, number, number, number, number];
  source: string;
}

export const CAP_PROFILES: KeycapProfile[] = [
  {
    id: "dsa",
    name: "DSA",
    base: 18.41,
    taper: 0.76,
    height: 7.39,
    dish: 0.8,
    tilts: [0, 0, 0, 0, 0],
    source: "keycap_playground DSA_keycap module defaults (mm, measured)",
  },
  {
    id: "cherry",
    name: "Cherry",
    base: 18.0,
    taper: 0.76,
    height: 6.9,
    dish: 0.67,
    tilts: [-4.9, -2.6, 0, 2.9, 4.3],
    source: "nur-modkeys PROFILES (h .36u, dish .035u, tilt rad) — viz-grade, calibrate before production",
  },
  {
    id: "oem",
    name: "OEM",
    base: 18.0,
    taper: 0.78,
    height: 8.4,
    dish: 0.57,
    tilts: [-4.0, -2.0, 0, 2.3, 3.4],
    source: "nur-modkeys PROFILES (h .44u, dish .03u, tilt rad) — viz-grade, calibrate before production",
  },
  {
    id: "sa",
    name: "SA",
    base: 18.0,
    taper: 0.70,
    height: 9.9,
    dish: 0.95,
    tilts: [-5.7, -2.9, 0, 2.9, 5.4],
    source: "nur-modkeys PROFILES (h .52u, dish .05u, tilt rad) — viz-grade, calibrate before production",
  },
  {
    id: "xda",
    name: "XDA",
    base: 18.0,
    taper: 0.90,
    height: 5.9,
    dish: 0.29,
    tilts: [0, 0, 0, 0, 0],
    source: "nur-modkeys PROFILES (h .31u, dish .015u, uniform) — viz-grade, calibrate before production",
  },
];

/** default profile for generated boards */
export const DEFAULT_PROFILE = "dsa";
