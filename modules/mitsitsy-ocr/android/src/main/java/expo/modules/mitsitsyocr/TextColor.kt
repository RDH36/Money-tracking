package expo.modules.mitsitsyocr

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Rect
import kotlin.math.abs

/**
 * Dominant colour of the glyphs inside a text line box. The background is the
 * most frequent luminance bucket; glyph pixels are the ones furthest from it
 * (works for dark text on light background and the reverse).
 */
internal object TextColor {
  private const val MIN_CONTRAST = 40

  fun sample(bitmap: Bitmap, box: Rect): String? {
    val left = box.left.coerceIn(0, bitmap.width - 1)
    val top = box.top.coerceIn(0, bitmap.height - 1)
    val right = box.right.coerceIn(left + 1, bitmap.width)
    val bottom = box.bottom.coerceIn(top + 1, bitmap.height)
    val width = right - left
    val height = bottom - top
    if (width < 2 || height < 2) return null

    val pixels = IntArray(width * height)
    bitmap.getPixels(pixels, 0, width, left, top, width, height)

    val histogram = IntArray(16)
    for (c in pixels) histogram[luminance(c) shr 4]++
    val bgBucket = histogram.indices.maxByOrNull { histogram[it] } ?: return null
    val bgLum = bgBucket * 16 + 8

    var maxDiff = 0
    for (c in pixels) maxDiff = maxOf(maxDiff, abs(luminance(c) - bgLum))
    if (maxDiff < MIN_CONTRAST) return null

    val threshold = maxDiff * 0.6
    var r = 0L
    var g = 0L
    var b = 0L
    var n = 0L
    for (c in pixels) {
      if (abs(luminance(c) - bgLum) >= threshold) {
        r += Color.red(c); g += Color.green(c); b += Color.blue(c); n++
      }
    }
    if (n == 0L) return null
    return String.format("#%02x%02x%02x", r / n, g / n, b / n)
  }

  private fun luminance(c: Int): Int =
    (Color.red(c) * 299 + Color.green(c) * 587 + Color.blue(c) * 114) / 1000
}
