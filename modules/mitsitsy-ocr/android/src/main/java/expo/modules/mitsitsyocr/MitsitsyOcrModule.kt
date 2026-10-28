package expo.modules.mitsitsyocr

import android.content.Context
import android.net.Uri
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * On-device text recognition (ML Kit, offline) + Android share target for
 * screenshots. Lines are returned with their bounding box (image pixels) and
 * the dominant text colour, so source parsers can rely on layout and colour
 * (e.g. green credit amounts) rather than on raw text only.
 */
class MitsitsyOcrModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("MitsitsyOcr")

    Events("onShare")

    AsyncFunction("recognize") { uri: String ->
      val bitmap = ImageLoader.load(context, Uri.parse(uri))
        ?: throw CodedException("ERR_IMAGE_UNREADABLE", "Cannot decode image: $uri", null)
      val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
      try {
        // AsyncFunction bodies run on the modules background queue: blocking is fine.
        val text = Tasks.await(recognizer.process(InputImage.fromBitmap(bitmap, 0)))
        val lines = mutableListOf<Map<String, Any?>>()
        text.textBlocks.forEachIndexed { blockIndex, block ->
          for (line in block.lines) {
            val box = line.boundingBox ?: continue
            lines.add(
              mapOf(
                "text" to line.text,
                "left" to box.left,
                "top" to box.top,
                "right" to box.right,
                "bottom" to box.bottom,
                "block" to blockIndex,
                "color" to TextColor.sample(bitmap, box)
              )
            )
          }
        }
        mapOf("width" to bitmap.width, "height" to bitmap.height, "lines" to lines)
      } finally {
        recognizer.close()
        bitmap.recycle()
      }
    }

    AsyncFunction("getSharedImages") {
      SharedImages.consume(context, appContext.currentActivity)
    }

    OnNewIntent { intent ->
      if (SharedImages.isImageShare(intent)) {
        SharedImages.pending = intent
        sendEvent("onShare", mapOf<String, Any>())
      }
    }
  }
}
