// Hozzárendelés: gyakorlat-id → free-exercise-db (yuhonas/free-exercise-db, MIT) ID
// A képek innen jönnek:
// https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<ID>/0.jpg és /1.jpg
//
// Néhány gyakorlatnak nincs pontos megfelelője — azoknál üresen hagytuk.
// A felhasználó a szöveges leírásból és a "Cues" pontokból tájékozódhat.

export const ANIM_MAP: Record<string, string | null> = {
  // Push
  "incline-pushup": "Incline_Push-Up",
  "knee-pushup": "Pushups",
  "pushup": "Pushups",
  "decline-pushup": "Decline_Push-Up",
  "diamond-pushup": "Close-Grip_Push-Up_off_of_a_Dumbbell",
  "pike-pushup": null,
  "couch-dip": "Bench_Dips",

  // Pull
  "couch-row": "Inverted_Row",
  "doorway-row": "Bodyweight_Mid_Row",
  "superman": "Superman",
  "ytw": null,

  // Legs
  "squat": "Bodyweight_Squat",
  "couch-squat": "Chair_Squat",
  "split-squat": "Split_Squat_with_Dumbbells",
  "lunge": "Bodyweight_Walking_Lunge",
  "glute-bridge": "Single_Leg_Glute_Bridge",
  "calf-raise": "Barbell_Seated_Calf_Raise",
  "wall-sit": null,

  // Core
  "plank": "Plank",
  "side-plank": "Push_Up_to_Side_Plank",
  "deadbug": "Dead_Bug",
  "leg-raise": "Flat_Bench_Lying_Leg_Raise",
  "hollow-hold": null,
  "mountain-climber": "Mountain_Climbers",
  "bicycle": "Air_Bike",

  // Cardio
  "jumping-jack": null,
  "high-knee": null,
  "butt-kick": "Single_Leg_Butt_Kick",
  "shadow-box": null,
  "squat-jump": "Freehand_Jump_Squat",
  "burpee": null,

  // Mobility
  "cat-cow": "Cat_Stretch",
  "world-greatest": "Worlds_Greatest_Stretch",
  "hip-flexor-stretch": "Standing_Hip_Flexors",
  "thoracic-rotation": null,
  "walk": null,
};

export function getAnimId(exerciseId: string): string | undefined {
  const v = ANIM_MAP[exerciseId];
  return v ?? undefined;
}
