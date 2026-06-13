package com.lyan.stickmurai.ui.main

import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewAssetLoader.AssetsPathHandler

@Composable
fun MainScreen(
  modifier: Modifier = Modifier,
) {
  var webView by remember { mutableStateOf<WebView?>(null) }

  BackHandler(enabled = webView?.canGoBack() == true) {
    webView?.goBack()
  }

  AndroidView(
    factory = { context ->
      val assetLoader = WebViewAssetLoader.Builder()
        .addPathHandler("/assets/", AssetsPathHandler(context))
        .build()

      WebView(context).apply {
        webViewClient = object : WebViewClient() {
          override fun shouldInterceptRequest(
            view: WebView,
            request: WebResourceRequest
          ): WebResourceResponse? {
            return assetLoader.shouldInterceptRequest(request.url)
          }
        }
        
        settings.apply {
          javaScriptEnabled = true
          domStorageEnabled = true
          allowFileAccess = true
          allowContentAccess = true
          databaseEnabled = true
          mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
          allowFileAccessFromFileURLs = true
          allowUniversalAccessFromFileURLs = true
          useWideViewPort = true
          loadWithOverviewMode = true
        }
        loadUrl("https://appassets.androidplatform.net/assets/index.html")
        webView = this
      }
    },
    modifier = modifier.fillMaxSize()
  )
}
