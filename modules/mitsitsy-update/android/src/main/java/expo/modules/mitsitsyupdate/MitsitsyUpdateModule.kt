package expo.modules.mitsitsyupdate

import android.app.Activity
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val REQUEST_CODE = 0x4D55 // "MU"

/**
 * Google Play In-App Updates, FLEXIBLE flow only (download in the background,
 * then completeUpdate() restarts the app). The immediate/blocking flow is
 * never used. Play only answers for apps installed from Google Play.
 */
class MitsitsyUpdateModule : Module() {
  private var manager: AppUpdateManager? = null
  private var listening = false

  private val listener = InstallStateUpdatedListener { state ->
    sendEvent(
      "onState",
      mapOf(
        "status" to statusName(state.installStatus()),
        "bytes" to state.bytesDownloaded(),
        "total" to state.totalBytesToDownload()
      )
    )
  }

  private fun mgr(): AppUpdateManager {
    manager?.let { return it }
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    return AppUpdateManagerFactory.create(context).also { manager = it }
  }

  private fun statusName(status: Int): String = when (status) {
    InstallStatus.PENDING -> "pending"
    InstallStatus.DOWNLOADING -> "downloading"
    InstallStatus.DOWNLOADED -> "downloaded"
    InstallStatus.INSTALLING -> "installing"
    InstallStatus.INSTALLED -> "installed"
    InstallStatus.FAILED -> "failed"
    InstallStatus.CANCELED -> "canceled"
    else -> "unknown"
  }

  override fun definition() = ModuleDefinition {
    Name("MitsitsyUpdate")

    Events("onState", "onFlowResult")

    AsyncFunction("checkUpdate") { promise: Promise ->
      mgr().appUpdateInfo
        .addOnSuccessListener { info ->
          promise.resolve(
            mapOf(
              "available" to (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE),
              "versionCode" to info.availableVersionCode(),
              "stalenessDays" to info.clientVersionStalenessDays(),
              "flexibleAllowed" to info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE),
              "downloaded" to (info.installStatus() == InstallStatus.DOWNLOADED)
            )
          )
        }
        .addOnFailureListener { e -> promise.reject(CodedException("ERR_UPDATE_CHECK", e.message, e)) }
    }

    AsyncFunction("startFlexibleUpdate") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject(CodedException("ERR_NO_ACTIVITY", "No current activity", null))
        return@AsyncFunction
      }
      val m = mgr()
      m.appUpdateInfo
        .addOnSuccessListener { info ->
          val ok = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE &&
            info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
          if (!ok) {
            promise.resolve(false)
            return@addOnSuccessListener
          }
          if (!listening) {
            m.registerListener(listener)
            listening = true
          }
          val started = m.startUpdateFlowForResult(
            info, activity, AppUpdateOptions.defaultOptions(AppUpdateType.FLEXIBLE), REQUEST_CODE
          )
          promise.resolve(started)
        }
        .addOnFailureListener { e -> promise.reject(CodedException("ERR_UPDATE_START", e.message, e)) }
    }

    AsyncFunction("completeUpdate") {
      mgr().completeUpdate()
      null
    }

    // Play's own consent dialog: accepted (download starts) or declined.
    OnActivityResult { _, payload ->
      if (payload.requestCode == REQUEST_CODE) {
        sendEvent("onFlowResult", mapOf("accepted" to (payload.resultCode == Activity.RESULT_OK)))
      }
    }

    OnDestroy {
      if (listening) manager?.unregisterListener(listener)
      listening = false
    }
  }
}
