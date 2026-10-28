package expo.modules.mitsitsyocr

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import java.io.File

/**
 * Images shared to the app (ACTION_SEND / ACTION_SEND_MULTIPLE, image MIME types).
 * The launch intent is read once from the activity; later shares arrive via
 * onNewIntent. Files are copied to the cache right away because the read
 * grant on the sender's content:// URIs does not outlive the activity.
 */
internal object SharedImages {
  var pending: Intent? = null
  private var launchIntentHandled = false

  fun isImageShare(intent: Intent?): Boolean =
    intent != null &&
      (intent.action == Intent.ACTION_SEND || intent.action == Intent.ACTION_SEND_MULTIPLE) &&
      intent.type?.startsWith("image/") == true

  fun consume(context: Context, activity: Activity?): List<String> {
    var intent = pending
    pending = null
    if (intent == null && !launchIntentHandled) {
      launchIntentHandled = true
      val launch = activity?.intent
      // Relaunch from Recents re-delivers the original share: ignore it.
      val fromHistory = ((launch?.flags ?: 0) and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0
      if (isImageShare(launch) && !fromHistory) intent = launch
    }
    if (intent == null) return emptyList()
    return copyToCache(context, streamUris(intent))
  }

  private fun streamUris(intent: Intent): List<Uri> {
    @Suppress("DEPRECATION")
    return if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
      if (Build.VERSION.SDK_INT >= 33) {
        intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java) ?: emptyList()
      } else {
        intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM) ?: emptyList()
      }
    } else {
      val uri = if (Build.VERSION.SDK_INT >= 33) {
        intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
      } else {
        intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
      }
      listOfNotNull(uri)
    }
  }

  private fun copyToCache(context: Context, uris: List<Uri>): List<String> {
    val dir = File(context.cacheDir, "ocr-share")
    // Previous shares are no longer needed once a new one arrives.
    dir.deleteRecursively()
    dir.mkdirs()
    val stamp = System.currentTimeMillis()
    return uris.mapIndexedNotNull { index, uri ->
      try {
        val target = File(dir, "share-$stamp-$index.img")
        context.contentResolver.openInputStream(uri)?.use { input ->
          target.outputStream().use { output -> input.copyTo(output) }
        } ?: return@mapIndexedNotNull null
        Uri.fromFile(target).toString()
      } catch (_: Exception) {
        null
      }
    }
  }
}
