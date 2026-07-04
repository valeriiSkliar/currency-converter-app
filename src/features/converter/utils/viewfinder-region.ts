export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Size = {
  width: number;
  height: number;
};

export type OcrTextBlock = {
  text: string;
  bounding: { left: number; top: number; width: number; height: number };
};

// Mirrors the on-screen percentages used by <ViewfinderOverlay /> in price-scanner.tsx
// (top-[42%], bottom-[50%], left/right-[20%]). Keep these in sync if that overlay changes.
export const VIEWFINDER_BOUNDS = {
  top: 0.42,
  bottom: 0.50,
  left: 0.20,
  right: 0.20,
};

/**
 * Some camera/OCR pipelines report the photo's pixel size in the sensor's native (landscape)
 * orientation even though the analyzed image — and the OCR block coordinates that come back
 * with it — are effectively rotated to match how the device was held. When the photo's
 * landscape/portrait shape disagrees with the view's, swap width/height so both are compared
 * on the same orientation before any cropping math runs.
 */
export function normalizePhotoSize(photo: Size, view: Size): Size {
  const photoIsLandscape = photo.width > photo.height;
  const viewIsLandscape = view.width > view.height;

  if (photoIsLandscape !== viewIsLandscape) {
    return { width: photo.height, height: photo.width };
  }
  return photo;
}

/**
 * The camera preview fills its view using "cover" behavior: the photo is centered and the
 * longer dimension is cropped so the shorter one fills the view exactly. Returns the portion
 * of the photo (in [0,1] proportions of the full photo, post orientation-normalization) that
 * is actually visible on screen.
 */
export function computeVisibleCropRect(photo: Size, view: Size): Rect {
  const { width: photoWidth, height: photoHeight } = normalizePhotoSize(photo, view);
  const photoAspect = photoWidth / photoHeight;
  const viewAspect = view.width / view.height;

  if (photoAspect > viewAspect) {
    const visibleWidthInPhoto = photoHeight * viewAspect;
    const width = visibleWidthInPhoto / photoWidth;
    return { x: (1 - width) / 2, y: 0, width, height: 1 };
  }

  const visibleHeightInPhoto = photoWidth / viewAspect;
  const height = visibleHeightInPhoto / photoHeight;
  return { x: 0, y: (1 - height) / 2, width: 1, height };
}

/**
 * Maps the viewfinder overlay's on-screen bounds (proportions of the visible preview) into
 * proportions of the full captured photo, accounting for the "cover" crop between them.
 */
export function computeViewfinderRectInPhoto(
  photo: Size,
  view: Size,
  bounds: typeof VIEWFINDER_BOUNDS,
): Rect {
  const visible = computeVisibleCropRect(photo, view);
  const vfWidth = 1 - bounds.left - bounds.right;
  const vfHeight = 1 - bounds.top - bounds.bottom;

  return {
    x: visible.x + bounds.left * visible.width,
    y: visible.y + bounds.top * visible.height,
    width: vfWidth * visible.width,
    height: vfHeight * visible.height,
  };
}

/**
 * Keeps only the OCR text blocks whose center falls inside the viewfinder rectangle, so a
 * price visible elsewhere in the camera frame (outside the on-screen aiming box) is ignored.
 */
export function filterBlocksInViewfinder<T extends OcrTextBlock>(
  blocks: T[],
  photo: Size,
  view: Size,
): T[] {
  const rect = computeViewfinderRectInPhoto(photo, view, VIEWFINDER_BOUNDS);
  const normalized = normalizePhotoSize(photo, view);
  const pxRect = {
    x: rect.x * normalized.width,
    y: rect.y * normalized.height,
    width: rect.width * normalized.width,
    height: rect.height * normalized.height,
  };

  return blocks.filter((block) => {
    const centerX = block.bounding.left + block.bounding.width / 2;
    const centerY = block.bounding.top + block.bounding.height / 2;
    return (
      centerX >= pxRect.x
      && centerX <= pxRect.x + pxRect.width
      && centerY >= pxRect.y
      && centerY <= pxRect.y + pxRect.height
    );
  });
}
