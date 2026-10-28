package expo.modules.mitsitsyocr

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import java.io.FileInputStream
import java.io.InputStream

/** Decodes an image (file:// or content://), downsampled and upright (EXIF). */
internal object ImageLoader {
  // Screenshots (1080x2400) stay at full size; camera photos are halved.
  private const val MAX_SIDE = 3000

  fun load(context: Context, uri: Uri): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    // decodeStream returns null in bounds-only mode: only `bounds` matters here.
    val stream = open(context, uri) ?: return null
    stream.use { BitmapFactory.decodeStream(it, null, bounds) }
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

    var sample = 1
    while (maxOf(bounds.outWidth, bounds.outHeight) / sample > MAX_SIDE) sample *= 2
    val options = BitmapFactory.Options().apply {
      inSampleSize = sample
      inPreferredConfig = Bitmap.Config.ARGB_8888
    }
    val decoded = open(context, uri)?.use { BitmapFactory.decodeStream(it, null, options) } ?: return null

    val rotation = try {
      open(context, uri)?.use { ExifInterface(it).rotationDegrees } ?: 0
    } catch (_: Exception) {
      0
    }
    if (rotation == 0) return decoded
    val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
    val rotated = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
    if (rotated != decoded) decoded.recycle()
    return rotated
  }

  private fun open(context: Context, uri: Uri): InputStream? =
    if (uri.scheme == null || uri.scheme == "file") FileInputStream(uri.path)
    else context.contentResolver.openInputStream(uri)
}
