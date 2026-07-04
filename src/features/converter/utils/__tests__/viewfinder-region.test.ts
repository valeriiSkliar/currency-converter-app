import {
  computeViewfinderRectInPhoto,
  computeVisibleCropRect,
  filterBlocksInViewfinder,
  normalizePhotoSize,
  VIEWFINDER_BOUNDS,
} from "../viewfinder-region";

describe("normalizePhotoSize", () => {
  it("returns the photo unchanged when its orientation already matches the view", () => {
    expect(normalizePhotoSize({ width: 1080, height: 1920 }, { width: 400, height: 800 })).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it("swaps width/height when the photo is reported landscape but the view is portrait", () => {
    // Matches real on-device data: takePictureAsync() reported 4080x3060 (sensor/landscape)
    // for a photo taken in portrait, where the view (and the OCR block coordinates) are portrait.
    expect(normalizePhotoSize({ width: 4080, height: 3060 }, { width: 411, height: 891 })).toEqual({
      width: 3060,
      height: 4080,
    });
  });

  it("swaps width/height when the photo is reported portrait but the view is landscape", () => {
    expect(normalizePhotoSize({ width: 3060, height: 4080 }, { width: 891, height: 411 })).toEqual({
      width: 4080,
      height: 3060,
    });
  });
});

describe("computeVisibleCropRect", () => {
  it("returns the full rect when photo and view share the same aspect ratio", () => {
    expect(computeVisibleCropRect({ width: 1000, height: 2000 }, { width: 500, height: 1000 })).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });

  it("crops left/right when the photo is relatively wider than the view (same orientation)", () => {
    // Both landscape: photo is 4:3 (aspect 1.333), view is 4:3.33 (aspect 1.2) -> narrower view
    const rect = computeVisibleCropRect({ width: 4000, height: 3000 }, { width: 1440, height: 1200 });
    expect(rect.y).toBe(0);
    expect(rect.height).toBe(1);
    expect(rect.width).toBeCloseTo(0.9, 5);
    expect(rect.x).toBeCloseTo(0.05, 5);
  });

  it("crops top/bottom when the photo is relatively taller/narrower than the view (same orientation)", () => {
    // photo is portrait and taller than the view's aspect ratio
    const rect = computeVisibleCropRect({ width: 1000, height: 3000 }, { width: 1000, height: 1500 });
    expect(rect.x).toBe(0);
    expect(rect.width).toBe(1);
    expect(rect.height).toBeCloseTo(0.5, 5);
    expect(rect.y).toBeCloseTo((1 - rect.height) / 2, 5);
  });

  it("treats a landscape-reported photo the same as its already-rotated equivalent, given a portrait view", () => {
    const rawPhoto = { width: 4080, height: 3060 };
    const rotatedPhoto = { width: 3060, height: 4080 };
    const view = { width: 411, height: 891 };
    expect(computeVisibleCropRect(rawPhoto, view)).toEqual(computeVisibleCropRect(rotatedPhoto, view));
  });
});

describe("computeViewfinderRectInPhoto", () => {
  it("maps the on-screen viewfinder bounds into photo pixel space, no crop case", () => {
    // 1:1 photo and view, so the visible crop rect is the full photo
    const rect = computeViewfinderRectInPhoto({ width: 1000, height: 1000 }, { width: 500, height: 500 }, VIEWFINDER_BOUNDS);
    expect(rect).toEqual({
      x: VIEWFINDER_BOUNDS.left,
      y: VIEWFINDER_BOUNDS.top,
      width: 1 - VIEWFINDER_BOUNDS.left - VIEWFINDER_BOUNDS.right,
      height: 1 - VIEWFINDER_BOUNDS.top - VIEWFINDER_BOUNDS.bottom,
    });
  });

  it("composes the visible crop with the viewfinder bounds when the photo is wider than the view", () => {
    const photo = { width: 4000, height: 3000 };
    const view = { width: 1440, height: 1200 };
    const bounds = { top: 0.3, bottom: 0.4, left: 0.12, right: 0.12 };
    const rect = computeViewfinderRectInPhoto(photo, view, bounds);
    const visible = computeVisibleCropRect(photo, view);
    expect(rect.x).toBeCloseTo(visible.x + 0.12 * visible.width, 5);
    expect(rect.width).toBeCloseTo(0.76 * visible.width, 5);
    expect(rect.y).toBeCloseTo(0.3, 5);
    expect(rect.height).toBeCloseTo(0.3, 5);
  });
});

describe("filterBlocksInViewfinder", () => {
  const photo = { width: 1000, height: 1000 };
  const view = { width: 1000, height: 1000 };

  it("keeps a block whose center falls inside the viewfinder rectangle", () => {
    const blocks = [
      { text: "42.00", bounding: { left: 450, top: 450, width: 100, height: 60 } },
    ];
    expect(filterBlocksInViewfinder(blocks, photo, view)).toEqual(blocks);
  });

  it("drops a block whose center falls outside the viewfinder rectangle (e.g. above it)", () => {
    const blocks = [
      { text: "21.00", bounding: { left: 450, top: 10, width: 100, height: 60 } },
    ];
    expect(filterBlocksInViewfinder(blocks, photo, view)).toEqual([]);
  });

  it("keeps only the in-region block out of a mix", () => {
    const inside = { text: "42.00", bounding: { left: 450, top: 450, width: 100, height: 60 } };
    const outside = { text: "21.00", bounding: { left: 450, top: 10, width: 100, height: 60 } };
    expect(filterBlocksInViewfinder([outside, inside], photo, view)).toEqual([inside]);
  });

  it("filters correctly when the photo orientation needs normalizing against the view", () => {
    // Photo reported landscape (4080x3060) for a portrait view/capture, mirroring real device data.
    // In the normalized (3060x4080) space the viewfinder band sits roughly y:[1713,2040], x:[612,2448].
    const rawPhoto = { width: 4080, height: 3060 };
    const view = { width: 411, height: 891 };
    const inside = { text: "42.00", bounding: { left: 1500, top: 1850, width: 100, height: 60 } };
    const outside = { text: "999.00", bounding: { left: 1500, top: 50, width: 100, height: 60 } };
    expect(filterBlocksInViewfinder([outside, inside], rawPhoto, view)).toEqual([inside]);
  });
});
