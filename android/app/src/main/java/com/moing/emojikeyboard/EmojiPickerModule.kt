package com.moing.emojikeyboard

import android.app.Dialog
import android.graphics.Color
import android.graphics.Outline
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import androidx.emoji2.emojipicker.EmojiPickerView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// 구글 공식 Jetpack Emoji Picker
// (androidx.emoji2:emoji2-emojipicker)를 다이얼로그로 띄우는 방식으로 구현
// 선택된 이모지 하나를 Promise로 돌려주고, 아무것도 안 고르고 닫으면 null을 돌려줌
class EmojiPickerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        // 화면의 40%로 키보드 올라오게
        private const val KEYBOARD_HEIGHT_RATIO = 0.4f
    }

    override fun getName() = "EmojiKeyboard"

    @ReactMethod
    fun showEmojiPicker(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.resolve(null)
            return
        }

        activity.runOnUiThread {
            var resolved = false

            val pickerView = EmojiPickerView(activity)
            // EmojiPickerView 자체는 배경을 안 그려서(투명) - 다이얼로그 창 배경을 투명 처리하면
            // 뷰 자체엔 흰색을 직접 입혀줘야 함. 그 위에 outline으로 위쪽만 둥글게 잘라냄.
            pickerView.setBackgroundColor(Color.WHITE)
            // outline을 view 높이보다 더 크게 그려서 아래쪽은 화면 밖으로 밀려나 각지게 남고
            // 위쪽만 둥글게 남는 트릭.
            val radiusPx = 20f * activity.resources.displayMetrics.density
            pickerView.outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(view: View, outline: Outline) {
                    outline.setRoundRect(0, 0, view.width, (view.height + radiusPx).toInt(), radiusPx)
                }
            }
            pickerView.clipToOutline = true

            val dialog = Dialog(activity)
            dialog.setContentView(pickerView)
            // 기본 다이얼로그 배경(각진 흰 배경)이 그대로 남아있으면 pickerView 뒤에서 각진 테두리로 비쳐 보여서 투명 처리
            dialog.window?.setBackgroundDrawable(android.graphics.drawable.ColorDrawable(Color.TRANSPARENT))
            val heightPx = (activity.resources.displayMetrics.heightPixels * KEYBOARD_HEIGHT_RATIO).toInt()
            dialog.window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, heightPx)
            dialog.window?.setGravity(android.view.Gravity.BOTTOM)

            pickerView.setOnEmojiPickedListener { emoji ->
                resolved = true
                promise.resolve(emoji.emoji)
                dialog.dismiss()
            }
            dialog.setOnDismissListener {
                if (!resolved) promise.resolve(null)
            }

            dialog.show()
        }
    }
}
